const _xpBuckets=new Uint16Array(24); // 6x4 grid

let _now=0;
function render(){
  _now=_now;
  ctx.clearRect(0,0,W,H);
  ctx.save();
  ctx.translate(shake.x-cam.x,shake.y-cam.y);

  drawBG();

  // XP gems
  for(const g of xpGems){
    if(!onScreen(g.x,g.y,20))continue;
    ctx.save();ctx.translate(g.x,g.y);
    ctx.beginPath();ctx.moveTo(0,-g.r);ctx.lineTo(g.r*.6,0);ctx.lineTo(0,g.r);ctx.lineTo(-g.r*.6,0);ctx.closePath();
    ctx.fillStyle='#f0c040';ctx.shadowColor='#c97d2e';ctx.shadowBlur=10;ctx.fill();
    ctx.restore();
  }

  // Magnet drops
  for(const m of magnetDrops){
    if(!onScreen(m.x,m.y,20))continue;
    ctx.save();ctx.translate(m.x,m.y);
    const pulse=.7+Math.sin(_now*.007)*.3;
    ctx.shadowColor='#44ccff';ctx.shadowBlur=18*pulse;
    ctx.strokeStyle=`rgba(100,210,255,${pulse})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,1,7,Math.PI*.1,Math.PI*.9,true);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-7*Math.cos(Math.PI*.1),-7*Math.sin(Math.PI*.1)+1);ctx.lineTo(-7*Math.cos(Math.PI*.1)-0,-7*Math.sin(Math.PI*.1)+4);ctx.stroke();
    ctx.beginPath();ctx.moveTo(7*Math.cos(Math.PI*.1),-7*Math.sin(Math.PI*.1)+1);ctx.lineTo(7*Math.cos(Math.PI*.1),-7*Math.sin(Math.PI*.1)+4);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,14+pulse*4,0,Math.PI*2);
    ctx.strokeStyle=`rgba(170,100,255,${pulse*.5})`;ctx.lineWidth=1.5;ctx.stroke();
    ctx.shadowBlur=0;
    ctx.restore();
  }

  // HP drops
  for(const h of hpDrops){
    if(!onScreen(h.x,h.y,20))continue;
    ctx.save();ctx.translate(h.x,h.y);
    const hp=.6+Math.sin(_now*.005)*.4;
    ctx.beginPath();ctx.arc(0,0,14+hp*4,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,60,60,${hp*.5})`;ctx.lineWidth=1.5;ctx.stroke();
    ctx.font='18px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='#ff0000';ctx.shadowBlur=12;ctx.fillText('❤',0,0);
    ctx.restore();
  }

  // Auras
  for(const a of auras){
    const alpha=a.life/a.maxLife*.5;
    const rgb=a.rgb||'255,200,60';
    ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);
    ctx.strokeStyle=`rgba(${rgb},${alpha})`;ctx.lineWidth=3;
    ctx.shadowColor=`rgba(${rgb},1)`;ctx.shadowBlur=15;ctx.stroke();
    ctx.fillStyle=`rgba(${rgb},${alpha*.25})`;ctx.fill();
    ctx.shadowBlur=0;
  }

  // Toxic clouds
  for(const tc of toxicClouds){
    const a=(tc.life/tc.maxLife)*.5;
    ctx.beginPath();ctx.arc(tc.x,tc.y,tc.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(50,200,70,${a})`;ctx.fill();
    ctx.strokeStyle=`rgba(80,255,100,${a*1.2})`;ctx.lineWidth=2;ctx.stroke();
  }

  // Lightning
  for(const l of lightnings){
    const maxLife=l.sky?0.22:0.12;
    const a=l.life/maxLife;
    ctx.save();
    if(l.sky){
      ctx.strokeStyle=`rgba(200,230,255,${a})`;ctx.lineWidth=2.5+a*2;
      ctx.shadowColor='#88ccff';ctx.shadowBlur=20;
    } else {
      ctx.strokeStyle=`rgba(180,220,255,${a})`;ctx.lineWidth=2;
      ctx.shadowColor='#aaddff';ctx.shadowBlur=12;
    }
    const segs=l.sky?10:6,dx=(l.x2-l.x1)/segs,dy=(l.y2-l.y1)/segs;
    const jitter=l.sky?22:14;
    ctx.beginPath();ctx.moveTo(l.x1,l.y1);
    for(let i=1;i<segs;i++){
      ctx.lineTo(l.x1+dx*i+(Math.random()-.5)*jitter,l.y1+dy*i+(Math.random()-.5)*jitter);
    }
    ctx.lineTo(l.x2,l.y2);ctx.stroke();ctx.restore();
  }

  // Particles
  for(const p of particles){
    const a=p.life/p.maxLife;
    if(p.glow){ctx.shadowColor=p.glow;ctx.shadowBlur=p.r*3;}
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*a,0,Math.PI*2);
    ctx.fillStyle=p.col+(Math.floor(a*220).toString(16).padStart(2,'0'));ctx.fill();
    if(p.glow){ctx.shadowBlur=0;}
  }


  // Corrupted zones (Unholy Ground)
  for(const z of corruptedZones){
    if(!onScreen(z.x,z.y,z.r))continue;
    const a=(z.life/z.maxLife)*.45;
    ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(30,15,50,${a})`;ctx.fill();
    ctx.strokeStyle=`rgba(100,40,160,${a*1.4})`;ctx.lineWidth=1.5;ctx.stroke();
  }

  // Chests (world space)
  for(const c of chests){
    if(!onScreen(c.x,c.y,CHEST_FILL_R+10))continue;
    drawChest(c);
  }

  // Seals (world space)
  for(const s of seals){
    if(!onScreen(s.x,s.y,60))continue;
    drawSeal(s);
  }

  // Enemies
  const _rats=[],_others=[];
  for(const e of enemies){if(!onScreen(e.x,e.y,e.r+40))continue;if(e.name==='Plague Rat')_rats.push(e);else _others.push(e);}
  for(const e of _rats)drawEnemy(e);
  for(const e of _others)drawEnemy(e);

  // Bible orbs
  for(const w of pl.weapons){
    if(w.type==='bible'&&w.orbs){
      const s=WDEFS.bible.stats(w.level);
      for(const o of w.orbs){
        const ox=pl.x+Math.cos(o.a)*s.r,oy=pl.y+Math.sin(o.a)*s.r;
        ctx.save();ctx.translate(ox,oy);ctx.rotate(o.a*2);
        ctx.fillStyle='#ffdd55';ctx.shadowColor='#ffaa00';ctx.shadowBlur=14;
        ctx.fillRect(-10,-7,20,14);
        ctx.restore();
      }
    }
  }

  // Projectiles
  for(const p of projs){
    ctx.save();ctx.translate(p.x,p.y);
    if(p.type==='axe'){
      ctx.rotate(p.spin);
      ctx.beginPath();ctx.moveTo(-11,-5);ctx.lineTo(11,0);ctx.lineTo(-11,5);ctx.closePath();
      ctx.fillStyle=p.col;ctx.shadowColor=p.glow;ctx.shadowBlur=14;ctx.fill();
    } else if(p.type==='flame'){
      // Outer halo
      ctx.beginPath();ctx.arc(0,0,p.r*1.4,0,Math.PI*2);
      ctx.fillStyle='rgba(255,60,0,0.22)';ctx.shadowColor='#ff2200';ctx.shadowBlur=28;ctx.fill();
      // Core
      ctx.beginPath();ctx.arc(0,0,p.r*.65,0,Math.PI*2);
      ctx.fillStyle='#ffbb00';ctx.shadowBlur=16;ctx.fill();
    } else {
      ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);
      ctx.fillStyle=p.col;ctx.shadowColor=p.glow;ctx.shadowBlur=14;ctx.fill();
    }
    ctx.restore();
  }

  // Seal projectiles
  drawSealProjs();

  // Wool of Thorns persistent aura
  for(const w of pl.weapons){
    if(w.type!=='garlic')continue;
    const s=WDEFS.garlic.stats(w.level);
    const breathe=.5+Math.sin(_now*.0028)*.5;
    ctx.save();
    ctx.beginPath();ctx.arc(pl.x,pl.y,s.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(80,200,50,${.04+breathe*.03})`;ctx.fill();
    ctx.restore();
  }

  // Pickup range circle
  ctx.save();
  ctx.beginPath();ctx.arc(pl.x,pl.y,pl.magnet,0,Math.PI*2);
  ctx.strokeStyle=vacuumT>0?'rgba(100,200,255,0.6)':'rgba(150,100,255,0.28)';
  ctx.lineWidth=1;ctx.setLineDash([4,7]);ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  drawPlayer();

  // Damage numbers
  ctx.save();
  for(const d of dmgNums){
    if(!onScreen(d.x,d.y,40))continue;
    const a=Math.min(1,d.life/.5);
    ctx.globalAlpha=a;
    ctx.font=`bold ${12+Math.min(6,d.val/10)}px Georgia`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=d.val>40?'#ff8800':'#ffffff';
    ctx.shadowColor='#000';ctx.shadowBlur=3;
    ctx.fillText(d.val,d.x,d.y);
  }
  ctx.restore();

  ctx.restore(); // end camera transform

  // Chest arrows (screen space)
  for(const c of chests){
    if(!onScreen(c.x,c.y,30))drawChestArrow(c);
  }

  // Seal arrows (screen space)
  for(const s of seals){
    if(!s.dead&&!onScreen(s.x,s.y,30))drawSealArrow(s);
  }

  if(!touchDevice||joyActivated)drawMinimap();

  if(state==='playing'&&touchDevice){
    if(joyActivated){
      ctx.save();
      const ja=joystick.active;
      ctx.globalAlpha=ja?0.55:0.2;
      ctx.beginPath();ctx.arc(JBASE.x,JBASE.y,JRADIUS,0,Math.PI*2);
      ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;ctx.stroke();
      ctx.fillStyle=`rgba(255,255,255,${ja?0.08:0.03})`;ctx.fill();
      ctx.globalAlpha=ja?0.85:0.25;
      ctx.beginPath();ctx.arc(joystick.knobX,joystick.knobY,JRADIUS*0.35,0,Math.PI*2);
      ctx.fillStyle='#ffffff';ctx.fill();
      ctx.restore();
      // Prompt fades out after first touch
      const _pa=Math.max(0,1-(_now-joyActivatedAt)/900);
      if(_pa>0){
        ctx.save();
        ctx.globalAlpha=_pa;
        ctx.font='bold 22px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle='#ffcc88';ctx.fillText('◄ TAP TO MOVE ►',W/2,H-110);
        ctx.globalAlpha=_pa*0.6;ctx.font='15px Georgia';ctx.fillStyle='#cc9955';
        ctx.fillText('LEFT HAND  OR  RIGHT HAND',W/2,H-80);
        ctx.restore();
      }
    }
  }

  // Vignette — blends dark / purple (SS) / red (CC)
  const sv=typeof sealVignette!=='undefined'?sealVignette:0;
  const cv=typeof crimsonVignette!=='undefined'?crimsonVignette:0;
  const vr=Math.round(70*sv+190*cv),vb=Math.round(110*sv+10*cv),va=0.62+sv*0.08+cv*0.08;
  const vg=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.9);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,`rgba(${vr},0,${vb},${va})`);
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);

  // Seal spotted flashes
  if(typeof sealSpottedT!=='undefined'&&sealSpottedT>0){
    const a=Math.min(1,sealSpottedT);
    ctx.save();ctx.globalAlpha=a;
    ctx.font='bold 15px Georgia';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillStyle='#dd99ff';ctx.shadowColor='#aa44ff';ctx.shadowBlur=22;
    ctx.fillText('⛧  STRENGTHENING SEAL SPOTTED  ⛧',W/2,44);
    ctx.shadowBlur=0;ctx.restore();
  }
  if(typeof ccSpottedT!=='undefined'&&ccSpottedT>0){
    const a=Math.min(1,ccSpottedT);
    ctx.save();ctx.globalAlpha=a;
    ctx.font='bold 15px Georgia';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillStyle='#ff6666';ctx.shadowColor='#cc1111';ctx.shadowBlur=22;
    ctx.fillText('✝  CRIMSON CROSS SPOTTED  ✝',W/2,44);
    ctx.shadowBlur=0;ctx.restore();
  }
}

function drawBG(){
  const wi=Math.min(Math.floor(bgWave),BG_THEMES.length-2);
  const wf=Math.max(0,Math.min(1,bgWave-wi));
  const t0=BG_THEMES[wi],t1=BG_THEMES[wi+1];
  const ca=lerpColor(t0.a,t1.a,wf),cb=lerpColor(t0.b,t1.b,wf);
  const cc=lerpColor(t0.c,t1.c,wf),cd=lerpColor(t0.d,t1.d,wf);
  const cbrd=lerpColor(t0.brd,t1.brd,wf);

  const ts=80;
  const sx=Math.floor(cam.x/ts)*ts,sy=Math.floor(cam.y/ts)*ts;
  for(let tx=sx;tx<cam.x+W+ts;tx+=ts){
    for(let ty=sy;ty<cam.y+H+ts;ty+=ts){
      ctx.fillStyle=((Math.floor(tx/ts)+Math.floor(ty/ts))%2===0)?ca:cb;
      ctx.fillRect(tx,ty,ts,ts);
    }
  }
  ctx.fillStyle=cc;
  for(let tx=sx;tx<cam.x+W+ts;tx+=ts){
    for(let ty=sy;ty<cam.y+H+ts;ty+=ts){
      const seed=(tx*374761+ty*668265)&0xfffff;
      const fx=tx+(seed%60)+10,fy=ty+((seed>>4)%60)+10;
      ctx.beginPath();ctx.arc(fx,fy,1.5,0,Math.PI*2);ctx.fill();
      const seed2=(tx*112741+ty*334217)&0xfffff;
      if(seed2%7===0){
        const fx2=tx+(seed2%70)+5,fy2=ty+((seed2>>3)%70)+5;
        ctx.fillStyle=cd;
        ctx.fillRect(fx2-1,fy2-3,2,6);
        ctx.fillRect(fx2-3,fy2-1,6,2);
        ctx.fillStyle=cc;
      }
    }
  }
  ctx.strokeStyle=cbrd;ctx.lineWidth=5;
  ctx.strokeRect(0,0,WORLD,WORLDH);
  ctx.shadowBlur=0;
}

function drawEnemy(e){
  ctx.save();
  ctx.translate(e.x+(e.shakeX||0),e.y+(e.shakeY||0));
  if(e.sealBuffed){
    const bp=.4+Math.sin(_now*.004)*.3;
    ctx.shadowColor='#aa44ff';ctx.shadowBlur=10+bp*8;
    ctx.beginPath();ctx.arc(0,0,e.r+4,0,Math.PI*2);
    ctx.strokeStyle=`rgba(170,68,255,${.25+bp*.25})`;ctx.lineWidth=2;ctx.stroke();
    ctx.shadowBlur=0;
  }
  if(e.flash>.08&&Math.floor(e.flash*12)%2===0)ctx.globalAlpha=.4;
  ctx.rotate(e.leanAng||0);

  const nm=e.name;
  if(nm==='Cursed Crow'){
    ctx.fillStyle='#2a1a4a';
    ctx.beginPath();ctx.ellipse(0,0,e.r*.7,e.r,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2.5;ctx.stroke();
    ctx.fillStyle='#3d2660';
    ctx.beginPath();ctx.moveTo(-e.r*.7,0);ctx.lineTo(-e.r*1.3,-e.r*.4);ctx.lineTo(-e.r*.7,-e.r*.5);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(e.r*.7,0);ctx.lineTo(e.r*1.3,-e.r*.4);ctx.lineTo(e.r*.7,-e.r*.5);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#c97d2e';
    ctx.beginPath();ctx.moveTo(0,-e.r);ctx.lineTo(3,-e.r*1.3);ctx.lineTo(-3,-e.r*1.3);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ff2222';
    ctx.beginPath();ctx.arc(-e.r*.25,-e.r*.3,2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.r*.25,-e.r*.3,2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.5)';
    ctx.beginPath();ctx.arc(-e.r*.4,-e.r*.5,1.5,0,Math.PI*2);ctx.fill();

  }else if(nm==='Corrupt Pig'){
    ctx.fillStyle='#cc6688';
    ctx.beginPath();ctx.ellipse(0,1,e.r*.9,e.r*.75,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#e888aa';
    ctx.beginPath();ctx.ellipse(0,e.r*.28,e.r*.4,e.r*.28,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#1a0a2e';
    ctx.beginPath();ctx.arc(-e.r*.14,e.r*.28,1.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.r*.14,e.r*.28,1.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#cc6688';
    ctx.beginPath();ctx.ellipse(-e.r*.55,-e.r*.55,e.r*.28,e.r*.38,-.3,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.ellipse(e.r*.55,-e.r*.55,e.r*.28,e.r*.38,.3,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#ff2222';
    ctx.beginPath();ctx.arc(-e.r*.28,-e.r*.1,2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.r*.28,-e.r*.1,2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.5)';
    ctx.beginPath();ctx.arc(-e.r*.38,-e.r*.38,2,0,Math.PI*2);ctx.fill();

  }else if(nm==='Shambling Sheep'){
    ctx.fillStyle='#b0c0b8';
    for(let i=0;i<8;i++){
      const a=(i/8)*Math.PI*2;
      ctx.beginPath();ctx.arc(Math.cos(a)*e.r*.7,Math.sin(a)*e.r*.7,e.r*.38,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle='#c8d4cc';
    ctx.beginPath();ctx.arc(0,0,e.r*.7,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#e8e0d8';
    ctx.beginPath();ctx.ellipse(0,e.r*.1,e.r*.38,e.r*.35,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#1a0a2e';
    ctx.beginPath();ctx.arc(-e.r*.14,-e.r*.05,2.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.r*.14,-e.r*.05,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#882222';
    ctx.beginPath();ctx.arc(-e.r*.14,-e.r*.05,1.3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.r*.14,-e.r*.05,1.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.55)';
    ctx.beginPath();ctx.arc(-e.r*.3,-e.r*.3,2,0,Math.PI*2);ctx.fill();
    if(e.dying){
      ctx.globalAlpha=.35;
      ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);
      ctx.fillStyle='#44ff88';ctx.fill();
      ctx.globalAlpha=1;
    }

  }else if(nm==='Ram Rusher'){
    if(e.chargeState==='telegraphing'){
      const len=200,segs=5;
      ctx.save();ctx.lineWidth=2;
      for(let i=0;i<segs;i++){
        const t0=i/segs,t1=(i+1)/segs;
        ctx.strokeStyle=`rgba(220,30,30,${(1-t0)*0.75})`;
        ctx.setLineDash([8,6]);ctx.lineDashOffset=-(_now*0.08%14);
        ctx.beginPath();
        ctx.moveTo(e.chargeDx*len*t0,e.chargeDy*len*t0);
        ctx.lineTo(e.chargeDx*len*t1,e.chargeDy*len*t1);
        ctx.stroke();
      }
      ctx.setLineDash([]);ctx.restore();
    }
    ctx.fillStyle=e.chargeState==='charging'?'#c9952a':'#8b7744';
    ctx.beginPath();ctx.ellipse(0,0,e.r*.9,e.r*.75,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=3;ctx.stroke();
    ctx.strokeStyle='#c97d2e';ctx.lineWidth=3;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-e.r*.5,-e.r*.4);ctx.quadraticCurveTo(-e.r*1.0,-e.r*.9,-e.r*.4,-e.r*.75);ctx.stroke();
    ctx.beginPath();ctx.moveTo(e.r*.5,-e.r*.4);ctx.quadraticCurveTo(e.r*1.0,-e.r*.9,e.r*.4,-e.r*.75);ctx.stroke();
    ctx.fillStyle='#1a0a2e';
    ctx.beginPath();ctx.arc(-e.r*.28,-e.r*.1,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.r*.28,-e.r*.1,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff4400';
    ctx.beginPath();ctx.arc(-e.r*.28,-e.r*.1,1.6,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.r*.28,-e.r*.1,1.6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.5)';
    ctx.beginPath();ctx.arc(-e.r*.38,-e.r*.38,2,0,Math.PI*2);ctx.fill();

  }else if(nm==='Plague Rat'){
    // Body
    ctx.fillStyle='#a89080';
    ctx.beginPath();ctx.ellipse(0,0,e.r*1.35,e.r*.8,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#6a5a55';ctx.lineWidth=1.5;ctx.stroke();
    // Snout
    ctx.fillStyle='#c0a898';
    ctx.beginPath();ctx.ellipse(e.r*1.1,e.r*.05,e.r*.45,e.r*.28,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#7a5555';
    ctx.beginPath();ctx.arc(e.r*1.4,e.r*.05,e.r*.13,0,Math.PI*2);ctx.fill();
    // Ears
    ctx.fillStyle='#907070';
    ctx.beginPath();ctx.ellipse(-e.r*.3,-e.r*.85,e.r*.3,e.r*.42,-.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(e.r*.3,-e.r*.85,e.r*.3,e.r*.42,.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d4a0a0';
    ctx.beginPath();ctx.ellipse(-e.r*.3,-e.r*.85,e.r*.16,e.r*.24,-.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(e.r*.3,-e.r*.85,e.r*.16,e.r*.24,.2,0,Math.PI*2);ctx.fill();
    // Eyes
    ctx.fillStyle='#cc1111';
    ctx.beginPath();ctx.arc(e.r*.5,-e.r*.25,e.r*.22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.5)';
    ctx.beginPath();ctx.arc(e.r*.42,-e.r*.32,e.r*.09,0,Math.PI*2);ctx.fill();
    // Tail
    ctx.strokeStyle='#907070';ctx.lineWidth=1.2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-e.r*1.2,e.r*.1);ctx.quadraticCurveTo(-e.r*1.8,e.r*.8,-e.r*1.4,e.r*1.3);ctx.stroke();
    // Infection glow
    if((e.poison||0)>0){
      ctx.shadowColor='#55cc22';ctx.shadowBlur=8;
      ctx.beginPath();ctx.ellipse(0,0,e.r*1.35,e.r*.8,0,0,Math.PI*2);
      ctx.strokeStyle='rgba(85,200,34,.6)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.shadowBlur=0;
    }

  }else if(nm==='Ghost Pig'){
    ctx.globalAlpha=(e.flash>.08&&Math.floor(e.flash*12)%2===0)?0.2:0.6;
    ctx.fillStyle='#7799bb';
    ctx.beginPath();ctx.ellipse(0,0,e.r*.9,e.r*.8,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#445577';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#aaccee';
    ctx.beginPath();ctx.arc(-e.r*.25,-e.r*.1,1.8,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.r*.25,-e.r*.1,1.8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.6)';
    ctx.beginPath();ctx.arc(-e.r*.35,-e.r*.35,1.2,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;

  }else if(nm==='Skeletal Scarecrow'){
    const zp=e.zonePhase;
    const zt=e.zoneT||0;
    const appT=e.appearT||0;

    // Appearance fade-in
    if(appT>0)ctx.globalAlpha*=Math.max(0,1-appT/0.5);

    // Body glow signals telegraph / active phase
    if(zp==='telegraph'){
      const prog=1-zt/1.8;
      const pulse=0.5+Math.sin(_now*.018)*0.5;
      ctx.beginPath();ctx.ellipse(0,-e.r*1.1,e.r*2.4,e.r*2.9,0,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,${Math.floor(120*(1-prog))},0,${0.18+prog*0.62+pulse*0.1})`;
      ctx.lineWidth=3+prog*4;
      ctx.shadowColor='#ff2200';ctx.shadowBlur=10+prog*26+pulse*8;
      ctx.stroke();ctx.shadowBlur=0;
    }else if(zp==='active'){
      ctx.beginPath();ctx.ellipse(0,-e.r*1.1,e.r*2.4,e.r*2.9,0,0,Math.PI*2);
      ctx.fillStyle='rgba(255,180,60,0.32)';
      ctx.shadowColor='#ffffff';ctx.shadowBlur=44;ctx.fill();ctx.shadowBlur=0;
    }else if(zp==='fade'){
      const a=zt/1.5;
      ctx.beginPath();ctx.ellipse(0,-e.r*1.1,e.r*2.4,e.r*2.9,0,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,120,0,${a*0.35})`;ctx.lineWidth=2;
      ctx.shadowColor='#ff4400';ctx.shadowBlur=a*14;ctx.stroke();ctx.shadowBlur=0;
    }

    // Post
    ctx.fillStyle='#7a5a30';
    ctx.fillRect(-3,-e.r*2.2,6,e.r*2.8);
    ctx.fillRect(-e.r*1.4,-e.r*.8,e.r*2.8,5);
    ctx.strokeStyle='#4a3010';ctx.lineWidth=1.5;ctx.strokeRect(-3,-e.r*2.2,6,e.r*2.8);
    ctx.strokeRect(-e.r*1.4,-e.r*.8,e.r*2.8,5);
    // Rags on arms
    ctx.fillStyle='#5a5040';
    ctx.beginPath();ctx.moveTo(-e.r*1.4,-e.r*.8);ctx.lineTo(-e.r*1.8,-e.r*.2);ctx.lineTo(-e.r*1.1,-e.r*.3);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(e.r*1.4,-e.r*.8);ctx.lineTo(e.r*1.8,-e.r*.2);ctx.lineTo(e.r*1.1,-e.r*.3);ctx.closePath();ctx.fill();
    // Skull head
    ctx.fillStyle='#d4d0b0';
    ctx.beginPath();ctx.ellipse(0,-e.r*2.2,e.r*.8,e.r*.85,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#8a8060';ctx.lineWidth=1.5;ctx.stroke();
    // Eye sockets
    ctx.fillStyle='#1a0a00';
    ctx.beginPath();ctx.ellipse(-e.r*.28,-e.r*2.3,e.r*.2,e.r*.22,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(e.r*.28,-e.r*2.3,e.r*.2,e.r*.22,0,0,Math.PI*2);ctx.fill();
    // Glowing eyes — color/intensity driven by phase
    const eyeCol=zp==='active'?'#ffffff':zp==='telegraph'?`rgb(255,${Math.floor(68*(zt/1.8))},0)`:'#ff4400';
    const eyeBlur=zp==='active'?32:zp==='telegraph'?10+(1-zt/1.8)*24:8;
    ctx.fillStyle=eyeCol;ctx.shadowColor=eyeCol;ctx.shadowBlur=eyeBlur;
    ctx.beginPath();ctx.ellipse(-e.r*.28,-e.r*2.3,e.r*.1,e.r*.12,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(e.r*.28,-e.r*2.3,e.r*.1,e.r*.12,0,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    // Jaw crack
    ctx.strokeStyle='#8a8060';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-e.r*.3,-e.r*1.7);ctx.lineTo(0,-e.r*1.5);ctx.lineTo(e.r*.3,-e.r*1.7);ctx.stroke();
  }

  // HP bar
  if((e.hp<e.maxHp||e.dying)&&e.hp>0){
    const bw=e.r*2+8,bh=4,bx=-bw/2,by=-e.r-12;
    ctx.shadowBlur=0;ctx.globalAlpha=1;
    ctx.fillStyle='#200000';ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle=e.dying?'#44bb44':'#cc1111';
    ctx.fillRect(bx,by,bw*(e.hp/e.maxHp),bh);
  }
  // Carrion Call mark indicator
  if(e.marked){
    ctx.shadowBlur=0;ctx.globalAlpha=.8;
    ctx.beginPath();ctx.arc(0,0,e.r+4,0,Math.PI*2);
    ctx.strokeStyle='#ffcc44';ctx.lineWidth=2;ctx.stroke();
    ctx.globalAlpha=1;
  }
  // Plague Bearer poison stacks
  if(e.poison>0){
    ctx.shadowBlur=0;ctx.globalAlpha=1;
    for(let i=0;i<e.poison;i++){
      ctx.beginPath();ctx.arc(-4+i*4,e.r+6,2.5,0,Math.PI*2);
      ctx.fillStyle='#44ff44';ctx.fill();
    }
  }
  ctx.restore();
}

function drawPlayer(){
  ctx.save();ctx.translate(pl.x,pl.y);
  if(pl.iframes>0&&Math.floor(pl.iframes*12)%2===0)ctx.globalAlpha=.35;

  ctx.beginPath();ctx.ellipse(0,14,13,5,0,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.fill();

  if(pl.infected>0){
    const pulse=.4+Math.sin(_now*.008)*(.2+pl.infected*.06);
    ctx.beginPath();ctx.ellipse(0,0,16+pl.infected,13+pl.infected*.5,0,0,Math.PI*2);
    ctx.strokeStyle=`rgba(85,220,34,${pulse})`;ctx.lineWidth=2;
    ctx.shadowColor='#44ff22';ctx.shadowBlur=10+pl.infected*3;
    ctx.stroke();ctx.shadowBlur=0;
  }

  ctx.rotate(pl.leanAng||0);

  ctx.beginPath();ctx.ellipse(0,0,13,11,0,0,Math.PI*2);
  ctx.fillStyle='#e8b86d';ctx.shadowBlur=0;ctx.fill();
  ctx.strokeStyle='#1a0a2e';ctx.lineWidth=3;ctx.stroke();

  ctx.beginPath();ctx.ellipse(-11,2,5,8,-.5,0,Math.PI*2);
  ctx.fillStyle='#d4a055';ctx.fill();
  ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2.5;ctx.stroke();
  ctx.beginPath();ctx.ellipse(-11,3,3,5,-.5,0,Math.PI*2);
  ctx.fillStyle='#e8967a';ctx.fill();

  ctx.beginPath();ctx.ellipse(11,2,5,8,.5,0,Math.PI*2);
  ctx.fillStyle='#d4a055';ctx.fill();
  ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2.5;ctx.stroke();
  ctx.beginPath();ctx.ellipse(11,3,3,5,.5,0,Math.PI*2);
  ctx.fillStyle='#e8967a';ctx.fill();

  ctx.beginPath();ctx.ellipse(0,5,6,4,0,0,Math.PI*2);
  ctx.fillStyle='#c8905a';ctx.fill();
  ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,3,2.5,2,0,0,Math.PI*2);
  ctx.fillStyle='#1a0a2e';ctx.fill();

  ctx.fillStyle='#1a0a2e';
  ctx.beginPath();ctx.arc(-5,-3,3.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(5,-3,3.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.arc(-6,-4,1.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(4,-4,1.3,0,Math.PI*2);ctx.fill();

  ctx.fillStyle='#4a1a6e';
  ctx.beginPath();ctx.arc(0,-1,2,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#8b3acc';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,-3.5);ctx.lineTo(0,1.5);ctx.moveTo(-2.5,.5);ctx.lineTo(2.5,.5);ctx.stroke();

  ctx.restore();
}

function drawMinimap(){
  const msW=154,msH=116,mx=touchDevice?(joySide==='left'?W-msW-12:12):12,my=H-msH-12;
  const scX=msW/WORLD,scY=msH/WORLDH;
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.strokeStyle='#330000';ctx.lineWidth=1;
  ctx.fillRect(mx,my,msW,msH);ctx.strokeRect(mx,my,msW,msH);
  ctx.fillStyle='#ff77aa';
  for(const e of enemies){ctx.fillRect(mx+e.x*scX-1,my+e.y*scY-1,2,2);}
  ctx.fillStyle='#ffdd44';
  for(const c of chests){ctx.beginPath();ctx.arc(mx+c.x*scX,my+c.y*scY,3,0,Math.PI*2);ctx.fill();}
  for(const s of seals){
    ctx.fillStyle=s.type==='cc'?'#ff3322':'#aa44ff';
    ctx.beginPath();ctx.arc(mx+s.x*scX,my+s.y*scY,3,0,Math.PI*2);ctx.fill();
  }
  _xpBuckets.fill(0);
  for(const g of xpGems){
    const bx=Math.min(5,(g.x/WORLD*6)|0),by=Math.min(3,(g.y/WORLDH*4)|0);
    _xpBuckets[by*6+bx]++;
  }
  ctx.fillStyle='#555555';
  for(let i=0;i<24;i++){
    if(_xpBuckets[i]<20)continue;
    const cx=mx+((i%6)+0.5)/6*msW,cy=my+((i/6|0)+0.5)/4*msH;
    ctx.beginPath();ctx.arc(cx,cy,Math.min(4,1+_xpBuckets[i]*0.3),0,Math.PI*2);ctx.fill();
  }
  const _flash=Math.floor(_now/300)%2===0;
  ctx.fillStyle=_flash?'#ff3344':'#ffffff';
  for(const h of hpDrops){ctx.beginPath();ctx.arc(mx+h.x*scX,my+h.y*scY,2.5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle=_flash?'#44aaff':'#ffffff';
  for(const m of magnetDrops){ctx.beginPath();ctx.arc(mx+m.x*scX,my+m.y*scY,2.5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.arc(mx+pl.x*scX,my+pl.y*scY,3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(204,34,34,.4)';ctx.lineWidth=1;
  ctx.strokeRect(mx+cam.x*scX,my+cam.y*scY,W*scX,H*scY);
}

function drawChest(c){
  const x=c.x,y=c.y,fill=c.fill||0;
  const bob=Math.sin(_now*.003)*3;

  // Fill ring (no bob — stays anchored to world position)
  ctx.save();ctx.translate(x,y);
  const fr=CHEST_FILL_R;
  // Outer activation circle
  ctx.beginPath();ctx.arc(0,0,fr,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,200,80,0.18)';ctx.lineWidth=2;
  ctx.setLineDash([5,7]);ctx.stroke();ctx.setLineDash([]);
  // Progress arc (clockwise from top)
  if(fill>0){
    ctx.beginPath();ctx.arc(0,0,fr,-Math.PI/2,-Math.PI/2+Math.PI*2*fill);
    const glow=0.6+fill*.4;
    ctx.strokeStyle=`rgba(255,210,60,${glow})`;ctx.lineWidth=3.5;
    ctx.shadowColor='#ffcc44';ctx.shadowBlur=12;ctx.stroke();ctx.shadowBlur=0;
  }
  ctx.restore();

  // Chest body (with bob)
  ctx.save();ctx.translate(x,y+bob);
  ctx.shadowColor='#ffaa00';ctx.shadowBlur=20;

  ctx.fillStyle='#7a4a1e';
  ctx.beginPath();ctx.roundRect(-14,0,28,18,2);ctx.fill();
  ctx.strokeStyle='#c97d2e';ctx.lineWidth=2;ctx.stroke();

  ctx.fillStyle='#9a5e28';
  ctx.beginPath();ctx.roundRect(-14,-12,28,13,2);ctx.fill();
  ctx.strokeStyle='#c97d2e';ctx.lineWidth=2;ctx.stroke();

  ctx.fillStyle='#c97d2e';
  ctx.fillRect(-14,-2,28,4);
  ctx.fillRect(-14,7,28,3);

  ctx.fillStyle='#ffcc44';
  ctx.beginPath();ctx.arc(0,-1,5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#c97d2e';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#c97d2e';
  ctx.beginPath();ctx.arc(0,-1,2.5,0,Math.PI*2);ctx.fill();

  const pulse=.5+Math.sin(_now*.005)*.5;
  ctx.globalAlpha=pulse*.4;
  ctx.beginPath();ctx.arc(0,4,22,0,Math.PI*2);
  ctx.fillStyle='#ffcc44';ctx.fill();
  ctx.globalAlpha=1;

  ctx.restore();
}

function drawCrimsonCross(s){
  const x=s.x,y=s.y;
  const t=_now*.001;
  const bob=Math.sin(t*2.0)*4;
  const pulse=.5+Math.sin(t*4)*.5;
  const flashing=s.flash>0;
  const R=16;

  ctx.save();ctx.translate(x,y+bob);
  if(flashing){ctx.globalAlpha=0.55+Math.sin(t*40)*.45;}
  ctx.shadowColor=flashing?'#ffffff':'#cc1111';
  ctx.shadowBlur=22+pulse*14;

  // Spinning orbit dots (red)
  const spin=t*0.8;
  for(let i=0;i<4;i++){
    const a=spin+i*Math.PI/2;
    ctx.beginPath();ctx.arc(Math.cos(a)*24,Math.sin(a)*24,2,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,80,60,${0.6+pulse*0.35})`;ctx.fill();
  }

  // Upside-down cross (long arm up, crossbar near bottom)
  ctx.globalAlpha=(flashing?0.95:0.88);
  ctx.fillStyle=flashing?'rgba(255,180,180,0.85)':`rgba(200,10,10,${0.7+pulse*0.2})`;
  ctx.strokeStyle=flashing?'#ffffff':'rgba(255,80,60,0.95)';ctx.lineWidth=1.5;
  ctx.shadowColor=flashing?'#ffffff':'#ff2222';ctx.shadowBlur=12;

  // Vertical bar: long arm upward
  ctx.fillRect(-5,-R*1.6,10,R*2.8);ctx.strokeRect(-5,-R*1.6,10,R*2.8);
  // Horizontal crossbar near the bottom third
  ctx.fillRect(-R*1.1,R*0.5,R*2.2,10);ctx.strokeRect(-R*1.1,R*0.5,R*2.2,10);

  // Center gem
  ctx.shadowBlur=16+pulse*8;ctx.shadowColor='#ff4422';
  ctx.beginPath();ctx.arc(0,-R*.4,4,0,Math.PI*2);
  ctx.fillStyle=flashing?'#ffffff':'#ff4422';ctx.fill();
  ctx.beginPath();ctx.arc(0,-R*.4,2,0,Math.PI*2);
  ctx.fillStyle='#ffffff';ctx.fill();

  ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.restore();

  // HP bar
  ctx.save();ctx.translate(x,y);
  const barW=52,barH=5,bx=-barW/2,by=36;
  const hpPct=Math.max(0,s.hp/s.maxHp);
  ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(bx-1,by-1,barW+2,barH+2);
  ctx.fillStyle='#330000';ctx.fillRect(bx,by,barW,barH);
  ctx.fillStyle=hpPct>0.5?'#cc1111':hpPct>0.25?'#ff4422':'#ff8866';
  ctx.shadowColor='#cc1111';ctx.shadowBlur=6;
  ctx.fillRect(bx,by,barW*hpPct,barH);
  ctx.shadowBlur=0;ctx.restore();
}

