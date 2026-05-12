const keys={};
const JRADIUS=65;
const JBASE={x:665,y:465};
const joystick={active:false,id:-1,knobX:665,knobY:465,dx:0,dy:0};
let joySide='right';

function _applyJoySide(side){
  joySide=side;
  JBASE.x=side==='left'?135:665;
  const a=side==='left'?'right':'left',b=side==='left'?'left':'right';
  ['muteBtn','pauseBtn'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.style[a]='12px';el.style[b]='auto';
  });
}

function toCanvas(clientX,clientY){
  const r=canvas.getBoundingClientRect();
  return{x:(clientX-r.left)*(800/r.width),y:(clientY-r.top)*(600/r.height)};
}

function resetJoystick(){
  joystick.active=false;joystick.id=-1;
  joystick.knobX=JBASE.x;joystick.knobY=JBASE.y;
  joystick.dx=0;joystick.dy=0;
}

canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse')return;
  e.preventDefault();
  if(!joystick.active){
    const p=toCanvas(e.clientX,e.clientY);
    _applyJoySide(p.x<400?'left':'right');
    joystick.active=true;joystick.id=e.pointerId;
    joystick.knobX=JBASE.x;joystick.knobY=JBASE.y;
    joystick.dx=0;joystick.dy=0;
    canvas.setPointerCapture(e.pointerId);
  }
},{passive:false});

canvas.addEventListener('pointermove',e=>{
  if(e.pointerId!==joystick.id)return;
  e.preventDefault();
  const p=toCanvas(e.clientX,e.clientY);
  const ddx=p.x-JBASE.x,ddy=p.y-JBASE.y;
  const dist=Math.hypot(ddx,ddy),ang=Math.atan2(ddy,ddx);
  joystick.knobX=JBASE.x+Math.cos(ang)*Math.min(dist,JRADIUS);
  joystick.knobY=JBASE.y+Math.sin(ang)*Math.min(dist,JRADIUS);
  joystick.dx=dist>10?Math.cos(ang):0;
  joystick.dy=dist>10?Math.sin(ang):0;
},{passive:false});

canvas.addEventListener('pointerup',e=>{ if(e.pointerId===joystick.id)resetJoystick(); });
canvas.addEventListener('pointercancel',e=>{ if(e.pointerId===joystick.id)resetJoystick(); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden)resetJoystick(); });

window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(state==='levelup'){
    if(k==='arrowleft'||k==='a'){selectedCardIdx=(selectedCardIdx-1+currentChoices.length)%currentChoices.length;syncCardSelection();e.preventDefault();return;}
    if(k==='arrowright'||k==='d'){selectedCardIdx=(selectedCardIdx+1)%currentChoices.length;syncCardSelection();e.preventDefault();return;}
    if(k===' '||k==='enter'){pickUpgrade(currentChoices[selectedCardIdx]);e.preventDefault();return;}
  }
  if(k==='escape'&&state==='playing'){togglePause();e.preventDefault();return;}
  keys[k]=true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
});

window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;resetJoystick();});
window.addEventListener('focus',()=>{for(const k in keys)keys[k]=false;});

function getDir(){
  let dx=0,dy=0;
  if(keys['arrowleft']||keys['a'])dx-=1;
  if(keys['arrowright']||keys['d'])dx+=1;
  if(keys['arrowup']||keys['w'])dy-=1;
  if(keys['arrowdown']||keys['s'])dy+=1;
  dx+=joystick.dx;dy+=joystick.dy;
  if(dx||dy){
    const l=Math.hypot(dx,dy);dx/=l;dy/=l;
    pl.lastAngle=Math.atan2(dy,dx);
    if(!hasMovedOnce)onFirstMove();
  }
  return{dx,dy};
}
