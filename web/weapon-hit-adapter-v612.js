/* Installed inside the existing engine closure after all weapon modules. */
let weaponHitSourceV612=null,weaponHitTargetV612=null,weaponHitConnectedV612=false;
function withWeaponHitSourceV612(weapon,angle,callback){
 const old=weaponHitSourceV612;weaponHitSourceV612={weapon,angle};
 try{return callback();}finally{weaponHitSourceV612=old;}
}
const weaponHitArtV612=__WEAPON_HIT_ART_V612__;
const weaponHitFeedbackV612=createWeaponHitReactionsV612({art:weaponHitArtV612,
 image:()=>new Image(),time:()=>t,settings:feedbackCfg,crowd:()=>enemies.length,
 visible:(x,y,r)=>worldCircleVisibleV441(x,y,r,8)});
function weaponHitConnectV612(bridge=window.EVOLVE_HIT_EVENTS){
 if(weaponHitConnectedV612||!bridge)return;
 bridge.subscribe(event=>weaponHitFeedbackV612.receive(event,weaponHitTargetV612));weaponHitConnectedV612=true;
}
weaponHitConnectV612();
const weaponHitUpdateBaseV612=update;
update=function(dt){const before=t,result=weaponHitUpdateBaseV612(dt);if(t>before)weaponHitFeedbackV612.step(t-before);return result;};
const weaponHitGpuBaseV612=gpuEnemyVisualV426;
gpuEnemyVisualV426=function(enemy){
 const visual=weaponHitGpuBaseV612(enemy);
 if(enemy.arcShockV576&&enemy.arcShockV576.age<enemy.arcShockV576.life)return visual;
 const p=weaponHitFeedbackV612.pose(enemy);return p?{...visual,rot:visual.rot+p.rot,sx:visual.sx*p.sx,sy:visual.sy*p.sy,bob:visual.bob+p.bob}:visual;
};
const weaponHitEnemyDrawBaseV612=drawEnemy;
drawEnemy=function(enemy,shadowOnly=false){
 const p=weaponHitFeedbackV612.pose(enemy);
 if(!p||enemy.arcShockV576&&enemy.arcShockV576.age<enemy.arcShockV576.life)return weaponHitEnemyDrawBaseV612(enemy,shadowOnly);
 ctx.save();ctx.translate(enemy.x,enemy.y+p.bob);ctx.rotate(p.rot);ctx.scale(p.sx,p.sy);ctx.translate(-enemy.x,-enemy.y);
 try{return weaponHitEnemyDrawBaseV612(enemy,shadowOnly);}finally{ctx.restore();}
};
const weaponHitResetBaseV612=reset,weaponHitHomeBaseV612=returnToHome;
reset=function(...args){weaponHitFeedbackV612.reset();return weaponHitResetBaseV612(...args);};
returnToHome=function(...args){weaponHitFeedbackV612.reset();return weaponHitHomeBaseV612(...args);};
window.__EVOLVE_WEAPON_HITS_V612__={ready:weaponHitFeedbackV612.ready,read:()=>({...weaponHitFeedbackV612.read(),connected:weaponHitConnectedV612})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_WEAPON_HITS_V612__.test={
 pose:e=>weaponHitFeedbackV612.pose(e),reset:()=>weaponHitFeedbackV612.reset(),
 damage:(e,n,weapon,angle=0)=>withWeaponHitSourceV612(weapon,angle,()=>hurtEnemy(e,n,'arm')),
 receive:(event,e)=>weaponHitFeedbackV612.receive(event,e),art:()=>({...weaponHitArtV612}),
 advance:dt=>weaponHitFeedbackV612.step(dt)
};
