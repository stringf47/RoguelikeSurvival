const LEGENDARIES=['martyrdom','carrionCall','unholyGround','plagueBearer','finalStand'];

function genChestChoices(){
  const avail=LEGENDARIES.filter(k=>!pl.passives[k]);
  const choices=[];

  // Guarantee one legendary
  if(avail.length>0){
    const k=avail[Math.floor(Math.random()*avail.length)];
    const d=PDEFS[k];
    choices.push({key:k,isW:false,isLegendary:true,name:d.name,icon:d.icon,desc:d.desc});
  }

  // Fill remaining slots with weapons (new or levelable)
  const wPool=Object.entries(WDEFS).map(([k,d])=>{
    const owned=pl.weapons.find(w=>w.type===k);
    if(owned&&owned.level>=d.maxLevel)return null;
    const desc=owned&&d.upgradeDesc?d.upgradeDesc(owned.level+1):d.desc;
    return{key:k,isW:true,isLegendary:false,name:d.name,icon:d.icon,desc};
  }).filter(Boolean);
  for(let i=wPool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[wPool[i],wPool[j]]=[wPool[j],wPool[i]];}
  choices.push(...wPool.slice(0,3-choices.length));

  // Pad with extra legendaries if still short
  if(choices.length<3){
    const more=avail.filter(k=>!choices.find(c=>c.key===k));
    for(const k of more.slice(0,3-choices.length)){
      const d=PDEFS[k];choices.push({key:k,isW:false,isLegendary:true,name:d.name,icon:d.icon,desc:d.desc});
    }
  }

  for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  return choices.slice(0,3);
}

function openChest(){
  state='levelup';
  for(const k in keys)keys[k]=false;
  stopAllDrones();playChestSound();
  currentChoices=genChestChoices();
  selectedCardIdx=Math.floor(currentChoices.length/2);
  const ls=document.getElementById('lvlScreen');
  ls.classList.add('chest-mode');
  document.getElementById('lvlTitle').textContent='✦ GIFT OF THE FARM ✦';
  const cc=document.getElementById('cardContainer');
  cc.innerHTML='';
  for(const c of currentChoices){
    const curLv=c.isW?(pl.weapons.find(w=>w.type===c.key)?.level||0):(pl.passives[c.key]||0);
    const nLv=curLv+1;const isNew=c.isW&&curLv===0;
    const badgeLabel=c.isLegendary?'LEGENDARY':(isNew?'NEW':'LVL '+nLv);
    const el=document.createElement('div');el.className='card';
    el.innerHTML=`<div class="ci">${c.icon}</div>
      <div class="badge">${badgeLabel}</div>
      <div class="cn">${c.name}</div>
      <div class="cd">${c.desc}</div>`;
    el.onclick=()=>pickUpgrade(c);
    cc.appendChild(el);
  }
  ls.classList.remove('hidden');
  syncCardSelection();
}

let luWaving=false;
let playerFrozen=false;

function addXP(v){
  totalXp+=v;
  pl.xp+=v;
  while(pl.xp>=pl.xpNext){pl.xp-=pl.xpNext;pl.level++;pl.xpNext=XP_CURVE(pl.level);pendingLU++;}
  if(pendingLU>0&&state==='playing'&&!luWaving)triggerLU();
}

function triggerLU(){
  if(pendingLU<=0)return;
  pendingLU--;
  for(const k in keys)keys[k]=false;
  stopAllDrones();playLevelUpSound();

  // Pre-build cards (screen stays hidden until wave finishes)
  currentChoices=genChoices(3);
  selectedCardIdx=Math.floor(currentChoices.length/2);
  const cc=document.getElementById('cardContainer');
  cc.innerHTML='';
  for(const c of currentChoices){
    const curLv=c.isW?(pl.weapons.find(w=>w.type===c.key)?.level||0):(pl.passives[c.key]||0);
    const nLv=curLv+1;
    const isNew=c.isW&&curLv===0;
    const badgeLabel=c.isLegendary?'LEGENDARY':(isNew?'NEW':'LVL '+nLv);
    const el=document.createElement('div');el.className='card';
    el.innerHTML=`<div class="ci">${c.icon}</div><div class="badge">${badgeLabel}</div><div class="cn">${c.name}</div><div class="cd">${c.desc}</div>`;
    el.onclick=()=>pickUpgrade(c);
    cc.appendChild(el);
  }

  luWaving=true;
  playerFrozen=true;
  _levelUpWave();
  setTimeout(()=>{
    luWaving=false;
    if(state==='playing')_showLevelUpMenu();
  },500);
}

