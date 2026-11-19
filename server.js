const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const QRCode = require("qrcode");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, "public")));

const questions = [
  {round:1, type:"VRAI OU FAUX", title:"Le small talk avant la réunion", text:"Aux États-Unis, quelques minutes de conversation informelle (« small talk ») avant une réunion peuvent aider à créer un climat relationnel. Cette pratique est fréquente, mais dépend des personnes et du contexte.", options:["Vrai","Faux"], correct:0, explanation:"Vrai. Le small talk (météo, trajet, actualité légère…) sert souvent à établir un premier contact. Il reste bref et ne remplace pas l'ordre du jour."},
  {round:1, type:"VRAI OU FAUX", title:"Prendre la parole en réunion", text:"Dans de nombreuses entreprises américaines, les collaborateurs sont encouragés à partager leurs idées et à poser des questions en réunion, quel que soit leur niveau hiérarchique.", options:["Vrai","Faux"], correct:0, explanation:"Vrai, assez souvent. La participation et la prise d'initiative sont valorisées dans beaucoup d'équipes. Cela varie toutefois selon l'entreprise, le manager et le secteur."},
  {round:2, type:"LE BON RÉFLEXE", title:"Une réunion à 9 h précises", text:"Vous avez une visioconférence avec un partenaire américain à 9 h. Votre train prend du retard et vous pensez arriver avec 8 minutes de décalage. Quelle réaction est la plus professionnelle ?", options:["Rejoindre la réunion en retard sans rien signaler","Prévenir dès que possible et proposer une solution","Attendre que le partenaire vous contacte"], correct:1, explanation:"Prévenir rapidement est la meilleure option. La ponctualité est généralement importante dans les échanges professionnels américains. En cas d'imprévu, une information claire et anticipée montre votre fiabilité."},
  {round:2, type:"LE BON RÉFLEXE", title:"Une mission avec de l'autonomie", text:"Votre responsable vous confie une étude de marché avec un objectif précis, mais peu de consignes sur la méthode. Que pouvez-vous faire pour montrer votre professionnalisme ?", options:["Attendre des instructions détaillées pour chaque étape","Proposer un plan d'action, prendre des initiatives et valider les points importants","Réaliser l'étude sans donner de nouvelles jusqu'à la date limite"], correct:1, explanation:"L'autonomie et la proactivité sont souvent appréciées. L'idéal est de proposer une méthode, de prendre des initiatives et de communiquer régulièrement sur l'avancement, sans agir hors du cadre fixé."},
  {round:3, type:"QUE FERAIS-TU ?", title:"Vous n'êtes pas d'accord avec votre manager", text:"En réunion, votre manager américain présente une stratégie que vous jugez risquée. Vous avez des données qui soutiennent votre avis. Quelle réaction est la plus adaptée ?", options:["Exprimer calmement votre désaccord, présenter les faits et proposer une alternative","Ne rien dire en réunion puis critiquer la décision auprès des collègues","Interrompre le manager pour lui dire qu'il a tort"], correct:0, explanation:"Un désaccord professionnel peut être exprimé. Appuyez-vous sur des faits, gardez un ton respectueux et formulez une proposition. La franchise n'exclut ni l'écoute ni la diplomatie."},
  {round:3, type:"QUE FERAIS-TU ?", title:"Le fameux « How are you? »", text:"En arrivant au bureau, un collègue vous lance « Hi, how are you? ». Dans un échange quotidien aux États-Unis, quelle réponse est généralement attendue ?", options:["Raconter en détail ses difficultés personnelles","Répondre brièvement, par exemple « I'm good, thanks. How are you? »","Présenter immédiatement son rapport d'activité"], correct:1, explanation:"C'est souvent une formule de salutation et une ouverture de conversation, pas forcément une demande de bilan personnel détaillé. Une réponse courte et réciproque convient généralement."},
  {round:3, type:"QUE FERAIS-TU ?", title:"Convaincre en entretien", text:"Lors d'un entretien d'embauche aux États-Unis, le recruteur vous demande de parler d'une réussite professionnelle. Quelle réponse est la plus convaincante ?", options:["Rester vague pour ne pas paraître prétentieux","Décrire une situation précise, votre action et le résultat obtenu","Énumérer uniquement des qualités sans exemple"], correct:1, explanation:"Les exemples concrets sont utiles. La méthode STAR (Situation, Task, Action, Result) permet de structurer une réponse et de montrer clairement votre contribution."},
  {round:3, type:"QUE FERAIS-TU ?", title:"Développer son réseau", text:"Lors d'un salon professionnel, vous échangez avec une acheteuse américaine qui pourrait devenir une partenaire. Que signifie faire du « networking » et quelle suite est pertinente ?", options:["Développer et entretenir un réseau de contacts, puis envoyer un message de suivi personnalisé","Changer régulièrement d'entreprise pour rencontrer de nouvelles personnes","Collecter un maximum de cartes de visite sans reprendre contact"], correct:0, explanation:"Le networking consiste à créer et entretenir des relations professionnelles utiles aux deux parties. Un message de suivi personnalisé, rappelant votre échange, aide à construire une relation dans la durée."}
];

