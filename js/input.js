const keys={};
const JRADIUS=65;
const JBASE={x:110,y:490};
const joystick={active:false,id:-1,knobX:110,knobY:490,dx:0,dy:0};

function toCanvas(t){
  const r=canvas.getBoundingClientRect();
  return{x:(t.clientX-r.left)*(800/r.width),y:(t.clientY-r.top)*(600/r.height)};
}

canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(!joystick.active){
      joystick.active=true;joystick.id=t.identifier;
      joystick.knobX=JBASE.x;joystick.knobY=JBASE.y;
      joystick.dx=0;joystick.dy=0;
    }
  }
},{passive:false});

document.addEventListener('touchmove',e=>{
  if(!joystick.active)return;
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===joystick.id){
      const p=toCanvas(t);
      const ddx=p.x-JBASE.x,ddy=p.y-JBASE.y;
      const dist=Math.hypot(ddx,ddy);
      const ang=Math.atan2(ddy,ddx);
      const clamped=Math.min(dist,JRADIUS);
      joystick.knobX=JBASE.x+Math.cos(ang)*clamped;
      joystick.knobY=JBASE.y+Math.sin(ang)*clamped;
      joystick.dx=dist>10?Math.cos(ang):0;
      joystick.dy=dist>10?Math.sin(ang):0;
    }
  }
},{passive:false});

document.addEventListener('touchend',e=>{
  for(const t of e.changedTouches){
    if(t.identifier===joystick.id){
      joystick.active=false;
      joystick.knobX=JBASE.x;joystick.knobY=JBASE.y;
      joystick.dx=0;joystick.dy=0;
    }
  }
},{passive:false});

window.addEventListener('keydown',e=>{
  if(state==='levelup'){
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){
      selectedCardIdx=(selectedCardIdx-1+currentChoices.length)%currentChoices.length;
      syncCardSelection();e.preventDefault();return;
    }
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){
      selectedCardIdx=(selectedCardIdx+1)%currentChoices.length;
      syncCardSelection();e.preventDefault();return;
    }
    if(e.key===' '||e.key==='Enter'){
      pickUpgrade(currentChoices[selectedCardIdx]);e.preventDefault();return;
    }
  }
  if(e.key==='Escape'&&state==='playing'){
    paused=!paused;
    document.getElementById('pauseBanner').style.display=paused?'block':'none';
  }
  keys[e.key]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
});

window.addEventListener('keyup',e=>{keys[e.key]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});

function getDir(){
  let dx=0,dy=0;
  if(keys['ArrowLeft']||keys['a']||keys['A'])dx-=1;
  if(keys['ArrowRight']||keys['d']||keys['D'])dx+=1;
  if(keys['ArrowUp']||keys['w']||keys['W'])dy-=1;
  if(keys['ArrowDown']||keys['s']||keys['S'])dy+=1;
  dx+=joystick.dx;dy+=joystick.dy;
  if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;pl.lastAngle=Math.atan2(dy,dx);}
  return{dx,dy};
}
