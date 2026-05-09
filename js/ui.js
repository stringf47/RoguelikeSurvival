/* ── CACHED DOM REFS ── */
const _hpFill=document.getElementById('hpFill');
const _hpNum=document.getElementById('hpNum');
const _hpWrap=document.getElementById('hpWrap');
const _hpTrack=document.getElementById('hpTrack');
const _timer=document.getElementById('timer');
const _kcnt=document.getElementById('kcnt');
const _lvldsp=document.getElementById('lvldsp');
const _xpFill=document.getElementById('xpFill');
const _dmgcnt=document.getElementById('dmgcnt');
const _xpcnt=document.getElementById('xpcnt');
const _dpscnt=document.getElementById('dpscnt');
const _wbar=document.getElementById('wbar');
const _legBar=document.getElementById('legendaryBar');
const _chestInd=document.getElementById('chestIndicator');
_showTooltip(_chestInd,'CHEST NEARBY','Approach the chest and stand close to open it');
const _tooltip=document.getElementById('hudTooltip');
const _sealBanner=document.getElementById('sealBanner');
const _sealTimer=document.getElementById('sealTimer');
const _sealMessage=document.getElementById('sealMessage');
const _surgeBanner=document.getElementById('surgeBanner');
const _surgeBannerMain=document.getElementById('surgeBannerMain');
const _surgeBannerCount=document.getElementById('surgeBannerCount');

let _lastHudT=0;
let _wbSig='';
let _legSig='';

function _showTooltip(el, name, desc){
  el.addEventListener('mouseenter', e=>{
    _tooltip.innerHTML=`<span class="tt-name">${name}</span>${desc}`;
    _tooltip.style.display='block';
    _posTooltip(e);
  });
  el.addEventListener('mousemove', _posTooltip);
  el.addEventListener('mouseleave', ()=>{ _tooltip.style.display='none'; });
}
function _posTooltip(e){
  const wrap=document.getElementById('wrap').getBoundingClientRect();
  const s=wrap.width/800;
  let x=(e.clientX-wrap.left)/s+12, y=(e.clientY-wrap.top)/s-80;
  if(x+210>800)x-=220;
  if(y<4)y=4;
  _tooltip.style.left=x+'px';
  _tooltip.style.top=y+'px';
}

