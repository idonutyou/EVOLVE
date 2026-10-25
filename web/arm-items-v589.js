// WEB-22: supplied cannon/blade ends, persistent ARM equipment and real combat.
const armItemsArtV589=JSON.parse('__ARM_ITEMS_ART__');
const armItemsV589={ready:false,frames:[],previews:{},images:{},volleys:0,shots:0,swings:0,contacts:0,side:0,aim:null,builds:0,lastMode:'bare'};
const armItemIdsV589={arm_cannon:'cannon',arm_blades:'blades'};
function armItemModeV589(){return armItemIdsV589[partsStateV523.worn.arm]||'bare';}
function armItemActiveV589(){return state.arm>0&&armItemModeV589()!=='bare';}
function armItemPointV589(side,index=playerFrameV586(),size=playerArtV586.displaySize){
 const id=side?84:45,art=playerArtV586,p=art.points[id],d=art.frames[index][id],scale=art.sourceScale*size/art.surface;
 return {x:(p[0]+d[0]-art.anchor[0])*scale,y:(p[1]+d[1]-art.anchor[1])*scale};
}
function armItemWorldPointV589(side){
 const a=playerBodyAngleV590();
 const pose=playerFacingV587(a,playerMotionV586.facing),p=armItemPointV589(side),c=Math.cos(pose.rotation),s=Math.sin(pose.rotation);
 return {x:player.x+p.x*pose.facing*c-p.y*s,y:player.y+p.x*pose.facing*s+p.y*c};
}
function armCannonVolleyV589(a,target){
 armItemsV589.side=armItemsV589.volleys%2;armItemsV589.volleys++;
 playerMotionV586.casts++;playerMotionV586[armItemsV589.side?'right':'left']++;player.look=a;
 const p=armItemWorldPointV589(armItemsV589.side,a);armItemsV589.aim=Math.atan2(target.y-p.y,target.x-p.x);recordWeaponAttackV590(armItemsV589.aim);return armItemsV589.aim;
}
function armShotOriginV589(a){
 const mode=armItemModeV589();if(mode!=='cannon')return {x:player.x+Math.cos(a)*18,y:player.y+Math.sin(a)*18};
 const p=armItemWorldPointV589(armItemsV589.side,player.look||0),art=armItemsArtV589.items.cannon;
 const side=armItemsV589.side?'right':'left',length=art[side].length*art.world_scale*upgradeBodyScaleV593();
 armItemsV589.shots++;return {x:p.x+Math.cos(a)*length,y:p.y+Math.sin(a)*length};
}
function armSlashAngleV589(attack,age=attack.age){
 const p=clamp((age-.09)/.21,0,1),ease=p*p*(3-2*p),direction=attack.side?1:-1;
 return attack.a+direction*(-1.08+2.16*ease);
}
function armSlashReachV589(){return upgradeBladeReachV593(60+Math.max(0,(state.arm||1)-1)*2);}
function armSlashTargetV589(){
 const range=armSlashReachV589(),valid=e=>playerTargetV586(e)&&Math.hypot(e.x-player.x,e.y-player.y)<=range+(e.r||12)&&!terrainHitV418(player.x,player.y,e.x,e.y,1);
 if(valid(focusEnemy))return focusEnemy;
 let best=null,distance=Infinity;for(const e of enemies){if(!valid(e))continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<distance){best=e;distance=d;}}return best;
}
function armSlashV589(manual=false){
 const m=playerMotionV586;if(!running||paused||choosing||rewardChoosing||ended||!(state.arm>0)||m.attack||m.cooldown>0)return false;
 const target=armSlashTargetV589();if(!target&&!manual)return false;
 const a=target?Math.atan2(target.y-player.y,target.x-player.x):(player.look||0),side=m.side;
 m.side=1-side;m.attack={kind:'blades',age:0,life:.44,a,side,hit:false,targets:new Set()};
 m.cooldown=Math.max(.34,(.71-Math.max(0,state.arm-1)*.045)*attackTempoMul()*(frenzy>0?.82:1))/upgradeBladeRateV593();
 m.casts++;m[side?'right':'left']++;recordWeaponAttackV590(a);armItemsV589.swings++;player.look=a;player.armKick=.20;return true;
}
function armSlashStepV589(attack,dt){
 if(attack.age<.09||attack.age-dt>.30)return;
 const from=armSlashAngleV589(attack,Math.max(.09,attack.age-dt)),to=armSlashAngleV589(attack,Math.min(.30,attack.age));
 const lo=Math.min(from,to)-attack.a,hi=Math.max(from,to)-attack.a,range=armSlashReachV589();
 const damage=(29+Math.max(0,(state.arm||1)-1)*6)*coreDamageBoost()*(evoState.arm?(player.armEvoPower||1):1);
 enemyEachCandidateCircleV425(player.x,player.y,range+48,e=>{
  if(!playerTargetV586(e)||attack.targets.has(e))return;
  const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy),r=e.r||12;if(d>range+r)return;
  const angle=Math.atan2(Math.sin(Math.atan2(dy,dx)-attack.a),Math.cos(Math.atan2(dy,dx)-attack.a));
  const edge=Math.asin(Math.min(1,r/Math.max(r,d)));
  if(angle+edge<lo||angle-edge>hi||terrainHitV418(player.x,player.y,e.x,e.y,1))return;
  attack.targets.add(e);attack.hit=true;hurtEnemy(e,damage,'arm');playerMotionV586.hits++;armItemsV589.contacts++;
  e.stagger=Math.max(e.stagger||0,8+state.arm*2);
  particles.push({kind:'weaponHit',x:e.x,y:e.y,vx:0,vy:0,r:2,max:20,life:.15,maxLife:.15,color:'arm',a:attack.a});
 });
 if(attack.targets.size&&attack.age-dt<.20)cameraShake=Math.max(cameraShake,2.1);
}
const armBareAttackV589=playerStabV586;
playerStabV586=function(manual=false){const mode=armItemModeV589();return mode==='cannon'?false:mode==='blades'?armSlashV589(manual):armBareAttackV589(manual);};
const armBareStepV589=playerStepV586;
playerStepV586=function(dt){
 const attack=playerMotionV586.attack;
 // Keep the exact bare contact timing. A blade swing tests its swept arc instead.
 if(attack?.kind==='blades'){
  playerMotionV586.attack=null;armBareStepV589(dt);playerMotionV586.attack=attack;const swingDT=dt*upgradeBladeRateV593();attack.age+=swingDT;armSlashStepV589(attack,swingDT);
  if(attack.age>=attack.life){if(!attack.targets.size)playerMotionV586.misses++;playerMotionV586.attack=null;}
 }else armBareStepV589(dt);
};
function armItemOffsetV600(mode,side,x,y,angle,scale=1,facing=1){
 const spec=armItemsArtV589.items[mode],part=spec[side?'right':'left'],dx=x-part.pivot[0],dy=y-part.pivot[1],c=Math.cos(part.native_angle),s=Math.sin(part.native_angle);
 const u=(dx*c+dy*s)*spec.world_scale*scale,v=(-dx*s+dy*c)*spec.world_scale*scale*(mode==='blades'?(side?-1:1)*facing:1),co=Math.cos(angle),si=Math.sin(angle);
 return {x:u*co-v*si,y:u*si+v*co};
}
function armItemSpriteV589(g,mode,side,p,angle,scale=1,alpha=1,facing=1){
 const key=side?'right':'left',spec=armItemsArtV589.items[mode],part=spec[key],image=armItemsV589.images[mode]?.[key];if(!image)return;
 const size=spec.world_scale*scale;
 g.save();g.translate(p.x,p.y);g.rotate(angle);if(mode==='blades')g.scale(1,(side?-1:1)*facing);g.rotate(-part.native_angle);g.globalAlpha*=alpha;
 g.drawImage(image,-part.pivot[0]*size,-part.pivot[1]*size,part.width*size,part.height*size);g.restore();
}
function armBladeRestAngleV602(side,bodyAngle=playerBodyAngleV590()){
 return bodyAngle+(playerMotionV586.facing||1)*(side?.48:.30);
}
function armItemAngleV589(side,a){
 const mode=armItemModeV589();if(mode==='cannon')return playerWeaponAngleV590();
 const rest=armBladeRestAngleV602(side),attack=playerMotionV586.attack;
 if(mode==='blades'&&attack?.kind==='blades'&&attack.side===side){
  const angle=armSlashAngleV589(attack);if(attack.age<=.30)return angle;
  const t=clamp((attack.age-.30)/.10,0,1),ease=t*t*(3-2*t);
  return angle+Math.atan2(Math.sin(rest-angle),Math.cos(rest-angle))*ease;
 }
 return rest;
}
function drawArmItemsV589(a,alpha){
 const mode=armItemModeV589(),attack=playerMotionV586.attack;
 if(mode==='blades'&&attack?.kind==='blades'&&attack.age>=.09&&attack.age<.34){
  const previous=armSlashAngleV589(attack,Math.max(.09,attack.age-.065)),current=armSlashAngleV589(attack);
  const radius=armSlashReachV589()-10;ctx.save();ctx.translate(player.x,player.y);ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){ctx.globalAlpha=(.26-i*.06)*alpha;ctx.strokeStyle=i===0?'#f2f3ec':'#9cc5d2';ctx.lineWidth=i===0?3.2:1.2;ctx.beginPath();ctx.arc(0,0,radius-i*5,previous,current,attack.side===0);ctx.stroke();}
  ctx.restore();
 }
 for(const side of [1,0]){
  const p=armItemWorldPointV589(side,a),angle=armItemAngleV589(side,a);
  if(mode==='cannon'&&armItemsV589.side===side){const recoil=Math.max(0,player.armKick||0)*9;p.x-=Math.cos(angle)*recoil;p.y-=Math.sin(angle)*recoil;}
  armItemSpriteV589(ctx,mode,side,p,angle,(mode==='blades'?1+upgradeRunV593.bladeRange:1)*upgradeBodyScaleV593(),alpha,playerMotionV586.facing);
 }
}
const armBareDrawV589=drawPlayer;
drawPlayer=function(shadowOnly=false){
 const mode=armItemModeV589();if(mode==='bare'||!armItemsV589.ready)return armBareDrawV589(shadowOnly);
 const index=playerFrameV586(),frame=armItemsV589.frames[index],size=playerArtV586.displaySize;
 const a=playerBodyAngleV590(),pose=playerFacingV587(a,playerMotionV586.facing);playerMotionV586.facing=pose.facing;
 if(shadowOnly){castSpriteShadowV421(frame,player.x,player.y+14,size,pose.rotation,pose.facing,1,.48);return;}
 drawPlayerGroundV165(46,a);drawEvoDominanceAura(46);
 const blink=(player.hurtBlink||0)>0&&Math.floor((.5-player.hurtBlink)/.0625)%2===0?.38:1;
 drawSpriteImage(frame,player.x,player.y,size,pose.rotation,blink,0,pose.facing,1);drawArmItemsV589(a,blink);
 if(frenzy>0)stamp('vfx/core_ring',player.x,player.y,64,t*.3,.25);
 if(player.inv>0||(player.shieldHP||0)>0){ctx.save();ctx.strokeStyle='#b4e9ff';ctx.globalAlpha=.56;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(player.x,player.y,22,0,TAU);ctx.stroke();ctx.restore();}
};
const armBareLabelsV589=playerWeaponLabelsV586;
playerWeaponLabelsV586=function(){
 armBareLabelsV589();const mode=armItemModeV589();if(mode==='bare')return;
 const item=partsItemV523(mode==='cannon'?'arm_cannon':'arm_blades'),name=partsNameV523(item);
 const role=mode==='cannon'?partsTextV523('Alternating biological cannons · original projectile upgrades','생체 쌍포 교대 사격 · 기존 탄막 강화'):partsTextV523('Alternating blade swings · cuts enemies in the swept arc','쌍날 교대 베기 · 휘두른 범위의 적 타격');
 const upgrade=upgrades.find(u=>u.active&&u.kind==='arm');if(upgrade)upgrade.title=()=>partsNameV523(item)+' · '+partsTextV523('Enhance','강화');
};
const armBareStatsV589=levelStatHtml;
levelStatHtml=function(u){
 const mode=armItemModeV589();if(!u.active||u.kind!=='arm'||mode==='bare')return armBareStatsV589(u);
 return mode==='cannon'?'<div class="statRow"><span>생체 쌍포</span><b>기존 탄막 · 연사 · 관통 강화</b></div>':'<div class="statRow"><span>절단 쌍날</span><b>베기 피해 · 공격 속도 강화</b></div><div class="statRow"><span>근접 범위</span><b>휘두른 궤적의 적을 한 번씩 타격</b></div>';
};
const armBareDetailV589=updatePartsDetailV523;
updatePartsDetailV523=function(){armBareDetailV589();const mode=armItemIdsV589[partsSelectedV523];if(!mode)return;
 homeSetTextV522('partsDetailHintV523',mode==='cannon'?partsTextV523('Equipping replaces ARM stabs with alternating cannon fire. Existing projectile and star upgrades apply.','장착하면 ARM 찌르기가 생체 쌍포 사격으로 바뀝니다. 기존 탄막과 별 등급 강화가 적용됩니다.'):partsTextV523('Equipping replaces ARM stabs with alternating blade swings. Enemies touched by the swept arc take damage.','장착하면 ARM 찌르기가 쌍날 교대 베기로 바뀝니다. 실제 휘두른 범위의 적들을 베어 공격합니다.'));
};
function armItemsRefreshV589(){
 const mode=armItemModeV589();if(mode!==armItemsV589.lastMode){playerMotionV586.attack=null;playerMotionV586.cooldown=.18;player.shoot=.18;armItemsV589.lastMode=mode;}
 playerWeaponLabelsV586();if(!armItemsV589.ready)return;
 const preview=mode==='bare'?ASSET_SRC['player_static/base_specimen']:armItemsV589.previews[mode];
 for(const id of ['partsSpecimenImgV523']){const image=$(id);if(image&&image.getAttribute('src')!==preview)image.src=preview;}
}
const armBareEquipV589=equipPartV523;
equipPartV523=function(...args){const result=armBareEquipV589(...args);armItemsRefreshV589();return result;};
const armBareHomeV589=refreshEvolveHomeV522;
refreshEvolveHomeV522=function(...args){const result=armBareHomeV589(...args);armItemsRefreshV589();return result;};
const armBareRenderV589=renderEvolvePartsV523;
renderEvolvePartsV523=function(...args){const result=armBareRenderV589(...args);armItemsRefreshV589();return result;};
const armBareResetV589=reset;
reset=function(...args){const result=armBareResetV589(...args);Object.assign(armItemsV589,{volleys:0,shots:0,swings:0,contacts:0,side:0,aim:null});armItemsRefreshV589();return result;};
function armItemsMaskedSourceV589(){
 const source=playerSourceCutoutV588(),g=source.getContext('2d');g.save();g.globalCompositeOperation='destination-out';
 for(const poly of [[[858,290],[1020,360],[1020,610],[875,553]],[[1370,410],[1500,480],[1535,780],[1408,716]]]){
  g.beginPath();poly.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();
 }g.restore();return source;
}
const armItemsReadyV589=Promise.all([playerReadyV586,...Object.entries(armItemsArtV589.items).flatMap(([kind,item])=>['left','right'].map(side=>new Promise((resolve,reject)=>{
 const img=new Image();(armItemsV589.images[kind]??={})[side]=img;img.onload=()=>resolve(true);img.onerror=()=>reject(new Error('주무장 이미지를 불러오지 못했습니다.'));img.src=item[side].path;
})))]).then(()=>{
 const source=armItemsMaskedSourceV589();
 for(let index=0;index<20;index++){
  const c=playerOriginalPoseV588(source,index);c.complete=true;c.naturalWidth=c.width;c.naturalHeight=c.height;c._actor=true;c._spriteCrop=[0,0,c.width,c.height];c._sourceReleasedV425=true;
  actorMipCacheV424.set(c,new Map([[384,{source:c,w:c.width,h:c.height,bucket:384}]]));actorMipV424(c,playerArtV586.displaySize);shadowMaskV421(c);armItemsV589.frames.push(c);armItemsV589.builds++;
 }
 for(const mode of ['cannon','blades']){
  const size=playerArtV586.previewSurface,canvas=playerOriginalPoseV588(source,0,size),g=canvas.getContext('2d'),scale=size/playerArtV586.displaySize;
  for(const side of [1,0]){const p=armItemPointV589(side,0,size);p.x+=size/2;p.y+=size/2;armItemSpriteV589(g,mode,side,p,.95,scale*(mode==='blades'?.58:.72));}
  armItemsV589.previews[mode]=canvas.toDataURL('image/png');canvas.width=canvas.height=1;
 }
 source.width=source.height=1;armItemsV589.ready=true;armItemsRefreshV589();return true;
});
for(const [id,mode] of Object.entries(armItemIdsV589)){
 const item=partsItemV523(id);item.art='arm_items/'+mode;ASSET_SRC[item.art]=armItemsArtV589.items[mode].icon.path;
}
// Preserve existing saved IDs and every other inventory slot.
const armPartsSnapshotV589=window.__EVOLVE_PARTS_V523__.snapshot;
window.__EVOLVE_PARTS_V523__.snapshot=()=>({...armPartsSnapshotV589(),mode:'ARM_COMBAT',combatArm:armItemModeV589()});
const armPlayerReadV589=window.__EVOLVE_PLAYER_SCORPION_V586__.read;
window.__EVOLVE_PLAYER_SCORPION_V586__.read=()=>({...armPlayerReadV589(),unarmed:armItemModeV589()==='bare',weapon:state.arm>0?(armItemModeV589()==='bare'?'upper-limb-stab':armItemModeV589()):selectedStartWeapon,range:armItemModeV589()==='blades'?armSlashReachV589():playerReachV586});
window.__EVOLVE_ARM_ITEMS_V589__={ready:armItemsReadyV589,read:()=>({ready:armItemsV589.ready,mode:armItemModeV589(),active:armItemActiveV589(),worn:partsStateV523.worn.arm,volleys:armItemsV589.volleys,shots:armItemsV589.shots,swings:armItemsV589.swings,contacts:armItemsV589.contacts,cachedFrames:armItemsV589.frames.length,frameBuilds:armItemsV589.builds,lightningLocked:true})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_ARM_ITEMS_V589__.test={art:()=>armItemsArtV589,images:()=>armItemsV589.images,previews:()=>armItemsV589.previews,slash:()=>armSlashV589(true),angle:armSlashAngleV589,worldPoint:armItemWorldPointV589};
renderEvolvePartsV523(true);