function drawSeal(s){
  if(s.type==='cc'){drawCrimsonCross(s);return;}
  const x=s.x,y=s.y;
  const t=_now*.001;
  const bob=Math.sin(t*2.2)*4;
  const pulse=.5+Math.sin(t*3)*.5;
  const R=14;
  const flashing=s.flash>0;

  ctx.save();ctx.translate(x,y+bob);

  if(flashing){ctx.globalAlpha=0.55+Math.sin(t*40)*.45;}
  ctx.shadowColor=flashing?'#ffffff':'#aa44ff';
  ctx.shadowBlur=22+pulse*14;

  // Outer dashed orbit
  ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);
  ctx.strokeStyle=`rgba(170,68,255,${0.2+pulse*0.18})`;ctx.lineWidth=1.5;
  ctx.setLineDash([4,6]);ctx.stroke();ctx.setLineDash([]);

  // Six rune dots orbiting (slow spin)
  const spin=t*0.5;
  for(let i=0;i<6;i++){
    const a=spin+i*Math.PI/3;
    ctx.beginPath();ctx.arc(Math.cos(a)*22,Math.sin(a)*22,2,0,Math.PI*2);
    ctx.fillStyle=`rgba(220,150,255,${0.6+pulse*0.35})`;ctx.fill();
  }

  // Two overlapping triangles (Star of David)
  ctx.globalAlpha=(flashing?0.95:0.82);
  ctx.fillStyle=flashing?`rgba(255,200,255,0.7)`:`rgba(120,40,200,${0.5+pulse*0.2})`;
  ctx.strokeStyle=flashing?'#ffffff':`rgba(200,120,255,0.95)`;ctx.lineWidth=1.5;
  ctx.shadowColor=flashing?'#ffffff':'#cc66ff';ctx.shadowBlur=10;

  for(let tri=0;tri<2;tri++){
    ctx.beginPath();
    for(let i=0;i<3;i++){
      const a=-Math.PI/2+tri*Math.PI+i*Math.PI*2/3;
      i===0?ctx.moveTo(Math.cos(a)*R,Math.sin(a)*R):ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R);
    }
    ctx.closePath();ctx.fill();ctx.stroke();
  }

  // Center gem
  ctx.shadowBlur=18+pulse*10;ctx.shadowColor='#dd88ff';
  ctx.beginPath();ctx.arc(0,0,4.5,0,Math.PI*2);
  ctx.fillStyle=flashing?'#ffffff':'#dd88ff';ctx.fill();
  ctx.beginPath();ctx.arc(0,0,2,0,Math.PI*2);
  ctx.fillStyle='#ffffff';ctx.fill();

  ctx.globalAlpha=1;ctx.shadowBlur=0;

  // HP bar (anchored below, no bob offset)
  ctx.restore();
  ctx.save();ctx.translate(x,y);
  const barW=52,barH=5,bx=-barW/2,by=36;
  const hpPct=Math.max(0,s.hp/s.maxHp);
  ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(bx-1,by-1,barW+2,barH+2);
  ctx.fillStyle='#330044';ctx.fillRect(bx,by,barW,barH);
  ctx.fillStyle=hpPct>0.5?'#aa44ff':hpPct>0.25?'#ff66ff':'#ff88ff';
  ctx.shadowColor='#aa44ff';ctx.shadowBlur=6;
  ctx.fillRect(bx,by,barW*hpPct,barH);
  ctx.shadowBlur=0;

  ctx.restore();
}

