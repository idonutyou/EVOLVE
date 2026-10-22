// WEB-12: a map-centered boss encounter, with all combat bodies confined to its fence.
function centeredArenaLayoutV579(width,worldWidth,worldHeight){const side=Math.min(width*2,worldWidth-32,worldHeight-32),x=worldWidth/2,y=worldHeight/2;return {l:x-side/2,r:x+side/2,t:y-side/2,b:y+side/2,x,y,side}}
function centeredArenaEdgesV579(a,r=10){const p=(a.half||12)+r+18,points=[];for(let edge=0;edge<4;edge++)for(let i=0;i<24;i++){const u=(i+.5)/24;points.push({x:edge===1?a.r-p:edge===3?a.l+p:a.l+p+u*(a.r-a.l-p*2),y:edge===0?a.t+p:edge===2?a.b-p:a.t+p+u*(a.b-a.t-p*2)})}return points}
function placePlayerNearArenaCenterV579(){
 const a=bossArena;if(!a?.v526)return;const d=Math.min(115,a.side*.22),candidates=[];
 for(const radius of [d,d*.7,d*1.25,40,0])for(let i=0;i<16;i++){const angle=Math.PI/2+i*TAU/16;candidates.push({x:a.x+Math.cos(angle)*radius,y:a.y+Math.sin(angle)*radius})}
 const q=candidates.find(p=>terrainBodyClearV505(p,player.r+2))||{x:a.x,y:a.y+d};player.x=q.x;player.y=q.y;player.vx=player.vy=player.kx=player.ky=0;player.inv=Math.max(player.inv,2);joy.active=false;joy.dx=joy.dy=0;for(const k of Object.keys(keys))keys[k]=false;constrainArenaV526(player,player.r);
}
const arenaPrepareBaseV579=prepareBossArena;prepareBossArena=function(...args){const out=arenaPrepareBaseV579(...args);placePlayerNearArenaCenterV579();return out};
const arenaEntryBaseV579=bossEntryPlan;bossEntryPlan=function(...args){const a=bossArena;if(a?.v526&&a.active)return {side:'CENTER',x:a.x,y:a.y,tx:a.x,ty:a.y};return arenaEntryBaseV579(...args)};
const arenaArrivalBaseV579=stageMajorArrival;stageMajorArrival=function(e,...args){const out=arenaArrivalBaseV579(e,...args);if(e?.finalBoss&&bossArena?.active){e.x=e.arrivalStartX=e.arrivalTargetX=WORLD_W/2;e.y=e.arrivalStartY=e.arrivalTargetY=WORLD_H/2;e.vx=e.vy=e.kx=e.ky=0;}return out};
let arenaEdgeSerialV579=0;
function placeArenaAddV579(e){const a=bossArena;if(!a?.v526||!a.active||!e||e.dead||e.finalBoss)return false;const points=centeredArenaEdgesV579(a,e.r),offset=arenaEdgeSerialV579++%points.length;
 for(let i=0;i<points.length;i++){const p=points[(offset+i*29)%points.length];if(!terrainBodyClearV505(p,e.r+1)||enemies.some(q=>q!==e&&!q.dead&&Math.hypot(q.x-p.x,q.y-p.y)<e.r+(q.r||8)+5))continue;e.x=p.x;e.y=p.y;e.vx=e.vy=e.kx=e.ky=0;e.bossArenaBornV579=true;e.mapDoorSpawnV562=true;e.farLife=0;constrainArenaV526(e,e.r);return true;}e.dead=true;e.despawnedV579=true;return false;
}
const arenaSpawnBaseV579=spawnEnemy;spawnEnemy=function(...args){const e=arenaSpawnBaseV579(...args);if(e&&!e.dead&&bossArena?.active){if(e.finalBoss){e.x=WORLD_W/2;e.y=WORLD_H/2;}else if(!e.venomAddV553)placeArenaAddV579(e);else e.bossArenaBornV579=true;}return e};
const arenaMoveBaseV579=moveTerrainBodyV418;moveTerrainBodyV418=function(o,...args){const out=arenaMoveBaseV579(o,...args);if(o===player||o?.type&&Number.isFinite(o.hp))constrainArenaV526(o,o.r||args[2]||10);return out};
const arenaResolveBaseV579=resolveTerrainBody;resolveTerrainBody=function(o,...args){const out=arenaResolveBaseV579(o,...args);if(o===player||o?.type&&Number.isFinite(o.hp))constrainArenaV526(o,o.r||args[0]||10);return out};
const arenaUpdateBaseV579=update;update=function(...args){const out=arenaUpdateBaseV579(...args);if(bossArena?.v526&&bossArena.active){for(const e of enemies)if(!e.dead){if(e.finalBoss&&e.arrivalInvuln){e.x=e.arrivalStartX=e.arrivalTargetX=WORLD_W/2;e.y=e.arrivalStartY=e.arrivalTargetY=WORLD_H/2;}constrainArenaV526(e,e.r)}constrainArenaV526(player,player.r)}return out};
window.__EVOLVE_CENTERED_ARENA_V579__={read:()=>({mapCenter:{x:WORLD_W/2,y:WORLD_H/2},arena:bossArena?.v526?{x:bossArena.x,y:bossArena.y,l:bossArena.l,r:bossArena.r,t:bossArena.t,b:bossArena.b,half:bossArena.half}:null})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_CENTERED_ARENA_V579__.test={prepare:()=>prepareBossArena(),edges:r=>centeredArenaEdgesV579(bossArena,r),spawn:()=>spawnEnemy('crawler'),clamp:(e,r)=>constrainArenaV526(e,r),restore:()=>restoreBossArena(),layout:centeredArenaLayoutV579};
