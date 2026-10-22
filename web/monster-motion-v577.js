// V577: real LIGHTNING06 monster frames, with distance-driven gait and stateful actions.
function createMonsterMotionV577(host){
 const states=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let ticks=0;
 function eligible(e){return !!e&&!e.finalBoss&&e.type!=='boss'}
 function state(e){let s=states.get(e);if(!s){s={x:e.x,y:e.y,phase:((e.animPhase||0)*.37)%3,moving:false,attack:0,warning:false,shot:e.shot||0,shotCount:e.shotCount||0,contact:e.contactCd||0,shield:e.shieldPulseCd||0,frame:0,mode:'idle'};states.set(e,s)}return s}
 function step(dt){if(!host.active()||!(dt>0))return;ticks++;
  for(const e of host.enemies()){if(!eligible(e)||e.dead)continue;const s=state(e),dx=e.x-s.x,dy=e.y-s.y,distance=Math.hypot(dx,dy),warning=!!e.telegraphing||e.dashPrep>0||e.chargePrep>0;
   const forced=e.arrivalInvuln||e.arrivalTime>0||(e.stunned||0)>0||e.arcShockV576&&e.arcShockV576.age<e.arcShockV576.life;
   s.moving=!forced&&!warning&&distance>.025&&distance<Math.max(32,(e.spd||60)*dt*6);
   if(s.moving)s.phase+=distance/Math.max(7,host.size(e)*.25);
   s.attack=Math.max(0,s.attack-dt);
   if(s.warning&&!warning||(e.shotCount||0)>s.shotCount||(e.shot||0)>s.shot+.25||(e.contactCd||0)>s.contact+.12||(e.shieldPulseCd||0)>s.shield+.3)s.attack=.28;
   s.warning=warning;s.x=e.x;s.y=e.y;s.shot=e.shot||0;s.shotCount=e.shotCount||0;s.contact=e.contactCd||0;s.shield=e.shieldPulseCd||0;
   select(e,s);
  }
 }
 function select(e,s=state(e)){
  const shock=e.arcShockV576;
  if(e.dead){s.mode='death';s.frame=3}
  else if(shock&&shock.age<shock.life*.8||(e.hit||0)>.02){s.mode='hurt';s.frame=3}
  else if(s.warning||e.telegraphing||e.dashPrep>0||e.chargePrep>0){s.mode='windup';s.frame=3}
  else if(s.attack>0||(e.burst||0)>0){s.mode=s.attack<.08?'recover':'attack';s.frame=s.mode==='recover'?1:3}
  else if(s.moving){s.mode='walk';s.frame=Math.floor(s.phase)%3}
  else{s.mode='idle';s.frame=0}
  return s;
 }
 return {eligible,init:e=>eligible(e)?state(e):null,step,state:e=>select(e),frame:e=>select(e).frame,key:e=>host.appearance(e)+'@'+select(e).frame,reset:()=>{ticks=0},read:()=>{const modes={};for(const e of host.enemies())if(eligible(e)&&!e.dead){const s=select(e);modes[s.mode]=(modes[s.mode]||0)+1}return {version:'V575-WEB-10-MONSTER-MOTION',ticks,modes}}};
}

const monsterImageV577=new Image();let monsterImageErrorV577=null,monsterPreparedV577=false,monsterAtlasBuildsV577=0;
const monsterFramesV577=new Map(),monsterBaseRenderV577=renderedEnemy;
const monsterSourceV577={crawler:{row:0,b:[24,91,307,381]},runner:{row:0,b:[24,91,307,381]},brute:{row:1,b:[4,0,314,375]},spitter:{row:2,b:[0,0,309,364]}};
const monsterReadyV577=new Promise(resolve=>{monsterImageV577.onload=()=>resolve(true);monsterImageV577.onerror=()=>{monsterImageErrorV577='Monster motion atlas failed to load';resolve(false)}});
monsterImageV577.src='__MONSTER_ATLAS_PATH__';
const monsterMotionV577=createMonsterMotionV577({active:()=>running&&!paused&&!choosing&&!rewardChoosing&&!ended,enemies:()=>enemies,size:e=>e.elite?68:gpuEnemyBaseSizeV426(e),appearance:e=>enemyAppearanceKeyV516(e)});

