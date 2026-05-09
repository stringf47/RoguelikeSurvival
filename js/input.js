const keys={};
const JRADIUS=60;
const joystick={active:false,id:-1,baseX:0,baseY:0,knobX:0,knobY:0,dx:0,dy:0};

function toCanvas(t){
  const r=canvas.getBoundingClientRect();
  return{x:(t.clientX-r.left)*(800/r.width),y:(t.clientY-r.top)*(600/r.height)};
}

window.addEventListener('touchstart',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    const p=toCanvas(t);
    if(p.x<400&&!joystick.active){
      joystick.active=true;joystick.id=t.identifier;
      joystick.baseX=p.x;joystick.baseY=p.y;
      joystick.knobX=p.x;joystick.knobY=p.y;
      joystick.dx=0;joystick.dy=0;
    }
  }
},{passive:false});

window.addEventListener('touchmove',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===joystick.id){
      const p=toCanvas(t);
      const ddx=p.x-joystick.baseX,ddy=p.y-joystick.baseY;
      const dist=Math.hypot(ddx,ddy);
      const ang=Math.atan2(ddy,ddx);
      const clamped=Math.min(dist,JRADIUS);
      joystick.knobX=joystick.baseX+Math.cos(ang)*clamped;
      joystick.knobY=joystick.baseY+Math.sin(ang)*clamped;
      joystick.dx=dist>8?Math.cos(ang):0;
      joystick.dy=dist>8?Math.sin(ang):0;
    }
  }
},{passive:false});

window.addEventListener('touchend',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===joystick.id){
      joystick.active=false;joystick.dx=0;joystick.dy=0;
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
