function IsProfilePage() { return document.querySelector('.k-profile') !== null; }
function IsTopicPage() { return document.querySelector('.kmsg-id-right') !== null; }
function IsIndex() { return document.querySelector('.kfrontstats') !== null; }
function IsTopicList() { return document.querySelector('#kflattable') !== null || document.querySelector('.kflat') !== null; }

console.log('IsProfilePage', IsProfilePage());
console.log('IsTopicPage', IsTopicPage());
console.log('IsIndex', IsIndex());
console.log('IsTopicList', IsTopicList());

function ReplaceStyle(oldStyle, newStyle) { document.querySelectorAll(`[style="${oldStyle}"]`).forEach(e => e.style.cssText = newStyle); }

function AddStyle(content) {
	var style = document.createElement('style');
	style.textContent = content;
	document.body.appendChild(style);
}

function AppendStyleToClass(className, content, whereTag) {
	if (className.includes(',')) {
		className.split(',').forEach(c => AppendStyleToClass(c.trim(), content, whereTag));
		return;
	}

	var elements
	if (className.includes('>')) elements = document.querySelectorAll(className)
	else elements = document.getElementsByClassName(className);

	for (var i = 0; i < elements.length; i++) {
		if (whereTag && elements[i].tagName.toLowerCase() !== whereTag) continue;
		elements[i].style.cssText += content;
	}
}

function ReplaceImage(oldSrc, newSrc, forceWidth = null, forceHeight = null) {
	document.querySelectorAll(`img[src="${oldSrc}"]`).forEach(e => {
		e.src = newSrc;
		if (forceWidth) e.width = forceWidth;
		if (forceHeight) e.height = forceHeight;
	});
}

function LoadStyle(FILE_URL) {
	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = FILE_URL;
	document.head.appendChild(link);
}

function FixForcedColors(selector) {
	for (let sheet of document.styleSheets) {
		let rules = sheet.cssRules || sheet.rules;
		for (let rule of rules) {
			if (rule.selectorText === selector) {
				rule.style.setProperty("color", "#fff", "");
				rule.style.setProperty("background", "", "");
				return;
			}
		}
	}
}

