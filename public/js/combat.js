const MAX_PARTICLES=400;

function spawnProj(x,y,vx,vy,dmg,pierce,type,r,col,glow,maxDist=Infinity,aoe=0){
  projs.push({x,y,vx,vy,dmg,pierce,pierced:0,life:2,r,col,glow,type,spin:0,ox:x,oy:y,maxDist,aoe});
}

function hitEnemy(e,dmg){
  if(e.dead)return;
  let mult=(pl.dmgMult||1)*(pl.wLvDmgMult||1)*0.8*(pl.weakenMult||1);
  if(e.marked){mult*=2;e.marked=false;e.markT=0;}
  const actual=Math.max(1,dmg*mult);
  totalDmg+=Math.floor(actual);
  dmgLog.push({t:gameTime,v:actual});
  e.hp-=actual;
  e.flash=.18;
  playEnemyHitDrone();
  dmgNums.push({x:e.x+(Math.random()-.5)*20,y:e.y-e.r-5,val:Math.floor(actual),life:.7,vy:-60});
  if(pl.plagueBearer)e.poison=Math.min(3,(e.poison||0)+1);
  if(e.hp<=0)killEnemy(e);
}

function killEnemy(e){
  if(e.name==='Shambling Sheep'&&!e.dying){
    e.hp=0;e.dying=true;e.dyingT=0.8;return;
  }
  if(e.name==='Swamp Snail'){
    burst(e.x,e.y,'#44cc44',20);burst(e.x,e.y,'#88ff88',10);
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2,d=20+Math.random()*25;
      snailTrails.push({x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d,r:22+Math.random()*10,life:8,maxLife:8});
    }
  }
  e.dead=true;kills++;
  if(gameTime>=300){
    xpGems.push({x:e.x+(Math.random()-.5)*18,y:e.y+(Math.random()-.5)*18,v:e.xpC*e.xpV,r:8,life:20,col:'#44aaff',glow:'#2266ee'});
  }else{
    for(let i=0;i<e.xpC;i++) xpGems.push({x:e.x+(Math.random()-.5)*18,y:e.y+(Math.random()-.5)*18,v:e.xpV,r:e.xpV>3?7:5,life:20});
  }
  if(Math.random()<.008) hpDrops.push({x:e.x,y:e.y});
  if(Math.random()<.003) magnetDrops.push({x:e.x,y:e.y});
  deathBurst(e.x,e.y,e.col);
  if(pl.carrionCall){
    for(const n of enemies){
      if(!n.dead&&n!==e&&Math.hypot(n.x-e.x,n.y-e.y)<160){n.marked=true;n.markT=5;}
    }
  }
  if(pl.plagueBearer&&(e.poison||0)>=3){
    burst(e.x,e.y,'#44ff44',16);
    for(const n of enemies){
      if(!n.dead&&n!==e&&Math.hypot(n.x-e.x,n.y-e.y)<100)
        n.poison=Math.min(3,(n.poison||0)+2);
    }
  }
  if(e.name==='Corrupt Pig'&&!e.ghost){
    const cnt=1;
    for(let i=0;i<cnt;i++){
      const ga=Math.random()*Math.PI*2;
      enemies.push({id:++eid,x:e.x+Math.cos(ga)*14,y:e.y+Math.sin(ga)*14,
        hp:8,maxHp:8,spd:42,dmg:4,r:6,col:'#7799bb',
        xpV:1,xpC:1,flash:0,dead:false,name:'Ghost Pig',ang:0,
        dying:false,dyingT:0,shakeX:0,shakeY:0,ghost:true});
    }
  }
}

function hitSeal(s,dmg){
  const actual=Math.max(1,dmg*(pl.dmgMult||1)*(pl.wLvDmgMult||1)*0.8);
  s.hp-=actual;
  s.flash=.18;
  totalDmg+=Math.floor(actual);
  dmgLog.push({t:gameTime,v:actual});
  dmgNums.push({x:s.x+(Math.random()-.5)*30,y:s.y-35,val:Math.floor(actual),life:.7,vy:-60});
  if(s.hp<=0)killSeal(s);
}

function killSeal(s){
  s.dead=true;
  burst(s.x,s.y,'#aa44ff',28);burst(s.x,s.y,'#dd88ff',18);burst(s.x,s.y,'#ffffff',10);
  auras.push({x:s.x,y:s.y,r:0,maxR:90,life:.4,maxLife:.4,rgb:'170,68,255'});
  shake.t=.5;
  if(gameTime>=300){
    for(let i=0;i<3;i++) xpGems.push({x:s.x+(Math.random()-.5)*50,y:s.y+(Math.random()-.5)*50,v:17,r:9,life:20,col:'#44aaff',glow:'#2266ee'});
  }else{
    for(let i=0;i<10;i++) xpGems.push({x:s.x+(Math.random()-.5)*50,y:s.y+(Math.random()-.5)*50,v:5,r:7,life:20});
  }
  hpDrops.push({x:s.x,y:s.y});
}

function burst(x,y,col,n){
  if(particles.length>=MAX_PARTICLES)return;
  const add=Math.min(n,MAX_PARTICLES-particles.length);
  for(let i=0;i<add;i++){
    const a=Math.random()*Math.PI*2,spd=60+Math.random()*120;
    particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:.4+Math.random()*.3,maxLife:.6,r:2+Math.random()*3,col});
  }
}

function deathBurst(x,y,col){
  if(particles.length>=MAX_PARTICLES)return;
  // Chunky gore blobs
  const chunks=Math.min(14,MAX_PARTICLES-particles.length);
  for(let i=0;i<chunks;i++){
    const a=Math.random()*Math.PI*2,spd=100+Math.random()*240;
    const life=.5+Math.random()*.6;
    particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life,maxLife:life,r:3.5+Math.random()*5,col,glow:col});
  }
  // Fine high-velocity spray
  const spray=Math.min(9,MAX_PARTICLES-particles.length);
  for(let i=0;i<spray;i++){
    const a=Math.random()*Math.PI*2,spd=180+Math.random()*320;
    const life=.22+Math.random()*.28;
    particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life,maxLife:life,r:1+Math.random()*2,col,glow:col});
  }
  // Impact ring
  auras.push({x,y,r:0,maxR:44,life:.18,maxLife:.18,rgb:_hexRgb(col)});
}

function _hexRgb(h){
  return parseInt(h.slice(1,3),16)+','+parseInt(h.slice(3,5),16)+','+parseInt(h.slice(5,7),16);
}