function _levelUpWave(){
  for(const e of enemies) e.kbHit=false;
  const COLS=['#bb55ff','#7744ff','#5599ff','#dd88ff','#aaccff'];
  // Single ring matching the knockback wave speed
  for(let i=0;i<28;i++){
    const a=(i/28)*Math.PI*2;
    const col=COLS[i%COLS.length];
    const life=1.26+Math.random()*.54;
    particles.push({x:pl.x,y:pl.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,
      life,maxLife:life,r:3.5+Math.random()*4,col,glow:col});
  }
  // White core flash
  for(let i=0;i<12;i++){
    const a=Math.random()*Math.PI*2,spd=80+Math.random()*140;
    const life=.25+Math.random()*.2;
    particles.push({x:pl.x,y:pl.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      life,maxLife:life,r:2+Math.random()*3,col:'#ffffff',glow:'#cc88ff'});
  }
  // Omnidirectional burst (like deathBurst but mana-coloured)
  const BCOLS=['#bb55ff','#7744ff','#5599ff','#dd88ff'];
  for(let i=0;i<28;i++){
    const a=Math.random()*Math.PI*2,spd=60+Math.random()*100;
    const col=BCOLS[i%BCOLS.length],life=.35+Math.random()*.3;
    particles.push({x:pl.x,y:pl.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      life,maxLife:life,r:3.5+Math.random()*5,col,glow:col});
  }
  for(let i=0;i<18;i++){
    const a=Math.random()*Math.PI*2,spd=100+Math.random()*140;
    const col=BCOLS[i%BCOLS.length],life=.15+Math.random()*.15;
    particles.push({x:pl.x,y:pl.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,
      life,maxLife:life,r:1+Math.random()*2,col,glow:col});
  }
  auras.push({x:pl.x,y:pl.y,r:0,maxR:80,life:.35,maxLife:.35,rgb:'170,68,255'});
  // Give player iframes for the wave duration
  pl.iframes=Math.max(pl.iframes||0, 1.1);
  // Instant knockback
  for(const e of enemies){
    if(e.dead)continue;
    const dx=e.x-pl.x,dy=e.y-pl.y,dist=Math.hypot(dx,dy);
    if(dist<150&&dist>0){
      const force=1100*(1-dist/150)+300;
      e.kbVx=(dx/dist)*force; e.kbVy=(dy/dist)*force; e.kbT=1.0; e.kbHit=true;
    }
  }
}

function _showLevelUpMenu(){
  state='levelup';
  const ls=document.getElementById('lvlScreen');
  ls.classList.remove('chest-mode','hidden');
  document.getElementById('lvlTitle').textContent='✦ THE SHEPHERD GROWS ✦';
  syncCardSelection();
}

function syncCardSelection(){
  const cards=document.getElementById('cardContainer').querySelectorAll('.card');
  cards.forEach((el,i)=>el.classList.toggle('selected',i===selectedCardIdx));
}

function genChoices(n){
  const pool=[];
  for(const w of pl.weapons){
    const d=WDEFS[w.type];
    if(w.level<d.maxLevel)pool.push({key:w.type,isW:true,name:d.name,icon:d.icon,desc:d.upgradeDesc?d.upgradeDesc(w.level+1):d.desc});
  }
  if(pl.weapons.length<6&&Math.random()<(pl.weapons.length<3?0.70:0.35)){
    const own=pl.weapons.map(w=>w.type);
    const avail=Object.entries(WDEFS).filter(([k])=>!own.includes(k));
    if(avail.length>0){const[k,d]=avail[Math.floor(Math.random()*avail.length)];pool.push({key:k,isW:true,name:d.name,icon:d.icon,desc:d.desc});}
  }
  const weaponSpecific=[];
  for(const[k,d]of Object.entries(PDEFS)){
    const lv=pl.passives[k]||0;
    if(d.isLegendary)continue;
    if(lv>=d.maxLevel)continue;
    if(d.weaponReq){
      if(pl.weapons.find(w=>w.type===d.weaponReq))
        weaponSpecific.push({key:k,isW:false,name:d.name,icon:d.icon,desc:d.descFn?d.descFn(lv+1):d.desc});
    } else {
      pool.push({key:k,isW:false,name:d.name,icon:d.icon,desc:d.descFn?d.descFn(lv+1):d.desc});
    }
  }
  if(weaponSpecific.length>0){
    const pick=weaponSpecific[Math.floor(Math.random()*weaponSpecific.length)];
    pool.push(pick);
  }
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,Math.min(n,pool.length));
}

function pickUpgrade(c){
  playPickSound();
  if(c.isW){
    const ex=pl.weapons.find(w=>w.type===c.key);
    if(ex){
      ex.level=Math.min(ex.level+1,WDEFS[ex.type].maxLevel);
      if(WDEFS[ex.type].init)WDEFS[ex.type].init(ex);
      pl.wLvDmgMult=(pl.wLvDmgMult||1)*1.04;
      pl.wLvAtkMult=(pl.wLvAtkMult||1)*1.02;
    }
    else addWeapon(c.key);
  } else {
    pl.passives[c.key]=(pl.passives[c.key]||0)+1;
    PDEFS[c.key].apply(pl.passives[c.key]);
  }
  document.getElementById('lvlScreen').classList.add('hidden');
  state='playing';
  playerFrozen=false;
  if(pendingLU>0)setTimeout(triggerLU,80);
}
