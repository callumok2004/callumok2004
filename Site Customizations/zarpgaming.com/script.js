

function sLoad() {
  document.getElementsByClassName("rt-header-border")[0].style.backgroundColor = "rgba(0,0,0,0)";
  document.body.style.backgroundImage = "url('https://static.vecteezy.com/system/resources/previews/021/430/833/non_2x/abstract-colorful-dark-blue-and-purple-gradient-blurred-background-night-sky-gradient-blue-gradation-wallpaper-for-background-themes-abstract-background-in-purple-and-blue-tones-web-design-banner-vector.jpg')"
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundSize = "cover";
  
  var av = document.getElementsByClassName("klist-avatar");
  for (i = 0; i < av.length; i++) {
    var arr = /https:\/\/zarpgaming\.com\/media\/kunena\/avatars\/resized\/size36\/users\/(.*)/.exec(av[i].src);
    if (!arr) continue;
    av[i].src = "https://zarpgaming.com/media/kunena/avatars/resized/size144/users/" + arr[1];
  }
}
sLoad()

function oloaded() {
  sLoad()
  document.querySelector("#rt-sidebar-a > div.rt-block.fp-menu.title1.rt-small-sidebar-title.nomargintop.nopaddingtop.visible-large > div > div.module-title")?.remove()
  //document.querySelector("#rt-header > div.rt-container > div.rt-grid-9.rt-omega > div > ul > li.item108.parent > a > i").innerHTML = "ZARP Perks"

  const list = document.getElementsByClassName("item-134 deeper parent")[0]
  if (list && list.getChildren)
    list.getChildren("ul")[0].innerHTML += `<li class="item-12"><span class="rt-sidebar-arrow"></span><a href="https://zarpgaming.com/index.php/forum/search?childforums=1&show=2">Deleted Posts</a></li>`

  if(document.getElements) {
    document.getElements(".divTablePlayerCount").map(x => {
      const hasPlayer = String(document.getElement(x).innerHTML).split("/")[0].replace("\n", "") != "0";
      if (hasPlayer) document.getElement(x).setAttribute("style", "color: green;")
      else document.getElement(x).setAttribute("style", "color: red;")
    })
  }
}

window.onload = oloaded

function loadStyle(FILE_URL, async = true) {
  let scriptEle = document.createElement("link");
  scriptEle.setAttribute("src", FILE_URL);
  scriptEle.setAttribute("rel", "stylesheet");
  document.body.appendChild(scriptEle);
  scriptEle.addEventListener("load", () => console.log("File loaded"));
  scriptEle.addEventListener("error", (ev) => console.log("Error on loading file", ev));
}

loadStyle("https://fonts.googleapis.com/css2?family=Inter&display=swap")