function monsterCanvasV577(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function monsterSurfaceV577(type,frame){
 const key=type+'@'+frame,known=monsterFramesV577.get(key);if(known)return known;
 const info=monsterSourceV577[type];let c,g;
 if(info&&monsterImageV577.complete&&monsterImageV577.naturalWidth){
  const sw=monsterImageV577.naturalWidth/4,sh=monsterImageV577.naturalHeight/3,b=info.b,w=b[2]-b[0],h=b[3]-b[1];c=monsterCanvasV577(w,h);g=c.getContext('2d');g.drawImage(monsterImageV577,frame*sw+b[0],info.row*sh+b[1],w,h,0,0,w,h);
 }else{
  const im=ART[enemyAppearanceAssetV516(type)],per=actorMipCacheV424.get(im);let mip=per?.get(256);if(!mip&&per)for(const q of per.values())if(!mip||Math.abs(q.bucket-256)<Math.abs(mip.bucket-256))mip=q;
  if(!mip?.source)return null;
  const w=mip.w,h=mip.h;c=monsterCanvasV577(w,h);g=c.getContext('2d');
  // Retain each special type's anatomy. Alternate lower limbs independently of the torso.
  const side=frame===1?1:frame===2?-1:0,attack=frame===3,split=Math.floor(h*.55);
  g.save();g.translate(w*.5,h*.55);g.rotate(attack?-.075:side*.012);g.drawImage(mip.source,0,0,w,split,-w*.5,-h*.55,w,split);g.restore();
  for(const leg of [-1,1]){const x=leg<0?0:w*.5,width=leg<0?Math.ceil(w*.5):Math.floor(w*.5),shift=side*leg*h*.035,stretch=attack?.93:1+side*leg*.035;g.drawImage(mip.source,x,split,width,h-split,x+(attack?leg*w*.018:0),split+shift,width,(h-split)*stretch)}
 }
 c.complete=true;c.naturalWidth=c.width;c.naturalHeight=c.height;c._actor=true;c._spriteCrop=[0,0,c.width,c.height];c._sourceReleasedV425=true;c._motionV577={type,frame};c._clarityV574={kind:'enemy',base:gpuEnemyBaseSizeV426({type:type.replace('legacy_','')})};
 actorMipCacheV424.set(c,new Map([[384,{source:c,w:c.width,h:c.height,bucket:384}]]));monsterFramesV577.set(key,c);return c;
}
function monsterPrepareV577(){if(monsterPreparedV577||!monsterImageV577.naturalWidth)return;for(const type of GPU_TYPES_V426)for(let frame=0;frame<4;frame++)monsterSurfaceV577(type,frame);monsterPreparedV577=true}

const monsterMakeAtlasBaseV577=makeEnemyAtlasV426;
makeEnemyAtlasV426=function(shadow=false){
 const base=monsterMakeAtlasBaseV577(shadow);if(shadow||!monsterImageV577.naturalWidth)return base;monsterPrepareV577();
 const cell=256,cols=4,entries=[...monsterFramesV577.keys()],count=GPU_TYPES_V426.length+entries.length,rows=Math.ceil(count/cols),c=monsterCanvasV577(cols*cell,rows*cell),g=c.getContext('2d'),uv={...base.uv};
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(base.canvas,0,0);
 // The old UV rows must also be normalized to the enlarged texture.
 for(const key of Object.keys(uv)){const q=uv[key];uv[key]=[q[0],q[1]*base.canvas.height/c.height,q[2],q[3]*base.canvas.height/c.height]}
 for(let i=0;i<entries.length;i++){
  const key=entries[i],source=monsterFramesV577.get(key),index=GPU_TYPES_V426.length+i,x=index%cols*cell,y=Math.floor(index/cols)*cell,scale=(cell-12)/Math.max(source.width,source.height),w=source.width*scale,h=source.height*scale,outlined=claritySpriteV574(source,gpuEnemyBaseSizeV426({type:key.split('@')[0].replace('legacy_','')}));
  if(outlined){const pad=outlined.pad*scale;g.drawImage(outlined.source,x+(cell-w)/2-pad,y+(cell-h)/2-pad,outlined.source.width*scale,outlined.source.height*scale)}else g.drawImage(source,x+(cell-w)/2,y+(cell-h)/2,w,h);
  uv[key]=[x/c.width,y/c.height,(x+cell)/c.width,(y+cell)/c.height];
 }
 monsterAtlasBuildsV577++;return {canvas:c,uv};
};

const monsterSpawnBaseV577=spawnEnemy;spawnEnemy=function(...args){const e=monsterSpawnBaseV577(...args);if(e)monsterMotionV577.init(e);return e};
const monsterUpdateBaseV577=update;update=function(dt){const before=t,out=monsterUpdateBaseV577(dt);if(t>before)monsterMotionV577.step(t-before);return out};
const monsterResetBaseV577=reset;reset=function(...args){monsterMotionV577.reset();return monsterResetBaseV577(...args)};
renderedEnemy=function(e){if(monsterMotionV577.eligible(e)&&monsterImageV577.naturalWidth){const frame=monsterMotionV577.frame(e),type=enemyAppearanceKeyV516(e),surface=monsterSurfaceV577(type,frame);if(surface)return surface}return monsterBaseRenderV577(e)};

// Grounded feet and an explicit preparation/release posture in both render paths.
const monsterGpuPoseBaseV577=gpuEnemyVisualV426;gpuEnemyVisualV426=function(e){const v=monsterGpuPoseBaseV577(e);if(!monsterMotionV577.eligible(e))return v;const s=monsterMotionV577.state(e),p=monsterSourceV577[enemyAppearanceKeyV516(e)],action=s.mode==='windup'?-1:s.mode==='attack'?1:0;
 return {...v,bob:p?-v.size*.20:v.bob,rot:v.rot+action*.055,sx:v.sx*(1+(action<0?-.045:action>0?.06:0)),sy:v.sy*(1+(action<0?-.055:action>0?.035:0))};
};
const monsterEnemyDrawBaseV577=drawEnemy;drawEnemy=function(e,shadowOnly=false){if(!monsterMotionV577.eligible(e))return monsterEnemyDrawBaseV577(e,shadowOnly);monsterMotionV577.state(e);const size=e.elite?68:gpuEnemyBaseSizeV426(e),direct=monsterSourceV577[enemyAppearanceKeyV516(e)];ctx.save();if(direct&&!shadowOnly)ctx.translate(0,-size*.20);try{return monsterEnemyDrawBaseV577(e,shadowOnly)}finally{ctx.restore()}};

// Ordinary deaths keep the attack/impact pose while the body falls in the hit direction.
const monsterEchoBaseV577=spawnDeathEcho;spawnDeathEcho=function(e){const previous=deathEchoes.at(-1),out=monsterEchoBaseV577(e),d=deathEchoes.at(-1);if(d&&d!==previous&&monsterMotionV577.eligible(e)){d.motionTypeV577=enemyAppearanceKeyV516(e);d.motionFrameV577=3;const s=e.arcShockV576;if(s){d.vx=Math.cos(s.a)*(s.strong?165:95);d.vy=Math.sin(s.a)*(s.strong?165:95)-12;d.life=d.max=s.strong?.62:.48;d.spin=Math.cos(s.a)*1.4}}return out};
const monsterKillBaseV577=killEnemy;killEnemy=function(e){const wasDead=e?.dead,previous=deathEchoes.at(-1),out=monsterKillBaseV577(e);if(e&&!wasDead&&e.dead&&monsterMotionV577.eligible(e)&&deathEchoes.at(-1)===previous)spawnDeathEcho(e);return out};
const monsterEchoRenderV577=renderedEnemy;renderedEnemy=function(e){if(e.motionTypeV577){const surface=monsterSurfaceV577(e.motionTypeV577,e.motionFrameV577??3);if(surface)return surface}return monsterEchoRenderV577(e)};

window.__EVOLVE_MONSTER_MOTION_V577__={ready:monsterReadyV577,read:()=>({...monsterMotionV577.read(),atlasReady:!!monsterImageV577.naturalWidth,error:monsterImageErrorV577,cachedFrames:monsterFramesV577.size,gpuAtlasBuilds:monsterAtlasBuildsV577,referenceTypes:Object.keys(monsterSourceV577),gpuEnabled:gpuEnemyBatchEnabledV426&&gpuEnemyBatchReadyV426&&gpuWorldReadyV428})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_MONSTER_MOTION_V577__.test={frame:e=>monsterMotionV577.frame(e),state:e=>({...monsterMotionV577.state(e)}),advance:dt=>monsterMotionV577.step(dt),surface:(type,frame)=>monsterSurfaceV577(type,frame),gpuPose:e=>gpuEnemyVisualV426(e),gpuKey:e=>monsterMotionV577.key(e),rendered:e=>renderedEnemy(e),prepare:monsterPrepareV577,forceWalk(e,phase){const s=monsterMotionV577.init(e);s.phase=phase;s.moving=true;s.attack=0;s.warning=false;delete e.arcShockV576;e.hit=0;e.telegraphing=null;e.dashPrep=e.chargePrep=e.burst=0;frozenFrameDrawnV438=false},gpu(value){const old=gpuEnemyBatchEnabledV426;gpuEnemyBatchEnabledV426=!!value&&gpuEnemyBatchReadyV426&&gpuWorldReadyV428;frozenFrameDrawnV438=false;return old}};
function monsterGpuKeyV577(e){const key=monsterMotionV577.key(e);return monsterFramesV577.has(key)?key:enemyAppearanceKeyV516(e)}
