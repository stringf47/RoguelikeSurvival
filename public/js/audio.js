const A_KEYS=[
  {pad:['A2','E3','A3'], mel:['A3','C4','D4','E4','G4','A4','C5','E5']},
  {pad:['D2','A2','D3'], mel:['D3','F3','G3','A3','C4','D4','F4','G4']},
  {pad:['E2','B2','E3'], mel:['E3','G3','A3','B3','D4','E4','G4','A4']},
  {pad:['G2','D3','G3'], mel:['G3','Bb3','C4','D4','F4','G4','Bb4','C5']},
  {pad:['B1','F#2','B2'],mel:['B3','D4','E4','F#4','A4','B4','D5','E5']},
];
const A_TEMPOS=[100,114,126,140,155];
const ARP_PAT=[0,null,2,4,null,3,5];

let _ready=false,_muted=false,_lastWi=-1,_hitIdx=0,_menuIdx=0,_lastCombatHit=0;
let _pad,_lead,_bass,_kick,_snare,_hat,_sfx,_chestDroneGain,_xpDroneGain,_combatDroneGain;

function initAudio(){
  if(_ready)return;
  _ready=true;
  Tone.start();

  // Single limiter → destination; one compressor; one reverb
  const lim=new Tone.Limiter(-4).toDestination();
  const comp=new Tone.Compressor(-24,6).connect(lim);
  const rev=new Tone.Reverb({decay:2.5,wet:0.35}).connect(comp);

  // ── MUSIC ──
  _pad=new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:'square4'},
    envelope:{attack:0.4,decay:0.3,sustain:0.5,release:1.2},
    volume:-32
  }).connect(rev);

  const chorus=new Tone.Chorus(3,3.5,0.4).connect(rev).start();
  _lead=new Tone.AMSynth({
    harmonicity:1.5,
    oscillator:{type:'sine'},
    envelope:{attack:0.06,decay:0.4,sustain:0.15,release:1.4},
    modulation:{type:'triangle'},
    modulationEnvelope:{attack:0.1,decay:0.3,sustain:0.2,release:0.6},
    volume:-18
  }).connect(chorus);

  _bass=new Tone.MonoSynth({
    oscillator:{type:'sawtooth'},
    envelope:{attack:0.005,decay:0.18,sustain:0.15,release:0.08},
    filter:{Q:2,type:'lowpass'},
    filterEnvelope:{attack:0.005,decay:0.15,sustain:0.1,release:0.1,baseFrequency:100,octaves:3},
    volume:-26
  }).connect(comp);

  _kick=new Tone.MembraneSynth({pitchDecay:0.055,octaves:8,volume:-12}).connect(comp);
  _snare=new Tone.NoiseSynth({
    noise:{type:'white'},
    envelope:{attack:0.001,decay:0.1,sustain:0,release:0.03},
    volume:-22
  }).connect(new Tone.Filter(3500,'highpass').connect(comp));
  _hat=new Tone.MetalSynth({
    frequency:600,harmonicity:5.1,modulationIndex:16,
    envelope:{attack:0.001,decay:0.02,release:0.005},
    resonance:3200,octaves:1.2,volume:-28
  }).connect(comp);

  // ── SFX SYNTH: shared reverb, moderate volume ──
  _sfx=new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:'triangle4'},
    envelope:{attack:0.02,decay:0.4,sustain:0.0,release:1.5},
    volume:-10
  }).connect(rev);

  // ── CHEST DRONE: warm Dm7 chord hum — into shared reverb ──
  _chestDroneGain=new Tone.Gain(0).connect(rev);
  [
    {f:'D2',t:'triangle'},{f:'A2',t:'triangle'},
    {f:'F2',t:'sine'},{f:'C3',t:'sine'},
  ].forEach(({f,t})=>{
    const o=new Tone.Oscillator({type:t,frequency:f,volume:-16}).connect(_chestDroneGain);
    o.start();
  });

  _xpDroneGain=new Tone.Gain(0).connect(rev);
  const _xpSynth=new Tone.PolySynth(Tone.Synth,{
    oscillator:{type:'fatsawtooth',spread:20,count:2},
    envelope:{attack:1.4,decay:0.6,sustain:0.8,release:3.0},
    volume:-16
  }).connect(_xpDroneGain);
  new Tone.Sequence((time,chord)=>{
    _xpSynth.triggerAttackRelease(chord,'2m',time);
  },[['A2','E3'],['F2','C3'],['G2','D3'],['E2','B2']],'2m').start(0);

  _combatDroneGain=new Tone.Gain(0).connect(rev);
  const _combatSynth=new Tone.MonoSynth({
    oscillator:{type:'fatsawtooth',spread:22,count:2},
    envelope:{attack:0.008,decay:0.3,sustain:0.5,release:0.5},
    filter:{Q:2,type:'lowpass'},
    filterEnvelope:{attack:0.008,decay:0.4,sustain:0.35,release:0.3,baseFrequency:80,octaves:2.5},
    volume:0
  }).connect(_combatDroneGain);
  // 8 quarter notes = 8/4, A Lydian dominant — #4 (D#) and b7 (G) carry the tension
  new Tone.Sequence((time,val)=>{
    if(val===null)return;
    _combatSynth.triggerAttackRelease(val,'16n',time);
  },['A2',null,'E2','D#2','A2','G2',null,'F#2'],'8n').start(0);

  // ── SEQUENCES ──
  new Tone.Sequence(time=>{
    const k=A_KEYS[Math.min(Math.floor(bgWave||0),A_KEYS.length-1)];
    _pad.triggerAttackRelease(k.pad,'2n',time);
  },[0],'1m').start(0);

  let bs=0;
  new Tone.Sequence(time=>{
    const k=A_KEYS[Math.min(Math.floor(bgWave||0),A_KEYS.length-1)];
    const wi=Math.min(Math.floor(bgWave||0),A_KEYS.length-1);
    const pos=bs%8;
    if(pos===0||pos===4) _bass.triggerAttackRelease(k.pad[0],'8n',time);
    else if(wi>=1&&(pos===2||pos===6)) _bass.triggerAttackRelease(k.pad[0],'16n',time);
    bs++;
  },[0,1,2,3,4,5,6,7],'8n').start(0);

  new Tone.Sequence((time,val)=>{
    if(val===null)return;
    const k=A_KEYS[Math.min(Math.floor(bgWave||0),A_KEYS.length-1)];
    _lead.triggerAttackRelease(k.mel[val%k.mel.length],'4n',time);
  },ARP_PAT,'8n').start(0);

  let ds=0;
  new Tone.Sequence(time=>{
    const wi=Math.min(Math.floor(bgWave||0),A_KEYS.length-1);
    const pos=ds%16;
    if(pos%4===0) _kick.triggerAttackRelease('C1','8n',time);
    if(pos===4||pos===12) _snare.triggerAttackRelease('16n',time);
    if(wi>=2&&(pos===2||pos===10)) _snare.triggerAttackRelease('32n',time);
    if(pos%4===0||wi>=1&&pos%2===0||wi>=3) _hat.triggerAttackRelease('16n',time);
    ds++;
  },[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],'16n').start(0);

  Tone.Transport.bpm.value=A_TEMPOS[0];
  Tone.Transport.start();
}

