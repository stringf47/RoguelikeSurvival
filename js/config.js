/* ── CONSTANTS ── */
const W=800,H=600,WORLD=4000,WIN_TIME=10*60;

function hitTarget(t,dmg){t.isSeal?hitSeal(t,dmg):hitEnemy(t,dmg);}

/* ── WEAPON DEFINITIONS ── */
const WDEFS={
  wand:{
    name:"Shepherd's Staff",icon:'🪝',maxLevel:10,desc:'Fires bolts at the nearest enemy',
    upgradeDesc(lv){
      if(lv===4||lv===8)return'Fires an extra bolt · Damage up';
      if(lv%3===0)return'Gains pierce · Damage up';
      return'Damage & cooldown up';
    },
    stats(lv){return{cd:Math.max(.45,.9-lv*.04),dmg:12+lv*4,spd:380+lv*10,pierce:Math.floor(lv/3),cnt:1+Math.floor(lv/4)}},
    fire(w,dt){
      const s=WDEFS.wand.stats(w.level);w.t+=dt;
      if(w.t<s.cd/wSpd(w))return;
      const tgt=nearest();if(!tgt)return;
      if(Math.hypot(tgt.x-pl.x,tgt.y-pl.y)>220*pl.rangeMult)return;
      w.t=0;
      for(let i=0;i<s.cnt;i++){
        const a=Math.atan2(tgt.y-pl.y,tgt.x-pl.x)+(i-(s.cnt-1)/2)*.18;
        spawnProj(pl.x,pl.y,Math.cos(a)*s.spd,Math.sin(a)*s.spd,s.dmg*(pl.wDmgMult[w.type]||1),s.pierce,'wand',8,'#bb33ff','#7700cc',220*pl.rangeMult);
      }
    }
  },
  garlic:{
    name:'Wool of Thorns',icon:'🌑',maxLevel:10,desc:'A thorned aura that constantly damages nearby enemies; pulses at higher levels',
    upgradeDesc(lv){
      if(lv===4)return'Unlocks pulse burst · Aura grows';
      if(lv>=5)return'Aura grows · Damage & pulse up';
      return'Aura grows · Tick damage up';
    },
    stats(lv){return{
      r:75+lv*18,
      tickDmg:4+lv*1,
      tickRate:0.28,
      pulse:lv>=4,
      pulseInterval:Math.max(1.8,4.8-lv*.28),
      pulseDmg:18+lv*14,
    }},
    init(w){w.tickT=0;w.pulseT=WDEFS.garlic.stats(w.level).pulseInterval;},
    fire(w,dt){
      const s=WDEFS.garlic.stats(w.level);
      const spd=wSpd(w);
      w.tickT+=dt*spd;
      if(w.tickT>=s.tickRate){
        w.tickT-=s.tickRate;
        const td=s.tickDmg*(pl.wDmgMult[w.type]||1);
        for(const e of enemies){if(!e.dead&&Math.hypot(pl.x-e.x,pl.y-e.y)<s.r)hitEnemy(e,td);}
        for(const sl of seals){if(!sl.dead&&Math.hypot(pl.x-sl.x,pl.y-sl.y)<s.r)hitSeal(sl,td);}
      }
      if(s.pulse){
        if(w.pulseT===undefined)w.pulseT=s.pulseInterval;
        w.pulseT-=dt*spd;
        if(w.pulseT<=0){
          w.pulseT=s.pulseInterval;
          auras.push({x:pl.x,y:pl.y,r:s.r*.2,maxR:s.r*1.3,life:.5,maxLife:.5,rgb:'136,255,68'});
          const pd=s.pulseDmg*(pl.wDmgMult[w.type]||1);
          for(const e of enemies){if(!e.dead&&Math.hypot(pl.x-e.x,pl.y-e.y)<s.r*1.25)hitEnemy(e,pd);}
          for(const sl of seals){if(!sl.dead&&Math.hypot(pl.x-sl.x,pl.y-sl.y)<s.r*1.25)hitSeal(sl,pd);}
        }
      }
    }
  },
  axe:{
    name:'Sacrificial Bone',icon:'🦴',maxLevel:10,desc:'Throws arcing bones that crash down from above',
    upgradeDesc(lv){
      if(lv%3===0)return'Throws an extra bone · Damage up';
      return'Damage & cooldown up';
    },
    stats(lv){return{cd:Math.max(.6,1.4-lv*.06),dmg:30+lv*8,cnt:1+Math.floor(lv/3)}},
    fire(w,dt){
      const s=WDEFS.axe.stats(w.level);w.t+=dt;
      if(w.t<s.cd/wSpd(w))return;w.t=0;
      for(let i=0;i<s.cnt;i++){
        const a=-Math.PI/2+(i-(s.cnt-1)/2)*.45;
        spawnProj(pl.x,pl.y,Math.cos(a)*210,Math.sin(a)*210,s.dmg*(pl.wDmgMult[w.type]||1),99,'axe',10,'#ff5500','#cc2200');
      }
    }
  },
  bible:{
    name:'Dark Gospel',icon:'📜',maxLevel:10,desc:'Orbiting tomes that strike enemies on contact',
    upgradeDesc(lv){
      if(lv%2===0)return'Extra orbiting tome · Damage up';
      return'Damage, range & orbit speed up';
    },
    stats(lv){return{dmg:22+lv*6,cnt:1+Math.floor(lv/2),r:90+lv*6,spd:2.6+lv*.14,cd:0}},
    init(w){const s=WDEFS.bible.stats(w.level);w.orbs=Array.from({length:s.cnt},(_,i)=>({a:(i/s.cnt)*Math.PI*2,hits:new Set()}));},
    fire(w,dt){
      const s=WDEFS.bible.stats(w.level);
      while(w.orbs.length<s.cnt)w.orbs.push({a:Math.random()*Math.PI*2,hits:new Set()});
      w.orbs=w.orbs.slice(0,s.cnt);
      for(const o of w.orbs){
        o.a+=s.spd*dt;
        const ox=pl.x+Math.cos(o.a)*s.r,oy=pl.y+Math.sin(o.a)*s.r;
        for(const e of enemies){
          if(e.dead||o.hits.has(e.id))continue;
          if(Math.hypot(ox-e.x,oy-e.y)<18+e.r){hitEnemy(e,s.dmg*(pl.wDmgMult[w.type]||1));o.hits.add(e.id);setTimeout(()=>o.hits.delete(e.id),400);}
        }
        for(const sl of seals){
          const sk='s'+sl.id;
          if(sl.dead||o.hits.has(sk))continue;
          if(Math.hypot(ox-sl.x,oy-sl.y)<18+30){hitSeal(sl,s.dmg*(pl.wDmgMult[w.type]||1));o.hits.add(sk);setTimeout(()=>o.hits.delete(sk),400);}
        }
      }
    }
  },
  knife:{
    name:"Crow's Talon",icon:'🪶',maxLevel:10,desc:'Rapid talons that shred the nearest enemy',
    upgradeDesc(lv){
      if(lv%2===0)return'Extra talon · Damage & cooldown up';
      return'Damage & cooldown up';
    },
    stats(lv){return{cd:Math.max(.12,.55-lv*.032),dmg:9+lv*3,spd:520+lv*12,cnt:1+Math.floor(lv/2)}},
    fire(w,dt){
      const s=WDEFS.knife.stats(w.level);w.t+=dt;
      if(w.t<s.cd/wSpd(w))return;
      const tgt=nearest();if(!tgt)return;
      if(Math.hypot(tgt.x-pl.x,tgt.y-pl.y)>300*pl.rangeMult)return;
      w.t=0;
      const base=Math.atan2(tgt.y-pl.y,tgt.x-pl.x);
      for(let i=0;i<s.cnt;i++){
        const a=base+(i-(s.cnt-1)/2)*.14;
        spawnProj(pl.x,pl.y,Math.cos(a)*s.spd,Math.sin(a)*s.spd,s.dmg*(pl.wDmgMult[w.type]||1),1,'knife',4,'#99ddff','#3377ff');
      }
    }
  },
  lightning:{
    name:"Guardian's Wrath",icon:'⚡',maxLevel:10,desc:'Calls lightning that chains between nearby enemies',
    upgradeDesc(lv){
      if(lv%2===0)return'Extra chain target · Damage up';
      return'Damage & range up';
    },
    stats(lv){return{cd:Math.max(.7,2.2-lv*.11),dmg:35+lv*9,chains:2+Math.floor(lv/2),r:200+lv*14}},
    fire(w,dt){
      const s=WDEFS.lightning.stats(w.level);w.t+=dt;
      if(w.t<s.cd/wSpd(w))return;
      let src=nearest();if(!src)return;
      if(Math.hypot(src.x-pl.x,src.y-pl.y)>s.r)return;
      w.t=0;
      hitTarget(src,s.dmg*(pl.wDmgMult[w.type]||1));
      lightnings.push({x1:pl.x,y1:pl.y,x2:src.x,y2:src.y,life:.12});
      let last=src;
      for(let c=0;c<s.chains;c++){
        let best=null,bd=Infinity;
        for(const e of enemies){
          if(e.dead||e===last)continue;
          const d=Math.hypot(e.x-last.x,e.y-last.y);
          if(d<s.r&&d<bd){bd=d;best=e;}
        }
        if(!best)break;
        hitEnemy(best,s.dmg*(pl.wDmgMult[w.type]||1)*.6);
        lightnings.push({x1:last.x,y1:last.y,x2:best.x,y2:best.y,life:.12});
        last=best;
      }
    }
  },
  tempest:{
    name:'Tempest Call',icon:'⛈️',maxLevel:10,desc:'Calls lightning strikes down on visible enemies',
    upgradeDesc(lv){
      if(lv%2===0)return'Strikes more targets · Damage up';
      return'Damage & cooldown up';
    },
    stats(lv){return{cd:Math.max(.65,4.5-lv*.42),dmg:22+lv*14,strikes:1+Math.floor(lv/2)}},
    fire(w,dt){
      const s=WDEFS.tempest.stats(w.level);w.t+=dt;
      if(w.t<s.cd/wSpd(w))return;
      const visible=[
        ...enemies.filter(e=>!e.dead&&onScreen(e.x,e.y,e.r)),
        ...seals.filter(sl=>!sl.dead&&onScreen(sl.x,sl.y,30))
      ];
      if(!visible.length)return;
      w.t=0;
      const targets=visible.sort(()=>Math.random()-.5).slice(0,s.strikes);
      for(let i=0;i<targets.length;i++){
        const tgt=targets[i];
        setTimeout(()=>{
          if(tgt.dead)return;
          hitTarget(tgt,s.dmg*(pl.wDmgMult[w.type]||1));
          lightnings.push({x1:tgt.x+(Math.random()-.5)*40,y1:tgt.y-520,x2:tgt.x,y2:tgt.y,life:.22,sky:true});
          lightnings.push({x1:tgt.x+(Math.random()-.5)*20,y1:tgt.y-520,x2:tgt.x+(Math.random()-.5)*8,y2:tgt.y,life:.14,sky:true});
          burst(tgt.x,tgt.y,'#aaddff',10);
        },i*80);
      }
    }
  },
  flame:{
    name:'Purging Flame',icon:'🔥',maxLevel:10,desc:'Hurls a wide fireball that scorches through all enemies in its path',
    upgradeDesc(lv){
      if(lv%3===0)return'Extra fireball · Damage & size up';
      return'Damage, size & cooldown up';
    },
    stats(lv){return{cd:Math.max(.4,2.6-lv*.22),dmg:10+lv*5,r:16+lv*3,spd:200+lv*14,cnt:1+Math.floor(lv/3)}},
    fire(w,dt){
      const s=WDEFS.flame.stats(w.level);w.t+=dt;
      if(w.t<s.cd/wSpd(w))return;
      const tgt=nearest();if(!tgt)return;
      w.t=0;
      const base=Math.atan2(tgt.y-pl.y,tgt.x-pl.x);
      for(let i=0;i<s.cnt;i++){
        const a=base+(i-(s.cnt-1)/2)*.28;
        spawnProj(pl.x,pl.y,Math.cos(a)*s.spd,Math.sin(a)*s.spd,
          s.dmg*(pl.wDmgMult[w.type]||1),99,'flame',s.r,'#ff6600','#ff2200');
      }
    }
  }
};

