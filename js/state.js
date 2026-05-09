/* ── CANVAS ── */
const canvas=document.getElementById('gc');
const ctx=canvas.getContext('2d');

/* ── GAME STATE ── */
let state='menu',gameTime=0,kills=0,lastTS=0,paused=false,wave=0,endless=false;
let totalDmg=0,totalXp=0,vacuumT=0,dmgLog=[];
let currentChoices=[],selectedCardIdx=0;
let enemies=[],projs=[],xpGems=[],auras=[],particles=[],lightnings=[],hpDrops=[],dmgNums=[],toxicClouds=[],eggs=[],magnetDrops=[];
let spawnT=0,eid=0,eggId=0,pendingLU=0;
let cam={x:0,y:0},shake={x:0,y:0,t:0};
let pl={};
let hordeT={};
let chests=[],chestSpawnIdx=0;
let corruptedZones=[];
