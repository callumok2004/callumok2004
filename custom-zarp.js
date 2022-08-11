// Remove black bar at top of site
document.getElementsByClassName("rt-header-border")[0].style.backgroundColor = "rgba(0,0,0,0)";

// Custom background image
document.body.style.backgroundImage = "url('https://1.bp.blogspot.com/-o5QvmlqxhqI/XysfTRXyCuI/AAAAAAAAZWU/Wsrc1EgGOJAigFTl-T9m1rbQHU4lpJg2ACLcBGAsYHQ/d/gradient-dark-blue.png')";
document.body.style.backgroundPosition = "center";
document.body.style.backgroundRepeat = "no-repeat";
document.body.style.backgroundSize = "cover";

// Show animated avatars as animated on the main forum
var array = document.getElementsByClassName("klist-avatar");

for (i = 0; i < array.length; i++) {
  var arr = /https:\/\/zarpgaming\.com\/media\/kunena\/avatars\/resized\/size36\/users\/(.*)/.exec(array[i].src);
  if (!arr) continue;

  array[i].src = "https://zarpgaming.com/media/kunena/avatars/resized/size144/users/" + arr[1];
}

window.onload = () => {
  // Add button to view unapproved posts quickly
  const list = document.getElementsByClassName("item-134 active deeper parent")[0]
  if (list && list.getChildren) list.getChildren("ul")[0].innerHTML += `<li class="item-249"><span class="rt-sidebar-arrow"></span><a href="https://zarpgaming.com/index.php/forum/search?childforums=1&show=1">Unapproved Posts</a></li>`

  // Show ban count on profile stats
  const banList = document.querySelector(".banhistory > .kcontainer > .kbody > table > tbody")
  const profileStats = document.querySelector("#kprofile-stats > ul")

  if (banList && profileStats) profileStats.innerHTML += `<li><strong>Bans:</strong> ${banList.getChildren().filter(x => x.getChildren()[0].className.includes("kcol-first kid")).length || 0}</li>`
}

// Show if Mix3rz is currently playing STRP

// let status = true;
// function updateStatus(check) {
//     fetch("https://servers-frontend.fivem.net/api/servers/single/n446av")
//         .then(response => response.json())
//         .then(result => {
//             const players = result["Data"]["players"];
//             const mix3rz = players.find(r => r.identifiers.includes("discord:216201175626809344"))

//             if (mix3rz && status == false) alert("Mix3rz is on STRP!")
//             status = mix3rz ? true : false

//             if(check) return;

//             const mix3rzOnlinePanel = `
// <div class="kblock kpbox" id="mix3rz-panel">
//   <div class="kcontainer" id="kprofilebox">
//       <div class="kbody">
//         <table class="kprofilebox">
//             <tbody>
//               <tr class="krow1">
//                   <td class="kprofileboxcnt">
//                     <ul class="kprofilebox-link">
//                         <li><a href="https://is-mix3rz-on-strp.com">via is-mix3rz-on-strp.com</a></li>
//                     </ul>
//                     <ul class="kprofilebox-welcome">
//                         <li class="">Is Mix3rz on STRP right now?</li>
//                         <li class="kms"><strong>Current Status:</strong> <span title="a">${mix3rz ? "Online" : "Offline"}</span></li>
//                     </ul>
//                   </td>
//               </tr>
//             </tbody>
//         </table>
//       </div>
//   </div>
// </div>
// `

//             const current = document.getElementById("Kunena").innerHTML
//             document.getElementById("Kunena").innerHTML = mix3rzOnlinePanel + current
//         })
//         .catch(error => console.log('error', error));
// }

// updateStatus()
// setInterval(() => updateStatus(true), 10000)
