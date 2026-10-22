// WEB-13: dedicated front-facing boss poses, used only during the existing warning.
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
#bossWarningV526[data-cinematic-v580]{position:absolute;inset:0;z-index:1100;overflow:hidden;isolation:isolate;display:block;pointer-events:auto;touch-action:none;background:#080b10;color:#fff;font-family:Impact,'Arial Narrow',sans-serif;--cine-color:#ef4835;--cine-light:#fa9460;--cine-flare:0}
#bossWarningV526[data-cinematic-v580][hidden]{display:none!important}
#bossWarningV526[data-cinematic-v580][data-kind=venom]{--cine-color:#d6f36b;--cine-light:#76b644}
.cineBackdropV580{position:absolute;inset:-8%;background:radial-gradient(ellipse at 50% 30%,color-mix(in srgb,var(--cine-color) 18%,#131c20),transparent 55%),radial-gradient(ellipse at 50% 78%,#26070c,#070b10 70%)}
.cineBackdropV580:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 17%,#9eb7b908 17.1% 17.4%,transparent 17.5% 31%);transform:scale(1.15)}
.cineArtV580{position:absolute;inset:0;width:100%;height:100%;display:block}
.cineShadeV580{position:absolute;inset:0;background:linear-gradient(#03050caa,transparent 20% 48%,#07070b66 64%,#07070bf2 100%),radial-gradient(ellipse at 50% 40%,transparent 22%,#0005 70%,#000a 100%);box-shadow:inset 0 0 70px #0008}
.cineFlareV580{position:absolute;inset:0;background:#ffb28a;opacity:var(--cine-flare);pointer-events:none}
.cineTopV580{position:absolute;left:7%;right:7%;top:max(5%,env(safe-area-inset-top));display:flex;align-items:flex-start;justify-content:space-between;gap:12px;letter-spacing:.22em;font:700 9px/1.7 monospace;color:#c9c7c8;text-shadow:0 2px 6px #000}
.cineTopV580 b{display:block;color:#ff604b;font-size:11px;letter-spacing:.24em}.cineCountV580{font:900 38px/.9 Impact,sans-serif;color:#ff705a;min-width:1ch;text-align:right}
.cineCaptionV580{position:absolute;left:8%;bottom:38%;font:700 10px/1.5 monospace;letter-spacing:.2em;text-shadow:0 2px 7px #000;color:#e9d4cf}
.cineTapeV580{position:absolute;left:-2%;right:-2%;top:65%;height:43px;transform:rotate(-2deg);border-top:7px solid transparent;border-bottom:7px solid transparent;border-image:repeating-linear-gradient(125deg,#ff5c42 0 9px,#230c0c 9px 17px) 7;background:linear-gradient(#b41c20b8,#dc3d28d9);box-shadow:0 0 25px #e42b2670,inset 0 0 12px #ff8c3f66;display:flex;align-items:center;justify-content:center}
.cineTapeTextV580{white-space:nowrap;word-spacing:30px;font:900 21px/1 Impact,sans-serif;letter-spacing:.06em;color:#ff8b64;text-shadow:1px 1px #65151b;transform:translateX(var(--cine-tape,0px))}
.cineSealV580{position:absolute;left:50%;top:50%;height:66px;width:66px;transform:translate(-50%,-50%) rotate(45deg);background:#51151de8;border:2px solid #ff654f;box-shadow:0 0 19px #ff3b3266,inset 0 0 19px #ff3b3244;display:grid;place-items:center}
.cineSealV580 svg{height:49px;width:49px;transform:rotate(-45deg);fill:#ff654f;filter:drop-shadow(0 0 5px #ff603b66)}
.cineNameV580{position:absolute;left:4%;right:4%;top:76%;text-align:center;transform:skew(-8deg);font:900 clamp(38px,11vw,76px)/.95 Impact,'Arial Narrow',sans-serif;letter-spacing:.015em;color:#eee7e3;text-shadow:3px 3px #8b211f,0 0 26px #ff482e66}
.cineNameV580 small{display:block;transform:skew(8deg);margin:14px 0 0;font:700 10px/1.4 monospace;letter-spacing:.3em;color:#df9c8e;text-shadow:0 1px 3px #000}
.cineBottomV580{position:absolute;left:9%;right:9%;bottom:max(5%,env(safe-area-inset-bottom));height:2px;background:#ffffff1c}.cineBottomV580 i{height:100%;display:block;background:#ff614a;width:var(--cine-remaining,100%);box-shadow:0 0 9px #fb5537}
@media(min-aspect-ratio:1/1){.cineTapeV580{top:65%;height:39px}.cineCaptionV580{bottom:39%;font-size:10px}.cineTopV580{top:5%}.cineNameV580{top:79%;font-size:clamp(36px,7vw,72px)}.cineNameV580 small{margin-top:8px}.cineBottomV580{bottom:3%}.cineSealV580{height:61px;width:61px}}
`;document.head.appendChild(cinematicStyleV580);
ensureBossWarningV526=function(){
 if(bossWarningNodeV526?.dataset.cinematicV580)return bossWarningNodeV526;
 bossWarningNodeV526?.remove();const el=document.createElement('div');el.id='bossWarningV526';el.hidden=true;el.dataset.cinematicV580='1';el.dataset.i18nIgnore='';el.setAttribute('role','status');el.setAttribute('aria-label','Boss incoming');
 el.innerHTML='<div class="cineBackdropV580"></div><canvas class="cineArtV580" aria-hidden="true"></canvas><div class="cineShadeV580"></div><div class="cineFlareV580"></div><div class="cineTopV580"><div><b>CONTAINMENT BREACH</b><span class="cinePhaseV580"></span></div><span class="cineCountV580" aria-hidden="true">3</span></div><div class="cineCaptionV580"></div><div class="cineTapeV580"><div class="cineTapeTextV580" aria-hidden="true">WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING</div><div class="cineSealV580" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M12 8 23 17 32 14 41 17 52 8 48 28Q56 35 49 47L41 51 38 59H26L23 51 15 47Q8 35 16 28ZM21 32 18 39 27 42 28 35ZM43 32 36 35 37 42 46 39ZM32 42 28 48H36ZM27 51V56H30V51ZM34 51V56H37V51Z" fill-rule="evenodd"/></svg></div></div><div class="cineNameV580"><span></span><small></small></div><div class="cineBottomV580"><i></i></div>';
 app.appendChild(el);bossWarningNodeV526=el;cinematicCanvasV580=el.querySelector('canvas');cinematicContextV580=cinematicCanvasV580.getContext('2d',{alpha:true});return el;
};
function paintCinematicV580(elapsed,reduced){
 const c=cinematicCanvasV580,g=cinematicContextV580,frames=cinematicFramesV580.get(cinematicStateV580.kind);if(!c||!g||!frames)return;
 const w=app.clientWidth||W,h=app.clientHeight||H,dpr=Math.min(window.devicePixelRatio||1,1.5),cw=Math.round(w*dpr),ch=Math.round(h*dpr);
 if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch;}g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
 const pose=cinematicPoseV580(elapsed,reduced),source=frames[pose.frame],landscape=w>h,size=Math.max(w*(landscape?.8:1.24),h*(landscape?1.25:.86))*pose.zoom,dh=size,dw=dh*source.width/source.height;
 const drift=reduced?0:Math.sin(elapsed*1.5)*w*.008,x=(w-dw)/2+drift,y=h*(landscape?.43:.43)-dh*.47;
 g.globalAlpha=1;g.drawImage(source,x,y,dw,dh);if(pose.blend>0){g.globalAlpha=pose.blend;g.drawImage(frames[pose.next],x,y,dw,dh);}g.globalAlpha=1;
 cinematicStateV580.frame=pose.frame;cinematicStateV580.draws++;
}
setBossWarningV526=function(on){
 const el=on?ensureBossWarningV526():bossWarningNodeV526;if(!el)return;el.hidden=!on;stageFlowV526.warningActive=!!on;
 if(!on){cinematicStateV580.active=false;return;}
 const spec=stageSpecV526(),kind=spec.bossKind==='venom'?'venom':'bio',elapsed=clamp(t-297,0,3),cfg=feedbackCfg(),reduced=!!cfg.reducedMotion,ko=homeLanguageV522()==='ko';
 if(!cinematicStateV580.active||cinematicStateV580.kind!==kind){cinematicStateV580.serial++;clearInput();}
 Object.assign(cinematicStateV580,{active:true,kind,elapsed,reduced});el.dataset.kind=kind;el.setAttribute('aria-label',(kind==='venom'?'VENOM TITAN':'BIO TITAN')+(ko?' 보스 출현':' incoming'));
 el.querySelector('.cineNameV580 span').textContent=kind==='venom'?'VENOM TITAN':'BIO TITAN';el.querySelector('.cineNameV580 small').textContent=ko?'초대형 생명체 출현':'COLOSSAL LIFEFORM DETECTED';el.querySelector('.cinePhaseV580').textContent='PHASE '+spec.phase+' / '+(ko?'봉쇄 경보':'LOCKDOWN ALERT');el.querySelector('.cineCaptionV580').textContent=ko?'중앙 구역 · 생체 반응 급증':'CENTRAL SECTOR · MASSIVE BIO-SIGNATURE';
 const pose=cinematicPoseV580(elapsed,reduced);el.querySelector('.cineCountV580').textContent=String(pose.count);el.style.setProperty('--cine-remaining',String((1-elapsed/3)*100)+'%');el.style.setProperty('--cine-tape',String(reduced?0:-elapsed*27)+'px');el.style.setProperty('--cine-flare',String(reduced||cfg.flash===0?0:Math.max(0,1-Math.abs(elapsed-2.19)/.12)*.12));
 player.inv=Math.max(player.inv,.18);paintCinematicV580(elapsed,reduced);
};
const cinematicUpdateBaseV580=update;update=function(dt,...args){if(cinematicStateV580.active&&running&&!paused&&!ended&&!choosing&&!rewardChoosing){clearInput();player.inv=Math.max(player.inv,Math.max(0,dt)+.18);}return cinematicUpdateBaseV580(dt,...args)};
window.__EVOLVE_CINEMATIC_V580__={ready:cinematicReadyV580,read:()=>({...cinematicStateV580,ready:cinematicFramesV580.size===2,error:cinematicErrorV580,frameCounts:Object.fromEntries([...cinematicFramesV580].map(([k,v])=>[k,v.length])),visible:!!bossWarningNodeV526&&!bossWarningNodeV526.hidden})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_CINEMATIC_V580__.test={pose:cinematicPoseV580,surface:(kind,frame)=>cinematicFramesV580.get(kind)?.[frame],paint:(elapsed,reduced=false)=>paintCinematicV580(elapsed,reduced),show:(kind,elapsed)=>{const clock=t,old=stageSpecV526;try{t=297+elapsed;stageSpecV526=()=>({...old(),bossKind:kind});setBossWarningV526(true);}finally{t=clock;stageSpecV526=old;}},hide:()=>setBossWarningV526(false)};
