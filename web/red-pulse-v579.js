// WEB-12: a single stand-to-charge field device. Damage follows the visible wave front.
function createRedPulseDeviceV579(host){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let clock=0,cooldown=0,wave=null;
 let metrics={detonations:0,contacts:0,spawned:0};
 function reset(){clock=0;cooldown=0;wave=null;metrics={detonations:0,contacts:0,spawned:0}}
 function ensure(){if(cooldown>0||host.blocked()||host.device())return null;const s=host.spawn();if(s)metrics.spawned++;else cooldown=2;return s}
 function detonate(s){
  if(!s||s.claimed||wave||host.blocked())return false;
  const v=host.view(),x=s.x,y=s.y;
  const targets=host.enemies().filter(e=>e&&!e.dead&&!e.arrivalInvuln&&e.hp>0&&e.x+(e.r||0)>=v.l&&e.x-(e.r||0)<=v.r&&e.y+(e.r||0)>=v.t&&e.y-(e.r||0)<=v.b).map(e=>({e,distance:Math.max(0,Math.hypot(e.x-x,e.y-y)-(e.r||0)),hit:false}));
  const maxRadius=Math.max(1,...[[v.l,v.t],[v.r,v.t],[v.r,v.b],[v.l,v.b]].map(p=>Math.hypot(p[0]-x,p[1]-y)));
  wave={x,y,age:0,life:1.18,spread:.78,radius:0,maxRadius,targets,seed:metrics.detonations+1};
  s.claimed=true;s.hold=0;cooldown=60;metrics.detonations++;host.kick(x,y);return true;
 }
 function step(dt){
  if(!host.active()||!(dt>0))return;clock+=dt;cooldown=Math.max(0,cooldown-dt);
  if(wave){wave.age+=dt;const p=clamp(wave.age/wave.spread,0,1);wave.radius=wave.maxRadius*(1-(1-p)**3);
   for(const q of wave.targets)if(!q.hit&&q.distance<=wave.radius){q.hit=true;const e=q.e;if(!e.dead&&!e.arrivalInvuln&&e.hp>0){host.damage(e,wave.x,wave.y);metrics.contacts++}}
   if(wave.age>=wave.life)wave=null;
  }
  const s=host.device();if(s){if(host.blocked()||s.arenaHidden)s.hold=0;else{const p=host.player();s.hold=Math.hypot(p.x-s.x,p.y-s.y)<=s.r?Math.min(3,(s.hold||0)+dt):0;if(s.hold>=3-1e-8)detonate(s)}}
  ensure();
 }
 return {reset,ensure,step,detonate,wave:()=>wave,clock:()=>clock,read:()=>({...metrics,cooldown,clock,charging:host.device()?.hold||0,wave:wave?{age:wave.age,radius:wave.radius,maxRadius:wave.maxRadius,targets:wave.targets.length}:null})};
}

