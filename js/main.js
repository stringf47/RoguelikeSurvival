const CHEST_FILL_R=80;
const CHEST_FILL_RATE=0.25;
const CHEST_DRAIN_RATE=0.6;

function activateSealBuff(){
  if(sealBuffActive)return;
  sealBuffActive=true;sealBuffT=60;
  for(const e of enemies){
    if(e.dead||e.sealBuffed)continue;
    e.sealBuffed=true;
    e.spd=Math.round(e.spd*1.4);
    e.dmg=Math.ceil(e.dmg*1.4);
    e.maxHp=Math.ceil(e.maxHp*1.25);
    e.hp=Math.min(e.hp*1.25,e.maxHp);
  }
  shake.t=.9;
  burst(pl.x,pl.y,'#aa44ff',20);burst(pl.x,pl.y,'#ff2244',14);
  auras.push({x:pl.x,y:pl.y,r:0,maxR:400,life:.6,maxLife:.6,rgb:'170,68,255'});
}

function spawnSeal(){
  let x,y;
  for(let i=0;i<16;i++){
    x=200+Math.random()*(WORLD-400);
    y=200+Math.random()*(WORLDH-400);
    if(Math.hypot(x-pl.x,y-pl.y)>400)break;
  }
  const iter=Math.max(0,Math.floor((gameTime-60)/120));
  const hp=(200+wave*150)*2;
  sealSpottedT=2;
  seals.push({x,y,id:++eid,timeLeft:60,hp,maxHp:hp,flash:0,fireT:1.5,
    type:'ss',iteration:iter,spinAngle:0,dead:false,isSeal:true});
}

function spawnCrimsonCross(){
  let x,y;
  for(let i=0;i<16;i++){
    x=200+Math.random()*(WORLD-400);
    y=200+Math.random()*(WORLDH-400);
    if(Math.hypot(x-pl.x,y-pl.y)>400)break;
  }
  const iter=Math.max(0,Math.floor((gameTime-180)/120));
  const hp=(200+wave*150)*2;
  const debuffs=['weakening','slow','bleed'];
  const debuff=debuffs[Math.floor(Math.random()*debuffs.length)];
  ccSpottedT=2;
  seals.push({x,y,id:++eid,timeLeft:60,hp,maxHp:hp,flash:0,
    type:'cc',iteration:iter,debuff,orbitAngle:0,fireT:0,dead:false,isSeal:true});
}

function activateCrimsonCrossBuff(debuff){
  if(crimsonCrossBuffActive)return;
  crimsonCrossBuffActive=true;crimsonCrossBuffT=60;crimsonCrossDebuff=debuff;
  shake.t=.9;
  burst(pl.x,pl.y,'#cc1111',20);burst(pl.x,pl.y,'#ff4422',14);
  auras.push({x:pl.x,y:pl.y,r:0,maxR:400,life:.6,maxLife:.6,rgb:'220,17,17'});
}

function spawnChest(){
  let x,y;
  for(let i=0;i<16;i++){
    x=200+Math.random()*(WORLD-400);
    y=200+Math.random()*(WORLDH-400);
    if(Math.hypot(x-pl.x,y-pl.y)>1200)break;
  }
  chests.push({x,y,id:++eid,done:false,fill:0});
}

function triggerDeath(){
  pl.hp=0;state='gameover';
  playDeathSound();
  document.getElementById('goScreen').classList.remove('hidden');
  document.getElementById('goT').textContent='Survived: '+fmt(gameTime);
  document.getElementById('goK').textContent='Enemies Slain: '+kills;
  document.getElementById('goLv').textContent='Level Reached: '+pl.level;
  document.getElementById('goDmg').textContent='Total Damage: '+(totalDmg>=1000?(totalDmg/1000).toFixed(1)+'k':totalDmg);
  document.getElementById('goXp').textContent='XP Collected: '+totalXp;
  document.getElementById('goDps').textContent='Avg DPS: '+Math.floor(totalDmg/gameTime);
}

