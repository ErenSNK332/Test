const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 760;

// ---------------- PATH (copié de ton jeu) ----------------
const path = [
  {x:0,y:220},{x:220,y:220},{x:220,y:420},{x:490,y:420},
  {x:490,y:180},{x:800,y:180},{x:800,y:500},{x:1230,y:500}
];

// ---------------- STATE ----------------
let gold = 120;
let life = 20;
let waveIndex = 0;

let towers = [];
let enemies = [];
let projectiles = [];

let selected = "archer";

// ---------------- ENEMIES (fidèle Python) ----------------
const ENEMY = {
  grunt:{hp:55,speed:1.1,color:"red",reward:10},
  fast:{hp:35,speed:2.0,color:"yellow",reward:9},
  tank:{hp:140,speed:0.72,color:"#8b5a2b",reward:18},
  flying:{hp:42,speed:1.75,color:"#00cccc",reward:12},
  shield:{hp:105,speed:1.05,color:"blue",reward:16},
  runner:{hp:52,speed:2.55,color:"#ff66aa",reward:14},
  healer:{hp:95,speed:1.0,color:"purple",reward:20},
  boss:{hp:550,speed:0.68,color:"black",reward:90}
};

// ---------------- WAVES ----------------
const WAVES = [
  [["grunt",10]],
  [["grunt",14],["fast",6]],
  [["grunt",15],["boss",1]]
];

// ---------------- CLASS ENEMY ----------------
class Enemy {
  constructor(type){
    const s = ENEMY[type];
    this.type = type;
    this.x = path[0].x;
    this.y = path[0].y;
    this.i = 0;
    this.hp = s.hp;
    this.maxHp = s.hp;
    this.speed = s.speed;
    this.color = s.color;
    this.reward = s.reward;
    this.dead = false;
  }

  update(){
    const t = path[this.i+1];
    if(!t){ life--; this.dead=true; return; }

    let dx=t.x-this.x;
    let dy=t.y-this.y;
    let d=Math.hypot(dx,dy);

    if(d<this.speed){
      this.i++;
    } else {
      this.x += dx/d*this.speed;
      this.y += dy/d*this.speed;
    }
  }

  draw(){
    ctx.fillStyle=this.color;
    ctx.fillRect(this.x-10,this.y-10,20,20);

    ctx.fillStyle="green";
    ctx.fillRect(this.x-15,this.y-20,30*(this.hp/this.maxHp),4);
  }
}

// ---------------- TOWER ----------------
class Tower {
  constructor(x,y,type){
    this.x=x;
    this.y=y;
    this.type=type;
    this.cd=0;

    if(type==="archer"){
      this.range=145; this.dmg=18; this.rate=34;
    }
    if(type==="cannon"){
      this.range=110; this.dmg=32; this.rate=60;
    }
    if(type==="frost"){
      this.range=125; this.dmg=10; this.rate=44;
    }
  }

  update(){
    if(this.cd>0){this.cd--;return;}

    let target = enemies.find(e =>
      Math.hypot(e.x-this.x,e.y-this.y)<this.range
    );

    if(target){
      projectiles.push(new Projectile(this.x,this.y,target,this.dmg,this.type));
      this.cd=this.rate;
    }
  }

  draw(){
    ctx.fillStyle="white";
    ctx.fillRect(this.x-15,this.y-15,30,30);
  }
}

// ---------------- PROJECTILE ----------------
class Projectile {
  constructor(x,y,target,dmg,type){
    this.x=x;
    this.y=y;
    this.target=target;
    this.dmg=dmg;
    this.type=type;
    this.dead=false;
  }

  update(){
    if(!this.target) return;

    let dx=this.target.x-this.x;
    let dy=this.target.y-this.y;
    let d=Math.hypot(dx,dy);

    this.x+=dx/d*5;
    this.y+=dy/d*5;

    if(d<10){
      this.target.hp-=this.dmg;
      if(this.target.hp<=0){
        gold+=this.target.reward;
        this.target.dead=true;
      }
      this.dead=true;
    }
  }

  draw(){
    ctx.fillStyle="yellow";
    ctx.fillRect(this.x,this.y,5,5);
  }
}

// ---------------- INPUT ----------------
canvas.addEventListener("click",e=>{
  towers.push(new Tower(e.offsetX,e.offsetY,selected));
  gold-=70;
});

function selectTower(t){ selected=t; }

// ---------------- WAVES ----------------
function spawnWave(){
  if(waveIndex>=WAVES.length) return;

  let wave=WAVES[waveIndex];

  wave.forEach(([type,count])=>{
    for(let i=0;i<count;i++){
      setTimeout(()=>enemies.push(new Enemy(type)),i*400);
    }
  });

  waveIndex++;
}

setInterval(spawnWave,6000);

// ---------------- LOOP ----------------
function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // path
  ctx.strokeStyle="white";
  ctx.lineWidth=10;
  ctx.beginPath();
  ctx.moveTo(path[0].x,path[0].y);
  path.forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.stroke();

  towers.forEach(t=>t.update());
  towers.forEach(t=>t.draw());

  enemies.forEach(e=>e.update());
  enemies.forEach(e=>e.draw());
  enemies=enemies.filter(e=>!e.dead && e.hp>0);

  projectiles.forEach(p=>p.update());
  projectiles.forEach(p=>p.draw());
  projectiles=projectiles.filter(p=>!p.dead);

  ctx.fillStyle="white";
  ctx.fillText("Gold: "+gold,20,20);
  ctx.fillText("Life: "+life,20,40);
  ctx.fillText("Wave: "+waveIndex,20,60);

  requestAnimationFrame(loop);
}
loop();