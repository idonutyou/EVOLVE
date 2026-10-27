/* EVOLVE STEP07 V614 — bounded, visual-only monster reactions. No game-state writes. */
function createMonsterFeedbackV614(host){
 'use strict';
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 let localTime=0,poses=new WeakMap(),echoes=new WeakMap(),pendingDeaths=new WeakMap();
 const active=new Set(),stats={hits:0,fallback:0,coalesced:0,dropped:0,deaths:0,echoes:0,ownerSkipped:0,dotsSkipped:0,peak:0};
 const now=()=>host.time?host.time():localTime;
 const settings=()=>host.settings?host.settings():{};
 const crowd=()=>host.crowd?host.crowd():0;
 const budget=()=>settings().reducedMotion?0:crowd()>180?14:24;
 function eligible(e){return !!e&&!e.finalBoss&&e.type!=='boss';}
 function profile(e){
  if(e.midRankV596||e.midBoss||e.elite)return 'elite';
  const type=host.combatType?host.combatType(e):e.type;
  if(['crawler','runner','ripper'].includes(type))return 'fast';
  if(['brute','mauler','embermaw'].includes(type))return 'heavy';
  return 'normal';
 }
 const table={
  fast:{normal:.10,strong:.15,scale:.92,death:.38,spin:.18,fall:24},
  normal:{normal:.12,strong:.17,scale:1,death:.44,spin:.13,fall:18},
  heavy:{normal:.14,strong:.19,scale:.75,death:.53,spin:.085,fall:10},
  elite:{normal:.085,strong:.14,scale:.42,death:.60,spin:.055,fall:8}
 };
 function angleOf(event,e){
  if(Number.isFinite(event?.angle))return event.angle;
  const k=event?.knockback;
  if(k&&Number.isFinite(k.x)&&Number.isFinite(k.y)&&Math.hypot(k.x,k.y)>.001)return Math.atan2(k.y,k.x);
  return host.direction?host.direction(e):0;
 }
 function strongly(event,e){
  return event.heavy===true||event.critical===true||event.damage>=52||
   event.damage>=Math.max(24,(e.maxHp||event.target?.hpBefore||100)*.28);
 }
 function noteDeath(e,event=null){
  if(!eligible(e))return false;
  const direction=angleOf(event,e),detail={angle:direction,strong:event?strongly(event,e):false};
  pendingDeaths.set(e,detail);
  const echo=echoes.get(e);
  if(echo)return applyEcho(e,echo,detail);
  return false;
 }
 function applyEcho(e,echo,detail){
  if(!echo||echo._monsterFeedbackDoneV614)return false;
  // Preserve the already-authored electric shock death flight instead of replacing it.
  if(e.arcShockV576){echo._monsterFeedbackDoneV614=true;return false;}
  const p=table[profile(e)],angle=detail?.angle??0,impulse=detail?.strong?1.12:1;
  const oldLife=Number.isFinite(echo.life)?echo.life:p.death;
  const oldMax=Number.isFinite(echo.max)?echo.max:oldLife;
  const life=clamp(Math.max(oldLife,Math.min(p.death,oldMax+.20)),.20,.70);
  echo.life=life;echo.max=life;
  echo.vx=clamp((Number(echo.vx)||0)+Math.cos(angle)*p.fall*impulse,-180,180);
  echo.vy=clamp((Number(echo.vy)||0)+Math.sin(angle)*p.fall*.45+3,-180,180);
  echo.spin=clamp((Number(echo.spin)||0)+Math.sign(Math.cos(angle)||1)*p.spin*impulse,-1.7,1.7);
  echo._monsterFeedbackDoneV614=true;stats.echoes++;
  return true;
 }
 function attachEcho(e,echo){
  if(!eligible(e)||!echo)return false;
  echoes.set(e,echo);
  stats.deaths++;
  return applyEcho(e,echo,pendingDeaths.get(e)||{angle:host.direction?host.direction(e):0,strong:false});
 }
 function receive(event,e){
  if(!eligible(e)||!event||event.type!=='hit'||!(event.damage>0))return false;
  if(event.killed){noteDeath(e,event);return true;}
  if(e.dead)return false;
  if(['dot','acid','poison','burn','tick','spit'].includes(event.kind)){stats.dotsSkipped++;return false;}
  stats.hits++;
  // STEP05, STEP06, lightning and existing warning frames are the source of truth.
  if(event.weapon==='gun'||event.weapon==='blade'||event.kind==='arc'||event.kind==='spike'||event.kind==='tail'||
    (e.arcShockV576&&e.arcShockV576.age<e.arcShockV576.life)||
    host.weaponPose&&host.weaponPose(e)||host.organPose&&host.organPose(e)||
    e.telegraphing||e.dashPrep>0||e.chargePrep>0){
   stats.ownerSkipped++;return false;
  }
  const cap=budget(),time=now();
  if(!cap)return false;
  const old=poses.get(e),strong=strongly(event,e);
  if(old&&time-old.at<.045&&(!strong||old.strong)){stats.coalesced++;return false;}
  const p=table[profile(e)],angle=angleOf(event,e);
  if(!active.has(e)&&active.size>=cap){
   const oldest=active.values().next().value;active.delete(oldest);poses.delete(oldest);stats.dropped++;
  }
  active.delete(e);active.add(e);
  poses.set(e,{at:time,life:strong?p.strong:p.normal,angle,strong,scale:p.scale});
  stats.fallback++;stats.peak=Math.max(stats.peak,active.size);return true;
 }
 function pose(e){
  if(!eligible(e)||e.dead||settings().reducedMotion||
    (e.arcShockV576&&e.arcShockV576.age<e.arcShockV576.life)||
    host.weaponPose&&host.weaponPose(e)||host.organPose&&host.organPose(e)||
    e.telegraphing||e.dashPrep>0||e.chargePrep>0)return null;
  const p=poses.get(e);
  if(!p)return null;
  const phase=clamp((now()-p.at)/p.life,0,1);
  if(phase>=1)return null;
  const amount=Math.sin(Math.min(1,phase/.24)*Math.PI/2)*Math.exp(-phase*5)*(p.strong?1.25:1)*p.scale;
  return {sx:1-amount*.036,sy:1+amount*.022,rot:amount*.054*Math.sign(Math.cos(p.angle)||1),
   bob:amount*Math.sin(p.angle)*1.6};
 }
 function step(dt){
  if(!host.time&&Number.isFinite(dt)&&dt>0)localTime+=dt;
  const time=now();
  for(const e of active){
   const p=poses.get(e);
   if(!p||e.dead||time-p.at>=p.life){active.delete(e);poses.delete(e);}
  }
  while(active.size>budget()){const e=active.values().next().value;active.delete(e);poses.delete(e);stats.dropped++;}
 }
 function reset(){
  active.clear();poses=new WeakMap();echoes=new WeakMap();pendingDeaths=new WeakMap();localTime=0;
  for(const k of Object.keys(stats))stats[k]=0;
 }
 function read(){return {version:'STEP07-V614',...stats,active:active.size,budget:budget(),
  visualOnly:true,addsParticleTextures:false,mutatesCombatState:false};}
 return Object.freeze({eligible,profile,receive,pose,noteDeath,attachEcho,step,reset,read});
}