function drawSealProjs(){
  for(const sp of sealProjs){
    if(!onScreen(sp.x,sp.y,sp.r+20))continue;
    const c=sp.crimson;
    ctx.save();ctx.translate(sp.x,sp.y);
    ctx.beginPath();ctx.arc(0,0,sp.r*1.5,0,Math.PI*2);
    ctx.fillStyle=c?'rgba(200,0,0,0.18)':'rgba(140,0,210,0.18)';
    ctx.shadowColor=c?'#ff2200':'#aa00ff';ctx.shadowBlur=22;ctx.fill();
    ctx.beginPath();ctx.arc(0,0,sp.r*.72,0,Math.PI*2);
    ctx.fillStyle=c?'#ff4422':'#cc66ff';ctx.shadowBlur=14;ctx.fill();
    ctx.beginPath();ctx.arc(0,0,sp.r*.3,0,Math.PI*2);
    ctx.fillStyle='#ffffff';ctx.shadowBlur=0;ctx.fill();
    ctx.restore();
  }
}

function drawSealArrow(seal){
  const angle=Math.atan2(seal.y-pl.y,seal.x-pl.x);
  const dist=Math.floor(Math.hypot(seal.x-pl.x,seal.y-pl.y));
  const isCc=seal.type==='cc';

  const cx=W/2,cy=H/2,pad=touchDevice?210:240;
  const hw=cx-pad,hh=cy-pad;
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const sX=cos!==0?hw/Math.abs(cos):Infinity;
  const sY=sin!==0?hh/Math.abs(sin):Infinity;
  const s2=Math.min(sX,sY);
  const ax=cx+cos*s2,ay=cy+sin*s2;

  const pulse=.75+Math.sin(_now*.007)*.25;

  ctx.save();ctx.translate(ax,ay);
  ctx.rotate(angle);
  ctx.shadowColor=isCc?'#cc1111':'#aa44ff';ctx.shadowBlur=14*pulse;
  ctx.fillStyle=isCc?`rgba(255,60,40,${pulse})`:`rgba(180,100,255,${pulse})`;
  ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-7,-7);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();
  ctx.strokeStyle=isCc?'#881100':'#7722cc';ctx.lineWidth=1.5;ctx.stroke();
  ctx.rotate(-angle);
  ctx.shadowBlur=0;
  ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillStyle=isCc?'#ff6644':'#cc88ff';
  ctx.fillText(Math.floor(dist/4)+'m',0,16);
  ctx.restore();
}

