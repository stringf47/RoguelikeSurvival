const MAX_PARTICLES=400;

function spawnProj(x,y,vx,vy,dmg,pierce,type,r,col,glow,maxDist=Infinity){
  projs.push({x,y,vx,vy,dmg,pierce,pierced:0,life:2,r,col,glow,type,spin:0,ox:x,oy:y,maxDist});
}

function hitEnemy(e,dmg){
  if(e.dead)return;
  let mult=(pl.dmgMult||1)*(pl.wLvDmgMult||1)*0.8;
  if(e.marked){mult*=2;e.marked=false;e.markT=0;}
  const actual=Math.max(1,dmg*mult);
  totalDmg+=Math.floor(actual);
  dmgLog.push({t:gameTime,v:actual});
  e.hp-=actual;
  e.flash=.18;
  dmgNums.push({x:e.x+(Math.random()-.5)*20,y:e.y-e.r-5,val:Math.floor(actual),life:.7,vy:-60});
  if(pl.plagueBearer)e.poison=Math.min(3,(e.poison||0)+1);
  if(e.hp<=0)killEnemy(e);
}

function killEnemy(e){
  if(e.name==='Shambling Sheep'&&!e.dying){
    e.hp=0;e.dying=true;e.dyingT=0.8;return;
  }
  e.dead=true;kills++;
  for(let i=0;i<e.xpC;i++) xpGems.push({x:e.x+(Math.random()-.5)*18,y:e.y+(Math.random()-.5)*18,v:e.xpV,r:e.xpV>3?7:5});
  if(Math.random()<.008) hpDrops.push({x:e.x,y:e.y});
  if(Math.random()<.003) magnetDrops.push({x:e.x,y:e.y});
  burst(e.x,e.y,e.col,10);
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
    const cnt=1+Math.floor(Math.random()*2);
    for(let i=0;i<cnt;i++){
      const ga=Math.random()*Math.PI*2;
      enemies.push({id:++eid,x:e.x+Math.cos(ga)*14,y:e.y+Math.sin(ga)*14,
        hp:8,maxHp:8,spd:42,dmg:4,r:6,col:'#7799bb',
        xpV:1,xpC:1,flash:0,dead:false,name:'Ghost Pig',ang:0,
        dying:false,dyingT:0,shakeX:0,shakeY:0,ghost:true});
    }
  }
}

function burst(x,y,col,n){
  if(particles.length>=MAX_PARTICLES)return;
  const add=Math.min(n,MAX_PARTICLES-particles.length);
  for(let i=0;i<add;i++){
    const a=Math.random()*Math.PI*2,spd=60+Math.random()*120;
    particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:.4+Math.random()*.3,maxLife:.6,r:2+Math.random()*3,col});
  }
}