/* ── PASSIVE DEFINITIONS ── */
const PDEFS={
  hp:{name:'Ritual Offering',icon:'🏺',desc:'+30 Max HP (and heal)',maxLevel:Infinity,
    apply(){pl.maxHp+=30;pl.hp=Math.min(pl.hp+30,pl.maxHp);}},
  spd:{name:"Shepherd's Blessing",icon:'🌿',maxLevel:Infinity,
    descFn(lv){return`+${10+lv*5}% movement speed`;},
    apply(lv){pl.speed=160*(1+0.10+lv*0.05);}},
  arm:{name:'Woolen Veil',icon:'🛡️',maxLevel:Infinity,
    descFn(lv){return`-${lv*2} damage from all hits`;},
    apply(){pl.armor+=2;}},
  mag:{name:'Scent of the Flock',icon:'✨',desc:'+40 pickup range',maxLevel:Infinity,
    apply(){pl.magnet+=40;}},
  reg:{name:'Blood of the Lamb',icon:'🐑',desc:'+1 HP/second regeneration',maxLevel:Infinity,
    apply(){pl.regen+=1;}},
  range:{name:'Long Arm of the Flock',icon:'📏',maxLevel:Infinity,
    descFn(lv){return`+${10+lv*5}% weapon range`;},
    apply(lv){pl.rangeMult=1+0.10+lv*0.05;}},
  dmg:{name:'Feral Strength',icon:'💢',maxLevel:Infinity,
    descFn(lv){return`+${10+lv*5}% weapon damage`;},
    apply(lv){pl.dmgMult=1+0.10+lv*0.05;}},
  wandDmg:{name:'Staff Power',icon:'🪝',maxLevel:Infinity,weaponReq:'wand',
    descFn(lv){return`+${10+lv*5}% Shepherd's Staff damage`;},
    apply(lv){pl.wDmgMult.wand=1+0.10+lv*0.05;}},
  garlicDmg:{name:'Thorn Venom',icon:'🌑',maxLevel:Infinity,weaponReq:'garlic',
    descFn(lv){return`+${10+lv*5}% Wool of Thorns damage`;},
    apply(lv){pl.wDmgMult.garlic=1+0.10+lv*0.05;}},
  axeDmg:{name:'Bone Splitter',icon:'🦴',maxLevel:Infinity,weaponReq:'axe',
    descFn(lv){return`+${10+lv*5}% Sacrificial Bone damage`;},
    apply(lv){pl.wDmgMult.axe=1+0.10+lv*0.05;}},
  bibleDmg:{name:'Dark Word',icon:'📜',maxLevel:Infinity,weaponReq:'bible',
    descFn(lv){return`+${10+lv*5}% Dark Gospel damage`;},
    apply(lv){pl.wDmgMult.bible=1+0.10+lv*0.05;}},
  knifeDmg:{name:'Talon Edge',icon:'🪶',maxLevel:Infinity,weaponReq:'knife',
    descFn(lv){return`+${10+lv*5}% Crow's Talon damage`;},
    apply(lv){pl.wDmgMult.knife=1+0.10+lv*0.05;}},
  lightningDmg:{name:'Storm Surge',icon:'⚡',maxLevel:Infinity,weaponReq:'lightning',
    descFn(lv){return`+${10+lv*5}% Guardian's Wrath damage`;},
    apply(lv){pl.wDmgMult.lightning=1+0.10+lv*0.05;}},
  wandSpd:{name:'Staff Cadence',icon:'🪝',maxLevel:Infinity,weaponReq:'wand',
    descFn(lv){return`+${10+lv*5}% Shepherd's Staff speed`;},
    apply(lv){pl.wAtkMult.wand=1+0.10+lv*0.05;}},
  garlicSpd:{name:'Thorn Rhythm',icon:'🌑',maxLevel:Infinity,weaponReq:'garlic',
    descFn(lv){return`+${10+lv*5}% Wool of Thorns speed`;},
    apply(lv){pl.wAtkMult.garlic=1+0.10+lv*0.05;}},
  axeSpd:{name:'Bone Flurry',icon:'🦴',maxLevel:Infinity,weaponReq:'axe',
    descFn(lv){return`+${10+lv*5}% Sacrificial Bone speed`;},
    apply(lv){pl.wAtkMult.axe=1+0.10+lv*0.05;}},
  bibleSpd:{name:'Rapid Scripture',icon:'📜',maxLevel:Infinity,weaponReq:'bible',
    descFn(lv){return`+${10+lv*5}% Dark Gospel speed`;},
    apply(lv){pl.wAtkMult.bible=1+0.10+lv*0.05;}},
  knifeSpd:{name:'Talon Frenzy',icon:'🪶',maxLevel:Infinity,weaponReq:'knife',
    descFn(lv){return`+${10+lv*5}% Crow's Talon speed`;},
    apply(lv){pl.wAtkMult.knife=1+0.10+lv*0.05;}},
  lightningSpd:{name:'Storm Tempo',icon:'⚡',maxLevel:Infinity,weaponReq:'lightning',
    descFn(lv){return`+${10+lv*5}% Guardian's Wrath speed`;},
    apply(lv){pl.wAtkMult.lightning=1+0.10+lv*0.05;}},
  tempestDmg:{name:'Storm Fury',icon:'⛈️',maxLevel:Infinity,weaponReq:'tempest',
    descFn(lv){return`+${10+lv*5}% Tempest Call damage`;},
    apply(lv){pl.wDmgMult.tempest=1+0.10+lv*0.05;}},
  tempestSpd:{name:'Thunder Rhythm',icon:'⛈️',maxLevel:Infinity,weaponReq:'tempest',
    descFn(lv){return`+${10+lv*5}% Tempest Call speed`;},
    apply(lv){pl.wAtkMult.tempest=1+0.10+lv*0.05;}},
  flameDmg:{name:'Scorched Earth',icon:'🔥',maxLevel:Infinity,weaponReq:'flame',
    descFn(lv){return`+${10+lv*5}% Purging Flame damage`;},
    apply(lv){pl.wDmgMult.flame=1+0.10+lv*0.05;}},
  flameSpd:{name:'Stoke the Fire',icon:'🔥',maxLevel:Infinity,weaponReq:'flame',
    descFn(lv){return`+${10+lv*5}% Purging Flame speed`;},
    apply(lv){pl.wAtkMult.flame=1+0.10+lv*0.05;}},
  atk:{name:'Bloodlust',icon:'🩸',maxLevel:Infinity,
    descFn(lv){return`+${lv*5}% attack speed (all weapons)`;},
    apply(lv){pl.atkSpeedMult=1+lv*0.05;}},

  /* ── LEGENDARIES (chest only) ── */
  martyrdom:{name:'Martyrdom',icon:'🩸',maxLevel:1,isLegendary:true,
    desc:'Taking damage releases thorns dealing 150% of the hit to nearby enemies',
    apply(){pl.martyrdom=true;}},
  carrionCall:{name:'Carrion Call',icon:'🦴',maxLevel:1,isLegendary:true,
    desc:'Kills mark nearby enemies — the next hit on a marked enemy deals double damage',
    apply(){pl.carrionCall=true;}},
  unholyGround:{name:'Unholy Ground',icon:'🌑',maxLevel:1,isLegendary:true,
    desc:'Footsteps leave corrupted earth that slows enemies by 40% for 3.5s',
    apply(){pl.unholyGround=true;}},
  plagueBearer:{name:'Plague Bearer',icon:'☠️',maxLevel:1,isLegendary:true,
    desc:'Hits apply poison stacks (max 3). At 3 stacks enemies explode on death, infecting neighbors',
    apply(){pl.plagueBearer=true;}},
  finalStand:{name:'Final Stand',icon:'🏺',maxLevel:1,isLegendary:true,
    desc:'Once per run: survive a killing blow, gain 2s invincibility, then recover 30% HP',
    apply(){pl.finalStand=true;pl.finalStandUsed=false;}}
};

