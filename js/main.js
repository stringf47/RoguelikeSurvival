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
    y=200+Math.random()*(WORLD-400);
    if(Math.hypot(x-pl.x,y-pl.y)>400)break;
  }
  const w=wave;
  const iter=Math.max(0,sealSpawnIdx-1);
  const hp=(200+w*150)*2;
  sealSpottedT=2;
  seals.push({x,y,id:++eid,timeLeft:60,hp,maxHp:hp,flash:0,fireT:1.5,
    wave:w,iteration:iter,spinAngle:0,dead:false,isSeal:true});
}

function spawnChest(){
  let x,y;
  for(let i=0;i<16;i++){
    x=200+Math.random()*(WORLD-400);
    y=200+Math.random()*(WORLD-400);
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
  pl={x:WORLD/2,y:WORLD/2,hp:150,maxHp:150,speed:160,level:1,xp:0,xpNext:10,
      armor:0,regen:0,regenT:0,magnet:80,iframes:0,lastAngle:0,weapons:[],passives:{},infected:0,infectedT:0,
      rangeMult:1.0,dmgMult:1.0,atkSpeedMult:1.0,wAtkMult:{},wDmgMult:{},wLvDmgMult:1,wLvAtkMult:1,
      leanAng:0,leanVel:0};
  addWeapon('wand');
}

function update(dt){
  if(state!=='playing'||paused)return;
  gameTime+=dt;
  if(sealSpottedT>0)sealSpottedT-=dt;
  if(sealBuffActive&&sealBuffT>0){sealBuffT-=dt;if(sealBuffT<=0){sealBuffActive=false;sealBuffT=0;}}
  if(dmgLog.length>0)dmgLog=dmgLog.filter(d=>d.t>gameTime-10);

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

  // Seal: spawn at 1 min, then every 2 min (1,3,5,7...), only one active at a time
  if(gameTime>=60&&seals.length===0){
    const sealDue=1+Math.floor((gameTime-60)/120);
    if(sealDue>sealSpawnIdx){sealSpawnIdx=sealDue;spawnSeal();}
  }
  for(const s of seals){
    if(s.dead)continue;
    s.timeLeft-=dt;
    if(s.timeLeft<=0){s.dead=true;activateSealBuff();continue;}
    s.flash=Math.max(0,s.flash-dt);
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
  seals=seals.filter(s=>!s.dead&&s.timeLeft>0);

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
  chests=chests.filter(c=>!c.done);

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
  if(!playerFrozen){pl.x+=dx*pl.speed*dt;pl.y+=dy*pl.speed*dt;}
  const targetLean=dx*0.26;
  pl.leanVel+=(targetLean-pl.leanAng)*55*dt-pl.leanVel*9*dt;
  pl.leanAng+=pl.leanVel*dt;
  pl.x=Math.max(20,Math.min(WORLD-20,pl.x));
  pl.y=Math.max(20,Math.min(WORLD-20,pl.y));
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
  for(const z of corruptedZones)z.life-=dt;
  corruptedZones=corruptedZones.filter(z=>z.life>0);

  spawnT+=dt;
  const spawnRate=Math.max(.55,2.8-gameTime/200);
  const batchSize=Math.min(2,1+Math.floor(gameTime/240));
  if(spawnT>=spawnRate&&enemies.length<100){spawnT-=spawnRate;for(let i=0;i<batchSize;i++)spawnEnemy();}

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

    const sm=(pl.unholyGround&&corruptedZones.some(z=>Math.hypot(e.x-z.x,e.y-z.y)<z.r))?.6:1;

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
      if(e.zonePhase===null){
        e.teleportT-=dt;
        if(e.teleportT<=0){
          const ta=Math.random()*Math.PI*2,td=90+Math.random()*110;
          e.x=Math.max(60,Math.min(WORLD-60,pl.x+Math.cos(ta)*td));
          e.y=Math.max(60,Math.min(WORLD-60,pl.y+Math.sin(ta)*td));
          e.zoneX=e.x;e.zoneY=e.y;
          e.zonePhase='telegraph';e.zoneT=1.8;
          burst(e.x,e.y,'#c8c4a0',14);
          auras.push({x:e.x,y:e.y,r:0,maxR:80,life:.35,maxLife:.35,rgb:'200,196,160'});
        }
      }else{
        e.zoneT-=dt;
        if(e.zonePhase==='telegraph'&&e.zoneT<=0){
          e.zonePhase='active';e.zoneT=0.3;
          if(pl.iframes<=0&&Math.hypot(pl.x-e.zoneX,pl.y-e.zoneY)<120){
            const dmg=Math.max(1,e.dmg*enemyDmgMult-pl.armor);
            pl.hp-=dmg;pl.iframes=.7;shake.t=.45;
            playHitSound();burst(pl.x,pl.y,'#ff2222',10);checkPlayerDeath();
          }
        }else if(e.zonePhase==='active'&&e.zoneT<=0){
          e.zonePhase='fade';e.zoneT=0.5;
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
      if(pl.martyrdom){
        const thornDmg=Math.max(dmg*1.5,15);
        for(const ne of enemies){if(!ne.dead&&Math.hypot(pl.x-ne.x,pl.y-ne.y)<130)hitEnemy(ne,thornDmg);}
        auras.push({x:pl.x,y:pl.y,r:0,maxR:130,life:.3,maxLife:.3,rgb:'255,30,80'});
      }
      checkPlayerDeath();
    }
  }
  enemies=enemies.filter(e=>!e.dead);

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
  toxicClouds=toxicClouds.filter(tc=>tc.life>0);

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
        hitEnemy(e,p.dmg);p.pierced++;
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
  projs=projs.filter(p=>p.life>0);

  for(const sp of sealProjs){
    sp.x+=sp.vx*dt;sp.y+=sp.vy*dt;sp.life-=dt;
    if(particles.length<MAX_PARTICLES&&Math.random()<0.65)
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
  sealProjs=sealProjs.filter(sp=>sp.life>0);

  for(const a of auras){a.life-=dt;a.r=a.maxR*(1-a.life/a.maxLife);}
  auras=auras.filter(a=>a.life>0);

  for(const l of lightnings)l.life-=dt;
  lightnings=lightnings.filter(l=>l.life>0);

  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;const f=p.friction||.92;p.vx*=f;p.vy*=f;}
  if(particles.length>MAX_PARTICLES)particles.splice(0,particles.length-MAX_PARTICLES);
  particles=particles.filter(p=>p.life>0);

  for(const d of dmgNums){d.y+=d.vy*dt;d.life-=dt;}
  dmgNums=dmgNums.filter(d=>d.life>0);

  if(vacuumT>0)vacuumT-=dt;

  for(const g of xpGems){
    const gx=pl.x-g.x,gy=pl.y-g.y,gd=Math.hypot(gx,gy);
    if(vacuumT>0||gd<pl.magnet){const pull=vacuumT>0?1200:Math.min(350,350*(1-gd/pl.magnet)+80);g.x+=(gx/gd)*pull*dt;g.y+=(gy/gd)*pull*dt;}
    if(gd<18){addXP(g.v);g.done=true;}
  }
  xpGems=xpGems.filter(g=>!g.done);

  for(const h of hpDrops){
    if(Math.hypot(pl.x-h.x,pl.y-h.y)<26){pl.hp=Math.min(pl.maxHp,pl.hp+35);h.done=true;playHeartSound();burst(pl.x,pl.y,'#ff4466',8);}
  }
  hpDrops=hpDrops.filter(h=>!h.done);

  for(const m of magnetDrops){
    if(Math.hypot(pl.x-m.x,pl.y-m.y)<26){
      m.done=true;vacuumT=3.5;
      playMagnetSound();
      burst(pl.x,pl.y,'#44ccff',14);burst(pl.x,pl.y,'#aa66ff',10);
    }
  }
  magnetDrops=magnetDrops.filter(m=>!m.done);

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
  spawnT=0;hordeT={};sealSpottedT=0;sealBuffT=0;paused=false;wave=0;bgWave=0;totalDmg=0;totalXp=0;vacuumT=0;endless=false;chests=[];chestSpawnIdx=0;seals=[];sealSpawnIdx=0;sealProjs=[];sealBuffActive=false;corruptedZones=[];enemyDmgMult=1;
  _wbSig='';
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
