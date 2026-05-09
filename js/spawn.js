function spawnEnemyAt(type,x,y){
  const sc=1+gameTime/400;
  const e={id:++eid,x,y,hp:type.hp*sc,maxHp:type.hp*sc,spd:type.spd,dmg:type.dmg*sc,
    r:type.r,col:type.col,xpV:type.xpV,xpC:type.xpC,flash:0,dead:false,name:type.name,ang:0,
    dying:false,dyingT:0,shakeX:0,shakeY:0,leanAng:0,leanVel:0};
  if(type.name==='Ram Rusher'){e.chargeState='idle';e.chargeT=1+Math.random()*2;e.chargeDx=0;e.chargeDy=0;e.chargeTimeLeft=0;}
  if(type.name==='Egg Chucker'){e.eggT=1+Math.random()*1.5;}
  enemies.push(e);
}

function spawnEnemy(){
  const eligible=ETYPES.filter(t=>t.wave<=wave);
  const type=eligible[Math.floor(Math.random()*eligible.length)];
  const ang=Math.random()*Math.PI*2,dist=460+Math.random()*100;
  const x=Math.max(50,Math.min(WORLD-50,pl.x+Math.cos(ang)*dist));
  const y=Math.max(50,Math.min(WORLD-50,pl.y+Math.sin(ang)*dist));
  spawnEnemyAt(type,x,y);

  if(type.name==='Cursed Crow'){
    const extras=1+Math.floor(Math.random()*4);
    for(let i=0;i<extras;i++){
      const oa=Math.random()*Math.PI*2,od=12+Math.random()*28;
      spawnEnemyAt(type,
        Math.max(50,Math.min(WORLD-50,x+Math.cos(oa)*od)),
        Math.max(50,Math.min(WORLD-50,y+Math.sin(oa)*od))
      );
    }
  }

  if(type.name==='Corrupt Pig'&&Math.random()<0.20){
    const extras=Math.random()<0.5?1:2;
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
  const cnt=15+Math.floor(gameTime/60)*3;
  for(let i=0;i<cnt;i++) spawnEnemy();
}
