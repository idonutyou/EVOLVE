// Red bio-core visual replacement. Gameplay, saves and equipment ownership stay in the existing engine.
const bioArtV625=__BIO_CORE_ART_V625__;
const bioV625={ready:false,images:{},surface:null,previews:{},renders:0,tailVisible:false,mode:'bare'};
function bioImageV625(path){
 return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('바이오 코어 이미지를 불러오지 못했습니다: '+path));img.src=path;});
}
function bioBodyPointV625(p,motion=mutantBodyMotionV599()){
 const a=bioArtV625.anchor,x=p[0]-a[0],y=p[1]-a[1],c=Math.cos(motion.angle),s=Math.sin(motion.angle);
 return [a[0]+motion.dx+x*c-y*s,a[1]+motion.dy+x*s+y*c];
}
function bioWorldPointV625(p,pose=mutantPoseV599(),motion=mutantBodyMotionV599()){
 const q=bioBodyPointV625(p,motion),scale=mutantBaseScaleV599*playerWorldScaleV603();
 const x=(q[0]-bioArtV625.anchor[0])*scale*pose.facing,y=(q[1]-bioArtV625.anchor[1])*scale,c=Math.cos(pose.rotation),s=Math.sin(pose.rotation);
 return {x:player.x+x*c-y*s,y:player.y+x*s+y*c};
}
function bioFrameV625(g,image,frame){
 const a=bioArtV625,i=((frame%a.frames)+a.frames)%a.frames;
 g.drawImage(image,(i%a.columns)*a.cellWidth,Math.floor(i/a.columns)*a.cellHeight,a.cellWidth,a.cellHeight,0,0,a.width,a.height);
}
function bioAtlasPoseV625(g,m){
 const a=bioArtV625,idle=Math.floor((m.clock%a.cycleSeconds)/a.cycleSeconds*a.frames),walk=Math.floor((m.distance%a.gaitDistance)/a.gaitDistance*a.frames),blend=clamp(m.blend||0,0,1);
 if(blend<.01){bioFrameV625(g,bioV625.images.idleAtlas,idle);return;}
 if(blend>.99){bioFrameV625(g,bioV625.images.walkAtlas,walk);return;}
 g.save();g.globalAlpha*=1-blend;bioFrameV625(g,bioV625.images.idleAtlas,idle);g.restore();
 g.save();g.globalAlpha*=blend;bioFrameV625(g,bioV625.images.walkAtlas,walk);g.restore();
}
function bioTailV625(g,pose,motion){
 const level=Math.max(0,Number(state.tail)||0),whip=organRunV598.whips[organRunV598.whips.length-1];
 bioV625.tailVisible=!!(level||whip);if(!bioV625.tailVisible)return;
 const root=bioWorldPointV625(bioArtV625.tailRoot,pose,motion),radius=organSpecV598('tail').radius||30;
 const scale=.014*playerWorldScaleV603()*Math.min(2,Math.max(1,radius/30));
 g.save();g.translate(root.x,root.y);
 if(whip){
  const p=clamp((whip.age-.055)/.285,0,1),angle=whip.aim-whip.s.arc/2+p*whip.s.arc;
  g.rotate(angle-Math.PI);
 }else{
  g.rotate(pose.rotation+Math.sin(mutantV599.clock*2.1)*.045);g.scale(pose.facing,1);
 }
 g.scale(scale,scale);g.drawImage(bioV625.images.tail,-1430,-650);g.restore();
}
function bioArmV625(side,alpha){
 const p=armItemWorldPointV589(side),angle=armItemAngleV589(side,playerBodyAngleV590());
 if(armItemsV589.side===side){const recoil=Math.max(0,player.armKick||0)*9;p.x-=Math.cos(angle)*recoil;p.y-=Math.sin(angle)*recoil;}
 armItemSpriteV589(ctx,'cannon',side,p,angle,playerWorldScaleV603(),alpha,playerMotionV586.facing);
}
function bioDrawV625(shadowOnly=false){
 if(!bioV625.ready)return bioLegacyDrawV625(shadowOnly);
 const pose=mutantPoseV599(),motion=mutantBodyMotionV599(),m=mutantV599;playerMotionV586.facing=pose.facing;
 if(shadowOnly){ctx.save();ctx.globalAlpha=.26;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(player.x,player.y+7*playerWorldScaleV603(),20*playerWorldScaleV603(),8*playerWorldScaleV603(),pose.rotation,0,TAU);ctx.fill();ctx.restore();return;}
 drawPlayerGroundV165(46*playerWorldScaleV603(),playerBodyAngleV590());drawEvoDominanceAura(46*playerWorldScaleV603());
 const blink=(player.hurtBlink||0)>0&&Math.floor((.5-player.hurtBlink)/.0625)%2===0?.38:1,mode=armItemModeV589();bioV625.mode=mode;
 ctx.save();ctx.globalAlpha*=blink;bioTailV625(ctx,pose,motion);
 if(mode==='cannon'&&armItemsV589.ready)bioArmV625(1,1);
 const scale=mutantBaseScaleV599*playerWorldScaleV603(),a=bioArtV625.anchor;
 ctx.save();ctx.translate(player.x,player.y);ctx.rotate(pose.rotation);ctx.scale(pose.facing*scale,scale);
 ctx.translate(motion.dx,motion.dy);ctx.rotate(motion.angle);ctx.translate(-a[0],-a[1]);bioAtlasPoseV625(ctx,m);ctx.restore();
 if(mode==='cannon'&&armItemsV589.ready)bioArmV625(0,1);
 else if(mode!=='bare'&&armItemsV589.ready)drawArmItemsV589(playerBodyAngleV590(),1);
 ctx.restore();
 if(frenzy>0)stamp('vfx/core_ring',player.x,player.y,64*playerWorldScaleV603(),t*.3,.25);
 if(player.inv>0||(player.shieldHP||0)>0){ctx.save();ctx.strokeStyle='#b4e9ff';ctx.globalAlpha=.56;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(player.x,player.y,22*playerWorldScaleV603(),0,TAU);ctx.stroke();ctx.restore();}
 drawOrganAttacksV598();bioV625.renders++;
}
function bioPreviewV625(mode='bare',size=1536){
 const a=bioArtV625,c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),unit=mutantBaseScaleV599;
 const fit=Math.min(size*.75/(a.width*unit),size*.75/(a.height*unit)),s=unit*fit,ox=(size-a.width*s)/2,oy=(size-a.height*s)/2;
 if(mode==='cannon')armItemSpriteV589(g,mode,1,{x:ox+a.wrists[1][0]*s,y:oy+a.wrists[1][1]*s},a.nativeFacing,fit);
 g.drawImage(bioV625.surface,ox,oy,a.width*s,a.height*s);
 if(mode==='cannon')armItemSpriteV589(g,mode,0,{x:ox+a.wrists[0][0]*s,y:oy+a.wrists[0][1]*s},a.nativeFacing,fit);
 else if(mode==='blades')for(const side of [1,0])armItemSpriteV589(g,mode,side,{x:ox+a.wrists[side][0]*s,y:oy+a.wrists[side][1]*s},a.nativeFacing,fit);
 return c;
}
function bioPreviewPointV625(size){
 const a=bioArtV625,u=mutantBaseScaleV599,fit=Math.min(size*.75/(a.width*u),size*.75/(a.height*u)),s=u*fit;
 return {x:(size-a.width*s)/2+a.shell[0]*s,y:(size-a.height*s)/2+a.shell[1]*s,radius:110*u*fit};
}
function bioRefreshV625(){
 if(!bioV625.ready)return;
 const mode=armItemModeV589(),src=bioV625.previews[mode]||bioV625.previews.bare;
 ASSET_SRC['player_static/base_specimen']=bioV625.previews.bare;SPRITE_SRC.player=bioV625.previews.bare;
 const image=$('partsSpecimenImgV523');if(image&&image.src!==src){image.src=src;image.removeAttribute('data-origin-v522');delete image.dataset.origin;}
}
const bioLegacyDrawV625=drawPlayer;drawPlayer=bioDrawV625;
const bioLegacyRefreshV625=mutantRefreshV599;mutantRefreshV599=function(...args){const out=bioLegacyRefreshV625(...args);bioRefreshV625();return out;};
const bioLegacyPreviewV625=mutantPreviewV599;mutantPreviewV599=function(mode,size){return bioV625.ready?bioPreviewV625(mode,size):bioLegacyPreviewV625(mode,size);};
// Preserve the original attachment points until the new art is ready, and on load failure.
const bioLegacyArmPointV625=armItemWorldPointV589;
armItemWorldPointV589=function(side){return bioV625.ready?bioWorldPointV625(bioArtV625.wrists[side]):bioLegacyArmPointV625(side);};
const bioLegacyOrganPointV625=organBodyPointV598;
organBodyPointV598=function(kind){return bioV625.ready?bioWorldPointV625(kind==='tail'?bioArtV625.tailRoot:bioArtV625.shell):bioLegacyOrganPointV625(kind);};
const bioReadyV625=Promise.all([mutantReadyV599,armItemsReadyV589,...['original','matte','tail','gun','walkAtlas','idleAtlas'].map(k=>bioImageV625(bioArtV625[k].path))]).then(values=>{
 const names=['original','matte','tail','gun','walkAtlas','idleAtlas'];names.forEach((name,i)=>bioV625.images[name]=values[i+2]);
 const a=bioArtV625,c=document.createElement('canvas');c.width=a.width;c.height=a.height;const g=c.getContext('2d');
 g.drawImage(bioV625.images.original,0,0);g.globalCompositeOperation='destination-in';g.drawImage(bioV625.images.matte,0,0);g.globalCompositeOperation='source-over';bioV625.surface=c;
 const gun=armItemsArtV589.items.cannon,part={path:a.gun.path,width:1774,height:887,pivot:[300,445],tip:[1600,445],length:1300,native_angle:0};
 gun.world_scale=.015;gun.left={...gun.left,...part};gun.right={...gun.right,...part};armItemsV589.images.cannon={left:bioV625.images.gun,right:bioV625.images.gun};
 bioV625.ready=true;
 for(const mode of ['bare','cannon','blades']){const p=bioPreviewV625(mode);bioV625.previews[mode]=p.toDataURL('image/png');p.width=p.height=1;if(mode!=='bare')armItemsV589.previews[mode]=bioV625.previews[mode];}
 bioRefreshV625();refreshEvolveHomeV522();return true;
}).catch(error=>{
 // Optional character art must never leave the whole game stuck at its loading screen.
 // Previous renderer, attachment points, saving and shop remain available.
 bioV625.ready=false;bioV625.loadError=String(error&&error.message||error);
 return false;
});
window.__EVOLVE_BIOCORE_V625__={ready:bioReadyV625,read:()=>({version:625,ready:bioV625.ready,character:'red-flesh-core',reference:bioArtV625.original.sha256,legs:4,tailVisible:bioV625.tailVisible,mode:bioV625.mode,renders:bioV625.renders,frames:bioArtV625.frames,loadError:bioV625.loadError||null,saveKeysChanged:false,physical_Galaxy_S23_plus_tested:false})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_BIOCORE_V625__.test={preview:bioPreviewV625,worldPoint:bioWorldPointV625,art:()=>bioArtV625,draw:bioDrawV625};
