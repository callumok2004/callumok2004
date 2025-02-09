function IsProfilePage() { return document.querySelector('.k-profile') !== null; }
function IsTopicPage() { return document.querySelector('.kmsg-id-right') !== null; }
function IsIndex() { return document.querySelector('.kfrontstats') !== null; }

console.log('IsProfilePage', IsProfilePage());
console.log('IsTopicPage', IsTopicPage());
console.log('IsIndex', IsIndex());

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
	var elements = document.getElementsByClassName(className);
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
	let scriptEle = document.createElement("link");
	scriptEle.setAttribute("src", FILE_URL);
	scriptEle.setAttribute("rel", "stylesheet");
	document.body.appendChild(scriptEle);
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
	.rt-main-wrapper {
		background: rgb(0 0 0 / 10%);
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
    border: 1px solid rgba(255, 255, 255, .1);
    vertical-align: middle;
    background: rgb(69 255 118 / 38%) !important;
    font-size: 8px !important;
	}

	.kspoiler-wrapper {
		background-color: rgba(255, 255, 255, .1)!important;
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
		background: rgba(255, 255, 255, .1)!important;
		border: 1px solid rgba(255, 255, 255, .4);
		border-radius: 4px;
	}

	#kprofilebox > .kbody {
		background: rgba(0, 0, 0, .6);
		border: 1px solid rgba(255, 255, 255, .4);
		color: white;
	}

	#Kunena .klist-times-all, #Kunena .klist-pages-all, #Kunena .klist-times {
		line-height: unset!important;
	}

	#kprofilebox td {
		background-color: rgba(255, 255, 255, .1);
	}

	#Kunena .klist-actions, #Kunena .klist-actions-bottom, #kprofilebox .krow1, #kprofilebox td, .kforum-pathway, .klist-bottom, .kanndesc {
		background: rgba(255, 255, 255, .05) !important;
		border: 2px solid rgba(0, 0, 0, .5);
	}

	#Kunena .klist-bottom {
		padding-bottom: 5px!important;
		border: 2px solid rgba(0, 0, 0, .5);
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
		border: 2px solid rgba(0, 0, 0, .5);
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
	}

	#Kunena td:not(.kbuttonbar-right) {
		border-left: 2px solid rgba(255, 255, 255, .1)!important;
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
		border: 2px solid rgba(0, 0, 0, .9)!important;
		color: white!important;
		border-radius: 2px;
	}

	.current .kheader {
		background-color: rgb(97 97 97 / 20%) !important;
		border: 2px solid rgba(0, 0, 0, .9)!important;
		color: white!important;
		border-radius: 2px;
	}

	.tabs .open {
		background: rgba(255, 255, 255, .2)!important;
		border: 1px solid rgba(255, 255, 255, .4);
		color: white!important;
	}

	.tabs .closed {
		background: rgba(255, 255, 255, .1)!important;
		border: 1px solid rgba(255, 255, 255, .4);
		color: white!important;
	}
`);

AppendStyleToClass('kheader, kmsg-header', `
	padding: 8px;
	border: 2px solid rgba(0, 0, 0, .5);
	background: rgba(255, 255, 255, .05) !important;
`);

AppendStyleToClass("pagenav", `
	background: rgba(255, 255, 255, .1) !important;
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


LoadStyle("https://fonts.googleapis.com/css2?family=Inter&display=swap")

FixForcedColors("#Kunena .kheader h2, #Kunena .kheader h2 a, #Kunena .kheader h3, #Kunena .kheader h3 a");
FixForcedColors("#Kunena .kdeleted td, #Kunena .kmoved td")

ReplaceImage("/components/com_kunena/template/blue_eagle/images/badges/zarpvip.png", "https://i.imgur.com/8U3XGgg.png", 150)

ReplaceStyle("color:#000000", "color:#ffffff");
