// WEB-15: one visible red danger pass after the map foreground. No image filters.
const attackWarningStyleV582=Object.freeze({fill:'rgba(255,24,48,0.30)',activeFill:'rgba(255,24,48,0.36)',edge:'#ff3545',contrast:'#38030b'});
const attackWarningStatsV582={frames:0,drawn:0,layer:'after-map-underpass',imageProcessing:false};
function attackWarningPaintV582(path,active=false,rule='nonzero'){
 if(!path)return;
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.setLineDash([]);
 ctx.fillStyle=active?attackWarningStyleV582.activeFill:attackWarningStyleV582.fill;ctx.fill(path,rule);
 ctx.lineJoin='round';ctx.strokeStyle=attackWarningStyleV582.contrast;ctx.lineWidth=5;ctx.stroke(path);
 ctx.strokeStyle=attackWarningStyleV582.edge;ctx.lineWidth=2.6;ctx.stroke(path);ctx.restore();attackWarningStatsV582.drawn++;
}
function attackWarningCircleV582(x,y,r,ry=r,a=0){
 if(!(r>0&&ry>0&&Number.isFinite(x)&&Number.isFinite(y)))return null;
 const p=new Path2D();p.ellipse(x,y,r,ry,a,0,Math.PI*2);return p;
}
function attackWarningSectorV582(x,y,r,a,half,inner=0){
 if(!(r>Math.max(0,inner)&&half>0))return null;
 const p=new Path2D(),lo=a-half,hi=a+half;
 p.moveTo(x+Math.cos(lo)*r,y+Math.sin(lo)*r);p.arc(x,y,r,lo,hi);
 if(inner>0){p.lineTo(x+Math.cos(hi)*inner,y+Math.sin(hi)*inner);p.arc(x,y,inner,hi,lo,true);}else p.lineTo(x,y);
 p.closePath();return p;
}
function attackWarningLaneV582(x,y,a,len,half,offset=0){
 if(!(len>0&&half>0))return null;
 const p=new Path2D(),c=Math.cos(a),s=Math.sin(a);
 for(const [i,[u,v]]of [[offset,-half],[offset+len,-half],[offset+len,half],[offset,half]].entries()){
  const px=x+c*u-s*v,py=y+s*u+c*v;i?p.lineTo(px,py):p.moveTo(px,py);
 }p.closePath();return p;
}
function drawLegacyAttackWarningV582(z){
 if(z.life<=0||z.owner?.dead||!telegraphVisibleV441(z))return;
 const paint=p=>attackWarningPaintV582(p,!!z.active),circle=(x=z.x,y=z.y,r=z.r||44)=>paint(attackWarningCircleV582(x,y,r)),a=z.a||0;
 if(z._bio489){
  if(z.done||z.active&&(z.charge||z.projectile))return;
  for(let i=0;i<z.areas.length;i++){const g=z.active?bioActiveAreaV492(z,z.areas[i],i):z.areas[i];if(g)attackWarningPaintV582(g.path,!!z.active,'evenodd');}return;
 }
 if(z.kind==='bioMelee'||z.kind==='acidBurst'&&isBioTitanV435(z.owner)){
  paint(attackWarningSectorV582(z.x,z.y,z.kind==='bioMelee'?z.r:330,a,z.kind==='bioMelee'?.95:.675));return;
 }
 if(['bioSpikes','counterNull','omegaLattice'].includes(z.kind)){for(const p of z.points||[])circle(p.x,p.y,z.r||32);return;}
 if(z.kind==='geneLattice'){const d=z.gap||100;for(const [x,y]of [[-d,-d],[d,-d],[-d,d],[d,d],[0,0]])circle(z.x+x,z.y+y,z.zoneRadius||34);return;}
 if(z.kind==='frostFan'){paint(attackWarningSectorV582(z.x,z.y,z.len||300,a,.58));return;}
 if(['frostCross','abyssCross'].includes(z.kind)){
  const len=z.len||300,half=z.kind==='abyssCross'?(z.w||20):(z.w||48)/2;
  const p=new Path2D();for(const aa of [a,a+Math.PI/2])p.addPath(attackWarningLaneV582(z.x,z.y,aa,len,half,-len/2));paint(p);return;
 }
 if(z.kind==='genesisFracture'){
  const p=new Path2D(),len=z.len||360;for(const d of z.offsets||[-48,0,48])p.addPath(attackWarningLaneV582(z.x-Math.sin(a)*d,z.y+Math.cos(a)*d,a,len,z.w||18,-len/2));paint(p);return;
 }
 if(['charge','frostLine','runnerDash','emberCharge','apexSweep'].includes(z.kind)){
  const half=z.kind==='frostLine'?(z.w||22)/2:z.kind==='runnerDash'?6:z.kind==='emberCharge'?9:z.kind==='apexSweep'?30:26;
  paint(attackWarningLaneV582(z.x,z.y,a,z.len||230,half));return;
 }
 if(z.kind==='magmaCrown'){
  const phase=z.owner?bossPhaseV431(z.owner):1,count=phase>=3?7:6,r=z.r||135;
  for(let k=0;k<count;k++){const aa=k/count*Math.PI*2+.3;if(bossV490Arc(aa,z.safeA??0)<.48)continue;circle(z.x+Math.cos(aa)*r,z.y+Math.sin(aa)*r,26+phase*2);}return;
 }
 if(Number.isFinite(z.safeA)&&Number.isFinite(z.r)){
  const gap=z.safeW||.68;paint(attackWarningSectorV582(z.x,z.y,z.r,z.safeA+Math.PI,Math.PI-gap/2));return;
 }
 circle();
}
function drawBioAttackWarningV582(s){
 const {c,a,titan}=s;if(!c||c.stage==='RECOVERY')return;
 const active=c.stage==='ACTIVE',paint=p=>attackWarningPaintV582(p,active),sector=(aim,range=a.maxRange,half=a.halfAngle)=>paint(attackWarningSectorV582(titan.x,titan.y,range,aim,half));
 if(a.kind==='charge'||a.kind==='feast'&&s.feastStep==='rush'){
  const route=s.route(),body=s.body(),p=new Path2D(),arena=s.arena;
  for(let i=1;i<route.points.length;i++){
   const u=route.points[i-1],v=route.points[i],aa=Math.atan2(v.y-u.y,v.x-u.x),half=Math.hypot(body.rx*Math.sin(aa),body.ry*Math.cos(aa))+s.playerRadius;
   p.addPath(attackWarningLaneV582(u.x,u.y+s.bodyOffset,aa,Math.hypot(v.x-u.x,v.y-u.y),half));
  }
  ctx.save();if(arena?.active){ctx.beginPath();ctx.rect(arena.l+arena.half,arena.t+arena.half,arena.r-arena.l-arena.half*2,arena.b-arena.t-arena.half*2);ctx.clip();}paint(p);ctx.restore();return;
 }
 if(a.kind==='pulse'||a.kind==='feast'){
  for(const q of s.special()){
   if(q.kind==='slam'){paint(attackWarningCircleV582(q.x,q.y,q.r));continue;}
   const live=q.kind==='wave',inner=live?Math.max(0,q.r-q.width/2):(a.kind==='pulse'?a.ringStart:a.pulseStart),outer=live?q.r+q.width/2:q.r;
   const p=new Path2D();for(const [lo,hi]of s.arcs(q.aim,q.offset,q.half))p.addPath(attackWarningSectorV582(q.x,q.y,outer,(lo+hi)/2,(hi-lo)/2,inner));paint(p);
  }return;
 }
 if(a.kind==='cone'){sector(c.aim+c.side*.09);return;}
 if(a.kind==='twin'||a.kind==='rear'){for(const aa of a.kind==='twin'?[c.aim-.30*c.side,c.aim+.30*c.side]:[c.aim+Math.PI])sector(aa);return;}
 if(a.kind==='barrage'){
  const b=c.barrageV530;if(!b||!s.windup)return;const p=new Path2D();for(const aa of s.barrage(b,0))p.addPath(attackWarningLaneV582(b.originX,b.originY,aa,b.range-60,a.radius,60));paint(p);return;
 }
 if(a.kind==='volley'){
  const p=new Path2D();for(const off of new Set(a.spread))p.addPath(attackWarningLaneV582(titan.x,titan.y,c.aim+off,a.maxRange+60,21));paint(p);return;
 }
 if(['sacs','mortar','backfire','circle'].includes(a.kind)){
  const p=new Path2D();for(const q of c.sites?.length?c.sites:[{x:c.targetX,y:c.targetY,r:a.radius}])if(!q.impacted)p.addPath(attackWarningCircleV582(q.x,q.y,q.r||a.radius));paint(p);
 }
}
function drawVenomAttackWarningV582(s,sectorPath,reach){
 const e=s.boss,a=s.attack,g=s.geometry,paint=(p,active=false)=>attackWarningPaintV582(p,active);
 if(a){
  const k=a.key,repeat=k==='infection'&&a.stage==='active'&&a.infectionShots===1&&a.recastOrigin,windup=a.stage==='windup',active=a.stage==='active';
  if(windup||repeat||active&&['tentacle','breath','acid'].includes(k)){
   if(k==='tentacle')paint(sectorPath(e.x,e.y,e.r+g.tentacle,a.a,42.5*Math.PI/180),active);
   else if(k==='breath'){const b=s.breath;if(b&&!b.blocked)paint(sectorPath(b.x,b.y,b.len,b.a,b.half),active);}
   else if(k==='dart'){
    const p=new Path2D();for(const q of (a.bodyOrigins||VENOM_V537.bodyOrigins(e,a.a)).filter(p=>!p.blocked))p.addPath(attackWarningLaneV582(q.x,q.y,a.a,reach(q.x,q.y,a.a,g.dart,10),7));paint(p);
   }else if(k==='acid'){
    const p=new Path2D();for(const q of a.acidRays||[])p.addPath(attackWarningLaneV582(q.x,q.y,q.a,q.len,q.w/2));paint(p,active);
   }else if(k==='gland'){
    const p=new Path2D(),r=e.r+10+g.gland;for(let wave=0;wave<2;wave++)for(let i=0;i<22;i++){
     const aa=a.a+.09+(a.glandOffset||0)+(i+wave*.5)*Math.PI*2/22,start=e.r+10,len=reach(e.x,e.y,aa,r,9);if(len>start)p.addPath(attackWarningLaneV582(e.x,e.y,aa,len-start,7,start));
    }paint(p);
   }else if(k==='spore'){for(const q of a.sporeTargets||[])paint(attackWarningCircleV582(q.x,q.y,q.r));}
   else if(k==='infection'){const o=repeat?a.recastOrigin:e,p=new Path2D();for(let i=0;i<3;i++)p.addPath(sectorPath(o.x,o.y,o.r+g.infection,a.a+i*Math.PI*2/3,g.infectionHalf));paint(p);}
  }
 }
 for(const z of s.zones||[]){
  if(z.life<=0||z.harmless||!worldCircleVisibleV441(z.x,z.y,Math.max(z.r||0,z.rx||0,z.len/2||0),40))continue;
  let p;if(z.kind==='acid'){
   p=new Path2D();const c=Math.cos(z.a),sn=Math.sin(z.a),d=Math.max(0,z.len/2-z.w/2),x=z.x-c*d,y=z.y-sn*d;
   if(d>0)p.addPath(attackWarningLaneV582(x,y,z.a,d*2,z.w/2));p.addPath(attackWarningCircleV582(x,y,z.w/2));p.addPath(attackWarningCircleV582(z.x+c*d,z.y+sn*d,z.w/2));
  }else if(z.kind==='storm')p=attackWarningCircleV582(z.x,z.y,z.len/2,z.w/2,z.a);
  else if(z.kind==='leak')p=attackWarningCircleV582(z.x,z.y,z.rx||z.r,z.ry||z.r,z.a||0);
  else p=attackWarningCircleV582(z.x,z.y,z.r);
  paint(p,!(z.warn>0));
 }
 for(const z of s.clouds||[]){
  const windup=z.age<z.warn,r=windup?z.maxR:z.r,inner=windup?0:z.innerR||0;if(!(r>inner)||!windup&&!(z.alpha>0))continue;
  const p=sectorPath(z.x,z.y,r,0,Math.PI);if(inner>0)p.addPath(sectorPath(z.x,z.y,inner,0,Math.PI));attackWarningPaintV582(p,!windup,'evenodd');
 }
 for(const z of s.infections||[])for(let i=0;i<3;i++){
  const elapsed=z.time-i*s.infectionRhythm.frontGap;if(elapsed<0||elapsed>g.infection/g.infectionSpeed+1.5)continue;
  const front=z.r+Math.min(g.infection,elapsed*g.infectionSpeed),back=z.r+Math.max(0,(elapsed-1.5)*g.infectionSpeed),aa=z.a+i*Math.PI*2/3;if(front<=back)continue;
  const p=sectorPath(z.x,z.y,front,aa,g.infectionHalf);if(back>0)p.addPath(sectorPath(z.x,z.y,back,aa,g.infectionHalf));attackWarningPaintV582(p,true,'evenodd');
 }
}
function drawAttackWarningsV582(){
 attackWarningStatsV582.frames++;attackWarningStatsV582.drawn=0;
 for(const z of telegraphs)drawLegacyAttackWarningV582(z);
 for(const z of [...purges,...biomeHazards])if(worldCircleVisibleV441(z.x,z.y,z.r,40))attackWarningPaintV582(attackWarningCircleV582(z.x,z.y,z.r),!(z.warn>0));
 VENOM_RENDER_V539.drawWarningOverlay();
}
window.__EVOLVE_ATTACK_WARNINGS_V582__={read:()=>({...attackWarningStatsV582,...attackWarningStyleV582,foregroundFirst:true,physicalDeviceTested:false})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_ATTACK_WARNINGS_V582__.test={circle:attackWarningCircleV582,sector:attackWarningSectorV582,lane:attackWarningLaneV582,paint:attackWarningPaintV582,legacy:drawLegacyAttackWarningV582,bio:drawBioAttackWarningV582,venom:drawVenomAttackWarningV582,context:()=>({ctx,telegraphs,purges,biomeHazards})};
