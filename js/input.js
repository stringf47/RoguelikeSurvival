const keys={};

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
  if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;pl.lastAngle=Math.atan2(dy,dx);}
  return{dx,dy};
}
