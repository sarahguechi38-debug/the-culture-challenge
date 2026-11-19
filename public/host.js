const socket=io();const $=id=>document.getElementById(id);let state=null;
fetch("/api/info").then(r=>r.json()).then(d=>{$("qr").src=d.qr;$("url").textContent=d.joinUrl;$("code").textContent=d.roomCode;});
$("start").onclick=()=>socket.emit("start");$("reveal").onclick=()=>socket.emit("reveal");$("next").onclick=()=>socket.emit("next");$("reset").onclick=()=>{if(confirm("Recommencer une nouvelle partie ?"))socket.emit("reset");};
socket.on("state",s=>{state=s;render(s);});
function render(s){
 $("count").textContent=s.players.length;$("players").innerHTML="";
 if(!s.players.length)$("players").innerHTML='<p class="muted">Les joueurs apparaîtront ici.</p>';
 s.players.forEach((p,i)=>{const row=document.createElement("div");row.className="player-row";row.innerHTML=`<span>${p.avatar}</span><strong>${escapeHtml(p.name)}</strong><span class="pts">${p.score} pt${p.score>1?"s":""}</span>`;$("players").appendChild(row);});
 $("lobbyView").classList.toggle("hidden",s.phase!=="lobby");$("questionView").classList.toggle("hidden",!["question","reveal"].includes(s.phase));$("finishedView").classList.toggle("hidden",s.phase!=="finished");
 $("reveal").disabled=s.phase!=="question";$("next").disabled=s.phase!=="reveal";
 if(s.phase==="lobby"){$("round").textContent="EN ATTENTE DES CANDIDATS";$("qcount").textContent=`${s.players.length} INSCRIT(S)`;}
 if(["question","reveal"].includes(s.phase)){
  const q=s.question;$("round").textContent=`MANCHE 0${q.round} — ${q.type}`;$("qcount").textContent=`${s.current+1} / ${s.total}`;$("type").textContent=q.type;$("title").textContent=q.title;$("text").textContent=q.text;$("hostOptions").innerHTML="";
  q.options.forEach((o,i)=>{const d=document.createElement("div");d.className="host-option"+(s.phase==="reveal"&&i===q.correct?" correct":"");d.textContent=`${q.options.length===2?(i===0?"V":"F"):String.fromCharCode(65+i)} — ${o}`;$("hostOptions").appendChild(d);});
  $("explain").classList.toggle("hidden",s.phase!=="reveal");$("explain").textContent=`BONNE RÉPONSE : ${q.options[q.correct]}. ${q.explanation}`;
 }
 if(s.phase==="finished"){
  $("round").textContent="FIN DE LA PARTIE";$("qcount").textContent="PODIUM";
  const top=s.players.slice(0,3), order=[top[1],top[0],top[2]], cls=["second","first","third"], medals=["🥈","🥇","🥉"];
  $("podium").innerHTML=order.map((p,i)=>p?`<div class="podium-item ${cls[i]}"><div class="medal">${medals[i]}</div><strong>${escapeHtml(p.name)}</strong><small>${p.score} POINT${p.score>1?"S":""}</small><div class="block">${i===0?"2":i===1?"1":"3"}</div></div>`:"").join("");
 }
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
