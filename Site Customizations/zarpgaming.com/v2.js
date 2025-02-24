function IsTopicPage() { return document.querySelector('.kmsg-id-right') !== null; }
function IsTopicList() { return document.querySelector('#kflattable') !== null || document.querySelector('.kflat') !== null; }
function HasMessages() { return document.querySelector('.kmsg') !== null; }
function IsProfilePage() { return document.querySelector('.k-profile') !== null; }

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

	#rt-mainbody {padding: 7px!important}
	.rt-main-wrapper, #rt-mainbody-surround, #rt-bottom {background: #14161c;}
	.kblock {background: transparent!important;}

	.kcontainer {
		border: 1px solid rgba(255, 255, 255, .4);
		color: white;
	}

	.kblocktable {
		background: #212735!important;
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
		border-top: unset!important;
		border-bottom: unset!important;
		min-height: unset!important;
	}

	.kspoiler-header {
		background: #2d374b!important;
		border: 1px solid rgba(255, 255, 255, .1);
		border-radius: 4px;
		padding: 5px;
		color: white;
		margin-top: 5px;
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
		border-radius: 2px;
	}

	#Kunena .klist-times-all, #Kunena .klist-pages-all, #Kunena .klist-time, .klist-jump-all {
		line-height: unset!important;
		border-left-color: rgba(255, 255, 255, .2)!important;
	}

	#kprofilebox td {background-color: #2d374b;}
	#kprofilebox .kbody {margin-bottom: unset!important;}

	#Kunena .klist-actions, #Kunena .klist-actions-bottom, #kprofilebox .krow1, #kprofilebox td, .kforum-pathway, .klist-bottom, .kanndesc {
		background: #2d374b !important;
		border: unset;
		border-radius: 2px;
	}

	#Kunena .klist-bottom {
		padding-bottom: 5px!important;
		border: 1px solid rgba(0, 0, 0, .5);
		margin-top: 5px;
		margin-bottom: 10px;
	}

	#Kunena div.kblock {border-bottom: unset!important;}
	#Kunena div.kblock.kfrontstats {margin: unset!important;}

	#Kunena .kforum-pathway, #Kunena dl.tabs dt {
		border-left: unset!important;
		border-right: unset!important;
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
    background:rgb(63, 135, 45)!important;
    border: 1px solid rgba(0, 0, 0, .3)!important;
    border-radius: 2px!important;
	}

	input[type="submit"]:hover, input[type="button"]:hover, input[type="reset"]:hover, button:hover, .kheadbtn a:hover {background: rgb(63, 135, 45)!important;}

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
		background-color: rgb(63, 135, 45) !important;
		border: 1px solid rgba(0, 0, 0, .3)!important;
		border-radius: 2px!important;
	}

	input[type="checkbox"]:focus, input[type="radio"]:focus {outline: none;}

	select {
		padding: 2px 8px!important;
		color: white!important;
		background: rgb(113 113 113 / 38%) !important;
		border: 1px solid rgba(0, 0, 0, .3)!important;
		border-radius: 2px!important;
	}

	.kpagination li span {
    background: rgb(63, 135, 45)!important;
		border: 1px solid rgba(0, 0, 0, .5)!important;
		border-radius: 4px!important;
		line-height: unset!important;
	}

	.kpagination li:first-child, .kpagination li:first-child a {display: none!important;}
	.path-element-last {color: white!important;}

	#Kunena a:hover {color: #00d7ff !important;}

	.kprofile-right, .kprofile-left {
		background:rgb(39, 49, 71)!important;
		border-left: 1px solid rgba(0, 0, 0, .5)!important;
	}

	.kmessage-right {
		background: #212735!important;
		border: 1px solid rgba(0, 0, 0, .5);
		border-right: 1px solid rgba(0, 0, 0, .5)!important;
	}

	.kbuttonbar-right {
		background: #212735!important;
		border-right: 1px solid rgba(0, 0, 0, .5)!important;
		border: unset!important;
	}

	#Kunena td {border-bottom: unset!important;}
	.ktopic-views, .ktopic-views-number, .kcol-ktopicreplies, .kcol-ktopicreplies strong {color: white!important;}

	.krow1 td, .krow2 td {
		background: #2d374b!important;
		border-radius: 2px;
	}

	.kcol-first {
		border-top-right-radius: 0px!important;
		border-bottom-right-radius: 0px!important;
	}

	.kcol-mid {
		border-top-left-radius: 0px!important;
		border-bottom-left-radius: 0px!important;
		border-left: 1px solid rgba(255, 255, 255, .3)!important;
	}

	.kmsg-header h2 {background: unset!important;}
	.kheader {margin-bottom: 5px;}
	.tabs dt {border: unset!important;}
	.kpathway {
		margin: 10px 0px -5px 0px!important;
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
	border: unset;
	background: #2d374b !important;
	border-radius: 2px;
`);

AppendStyleToClass("pagenav", `
	background: #2d374b !important;
	border: 1px solid rgba(0, 0, 0, .5);
	border-radius: 2px;
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

document.getElements?.(".divTablePlayerCount").map(x => {
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
timeDiv.style.border = '1px solid rgba(255, 255, 255, .2)';
timeDiv.style.borderRadius = '2px';
timeDiv.style.background = 'rgb(63, 135, 45)';
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
document.querySelectorAll('.kwhoisonline .kheader')[0]?.remove();
document.querySelectorAll('.kfrontstats .kheader')[0]?.remove();
document.querySelectorAll('.rt-pages')[0]?.remove();

FixForcedColors("#Kunena .kheader h2, #Kunena .kheader h2 a, #Kunena .kheader h3, #Kunena .kheader h3 a");
FixForcedColors("#Kunena .kdeleted td, #Kunena .kmoved td")

ReplaceImage("/components/com_kunena/template/blue_eagle/images/badges/zarpvip.png", "https://i.imgur.com/8U3XGgg.png", 150)

ReplaceStyle("color:#000000", "color:#ffffff");

if (IsTopicList()) {
	const list = document.getElementById("kflattable") || document.querySelector(".kflat");
	const Topics = [];
	const rows = !list.querySelector(".kcol-ktopicicon") ? [] : list.getElementsByTagName("tr");

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const cols1 = row.getElementsByTagName("td");
		if (cols1.length !== 5 && cols1.length !== 6) continue;

		let cols = cols1;
		if (IsProfilePage()) cols = [cols1[0], cols1[0], cols1[2], cols1[2], cols1[3], cols1[5]];

		const isSticky = row.className.includes("krow1-stickymsg") || row.className.includes("krow2-stickymsg");
		let title = cols[2].querySelector("a").innerText;
		const url = cols[2].querySelector("a").href;
		const category = cols[2].querySelector(".ktopic-category")?.innerText?.replace("Category: ", "") || "";
		const icon = cols[1].querySelector("img").src;
		const created = cols[2].querySelector(".ktopic-posted-time")?.innerText || "Unknown";
		const createdBy = cols[2].querySelector(".ktopic-by.ks")?.innerText || "Unknown";
		const createdByClass = cols[2].querySelector(".ktopic-by.ks > a")?.className;
		const createdByUrl = cols[2].querySelector(".ktopic-by.ks > a")?.href;
		const views = row.querySelector(".ktopic-views-number")?.innerText || 0;
		const replies = Number(cols[0].querySelector("strong")?.innerText || 0);
		const lastPostUrl = cols[4].querySelector(".klatest-post-info > .ktopic-latest-post > a:nth-child(1)")?.href;
		const lastPostCreatedBy = cols[4].querySelector(".klatest-post-info > .ktopic-latest-post > a:nth-child(2)")?.innerText;
		const lastPostCreated = cols[4].querySelector(".klatest-post-info > .ktopic-date")?.innerText || "Unknown";
		const lastPostCreatedUrl = cols[4].querySelector(".klatest-post-info > .ktopic-latest-post > a:nth-child(2)")?.href;
		const lastPostCreatedByClass = cols[4].querySelector(".klatest-post-info > .ktopic-latest-post > a:nth-child(2)")?.className;
		const lastPostAvatar = cols[4].querySelector(".klist-avatar")?.src;
		const lastPostFrame = cols[4].querySelector(".avatarFrame")?.src;

		const ModId = cols[5]?.querySelector("input")?.name;

		let newPosts = 0;
		const newPostsMatch = title.match(/\(\d+\sNEW\)$/);
		if (newPostsMatch) {
			newPosts = Number(newPostsMatch[0].replace(/\D/g, ""));
			title = title.replace(newPostsMatch[0], "");
		}

		const categoryParsed = category.toLowerCase().replace(/[^a-z0-9]/g, "_");

		Topics.push({
			title,
			newPosts,
			url,
			category,
			categoryParsed,
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
				avatar: lastPostAvatar,
				frame: lastPostFrame
			},
			mod: ModId
		});
	}

	if (rows.length > 1) list.outerHTML = `<div id="kflattable"></div>`;

	const div = document.getElementById("kflattable");
	function createTopicElement(topic) {
		const authorPart = `
		<div class="ztopic-catauth">
			<div class="ztopic-author">
				${topic.category ? `<span class="ktopic-category">${topic.category}</span>` : ""}
				<span>By<span> <a href="${topic.createdByUrl}" class="${topic.createdByClass}">${topic.createdBy.replace("by ", "")}</a>, ${topic.created.replace("Topic started ", "")}
			</div>
		</div>
		`;

		const lastPostPart = `
		<div class="ztopic-lastpost">
			<div class="ztopic-latest-post">
				<div>
					<a href="${topic.lastPost.url}">Last Post</a> by <a href="${topic.lastPost.authUrl}" class="${topic.lastPost.createdByClass}">${topic.lastPost.createdBy}</a>
				</div>
				<div class="ztopic-latest-post-time">${topic.lastPost.created}</div>
			</div>
			<div class="ztopic-latest-post-avatar">
				<img src="${topic.lastPost.avatar}" alt="last-post-avatar">
				<img src="${topic.lastPost.frame}" alt="last-post-frame" onerror="this.style.display='none'">
			</div>
		</div>
		`

		const element = document.createElement("div");
		element.className = `topic ${topic.isSticky ? "zsticky" : ""} ztopic-t-${topic.categoryParsed}`;
		element.innerHTML = `
			<div class="ztopic-icon">
				<img src="${topic.icon}" alt="topic-icon">
			</div>
			<div class="ztopic-content">
				<div class="ztopic-info">
					<div class="ztopic-title">
						<a href="${topic.url}">${topic.title}</a>
						${topic.newPosts ? `<span class="ztopic-new-posts">${topic.newPosts} New Post${topic.newPosts > 1 ? "s" : ""}</span>` : ""}
					</div>
					${!IsProfilePage() ? authorPart : ""}
				</div>
				${!IsProfilePage() ? lastPostPart : ""}
			</div>
			`

		if (!IsProfilePage()) {
			element.innerHTML += `
			<div class="ztopic-stats">
				<div class="ztopic-views">
					${topic.views} <i class="far fa-eye"></i>
				</div>
				<div class="ztopic-replies">
					${topic.replies} <i class="fas fa-reply"></i>
				</div>
			</div>
			`;
		}

		if (topic.mod) {
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.className = "ztopic-checkbox kcheck";
			checkbox.name = topic.mod;
			element.appendChild(checkbox);
		}

		return element;
	}

	Topics.forEach(topic => div.appendChild(createTopicElement(topic)));

	AddStyle(`
		.ztopic-t-accepted {background-color: #409f5961!important;}
		.ztopic-t-accepted .ztopic-icon {background-color: #409f5989!important;}
		.ztopic-t-denied {background-color: #9f404061!important;}
		.ztopic-t-denied .ztopic-icon {background-color: #9f404089!important;}
		.zsticky {background: rgb(75 69 45) !important;}
		.zsticky .ztopic-icon {background: #5b5530!important;}

		.ztopic-latest-post-avatar {
			position: relative;
			display: inline-flex;
			max-width: 36px;
			max-height: 36px;
		}

		.ztopic-latest-post-avatar img:last-child {
			position: absolute;
			top: -12%;
			left: -12%;
			width: calc(100% + 62%)!important;
			height: calc(100% + 62%)!important;
			border: unset !important;
			padding: unset !important;
			margin: unset !important;
			max-width: unset !important;
			max-height: unset !important;
		}

		.topic {
			display: flex;
			flex-direction: row;
			align-items: stretch;
			background: #212735;
			border-radius: 2px;
			border: 1px solid rgba(255, 255, 255, .1);
		}

		.topic:not(:last-child) {margin-bottom: 3px;}

		.ztopic-icon {
			width: 25px!important;
			min-width: 25px!important;
			max-width: 25px!important;
			padding: 1rem;
			background-color: #2d374b;
			display: flex;
			align-items: center;
			justify-content: center;
			border-top-left-radius: 2px;
			border-bottom-left-radius: 2px;
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

		.ztopic-views i, .ztopic-replies i {margin-left: 5px;}

		.ztopic-lastpost {
			display: flex;
			flex-direction: row;
			align-items: center;
		}

		.ztopic-lastpost img:first-child {
			height: 50px!important;
			width: 50px!important;
			border-radius: 3px;
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

		.ztopic-new-posts {
			background: rgb(69 255 118 / 38%);
			border: 1px solid rgba(255, 255, 255, .1);
			color: white;
			padding: 1px 5px;
			border-radius: 4px;
			margin-left: 5px;
			font-size: .7rem;
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

if (HasMessages()) {

	AddStyle(`
		.kmsg-header {
			margin-bottom: 5px;
		}

		.kmsg-header:not(:first-child) {
			margin-top: 5px;
		}

		.kmsg-header span:nth-child(3) {
			padding: 0px 6px!important;
			background:rgb(47, 70, 116);
			border-radius: 4px;
			color: white;
			border: 1px solid rgba(255, 255, 255, .1);
		}

		.kmsg-title-right {
			margin-left: unset!important;
			background: unset!important;
			padding-left: unset!important;
		}
	`)
}

LoadStyle("https://site-assets.fontawesome.com/releases/v6.7.2/css/all.css")
LoadStyle("https://fonts.googleapis.com/css2?family=Inter&display=swap")
