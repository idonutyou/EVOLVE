// Shared bounded combat geometry. Also used by the meaningful Node regression checks.
const ORGAN_SKILL_MODEL_V598=(()=>{
 const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const profiles={
  spike:{organ:'shell',slot:'skin',mode:'homing',element:'physical',color:'#e9ddc1'},
  whip:{organ:'tail',slot:'tail',mode:'sweep',element:'physical',color:'#dcc9b4'},
  spit:{organ:'mouth',slot:'head',mode:'projectile',element:'physical',color:'#d8e9d3'},
  poison_spit:{organ:'mouth',slot:'head',mode:'projectile',element:'poison',color:'#a6dc62'},
  fire_breath:{organ:'mouth',slot:'head',mode:'breath',element:'fire',color:'#ff9858'},
  ice_spit:{organ:'mouth',slot:'head',mode:'projectile',element:'ice',color:'#a7e0ee'},
  ice_breath:{organ:'mouth',slot:'head',mode:'breath',element:'ice',color:'#a7e0ee'},
  poison_spike:{organ:'shell',slot:'skin',mode:'homing',element:'poison',color:'#b3d47a'},
  ice_spike:{organ:'shell',slot:'skin',mode:'homing',element:'ice',color:'#b9e7ed'},
  poison_whip:{organ:'tail',slot:'tail',mode:'sweep',element:'poison',color:'#b4cc84'}
 };
 function spec(organ,level,s={},variant){
  const n=k=>Math.max(0,Number(s[k])||0),base=organ==='shell'?'spike':organ==='tail'?'whip':'spit';
  const profile=profiles[variant]?.organ===organ?profiles[variant]:profiles[base];
  if(!(level>0))return {enabled:false,organ,...profile};
  const prefix=organ==='shell'?'spike':organ==='tail'?'whip':'spit';
  const common={enabled:true,organ,...profile,damage:(organ==='shell'?19:organ==='tail'?28:24)*(1+n(prefix+'Damage'))};
  if(organ==='tail')return {...common,radius:Math.min(90,30*(1+n('whipRange'))+Math.min(12,Math.max(0,level-1))*.7),arc:clamp((125+n('whipArc'))*Math.PI/180,.1,TAU),cooldown:Math.max(.22,1.48/(1+n('whipHaste'))),push:Math.min(400,82*(1+n('whipPush'))),duration:.42};
  return {...common,count:clamp(1+Math.floor(n(prefix+'Count')),1,12),hits:clamp(1+Math.floor(n(prefix+'Pierce')),1,9),range:Math.min(1800,(organ==='shell'?300:275)*(1+n(prefix+'Range'))),speed:organ==='shell'?330:275,cooldown:Math.max(.14,(organ==='shell'?1.34:1.42)/(1+n(prefix+'Haste'))),turn:8};
 }
 function segmentHit(a,b,e,r=0){
  const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?clamp(((e.x-a.x)*dx+(e.y-a.y)*dy)/l,0,1):0;
  const radius=(e.r||0)+r;return (a.x+dx*t-e.x)**2+(a.y+dy*t-e.y)**2<=radius*radius?t:null;
 }
 function angle(a){return Math.atan2(Math.sin(a),Math.cos(a));}
 function sweepWindow(age,dt,arc){
  const p=v=>clamp((v-.055)/.285,0,1);if(age<.055||age-dt>.34)return null;
  return {lo:-arc/2+p(Math.max(.055,age-dt))*arc,hi:-arc/2+p(Math.min(.34,age))*arc};
 }
 function sweepHit(center,aim,radius,window,e){
  if(!window)return false;const dx=e.x-center.x,dy=e.y-center.y,d=Math.hypot(dx,dy),r=e.r||0;if(d>radius+r)return false;
  const a=angle(Math.atan2(dy,dx)-aim),edge=Math.asin(Math.min(1,r/Math.max(r,d)||0));return a+edge>=window.lo&&a-edge<=window.hi;
 }
 return {profiles,spec,segmentHit,angle,sweepWindow,sweepHit};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ORGAN_SKILL_MODEL_V598;
