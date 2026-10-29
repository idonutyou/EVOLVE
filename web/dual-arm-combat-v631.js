// Independent arm composition and attacks, on top of the existing engine.
// The two extra catalog items use their existing art and the existing blade
// attack. No save keys or source image bytes are changed.
(function(){
 'use strict';
 const model=window.EVOLVE_DUAL_ARM_MODEL_V631;
 const ids={arm_cannon:'cannon',arm_blades:'blades',arm_lances:'blades',arm_lash:'blades'};
 const visuals={arm_cannon:'cannon',arm_blades:'blades',arm_lances:'lances',arm_lash:'lash'};
 const extra={
  lances:{asset:'capstone_apex/execution_spine',width:320,height:307,pivot:[90,220],native_angle:-.66,world_scale:.045},
  lash:{asset:'mutation_parts/tail_l2',width:233,height:256,pivot:[40,200],native_angle:-.85,world_scale:.06}
 };
 const loading={},art={generation:1};
 let forcedMode=null,lastCannon=null,lastBlade=null;
 const itemId=side=>model.getArm(partsStateV523,side?'arm2':'arm1');
 const typeOf=id=>id?(running&&upgradeRunV593.mode?upgradeRunV593.mode:ids[id]||null):null;
 const has=mode=>typeOf(itemId(0))===mode||typeOf(itemId(1))===mode;
 function inMode(mode,fn){const old=forcedMode;forcedMode=mode;try{return fn();}finally{forcedMode=old;}}
 function loadExtra(mode){
  if(!extra[mode]||loading[mode])return;
  const d=extra[mode],part={width:d.width,height:d.height,pivot:d.pivot,native_angle:d.native_angle};
  armItemsArtV589.items[mode]={world_scale:d.world_scale,left:part,right:part};
  loading[mode]='loading';const image=new Image();
  image.onload=()=>{armItemsV589.images[mode]={left:image,right:image};loading[mode]='ready';art.generation++;bioRefreshV625();renderEvolvePartsV523(true);};
  image.onerror=()=>{loading[mode]='error';art.generation++;renderEvolvePartsV523(true);};
  const path=ASSET_SRC[d.asset];if(path)image.src=path;else image.onerror();
 }
 art.visualMode=id=>{const mode=visuals[id]||null;if(extra[mode])loadExtra(mode);return mode;};
 art.status=id=>loading[visuals[id]]||null;
 window.__EVOLVE_DUAL_ARM_ART_V631__=art;

 // A mixed pair must let the old projectile path see a cannon while the old
 // blade hit path sees a blade; the temporary context is always restored.
 armItemModeV589=function(){return forcedMode||(has('cannon')?'cannon':has('blades')?'blades':'bare');};
 armCannonVolleyV589=function(a,target){
  const side=model.attackSide(partsStateV523,'cannon',typeOf,lastCannon);
  if(side===null)return a; // Defensive: caller normally checks mode first.
  lastCannon=side;armItemsV589.side=side;armItemsV589.volleys++;
  playerMotionV586.casts++;playerMotionV586[side?'right':'left']++;player.look=a;
  const p=armItemWorldPointV589(side,a);armItemsV589.aim=Math.atan2(target.y-p.y,target.x-p.x);
  recordWeaponAttackV590(armItemsV589.aim);return armItemsV589.aim;
 };
 const originalSlash=armSlashV589;
 armSlashV589=function(manual=false){
  const side=model.attackSide(partsStateV523,'blades',typeOf,lastBlade);if(side===null)return false;
  const old=playerMotionV586.side;playerMotionV586.side=side;
  const result=inMode('blades',()=>originalSlash(manual));
  if(result)lastBlade=side;else playerMotionV586.side=old;
  return result;
 };
 const originalSlashStep=armSlashStepV589;
 armSlashStepV589=function(...args){return inMode('blades',()=>originalSlashStep(...args));};
 playerStabV586=function(manual=false){return has('blades')?armSlashV589(manual):has('cannon')?false:armBareAttackV589(manual);};
 const originalPool=upgradePoolV593;
 upgradePoolV593=function(){
  if(!has('cannon')||!has('blades'))return originalPool();
  const gun=inMode('cannon',()=>originalPool()),blade=inMode('blades',()=>originalPool()),seen=new Set();
  return gun.concat(blade).filter(card=>{if(seen.has(card.id))return false;seen.add(card.id);return true;});
 };

 // The added art remains the original catalog image and is loaded only if
 // equipped or selected. Use the same pivot transform as existing weapons.
 const originalSprite=armItemSpriteV589;
 armItemSpriteV589=function(g,mode,side,p,angle,scale=1,alpha=1,facing=1){
  if(!extra[mode])return originalSprite(g,mode,side,p,angle,scale,alpha,facing);
  loadExtra(mode);const spec=armItemsArtV589.items[mode],part=spec[side?'right':'left'],image=armItemsV589.images[mode]?.[side?'right':'left'];
  if(!image)return;const size=spec.world_scale*scale*(bioV625.ready?bioWeaponVisualScaleV625:1);
  g.save();g.translate(p.x,p.y);g.rotate(angle);g.scale(1,(side?-1:1)*facing);g.rotate(-part.native_angle);g.globalAlpha*=alpha;
  g.drawImage(image,-part.pivot[0]*size,-part.pivot[1]*size,part.width*size,part.height*size);g.restore();
 };
 function displayMode(id){
  if(!id)return null;
  if(running&&upgradeRunV593.mode)return upgradeRunV593.mode==='bare'?null:upgradeRunV593.mode;
  return art.visualMode(id);
 }
 function drawSide(side,alpha=1){
  const id=itemId(side),type=typeOf(id),mode=displayMode(id);if(!mode||!type)return;
  if(type==='cannon'){inMode('cannon',()=>bioArmV625(side,alpha));return;}
  if(type!=='blades')return;
  const p=armItemWorldPointV589(side),angle=inMode('blades',()=>armItemAngleV589(side,playerBodyAngleV590()));
  armItemSpriteV589(ctx,mode,side,p,angle,(1+upgradeRunV593.bladeRange)*playerWorldScaleV603(),alpha,playerMotionV586.facing);
 }
 function drawBladeEffect(alpha=1){
  const attack=playerMotionV586.attack;
  if(attack?.kind!=='blades'||attack.age<.09||attack.age>=.34)return;
  const previous=armSlashAngleV589(attack,Math.max(.09,attack.age-.065)),current=armSlashAngleV589(attack),radius=armSlashReachV589()-10;
  ctx.save();ctx.translate(player.x,player.y);ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){ctx.globalAlpha=(.26-i*.06)*alpha;ctx.strokeStyle=i===0?'#f2f3ec':'#9cc5d2';ctx.lineWidth=i===0?3.2:1.2;ctx.beginPath();ctx.arc(0,0,radius-i*5,previous,current,attack.side===0);ctx.stroke();}
  ctx.restore();
 }
 window.__EVOLVE_DUAL_ARM_DRAW_V631__={side:drawSide,effect:drawBladeEffect};
 // If the newer character art is unavailable, retain the fallback renderer
 // while preventing it from creating a weapon on an empty side.
 drawArmItemsV589=function(a,alpha){
  drawBladeEffect(alpha);const layers=model.layers(playerMotionV586.facing,partsStateV523);
  for(const entry of [layers.behind,layers.front])if(entry)drawSide(entry.side,alpha);
 };
 const prior=window.__EVOLVE_DUAL_ARM_V631__;
 if(prior){const snapshot=prior.snapshot;prior.snapshot=()=>({...snapshot(),gameRendererConnected:true,combatTypes:[typeOf(itemId(0)),typeOf(itemId(1))],newArtGenerated:false});}
 if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_DUAL_ARM_DRAW_V631__.test={typeOf,has,displayMode,inMode};
 // In case an extra item was already equipped before this bridge initialized.
 bioRefreshV625();renderEvolvePartsV523(true);
})();
