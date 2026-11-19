const socket=io();
const $=id=>document.getElementById(id);
const sections=["intro","register","waiting","play","done"];
function show(id){sections.forEach(x=>$(x).classList.toggle("hidden",x!==id));}
let avatar="🦊", joined=false, lastQuestion=-1, myScore=0, answered=false;
$("enter").onclick=()=>show("register");
document.querySelectorAll("#avatars button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#avatars button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");avatar=b.textContent;});
$("avatars").firstElementChild.classList.add("selected");
$("join").onclick=()=>{ $("error").textContent=""; socket.emit("join",{name:$("name").value,avatar}); };
$("name").addEventListener("keydown",e=>{if(e.key==="Enter")$("join").click();});
socket.on("errorMsg",m=>$("error").textContent=m);
socket.on("joined",d=>{joined=true;$("myName").textContent=`CANDIDAT : ${d.name} ${avatar}`;show("waiting");});
socket.on("answerAck",d=>{$("feedback").className="feedback "+(d.correct?"good":"bad");$("feedback").textContent=d.correct?"✓ Bonne réponse !":"✕ Pas cette fois. La réponse sera expliquée à l'écran.";});
socket.on("state",s=>{
  const me=s.players.find(p=>p.id===socket.id); if(me){myScore=me.score;$("score").textContent=myScore;}
  if(!joined)return;
  if(s.phase==="finished"){show("done");return;}
  if(s.phase==="lobby"||s.phase==="between"){show("waiting");return;}
  if(s.phase==="question"||s.phase==="reveal"){
    show("play");
    if(lastQuestion!==s.current){lastQuestion=s.current;answered=false;$("feedback").className="feedback hidden";renderQuestion(s.question,s.current,s.total);}
    if(s.phase==="reveal")document.querySelectorAll(".option").forEach(b=>b.disabled=true);
  }
});
function renderQuestion(q,index,total){
 $("roundTag").textContent="MANCHE 0"+q.round;$("qNumber").textContent=`QUESTION ${index+1}/${total}`;$("progress").style.width=((index+1)/total*100)+"%";
 $("qType").textContent=q.type;$("qTitle").textContent=q.title;$("qText").textContent=q.text;$("options").innerHTML="";
 q.options.forEach((op,i)=>{const b=document.createElement("button");b.className="option";b.innerHTML=`<b>${q.options.length===2?(i===0?"V":"F"):String.fromCharCode(65+i)}</b>${op}`;b.onclick=()=>{if(answered)return;answered=true;document.querySelectorAll(".option").forEach(x=>x.disabled=true);b.classList.add("chosen");socket.emit("answer",{choice:i});};$("options").appendChild(b);});
}