AddStyle(`

	ul.menu > li > a {
		background-image: unset!important;
		background-color: #2d374b !important;
	}

	ul.menu > li.active > a {
		background-image: unset!important;
		background-color: #394663 !important;
	}

	.rt-main-wrapper, #rt-mainbody-surround {
		background: #14161c;
	}

	.kblock {
		background: transparent!important;
	}

	.kcontainer {
		border: 1px solid rgba(255, 255, 255, .4);
		color: white;
	}

	.kbody {
		border: unset;
		border-color: unset!important;
	}

	.ktopic-badge {
    background: rgba(255, 255, 255, .2);
    color: white;
    padding: 4px 4px;
    border-radius: 3px;
    margin-right: 10px;
    border: 1px solid #2d374b;
    vertical-align: middle;
    background: rgb(69 255 118 / 38%) !important;
    font-size: 8px !important;
	}

	.kspoiler-wrapper {
		background-color: #2d374b!important;
		border: 1px solid rgba(255, 255, 255, .4);
		border-radius: 4px;
		border-left: 5px solid rgba(255, 255, 255, .4);
		border-right: 5px solid rgba(255, 255, 255, .4);
		border-top: 1px solid rgba(255, 255, 255, .4);
	}

	#Kunena div.kmsgtext code, #Kunena div.kmsgtext pre {
		background: rgba(0, 0, 0, .5);
		border-radius: 4px;
		padding: 5px;
		color: white;
	}

	.kmsgtext-quote {
		background: #2d374b!important;
		border: 1px solid rgba(255, 255, 255, .4);
		border-radius: 4px;
	}

	#kprofilebox > .kbody {
		background: rgba(0, 0, 0, .6);
		border: 1px solid rgba(255, 255, 255, .4);
		color: white;
		border-radius: 4px;
	}

	#Kunena .klist-times-all, #Kunena .klist-pages-all, #Kunena .klist-times {
		line-height: unset!important;
	}

	#kprofilebox td {
		background-color: #2d374b;
	}

	#Kunena .klist-actions, #Kunena .klist-actions-bottom, #kprofilebox .krow1, #kprofilebox td, .kforum-pathway, .klist-bottom, .kanndesc {
		background: #2d374b !important;
		border: 1px solid rgba(0, 0, 0, .5);
		border-radius: 4px;
	}

	#Kunena .klist-bottom {
		padding-bottom: 5px!important;
		border: 1px solid rgba(0, 0, 0, .5);
		margin-top: 5px;
		margin-bottom: 10px;
	}

	#Kunena div.kblock {
		border-bottom: unset!important;
	}

	#Kunena .kforum-pathway, #Kunena dl.tabs dt {
		border-left: 2px solid rgba(0, 0, 0, .5);
		border-right: 2px solid rgba(0, 0, 0, .5);
	}

	.kbody, .ksectionbody {
		background: rgba(255, 255, 255, .01) !important;
		border: 1px solid rgba(0, 0, 0, .5);
		border-width: 0px!important;
		margin-bottom: 5px;
	}

	.kpbox {
		border-top: unset!important;
		border-bottom: unset!important;
	}

	input[type="submit"], input[type="button"], input[type="reset"], button, .kheadbtn a {
		padding: 2px 8px!important;
    color: white!important;
    background: rgb(69 255 118 / 38%)!important;
    border: 1px solid rgba(0, 0, 0, .3)!important;
    border-radius: 2px!important;
	}

	input[type="submit"]:hover, input[type="button"]:hover, input[type="reset"]:hover, button:hover, .kheadbtn a:hover {
		background: rgb(69 255 118 / 68%)!important;
	}

	input[type="text"], input[type="password"], input[type="email"], input[type="number"], input[type="search"], input[type="tel"], input[type="url"], input[type="date"], input[type="time"], input[type="datetime-local"], input[type="month"], input[type="week"], input[type="color"], input[type="range"], input[type="file"], textarea {
		padding: 2px 8px!important;
		color: white!important;
		background: rgb(113 113 113 / 38%) !important;
		border: 1px solid rgba(0, 0, 0, .3)!important;
		border-radius: 2px!important;
	}

	input[type="checkbox"], input[type="radio"] {
		min-width: 15px;
    min-height: 15px;

		background-color: rgb(255 255 255 / 38%) !important;
		border: 1px solid rgba(0, 0, 0, .3)!important;
		border-radius: 2px!important;
		appearance: none;
	}

	input[type="checkbox"]:checked, input[type="radio"]:checked {
		background-color: rgb(69 255 118 / 68%) !important;
		border: 1px solid rgba(0, 0, 0, .3)!important;
		border-radius: 2px!important;
	}

	input[type="checkbox"]:focus, input[type="radio"]:focus {
		outline: none;
	}

	select {
		padding: 2px 8px!important;
		color: white!important;
		background: rgb(113 113 113 / 38%) !important;
		border: 1px solid rgba(0, 0, 0, .3)!important;
		border-radius: 2px!important;
	}

	.kpagination li span {
    background: rgb(69 255 118 / 38%)!important;
		border: 1px solid rgba(0, 0, 0, .5)!important;
		border-radius: 4px!important;
		line-height: unset!important;
	}

	.kpagination li:first-child, .kpagination li:first-child a {
		display: none!important;
	}

	.path-element-last {
		color: white!important;
	}

	#Kunena a:hover {
		color: #00d7ff !important;
	}

	.kprofile-right, .kprofile-left {
		background: rgba(255, 255, 255, .15)!important;
		border-left: 1px solid rgba(0, 0, 0, .5)!important;
	}

	.kmessage-right {
		background: rgba(255, 255, 255, .2)!important;
		border: 1px solid rgba(0, 0, 0, .5);
		border-right: 1px solid rgba(0, 0, 0, .5)!important;
	}

	.kbuttonbar-right {
		background: rgba(255, 255, 255, .2)!important;
		border-right: 1px solid rgba(0, 0, 0, .5)!important;
		border: unset!important;
	}

	#Kunena td {
		border-bottom: unset!important;
		borde-radius: 4px;
	}

	.ktopic-views, .ktopic-views-number, .kcol-ktopicreplies, .kcol-ktopicreplies strong {
		color: white!important;
	}

	.krow1-stickymsg td {
		background: rgb(89 79 10) !important;
	}

	.krow2-stickymsg td {
		background: rgb(83 73 5) !important;
	}

	.krow1 td {
		background-color: rgb(113 113 113 / 28%) !important;
	}

	.krow2 td {
		background-color: rgb(113 113 113 / 38%) !important;
	}

	.krow2-blue td {
		background-color: rgb(46 176 255 / 28%) !important;
	}

	.krow1-red td {
		background-color: rgb(221 37 37 / 40%) !important;
	}

	.krow2-red td {
		background-color: rgb(221 37 37 / 45%) !important;
	}

	.krow1-green td {
		background-color: rgb(37 167 72 / 40%) !important;
	}

	.krow2-green td {
		background-color: rgb(37 167 72 / 30%) !important;
	}

	.krow1-grey td {
		background-color: rgb(113 113 113 / 28%) !important;
	}

	.krow2-grey td {
		background-color: rgb(113 113 113 / 38%) !important;
	}

	.kmsg-header h2 {
		background: unset!important;
	}

	.kheader {
		margin-bottom: 5px;
	}

	.tabs dt {
		border: unset!important;
	}

	.current {
		background: rgb(97 97 97 / 20%) !important;
		border: 1px solid rgba(0, 0, 0, .9)!important;
		color: white!important;
		border-radius: 2px;
	}

	.current .kheader {
		background-color: rgb(97 97 97 / 20%) !important;
		border: 1px solid rgba(0, 0, 0, .9)!important;
		color: white!important;
		border-radius: 2px;
	}

	.tabs .open {
		background: rgba(255, 255, 255, .2)!important;
		border: 1px solid rgba(255, 255, 255, .4);
		color: white!important;
	}

	.tabs .closed {
		background: #2d374b!important;s
		border: 1px solid rgba(255, 255, 255, .4);
		color: white!important;
	}

	.divTable{display:table;width:100%;overflow:hidden}.divTableRow{display:table-row}.divTableCell,.divTableHead{border-bottom:1px solid #9999993f;display:table-cell;padding:3px 4px}.divTableBody{display:table-row-group}.divTableImage{width:16px;height:16px;padding-right:3px}.divTableImageD{padding-right:25px}.divTableSmall{font-size:75%}.divTableon{color:rgb(77, 206, 154)}.divTableoff{color:rgb(222, 72, 72)}.divTableOnline{padding-left:0}.divTablePlayerCount{padding-right:2px}.box4 {box-shadow: 2px 2px 10px rgba(0,0,0,.8)!important;margin: 8px!important;}.divTablePlayerCount {font-weight: 400!important;padding-right:10px;}.divTableCell {font-weight: 800;}.box4 {background: rgb(40, 44, 48);color: #d1d1d1 !important;border-radius: 4px;border: 2px solid rgba(255, 255, 255, .1);}.divTableRow .divTableCell:nth-child(2) {color: #30daf5 !important;}
`);

