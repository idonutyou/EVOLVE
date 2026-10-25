// WEB-32: approved native artwork, planted quadruped gait and textured growing tail.
const mutantArtV599=__MUTANT_ART_V599__;
const mutantV599={ready:false,image:new Image(),parts:{},clock:0,distance:0,x:0,y:0,moving:false,speed:0,vx:0,vy:0,blend:0,feet:[],renders:0,builds:0,deadAt:0,lastFacing:1,lastRotation:0,tailLength:0,tailSegments:0,previews:{}};
const mutantBaseScaleV599=mutantArtV599.sourceScale*mutantArtV599.displaySize/mutantArtV599.surface;
let mutantScaleV599=mutantBaseScaleV599;
const mutantClampV599=(n,a,b)=>Math.max(a,Math.min(b,n));
const mutantMixV599=(a,b,t)=>a+(b-a)*t;
function mutantFacingV599(a,previous=1){
 const x=Math.cos(a),facing=x>.10?1:x<-.10?-1:previous,aim=clamp(Math.atan2(Math.sin(a),Math.abs(x)),-78*Math.PI/180,78*Math.PI/180);
 const localRotation=clamp(aim-mutantArtV599.nativeFacing,-80*Math.PI/180,80*Math.PI/180);
 return {facing,localRotation,rotation:facing*localRotation,headAngle:mutantArtV599.nativeFacing+localRotation};
}
playerFacingV587=mutantFacingV599;
function mutantPoseV599(){return mutantFacingV599(playerBodyAngleV590(),playerMotionV586.facing);}
function mutantSourceWorldV599(p,pose=mutantPoseV599()){
 const x=(p[0]-mutantArtV599.anchor[0])*mutantScaleV599*pose.facing,y=(p[1]-mutantArtV599.anchor[1])*mutantScaleV599,c=Math.cos(pose.rotation),s=Math.sin(pose.rotation);
 return {x:player.x+x*c-y*s,y:player.y+x*s+y*c};
}
function mutantWorldSourceV599(p,pose=mutantPoseV599()){
 const x=p.x-player.x,y=p.y-player.y,c=Math.cos(pose.rotation),s=Math.sin(pose.rotation);
 return [(x*c+y*s)*pose.facing/mutantScaleV599+mutantArtV599.anchor[0],(-x*s+y*c)/mutantScaleV599+mutantArtV599.anchor[1]];
}
function mutantBodyMotionV599(){
 const m=mutantV599,attack=playerMotionV586.attack,phase=attack?clamp(attack.age/(attack.life||.44),0,1):0;
 const lunge=attack?Math.sin(phase*Math.PI)*17:0,recoil=Math.min(.3,player.armKick||0)*36,flinch=Math.min(.4,player.hurtKick||0)*35;
 const dx=(lunge-recoil-flinch)*Math.cos(mutantArtV599.nativeFacing),dy=(lunge-recoil)*Math.sin(mutantArtV599.nativeFacing)+Math.sin(m.clock*2.25)*2+Math.sin(m.distance/28*TAU*2)*m.blend*3;
 let death=0;if(player.hp<=0){if(!m.deadAt)m.deadAt=performance.now();death=clamp((performance.now()-m.deadAt)/450,0,1);}else m.deadAt=0;
 return {dx,dy:dy+death*38,angle:(attack?(attack.side?1:-1)*Math.sin(phase*TAU)*.025:0)+death*.08,death};
}
function mutantBodyPointV599(p,motion=mutantBodyMotionV599()){
 const a=mutantArtV599.anchor,x=p[0]-a[0],y=p[1]-a[1],c=Math.cos(motion.angle),s=Math.sin(motion.angle);
 return [a[0]+motion.dx+x*c-y*s,a[1]+motion.dy+x*s+y*c];
}
function mutantBuildPartV599(spec){
 const [x,y,w,h]=spec.rect,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 g.save();g.beginPath();for(const [ry,rx,rw]of spec.runs)g.rect(rx,ry,rw,1);g.clip();g.drawImage(mutantV599.image,-x,-y);g.restore();mutantV599.builds++;return {canvas:c,spec};
}
function mutantDrawPartV599(g,part){const r=part.spec.rect;g.drawImage(part.canvas,r[0],r[1]);}
function mutantSyncSizeV599(){
 const scale=mutantBaseScaleV599*upgradeBodyScaleV593();if(Math.abs(scale-mutantScaleV599)<1e-8)return;
 mutantScaleV599=scale;if(mutantV599.ready)mutantInitFeetV599();
}
function mutantWeaponBodyV599(part){
 const c=document.createElement('canvas');c.width=part.canvas.width;c.height=part.canvas.height;const g=c.getContext('2d');g.drawImage(part.canvas,0,0);g.globalCompositeOperation='destination-out';
 for(const poly of [[[973,477],[1021,477],[1056,510],[1040,565],[1000,607],[982,608],[970,574],[983,531]],[[1160,440],[1205,448],[1221,480],[1215,530],[1175,583],[1159,581],[1174,529],[1184,499]]]){
  g.beginPath();poly.forEach(([x,y],i)=>i?g.lineTo(x-part.spec.rect[0],y-part.spec.rect[1]):g.moveTo(x-part.spec.rect[0],y-part.spec.rect[1]));g.closePath();g.fill();
 }mutantV599.builds++;return {canvas:c,spec:part.spec};
}
function mutantInitFeetV599(){
 const m=mutantV599,pose=mutantPoseV599();m.x=player.x;m.y=player.y;m.distance=0;m.speed=0;m.blend=0;m.moving=false;m.lastFacing=pose.facing;m.lastRotation=pose.rotation;
 m.feet=mutantArtV599.legs.map(leg=>{const p=mutantSourceWorldV599(leg.ankle,pose);return {mode:'idle',world:{...p},ground:{...p},anchor:{...p},from:{...p},to:{...p},lift:0,roll:0,stanceError:0};});
}
function mutantLandingV599(leg,pose,predict=0){
 const m=mutantV599,p=mutantSourceWorldV599(leg.ankle,pose),speed=Math.hypot(m.vx,m.vy)||1;
 const lead=leg.lead*mutantScaleV599*m.blend;
 return {x:p.x+m.vx/speed*lead+m.vx*predict,y:p.y+m.vy/speed*lead+m.vy*predict};
}
function mutantStepV599(dt){
 const m=mutantV599;if(!m.ready||!(dt>0))return;
 mutantSyncSizeV599();
 m.clock+=dt;const dx=player.x-m.x,dy=player.y-m.y,d=Math.hypot(dx,dy),pose=mutantPoseV599();
 if(!m.feet.length||d>Math.max(38,(player.speed||132)*dt*5)||pose.facing!==m.lastFacing||Math.abs(pose.rotation-m.lastRotation)>1.2){mutantInitFeetV599();return;}
 m.moving=d>.008;m.speed=mutantMixV599(m.speed,d/dt,1-Math.exp(-dt*12));m.blend=mutantMixV599(m.blend,m.moving?1:0,1-Math.exp(-dt*12));
 if(m.moving){m.distance+=d;m.vx=dx/dt;m.vy=dy/dt;}
 // Predict one half-step from the current displacement. Smoothed speed starts
 // near zero; using it here sent the first landing 40+ world pixels ahead.
 const period=28/Math.max(20,d/dt);
 mutantArtV599.legs.forEach((leg,i)=>{
  const f=m.feet[i],q=(m.distance/28+leg.phase)%1;
  if(!m.moving){
   const p=mutantSourceWorldV599(leg.ankle,pose),k=1-Math.exp(-dt*13);f.world.x=mutantMixV599(f.world.x,p.x,k);f.world.y=mutantMixV599(f.world.y,p.y,k);f.ground={...f.world};f.anchor={...f.world};f.mode='idle';f.lift=0;f.roll=0;return;
  }
  if(q<.5){
   if(f.mode!=='stance'){const p=f.mode==='swing'?{...f.to}:mutantLandingV599(leg,pose);f.anchor=p;f.mode='stance';}
   f.world={...f.anchor};f.ground={...f.anchor};f.lift=0;f.roll=0;
  }else{
   if(f.mode!=='swing'){f.from={...f.world};f.to=mutantLandingV599(leg,pose,period*.48);f.mode='swing';}
   const u=(q-.5)*2,e=u*u*(3-2*u);f.ground={x:mutantMixV599(f.from.x,f.to.x,e),y:mutantMixV599(f.from.y,f.to.y,e)};
   f.lift=Math.sin(Math.PI*u)*(leg.far?1.55:2.25)*m.blend;f.roll=Math.sin(Math.PI*u)*.14;f.world={x:f.ground.x,y:f.ground.y-f.lift};
  }
 });
 m.x=player.x;m.y=player.y;m.lastFacing=pose.facing;m.lastRotation=pose.rotation;
}
function mutantIKV599(leg,hip,target){
 let l1=Math.hypot(leg.knee[0]-leg.hip[0],leg.knee[1]-leg.hip[1]),l2=Math.hypot(leg.ankle[0]-leg.knee[0],leg.ankle[1]-leg.knee[1]);
 const dx=target[0]-hip[0],dy=target[1]-hip[1],raw=Math.hypot(dx,dy)||.001,stretch=Math.min(1.08,Math.max(1,raw/(l1+l2-.1)));l1*=stretch;l2*=stretch;
 const d=clamp(raw,Math.abs(l1-l2)+.01,l1+l2-.01),a=Math.atan2(dy,dx),c=clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1);
 const rx=leg.ankle[0]-leg.hip[0],ry=leg.ankle[1]-leg.hip[1],kx=leg.knee[0]-leg.hip[0],ky=leg.knee[1]-leg.hip[1],bend=rx*ky-ry*kx>=0?1:-1,angle=a+bend*Math.acos(c);
 return {knee:[hip[0]+Math.cos(angle)*l1,hip[1]+Math.sin(angle)*l1],ankle:[hip[0]+dx/raw*d,hip[1]+dy/raw*d]};
}
function mutantDrawBoneV599(g,part,a,b,thickness=1){
 const spec=part.spec,dx=spec.b[0]-spec.a[0],dy=spec.b[1]-spec.a[1],native=Math.atan2(dy,dx),length=Math.hypot(dx,dy),angle=Math.atan2(b[1]-a[1],b[0]-a[0]),s=Math.hypot(b[0]-a[0],b[1]-a[1])/length;
 g.save();g.translate(a[0],a[1]);g.rotate(angle);g.scale(s,thickness);g.rotate(-native);g.drawImage(part.canvas,spec.rect[0]-spec.a[0],spec.rect[1]-spec.a[1]);g.restore();
}
function mutantDrawLegV599(g,leg,i,pose,motion){
 const f=mutantV599.feet[i],hip=mutantBodyPointV599(leg.hip,motion),target=mutantWorldSourceV599(f.world,pose),ik=mutantIKV599(leg,hip,target),v=[leg.toe[0]-leg.ankle[0],leg.toe[1]-leg.ankle[1]],c=Math.cos(f.roll),s=Math.sin(f.roll),toe=[ik.ankle[0]+v[0]*c-v[1]*s,ik.ankle[1]+v[0]*s+v[1]*c],parts=mutantV599.parts.legs[i];
 mutantDrawBoneV599(g,parts[0],hip,ik.knee);mutantDrawBoneV599(g,parts[1],ik.knee,ik.ankle);mutantDrawBoneV599(g,parts[2],ik.ankle,toe);
 const actual=mutantSourceWorldV599(ik.ankle,pose);f.actual=actual;f.stanceError=f.mode==='stance'?Math.hypot(actual.x-f.world.x,actual.y-f.world.y):0;
}
function mutantTailCurveV599(root,pose,length){
 const a=playerBodyAngleV590(),fx=Math.cos(a),fy=Math.sin(a),px=-fy,py=fx,sway=Math.sin(mutantV599.clock*2.1)*.07;
 return [root,{x:root.x-fx*length*.38-px*length*.18,y:root.y-fy*length*.38-py*length*.18},{x:root.x-fx*length*.72+px*length*(.45+sway),y:root.y-fy*length*.72+py*length*(.45+sway)},{x:root.x+px*length*.58,y:root.y+py*length*.58}];
}
function mutantBezierV599(p,t){const q=1-t;return {x:q*q*q*p[0].x+3*q*q*t*p[1].x+3*q*t*t*p[2].x+t*t*t*p[3].x,y:q*q*q*p[0].y+3*q*q*t*p[1].y+3*q*t*t*p[2].y+t*t*t*p[3].y};}
function mutantDrawTailV599(g,pose,motion){
 const m=mutantV599,art=mutantArtV599,root=mutantSourceWorldV599(mutantBodyPointV599(art.tailRoot,motion),pose),level=state.tail||0,whip=organRunV598.whips[organRunV598.whips.length-1];
 if(!level&&!whip){
  g.save();g.translate(player.x,player.y);g.rotate(pose.rotation);g.scale(pose.facing*mutantScaleV599,mutantScaleV599);g.translate(-art.anchor[0],-art.anchor[1]);
  const r=mutantBodyPointV599(art.tailRoot,motion);g.translate(r[0],r[1]);g.rotate(Math.sin(m.clock*2)*(.018+m.blend*.025));g.translate(-art.tailRoot[0],-art.tailRoot[1]);mutantDrawPartV599(g,m.parts.tail);g.restore();m.tailLength=22;m.tailSegments=8;return;
 }
 const radius=organSpecV598('tail').radius||30,length=radius;let curve=mutantTailCurveV599(root,pose,length);
 if(whip){
  const p=clamp((whip.age-.055)/.285,0,1),angle=whip.aim-whip.s.arc/2+p*whip.s.arc,r=whip.s.radius;
  const attack=[root,{x:player.x+Math.cos(angle-.55)*r*.42,y:player.y+Math.sin(angle-.55)*r*.42},{x:player.x+Math.cos(angle-.25)*r*.82,y:player.y+Math.sin(angle-.25)*r*.82},{x:player.x+Math.cos(angle)*r,y:player.y+Math.sin(angle)*r}];
  let blend=whip.age<.055?clamp(whip.age/.055,0,1):whip.age>.34?clamp((whip.s.duration-whip.age)/Math.max(.01,whip.s.duration-.34),0,1):1;blend=blend*blend*(3-2*blend);
  curve=curve.map((p,i)=>({x:mutantMixV599(p.x,attack[i].x,blend),y:mutantMixV599(p.y,attack[i].y,blend)}));
 }
 const sample=[];let total=0;for(let i=0;i<=32;i++){const p=mutantBezierV599(curve,i/32);if(i)total+=Math.hypot(p.x-sample[i-1].x,p.y-sample[i-1].y);sample.push(p);}
 const count=clamp(Math.ceil(total/5),9,54),nodes=Array.from({length:count+1},(_,i)=>mutantBezierV599(curve,i/count));
 g.save();g.strokeStyle='#522b34';g.lineWidth=3.3;g.lineCap='round';g.beginPath();g.moveTo(root.x,root.y);g.bezierCurveTo(curve[1].x,curve[1].y,curve[2].x,curve[2].y,curve[3].x,curve[3].y);g.stroke();
 for(let i=count-1;i>=0;i--){const index=i===count-1?7:i===0?0:1+i%6,part=m.parts.tailParts[index],a=nodes[i],b=nodes[i+1],dx=b.x-a.x,dy=b.y-a.y;
  mutantDrawBoneV599(g,part,[a.x-dx*.10,a.y-dy*.10],[b.x+dx*.10,b.y+dy*.10],mutantScaleV599*(1.15-i/count*.25));
 }g.restore();m.tailLength=length;m.tailSegments=count;
}
function mutantWithSourceTransformV599(g,pose,fn){g.save();g.translate(player.x,player.y);g.rotate(pose.rotation);g.scale(pose.facing*mutantScaleV599,mutantScaleV599);g.translate(-mutantArtV599.anchor[0],-mutantArtV599.anchor[1]);fn();g.restore();}
function mutantDrawV599(shadowOnly=false){
 const m=mutantV599;if(!m.ready)return mutantLegacyDrawV599(shadowOnly);if(!m.feet.length)mutantInitFeetV599();
 mutantSyncSizeV599();
 const pose=mutantPoseV599(),motion=mutantBodyMotionV599();playerMotionV586.facing=pose.facing;
 if(shadowOnly){
  ctx.save();ctx.globalAlpha=.26;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(player.x,player.y+7,20,8,pose.rotation,0,TAU);ctx.fill();
  for(const f of m.feet){ctx.globalAlpha=.2*(1-f.lift/4);ctx.beginPath();ctx.ellipse(f.ground.x,f.ground.y+1,3.1,1.2,0,0,TAU);ctx.fill();}ctx.restore();return;
 }
 drawPlayerGroundV165(46,playerBodyAngleV590());drawEvoDominanceAura(46);
 const blink=(player.hurtBlink||0)>0&&Math.floor((.5-player.hurtBlink)/.0625)%2===0?.38:1;ctx.save();ctx.globalAlpha*=blink;mutantDrawTailV599(ctx,pose,motion);
 mutantWithSourceTransformV599(ctx,pose,()=>{
  mutantArtV599.legs.forEach((leg,i)=>{if(leg.far)mutantDrawLegV599(ctx,leg,i,pose,motion);});
  ctx.save();ctx.translate(mutantArtV599.anchor[0]+motion.dx,mutantArtV599.anchor[1]+motion.dy);ctx.rotate(motion.angle);ctx.translate(-mutantArtV599.anchor[0],-mutantArtV599.anchor[1]);mutantDrawPartV599(ctx,armItemModeV589()==='bare'?m.parts.body:m.parts.armedBody);ctx.restore();
  mutantArtV599.legs.forEach((leg,i)=>{if(!leg.far)mutantDrawLegV599(ctx,leg,i,pose,motion);});
 });ctx.restore();
 if(armItemModeV589()!=='bare'&&armItemsV589.ready)drawArmItemsV589(playerBodyAngleV590(),blink);
 if(frenzy>0)stamp('vfx/core_ring',player.x,player.y,64,t*.3,.25);
 if(player.inv>0||(player.shieldHP||0)>0){ctx.save();ctx.strokeStyle='#b4e9ff';ctx.globalAlpha=.56;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(player.x,player.y,22,0,TAU);ctx.stroke();ctx.restore();}
 drawOrganAttacksV598();m.renders++;
}
function mutantPreviewV599(mode='bare',size=1536){
 const art=mutantArtV599,c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),unit=mutantBaseScaleV599,rect=art.full.rect;
 const points=[[rect[0]*unit,rect[1]*unit],[(rect[0]+rect[2])*unit,(rect[1]+rect[3])*unit]];
 if(mode!=='bare')for(const side of [0,1]){const key=side?'right':'left',spec=armItemsArtV589.items[mode],p=spec[key],w=art.wrists[side];
  for(const x of [0,p.width])for(const y of [0,p.height]){const d=armItemOffsetV600(mode,side,x,y,art.nativeFacing);points.push([w[0]*unit+d.x,w[1]*unit+d.y]);}
 }
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),fit=Math.min(size*.86/(right-left),size*.86/(bottom-top),size/art.displaySize),ox=size/2-(left+right)/2*fit,oy=size/2-(top+bottom)/2*fit;
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.save();g.translate(ox,oy);g.scale(unit*fit,unit*fit);mutantDrawPartV599(g,mode==='bare'?mutantV599.parts.full:mutantV599.parts.armedFull);g.restore();
 if(mode!=='bare')for(const side of [1,0]){const p=art.wrists[side];armItemSpriteV589(g,mode,side,{x:ox+p[0]*unit*fit,y:oy+p[1]*unit*fit},art.nativeFacing,fit);}
 return c;
}
function mutantInspectV599(size=640,zoom=6){
 mutantSyncSizeV599();
 const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.fillStyle='#18252b';g.fillRect(0,0,size,size);
 g.translate(size/2-player.x*zoom,size/2-player.y*zoom);g.scale(zoom,zoom);
 const pose=mutantPoseV599(),motion=mutantBodyMotionV599();mutantDrawTailV599(g,pose,motion);
 mutantWithSourceTransformV599(g,pose,()=>{
  mutantArtV599.legs.forEach((leg,i)=>{if(leg.far)mutantDrawLegV599(g,leg,i,pose,motion);});
  g.save();g.translate(mutantArtV599.anchor[0]+motion.dx,mutantArtV599.anchor[1]+motion.dy);g.rotate(motion.angle);g.translate(-mutantArtV599.anchor[0],-mutantArtV599.anchor[1]);mutantDrawPartV599(g,armItemModeV589()==='bare'?mutantV599.parts.body:mutantV599.parts.armedBody);g.restore();
  mutantArtV599.legs.forEach((leg,i)=>{if(!leg.far)mutantDrawLegV599(g,leg,i,pose,motion);});
 });
 const mode=armItemModeV589();if(mode!=='bare')for(const side of [1,0]){const p=armItemWorldPointV589(side),a=armItemAngleV589(side,player.look||0);armItemSpriteV589(g,mode,side,p,a,(mode==='blades'?1+upgradeRunV593.bladeRange:1)*upgradeBodyScaleV593(),1,pose.facing);}
 return c;
}
function mutantRefreshV599(){
 if(!mutantV599.ready)return;
 const mode=armItemModeV589(),src=mutantV599.previews[mode]||mutantV599.previews.bare;ASSET_SRC['player_static/base_specimen']=mutantV599.previews.bare;SPRITE_SRC.player=mutantV599.previews.bare;
 const image=$('partsSpecimenImgV523');if(image&&image.src!==src){image.src=src;image.removeAttribute('data-origin-v522');delete image.dataset.origin;}
}
const mutantLegacyDrawV599=drawPlayer;drawPlayer=mutantDrawV599;
const mutantLegacyStepV599=playerStepV586;playerStepV586=function(dt){mutantLegacyStepV599(dt);mutantStepV599(dt);};
const mutantLegacyResetV599=reset;reset=function(...args){const r=mutantLegacyResetV599(...args);mutantSyncSizeV599();if(mutantV599.ready)mutantInitFeetV599();mutantRefreshV599();return r;};
const mutantLegacyHomeV599=refreshEvolveHomeV522;refreshEvolveHomeV522=function(...args){const r=mutantLegacyHomeV599(...args);mutantRefreshV599();if(!mutantV599.ready)$('start').disabled=true;return r;};
const mutantLegacyPartsV599=renderEvolvePartsV523;renderEvolvePartsV523=function(...args){const r=mutantLegacyPartsV599(...args);mutantRefreshV599();return r;};
const mutantLegacyEquipV599=equipPartV523;equipPartV523=function(...args){const r=mutantLegacyEquipV599(...args);mutantRefreshV599();return r;};
armItemWorldPointV589=function(side){return mutantSourceWorldV599(mutantBodyPointV599(mutantArtV599.wrists[side]));};
organBodyPointV598=function(kind){return mutantSourceWorldV599(mutantBodyPointV599(kind==='mouth'?mutantArtV599.mouth:kind==='tail'?mutantArtV599.tailRoot:mutantArtV599.shell));};
const mutantLegacyWhipV599=drawOrganWhipV598;drawOrganWhipV598=function(g,w,preview=false){if(preview||!mutantV599.ready)return mutantLegacyWhipV599(g,w,preview);};
const mutantImageReadyV599=new Promise((resolve,reject)=>{mutantV599.image.onload=resolve;mutantV599.image.onerror=()=>reject(new Error('새 캐릭터 원본 이미지를 불러오지 못했습니다.'));mutantV599.image.src=mutantArtV599.path;});
const mutantReadyV599=Promise.all([mutantImageReadyV599,armItemsReadyV589]).then(()=>{
 const m=mutantV599,a=mutantArtV599;m.parts.full=mutantBuildPartV599(a.full);m.parts.body=mutantBuildPartV599(a.body);m.parts.tail=mutantBuildPartV599(a.tail);m.parts.legs=a.legs.map(l=>l.segments.map(mutantBuildPartV599));m.parts.tailParts=a.tailParts.map(mutantBuildPartV599);
 m.parts.armedBody=mutantWeaponBodyV599(m.parts.body);m.parts.armedFull=mutantWeaponBodyV599(m.parts.full);
 for(const mode of ['bare','cannon','blades']){const c=mutantPreviewV599(mode);m.previews[mode]=c.toDataURL('image/png');c.width=c.height=1;if(mode!=='bare')armItemsV589.previews[mode]=m.previews[mode];}
 m.ready=true;mutantInitFeetV599();mutantRefreshV599();refreshEvolveHomeV522();return true;
});
window.__EVOLVE_PLAYER_MUTANT_V599__={ready:mutantReadyV599,read:()=>({version:599,character:'approved-armored-mutant',ready:mutantV599.ready,source:mutantArtV599.path,sha256:mutantArtV599.sha256,sourceBytes:mutantArtV599.bytes,sourceWidth:mutantArtV599.width,sourceHeight:mutantArtV599.height,sourceUnchanged:true,displaySize:mutantArtV599.displaySize,partBuilds:mutantV599.builds,renders:mutantV599.renders,moving:mutantV599.moving,distance:mutantV599.distance,tailLength:mutantV599.tailLength,tailSegments:mutantV599.tailSegments,tailRange:organSpecV598('tail').radius||0,feet:mutantV599.feet.map(f=>({mode:f.mode,world:f.actual||f.world,anchor:f.anchor,lift:f.lift,stanceError:f.stanceError})),physical_Galaxy_S23_plus_tested:false})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_PLAYER_MUTANT_V599__.test={art:()=>mutantArtV599,image:()=>mutantV599.image,parts:()=>mutantV599.parts,rig:()=>mutantV599,reset:mutantInitFeetV599,step:mutantStepV599,draw:mutantDrawV599,preview:mutantPreviewV599,pose:mutantFacingV599,point:mutantSourceWorldV599,inspect:mutantInspectV599};
