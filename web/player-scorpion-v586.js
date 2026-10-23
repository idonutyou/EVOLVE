// WEB-19: painted default organism and contact-only, alternating upper-limb stabs.
// Equipment persistence and the existing armed lightning implementation stay intact.
const playerArtV586=JSON.parse('__PLAYER_SCORPION_ART__');
const playerAtlasV586=new Image(),playerFramesV586=[];
const playerMotionV586={clock:0,gait:0,x:0,y:0,moving:false,attack:null,cooldown:.18,side:0,casts:0,hits:0,misses:0,left:0,right:0,deathAt:0,frameBuilds:0};
const playerReachV586=44;
function playerArmedV586(){const item=partsItemV523(partsStateV523.worn.arm);return !!item&&item.slot==='arm';}
function playerMotionResetV586(){Object.assign(playerMotionV586,{clock:0,gait:0,x:player.x,y:player.y,moving:false,attack:null,cooldown:.18,side:0,casts:0,hits:0,misses:0,left:0,right:0,deathAt:0});}
function playerTargetV586(e){return !!e&&!e.dead&&e.hp>0&&!e.arrivalInvuln&&!(e.arrivalTime>0);}
function playerInReachV586(e){return playerTargetV586(e)&&Math.hypot(e.x-player.x,e.y-player.y)<=playerReachV586+(e.r||12)&&!terrainHitV418(player.x,player.y,e.x,e.y,1);}
function playerNearestV586(){
 if(playerInReachV586(focusEnemy))return focusEnemy;
 let best=null,distance=Infinity;for(const e of enemies){if(!playerInReachV586(e))continue;const d=Math.hypot(e.x-player.x,e.y-player.y)-(e.r||12);if(d<distance){distance=d;best=e;}}return best;
}
function playerStabV586(manual=false){
 const m=playerMotionV586;if(!running||paused||choosing||rewardChoosing||ended||playerArmedV586()||m.attack||m.cooldown>0)return false;
 const target=playerNearestV586();if(!target&&!manual)return false;
 const a=target?Math.atan2(target.y-player.y,target.x-player.x):(player.look||0),side=m.side;
 m.side=1-side;m.attack={age:0,life:.34,a,side,target,hit:false};m.cooldown=Math.max(.38,.64*attackTempoMul()*(frenzy>0?.82:1));m.casts++;m[side?'right':'left']++;
 player.look=a;player.armKick=.18;return true;
}
function playerStabContactV586(attack){
 const e=attack.target;if(!playerInReachV586(e))return false;
 const dx=e.x-player.x,dy=e.y-player.y,along=dx*Math.cos(attack.a)+dy*Math.sin(attack.a),across=Math.abs(-dx*Math.sin(attack.a)+dy*Math.cos(attack.a));
 // A narrow forward capsule, tested again at impact. No ranged fallback or area hit.
 if(along<-(e.r||12)||along>playerReachV586+(e.r||12)||across>10+(e.r||12))return false;
 const damage=(22+Math.max(0,(state.arm||1)-1)*4.5)*coreDamageBoost();
 lightningDamageBaseV576(e,damage,'arm');return true;
}
function playerStepV586(dt){
 const m=playerMotionV586;m.clock+=dt;const distance=Math.hypot(player.x-m.x,player.y-m.y);m.moving=distance>.015&&distance<Math.max(32,(player.speed||132)*dt*5);
 if(m.moving)m.gait+=distance/9;m.x=player.x;m.y=player.y;m.cooldown=Math.max(0,m.cooldown-dt);
 if(m.attack){const a=m.attack;a.age+=dt;if(!a.hit&&a.age>=.12){a.hit=true;if(playerStabContactV586(a))m.hits++;else m.misses++;}if(a.age>=a.life)m.attack=null;}
}
function playerFrameV586(){
 const m=playerMotionV586;if(player.hp<=0){if(!m.deathAt)m.deathAt=performance.now();return performance.now()-m.deathAt<180?18:19;}
 if((player.hurtKick||0)>.02)return (player.hurtKick||0)>.16?16:17;
 let a=m.attack;
 if(playerArmedV586()){const cast=lightningV576.cast();if(cast)a={age:cast.age,side:cast.id%2,a:cast.a};}
 if(a){const pose=a.age<.075?0:a.age<.12?1:a.age<.20?2:3;return (a.side?12:8)+pose;}
 if(feedbackCfg().reducedMotion)return m.moving?4:0;
 return m.moving?4+Math.floor(m.gait)%4:Math.floor(m.clock*3)%4;
}
const playerReadyV586=new Promise((resolve,reject)=>{
 playerAtlasV586.onerror=()=>reject(new Error('기본 캐릭터 모션 이미지를 불러오지 못했습니다.'));
 playerAtlasV586.onload=()=>{
  try{
   for(const frame of playerArtV586.frames){
    const c=document.createElement('canvas');c.width=c.height=playerArtV586.surface;const g=c.getContext('2d'),r=frame.rect;
    const x=Math.round(c.width/2-frame.anchor[0]),y=Math.round(c.height/2-frame.anchor[1]);
    // Extract each painted silhouette once, without neighbouring cells or changing PNG bytes.
    g.save();g.beginPath();for(const [yy,xx,width] of frame.clip)g.rect(x+xx,y+yy,width,1);g.clip();
    g.drawImage(playerAtlasV586,r[0],r[1],r[2],r[3],x,y,r[2],r[3]);g.restore();
    c.complete=true;c.naturalWidth=c.width;c.naturalHeight=c.height;c._actor=true;c._spriteCrop=[0,0,c.width,c.height];c._sourceReleasedV425=true;
    actorMipCacheV424.set(c,new Map([[384,{source:c,w:c.width,h:c.height,bucket:384}]]));
    actorMipV424(c,playerArtV586.displaySize);shadowMaskV421(c);playerFramesV586.push(c);playerMotionV586.frameBuilds++;
   }
   const preview=playerFramesV586[0].toDataURL('image/png');
   ASSET_SRC['player_static/base_specimen']=preview;SPRITE_SRC.player=preview;
   for(const id of ['heroSpecimenImg','partsSpecimenImgV523']){const image=$(id);if(image){image.src=preview;image.removeAttribute('data-origin-v522');delete image.dataset.origin;}}
   playerWeaponLabelsV586();resolve(true);
  }catch(error){reject(error);}
 };
 playerAtlasV586.src=playerArtV586.path;
});
const playerLegacyFireV586=firePlayer;firePlayer=function(dt){
 playerStepV586(dt);if(playerArmedV586())return playerLegacyFireV586(dt);
 bullets.length=0;playerStabV586(false);
};
const playerLegacyResetV586=reset;reset=function(...args){const result=playerLegacyResetV586(...args);playerMotionResetV586();playerWeaponLabelsV586();updateAbilityUI();return result;};
const playerLegacyHomeV586=returnToHome;returnToHome=function(...args){const result=playerLegacyHomeV586(...args);playerMotionResetV586();return result;};
const playerLegacyActiveV586=originActive;originActive=function(){if(playerArmedV586())return playerLegacyActiveV586();if(playerStabV586(true)){activeReady=activeMaxCd=.64;activeDuration=0;updateAbilityUI();}};
const playerLegacyAbilityV586=updateAbilityUI;updateAbilityUI=function(){
 if(playerArmedV586())return playerLegacyAbilityV586();
 activeMaxCd=.64;const b=$('ability'),name=$('abilityName');if(name)name.textContent='찌르기';if(!b)return;
 const glyph=b.querySelector('.abilityGlyph');if(glyph)glyph.textContent='↗';
 const cd=$('abilityCd');if(cd)cd.style.background=`conic-gradient(#071116e9 ${clamp(Math.max(activeReady,playerMotionV586.cooldown)/.64,0,1)*360}deg, transparent ${clamp(Math.max(activeReady,playerMotionV586.cooldown)/.64,0,1)*360}deg)`;
 b.classList.toggle('ready',activeReady<=0&&playerMotionV586.cooldown<=0);b.classList.remove('active');b.setAttribute('aria-label','찌르기');b.title='찌르기 · E';
};
function playerWeaponLabelsV586(){
 const armed=playerArmedV586();Object.assign(START_WEAPONS.arm,{name:homeTextV522(armed?'CHAIN LIGHTNING':'UPPER LIMB STAB',armed?'연쇄전격':'기본 찌르기'),glyph:armed?'ϟ':'↗',role:armed?'자동 연쇄전격 · E 강화전격':'상단 두 다리로 번갈아 근접 찌르기'});
 const upgrade=upgrades.find(u=>u.active&&u.kind==='arm');if(upgrade)upgrade.title=()=>playerArmedV586()?'연쇄전격 · 출력 강화':'찌르기 · 관통력 강화';
 const b=document.querySelector('[data-weapon="arm"]');if(b){const name=b.querySelector('b,h3,strong,.weaponName'),desc=b.querySelector('.weaponRole,p,.weaponDesc'),start=b.querySelector('.weaponStart');if(name)name.textContent=armed?'연쇄전격':'기본 찌르기';if(desc)desc.textContent=armed?'자동 연쇄전격 · 강화전격 E · 회피 SPACE':'상단 두 다리로 번갈아 찌릅니다 · 회피 SPACE';if(start)start.textContent='시작 · ★☆☆☆☆';}
}
const playerLegacyStartSelectV586=openStartWeaponSelect;openStartWeaponSelect=function(...args){playerWeaponLabelsV586();const result=playerLegacyStartSelectV586(...args);playerWeaponLabelsV586();return result;};
const playerLegacyStatV586=levelStatHtml;levelStatHtml=function(u){if(!playerArmedV586()&&u.active&&u.kind==='arm')return '<div class="statRow"><span>기본 찌르기</span><b>찌르기 피해량 증가</b></div><div class="statRow"><span>상단 두 다리</span><b>좌우 교대 · 근접 공격</b></div>';return playerLegacyStatV586(u);};
const playerLegacyPartEquipV586=equipPartV523;equipPartV523=function(...args){const was=playerArmedV586(),result=playerLegacyPartEquipV586(...args);if(was!==playerArmedV586()){lightningV576.reset();playerMotionV586.attack=null;playerMotionV586.cooldown=.18;}playerWeaponLabelsV586();return result;};
const playerLegacyHomeRefreshV586=refreshEvolveHomeV522;refreshEvolveHomeV522=function(...args){const result=playerLegacyHomeRefreshV586(...args);playerWeaponLabelsV586();return result;};
const playerLegacyDrawV586=drawPlayer;drawPlayer=function(shadowOnly=false){
 const frame=playerFramesV586[playerFrameV586()];if(!frame)return playerLegacyDrawV586(shadowOnly);
 const size=playerArtV586.displaySize,a=playerMotionV586.attack?.a??(playerArmedV586()?lightningV576.cast()?.a:null)??player.look??0,rotation=a-playerArtV586.nativeFacing;
 if(shadowOnly){castSpriteShadowV421(frame,player.x,player.y+14,size,rotation,1,1,.48);return;}
 drawPlayerGroundV165(46,a);drawEvoDominanceAura(46);
 const blink=(player.hurtBlink||0)>0&&Math.floor((.5-player.hurtBlink)/.0625)%2===0?.38:1;
 drawSpriteImage(frame,player.x,player.y,size,rotation,blink);
 if(frenzy>0)stamp('vfx/core_ring',player.x,player.y,64,t*.3,.25);
 if(player.inv>0||(player.shieldHP||0)>0){ctx.save();ctx.strokeStyle='#b4e9ff';ctx.globalAlpha=.56;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(player.x,player.y,22,0,TAU);ctx.stroke();ctx.restore();}
};
playerWeaponLabelsV586();
window.__EVOLVE_PLAYER_SCORPION_V586__={ready:playerReadyV586,read:()=>({character:'ivory-bio-scorpion',unarmed:!playerArmedV586(),weapon:playerArmedV586()?'equipped':'upper-limb-stab',frame:playerFrameV586(),cachedFrames:playerFramesV586.length,frameBuilds:playerMotionV586.frameBuilds,range:playerReachV586,casts:playerMotionV586.casts,hits:playerMotionV586.hits,misses:playerMotionV586.misses,left:playerMotionV586.left,right:playerMotionV586.right,moving:playerMotionV586.moving,attack:playerMotionV586.attack?{age:playerMotionV586.attack.age,side:playerMotionV586.attack.side,a:playerMotionV586.attack.a,hit:playerMotionV586.attack.hit}:null})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_PLAYER_SCORPION_V586__.test={frames:()=>playerFramesV586,step:dt=>firePlayer(dt),reset:playerMotionResetV586,stab:()=>playerStabV586(true),motion:()=>playerMotionV586,draw:shadow=>drawPlayer(!!shadow),damage:n=>playerDamage(n)};