function tickAudio(){
  if(!_ready)return;
  const wi=Math.min(Math.floor(bgWave||0),A_TEMPOS.length-1);
  if(wi!==_lastWi){_lastWi=wi;Tone.Transport.bpm.rampTo(A_TEMPOS[wi],2.5);}

  const playing=typeof state!=='undefined'&&state==='playing';
  const nearChest=playing&&typeof chests!=='undefined'&&chests.some(c=>!c.done&&Math.hypot(pl.x-c.x,pl.y-c.y)<CHEST_FILL_R);
  _chestDroneGain.gain.rampTo(nearChest?0.45:0,nearChest?0.5:1.0);

  // XP drone runs on playing + levelup + paused (not gameover/menu)
  const xpActive=typeof state!=='undefined'&&(state==='playing'||state==='levelup'||state==='paused');
  const pulling=xpActive&&typeof vacuumT!=='undefined'&&(vacuumT>0||(xpGems&&xpGems.some(g=>!g.done&&Math.hypot(pl.x-g.x,pl.y-g.y)<pl.magnet)));
  _xpDroneGain.gain.rampTo(pulling?0.4:0,pulling?0.3:1.2);
}

function playHitSound(){
  if(!_ready)return;
  const pitches=['F1','A1','D1','C2'];
  _kick.triggerAttackRelease(pitches[_hitIdx%4],'32n');
  _hitIdx++;
}

