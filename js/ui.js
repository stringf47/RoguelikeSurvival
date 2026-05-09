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

let _lastHudT=0;
let _wbSig='';

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

  const wSig=pl.weapons.map(w=>w.type+w.level).join(',');
  if(wSig!==_wbSig){
    _wbSig=wSig;
    _wbar.innerHTML='';
    for(const w of pl.weapons){
      const s=document.createElement('div');s.className='wslot';
      s.innerHTML=WDEFS[w.type].icon+'<span class="wlv">'+w.level+'</span>';
      _wbar.appendChild(s);
    }
  }
}

function calcDPS(){
  let sum=0;
  for(const d of dmgLog)sum+=d.v;
  return Math.floor(sum/10);
}