function drawChestArrow(chest){
  const angle=Math.atan2(chest.y-pl.y,chest.x-pl.x);
  const dist=Math.floor(Math.hypot(chest.x-pl.x,chest.y-pl.y));

  // Find screen-edge position along the angle
  const cx=W/2,cy=H/2,pad=touchDevice?210:240;
  const hw=cx-pad,hh=cy-pad;
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const sX=cos!==0?hw/Math.abs(cos):Infinity;
  const sY=sin!==0?hh/Math.abs(sin):Infinity;
  const s=Math.min(sX,sY);
  const ax=cx+cos*s,ay=cy+sin*s;

  const pulse=.75+Math.sin(_now*.006)*.25;

  ctx.save();ctx.translate(ax,ay);

  // Arrow pointer
  ctx.rotate(angle);
  ctx.shadowColor='#ffaa00';ctx.shadowBlur=14*pulse;
  ctx.fillStyle=`rgba(255,204,68,${pulse})`;
  ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-7,-7);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#c97d2e';ctx.lineWidth=1.5;ctx.stroke();
  ctx.rotate(-angle);

  // Chest icon + distance label
  ctx.shadowBlur=0;
  ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.textBaseline='top';
  ctx.fillStyle='#ffcc44';
  ctx.fillText(Math.floor(dist/4)+'m',0,16);

  ctx.restore();
}
