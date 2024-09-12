const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

function getDirectoryContent(dirPath) {
	try {
		const items = fs.readdirSync(dirPath).map(item => {
			const itemPath = path.join(dirPath, item);
			const stats = fs.statSync(itemPath);
			return {
				path: itemPath,
				name: item,
				size: stats.isDirectory() ? getDirectorySize(itemPath) : stats.size,
				type: stats.isDirectory() ? 'directory' : 'file'
			};
		});

		return items;
	} catch (error) {
		console.error(`Error reading directory ${dirPath}:`, error);
		return null;
	}
}

function getDirectorySize(dirPath) {
	let totalSize = 0;
	const items = fs.readdirSync(dirPath);
	for (let item of items) {
		const itemPath = path.join(dirPath, item);
		const stats = fs.statSync(itemPath);
		if (stats.isDirectory()) {
			totalSize += getDirectorySize(itemPath);
		} else {
			totalSize += stats.size;
		}
	}
	return totalSize;
}

function convertBytesToMB(bytes) {
	return (bytes / (1024 * 1024)).toFixed(2);
}

function renderDirectoryContent(items, currentPath) {
	const directories = items.filter(item => item.type === 'directory');
	const files = items.filter(item => item.type === 'file');

	directories.sort((a, b) => b.size - a.size);
	files.sort((a, b) => b.size - a.size);

	const directoriesHtml = directories.map(dir => {
		const relativePath = path.relative(__dirname, dir.path).replace(/\\/g, '/');
		return `
      <tr>
        <td><a href="/browse/${encodeURIComponent(relativePath)}"><strong>${dir.name}</strong></a></td>
        <td>${convertBytesToMB(dir.size)} MB</td>
      </tr>`;
	}).join('');

	const filesHtml = files.map(file => `
    <tr>
      <td>${file.name}</td>
      <td>${convertBytesToMB(file.size)} MB</td>
    </tr>`).join('');

	return directoriesHtml + filesHtml;
}

app.get('/', (req, res) => {
	const directoryPath = path.join(__dirname, 'input');

	if (!fs.existsSync(directoryPath)) {
		res.status(404).send('Directory not found');
		return;
	}

	const items = getDirectoryContent(directoryPath);
	const tableContent = renderDirectoryContent(items, directoryPath);

	const html = `
    <html>
      <head>
        <title>Directory Tree</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Directory Tree</h1>
        <table>
          <tr>
            <th>Path</th>
            <th>Size (MB)</th>
          </tr>
          ${tableContent}
        </table>
      </body>
    </html>`;

	res.send(html);
});

app.get('/browse/*', (req, res) => {
	const startTime = Date.now();
	const directoryPath = path.join(__dirname, req.params[0]);

	if (!fs.existsSync(directoryPath)) {
		res.status(404).send('Directory not found');
		return;
	}

	const items = getDirectoryContent(directoryPath);
	const tableContent = renderDirectoryContent(items, directoryPath);

	const parentPath = path.join('/browse', path.relative(__dirname, path.dirname(directoryPath)).replace(/\\/g, '/'));
	const backLink = path.relative(__dirname, directoryPath) !== 'input' ? `<a href="${parentPath}">Back</a>` : `<a href="/">Back</a>`;

	const endTime = Date.now();

	const html = `
    <html>
      <head>
        <title>Directory Tree - ${directoryPath}</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Directory Tree - ${directoryPath} (Time taken: ${endTime - startTime}ms)</h1>
				<div>
          ${backLink}
        </div>
        <table>
          <tr>
            <th>Path</th>
            <th>Size (MB)</th>
          </tr>
          ${tableContent}
        </table>
        <div>
          ${backLink}
        </div>
      </body>
    </html>`;

	res.send(html);
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
