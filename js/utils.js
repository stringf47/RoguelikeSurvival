function nearest(){
  let b=null,bd=Infinity;
  for(const e of enemies){
    if(e.dead)continue;
    const d=Math.hypot(e.x-pl.x,e.y-pl.y);
    if(d<bd){bd=d;b=e;}
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

function onScreen(x,y,pad=0){
  return x>cam.x-pad&&x<cam.x+W+pad&&y>cam.y-pad&&y<cam.y+H+pad;
}
