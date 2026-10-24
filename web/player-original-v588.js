// WEB-21: unchanged supplied artwork, repositioned forelimbs/core and cached native poses.
// Existing catalog equipment stays saved; its future lightning combat is locked.
const playerArtV586=JSON.parse('__PLAYER_ORIGINAL_ART__');
const playerAtlasV586=new Image(),playerFramesV586=[];
const playerMotionV586={clock:0,gait:0,x:0,y:0,moving:false,attack:null,cooldown:.18,side:0,casts:0,hits:0,misses:0,left:0,right:0,deathAt:0,frameBuilds:0,facing:1};
const playerReachV586=44;
function playerArmedV586(){return false;}
function playerMotionResetV586(){Object.assign(playerMotionV586,{clock:0,gait:0,x:player.x,y:player.y,moving:false,attack:null,cooldown:.18,side:0,casts:0,hits:0,misses:0,left:0,right:0,deathAt:0,facing:1});}
function playerFacingV587(a,previous=1){
 const x=Math.cos(a),facing=x>.10?1:x<-.10?-1:previous;
 const aim=clamp(Math.atan2(Math.sin(a),Math.abs(x)),-78*Math.PI/180,78*Math.PI/180);
 // Keep the painted body's upper side upright, and its head away from vertical.
 const localRotation=clamp(aim-playerArtV586.nativeFacing,-80*Math.PI/180,80*Math.PI/180);
 // R(facing*r) * Mirror(facing) is exactly Mirror(facing) * R(r).
 return {facing,localRotation,rotation:facing*localRotation,headAngle:playerArtV586.nativeFacing+localRotation};
}
function playerTargetV586(e){return !!e&&!e.dead&&e.hp>0&&!e.arrivalInvuln&&!(e.arrivalTime>0);}
function playerInReachV586(e){return playerTargetV586(e)&&Math.hypot(e.x-player.x,e.y-player.y)<=upgradeBladeReachV593(playerReachV586)+(e.r||12)&&!terrainHitV418(player.x,player.y,e.x,e.y,1);}
function playerNearestV586(){
 if(playerInReachV586(focusEnemy))return focusEnemy;
 let best=null,distance=Infinity;for(const e of enemies){if(!playerInReachV586(e))continue;const d=Math.hypot(e.x-player.x,e.y-player.y)-(e.r||12);if(d<distance){distance=d;best=e;}}return best;
}
function playerStabV586(manual=false){
 const m=playerMotionV586;if(!running||paused||choosing||rewardChoosing||ended||!(state.arm>0)||m.attack||m.cooldown>0)return false;
 const target=playerNearestV586();if(!target&&!manual)return false;
 const a=target?Math.atan2(target.y-player.y,target.x-player.x):(player.look||0),side=m.side;
 m.side=1-side;m.attack={age:0,life:.34,a,side,target,hit:false};m.cooldown=Math.max(.38,.64*attackTempoMul()*(frenzy>0?.82:1))/upgradeBladeRateV593();m.casts++;m[side?'right':'left']++;recordWeaponAttackV590(a);
 player.look=a;player.armKick=.18;return true;
}
function playerStabContactV586(attack){
 const e=attack.target;if(!playerInReachV586(e))return false;
 const dx=e.x-player.x,dy=e.y-player.y,along=dx*Math.cos(attack.a)+dy*Math.sin(attack.a),across=Math.abs(-dx*Math.sin(attack.a)+dy*Math.cos(attack.a));
 // A narrow forward capsule, tested again at impact. No ranged fallback or area hit.
 if(along<-(e.r||12)||along>upgradeBladeReachV593(playerReachV586)+(e.r||12)||across>10+(e.r||12))return false;
 const damage=(22+Math.max(0,(state.arm||1)-1)*4.5)*coreDamageBoost();
 hurtEnemy(e,damage,'arm');return true;
}
function playerStepV586(dt){
 const m=playerMotionV586;m.clock+=dt;const distance=Math.hypot(player.x-m.x,player.y-m.y);m.moving=distance>.015&&distance<Math.max(32,(player.speed||132)*dt*5);
 playerMovementStepV590(dt,player.x-m.x,player.y-m.y,m.moving);if(m.moving)m.gait+=distance/9;m.x=player.x;m.y=player.y;m.cooldown=Math.max(0,m.cooldown-dt);
 if(m.attack){const a=m.attack;a.age+=dt*upgradeBladeRateV593();if(!a.hit&&a.age>=.12){a.hit=true;if(playerStabContactV586(a))m.hits++;else m.misses++;}if(a.age>=a.life)m.attack=null;}
}
function playerFrameV586(){
 const m=playerMotionV586;if(player.hp<=0){if(!m.deathAt)m.deathAt=performance.now();return performance.now()-m.deathAt<180?18:19;}
 if((player.hurtKick||0)>.02)return (player.hurtKick||0)>.16?16:17;
 const a=m.attack;
 if(a){const pose=a.age<.075?0:a.age<.12?1:a.age<.20?2:3;return (a.side?12:8)+pose;}
 if(feedbackCfg().reducedMotion)return m.moving?4:0;
 return m.moving?4+Math.floor(m.gait)%4:Math.floor(m.clock*3)%4;
}
let playerNativePoseV588=null;
function playerSourceCutoutV588(){
 const source=document.createElement('canvas');source.width=playerArtV586.width;source.height=playerArtV586.height;
 const g=source.getContext('2d');g.save();g.beginPath();for(const [y,x,w] of playerArtV586.clip)g.rect(x,y,w,1);g.clip();g.drawImage(playerAtlasV586,0,0);g.restore();return source;
}
function playerOriginalPoseV588(source,index,size=playerArtV586.surface,normalize=true){
 const art=playerArtV586,c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),s=normalize?art.sourceScale*size/art.surface:1;
 const ox=normalize?size/2-art.anchor[0]*s:0,oy=normalize?size/2-art.anchor[1]*s:0,offsets=art.frames[index];
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 for(const triangle of art.triangles){
  const [i,j,k]=triangle,[x0,y0]=art.points[i],[x1,y1]=art.points[j],[x2,y2]=art.points[k];
  const a=(x1-x0),b=(y1-y0),d=(x2-x0),e=(y2-y0),det=a*e-b*d;
  const u0=ox+(x0+offsets[i][0])*s,v0=oy+(y0+offsets[i][1])*s,u1=ox+(x1+offsets[j][0])*s,v1=oy+(y1+offsets[j][1])*s,u2=ox+(x2+offsets[k][0])*s,v2=oy+(y2+offsets[k][1])*s;
  const ma=((u1-u0)*e-(u2-u0)*b)/det,mc=((u2-u0)*a-(u1-u0)*d)/det,mb=((v1-v0)*e-(v2-v0)*b)/det,md=((v2-v0)*a-(v1-v0)*d)/det;
  const cx=(u0+u1+u2)/3,cy=(v0+v1+v2)/3;
  // A fraction of one destination pixel overlaps shared edges, avoiding seams.
  const expand=(x,y)=>{const length=Math.hypot(x-cx,y-cy)||1;return [x+(x-cx)/length*.45,y+(y-cy)/length*.45]};
  const p=expand(u0,v0),q=expand(u1,v1),r=expand(u2,v2);
  g.save();g.beginPath();g.moveTo(...p);g.lineTo(...q);g.lineTo(...r);g.closePath();g.clip();g.transform(ma,mb,mc,md,u0-ma*x0-mc*y0,v0-mb*x0-md*y0);g.drawImage(source,0,0);g.restore();
 }
 return c;
}
const playerReadyV586=new Promise((resolve,reject)=>{
 playerAtlasV586.onerror=()=>reject(new Error('기본 캐릭터 원본 이미지를 불러오지 못했습니다.'));
 playerAtlasV586.onload=()=>{
  try{
   const source=playerSourceCutoutV588();
   for(let index=0;index<playerArtV586.frames.length;index++){
    const c=playerOriginalPoseV588(source,index);
    c.complete=true;c.naturalWidth=c.width;c.naturalHeight=c.height;c._actor=true;c._spriteCrop=[0,0,c.width,c.height];c._sourceReleasedV425=true;
    actorMipCacheV424.set(c,new Map([[384,{source:c,w:c.width,h:c.height,bucket:384}]]));
    actorMipV424(c,playerArtV586.displaySize);shadowMaskV421(c);playerFramesV586.push(c);playerMotionV586.frameBuilds++;
   }
   const home=playerOriginalPoseV588(source,0,playerArtV586.previewSurface),preview=home.toDataURL('image/png');home.width=home.height=1;
   if(new URLSearchParams(location.search).get('evolveQA')==='1')playerNativePoseV588=playerOriginalPoseV588(source,0,playerArtV586.width,false);
   source.width=source.height=1;
   ASSET_SRC['player_static/base_specimen']=preview;SPRITE_SRC.player=preview;
   for(const id of ['partsSpecimenImgV523']){const image=$(id);if(image){image.src=preview;image.removeAttribute('data-origin-v522');delete image.dataset.origin;}}
   playerWeaponLabelsV586();resolve(true);
  }catch(error){reject(error);}
 };
 playerAtlasV586.src=playerArtV586.path;
});
hurtEnemy=classicCombatV587.hurtEnemy;
chooseLevelPicks=classicCombatV587.chooseLevelPicks;
triggerHordeRupture=classicCombatV587.triggerHordeRupture;
lightningStartUIV576.remove();
firePlayer=function(dt){playerStepV586(dt);classicCombatV587.firePlayer(dt);playerStabV586(false);};
const playerLegacyResetV586=reset;reset=function(...args){const result=playerLegacyResetV586(...args);playerMotionResetV586();playerWeaponLabelsV586();updateAbilityUI();return result;};
const playerLegacyHomeV586=returnToHome;returnToHome=function(...args){const result=playerLegacyHomeV586(...args);playerMotionResetV586();return result;};
originActive=function(){return false;};
updateAbilityUI=function(){
 const b=$('ability'),name=$('abilityName');if(name)name.textContent=homeTextV522('LIGHTNING','전격');if(!b)return;
 const glyph=b.querySelector('.abilityGlyph');if(glyph)glyph.textContent='ϟ';
 const cd=$('abilityCd');if(cd)cd.style.background='none';
 b.disabled=true;b.classList.remove('ready','active');b.setAttribute('aria-disabled','true');b.setAttribute('aria-label','전격 · 잠김');b.title='전격 · 아이템 기능 준비 중';
};
const playerCombatStyleV587=document.createElement('style');playerCombatStyleV587.textContent='#app.combat #ability:disabled,#ability:disabled{opacity:.32!important;filter:grayscale(1)!important;cursor:default!important;box-shadow:none!important}#abilityName{font-size:8px!important}';document.head.appendChild(playerCombatStyleV587);
function playerWeaponLabelsV586(){
 const upgrade=upgrades.find(u=>u.active&&u.kind==='arm');if(upgrade)upgrade.title=()=>homeTextV522('ARM UPGRADE','팔 강화');
}
levelStatHtml=function(u){if(u.active&&u.kind==='arm')return '<div class="statRow"><span>기본 찌르기</span><b>찌르기 피해량 증가</b></div><div class="statRow"><span>상단 두 다리</span><b>좌우 교대 · 근접 공격</b></div>';return classicCombatV587.levelStatHtml(u);};
const playerLegacyPartEquipV586=equipPartV523;equipPartV523=function(...args){const result=playerLegacyPartEquipV586(...args);playerMotionV586.attack=null;playerMotionV586.cooldown=.18;playerWeaponLabelsV586();updateAbilityUI();return result;};
const playerLegacyHomeRefreshV586=refreshEvolveHomeV522;refreshEvolveHomeV522=function(...args){const result=playerLegacyHomeRefreshV586(...args);playerWeaponLabelsV586();return result;};
const playerLegacyDrawV586=drawPlayer;drawPlayer=function(shadowOnly=false){
 const frame=playerFramesV586[playerFrameV586()];if(!frame)return playerLegacyDrawV586(shadowOnly);
 const size=playerArtV586.displaySize,a=playerBodyAngleV590(),pose=playerFacingV587(a,playerMotionV586.facing);playerMotionV586.facing=pose.facing;
 if(shadowOnly){castSpriteShadowV421(frame,player.x,player.y+14,size,pose.rotation,pose.facing,1,.48);return;}
 drawPlayerGroundV165(46,a);drawEvoDominanceAura(46);
 const blink=(player.hurtBlink||0)>0&&Math.floor((.5-player.hurtBlink)/.0625)%2===0?.38:1;
 drawSpriteImage(frame,player.x,player.y,size,pose.rotation,blink,0,pose.facing,1);
 if(frenzy>0)stamp('vfx/core_ring',player.x,player.y,64,t*.3,.25);
 if(player.inv>0||(player.shieldHP||0)>0){ctx.save();ctx.strokeStyle='#b4e9ff';ctx.globalAlpha=.56;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(player.x,player.y,22,0,TAU);ctx.stroke();ctx.restore();}
};
playerWeaponLabelsV586();
updateAbilityUI();
window.__EVOLVE_PLAYER_SCORPION_V586__={ready:playerReadyV586,read:()=>({character:'ivory-bio-scorpion',unarmed:true,weapon:state.arm>0?'upper-limb-stab':selectedStartWeapon,lightningLocked:true,facing:playerFacingV587(playerMotionV586.attack?.a??player.look??0,playerMotionV586.facing),frame:playerFrameV586(),cachedFrames:playerFramesV586.length,frameBuilds:playerMotionV586.frameBuilds,range:playerReachV586,casts:playerMotionV586.casts,hits:playerMotionV586.hits,misses:playerMotionV586.misses,left:playerMotionV586.left,right:playerMotionV586.right,moving:playerMotionV586.moving,attack:playerMotionV586.attack?{age:playerMotionV586.attack.age,side:playerMotionV586.attack.side,a:playerMotionV586.attack.a,hit:playerMotionV586.attack.hit}:null})};
window.__EVOLVE_PLAYER_COMBAT_V587__=window.__EVOLVE_PLAYER_SCORPION_V586__;
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_PLAYER_SCORPION_V586__.test={frames:()=>playerFramesV586,step:dt=>firePlayer(dt),reset:playerMotionResetV586,stab:()=>playerStabV586(true),motion:()=>playerMotionV586,pose:playerFacingV587,picks:()=>chooseLevelPicks().map(u=>({kind:u.kind,gene:u.gene,title:u.title(),stats:levelStatHtml(u)})),bullets:()=>bullets,particles:()=>particles,draw:shadow=>drawPlayer(!!shadow),damage:n=>playerDamage(n)};

window.__EVOLVE_ORIGINAL_PLAYER_V588__={read:()=>({source:playerArtV586.path,sha256:playerArtV586.sha256,sourceWidth:playerArtV586.width,sourceHeight:playerArtV586.height,previewSize:playerArtV586.previewSurface,anatomyOffsets:playerArtV586.anatomy_offsets,frameBuilds:playerMotionV586.frameBuilds,redrawn:false,frameCacheBytes:playerFramesV586.length*playerArtV586.surface**2*4,minimumTriangleAreaRatio:playerArtV586.minimum_triangle_area_ratio})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_ORIGINAL_PLAYER_V588__.test={native:()=>playerNativePoseV588,source:()=>playerAtlasV586,art:()=>playerArtV586};