function checkPlayerDeath(){
  if(pl.hp>0)return;
  if(pl.finalStand&&!pl.finalStandUsed){
    pl.finalStandUsed=true;pl.hp=1;pl.iframes=3;pl.finalStandRecoverT=2.0;
    burst(pl.x,pl.y,'#ffffff',25);burst(pl.x,pl.y,'#ff6688',15);shake.t=.6;
    return;
  }
  triggerDeath();
}

function initPlayer(){
  pl={x:WORLD/2,y:WORLDH/2,hp:210,maxHp:210,speed:200,level:1,xp:0,xpNext:10,
      armor:0,regen:1,regenT:0,magnet:80,iframes:0,lastAngle:0,weapons:[],passives:{},infected:0,infectedT:0,
      rangeMult:1.0,dmgMult:1.0,atkSpeedMult:1.0,wAtkMult:{},wDmgMult:{},wLvDmgMult:1,wLvAtkMult:1,
      leanAng:0,leanVel:0,vx:0,vy:0,weakenedT:0,weakenMult:1,slowedT:0,bleedT:0};
  addWeapon('wand');
}

function update(dt){
  if(state!=='playing'||paused)return;
  gameTime+=dt;
  if(sealSpottedT>0)sealSpottedT-=dt;
  if(ccSpottedT>0)ccSpottedT-=dt;
  let _hasSS=0,_hasCC=0;
  for(const s of seals){if(!s.dead){if(s.type==='ss')_hasSS=1;else _hasCC=1;}}
  sealVignette+=(_hasSS-sealVignette)*Math.min(1,dt*1.8);
  crimsonVignette+=(_hasCC-crimsonVignette)*Math.min(1,dt*1.8);
  if(sealBuffActive&&sealBuffT>0){sealBuffT-=dt;if(sealBuffT<=0){sealBuffActive=false;sealBuffT=0;}}
  if(crimsonCrossBuffActive&&crimsonCrossBuffT>0){crimsonCrossBuffT-=dt;if(crimsonCrossBuffT<=0){crimsonCrossBuffActive=false;crimsonCrossBuffT=0;crimsonCrossDebuff='';}}
  if((pl.weakenedT||0)>0){pl.weakenedT-=dt;pl.weakenMult=0.7;}else{pl.weakenMult=1;}
  if((pl.slowedT||0)>0)pl.slowedT-=dt;
  if((pl.bleedT||0)>0){
    pl.bleedT-=dt;pl.hp-=6*dt;
    if(Math.random()<dt*10&&particles.length<MAX_PARTICLES)
      particles.push({x:pl.x+(Math.random()-.5)*14,y:pl.y+(Math.random()-.5)*10,
        vx:(Math.random()-.5)*12,vy:20+Math.random()*18,
        life:.3+Math.random()*.2,maxLife:.5,r:1.5+Math.random()*1.5,col:'#cc1111'});
    checkPlayerDeath();
  }
  if(dmgLog.length>120){for(let _i=dmgLog.length-1;_i>=0;_i--)if(dmgLog[_i].t<gameTime-10)dmgLog.splice(_i,1);}

  if(gameTime>=WIN_TIME&&!endless){
    state='win';
    document.getElementById('winScreen').classList.remove('hidden');
    document.getElementById('winT').textContent='Survived: '+fmt(gameTime);
    document.getElementById('winK').textContent='Enemies Slain: '+kills;
    document.getElementById('winLv').textContent='Level Reached: '+pl.level;
    document.getElementById('winDmg').textContent='Total Damage: '+(totalDmg>=1000?(totalDmg/1000).toFixed(1)+'k':totalDmg);
    document.getElementById('winXp').textContent='XP Collected: '+totalXp;
    document.getElementById('winDps').textContent='Avg DPS: '+Math.floor(totalDmg/gameTime);
    return;
  }

  wave=Math.min(ETYPES.length-1,Math.floor(gameTime/120));
  bgWave+=(wave-bgWave)*Math.min(1,dt*1.2);
  enemyDmgMult=gameTime>=450?2:gameTime>=300?1.5:1;
  for(const m of HORDE_TIMES){if(!hordeT[m]&&gameTime>=m*60){hordeT[m]=1;spawnHorde();}}

  // Chest: spawn one every 2 minutes
  const chestDue=Math.floor(gameTime/120);
  if(chestDue>chestSpawnIdx){chestSpawnIdx=chestDue;spawnChest();}

  // SS: 1,5,9... min  CC: 3,7,11... min  (each type every 4 min, alternating)
  if(gameTime>=60&&seals.length===0){
    const ssDue=1+Math.floor((gameTime-60)/240);
    if(ssDue>sealSpawnIdx){sealSpawnIdx=ssDue;spawnSeal();}
  }
  if(gameTime>=180&&seals.length===0){
    const ccDue=1+Math.floor((gameTime-180)/240);
    if(ccDue>ccSpawnIdx){ccSpawnIdx=ccDue;spawnCrimsonCross();}
  }
  for(const s of seals){
    if(s.dead)continue;
    s.timeLeft-=dt;
    if(s.timeLeft<=0){
      s.dead=true;
      if(s.type==='cc')activateCrimsonCrossBuff(s.debuff);
      else activateSealBuff();
      continue;
    }
    s.flash=Math.max(0,s.flash-dt);
    if(s.type==='cc'){
      const iter=s.iteration||0;
      const numPts=Math.min(6,2+Math.floor(iter/2));
      const fireInterval=Math.max(0.1,0.25-iter*0.02);
      const orbitSpd=1.2+iter*0.18;
      const spd=160+iter*22;
      const dmg=12+iter*7;
      s.orbitAngle+=orbitSpd*dt;
      s.fireT-=dt;
      if(s.fireT<=0){
        s.fireT=fireInterval;
        for(let i=0;i<numPts;i++){
          const a=s.orbitAngle+(i/numPts)*Math.PI*2;
          const ox=s.x+Math.cos(a)*38,oy=s.y+Math.sin(a)*38;
          sealProjs.push({x:ox,y:oy,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg,r:6,life:4,crimson:true});
        }
      }
    }else{
      s.fireT-=dt;
      if(s.fireT<=0){
        const iter=s.iteration||0;
        const shots=4+iter;
        const fireInterval=Math.max(0.9,2.0-iter*0.25);
        s.fireT=fireInterval;
        const spd=140+iter*28;
        const dmg=16+iter*10;
        s.spinAngle+=Math.PI*2/shots*0.5;
        for(let i=0;i<shots;i++){
          const a=s.spinAngle+(i/shots)*Math.PI*2;
          sealProjs.push({x:s.x,y:s.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg,r:7,life:5});
        }
      }
    }
  }
  for(let _i=seals.length-1;_i>=0;_i--){if(seals[_i].dead||seals[_i].timeLeft<=0){seals[_i]=seals[seals.length-1];seals.pop();}}

  // Seal contact damage
  for(const s of seals){
    if(s.dead)continue;
    if(pl.iframes<=0&&Math.hypot(pl.x-s.x,pl.y-s.y)<22){
      const dmg=Math.max(1,20-pl.armor);
      pl.hp-=dmg;pl.iframes=.55;shake.t=.3;
      playHitSound();
      burst(pl.x,pl.y,s.type==='cc'?'#ff2222':'#aa44ff',5);
      checkPlayerDeath();
    }
  }

  // Chest fill logic
  for(const c of chests){
    const d=Math.hypot(pl.x-c.x,pl.y-c.y);
    if(d<CHEST_FILL_R){
      c.fill=Math.min(1,c.fill+CHEST_FILL_RATE*dt);
      if(c.fill>=1){
        c.done=true;
        burst(c.x,c.y,'#ffcc44',24);burst(c.x,c.y,'#ff8800',14);burst(c.x,c.y,'#ffffff',8);
        openChest();
      }
    } else {
      c.fill=Math.max(0,c.fill-CHEST_DRAIN_RATE*dt);
    }
  }
  for(let _i=chests.length-1;_i>=0;_i--)if(chests[_i].done){chests[_i]=chests[chests.length-1];chests.pop();}

  if(pl.regen){pl.regenT+=dt;if(pl.regenT>=1){pl.regenT-=1;pl.hp=Math.min(pl.maxHp,pl.hp+pl.regen);}}
  if(pl.infected>0){
    pl.infectedT-=dt;
    pl.hp-=pl.infected*2*dt;
    if(pl.infectedT<=0)pl.infected=0;
    if(Math.random()<dt*pl.infected*4&&particles.length<MAX_PARTICLES)
      particles.push({x:pl.x+(Math.random()-.5)*18,y:pl.y+(Math.random()-.5)*14,
        vx:(Math.random()-.5)*15,vy:18+Math.random()*25,
        life:.35+Math.random()*.2,maxLife:.55,r:1.5+Math.random()*1.5,col:'#55cc22'});
    checkPlayerDeath();
  }

  const{dx,dy}=getDir();
  const slowMult=(pl.slowedT||0)>0?0.8:1;
  if(!playerFrozen){
    const tvx=dx*pl.speed*slowMult*1.2,tvy=dy*pl.speed*slowMult*0.9;
    const rateX=(pl.vx||0)*tvx>=0?18:1.8;
    const rateY=(pl.vy||0)*tvy>=0?18:3.5;
    pl.vx=(pl.vx||0)+(tvx-(pl.vx||0))*rateX*dt;
    pl.vy=(pl.vy||0)+(tvy-(pl.vy||0))*rateY*dt;
    pl.x+=pl.vx*dt;pl.y+=pl.vy*dt;
  }
  const targetLean=(pl.vx||0)/pl.speed*0.10;
  pl.leanVel+=(targetLean-pl.leanAng)*220*dt-pl.leanVel*20*dt;
  pl.leanAng+=pl.leanVel*dt;
  pl.x=Math.max(20,Math.min(WORLD-20,pl.x));
  pl.y=Math.max(20,Math.min(WORLDH-20,pl.y));
  if(pl.iframes>0)pl.iframes-=dt;

  cam.x=pl.x-W/2;cam.y=pl.y-H/2;

  if(shake.t>0){shake.t-=dt;shake.x=(Math.random()-.5)*6*shake.t;shake.y=(Math.random()-.5)*6*shake.t;}
  else shake.x=shake.y=0;

  if(pl.finalStandRecoverT>0){
    pl.finalStandRecoverT-=dt;
    if(pl.finalStandRecoverT<=0){
      pl.finalStandRecoverT=0;
      pl.hp=Math.max(pl.hp,Math.floor(pl.maxHp*.3));
      burst(pl.x,pl.y,'#ff6688',16);burst(pl.x,pl.y,'#ffffff',10);
    }
  }

  if(pl.unholyGround){
    pl.zoneDropT=(pl.zoneDropT||0)+dt;
    if((dx||dy)&&pl.zoneDropT>=0.35){pl.zoneDropT=0;corruptedZones.push({x:pl.x,y:pl.y,r:55,life:3.5,maxLife:3.5});}
  }
  for(let _i=corruptedZones.length-1;_i>=0;_i--){corruptedZones[_i].life-=dt;if(corruptedZones[_i].life<=0){corruptedZones[_i]=corruptedZones[corruptedZones.length-1];corruptedZones.pop();}}

  spawnT+=dt;
  const spawnRate=Math.max(1.0,2.8-gameTime/200);
  const batchSize=Math.min(2,1+Math.floor(gameTime/240));
  if(enemies.length>75){
    enemies.sort((a,b)=>Math.hypot(b.x-pl.x,b.y-pl.y)-Math.hypot(a.x-pl.x,a.y-pl.y));
    enemies.splice(0,enemies.length-75);
  }
  if(spawnT>=spawnRate&&enemies.length<75){spawnT-=spawnRate;for(let i=0;i<batchSize;i++)spawnEnemy();}

  for(const w of pl.weapons) WDEFS[w.type].fire(w,dt);

  for(const e of enemies){
    if(e.dead)continue;
    if(e.flash>0)e.flash-=dt;

    if(e.dying){
      e.dyingT-=dt;
      e.shakeX=(Math.random()-.5)*10;
      e.shakeY=(Math.random()-.5)*10;
      if(Math.random()<0.4&&particles.length<MAX_PARTICLES){
        particles.push({x:e.x+(Math.random()-.5)*e.r*1.5,y:e.y+(Math.random()-.5)*e.r*1.5,
          vx:(Math.random()-.5)*18,vy:22+Math.random()*30,
          life:0.25+Math.random()*0.2,maxLife:0.45,r:1.5+Math.random()*2,col:'#44ff88'});
      }
      if(e.dyingT<=0){
        toxicClouds.push({x:e.x,y:e.y,r:0,maxR:55,life:4.0,maxLife:4.0,dmgT:0});
        burst(e.x,e.y,'#44ff88',16);
        e.dead=true;kills++;
        for(let i=0;i<e.xpC;i++) xpGems.push({x:e.x+(Math.random()-.5)*18,y:e.y+(Math.random()-.5)*18,v:e.xpV,r:e.xpV>3?7:5});
        if(Math.random()<.008) hpDrops.push({x:e.x,y:e.y});
        if(Math.random()<.003) magnetDrops.push({x:e.x,y:e.y});
      }
      continue;
    }

    const ex=pl.x-e.x,ey=pl.y-e.y,ed=Math.hypot(ex,ey);
    e.ang+=dt*1.5;
    if(e.marked&&(e.markT-=dt)<=0)e.marked=false;
    if(e.poison>0){
      e.poisonT=(e.poisonT||0)+dt;
      if(e.poisonT>=0.5){e.poisonT-=0.5;hitEnemy(e,e.poison*5);}
    }

    let sm=1;if(pl.unholyGround){for(const z of corruptedZones){const _dx=e.x-z.x,_dy=e.y-z.y;if(_dx*_dx+_dy*_dy<z.r*z.r){sm=.6;break;}}}

    if(e.name==='Ram Rusher'){
      if(e.chargeState==='charging'){
        e.x+=e.chargeDx*190*sm*dt;e.y+=e.chargeDy*190*sm*dt;
        e.chargeTimeLeft-=dt;
        if(e.chargeTimeLeft<=0){e.chargeState='idle';e.chargeT=2+Math.random()*2;}
      }else if(e.chargeState==='telegraphing'){
        e.chargeT-=dt;
        if(e.chargeT<=0){e.chargeState='charging';e.chargeTimeLeft=1.6;burst(e.x,e.y,'#ff4400',10);}
      }else{
        if(ed>0){e.x+=(ex/ed)*e.spd*sm*dt;e.y+=(ey/ed)*e.spd*sm*dt;}
        e.chargeT-=dt;
        if(e.chargeT<=0&&ed<420){
          e.chargeState='telegraphing';e.chargeT=0.65;
          if(ed>0){e.chargeDx=ex/ed;e.chargeDy=ey/ed;}
        }
      }
    }else if(e.name==='Skeletal Scarecrow'){
      if((e.appearT||0)>0)e.appearT=Math.max(0,e.appearT-dt);
      if(e.zonePhase===null){
        e.teleportT-=dt;
        if(e.teleportT<=0){
          const ta=Math.random()*Math.PI*2,td=90+Math.random()*110;
          e.x=Math.max(60,Math.min(WORLD-60,pl.x+Math.cos(ta)*td));
          e.y=Math.max(60,Math.min(WORLDH-60,pl.y+Math.sin(ta)*td));
          e.zoneX=e.x;e.zoneY=e.y;e.appearT=0.5;
          e.zonePhase='telegraph';e.zoneT=1.8;
          burst(e.x,e.y,'#c8c4a0',14);
          auras.push({x:e.x,y:e.y,r:0,maxR:80,life:.35,maxLife:.35,rgb:'200,196,160'});
        }
      }else{
        e.zoneT-=dt;
        if(e.zonePhase==='telegraph'&&e.zoneT<=0){
          e.zonePhase='active';e.zoneT=0.25;
          if(pl.iframes<=0&&Math.hypot(pl.x-e.zoneX,pl.y-e.zoneY)<120){
            const dmg=Math.max(1,e.dmg*enemyDmgMult-pl.armor);
            pl.hp-=dmg;pl.iframes=.7;shake.t=.45;
            playHitSound();burst(pl.x,pl.y,'#ff2222',10);checkPlayerDeath();
          }
        }else if(e.zonePhase==='active'&&e.zoneT<=0){
          e.zonePhase='fade';e.zoneT=1.5;
        }else if(e.zonePhase==='fade'&&e.zoneT<=0){
          e.zonePhase=null;e.teleportT=2.5+Math.random()*2;
        }
      }
    }else{
      if(ed>0){e.x+=(ex/ed)*e.spd*sm*dt;e.y+=(ey/ed)*e.spd*sm*dt;}
    }

    if((e.kbT||0)>0){
      e.x+=(e.kbVx||0)*dt; e.y+=(e.kbVy||0)*dt;
      e.kbVx=(e.kbVx||0)*.78; e.kbVy=(e.kbVy||0)*.78;
      e.kbT-=dt;
    }

    const eLean=ed>0?(ex/ed)*0.20:0;
    e.leanVel+=(eLean-e.leanAng)*55*dt-e.leanVel*9*dt;
    e.leanAng+=e.leanVel*dt;

    if(pl.iframes<=0&&ed<e.r+14){
      const dmg=Math.max(1,e.dmg*enemyDmgMult-pl.armor);
      pl.hp-=dmg;pl.iframes=.55;shake.t=.3;
      playHitSound();
      burst(pl.x,pl.y,'#ff2222',5);
      if(e.name==='Plague Rat'){pl.infected=Math.min(5,pl.infected+1);pl.infectedT=4;}
      if(crimsonCrossBuffActive){
        if(crimsonCrossDebuff==='weakening')pl.weakenedT=4;
        else if(crimsonCrossDebuff==='slow')pl.slowedT=4;
        else if(crimsonCrossDebuff==='bleed')pl.bleedT=5;
      }
      if(pl.martyrdom){
        const thornDmg=Math.max(dmg*1.5,15);
        for(const ne of enemies){if(!ne.dead&&Math.hypot(pl.x-ne.x,pl.y-ne.y)<130)hitEnemy(ne,thornDmg);}
        auras.push({x:pl.x,y:pl.y,r:0,maxR:130,life:.3,maxLife:.3,rgb:'255,30,80'});
      }
      checkPlayerDeath();
    }
  }
  for(let _i=enemies.length-1;_i>=0;_i--)if(enemies[_i].dead){enemies[_i]=enemies[enemies.length-1];enemies.pop();}

  for(const tc of toxicClouds){
    tc.life-=dt;
    if(tc.r<tc.maxR)tc.r=Math.min(tc.maxR,tc.r+tc.maxR*(dt/0.5));
    tc.dmgT-=dt;
    if(tc.dmgT<=0){
      tc.dmgT=0.5;
      if(Math.hypot(pl.x-tc.x,pl.y-tc.y)<tc.r+10&&pl.iframes<=0){
        const dmg=Math.max(1,8-pl.armor);
        pl.hp-=dmg;pl.iframes=.3;
        playHitSound();
        burst(pl.x,pl.y,'#44ff88',3);checkPlayerDeath();
      }
    }
  }
  for(let _i=toxicClouds.length-1;_i>=0;_i--)if(toxicClouds[_i].life<=0){toxicClouds[_i]=toxicClouds[toxicClouds.length-1];toxicClouds.pop();}

  for(const p of projs){
    p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.type==='axe'){p.spin+=dt*9;p.vy+=220*dt;}
    if(p.type==='flame'&&particles.length<MAX_PARTICLES){
      for(let i=0;i<3;i++){
        particles.push({x:p.x+(Math.random()-.5)*p.r*1.5,y:p.y+(Math.random()-.5)*p.r*1.5,
          vx:(Math.random()-.5)*45,vy:(Math.random()-.5)*45-20,
          life:.14+Math.random()*.12,maxLife:.26,r:2+Math.random()*4,
          col:Math.random()>.4?'#ff5500':'#ffaa00'});
      }
    }
    if(Math.hypot(p.x-p.ox,p.y-p.oy)>p.maxDist){p.life=-1;continue;}
    for(const e of enemies){
      if(e.dead)continue;
      if(Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r){
        hitEnemy(e,p.dmg);
        if(p.aoe>0){
          for(const ne of enemies){
            if(ne.dead||ne===e)continue;
            if(Math.hypot(p.x-ne.x,p.y-ne.y)<p.aoe+ne.r)hitEnemy(ne,p.dmg*0.4);
          }
          burst(p.x,p.y,p.col,4);
        }
        p.pierced++;
        if(p.pierced>p.pierce){p.life=-1;break;}
      }
    }
    if(p.life>0){
      for(const s of seals){
        if(s.dead)continue;
        if(Math.hypot(p.x-s.x,p.y-s.y)<30+p.r){
          hitSeal(s,p.dmg);p.pierced++;
          if(p.pierced>p.pierce){p.life=-1;break;}
        }
      }
    }
  }
  for(let _i=projs.length-1;_i>=0;_i--)if(projs[_i].life<=0){projs[_i]=projs[projs.length-1];projs.pop();}

  for(const sp of sealProjs){
    sp.x+=sp.vx*dt;sp.y+=sp.vy*dt;sp.life-=dt;
    if(particles.length<MAX_PARTICLES&&Math.random()<0.5)
      particles.push({x:sp.x+(Math.random()-.5)*sp.r,y:sp.y+(Math.random()-.5)*sp.r,
        vx:(Math.random()-.5)*25,vy:(Math.random()-.5)*25,
        life:.12+Math.random()*.1,maxLife:.22,r:1.5+Math.random()*3,col:'#9933cc'});
    if(pl.iframes<=0&&Math.hypot(sp.x-pl.x,sp.y-pl.y)<sp.r+14){
      const dmg=Math.max(1,sp.dmg-pl.armor);
      pl.hp-=dmg;pl.iframes=.45;shake.t=.22;
      playHitSound();
      burst(pl.x,pl.y,'#ff2222',5);burst(sp.x,sp.y,'#aa44ff',6);
      sp.life=-1;
      checkPlayerDeath();
    }
  }
  for(let _i=sealProjs.length-1;_i>=0;_i--)if(sealProjs[_i].life<=0){sealProjs[_i]=sealProjs[sealProjs.length-1];sealProjs.pop();}

  for(const a of auras){a.life-=dt;a.r=a.maxR*(1-a.life/a.maxLife);}
  for(let _i=auras.length-1;_i>=0;_i--)if(auras[_i].life<=0){auras[_i]=auras[auras.length-1];auras.pop();}

  for(let _i=lightnings.length-1;_i>=0;_i--){lightnings[_i].life-=dt;if(lightnings[_i].life<=0){lightnings[_i]=lightnings[lightnings.length-1];lightnings.pop();}}

  for(let _i=particles.length-1;_i>=0;_i--){
    const p=particles[_i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    const f=p.friction||.92;p.vx*=f;p.vy*=f;
    if(p.life<=0){particles[_i]=particles[particles.length-1];particles.pop();}
  }
  if(particles.length>MAX_PARTICLES)particles.length=MAX_PARTICLES;

  for(let _i=dmgNums.length-1;_i>=0;_i--){const d=dmgNums[_i];d.y+=d.vy*dt;d.life-=dt;if(d.life<=0){dmgNums[_i]=dmgNums[dmgNums.length-1];dmgNums.pop();}}

  if(vacuumT>0)vacuumT-=dt;

  for(let _i=xpGems.length-1;_i>=0;_i--){
    const g=xpGems[_i];
    const gx=pl.x-g.x,gy=pl.y-g.y,gd2=gx*gx+gy*gy;
    const gd=Math.sqrt(gd2);
    if(vacuumT>0||gd<pl.magnet){const pull=vacuumT>0?1200:Math.min(350,350*(1-gd/pl.magnet)+80);g.x+=(gx/gd)*pull*dt;g.y+=(gy/gd)*pull*dt;}
    if(gd<18){addXP(g.v);xpGems[_i]=xpGems[xpGems.length-1];xpGems.pop();}
  }

  for(let _i=hpDrops.length-1;_i>=0;_i--){
    const h=hpDrops[_i];
    if((pl.x-h.x)*(pl.x-h.x)+(pl.y-h.y)*(pl.y-h.y)<676){pl.hp=Math.min(pl.maxHp,pl.hp+35);playHeartSound();burst(pl.x,pl.y,'#ff4466',8);hpDrops[_i]=hpDrops[hpDrops.length-1];hpDrops.pop();}
  }
  for(let _i=magnetDrops.length-1;_i>=0;_i--){
    const m=magnetDrops[_i];
    if((pl.x-m.x)*(pl.x-m.x)+(pl.y-m.y)*(pl.y-m.y)<676){vacuumT=3.5;playMagnetSound();burst(pl.x,pl.y,'#44ccff',14);burst(pl.x,pl.y,'#aa66ff',10);magnetDrops[_i]=magnetDrops[magnetDrops.length-1];magnetDrops.pop();}
  }

  updateHUD();
}