/* ── ENEMY TYPES ── */
const ETYPES=[
  {name:'Corrupt Pig',     r:13,hp:35, spd:33,dmg:12,xpV:2,xpC:2,col:'#cc6688',wave:0},
  {name:'Cursed Crow',     r:8, hp:15, spd:46,dmg:8, xpV:1,xpC:1,col:'#2a1a4a',wave:1,cls:'B'},
  {name:'Plague Rat',      r:5, hp:10, spd:60,dmg:4, xpV:1,xpC:1,col:'#a89080',wave:1,cls:'B'},
  {name:'Shambling Sheep', r:15,hp:220,spd:15,dmg:18,xpV:3,xpC:4,col:'#c8d4cc',wave:2},
  {name:'Ram Rusher',      r:14,hp:90, spd:24,dmg:20,xpV:3,xpC:1,col:'#8b7744',wave:3},
  {name:'Skeletal Scarecrow',r:15,hp:480,spd:0, dmg:30,xpV:8,xpC:2,col:'#c8c4a0',wave:4},
];

/* ── BACKGROUND THEMES (per wave) ── */
const BG_THEMES=[
  {a:'#2d1a4a',b:'#341f54',c:'#4a2a6e',d:'#7a3a9e',brd:'#6a2a8e'}, // wave 0: void purple
  {a:'#0f1e38',b:'#142240',c:'#1a3a6a',d:'#2a5a9e',brd:'#1a4a8e'}, // wave 1: deep ocean
  {a:'#0f2a14',b:'#143018',c:'#1a4a22',d:'#2a7a3a',brd:'#1a6a2a'}, // wave 2: corrupted forest
  {a:'#380f0f',b:'#421212',c:'#6a1a1a',d:'#9e2a2a',brd:'#8e1a1a'}, // wave 3: blood field
  {a:'#261200',b:'#301600',c:'#4a2600',d:'#7a4200',brd:'#6e3600'}, // wave 4: hellfire
];

/* ── XP CURVE ── */
const XP_CURVE=(lv)=>Math.floor((10*Math.pow(1.22,lv-1)+lv*7)*1.6);

/* ── HORDE SPAWN TIMES (minutes) ── */
const HORDE_TIMES=[2,4,6,8,12];
