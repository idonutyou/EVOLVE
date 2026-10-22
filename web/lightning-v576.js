// Accepted LIGHTNING06 behavior, adapted to the current V575 campaign engine.
// The host retains boss damage, phases, terrain, rewards, saves and stage flow.
function createCampaignLightningV576(host){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),tau=Math.PI*2;
 let queue=[],arcs=[],blasts=[],fields=[],cast=null,auto=.22,clock=0,serial=0;
 let metrics={casts:0,contacts:0,strongContacts:0,blockedDamage:0};
 const enemies=()=>host.enemies(),player=()=>host.player();
 function reset(){for(const e of enemies())delete e.arcShockV576;queue=[];arcs=[];blasts=[];fields=[];cast=null;auto=.22;clock=0;serial=0;metrics={casts:0,contacts:0,strongContacts:0,blockedDamage:0}}
 function valid(e){return e&&!e.dead&&!e.arrivalInvuln&&e.hp>0}
 function castChain(strong=false){
  if(!host.active()||(!strong&&cast&&cast.age<.24))return false;
  const p=player(),range=host.range(),pool=enemies().filter(e=>valid(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=range);
  const reachable=pool.filter(e=>host.canLink(p,e));
  if(!reachable.length)return false;
  const priority=host.focus(),first=reachable.includes(priority)?priority:reachable.reduce((best,e)=>{const score=q=>Math.hypot(q.x-p.x,q.y-p.y)*(q.finalBoss?.65:q.elite?.8:1);return !best||score(e)<score(best)?e:best},null);
  const a=Math.atan2(first.y-p.y,first.x-p.x),id=++serial,lead=strong?.125:.085,visited=new Set(),hops=host.hops()+(strong?3:0),damage=host.damage(strong);
  cast={age:0,life:strong?.44:.34,strong,a,id};host.face(a);let e=first,from=null;
  for(let i=0;i<hops&&e;i++){
   visited.add(e);queue.push({delay:lead+i*(strong?.032:.044),target:e,from,strong,primary:i===0,id,damage:damage*Math.pow(.96,i)});from=e;
   e=pool.filter(x=>!visited.has(x)&&Math.hypot(x.x-from.x,x.y-from.y)<(strong?225:190)&&host.canLink(from,x)).sort((x,y)=>Math.hypot(x.x-from.x,x.y-from.y)-Math.hypot(y.x-from.x,y.y-from.y))[0];
  }
  queue=queue.slice(-64);metrics.casts++;return true;
 }
 function step(dt){
  if(!host.active()||!(dt>0))return;
  clock+=dt;if(cast){cast.age+=dt;if(cast.age>=cast.life)cast=null}
  for(const e of enemies()){
   const s=e.arcShockV576;if(!s)continue;s.age+=dt;s.wait=Math.max(0,s.wait-dt);
   if(s.wait<=0){s.hp+=(e.hp/Math.max(1,e.maxHp)-s.hp)*(1-Math.exp(-dt*11));if(Math.abs(s.hp-e.hp/e.maxHp)<.003)s.hp=e.hp/e.maxHp}
   if(s.age>=s.life&&Math.abs(s.hp-e.hp/e.maxHp)<.004)delete e.arcShockV576;
  }
  for(const a of arcs)a.age+=dt;arcs=arcs.filter(a=>a.age<a.life);
  for(const b of blasts)b.age+=dt;blasts=blasts.filter(b=>b.age<b.life);
  for(const f of fields)f.age+=dt;fields=fields.filter(f=>f.age<f.life);
  auto-=dt;if(auto<=0)auto=castChain(false)?host.interval():.12;
  for(const q of queue){
   q.delay-=dt;if(q.delay>0)continue;q.done=true;const e=q.target;if(!valid(e))continue;
   const p=player(),a=cast?.a??p.look??0,source=q.from||p;if(!host.canLink(source,e))continue;const from=q.from?{x:q.from.x,y:q.from.y-5}:{x:p.x+Math.cos(a)*20,y:p.y-12+Math.sin(a)*8},to={x:e.x,y:e.y-5},angle=Math.atan2(to.y-from.y,to.x-from.x);
   const mass=e.finalBoss?.12:e.elite?.36:e.type==='brute'?.58:1;
   const old=e.arcShockV576;e.arcShockV576={age:0,hold:q.strong?.058:.034,life:q.strong?.32:.23,a:angle,strong:q.strong,mass,hp:Math.max(old?.hp||0,e.hp/Math.max(1,e.maxHp)),wait:.13,vx:e.vx||0,vy:e.vy||0};
   e.kx=(e.kx||0)+Math.cos(angle)*(q.strong?285:142)*mass;e.ky=(e.ky||0)+Math.sin(angle)*(q.strong?285:142)*mass;
   host.damageEnemy(e,q.damage,q.strong,angle);metrics.contacts++;if(q.strong)metrics.strongContacts++;
   arcs.push({from,to,strong:q.strong,age:0,life:q.strong?.25:.18,seed:metrics.contacts});
   blasts.push({x:to.x,y:to.y,strong:q.strong,age:0,life:.32,column:q.primary&&q.strong});
   if(q.primary&&q.strong){fields.push({x:p.x,y:p.y,age:0,life:.9,size:host.fieldSize()});host.kick(angle)}
  }
  queue=queue.filter(q=>!q.done);arcs=arcs.slice(-32);blasts=blasts.slice(-24);fields=fields.slice(-3);
 }
 function pose(e){const s=e.arcShockV576;if(!s||s.age>=s.life)return null;const p=clamp((s.age-s.hold)/(s.life-s.hold),0,1),envelope=s.age<s.hold?1:Math.cos(p*Math.PI*.5)**2,force=envelope*s.mass*(s.strong?1:.6);return {bend:Math.cos(s.a)*.24*force,sx:1+.045*force,sy:1-.12*force,fade:1-s.age/s.life,flash:Math.max(0,1-s.age/(s.strong?.065:.045)),angle:s.a,strong:s.strong}}
 function holdEnemy(e){const s=e.arcShockV576;return !!s&&s.age<s.hold}
 function sprite(ctx,cell,x,y,w,h,rotation=0,alpha=1){const im=host.texture();if(!im||alpha<=0)return;const sw=im.naturalWidth||im.width,sh=im.naturalHeight||im.height;if(!sw||!sh)return;ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha=clamp(alpha,0,1);ctx.drawImage(im,(cell%2)*sw/2+2,Math.floor(cell/2)*sh/2+2,sw/2-4,sh/2-4,-w/2,-h/2,w,h);ctx.restore()}
 function drawGround(ctx){for(const f of fields){const p=f.age/f.life,envelope=Math.min(1,p*7)*Math.pow(1-p,.7),s=f.size*(.66+p*.58);sprite(ctx,1,f.x,f.y+5,s,s*.72,p*.18,envelope*.78)}}
 function draw(ctx){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const a of arcs){const p=1-a.age/a.life,dx=a.to.x-a.from.x,dy=a.to.y-a.from.y,d=Math.hypot(dx,dy)||1,angle=Math.atan2(dy,dx);sprite(ctx,0,(a.from.x+a.to.x)/2,(a.from.y+a.to.y)/2,d+28,clamp(d*.58,a.strong?100:73,a.strong?170:120),angle,Math.pow(p,.55)*(a.strong?.92:.76));
   ctx.globalCompositeOperation='lighter';const steps=Math.max(5,Math.ceil(d/12)),points=[];for(let i=0;i<=steps;i++){const q=i/steps,j=i===0||i===steps?0:Math.sin(i*17.71+a.seed*8.13)*Math.sin(q*Math.PI)*(a.strong?13:8);points.push([a.from.x+dx*q-dy/d*j,a.from.y+dy*q+dx/d*j])}
   for(const [width,color,alpha] of [[a.strong?12:8,'#287cff',.36],[a.strong?6.5:4.2,'#5cddff',.92],[a.strong?2.8:1.9,'#f4ffff',1]]){ctx.globalAlpha=p*alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  for(const b of blasts){const p=b.age/b.life,envelope=Math.min(1,p*12)*Math.pow(1-p,.75),size=(b.strong?125:70)*(.58+p*.72);if(b.column&&b.age<.22)sprite(ctx,0,b.x,b.y-110,220,100,Math.PI/2,Math.sin(Math.PI*b.age/.22)*.62);sprite(ctx,1,b.x,b.y,size,size*.78,0,envelope*.78);ctx.save();ctx.globalAlpha=(1-p)**2*.8;ctx.strokeStyle='#b8ecff';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(b.x,b.y+8,size*.5,size*.18,0,0,tau);ctx.stroke();ctx.restore()}
  if(cast){const p=player(),lead=cast.strong?.125:.085,charge=clamp(cast.age/lead,0,1),alpha=cast.age<lead?charge:Math.max(0,1-(cast.age-lead)/.13),x=p.x+Math.cos(cast.a)*20,y=p.y-12+Math.sin(cast.a)*8;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*.9;ctx.strokeStyle='#d4faff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,5+(1-charge)*16,clock*4,clock*4+tau*.85);ctx.stroke();ctx.restore()}
  ctx.restore();
 }
 function overlay(ctx,e,size){const p=pose(e),s=e.arcShockV576;if(!s||e.dead)return;const w=e.elite?42:Math.max(22,Math.min(36,size*.6)),y=e.y-size*.63;if(e.hp<e.maxHp){ctx.save();ctx.fillStyle='#05101cdd';ctx.fillRect(e.x-w/2-1,y-1,w+2,5);ctx.fillStyle='#eaffff';ctx.fillRect(e.x-w/2,y,w*clamp(s.hp,0,1),3);ctx.fillStyle='#48d9ff';ctx.fillRect(e.x-w/2,y,w*clamp(e.hp/e.maxHp,0,1),3);ctx.restore()}if(!p)return;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=p.fade*.86;ctx.strokeStyle=p.flash>.2?'#ffffff':'#8fe7ff';ctx.lineWidth=p.strong?1.8:1.1;ctx.beginPath();ctx.moveTo(e.x-size*.28,e.y-size*.22);ctx.lineTo(e.x+size*.07,e.y-size*.10);ctx.lineTo(e.x-size*.11,e.y+size*.02);ctx.lineTo(e.x+size*.25,e.y+size*.13);ctx.stroke();ctx.restore()}
 return {reset,step,castChain,pose,holdEnemy,drawGround,draw,overlay,block:()=>{metrics.blockedDamage++},cast:()=>cast,read:()=>({version:'V575-WEB-9-LIGHTNING06',weapon:'lightning',...metrics,queued:queue.length,arcs:arcs.length,fields:fields.length,cast:cast?{...cast}:null,reacting:enemies().filter(e=>!!pose(e)).length}),context:()=>({queue,arcs,blasts,fields})};
}

const lightningImageV576=new Image();let lightningImageErrorV576=null;
const lightningImageReadyV576=new Promise((resolve,reject)=>{lightningImageV576.onload=()=>resolve(true);lightningImageV576.onerror=()=>{lightningImageErrorV576='Lightning atlas failed to load';resolve(false)}});
lightningImageV576.src='__LIGHTNING_ATLAS_PATH__';
const lightningDamageBaseV576=hurtEnemy;
const lightningV576=createCampaignLightningV576({
 active:()=>running&&!paused&&!choosing&&!rewardChoosing&&!ended,
 player:()=>player,enemies:()=>enemies,focus:()=>focusEnemy,face:a=>{player.look=a},texture:()=>lightningImageErrorV576?null:lightningImageV576,
 range:()=>Math.min(440,playerBasicRangeV552()),canLink:(from,to)=>!terrainHitV418(from.x,from.y,to.x,to.y,1),
 hops:()=>7+Math.min(4,Math.floor((state.arm||1)/2))+(evoState.arm?2:0)+Math.min(2,Math.floor((genes.hydra||0)/2)),
 damage:strong=>((strong?80:26)+Math.max(0,(state.arm||1)-1)*(strong?9:4.5)+(evoState.arm?9:0))*coreDamageBoost(),
 interval:()=>.94*attackTempoMul()*(evoState.arm?.78:1)*(frenzy>0?.76:1),fieldSize:()=>Math.min(580,Math.max(360,playerBasicRangeV552()*2.2)),
 damageEnemy:(e,damage,strong,a)=>{
  const stop=hitStop,shake=cameraShake,kx=cameraKickX,ky=cameraKickY,textStart=damageTexts.length;
  lightningDamageBaseV576(e,damage,'arc');
  // Ordinary contact pauses only its target. Preserve the established TITAN death cinematic.
  if(!e.finalBoss||!e.dead){hitStop=stop;cameraShake=shake;cameraKickX=kx;cameraKickY=ky}
  e.hit=strong?.065:.045;e.bodyKick=0;e.deathA=a;
  if(!strong&&!e.finalBoss)damageTexts.splice(textStart);else for(let i=textStart;i<damageTexts.length;i++){damageTexts[i].kind='arc';damageTexts[i].heavy=strong}
 },
 kick:a=>{if(feedbackCfg().reducedMotion)return;cameraKickX-=Math.cos(a)*1.8;cameraKickY-=Math.sin(a)*1.8}
});

// All other outgoing damage paths are inactive during this lightning-only phase.
hurtEnemy=function(e,damage,kind){if(kind!=='arc'){lightningV576.block();return}return lightningDamageBaseV576(e,damage,kind)};
firePlayer=function(dt){bullets.length=0;lightningV576.step(dt)};
triggerHordeRupture=function(){};
originActive=function(){if(!running||paused||choosing||rewardChoosing||ended||activeReady>0)return;if(!lightningV576.castChain(true))return;activeReady=activeMaxCd=3.2;activeDuration=0;updateAbilityUI()};
updateAbilityUI=function(){activeMaxCd=3.2;const label=$('abilityName');if(label)label.textContent='강화전격';const b=$('ability');if(!b)return;const glyph=b.querySelector('.abilityGlyph');if(glyph)glyph.textContent='ϟ';$('abilityCd').style.background=`conic-gradient(#071116e9 ${clamp(activeReady/3.2,0,1)*360}deg, transparent ${clamp(activeReady/3.2,0,1)*360}deg)`;b.classList.toggle('ready',activeReady<=0);b.setAttribute('aria-label','강화전격');b.title='강화전격 · E';};

const lightningResetBaseV576=reset;reset=function(...args){selectedStartWeapon='arm';lightningV576.reset();const out=lightningResetBaseV576(...args);state.arm=Math.max(1,state.arm);return out};
const lightningHomeBaseV576=returnToHome;returnToHome=function(...args){lightningV576.reset();return lightningHomeBaseV576(...args)};
const lightningEchoBaseV576=spawnDeathEcho;spawnDeathEcho=function(e){const n=deathEchoes.length,out=lightningEchoBaseV576(e),s=e?.arcShockV576;if(s&&!e.finalBoss)for(let i=n;i<deathEchoes.length;i++){const d=deathEchoes[i];d.vx=Math.cos(s.a)*(s.strong?165:95);d.vy=Math.sin(s.a)*(s.strong?165:95)-12;d.arcElectricV576=true;d.life=d.max=s.strong?.62:.48;d.spin=Math.cos(s.a)*1.4}return out};

// GPU and canvas actors use the same reaction; existing GPU batching stays enabled.
const lightningGpuPoseBaseV576=gpuEnemyVisualV426;gpuEnemyVisualV426=function(e){const s=e.arcShockV576;let v;if(s&&s.age<s.hold)v=s.gpuPose||(s.gpuPose={...lightningGpuPoseBaseV576(e)});else v=lightningGpuPoseBaseV576(e);const p=lightningV576.pose(e);return p?{...v,rot:v.rot+p.bend,sx:v.sx*p.sx,sy:v.sy*p.sy,bob:v.bob+(1-p.sy)*v.size*.4}:v};
const lightningEnemyDrawBaseV576=drawEnemy;drawEnemy=function(e,shadowOnly=false){const p=lightningV576.pose(e);if(!p)return lightningEnemyDrawBaseV576(e,shadowOnly);const size=e.finalBoss?208:e.elite?68:gpuEnemyBaseSizeV426(e),hit=e.hit,kick=e.bodyKick;e.hit=0;e.bodyKick=0;ctx.save();ctx.translate(e.x,e.y+size*.30);ctx.rotate(p.bend);ctx.scale(p.sx,p.sy);ctx.translate(-e.x,-e.y-size*.30);try{return lightningEnemyDrawBaseV576(e,shadowOnly)}finally{ctx.restore();e.hit=hit;e.bodyKick=kick;if(!shadowOnly)lightningV576.overlay(ctx,e,size)}};
const lightningNormalOverlayBaseV576=drawNormalEnemyOverlayV426;drawNormalEnemyOverlayV426=function(e){lightningNormalOverlayBaseV576(e);lightningV576.overlay(ctx,e,gpuEnemyBaseSizeV426(e))};
const lightningPlayerDrawBaseV576=drawPlayer;drawPlayer=function(shadowOnly=false){const c=lightningV576.cast();if(!c||shadowOnly)return lightningPlayerDrawBaseV576(shadowOnly);const lead=c.strong?.125:.085,wind=c.age<lead,phase=wind?c.age/lead:clamp((c.age-lead)/.16,0,1),force=wind?-phase:Math.sin(phase*Math.PI)*Math.exp(-phase*.6),oldLook=player.look,oldKick=player.armKick;player.look=c.a;player.armKick=wind?0:.18*Math.max(0,1-phase);ctx.save();ctx.translate(player.x,player.y+15);ctx.rotate(Math.cos(c.a)*force*.12);ctx.scale(1,1+(wind?-.055:.035)*Math.abs(force));ctx.translate(-player.x,-player.y-15);try{return lightningPlayerDrawBaseV576(false)}finally{ctx.restore();player.look=oldLook;player.armKick=oldKick}};

// Keep upgrades meaningful while the other weapons are disabled.
const lightningArmUpgradeV576=upgrades.find(u=>u.active&&u.kind==='arm');if(lightningArmUpgradeV576)lightningArmUpgradeV576.title=()=> '연쇄전격 · 출력 강화';
Object.assign(START_WEAPONS.arm,{name:'CHAIN LIGHTNING',glyph:'ϟ',role:'자동 연쇄전격 · E 강화전격'});
chooseLevelPicks=function(){const pool=upgrades.filter(u=>u.passive?(genes[u.gene]||0)<5:u.active&&u.kind==='arm'&&!evoState.arm&&(state.arm||0)<5),picks=[];while(pool.length&&picks.length<3){const u=weightedChoice(pool,choiceScore);picks.push(u);pool.splice(pool.indexOf(u),1)}return picks};
const lightningStatBaseV576=levelStatHtml;levelStatHtml=function(u){if(u.active&&u.kind==='arm')return '<div class="statRow"><span>연쇄전격</span><b>전격 출력 증가</b></div><div class="statRow"><span>일반 / 강화</span><b>감전 · 방향 반동</b></div>';return lightningStatBaseV576(u)};
const lightningStartUIV576=document.createElement('style');lightningStartUIV576.textContent='[data-weapon]:not([data-weapon="arm"]){display:none!important}#abilityName{font-size:8px!important}#ability{border-color:#8bdfff!important;background:radial-gradient(circle,#174f70,#091421 74%)!important}.weaponGrid{justify-content:center}';document.head.appendChild(lightningStartUIV576);
const lightningWeaponButtonV576=document.querySelector('[data-weapon="arm"]');if(lightningWeaponButtonV576){const name=lightningWeaponButtonV576.querySelector('h3,strong,.weaponName');if(name)name.textContent='연쇄전격';const desc=lightningWeaponButtonV576.querySelector('p,.weaponDesc');if(desc)desc.textContent='자동 연쇄전격 · 강화전격 E · 회피 SPACE'}
window.__EVOLVE_LIGHTNING_V576__={read:()=>({...lightningV576.read(),atlasReady:lightningImageV576.complete&&lightningImageV576.naturalWidth>0,atlasError:lightningImageErrorV576,globalHitStop:hitStop}),ready:lightningImageReadyV576};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_LIGHTNING_V576__.test={cast:strong=>lightningV576.castChain(strong),context:()=>lightningV576.context(),pose:e=>lightningV576.pose(e),hold:e=>lightningV576.holdEnemy(e),reset:()=>lightningV576.reset(),step:dt=>lightningV576.step(dt),damage:(e,n,kind)=>hurtEnemy(e,n,kind),active:()=>originActive()};