AppendStyleToClass('kheader, kmsg-header', `
	padding: 8px;
	border: 1px solid rgba(0, 0, 0, .5);
	background: #2d374b !important;
	border-radius: 4px;
`);

AppendStyleToClass("pagenav", `
	background: #2d374b !important;
	border: 1px solid rgba(0, 0, 0, .5);
	border-radius: 4px;
	line-height: unset!important;
	padding: 1px 5px;
`, 'a');


if (IsTopicPage()) {
	var kheader = document.getElementsByClassName('kheader')[0];
	var headerh1 = kheader.getElementsByTagName('h1')[0];
	headerh1.innerText = headerh1.innerText.replace('TOPIC: ', '');
	var span = document.createElement('span');
	span.innerText = 'TOPIC';
	span.className = 'ktopic-badge';
	headerh1.insertBefore(span, headerh1.firstChild);
}

document.querySelectorAll('.klist-actions').forEach(e => {
	var forum = e.querySelector('.klist-actions-forum');
	var pages = e.querySelector('.klist-pages-all');
	if (!forum || !pages) return;
	if (forum.innerText.trim() === '' && pages.innerText.trim() === '') e.remove();
});

setTimeout(() => document.body.removeAttribute("data-darkreader-inline-bgimage"), 100)

var av = document.getElementsByClassName("klist-avatar");
for (i = 0; i < av.length; i++) {
	var arr = /https:\/\/zarpgaming\.com\/media\/kunena\/avatars\/resized\/size36\/users\/(.*)/.exec(av[i].src);
	if (!arr) continue;
	av[i].src = "https://zarpgaming.com/media/kunena/avatars/resized/size144/users/" + arr[1];
}


const list = document.getElementsByClassName("item-134 deeper parent")[0]
if (list && list.getChildren) list.getChildren("ul")[0].innerHTML += `<li class="item-12"><span class="rt-sidebar-arrow"></span><a href="https://zarpgaming.com/index.php/forum/search?childforums=1&show=2">Deleted Posts</a></li>`

document.getElements(".divTablePlayerCount").map(x => {
	const hasPlayer = String(document.getElement(x).innerHTML).split("/")[0].replace("\n", "") != "0";
	if (hasPlayer) document.getElement(x).setAttribute("style", "color: green;")
	else document.getElement(x).setAttribute("style", "color: red;")
})

