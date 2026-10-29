// Red bio-core visual replacement. Gameplay, saves and equipment ownership stay in the existing engine.
const bioArtV625=__BIO_CORE_ART_V625__;
const bioV625={ready:false,images:{},surface:null,previews:{},renders:0,tailVisible:false,mode:'bare'};
// Enlarge only the visible weapons on this character; combat ranges and saves are unchanged.
const bioWeaponVisualScaleV625=1.5,bioWeaponPreviewAngleV625=-.08;
const bioLegacyArmSpriteV625=armItemSpriteV589;
armItemSpriteV589=function(g,mode,side,p,angle,scale=1,alpha=1,facing=1){
 return bioLegacyArmSpriteV625(g,mode,side,p,angle,scale*(bioV625.ready?bioWeaponVisualScaleV625:1),alpha,facing);
};
// Raise the idle blades without changing their actual attack arcs.
const bioLegacyBladeRestAngleV625=armBladeRestAngleV602;
armBladeRestAngleV602=function(side,bodyAngle){
 const restDirection=bioV625.ready?(playerMotionV586.facing<0?Math.PI:0):bodyAngle;
 const angle=bioLegacyBladeRestAngleV625(side,restDirection);
 return bioV625.ready?angle-.40*(playerMotionV586.facing||1):angle;
};
function bioImageV625(path){
 return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('바이오 코어 이미지를 불러오지 못했습니다: '+path));img.src=path;});
}
// Keep the approved artwork upright; vertical movement retains the last left/right facing.
// Only the BIO CORE visual pose is changed: movement, attack aim and saves stay intact.
function bioHorizontalPoseV630(){const pose=mutantPoseV599();return {...pose,rotation:0,localRotation:0};}
function bioHorizontalMotionV630(){const motion=mutantBodyMotionV599();return {...motion,angle:0};}
function bioBodyPointV625(p,motion=bioHorizontalMotionV630()){
 const a=bioArtV625.anchor,x=p[0]-a[0],y=p[1]-a[1],c=Math.cos(motion.angle),s=Math.sin(motion.angle);
 return [a[0]+motion.dx+x*c-y*s,a[1]+motion.dy+x*s+y*c];
}
function bioWorldPointV625(p,pose=bioHorizontalPoseV630(),motion=bioHorizontalMotionV630()){
 const q=bioBodyPointV625(p,motion),scale=mutantBaseScaleV599*playerWorldScaleV603();
 const x=(q[0]-bioArtV625.anchor[0])*scale*pose.facing,y=(q[1]-bioArtV625.anchor[1])*scale,c=Math.cos(pose.rotation),s=Math.sin(pose.rotation);
 return {x:player.x+x*c-y*s,y:player.y+x*s+y*c};
}
function bioFrameV625(g,image,frame){
 const a=bioArtV625,i=((frame%a.frames)+a.frames)%a.frames;
 g.drawImage(image,(i%a.columns)*a.cellWidth,Math.floor(i/a.columns)*a.cellHeight,a.cellWidth,a.cellHeight,0,0,a.width,a.height);
}
// Enlarge the existing atlas's four leg motions in memory. No asset bytes are
// changed and preparation is spread across short tasks after movement starts.
const bioGaitLegsV630=[
 {k:[111.5,350],f:[105.5,444.5],kr:[40,45],fr:[38,36],phase:0},
 {k:[281,387],f:[289.5,412.5],kr:[23,24],fr:[21,20],phase:.5},
 {k:[510,382],f:[522,481],kr:[44,45],fr:[42,35],phase:.5},
 {k:[600,345],f:[607.5,414.5],kr:[30,34],fr:[30,28],phase:0}
];
function bioGaitEaseV630(t){return t*t*(3-2*t);}
function bioGaitInfluenceV630(x,y,c,r){
 const d=Math.hypot((x-c[0])/r[0],(y-c[1])/r[1]);
 if(d<=.42)return 1;if(d>=1.55)return 0;
 return 1-bioGaitEaseV630((d-.42)/1.13);
}
function bioGaitWeightsV630(w,h){
 return {fields:bioGaitLegsV630.map(()=>new Float32Array(w*h)),indices:null};
}
function bioGaitFillLegV630(w,h,weights,i,startY){
 const fields=weights.fields,leg=bioGaitLegsV630[i];
  // Work only near a knee or foot; the rest of the approved image stays exact.
  const x0=Math.max(0,Math.floor(Math.min(leg.f[0]-leg.fr[0]*1.55,leg.k[0]-leg.kr[0]*1.55)*w/724));
  const x1=Math.min(w,Math.ceil(Math.max(leg.f[0]+leg.fr[0]*1.55,leg.k[0]+leg.kr[0]*1.55)*w/724));
  const y0=Math.max(0,Math.floor(Math.min(leg.f[1]-leg.fr[1]*1.55,leg.k[1]-leg.kr[1]*1.55)*h/543));
  const y1=Math.min(h,Math.ceil(Math.max(leg.f[1]+leg.fr[1]*1.55,leg.k[1]+leg.kr[1]*1.55)*h/543));
  const from=startY===null?y0:startY,to=Math.min(y1,from+6);
  for(let y=from;y<to;y++)for(let x=x0;x<x1;x++){
   const sx=(x+.5)*724/w,sy=(y+.5)*543/h;
   const foot=bioGaitInfluenceV630(sx,sy,leg.f,leg.fr),knee=bioGaitInfluenceV630(sx,sy,leg.k,leg.kr);
   fields[i][y*w+x]=Math.min(1,foot+knee*.48);
  }
  return to>=y1?null:to;
}
function bioGaitOffsetV630(t,phase,w,h){
 const p=(t+phase)%1,stance=.64;
 let dx,lift=0;
 if(p<stance)dx=4.5*(1-2*bioGaitEaseV630(p/stance));
 else{const s=(p-stance)/(1-stance);dx=4.5*(-1+2*bioGaitEaseV630(s));lift=7.5*Math.sin(Math.PI*s);}
 return [dx*2.2*w/724,-lift*2.2*h/543];
}
function bioGaitWarpV630(src,dst,w,h,weights,t,start,end){
 const offsets=bioGaitLegsV630.map(leg=>bioGaitOffsetV630(t,leg.phase,w,h));
 const fields=weights.fields;if(start===0)dst.set(src);
 for(let pos=start;pos<end;pos++){
  const i=weights.indices[pos];
  const x=i%w,y=Math.floor(i/w),o=i*4;let dx=0,dy=0;
  for(let n=0;n<fields.length;n++){const f=fields[n][i];dx+=f*offsets[n][0];dy+=f*offsets[n][1];}
  if(Math.abs(dx)+Math.abs(dy)<.01)continue;
  const sx=Math.max(0,Math.min(w-1,x-dx)),sy=Math.max(0,Math.min(h-1,y-dy));
  const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),u=sx-x0,v=sy-y0;
  const aa=(y0*w+x0)*4,bb=(y0*w+x1)*4,cc=(y1*w+x0)*4,dd=(y1*w+x1)*4;
  for(let c=0;c<4;c++)dst[o+c]=(1-v)*((1-u)*src[aa+c]+u*src[bb+c])+v*((1-u)*src[cc+c]+u*src[dd+c]);
 }
}
function bioPrepareGaitV630(){
 if(bioV625.gaitStarted)return;bioV625.gaitStarted=true;
 try{
  const a=bioArtV625,w=a.cellWidth,h=a.cellHeight,count=18,columns=a.columns;
  const sheet=document.createElement('canvas');sheet.width=w*columns;sheet.height=h*Math.ceil(count/columns);
  const out=sheet.getContext('2d'),cell=document.createElement('canvas');cell.width=w;cell.height=h;
  const g=cell.getContext('2d',{willReadFrequently:true}),weights=bioGaitWeightsV630(w,h);
  let leg=0,legY=null,scan=0,index=0,pixel=0,input=null,output=null;const active=[];
  const next=()=>{try{
   if(leg<bioGaitLegsV630.length){legY=bioGaitFillLegV630(w,h,weights,leg,legY);if(legY===null)leg++;}
   else if(scan<w*h){
    const end=Math.min(w*h,scan+4096),f=weights.fields;
    for(;scan<end;scan++)if(f[0][scan]>.001||f[1][scan]>.001||f[2][scan]>.001||f[3][scan]>.001)active.push(scan);
   }else{
    if(!weights.indices)weights.indices=Uint32Array.from(active);
    if(!input){
     const source=Math.floor(index*a.frames/count);
     g.clearRect(0,0,w,h);g.drawImage(bioV625.images.walkAtlas,(source%columns)*w,Math.floor(source/columns)*h,w,h,0,0,w,h);
     input=g.getImageData(0,0,w,h);output=g.createImageData(w,h);pixel=0;
    }
    const end=Math.min(weights.indices.length,pixel+512);
    bioGaitWarpV630(input.data,output.data,w,h,weights,index/count,pixel,end);pixel=end;
    if(pixel>=weights.indices.length){out.putImageData(output,(index%columns)*w,Math.floor(index/columns)*h);input=output=null;index++;}
   }
   if(index<count)setTimeout(next,0);else{bioV625.gaitCanvas=sheet;bioV625.gaitFrames=count;}
  }catch(error){bioV625.gaitError=String(error&&error.message||error);}};
  setTimeout(next,0);
 }catch(error){bioV625.gaitError=String(error&&error.message||error);}
}
function bioAtlasPoseV625(g,m){
 // A longer stride cycle makes the existing four-leg sequence easy to read
 // without speeding up the animation or changing the player's actual movement.
 const a=bioArtV625,gaitDistance=a.gaitDistance*2.5;
 const idle=Math.floor((m.clock%a.cycleSeconds)/a.cycleSeconds*a.frames),walk=Math.floor((m.distance%gaitDistance)/gaitDistance*a.frames),blend=clamp(m.blend||0,0,1);
 if(blend>.05&&!bioV625.gaitStarted)bioPrepareGaitV630();
 const walkImage=bioV625.gaitCanvas||bioV625.images.walkAtlas,walkFrame=bioV625.gaitCanvas?Math.floor(walk*bioV625.gaitFrames/a.frames):walk;
 if(blend<.01){bioFrameV625(g,bioV625.images.idleAtlas,idle);return;}
 if(blend>.99){bioFrameV625(g,walkImage,walkFrame);return;}
 g.save();g.globalAlpha*=1-blend;bioFrameV625(g,bioV625.images.idleAtlas,idle);g.restore();
 g.save();g.globalAlpha*=blend;bioFrameV625(g,walkImage,walkFrame);g.restore();
}
// Two soft beats enlarge only the core area using the existing atlas pixels.
// A feathered mask keeps the feet and the core's outer edge from jumping.
function bioHeartBeatV630(clock){
 const cycle=bioArtV625.cycleSeconds||1.44,phase=((clock%cycle)+cycle)%cycle/cycle;
 const beat=(center,width)=>{const d=Math.abs(phase-center),near=Math.min(d,1-d);return Math.exp(-Math.pow(near/width,2));};
 return Math.min(1,beat(.12,.075)+.55*beat(.29,.065));
}
function bioHeartLayerV630(){
 if(bioV625.heartLayer)return bioV625.heartLayer;
 const a=bioArtV625,w=a.cellWidth,h=a.cellHeight,canvas=document.createElement('canvas'),mask=document.createElement('canvas');
 canvas.width=mask.width=w;canvas.height=mask.height=h;
 const g=canvas.getContext('2d'),mg=mask.getContext('2d'),x=a.shell[0]*w/a.width,y=a.shell[1]*h/a.height,r=w*.36;
 mg.translate(x,y);mg.scale(1,.78);
 const fade=mg.createRadialGradient(0,0,r*.12,0,0,r);
 fade.addColorStop(0,'rgba(255,255,255,1)');fade.addColorStop(.7,'rgba(255,255,255,.98)');fade.addColorStop(1,'rgba(255,255,255,0)');
 mg.fillStyle=fade;mg.fillRect(-r,-r,r*2,r*2);
 return bioV625.heartLayer={canvas,mask,g,w,h};
}
function bioDrawHeartV630(g,m){
 const pulse=bioHeartBeatV630(m.clock||0);if(pulse<.01||bioV625.heartError)return;
 try{
  const a=bioArtV625,layer=bioHeartLayerV630(),p=layer.g,zoom=1+.085*pulse;
  p.setTransform(1,0,0,1,0,0);p.globalCompositeOperation='source-over';p.clearRect(0,0,layer.w,layer.h);
  p.setTransform(layer.w/a.width*zoom,0,0,layer.h/a.height*zoom,
   layer.w/a.width*a.shell[0]*(1-zoom),layer.h/a.height*a.shell[1]*(1-zoom));
  bioAtlasPoseV625(p,m);
  p.setTransform(1,0,0,1,0,0);p.globalCompositeOperation='destination-in';p.drawImage(layer.mask,0,0);p.globalCompositeOperation='source-over';
  g.drawImage(layer.canvas,0,0,a.width,a.height);
  g.save();g.globalCompositeOperation='screen';g.globalAlpha*=.06*pulse;g.drawImage(layer.canvas,0,0,a.width,a.height);g.restore();
 }catch(error){bioV625.heartError=String(error&&error.message||error);}
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
  // The equipped tail sways slowly between attacks; its attack aim is untouched.
  const clock=mutantV599.clock,sway=Math.sin(clock*1.45)*.15+Math.sin(clock*2.9+.4)*.018;
  g.rotate(pose.rotation+sway*pose.facing);g.scale(pose.facing,1);
 }
 g.scale(scale,scale);g.drawImage(bioV625.images.tail,-1430,-650);g.restore();
}
function bioArmV625(side,alpha){
 const p=armItemWorldPointV589(side),aim=armItemAngleV589(side,playerBodyAngleV590());
 // When firing, retain the exact target angle; only the relaxed pose is raised.
 const facing=playerMotionV586.facing||1,restDirection=facing<0?Math.PI:0;
 const angle=playerFacingStateV590.read().holdRemaining>1e-8?aim:restDirection-.08*facing;
 if(armItemsV589.side===side){const recoil=Math.max(0,player.armKick||0)*9;p.x-=Math.cos(angle)*recoil;p.y-=Math.sin(angle)*recoil;}
 armItemSpriteV589(ctx,'cannon',side,p,angle,playerWorldScaleV603(),alpha,playerMotionV586.facing);
}
function bioDrawV625(shadowOnly=false){
 if(!bioV625.ready){
  if(shadowOnly)return bioLegacyDrawV625(true);
  ctx.save();ctx.filter=ambientProfileV627().filter;
  try{return bioLegacyDrawV625(false);}finally{ctx.restore();}
 }
 const pose=bioHorizontalPoseV630(),motion=bioHorizontalMotionV630(),m=mutantV599;playerMotionV586.facing=pose.facing;
 if(shadowOnly){ambientDrawShadowV627(pose,m);return;}
 drawPlayerGroundV165(46*playerWorldScaleV603(),playerBodyAngleV590());drawEvoDominanceAura(46*playerWorldScaleV603());
 const blink=(player.hurtBlink||0)>0&&Math.floor((.5-player.hurtBlink)/.0625)%2===0?.38:1,mode=armItemModeV589();bioV625.mode=mode;
 // Only the visible character and worn parts get the map light; attack VFX,
 // UI, source assets and the parts preview keep their existing appearance.
 ctx.save();ctx.filter=ambientProfileV627().filter;ctx.globalAlpha*=blink;bioTailV625(ctx,pose,motion);
 const layers=window.EVOLVE_DUAL_ARM_MODEL_V631.layers(pose.facing,partsStateV523),dual=window.__EVOLVE_DUAL_ARM_DRAW_V631__;
 if(armItemsV589.ready&&layers.behind)dual.side(layers.behind.side,1);
 const scale=mutantBaseScaleV599*playerWorldScaleV603(),a=bioArtV625.anchor;
 ctx.save();ctx.translate(player.x,player.y);ctx.rotate(pose.rotation);ctx.scale(pose.facing*scale,scale);
 ctx.translate(motion.dx,motion.dy);ctx.rotate(motion.angle);ctx.translate(-a[0],-a[1]);bioAtlasPoseV625(ctx,m);bioDrawHeartV630(ctx,m);ctx.restore();
 if(armItemsV589.ready&&layers.front)dual.side(layers.front.side,1);
 if(armItemsV589.ready)dual.effect(1);
 ctx.restore();
 if(frenzy>0)stamp('vfx/core_ring',player.x,player.y,64*playerWorldScaleV603(),t*.3,.25);
 if(player.inv>0||(player.shieldHP||0)>0){ctx.save();ctx.strokeStyle='#b4e9ff';ctx.globalAlpha=.56;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(player.x,player.y,22*playerWorldScaleV603(),0,TAU);ctx.stroke();ctx.restore();}
 drawOrganAttacksV598();bioV625.renders++;
}
function bioPreviewV625(mode='bare',size=1536){
 const a=bioArtV625,c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),unit=mutantBaseScaleV599;
 const fit=Math.min(size*.75/(a.width*unit),size*.75/(a.height*unit)),s=unit*fit,ox=(size-a.width*s)/2-size*.05,oy=(size-a.height*s)/2;
 if(mode==='cannon')armItemSpriteV589(g,mode,1,{x:ox+a.wrists[1][0]*s,y:oy+a.wrists[1][1]*s},bioWeaponPreviewAngleV625,fit);
 g.drawImage(bioV625.surface,ox,oy,a.width*s,a.height*s);
 if(mode==='cannon')armItemSpriteV589(g,mode,0,{x:ox+a.wrists[0][0]*s,y:oy+a.wrists[0][1]*s},bioWeaponPreviewAngleV625,fit);
 else if(mode==='blades')for(const side of [1,0])armItemSpriteV589(g,mode,side,{x:ox+a.wrists[side][0]*s,y:oy+a.wrists[side][1]*s},bioWeaponPreviewAngleV625,fit);
 return c;
}
function bioPreviewPointV625(size){
 const a=bioArtV625,u=mutantBaseScaleV599,fit=Math.min(size*.75/(a.width*u),size*.75/(a.height*u)),s=u*fit;
 return {x:(size-a.width*s)/2-size*.05+a.shell[0]*s,y:(size-a.height*s)/2+a.shell[1]*s,radius:110*u*fit};
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
