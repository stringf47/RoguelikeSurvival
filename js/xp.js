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
  currentChoices=genChestChoices();
  selectedCardIdx=0;
  const cc=document.getElementById('cardContainer');
  cc.innerHTML='';
  for(const c of currentChoices){
    const curLv=c.isW?(pl.weapons.find(w=>w.type===c.key)?.level||0):(pl.passives[c.key]||0);
    const nLv=curLv+1;const isNew=c.isW&&curLv===0;
    const el=document.createElement('div');el.className='card';
    if(c.isLegendary){el.style.borderColor='#cc8833';el.style.boxShadow='0 0 22px #cc883355';}
    el.innerHTML=`<div class="ci">${c.icon}</div>
      <div class="badge" style="${c.isLegendary?'background:#2a1500;color:#cc8833':''}">${c.isLegendary?'LEGENDARY':isNew?'NEW':'LVL '+nLv}</div>
      <div class="cn" style="${c.isLegendary?'color:#cc8833':''}">${c.name}</div>
      <div class="cd">${c.desc}</div>`;
    el.onclick=()=>pickUpgrade(c);
    cc.appendChild(el);
  }
  document.getElementById('lvlScreen').classList.remove('hidden');
  syncCardSelection();
}

function addXP(v){
  totalXp+=v;
  pl.xp+=v;
  while(pl.xp>=pl.xpNext){pl.xp-=pl.xpNext;pl.level++;pl.xpNext=XP_CURVE(pl.level);pendingLU++;}
  if(pendingLU>0&&state==='playing')triggerLU();
}

function triggerLU(){
  if(pendingLU<=0)return;
  pendingLU--;
  state='levelup';
  for(const k in keys)keys[k]=false;
  currentChoices=genChoices(3);
  selectedCardIdx=0;
  const cc=document.getElementById('cardContainer');
  cc.innerHTML='';
  for(const c of currentChoices){
    const curLv=c.isW?(pl.weapons.find(w=>w.type===c.key)?.level||0):(pl.passives[c.key]||0);
    const nLv=curLv+1;
    const isNew=c.isW&&curLv===0;
    const el=document.createElement('div');el.className='card';
    el.innerHTML=`<div class="ci">${c.icon}</div><div class="badge">${isNew?'NEW':'LVL '+nLv}</div><div class="cn">${c.name}</div><div class="cd">${c.desc}</div>`;
    el.onclick=()=>pickUpgrade(c);
    cc.appendChild(el);
  }
  document.getElementById('lvlScreen').classList.remove('hidden');
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
  if(pendingLU>0)setTimeout(triggerLU,80);
}
