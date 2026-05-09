function render(){
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
    const pulse=.7+Math.sin(Date.now()*.007)*.3;
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
    const hp=.6+Math.sin(Date.now()*.005)*.4;
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
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*a,0,Math.PI*2);
    ctx.fillStyle=p.col+(Math.floor(a*200).toString(16).padStart(2,'0'));ctx.fill();
  }

  // Egg landing telegraphs
  for(const eg of eggs){
    if(!onScreen(eg.tx,eg.ty,30))continue;
    const p=eg.t/eg.maxT;
    const g=Math.floor(200*(1-p));
    ctx.beginPath();ctx.arc(eg.tx,eg.ty,22,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,${g},0,0.22)`;ctx.fill();
  }

  // Eggs in flight
  for(const eg of eggs){
    if(!onScreen(eg.x,eg.y,30))continue;
    const p=eg.t/eg.maxT;
    const arcH=55*Math.sin(Math.PI*p);
    ctx.beginPath();ctx.ellipse(eg.x,eg.y,6*(1-p*.4),3*(1-p*.4),0,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fill();
    ctx.save();ctx.translate(eg.x,eg.y-arcH);
    ctx.beginPath();ctx.ellipse(0,0,5,7,0,0,Math.PI*2);
    ctx.fillStyle='#f5f0d0';ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2;ctx.fill();ctx.stroke();
    ctx.restore();
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

  // Enemies
  for(const e of enemies){if(!onScreen(e.x,e.y,e.r+40))continue;drawEnemy(e);}

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

  // Wool of Thorns persistent aura
  for(const w of pl.weapons){
    if(w.type!=='garlic')continue;
    const s=WDEFS.garlic.stats(w.level);
    const breathe=.5+Math.sin(Date.now()*.0028)*.5;
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

  drawMinimap();
}

function drawBG(){
  const ts=80;
  const sx=Math.floor(cam.x/ts)*ts,sy=Math.floor(cam.y/ts)*ts;
  for(let tx=sx;tx<cam.x+W+ts;tx+=ts){
    for(let ty=sy;ty<cam.y+H+ts;ty+=ts){
      ctx.fillStyle=((Math.floor(tx/ts)+Math.floor(ty/ts))%2===0)?'#2d1a4a':'#341f54';
      ctx.fillRect(tx,ty,ts,ts);
    }
  }
  ctx.fillStyle='#4a2a6e';
  for(let tx=sx;tx<cam.x+W+ts;tx+=ts){
    for(let ty=sy;ty<cam.y+H+ts;ty+=ts){
      const seed=(tx*374761+ty*668265)&0xfffff;
      const fx=tx+(seed%60)+10,fy=ty+((seed>>4)%60)+10;
      ctx.beginPath();ctx.arc(fx,fy,1.5,0,Math.PI*2);ctx.fill();
      const seed2=(tx*112741+ty*334217)&0xfffff;
      if(seed2%7===0){
        const fx2=tx+(seed2%70)+5,fy2=ty+((seed2>>3)%70)+5;
        ctx.fillStyle='#7a3a9e';
        ctx.fillRect(fx2-1,fy2-3,2,6);
        ctx.fillRect(fx2-3,fy2-1,6,2);
        ctx.fillStyle='#4a2a6e';
      }
    }
  }
  ctx.strokeStyle='#6a2a8e';ctx.lineWidth=5;
  ctx.strokeRect(0,0,WORLD,WORLD);
  ctx.shadowBlur=0;
}

function drawEnemy(e){
  ctx.save();
  ctx.translate(e.x+(e.shakeX||0),e.y+(e.shakeY||0));
  if(e.flash>.08&&Math.floor(e.flash*12)%2===0)ctx.globalAlpha=.4;

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
        ctx.setLineDash([8,6]);ctx.lineDashOffset=-(Date.now()*0.08%14);
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

  }else{
    // Egg Chucker
    ctx.fillStyle='#ddaa55';
    ctx.beginPath();ctx.ellipse(0,0,e.r*.75,e.r,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a0a2e';ctx.lineWidth=2.5;ctx.stroke();
    ctx.fillStyle='#cc2222';
    ctx.beginPath();ctx.arc(-2,-e.r,2.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(1,-e.r*1.1,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(4,-e.r*.95,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c97d2e';
    ctx.beginPath();ctx.moveTo(e.r*.45,-e.r*.25);ctx.lineTo(e.r*.85,-e.r*.12);ctx.lineTo(e.r*.45,-e.r*.02);ctx.closePath();ctx.fill();
    ctx.fillStyle='#1a0a2e';
    ctx.beginPath();ctx.arc(e.r*.18,-e.r*.3,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff2222';
    ctx.beginPath();ctx.arc(e.r*.18,-e.r*.3,1.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f5f0d0';ctx.strokeStyle='#1a0a2e';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(-e.r*.3,e.r*.3,3.5,4.5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.5)';
    ctx.beginPath();ctx.arc(-e.r*.3,-e.r*.4,1.5,0,Math.PI*2);ctx.fill();
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
  const mx=W-84,my=H-84,ms=72,sc=ms/WORLD;
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.strokeStyle='#330000';ctx.lineWidth=1;
  ctx.fillRect(mx,my,ms,ms);ctx.strokeRect(mx,my,ms,ms);
  ctx.fillStyle='#cc3333';
  for(const e of enemies){ctx.fillRect(mx+e.x*sc-1,my+e.y*sc-1,2,2);}
  ctx.fillStyle='#ffcc44';
  for(const c of chests){ctx.beginPath();ctx.arc(mx+c.x*sc,my+c.y*sc,3,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#cc2222';
  ctx.beginPath();ctx.arc(mx+pl.x*sc,my+pl.y*sc,3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(204,34,34,.4)';ctx.lineWidth=1;
  ctx.strokeRect(mx+cam.x*sc,my+cam.y*sc,W*sc,H*sc);
}

function drawChest(c){
  const x=c.x,y=c.y,fill=c.fill||0;
  const bob=Math.sin(Date.now()*.003)*3;

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

  const pulse=.5+Math.sin(Date.now()*.005)*.5;
  ctx.globalAlpha=pulse*.4;
  ctx.beginPath();ctx.arc(0,4,22,0,Math.PI*2);
  ctx.fillStyle='#ffcc44';ctx.fill();
  ctx.globalAlpha=1;

  ctx.restore();
}

function drawChestArrow(chest){
  const angle=Math.atan2(chest.y-pl.y,chest.x-pl.x);
  const dist=Math.floor(Math.hypot(chest.x-pl.x,chest.y-pl.y));

  // Find screen-edge position along the angle
  const cx=W/2,cy=H/2,pad=32;
  const hw=cx-pad,hh=cy-pad;
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const sX=cos!==0?hw/Math.abs(cos):Infinity;
  const sY=sin!==0?hh/Math.abs(sin):Infinity;
  const s=Math.min(sX,sY);
  const ax=cx+cos*s,ay=cy+sin*s;

  const pulse=.75+Math.sin(Date.now()*.006)*.25;

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
  ctx.fillText(dist+'m',0,16);

  ctx.restore();
}
