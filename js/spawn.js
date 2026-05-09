function spawnEnemyAt(type,x,y){
  const sc=1+gameTime/400;
  const bm=sealBuffActive?1.4:1;
  const e={id:++eid,x,y,hp:type.hp*sc*bm,maxHp:type.hp*sc*bm,spd:type.spd*bm,dmg:type.dmg*sc*bm,
    r:type.r,col:type.col,xpV:type.xpV,xpC:type.xpC,flash:0,dead:false,name:type.name,ang:0,
    dying:false,dyingT:0,shakeX:0,shakeY:0,leanAng:0,leanVel:0,sealBuffed:sealBuffActive};
  if(type.name==='Ram Rusher'){e.chargeState='idle';e.chargeT=1+Math.random()*2;e.chargeDx=0;e.chargeDy=0;e.chargeTimeLeft=0;}
  if(type.name==='Skeletal Scarecrow'){e.teleportT=2+Math.random()*1.5;e.zonePhase=null;e.zoneT=0;e.zoneX=e.x;e.zoneY=e.y;e.appearT=0.5;}
  enemies.push(e);
}

function spawnEnemy(){
  const eligible=runPool.filter(t=>{
    if(t.wave>wave)return false;
    if(t.name==='Skeletal Scarecrow'&&enemies.some(e=>!e.dead&&e.name==='Skeletal Scarecrow'))return false;
    return true;
  });

  // After 6 min, fade out wave-1 (cls:'B') mobs and boost Sheep + Rusher over 2 min
  const fade=gameTime>360?Math.min(1,(gameTime-360)/120):0;
  const weights=eligible.map(t=>{
    if(fade>0&&t.cls==='B')return Math.max(0.05,1-fade*0.95);
    if(fade>0&&(t.name==='Shambling Sheep'||t.name==='Ram Rusher'))return 1+fade*2;
    return 1;
  });
  const total=weights.reduce((s,w)=>s+w,0);
  let r=Math.random()*total;
  let type=eligible[eligible.length-1];
  for(let i=0;i<eligible.length;i++){r-=weights[i];if(r<=0){type=eligible[i];break;}}
  const ang=Math.random()*Math.PI*2,dist=460+Math.random()*100;
  const x=Math.max(50,Math.min(WORLD-50,pl.x+Math.cos(ang)*dist));
  const y=Math.max(50,Math.min(WORLD-50,pl.y+Math.sin(ang)*dist));
  spawnEnemyAt(type,x,y);

  if(type.name==='Cursed Crow'){
    const extras=1+Math.floor(Math.random()*2);
    for(let i=0;i<extras;i++){
      const oa=Math.random()*Math.PI*2,od=12+Math.random()*28;
      spawnEnemyAt(type,
        Math.max(50,Math.min(WORLD-50,x+Math.cos(oa)*od)),
        Math.max(50,Math.min(WORLD-50,y+Math.sin(oa)*od))
      );
    }
  }

  if(type.name==='Plague Rat'){
    const extras=2+Math.floor(Math.random()*3);
    for(let i=0;i<extras;i++){
      const oa=Math.random()*Math.PI*2,od=8+Math.random()*22;
      spawnEnemyAt(type,
        Math.max(50,Math.min(WORLD-50,x+Math.cos(oa)*od)),
        Math.max(50,Math.min(WORLD-50,y+Math.sin(oa)*od))
      );
    }
  }

  if(type.name==='Corrupt Pig'&&Math.random()<0.10){
    const extras=1;
    for(let i=0;i<extras;i++){
      const oa=Math.random()*Math.PI*2,od=18+Math.random()*38;
      spawnEnemyAt(type,
        Math.max(50,Math.min(WORLD-50,x+Math.cos(oa)*od)),
        Math.max(50,Math.min(WORLD-50,y+Math.sin(oa)*od))
      );
    }
  }
}

function spawnHorde(){
  const cnt=Math.min(30,8+Math.floor(gameTime/60));
  for(let i=0;i<cnt;i++) spawnEnemy();
}
