document.getElementsByClassName("rt-header-border")[0].style.backgroundColor = "rgba(0,0,0,0)";
document.body.style.backgroundImage = "url('https://1.bp.blogspot.com/-o5QvmlqxhqI/XysfTRXyCuI/AAAAAAAAZWU/Wsrc1EgGOJAigFTl-T9m1rbQHU4lpJg2ACLcBGAsYHQ/d/gradient-dark-blue.png')";
document.body.style.backgroundPosition = "center";
document.body.style.backgroundRepeat = "no-repeat";
document.body.style.backgroundSize = "cover";

var array = document.getElementsByClassName("klist-avatar");

for (i = 0; i < array.length; i++) {
  var arr = /https:\/\/zarpgaming\.com\/media\/kunena\/avatars\/resized\/size36\/users\/(.*)/.exec(array[i].src);
  if (!arr) continue;

  array[i].src = "https://zarpgaming.com/media/kunena/avatars/resized/size144/users/" + arr[1];
}

function loaded() {
  document.querySelector("#rt-sidebar-a > div.rt-block.fp-menu.title1.rt-small-sidebar-title.nomargintop.nopaddingtop.visible-large > div > div.module-title")?.remove()
  document.querySelector("#rt-header > div.rt-container > div.rt-grid-9.rt-omega > div > ul > li.item108.parent > a > i").innerHTML = "ZARP Perks"
  
  const list = document.getElementsByClassName("item-134 deeper parent")[0]
  if (list && list.getChildren) {
    list.getChildren("ul")[0].innerHTML += `<li class="item-12"><span class="rt-sidebar-arrow"></span><a href="https://zarpgaming.com/index.php/forum/search?childforums=1&show=1">Unapproved Posts</a></li>`
    list.getChildren("ul")[0].innerHTML += `<li class="item-12"><span class="rt-sidebar-arrow"></span><a href="https://zarpgaming.com/index.php/forum/search?childforums=1&show=2">Deleted Posts</a></li>`
  }

  const banList = document.querySelector(".banhistory > .kcontainer > .kbody > table > tbody")
  const profileStats = document.querySelector("#kprofile-stats > ul")

  if (banList && profileStats) profileStats.innerHTML += `<li><strong>Bans:</strong> ${banList.getChildren().filter(x => x.getChildren()[0].className.includes("kcol-first kid")).length || 0}</li>`

  if(document.getElements) {
    document.getElements(".divTablePlayerCount").map(x => {
      const hasPlayer = String(document.getElement(x).innerHTML).split("/")[0].replace("\n", "") != "0";
      if (hasPlayer) document.getElement(x).setAttribute("style", "color: green;")
      else document.getElement(x).setAttribute("style", "color: red;")
    })
    
    const elem = document.querySelector("#rt-sidebar-a > div.rt-block.title4.box4.visible-desktop > div > div.module-content > div > div > div:nth-child(3) > div.divTableCell.divTablePlayerCount");
    
    if (elem.innerText.startsWith("0")) setInterval(() => {
      let ran = Math.floor(Math.random() * 47)
      elem.innerText = ran + "/47"
      elem.setAttribute("style", "color: green;")
      }, 500)
    }
  
  // const newParent = document.querySelector("#rt-page-surround > div")
  // newParent.innerHTML = document.querySelector("#rt-sidebar-a > div.rt-block.title4.box4.visible-desktop").outerHTML + newParent.innerHTML
  // document.querySelector("#rt-sidebar-a > div.rt-block.title4.box4.visible-desktop").remove()
  // document.querySelector("#rt-page-surround > div > div.rt-block.title4.box4.visible-desktop > div > div.module-content > div > div").setAttribute("style", "display: grid;grid-template-columns: 1fr 1fr 1fr 1fr;")
}

window.onload = loaded

let status = true;
function updateStatus(check) {
    fetch("https://servers-frontend.fivem.net/api/servers/single/n446av")
        .then(response => response.json())
        .then(result => {
            const players = result["Data"]["players"];
            const mix3rz = players.find(r => r.identifiers.includes("discord:216201175626809344"))

            if (mix3rz && status == false) alert("Mix3rz is on STRP!")
            status = mix3rz ? true : false

            if(check) return;

            const mix3rzOnlinePanel = `
<div class="kblock kpbox" id="mix3rz-panel">
  <div class="kcontainer" id="kprofilebox">
      <div class="kbody">
        <table class="kprofilebox">
            <tbody>
              <tr class="krow1">
                  <td class="kprofileboxcnt">
                    <ul class="kprofilebox-link">
                        <li><a href="https://is-mix3rz-on-strp.com">via is-mix3rz-on-strp.com</a></li>
                    </ul>
                    <ul class="kprofilebox-welcome">
                        <li class="">Is Mix3rz on STRP right now?</li>
                        <li class="kms"><strong>Current Status:</strong> <span title="a">${mix3rz ? "Online" : "Offline"}</span></li>
                    </ul>
                  </td>
              </tr>
            </tbody>
        </table>
      </div>
  </div>
</div>
`

            const current = document.getElementById("Kunena").innerHTML
            document.getElementById("Kunena").innerHTML = mix3rzOnlinePanel + current
        })
        .catch(error => console.log('error', error));
}

updateStatus()
// setInterval(() => updateStatus(true), 10000)
