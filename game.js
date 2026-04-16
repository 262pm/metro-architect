const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const COLORS={primary:'#7a9b8c',accent1:'#d4a59a',accent2:'#9ab5d4',accent3:'#d4c4a5',text:'#333',grid:'#e8e8e8',station:'#6b7f8c'};
const LINE_COLORS=[COLORS.primary,COLORS.accent1,COLORS.accent2,COLORS.accent3,'#c49ab8','#a8c49a'];
let gameState={running:false,week:1,score:0,stations:[],lines:[],trains:[],selectedColor:0,isDrawing:false,drawStart:null,camera:{x:0,y:0,zoom:1},lastSpawn:0,gameOver:false};
function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
window.addEventListener('resize',resize);resize();

class Station{constructor(x,y,type){this.x=x;this.y=y;this.type=type;this.passengers=[];this.capacity=6;this.size=12;}
draw(){const sx=this.x*gameState.camera.zoom+gameState.camera.x,sy=this.y*gameState.camera.zoom+gameState.camera.y,sz=this.size*gameState.camera.zoom;
ctx.fillStyle=COLORS.station;ctx.beginPath();
if(this.type==='circle')ctx.arc(sx,sy,sz,0,Math.PI*2);
else if(this.type==='triangle'){ctx.moveTo(sx,sy-sz);ctx.lineTo(sx+sz,sy+sz);ctx.lineTo(sx-sz,sy+sz);ctx.closePath();}
else if(this.type==='square')ctx.rect(sx-sz,sy-sz,sz*2,sz*2);
ctx.fill();
if(this.passengers.length>0){ctx.fillStyle=COLORS.text;ctx.font=`${10*gameState.camera.zoom}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(this.passengers.length,sx,sy);}
if(this.passengers.length>=this.capacity){ctx.strokeStyle='#e74c3c';ctx.lineWidth=3;ctx.stroke();}}
addPassenger(t){if(this.passengers.length<this.capacity){this.passengers.push(t);return true;}return false;}}

class Line{constructor(stations,color){this.stations=stations;this.color=color;}
draw(){if(this.stations.length<2)return;ctx.strokeStyle=this.color;ctx.lineWidth=3*gameState.camera.zoom;ctx.lineCap='round';ctx.beginPath();
const s=this.stations[0];ctx.moveTo(s.x*gameState.camera.zoom+gameState.camera.x,s.y*gameState.camera.zoom+gameState.camera.y);
for(let i=1;i<this.stations.length;i++){const st=this.stations[i];ctx.lineTo(st.x*gameState.camera.zoom+gameState.camera.x,st.y*gameState.camera.zoom+gameState.camera.y);}ctx.stroke();}}

class Train{constructor(line){this.line=line;this.idx=0;this.progress=0;this.passengers=[];this.capacity=4;this.speed=0.02;}
update(){if(!this.line||this.line.stations.length<2)return;this.progress+=this.speed;
if(this.progress>=1){this.progress=0;this.idx=(this.idx+1)%this.line.stations.length;this.pickup();}}
pickup(){const st=this.line.stations[this.idx];this.passengers=this.passengers.filter(p=>{if(p===st.type){gameState.score+=10;return false;}return true;});
const space=this.capacity-this.passengers.length;if(space>0&&st.passengers.length>0){const n=Math.min(space,st.passengers.length);for(let i=0;i<n;i++){this.passengers.push(st.passengers[0]);st.passengers.shift();}}}
draw(){if(!this.line||this.line.stations.length<2)return;const c=this.line.stations[this.idx],n=this.line.stations[(this.idx+1)%this.line.stations.length];
const x=(c.x+(n.x-c.x)*this.progress)*gameState.camera.zoom+gameState.camera.x,y=(c.y+(n.y-c.y)*this.progress)*gameState.camera.zoom+gameState.camera.y;
ctx.fillStyle=this.line.color;ctx.beginPath();ctx.arc(x,y,6*gameState.camera.zoom,0,Math.PI*2);ctx.fill();
if(this.passengers.length>0){ctx.fillStyle='#fff';ctx.font=`${8*gameState.camera.zoom}px sans-serif`;ctx.textAlign='center';ctx.fillText(this.passengers.length,x,y);}}}

let startPos=null;
canvas.addEventListener('pointerdown',e=>{if(!gameState.running)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-gameState.camera.x)/gameState.camera.zoom,y=(e.clientY-r.top-gameState.camera.y)/gameState.camera.zoom;
const cs=gameState.stations.find(s=>Math.hypot(s.x-x,s.y-y)<s.size*1.5);if(cs){gameState.isDrawing=true;startPos=cs;}});
canvas.addEventListener('pointermove',e=>{if(!gameState.isDrawing||!startPos)return;const r=canvas.getBoundingClientRect();gameState.drawEnd={x:(e.clientX-r.left-gameState.camera.x)/gameState.camera.zoom,y:(e.clientY-r.top-gameState.camera.y)/gameState.camera.zoom};});
canvas.addEventListener('pointerup',e=>{if(!gameState.isDrawing||!startPos)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-gameState.camera.x)/gameState.camera.zoom,y=(e.clientY-r.top-gameState.camera.y)/gameState.camera.zoom;
const es=gameState.stations.find(s=>Math.hypot(s.x-x,s.y-y)<s.size*1.5&&s!==startPos);if(es){let line=gameState.lines.find(l=>l.color===LINE_COLORS[gameState.selectedColor]);
if(!line){line=new Line([],LINE_COLORS[gameState.selectedColor]);gameState.lines.push(line);}
if(!line.stations.includes(startPos))line.stations.push(startPos);if(!line.stations.includes(es))line.stations.push(es);
if(line.stations.length===2&&!gameState.trains.find(t=>t.line===line))gameState.trains.push(new Train(line));}
gameState.isDrawing=false;startPos=null;gameState.drawEnd=null;});

function spawnStation(){const m=100,x=m+Math.random()*(canvas.width/gameState.camera.zoom-m*2),y=m+Math.random()*(canvas.height/gameState.camera.zoom-m*2),types=['circle','triangle','square'];gameState.stations.push(new Station(x,y,types[Math.floor(Math.random()*types.length)]));}
function spawnPassenger(){if(gameState.stations.length===0)return;const st=gameState.stations[Math.floor(Math.random()*gameState.stations.length)],types=['circle','triangle','square'];if(!st.addPassenger(types[Math.floor(Math.random()*types.length)]))gameOver();}
function gameOver(){gameState.gameOver=true;gameState.running=false;document.getElementById('finalWeek').textContent=gameState.week;document.getElementById('gameOver').style.display='block';}
function drawGrid(){const gs=50*gameState.camera.zoom,ox=gameState.camera.x%gs,oy=gameState.camera.y%gs;ctx.strokeStyle=COLORS.grid;ctx.lineWidth=1;
for(let x=ox;x<canvas.width;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
for(let y=oy;y<canvas.height;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}}

function gameLoop(){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);drawGrid();gameState.lines.forEach(l=>l.draw());
if(gameState.isDrawing&&startPos&&gameState.drawEnd){ctx.strokeStyle=LINE_COLORS[gameState.selectedColor];ctx.lineWidth=3*gameState.camera.zoom;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(startPos.x*gameState.camera.zoom+gameState.camera.x,startPos.y*gameState.camera.zoom+gameState.camera.y);ctx.lineTo(gameState.drawEnd.x*gameState.camera.zoom+gameState.camera.x,gameState.drawEnd.y*gameState.camera.zoom+gameState.camera.y);ctx.stroke();ctx.setLineDash([]);}
gameState.stations.forEach(s=>s.draw());
if(gameState.running){gameState.trains.forEach(t=>{t.update();t.draw();});const now=Date.now();if(now-gameState.lastSpawn>2000){spawnPassenger();gameState.lastSpawn=now;}if(Math.floor(gameState.score/100)+1>gameState.week){gameState.week++;document.getElementById('weekDisplay').textContent=gameState.week;}}requestAnimationFrame(gameLoop);}

function setupUI(){const cp=document.getElementById('colorPicker');LINE_COLORS.forEach((col,i)=>{const b=document.createElement('div');b.className='color-option'+(i===0?' active':'');b.style.backgroundColor=col;b.onclick=()=>{gameState.selectedColor=i;document.querySelectorAll('.color-option').forEach((el,ii)=>el.classList.toggle('active',ii===i));};cp.appendChild(b);});
document.getElementById('startBtn').onclick=()=>{if(!gameState.running&&!gameState.gameOver){gameState.running=true;document.getElementById('startBtn').textContent='Продолжить';}};
document.getElementById('pauseBtn').onclick=()=>{gameState.running=!gameState.running;document.getElementById('pauseBtn').textContent=gameState.running?'Пауза':'Старт';};}

function init(){setupUI();for(let i=0;i<3;i++)spawnStation();gameState.lastSpawn=Date.now();gameLoop();}
init();
