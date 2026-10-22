// WEB-13 poses with WEB-14 painted warning branding.
function cinematicPoseV580(elapsed,reduced=false){
 const time=Math.max(0,Math.min(3,elapsed)),segment=.72,frame=reduced?0:Math.min(3,Math.floor(time/segment));
 const blend=reduced||frame===3?0:Math.max(0,Math.min(1,(time-frame*segment-.56)/.16));
 return {time,frame,next:Math.min(3,frame+1),blend:blend*blend*(3-2*blend),count:Math.max(1,Math.ceil(3-time)),zoom:reduced?1:1.025+time*.025};
}
const cinematicArtV580=JSON.parse('__BOSS_CINEMATIC_ART__'),cinematicFramesV580=new Map();
let cinematicErrorV580=null,cinematicCanvasV580=null,cinematicContextV580=null;
const cinematicStateV580={active:false,kind:'bio',elapsed:0,frame:0,serial:0,draws:0,reduced:false};
const cinematicReadyV580=Promise.all(Object.entries(cinematicArtV580).map(async([kind,a])=>{
 const im=new Image();im.decoding='async';await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=()=>reject(Error('Cinematic artwork unavailable: '+kind));im.src=a.path;});
 const frames=[],crop=a.crop||[0,0,a.width/2,a.height/2],scale=Math.min(1,768/crop[3]);
 for(let i=0;i<4;i++){const c=document.createElement('canvas');c.width=Math.round(crop[2]*scale);c.height=Math.round(crop[3]*scale);const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,(i%2)*a.width/2+crop[0],Math.floor(i/2)*a.height/2+crop[1],crop[2],crop[3],0,0,c.width,c.height);frames.push(c);}
 cinematicFramesV580.set(kind,frames);im.src='';
})).catch(error=>{cinematicErrorV580=String(error);throw error});
const cinematicStyleV580=document.createElement('style');cinematicStyleV580.textContent=`
#bossWarningV526[data-cinematic-v580]{position:fixed;inset:0;z-index:100000;overflow:hidden;isolation:isolate;display:block;pointer-events:auto;touch-action:none;background:#080b10;color:#fff;--cine-color:#ef4835;--cine-light:#fa9460;--cine-flare:0}
#bossWarningV526[data-cinematic-v580][hidden]{display:none!important}
#bossWarningV526[data-cinematic-v580][data-kind=venom]{--cine-color:#d6f36b;--cine-light:#76b644}
.cineBackdropV580{position:absolute;inset:-8%;background:radial-gradient(ellipse at 50% 30%,color-mix(in srgb,var(--cine-color) 18%,#131c20),transparent 55%),radial-gradient(ellipse at 50% 78%,#26070c,#070b10 70%)}
.cineBackdropV580:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 17%,#9eb7b908 17.1% 17.4%,transparent 17.5% 31%);transform:scale(1.15)}
.cineArtV580{position:absolute;inset:0;width:100%;height:100%;display:block}
.cineShadeV580{position:absolute;inset:0;background:linear-gradient(#03050caa,transparent 20% 48%,#07070b66 64%,#07070bf2 100%),radial-gradient(ellipse at 50% 40%,transparent 22%,#0005 70%,#000a 100%);box-shadow:inset 0 0 70px #0008}
.cineFlareV580{position:absolute;inset:0;background:#ffb28a;opacity:var(--cine-flare);pointer-events:none}
.cineTapeV580{position:absolute;left:-2%;right:-2%;top:65%;height:43px;transform:rotate(-2deg);border-top:7px solid transparent;border-bottom:7px solid transparent;border-image:repeating-linear-gradient(125deg,#ff5c42 0 9px,#230c0c 9px 17px) 7;background:linear-gradient(#b41c20b8,#dc3d28d9);box-shadow:0 0 25px #e42b2670,inset 0 0 12px #ff8c3f66;display:flex;align-items:center;justify-content:center}
.cineOverlayV581{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.cineNameV580[hidden]{display:none!important}
.cineBottomV580{position:absolute;left:9%;right:9%;bottom:max(5%,env(safe-area-inset-bottom));height:2px;background:#ffffff1c}.cineBottomV580 i{height:100%;display:block;background:#ff614a;width:var(--cine-remaining,100%);box-shadow:0 0 9px #fb5537}
@media(min-aspect-ratio:1/1){.cineTapeV580{top:61%;height:35px}.cineBottomV580{bottom:3%}}
`;document.head.appendChild(cinematicStyleV580);
const cinematicLegacyEnsureV580=ensureBossWarningV526,cinematicLegacyWarningV580=warningTestV550;
ensureBossWarningV526=function(){
 if(bossWarningNodeV526?.dataset.cinematicV580)return bossWarningNodeV526;
 bossWarningNodeV526?.remove();const el=document.createElement('div');el.id='bossWarningV526';el.hidden=true;el.dataset.cinematicV580='1';el.dataset.i18nIgnore='';el.setAttribute('role','status');el.setAttribute('aria-label','Boss incoming');
 el.innerHTML='<div class="cineBackdropV580"></div><canvas class="cineArtV580" aria-hidden="true"></canvas><div class="cineShadeV580"></div><div class="cineFlareV580"></div><div class="cineTapeV580" aria-hidden="true"></div><canvas class="cineOverlayV581" aria-hidden="true"></canvas><div class="cineNameV580" hidden><span></span><small></small></div><div class="cineBottomV580"><i></i></div>';
 document.body.appendChild(el);bossWarningNodeV526=el;cinematicCanvasV580=el.querySelector('.cineArtV580');cinematicContextV580=cinematicCanvasV580.getContext('2d',{alpha:true});warningBrandCanvasV581=el.querySelector('.cineOverlayV581');warningBrandContextV581=warningBrandCanvasV581.getContext('2d',{alpha:true});return el;
};
function paintCinematicV580(elapsed,reduced){
 const c=cinematicCanvasV580,g=cinematicContextV580,frames=cinematicFramesV580.get(cinematicStateV580.kind);if(!c||!g||!frames)return;
 const w=c.parentElement.clientWidth||W,h=c.parentElement.clientHeight||H,dpr=Math.min(window.devicePixelRatio||1,1.5),cw=Math.round(w*dpr),ch=Math.round(h*dpr);
 if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch;}g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
 const pose=cinematicPoseV580(elapsed,reduced),source=frames[pose.frame],landscape=w>h,size=Math.max(w*(landscape?.8:1.24),h*(landscape?1.25:.86))*pose.zoom,dh=size,dw=dh*source.width/source.height;
 const drift=reduced?0:Math.sin(elapsed*1.5)*w*.008,x=(w-dw)/2+drift,y=h*(landscape?.43:.43)-dh*.47;
 g.globalAlpha=1;g.drawImage(source,x,y,dw,dh);if(pose.blend>0){g.globalAlpha=pose.blend;g.drawImage(frames[pose.next],x,y,dw,dh);}g.globalAlpha=1;
 cinematicStateV580.frame=pose.frame;cinematicStateV580.draws++;
}
function cinematicClearInputV580(){joy.active=false;joy.dx=joy.dy=0;for(const key of Object.keys(keys))keys[key]=false;}
setBossWarningV526=function(on){
 const el=on?ensureBossWarningV526():bossWarningNodeV526;if(!el)return;el.hidden=!on;stageFlowV526.warningActive=!!on;
 if(!on){cinematicStateV580.active=false;return;}
 const spec=stageSpecV526(),kind=spec.bossKind==='venom'?'venom':'bio',elapsed=clamp(t-297,0,3),cfg=feedbackCfg(),reduced=!!cfg.reducedMotion,ko=homeLanguageV522()==='ko';
 if(!cinematicStateV580.active||cinematicStateV580.kind!==kind){cinematicStateV580.serial++;cinematicClearInputV580();}
 Object.assign(cinematicStateV580,{active:true,kind,elapsed,reduced});el.dataset.kind=kind;el.setAttribute('aria-label',(kind==='venom'?'VENOM TITAN':'BIO TITAN')+(ko?' 보스 출현':' incoming'));
 el.querySelector('.cineNameV580 span').textContent=kind==='venom'?'VENOM TITAN':'BIO TITAN';el.querySelector('.cineNameV580 small').textContent=ko?'초대형 생명체 출현':'COLOSSAL LIFEFORM DETECTED';
 const pose=cinematicPoseV580(elapsed,reduced);el.style.setProperty('--cine-remaining',String((1-elapsed/3)*100)+'%');el.style.setProperty('--cine-flare',String(reduced||cfg.flash===0?0:Math.max(0,1-Math.abs(elapsed-2.19)/.12)*.12));
 player.inv=Math.max(player.inv,.18);paintCinematicV580(elapsed,reduced);paintWarningBrandV581(elapsed,reduced,kind,spec.phase);
};
// Legacy boss shortcuts have their own warning clock; route BIO/VENOM into the same film.
warningTestV550=function(){
 const s=bossTestV550;if(!s||s.state!=='warning')return;
 if(!['bio','venom'].includes(s.kind)){if(bossWarningNodeV526?.dataset.cinematicV580){bossWarningNodeV526.remove();bossWarningNodeV526=null;cinematicStateV580.active=false;}const factory=ensureBossWarningV526;try{ensureBossWarningV526=cinematicLegacyEnsureV580;return cinematicLegacyWarningV580();}finally{ensureBossWarningV526=factory;}}
 const clock=t,spec=stageSpecV526;try{t=297+s.elapsed;stageSpecV526=(...args)=>({...spec(...args),bossKind:s.kind,phase:s.phase});setBossWarningV526(running&&!paused&&!choosing&&!rewardChoosing&&!ended);}finally{t=clock;stageSpecV526=spec;}
};
const cinematicUpdateBaseV580=update;update=function(dt,...args){if(cinematicStateV580.active&&running&&!paused&&!ended&&!choosing&&!rewardChoosing){cinematicClearInputV580();player.inv=Math.max(player.inv,Math.max(0,dt)+.18);}return cinematicUpdateBaseV580(dt,...args)};
window.__EVOLVE_CINEMATIC_V580__={ready:cinematicReadyV580,read:()=>({...cinematicStateV580,ready:cinematicFramesV580.size===2,error:cinematicErrorV580,frameCounts:Object.fromEntries([...cinematicFramesV580].map(([k,v])=>[k,v.length])),visible:!!bossWarningNodeV526&&!bossWarningNodeV526.hidden})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_CINEMATIC_V580__.test={pose:cinematicPoseV580,surface:(kind,frame)=>cinematicFramesV580.get(kind)?.[frame],paint:(elapsed,reduced=false)=>paintCinematicV580(elapsed,reduced),show:(kind,elapsed)=>{const clock=t,old=stageSpecV526;try{t=297+elapsed;stageSpecV526=()=>({...old(),bossKind:kind});setBossWarningV526(true);}finally{t=clock;stageSpecV526=old;}},hide:()=>setBossWarningV526(false)};
