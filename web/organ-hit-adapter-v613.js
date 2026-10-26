/* Installed inside the current engine closure, after the STEP05 adapter. */
let organHitSourceV613=null,organHitConnectedV613=false;
function withOrganHitSourceV613(kind,angle,callback){
  const old=organHitSourceV613;organHitSourceV613={kind,angle,direct:true};
  try{return callback();}finally{organHitSourceV613=old;}
}
const organHitFeedbackV613=createOrganHitReactionsV613({
  art:{spike:weaponHitArtV612.gun,tail:weaponHitArtV612.blade},image:()=>new Image(),time:()=>t,
  settings:feedbackCfg,crowd:()=>enemies.length,otherEffects:()=>weaponHitFeedbackV612.read().active,
  weaponPose:e=>weaponHitFeedbackV612.pose(e),visible:(x,y,r)=>worldCircleVisibleV441(x,y,r,8)
});
function organHitConnectV613(bridge=window.EVOLVE_HIT_EVENTS){
  if(organHitConnectedV613||!bridge)return;
  bridge.subscribe(event=>organHitFeedbackV613.receive(event,weaponHitTargetV612,organHitSourceV613));
  organHitConnectedV613=true;
}
organHitConnectV613();
const organHitUpdateBaseV613=update;
update=function(dt){const before=t,result=organHitUpdateBaseV613(dt);if(t>before)organHitFeedbackV613.step(t-before);return result;};
const organHitGpuBaseV613=gpuEnemyVisualV426;
gpuEnemyVisualV426=function(enemy){
  const visual=organHitGpuBaseV613(enemy),p=organHitFeedbackV613.pose(enemy);
  return p?{...visual,rot:visual.rot+p.rot,sx:visual.sx*p.sx,sy:visual.sy*p.sy,bob:visual.bob+p.bob}:visual;
};
const organHitEnemyBaseV613=drawEnemy;
drawEnemy=function(enemy,shadowOnly=false){
  const p=organHitFeedbackV613.pose(enemy);if(!p)return organHitEnemyBaseV613(enemy,shadowOnly);
  ctx.save();ctx.translate(enemy.x,enemy.y+p.bob);ctx.rotate(p.rot);ctx.scale(p.sx,p.sy);ctx.translate(-enemy.x,-enemy.y);
  try{return organHitEnemyBaseV613(enemy,shadowOnly);}finally{ctx.restore();}
};
// Only the rendering accessor changes; lightning hold/damage/chain clocks are untouched.
const organHitLightningPoseBaseV613=lightningV576.pose;
lightningV576.pose=function(enemy){return feedbackCfg().reducedMotion?null:organHitLightningPoseBaseV613(enemy);};
const organHitResetBaseV613=reset,organHitHomeBaseV613=returnToHome;
reset=function(...args){organHitFeedbackV613.reset();organHitSourceV613=null;return organHitResetBaseV613(...args);};
returnToHome=function(...args){organHitFeedbackV613.reset();organHitSourceV613=null;return organHitHomeBaseV613(...args);};
window.__EVOLVE_ORGAN_HITS_V613__={ready:organHitFeedbackV613.ready,read:()=>({...organHitFeedbackV613.read(),connected:organHitConnectedV613})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_ORGAN_HITS_V613__.test={
  pose:e=>organHitFeedbackV613.pose(e),reset:()=>organHitFeedbackV613.reset(),
  damage:(e,n,kind,angle=0)=>withOrganHitSourceV613(kind,angle,()=>hurtEnemy(e,n,kind)),
  receive:(event,e,source)=>organHitFeedbackV613.receive(event,e,source),
  source:()=>organHitSourceV613,withSource:withOrganHitSourceV613,
  direct:(e,s,n,angle=0)=>organHitV598(e,s,n,angle),
  context:()=>({player,enemies,state,run:organRunV598,spec:organSpecV598,cast:organCastV598,
    step:organStepV598,projectileStep:organProjectileStepV598,whipStep:organWhipStepV598,
    draw,update,ctx,feedback:feedbackCfg(),lightning:lightningV576})
};