var time = document.querySelector('.kfooter-time').innerText;
var timeDiv = document.createElement('div');
timeDiv.style = 'color: white; font-size: 12px; margin-top: 10px;';
timeDiv.innerText = time;
timeDiv.style.position = 'absolute';
timeDiv.style.right = '-10px';
timeDiv.style.top = '-55px';
timeDiv.style.padding = '0px 6px';
timeDiv.style.border = '1px solid rgba(255, 255, 255, .4)';
timeDiv.style.borderRadius = '2px';
timeDiv.style.background = 'rgb(41 107 46 / 87%)';
document.getElementById('rt-mainbody').insertBefore(timeDiv, document.getElementById('rt-mainbody').firstChild);

document.querySelectorAll('iframe[src*="youtube.com"]').forEach(e => {
	var box = document.createElement('div');
	box.style = 'background: rgba(0, 0, 0, 0.8); color: white; padding: 10px; border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 5px; margin: 10px 0;';
	box.innerHTML = 'Youtube embed hidden. Click to show.';
	box.onclick = function () {
		e.style.display = 'block';
		box.remove();
	};
	e.style.display = 'none';
	e.parentNode.insertBefore(box, e);
});
document.querySelectorAll('.ktoggler').forEach(e => e.remove());
document.querySelectorAll('a[href="/index.php/forum/credits"]').forEach(e => e.parentNode.remove());
document.querySelectorAll('.krss-block').forEach(e => e.remove());
document.querySelectorAll('.kfooter').forEach(e => e.remove());
document.querySelectorAll('.klist-actions-goto').forEach(e => e.remove());
document.querySelector("#rt-sidebar-a > div.rt-block.fp-menu.title1.rt-small-sidebar-title.nomargintop.nopaddingtop.visible-large > div > div.module-title")?.remove()
document.getElementsByClassName("rt-header-border")[0].style.backgroundColor = "rgba(0,0,0,0)";


FixForcedColors("#Kunena .kheader h2, #Kunena .kheader h2 a, #Kunena .kheader h3, #Kunena .kheader h3 a");
FixForcedColors("#Kunena .kdeleted td, #Kunena .kmoved td")

ReplaceImage("/components/com_kunena/template/blue_eagle/images/badges/zarpvip.png", "https://i.imgur.com/8U3XGgg.png", 150)

ReplaceStyle("color:#000000", "color:#ffffff");

