// WEB-25: unobtrusive hit-only health bars, grouped volley warnings and a shared tape layout.
function createEnemyHealthVisibilityV592(duration=1.2){
 const hits=new Map();
 return {
  mark(e,now,damage){if(!e||e.dead||e.arrivalInvuln||!(damage>0&&Number.isFinite(damage)))return false;hits.set(e,now+duration);return true;},
  each(now,visit){for(const [e,until]of hits){if(e.dead||e.hp<=0||now>=until){hits.delete(e);continue;}visit(e,Math.min(1,(until-now)/.25),until);}},
  clear(){hits.clear();},read:()=>({tracked:hits.size,duration})
 };
}
function enemyHealthBoxV592(p){
 const longest=Math.max(1,p.sourceWidth,p.sourceHeight),halfW=p.size*p.sourceWidth/longest*Math.abs(p.sx??1)/2,halfH=p.size*p.sourceHeight/longest*Math.abs(p.sy??1)/2,a=p.rotation||0;
 const bodyTop=p.y+(p.bob||0)-Math.abs(Math.sin(a))*halfW-Math.abs(Math.cos(a))*halfH-1.5;
 const width=Math.max(18,Math.min(p.elite?44:34,halfW*1.35)),height=3,gap=4;
 return {x:p.x-width/2,y:bodyTop-gap-height,width,height,bodyTop,gap};
}
function outerWarningHullV592(points){
 const sorted=points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).sort((a,b)=>a.x-b.x||a.y-b.y),q=sorted.filter((p,i)=>!i||p.x!==sorted[i-1].x||p.y!==sorted[i-1].y);
 if(q.length<3)return q;
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),half=list=>{const out=[];for(const p of list){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
 const lo=half(q),hi=half(q.slice().reverse());return lo.slice(0,-1).concat(hi.slice(0,-1));
}
function warningLaneCornersV592(q){
 if(!(q.len>0&&q.half>0))return [];
 const c=Math.cos(q.a),s=Math.sin(q.a);return [[0,-q.half],[q.len,-q.half],[q.len,q.half],[0,q.half]].map(([u,v])=>({x:q.x+c*u-s*v,y:q.y+s*u+c*v}));
}
function warningTapeLayoutV592(width,height,elapsed,reduced=false){
 const landscape=width>height,letterHeight=landscape?24:30;
 return {centerX:width/2,centerY:height*(landscape?.665:.675),height:letterHeight+26,letterHeight,angle:-2*Math.PI/180,drift:reduced?0:elapsed*40,speed:40};
}

const enemyHealthVisibilityV592=createEnemyHealthVisibilityV592(1.2);
const visualClarityStatsV592={healthBars:0,healthBoxes:[],volley:null,tape:null,tapeBuilds:0};
function markEnemyHitV592(e,damage){if(!e.finalBoss&&!e.elite&&!e.midBoss&&!e.nemesis)enemyHealthVisibilityV592.mark(e,t,damage);}
function enemyHealthLayoutV592(e){
 const img=renderedEnemy(e),crop=img?._spriteCrop||[0,0,img?.naturalWidth||1,img?.naturalHeight||1];
 const pose=e.elite||e.nemesis?{size:(e.bossName==='TITAN SENTINEL'?106.6:68)*1.12,sx:1,sy:1,rot:0,bob:0}:gpuEnemyVisualV426(e);
 return enemyHealthBoxV592({x:e.x,y:e.y,sourceWidth:crop[2],sourceHeight:crop[3],size:pose.size,sx:pose.sx,sy:pose.sy,rotation:pose.rot,bob:pose.bob,elite:e.elite});
}
function drawEnemyHealthBarsV592(){
 visualClarityStatsV592.healthBars=0;visualClarityStatsV592.healthBoxes.length=0;
 enemyHealthVisibilityV592.each(t,(e,alpha)=>{
  if(e.finalBoss||e.elite||e.midBoss||e.nemesis)return;
  if(!worldCircleVisibleV441(e.x,e.y,80,10))return;
  const b=enemyHealthLayoutV592(e),ratio=clamp(e.hp/Math.max(1,e.maxHp),0,1);
  ctx.save();ctx.globalAlpha=alpha;ctx.shadowBlur=0;ctx.fillStyle='#080b0eee';ctx.fillRect(b.x-1,b.y-1,b.width+2,b.height+2);ctx.fillStyle='#3b2023';ctx.fillRect(b.x,b.y,b.width,b.height);ctx.fillStyle='#e65b57';ctx.fillRect(b.x,b.y,b.width*ratio,b.height);ctx.restore();
  visualClarityStatsV592.healthBars++;if(visualClarityStatsV592.healthBoxes.length<32)visualClarityStatsV592.healthBoxes.push({type:e.type,...b,ratio});
 });
}
function venomVolleyPathV592(lanes){
 const valid=lanes.filter(q=>q.len>0&&q.half>0),hull=outerWarningHullV592(valid.flatMap(warningLaneCornersV592));
 visualClarityStatsV592.volley={lanes:valid.length,vertices:hull.length,paths:hull.length>=3?1:0};
 if(hull.length<3)return null;
 const p=new Path2D();hull.forEach((q,i)=>i?p.lineTo(q.x,q.y):p.moveTo(q.x,q.y));p.closePath();return p;
}
const visualResetBaseV592=reset,visualHomeBaseV592=returnToHome;
reset=function(...args){enemyHealthVisibilityV592.clear();return visualResetBaseV592(...args);};
returnToHome=function(...args){enemyHealthVisibilityV592.clear();return visualHomeBaseV592(...args);};
window.__EVOLVE_VISUAL_CLARITY_V592__={read:()=>({...visualClarityStatsV592,health:enemyHealthVisibilityV592.read(),spawnAndWaveRings:false,healthLayer:'after-map-foreground',dedicatedBossHUDPreserved:true,subtitleVisible:false,physical_Galaxy_S23_plus_tested:false})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_VISUAL_CLARITY_V592__.test={mark:markEnemyHitV592,layout:enemyHealthLayoutV592,health:drawEnemyHealthBarsV592,clear:()=>enemyHealthVisibilityV592.clear(),hull:outerWarningHullV592,lane:warningLaneCornersV592,volley:venomVolleyPathV592,tape:warningTapeLayoutV592,context:()=>({ctx,enemies,player,hurt:hurtEnemy,draw,clock:()=>t,setClock:value=>{t=value;}})};
