const keys={};
const JRADIUS=65;
const JBASE={x:665,y:465};
const joystick={active:false,id:-1,knobX:665,knobY:465,dx:0,dy:0};
let touchDevice=false;
let joySide='right';
let joyActivated=false;

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

function _activateJoy(side){
  _applyJoySide(side);
  if(!joyActivated){
    joyActivated=true;
    ['muteBtn','pauseBtn'].forEach(id=>{
      const el=document.getElementById(id);
      if(el)el.style.visibility='';
    });
    const tp=document.getElementById('touchPrompt');
    if(tp){
      setTimeout(()=>{ tp.style.opacity='0'; },800);
      setTimeout(()=>{ tp.style.display='none'; },1700);
    }
  }
}

function showTouchPrompt(){
  const tp=document.getElementById('touchPrompt');
  if(!tp)return;
  tp.style.opacity='1';
  tp.style.display='block';
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
  if(!touchDevice){
    touchDevice=true;
    ['muteBtn','pauseBtn'].forEach(id=>{
      const el=document.getElementById(id);
      if(el)el.style.visibility='hidden';
    });
  }
  if(!joystick.active){
    const p=toCanvas(e.clientX,e.clientY);
    _activateJoy(p.x<400?'left':'right');
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
  const dist=Math.hypot(ddx,ddy);
  const ang=Math.atan2(ddy,ddx);
  joystick.knobX=JBASE.x+Math.cos(ang)*Math.min(dist,JRADIUS);
  joystick.knobY=JBASE.y+Math.sin(ang)*Math.min(dist,JRADIUS);
  joystick.dx=dist>10?Math.cos(ang):0;
  joystick.dy=dist>10?Math.sin(ang):0;
},{passive:false});

canvas.addEventListener('pointerup',e=>{ if(e.pointerId===joystick.id)resetJoystick(); });
canvas.addEventListener('pointercancel',e=>{ if(e.pointerId===joystick.id)resetJoystick(); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden)resetJoystick(); });

window.addEventListener('keydown',e=>{
  if(state==='levelup'){
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){selectedCardIdx=(selectedCardIdx-1+currentChoices.length)%currentChoices.length;syncCardSelection();e.preventDefault();return;}
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){selectedCardIdx=(selectedCardIdx+1)%currentChoices.length;syncCardSelection();e.preventDefault();return;}
    if(e.key===' '||e.key==='Enter'){pickUpgrade(currentChoices[selectedCardIdx]);e.preventDefault();return;}
  }
  if(e.key==='Escape'&&state==='playing'){paused=!paused;document.getElementById('pauseBanner').style.display=paused?'block':'none';}
  keys[e.key]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
});

window.addEventListener('keyup',e=>{keys[e.key]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;resetJoystick();});

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
