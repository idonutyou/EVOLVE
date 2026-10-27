/* STEP07 V614 — attach read-only visual feedback after V613 inside game closure. */
const monsterFeedbackV614=createMonsterFeedbackV614({
 time:()=>t,settings:feedbackCfg,crowd:()=>enemies.length,
 combatType:e=>enemyCombatTypeV596(e),
 weaponPose:e=>weaponHitFeedbackV612.pose(e),
 organPose:e=>organHitFeedbackV613.pose(e),
 direction:e=>Math.atan2(e.y-player.y,e.x-player.x)
});
let monsterFeedbackConnectedV614=false;
function monsterFeedbackConnectV614(bridge=window.EVOLVE_HIT_EVENTS){
 if(monsterFeedbackConnectedV614||!bridge)return false;
 bridge.subscribe(event=>monsterFeedbackV614.receive(event,weaponHitTargetV612));
 monsterFeedbackConnectedV614=true;return true;
}
monsterFeedbackConnectV614();
const monsterFeedbackUpdateBaseV614=update;
update=function(dt){
 const before=t,result=monsterFeedbackUpdateBaseV614(dt);
 if(t>before)monsterFeedbackV614.step(t-before);
 return result;
};
const monsterFeedbackGpuBaseV614=gpuEnemyVisualV426;
gpuEnemyVisualV426=function(enemy){
 const visual=monsterFeedbackGpuBaseV614(enemy),p=monsterFeedbackV614.pose(enemy);
 return p?{...visual,rot:visual.rot+p.rot,sx:visual.sx*p.sx,sy:visual.sy*p.sy,bob:visual.bob+p.bob}:visual;
};
const monsterFeedbackDrawBaseV614=drawEnemy;
drawEnemy=function(enemy,shadowOnly=false){
 const p=monsterFeedbackV614.pose(enemy);
 if(!p||shadowOnly)return monsterFeedbackDrawBaseV614(enemy,shadowOnly);
 ctx.save();ctx.translate(enemy.x,enemy.y+p.bob);ctx.rotate(p.rot);ctx.scale(p.sx,p.sy);ctx.translate(-enemy.x,-enemy.y);
 try{return monsterFeedbackDrawBaseV614(enemy,shadowOnly);}finally{ctx.restore();}
};
// Never create a second death echo: decorate only the echo emitted by original game code.
const monsterFeedbackDeathBaseV614=spawnDeathEcho;
spawnDeathEcho=function(e){
 const previous=deathEchoes.at(-1),result=monsterFeedbackDeathBaseV614(e),latest=deathEchoes.at(-1);
 if(e&&latest&&latest!==previous)monsterFeedbackV614.attachEcho(e,latest);
 return result;
};
const monsterFeedbackResetBaseV614=reset,monsterFeedbackHomeBaseV614=returnToHome;
reset=function(...args){monsterFeedbackV614.reset();return monsterFeedbackResetBaseV614(...args);};
returnToHome=function(...args){monsterFeedbackV614.reset();return monsterFeedbackHomeBaseV614(...args);};
window.__EVOLVE_MONSTER_FEEDBACK_V614__={read:()=>({...monsterFeedbackV614.read(),connected:monsterFeedbackConnectedV614})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_MONSTER_FEEDBACK_V614__.test={
 receive:(event,e)=>monsterFeedbackV614.receive(event,e),pose:e=>monsterFeedbackV614.pose(e),
 echo:(e,d)=>monsterFeedbackV614.attachEcho(e,d),reset:()=>monsterFeedbackV614.reset(),
 context:()=>({enemies,player,deathEchoes,ctx,draw,update,reset,returnToHome,feedback:feedbackCfg()})
};
