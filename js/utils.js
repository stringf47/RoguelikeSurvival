function nearest(){
  let b=null,bd=Infinity;
  for(const e of enemies){
    if(e.dead)continue;
    const d=Math.hypot(e.x-pl.x,e.y-pl.y);
    if(d<bd){bd=d;b=e;}
  }
  for(const s of seals){
    if(s.dead)continue;
    const d=Math.hypot(s.x-pl.x,s.y-pl.y);
    if(d<bd){bd=d;b=s;}
  }
  return b;
}

function addWeapon(type){
  const w={type,level:1,t:0};
  if(WDEFS[type].init)WDEFS[type].init(w);
  pl.weapons.push(w);
}

function wSpd(w){return pl.atkSpeedMult*(pl.wLvAtkMult||1)*(pl.wAtkMult[w.type]||1);}

function fmt(s){
  return String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
}

function lerpColor(a,b,t){
  const h=s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
  const [ar,ag,ab]=h(a),[br,bg,bb]=h(b);
  const r=(ar+(br-ar)*t)|0,g=(ag+(bg-ag)*t)|0,bl=(ab+(bb-ab)*t)|0;
  return'#'+(r*65536+g*256+bl).toString(16).padStart(6,'0');
}

function onScreen(x,y,pad=0){
  return x>cam.x-pad&&x<cam.x+W+pad&&y>cam.y-pad&&y<cam.y+H+pad;
}