let hostSocket = null;
let players = new Map();
let current = -1;
let phase = "lobby";
let answers = {};
let roomCode = Math.random().toString(36).slice(2,7).toUpperCase();

function sortedPlayers(){
  return [...players.values()].sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
}
function publicState(){
  return {phase, current, question: current>=0 ? questions[current] : null,
    players: sortedPlayers().map(p=>({id:p.id,name:p.name,avatar:p.avatar,score:p.score,answered:!!answers[p.id]})),
    total:questions.length, roomCode};
}
function broadcast(){io.emit("state",publicState());}

app.get("/api/info", async (req,res)=>{
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const joinUrl = `${baseUrl}/`;
  try { res.json({joinUrl, qr:await QRCode.toDataURL(joinUrl,{width:360,margin:2,color:{dark:"#101a35",light:"#ffffff"}}), roomCode}); }
  catch(e){res.status(500).json({error:"QR indisponible"});}
});

io.on("connection", socket=>{
  socket.emit("state",publicState());
  socket.on("join", ({name,avatar})=>{
    name=String(name||"").trim().slice(0,18);
    if(!name) return socket.emit("errorMsg","Choisis un prénom ou un pseudo.");
    if(players.size>=60) return socket.emit("errorMsg","La partie est complète (60 joueurs maximum).");
    if([...players.values()].some(p=>p.name.toLowerCase()===name.toLowerCase())) return socket.emit("errorMsg","Ce pseudo est déjà utilisé. Choisis-en un autre.");
    players.set(socket.id,{id:socket.id,name,avatar:avatar||"🦊",score:0});
    socket.data.player=true;
    socket.emit("joined",{name});
    broadcast();
  });
  socket.on("start",()=>{
    if(phase==="lobby" || phase==="between"){phase="question"; current=0; answers={}; broadcast();}
  });
  socket.on("next",()=>{
    if(current<questions.length-1){current++; phase="question"; answers={};}
    else phase="finished";
    broadcast();
  });
  socket.on("reveal",()=>{if(phase==="question") phase="reveal"; broadcast();});
  socket.on("answer",({choice})=>{
    if(phase!=="question" || !socket.data.player || answers[socket.id]!==undefined) return;
    const q=questions[current];
    if(!q || !Number.isInteger(choice) || choice<0 || choice>=q.options.length) return;
    answers[socket.id]=choice;
    if(choice===q.correct) players.get(socket.id).score+=1;
    socket.emit("answerAck",{correct:choice===q.correct});
    broadcast();
  });
  socket.on("reset",()=>{
    players.clear(); current=-1; phase="lobby"; answers={}; roomCode=Math.random().toString(36).slice(2,7).toUpperCase(); broadcast();
  });
  socket.on("disconnect",()=>{
    if(players.has(socket.id)){players.delete(socket.id); delete answers[socket.id]; broadcast();}
    if(hostSocket===socket.id) hostSocket=null;
  });
});
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`Culture Challenge running on ${PORT}`));