const _LU_VARS=[
  ['A3','E4'],
  ['D3','A3'],
  ['G3','D4'],
  ['E3','B3'],
];
function playLevelUpSound(){
  if(!_ready)return;
  const n=Tone.now();
  const [lo,hi]=_LU_VARS[_menuIdx%4];
  _sfx.triggerAttackRelease(lo,'4n',n);
  _sfx.triggerAttackRelease(hi,'4n',n+0.12);
}

const _PICK_VARS=[
  ['E4','C4','A3'],
  ['D4','B3','G3'],
  ['G4','E4','C4'],
  ['A4','E4','A3'],
];
function playPickSound(){
  if(!_ready)return;
  const n=Tone.now();
  const [a,b,c]=_PICK_VARS[_menuIdx%4];
  _menuIdx++;
  _sfx.triggerAttackRelease(a,'16n',n);
  _sfx.triggerAttackRelease(b,'16n',n+0.08);
  _sfx.triggerAttackRelease(c,'16n',n+0.16);
}

function playHeartSound(){
  if(!_ready)return;
  _sfx.triggerAttackRelease('G4','8n',Tone.now());
}

function playMagnetSound(){
  if(!_ready)return;
  const n=Tone.now();
  _sfx.triggerAttackRelease('E4','16n',n);
  _sfx.triggerAttackRelease('A4','8n',n+0.06);
}

function playChestSound(){
  if(!_ready)return;
  const n=Tone.now();
  _sfx.triggerAttackRelease('D3','4n',n);
  _sfx.triggerAttackRelease('A3','4n',n+0.12);
  _sfx.triggerAttackRelease('E4','2n',n+0.26);
}

function stopAllDrones(){
  if(!_ready)return;
  const n=Tone.now();
  _combatDroneGain.gain.cancelScheduledValues(n);
  _combatDroneGain.gain.linearRampToValueAtTime(0,n+0.15);
  _chestDroneGain.gain.rampTo(0,0.15);
}

function playEnemyHitDrone(){
  if(!_ready||typeof state==='undefined'||state!=='playing')return;
  const now=performance.now();
  if(now-_lastCombatHit<80)return;
  _lastCombatHit=now;
  const n=Tone.now();
  _combatDroneGain.gain.cancelScheduledValues(n);
  _combatDroneGain.gain.linearRampToValueAtTime(0.5,n+0.06);
  _combatDroneGain.gain.linearRampToValueAtTime(0,n+1.4);
}

function playDeathSound(){
  if(!_ready)return;
  Tone.Transport.stop();
  const n=Tone.now();
  _sfx.triggerAttackRelease(['A3','E3'],'2n',n);
  _sfx.triggerAttackRelease(['F3','C3'],'2n',n+0.9);
  _sfx.triggerAttackRelease('A2','4n',n+1.8);
}

function toggleMute(){
  _muted=!_muted;
  Tone.getDestination().mute=_muted;
  document.getElementById('muteBtn').textContent=_muted?'🔇':'🔊';
}