if (IsTopicList()) {
	const list = document.getElementById("kflattable") || document.querySelector(".kflat");
	const Topics = [];
	const rows = list.getElementsByTagName("tr");

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const cols = row.getElementsByTagName("td");
		if (cols.length !== 5 && cols.length !== 6) continue;

		const isSticky = row.className.includes("krow1-stickymsg") || row.className.includes("krow2-stickymsg");
		const title = cols[2].querySelector("a").innerText;
		const url = cols[2].querySelector("a").href;
		const category = cols[2].querySelector(".ktopic-category")?.innerText?.replace("Category: ", "") || "";
		const icon = cols[1].querySelector("img").src;
		const created = cols[2].querySelector(".ktopic-posted-time").innerText;
		const createdBy = cols[2].querySelector(".ktopic-by.ks").innerText
		const createdByClass = cols[2].querySelector(".ktopic-by.ks > a").className;
		const createdByUrl = cols[2].querySelector(".ktopic-by.ks > a").href;
		const views = row.querySelector(".ktopic-views-number").innerText;
		const replies = Number(cols[0].querySelector("strong").innerText);
		const lastPostUrl = cols[4].querySelector(".klatest-post-info > .ktopic-latest-post > a:nth-child(1)").href;
		const lastPostCreatedBy = cols[4].querySelector(".klatest-post-info > .ktopic-latest-post > a:nth-child(2)").innerText;
		const lastPostCreated = cols[4].querySelector(".klatest-post-info > .ktopic-date").innerText;
		const lastPostCreatedUrl = cols[4].querySelector(".klatest-post-info > .ktopic-latest-post > a:nth-child(2)").href;
		const lastPostCreatedByClass = cols[4].querySelector(".klatest-post-info > .ktopic-latest-post > a:nth-child(2)").className;
		const lastPostAvatar = cols[4].querySelector(".klatest-post-info > .ktopic-latest-post-avatar > a > img").src;

		Topics.push({
			title,
			url,
			category,
			icon,
			created,
			createdBy,
			createdByClass,
			createdByUrl,
			views,
			replies,
			isSticky,
			lastPost: {
				url: lastPostUrl,
				authUrl: lastPostCreatedUrl,
				created: lastPostCreated,
				createdBy: lastPostCreatedBy,
				createdByClass: lastPostCreatedByClass,
				avatar: lastPostAvatar
			}
		});
	}

	list.outerHTML = `<div id="kflattable"></div>`;
	const div = document.getElementById("kflattable");
	function createTopicElement(topic) {
		const element = document.createElement("div");
		element.className = `topic ${topic.isSticky ? "zsticky" : ""}`;
		element.innerHTML = `
			<div class="ztopic-icon">
				<img src="${topic.icon}" alt="topic-icon">
			</div>
			<div class="ztopic-content">
				<div class="ztopic-info">
					<div class="ztopic-title">
						<a href="${topic.url}">${topic.title}</a>
					</div>
					<div class="ztopic-catauth">
						<div class="ztopic-author">
							${topic.category ? `<span class="ktopic-category">${topic.category}</span>` : ""}
							<span>By<span> <a href="${topic.createdByUrl}" class="${topic.createdByClass}">${topic.createdBy.replace("by ", "")}</a>, ${topic.created.replace("Topic started ", "")}
						</div>
					</div>
				</div>
				<div class="ztopic-lastpost">
					<div class="ztopic-latest-post">
						<div>
							<a href="${topic.lastPost.url}">Last Post</a> by <a href="${topic.lastPost.authUrl}" class="${topic.lastPost.createdByClass}">${topic.lastPost.createdBy}</a>
						</div>
						<div class="ztopic-latest-post-time">${topic.lastPost.created}</div>
					</div>
					<img src="${topic.lastPost.avatar}" alt="last-post-avatar">
				</div>
			</div>
			<div class="ztopic-stats">
				<div class="ztopic-views">
					${topic.views} <i class="far fa-eye"></i>
				</div>
				<div class="ztopic-replies">
					${topic.replies} <i class="fas fa-reply"></i>
				</div>
			</div>
		`;

		return element;
	}

	Topics.forEach(topic => div.appendChild(createTopicElement(topic)));

	AddStyle(`
		#kflattable {
			padding: 1px;
		}

		.zsticky {
			background: rgb(75 69 45) !important;
		}

		.zsticky .ztopic-icon {
			background: #5b5530!important;
		}

		.topic {
			display: flex;
			flex-direction: row;
			align-items: stretch;
			background: #272a31;
			border-radius: 4px;
			border-bottom: 1px solid #262f3f!important;
		}

		.topic:not(:last-child) {
			margin-bottom: 2px;
		}

		.ztopic-icon {
			width: 25px!important;
			min-width: 25px!important;
			max-width: 25px!important;
			padding: 1rem;
			background-color: #2d374b;
			display: flex;
			align-items: center;
			justify-content: center;
			border-top-left-radius: 4px;
			border-bottom-left-radius: 4px;
		}

		.ztopic-content {
			padding: 1rem;
			position: relative;
			display: flex;
			flex-direction: row;
			flex: 1 1 auto!important;
			align-items: center;
		}

		.ztopic-info {
			display: flex;
			flex-direction: column;
			flex: 1 1 auto!important;
		}

		.ztopic-stats {
			width: 20px!important;
			padding: 1rem;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			border-top-right-radius: 4px;
			border-bottom-right-radius: 4px;
			gap: 5px;
			margin-right: 10px;
		}

		.ztopic-views, .ztopic-replies {
			font-size: .8rem!important;
			color: rgba(255, 255, 255, .7);
			display: flex;
			flex-direction: row;
			align-items: center;
		}

		.ztopic-views i, .ztopic-replies i {
			margin-left: 5px;
		}

		.ztopic-lastpost {
			display: flex;
			flex-direction: row;
			align-items: center;
		}

		.ztopic-lastpost img {
			height: 50px!important;
			width: 50px!important;
			border-radius: 8px;
		}

		.ztopic-latest-post {
			margin-right: 10px;
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			justify-content: center;
		}

		.ztopic-author {
			display: flex;
			flex-direction: row;
			align-items: center;
			margin-top: 5px;
		}

		.ztopic-author, .ztopic-latest-post-time {
			font-size: .7rem!important;
			color: rgba(255, 255, 255, .7);
		}

		.ktopic-category {
			background: rgba(255, 255, 255, .2);
			color: white;
			padding: 1px 5px;
			border-radius: 4px;
			margin-right: 5px;
			border: 1px solid rgba(255, 255, 255, .2);
		}
	`);

	AppendStyleToClass(".ztopic-title > a", `
		text-decoration: none;
		font-weight: 800;
		font-size: 1rem;
		hyphens: auto;
		word-break: break-word;
	`);
}

LoadStyle("https://site-assets.fontawesome.com/releases/v6.7.2/css/all.css")
LoadStyle("https://fonts.googleapis.com/css2?family=Inter&display=swap")