const redPulseImageV579=new Image(),redPulseArtV579=JSON.parse('__RED_PULSE_ART__');let redPulseArtErrorV579=null,redPulseSurfaceV579=null;
const redPulseImageReadyV579=new Promise(resolve=>{redPulseImageV579.onload=()=>{const b=redPulseArtV579.bounds,w=b[2]-b[0],h=b[3]-b[1],c=document.createElement('canvas');c.width=Math.ceil(w*256/h);c.height=256;c.getContext('2d').drawImage(redPulseImageV579,b[0],b[1],w,h,0,0,c.width,c.height);redPulseSurfaceV579=c;resolve(true)};redPulseImageV579.onerror=()=>{redPulseArtErrorV579='Red pulse device image failed to load';resolve(false)};redPulseImageV579.src=redPulseArtV579.path});
function redPulseBlockedV579(){return !!bossArena?.active||!!stageFlowV526.result||!!stageFlowV526.closing}
function redPulseSpawnV579(){
 if(redPulseBlockedV579())return null;
 const existing=worldSites.find(s=>s.type==='redPulse'&&!s.claimed);if(existing)return existing;
 const q=redPulseReachablePointV590();if(!q)return null;
 worldSites=worldSites.filter(s=>s.type!=='redPulse');
 const s={id:++worldSiteSerial,type:'redPulse',...q,r:24,need:3,hold:0,pulse:0,claimed:false,active:false,arenaHidden:false};worldSites.push(s);return s;
}
const redPulseV579=createRedPulseDeviceV579({active:()=>running&&!paused&&!choosing&&!rewardChoosing&&!ended,blocked:redPulseBlockedV579,device:()=>worldSites.find(s=>s.type==='redPulse'&&!s.claimed)||null,spawn:redPulseSpawnV579,player:()=>player,view:()=>cameraRect(0),enemies:()=>enemies,
 damage(e,x,y){const a=Math.atan2(e.y-y,e.x-x),mass=e.finalBoss?.08:e.elite?.35:1,amount=Math.max(e.finalBoss?50:110,e.maxHp*(e.finalBoss?.05:.85));e.deathA=a;e.kx=(e.kx||0)+Math.cos(a)*210*mass;e.ky=(e.ky||0)+Math.sin(a)*210*mass;delete e.arcShockV576;e.redPulseUntilV579=redPulseV579.clock()+.24;const stop=hitStop;lightningDamageBaseV576(e,amount,'fieldPulse');if(!e.finalBoss||!e.dead)hitStop=stop;e.hit=Math.max(e.hit||0,.13);e.stunned=Math.max(e.stunned||0,e.finalBoss?0:.18)},
 kick(){if(!feedbackCfg().reducedMotion)cameraShake=Math.max(cameraShake,8);impactPulse=Math.max(impactPulse,.9);frozenFrameDrawnV438=false}
});
const redPulseAddSiteBaseV579=addWorldSite;addWorldSite=function(type,...args){if(!['regen','shield','redPulse'].includes(type))return null;return redPulseAddSiteBaseV579(type,...args)};
buildWorldSites=function(){worldSites=[];worldSiteSerial=0;redPulseV579.reset();addWorldSite('regen');addWorldSite('shield');redPulseV579.ensure()};
const redPulseCompleteBaseV579=completeWorldSite;completeWorldSite=function(s){if(s?.type==='redPulse')return redPulseV579.detonate(s);return redPulseCompleteBaseV579(s)};
updateWorldSites=function(dt){
 worldSiteHintCd=Math.max(0,worldSiteHintCd-dt);
 for(const s of worldSites){if(s.type==='redPulse')continue;if(s.claimed||s.arenaHidden)continue;s.pulse+=dt*3;const full=s.type==='regen'&&player.hp>=player.maxHp,inside=Math.hypot(player.x-s.x,player.y-s.y)<=s.r;if(inside&&!full)s.hold=Math.min(s.need,s.hold+dt);else s.hold=Math.max(0,s.hold-dt*.8);if(s.hold>=s.need&&!full)completeWorldSite(s)}
 redPulseV579.step(dt);
};
// Optional gene-rift field devices are disabled; stage exits and contract progression remain native.
spawnGeneRift=function(){return false};
const redPulseLabelBaseV579=worldSiteLabel;worldSiteLabel=function(s){return s.type==='redPulse'?'방전 장치':redPulseLabelBaseV579(s)};
const redPulseColorBaseV579=worldSiteColor;worldSiteColor=function(s){return s.type==='redPulse'?'#ff3d32':redPulseColorBaseV579(s)};
const redPulseSiteDrawBaseV579=drawSiteArtV422;drawSiteArtV422=function(s){
 if(s.type!=='redPulse')return redPulseSiteDrawBaseV579(s);const q=clamp((s.hold||0)/3,0,1),near=Math.hypot(player.x-s.x,player.y-s.y)<85;
 ctx.save();ctx.translate(s.x,s.y);ctx.fillStyle='#1e0306';ctx.globalAlpha=.5;ctx.beginPath();ctx.ellipse(0,0,26,17,0,0,TAU);ctx.fill();ctx.globalAlpha=.65+q*.3;ctx.strokeStyle='#ff483a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,24,0,TAU);ctx.stroke();if(q){ctx.strokeStyle='#fff0bd';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,24,-Math.PI/2,-Math.PI/2+TAU*q);ctx.stroke()}
 if(redPulseSurfaceV579){const h=54*(1+Math.sin(t*(8+q*22))*.012*q),w=h*redPulseSurfaceV579.width/redPulseSurfaceV579.height;ctx.globalAlpha=1;ctx.drawImage(redPulseSurfaceV579,-w/2,-h+6,w,h)}
 if(near||q){ctx.globalAlpha=1;ctx.font='bold 8px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#160409';ctx.fillStyle='#ffd4bf';const label=q?'방전 충전 '+Math.ceil((3-(s.hold||0))*10)/10+'초':'3초 밟기 · 광역 방전';ctx.strokeText(label,0,39);ctx.fillText(label,0,39)}ctx.restore();
};
function drawRedPulseGroundV579(g){
 const w=redPulseV579.wave();if(!w)return;const q=clamp(w.age/w.life,0,1),fade=(1-q)**.65,r=w.radius,band=42+q*38;
 g.save();g.globalCompositeOperation='lighter';const glow=g.createRadialGradient(w.x,w.y,Math.max(0,r-band),w.x,w.y,Math.max(1,r+band));glow.addColorStop(0,'rgba(255,10,28,0)');glow.addColorStop(.34,'rgba(240,8,35,'+(.15*fade)+')');glow.addColorStop(.56,'rgba(255,45,48,'+(.46*fade)+')');glow.addColorStop(1,'rgba(255,15,30,0)');g.fillStyle=glow;g.beginPath();g.arc(w.x,w.y,r+band,0,TAU);g.fill();
 for(const [offset,width,color,alpha] of [[0,12,'#ff3545',.72],[-13,5,'#ff775e',.5],[-26,3,'#ec204b',.36],[0,3.8,'#fff1d9',.86]]){g.strokeStyle=color;g.globalAlpha=fade*alpha;g.lineWidth=width;g.beginPath();g.arc(w.x,w.y,Math.max(0,r+offset),0,TAU);g.stroke();}
 for(let strand=0;strand<2;strand++){
  g.globalAlpha=fade*(strand?.55:.9);g.strokeStyle=strand?'#ff727c':'#ffe0c2';g.lineWidth=strand?2.1:3;g.lineJoin='round';g.beginPath();
  for(let i=0;i<=144;i++){const a=i/144*TAU,hash=Math.sin((i%144)*127.1+w.seed*311.7+strand*73.9+Math.floor(w.age*18)*41.3)*43758.5453,noise=(hash-Math.floor(hash))*2-1,rr=Math.max(0,r+(noise*12)*(Math.sin(Math.min(1,w.age/.78)*Math.PI)*.55+.45)-strand*17),x=w.x+Math.cos(a)*rr,y=w.y+Math.sin(a)*rr;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.stroke();
 }
 g.restore();
}
function drawRedPulseTopV579(g){const w=redPulseV579.wave();if(!w)return;g.save();g.globalCompositeOperation='lighter';if(w.age<.2){const p=w.age/.2,rr=25+p*70;g.globalAlpha=(1-p)*.85;const glow=g.createRadialGradient(w.x,w.y,0,w.x,w.y,rr);glow.addColorStop(0,'#fff4bd');glow.addColorStop(.2,'#ff7849');glow.addColorStop(1,'rgba(255,8,27,0)');g.fillStyle=glow;g.fillRect(w.x-rr,w.y-rr,rr*2,rr*2)}g.restore()}
const redPulseHomeBaseV579=returnToHome;returnToHome=function(...args){redPulseV579.reset();return redPulseHomeBaseV579(...args)};
window.__EVOLVE_RED_PULSE_V579__={ready:redPulseImageReadyV579,read:()=>({...redPulseV579.read(),artReady:!!redPulseSurfaceV579,artError:redPulseArtErrorV579,sites:worldSites.filter(s=>!s.claimed).map(s=>({type:s.type,x:s.x,y:s.y,hold:s.hold,hidden:!!s.arenaHidden})),holdSeconds:3,respawnSeconds:60})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_RED_PULSE_V579__.test={step:dt=>updateWorldSites(dt),reset:()=>buildWorldSites(),device:()=>worldSites.find(s=>s.type==='redPulse'&&!s.claimed),wave:()=>redPulseV579.wave(),ensure:()=>redPulseV579.ensure(),view:()=>cameraRect(0),drawGround:drawRedPulseGroundV579,drawTop:drawRedPulseTopV579};