function updateHUD(){
  const now=performance.now();
  if(now-_lastHudT<100)return;
  _lastHudT=now;

  const hpPct=pl.hp/pl.maxHp;
  _hpFill.style.width=(hpPct*100)+'%';
  _hpFill.classList.toggle('low', hpPct<=0.3);
  _hpNum.textContent=Math.ceil(pl.hp)+' / '+pl.maxHp;
  _timer.textContent=fmt(gameTime);
  _kcnt.textContent='✦ '+kills+' SOULS FREED';
  _lvldsp.textContent='✦ LVL '+pl.level;
  _xpFill.style.width=(pl.xp/pl.xpNext*100)+'%';
  _dmgcnt.textContent='⚔ '+(totalDmg>=1000?(totalDmg/1000).toFixed(1)+'k':totalDmg)+' DMG';
  _xpcnt.textContent='★ '+totalXp+' XP';
  _dpscnt.textContent='⚡ '+calcDPS()+' DPS';

  const barW=160+Math.max(0,pl.maxHp-100)*0.5;
  _hpWrap.style.width=barW+'px';
  _hpTrack.style.height=(13+Math.max(0,pl.maxHp-100)*0.05)+'px';

  // Weapon slots with tooltips
  const wSig=pl.weapons.map(w=>w.type+w.level).join(',');
  if(wSig!==_wbSig){
    _wbSig=wSig;
    _wbar.innerHTML='';
    for(const w of pl.weapons){
      const def=WDEFS[w.type];
      const s=document.createElement('div');s.className='wslot';
      s.innerHTML=def.icon+'<span class="wlv">'+w.level+'</span>';
      _showTooltip(s, def.name, def.desc);
      _wbar.appendChild(s);
    }
  }

  // Legendary icons below HP bar
  const legSig=Object.entries(pl.passives).filter(([k])=>PDEFS[k]?.isLegendary&&pl.passives[k]>0).map(([k])=>k).join(',');
  if(legSig!==_legSig){
    _legSig=legSig;
    _legBar.innerHTML='';
    for(const [k,v] of Object.entries(pl.passives)){
      if(!v||!PDEFS[k]?.isLegendary)continue;
      const def=PDEFS[k];
      const el=document.createElement('div');el.className='legSlot';
      el.textContent=def.icon;
      _showTooltip(el, def.name, def.desc);
      _legBar.appendChild(el);
    }
  }

  // Damage surge banner
  const S1=300,S2=450,CD=10;
  const sealVisible=_sealBanner.style.display!=='none';
  _surgeBanner.style.top=sealVisible?'38px':'8px';
  _surgeBanner.classList.remove('surge-warning','surge-active');
  if(gameTime>=S2){
    _surgeBanner.style.display='flex';
    _surgeBanner.classList.add('surge-active');
    _surgeBannerMain.textContent='⚔ 2× ENEMY DAMAGE';
    _surgeBannerCount.style.display='none';
  }else if(gameTime>=S2-CD){
    const s=Math.ceil(S2-gameTime);
    _surgeBanner.style.display='flex';
    _surgeBanner.classList.add('surge-warning');
    _surgeBannerMain.textContent='⚔ 2× DAMAGE SURGE';
    _surgeBannerCount.style.display='block';
    _surgeBannerCount.textContent=s+'s';
  }else if(gameTime>=S1){
    _surgeBanner.style.display='flex';
    _surgeBanner.classList.add('surge-active');
    _surgeBannerMain.textContent='⚔ 1.5× ENEMY DAMAGE';
    _surgeBannerCount.style.display='none';
  }else if(gameTime>=S1-CD){
    const s=Math.ceil(S1-gameTime);
    _surgeBanner.style.display='flex';
    _surgeBanner.classList.add('surge-warning');
    _surgeBannerMain.textContent='⚔ 1.5× DAMAGE SURGE';
    _surgeBannerCount.style.display='block';
    _surgeBannerCount.textContent=s+'s';
  }else{
    _surgeBanner.style.display='none';
  }

  // Chest indicator
  const hasChest=typeof chests!=='undefined'&&chests.some(c=>!c.done);
  _chestInd.style.display=hasChest?'block':'none';

  // Seal banner (timer pill) + message below stats
  if(typeof seals!=='undefined'&&seals.length>0){
    _sealBanner.style.display='flex';
    _sealBanner.classList.remove('buffed');
    _sealTimer.textContent='⛧ '+Math.ceil(seals[0].timeLeft)+'s';
    _sealMessage.style.display='block';
    _sealMessage.style.color='#cc77ff';
    _sealMessage.innerHTML='⛧ DESTROY THE STRENGTHENING SEAL<br><span style="color:#9955cc;font-size:9px;letter-spacing:1px">Upon survival, strengthens enemies for 1 minute</span>';
  }else if(typeof sealBuffActive!=='undefined'&&sealBuffActive){
    _sealBanner.style.display='flex';
    _sealBanner.classList.add('buffed');
    _sealTimer.textContent='☠ STRENGTHENED';
    _sealMessage.style.display='block';
    _sealMessage.style.color='#ff6688';
    _sealMessage.textContent='☠ ENEMIES STRENGTHENED FOR '+fmt(sealBuffT);
  }else{
    _sealBanner.classList.remove('buffed');
    _sealBanner.style.display='none';
    _sealMessage.style.display='none';
  }
}

function calcDPS(){
  let sum=0;
  for(const d of dmgLog)sum+=d.v;
  return Math.floor(sum/10);
}