function loop(ts){
  const dt=Math.min((ts-lastTS)/1000,.05);
  lastTS=ts;
  tickAudio();
  if(state==='playing'||state==='levelup'){update(dt);render();}
  requestAnimationFrame(loop);
}

function _setPause(on){
  document.getElementById('pauseBanner').style.display=on?'flex':'none';
  document.getElementById('pauseDim').style.display=on?'block':'none';
}

function resumeGame(){
  paused=false;
  _setPause(false);
  if(_ready)Tone.Transport.start();
}

function togglePause(){
  if(state!=='playing')return;
  paused=!paused;
  _setPause(paused);
  if(_ready){
    if(paused){
      Tone.Transport.pause();
      const n=Tone.now();
      _combatDroneGain.gain.cancelScheduledValues(n);_combatDroneGain.gain.rampTo(0,0.1);
      _xpDroneGain.gain.cancelScheduledValues(n);_xpDroneGain.gain.rampTo(0,0.1);
      _chestDrone.volume.rampTo(-Infinity,0.1);
    } else Tone.Transport.start();
  }
}

function goEndless(){
  endless=true;state='playing';
  document.getElementById('winScreen').classList.add('hidden');
}

function quitToMenu(){
  state='menu';paused=false;
  _setPause(false);
  ['goScreen','winScreen','lvlScreen'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  document.getElementById('menuScreen').classList.remove('hidden');
}

function startGame(){
  state='playing';gameTime=0;kills=0;pendingLU=0;
  enemies=[];projs=[];xpGems=[];auras=[];particles=[];lightnings=[];hpDrops=[];dmgNums=[];toxicClouds=[];magnetDrops=[];dmgLog=[];
  spawnT=0;hordeT={};sealSpottedT=0;ccSpottedT=0;sealBuffT=0;sealVignette=0;crimsonVignette=0;
  ccSpawnIdx=0;crimsonCrossBuffActive=false;crimsonCrossBuffT=0;crimsonCrossDebuff='';paused=false;wave=0;bgWave=0;totalDmg=0;totalXp=0;vacuumT=0;endless=false;chests=[];chestSpawnIdx=0;seals=[];sealSpawnIdx=0;sealProjs=[];sealBuffActive=false;corruptedZones=[];enemyDmgMult=1;
  _wbSig='';
  joyActivated=false;joyActivatedAt=0;
  _setPause(false);
  ['menuScreen','goScreen','winScreen','lvlScreen'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  // Pick one enemy per class for this run
  const classes={};
  for(const t of ETYPES){
    if(t.cls){if(!classes[t.cls])classes[t.cls]=[];classes[t.cls].push(t);}
  }
  runPool=ETYPES.filter(t=>!t.cls);
  for(const cls in classes){const pool=classes[cls];runPool.push(pool[Math.floor(Math.random()*pool.length)]);}
  initPlayer();spawnChest();updateHUD();initAudio();
  if(Tone.Transport.state!=='started')Tone.Transport.start();
}

lastTS=performance.now();
requestAnimationFrame(loop);

