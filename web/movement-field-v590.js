// WEB-23: movement-facing body, independent two-second weapon aim and reachable field spawns.
function createIndependentAimV590(holdSeconds=2){
 let moveAngle=0,attackAngle=0,remaining=0,attacks=0;
 const move=(dx,dy)=>{if(Math.hypot(dx,dy)>.015)moveAngle=Math.atan2(dy,dx);};
 return {
  reset(a=0){moveAngle=Number.isFinite(a)?a:0;attackAngle=moveAngle;remaining=0;attacks=0;},
  move,
  step(dt,dx,dy,moving){if(!(dt>0))return;remaining=Math.max(0,remaining-dt);if(moving)move(dx,dy);},
  attack(a){if(!Number.isFinite(a))return;attackAngle=a;remaining=holdSeconds;attacks++;},
  body:()=>moveAngle,
  weapon:()=>remaining>1e-8?attackAngle:moveAngle,
  read:()=>({bodyAngle:moveAngle,weaponAngle:remaining>1e-8?attackAngle:moveAngle,lastAttackAngle:attackAngle,holdRemaining:remaining,holdSeconds,attacks})
 };
}
function createReachableFieldSamplerV590(){
 let cache=null,builds=0,samples=0;
 function sample(host){
  const cell=host.cell||14,cols=Math.ceil(host.width/cell),rows=Math.ceil(host.height/cell),count=cols*rows,offset=host.offsetY||0;
  const point=k=>({x:(k%cols+.5)*cell,y:(((k/cols)|0)+.5)*cell-offset});
  const sx=Math.max(0,Math.min(cols-1,Math.floor(host.player.x/cell))),sy=Math.max(0,Math.min(rows-1,Math.floor((host.player.y+offset)/cell))),start=sy*cols+sx;
  if(!cache||cache.key!==host.key||cache.cols!==cols||cache.rows!==rows||!cache.reachable[start]){
   const state=new Uint8Array(count),reachable=new Uint8Array(count),queue=new Int32Array(count);
   const clear=k=>{if(k<0||k>=count)return false;if(!state[k]){const p=point(k);state[k]=host.clearFoot(p.x,p.y)?1:2;}return state[k]===1;};
   let seed=-1;
   for(let radius=0;radius<=3&&seed<0;radius++)for(let y=Math.max(0,sy-radius);y<=Math.min(rows-1,sy+radius)&&seed<0;y++)for(let x=Math.max(0,sx-radius);x<=Math.min(cols-1,sx+radius);x++){
    const k=y*cols+x;if(!clear(k))continue;const p=point(k),steps=Math.max(1,Math.ceil(Math.hypot(p.x-host.player.x,p.y-host.player.y)/3));let linked=true;
    for(let i=1;i<=steps;i++)if(!host.clearFoot(host.player.x+(p.x-host.player.x)*i/steps,host.player.y+(p.y-host.player.y)*i/steps)){linked=false;break;}
    if(linked){seed=k;break;}
   }
   if(seed<0)return null;
   let read=0,write=1;queue[0]=seed;reachable[seed]=1;
   while(read<write){const k=queue[read++],x=k%cols,y=(k/cols)|0;
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
     if(!ox&&!oy)continue;const xx=x+ox,yy=y+oy;if(xx<0||yy<0||xx>=cols||yy>=rows)continue;
     const j=yy*cols+xx;if(reachable[j]||!clear(j))continue;
     if(ox&&oy&&(!clear(y*cols+xx)||!clear(yy*cols+x)))continue;
     reachable[j]=1;queue[write++]=j;
    }
   }
   cache={key:host.key,cols,rows,reachable,members:queue.subarray(0,write)};builds++;
  }
  const random=host.random||Math.random;
  for(let attempt=0;attempt<600;attempt++){
   const k=cache.members[Math.floor(random()*cache.members.length)],p=point(k);
   p.x+=(random()-.5)*cell*.6;p.y+=(random()-.5)*cell*.6;
   const x=Math.floor(p.x/cell),y=Math.floor((p.y+offset)/cell);
   if(x<0||y<0||x>=cols||y>=rows||!cache.reachable[y*cols+x]||!host.clearFoot(p.x,p.y)||!host.clearSite(p.x,p.y))continue;
   samples++;return p;
  }
  return null;
 }
 return {sample,reset(){cache=null;},read:()=>({builds,samples,reachableCells:cache?.members.length||0})};
}

const playerFacingStateV590=createIndependentAimV590(2),fieldSpawnSamplerV590=createReachableFieldSamplerV590();
function playerBodyAngleV590(){return playerFacingStateV590.body();}
function playerWeaponAngleV590(){return playerFacingStateV590.weapon();}
function recordWeaponAttackV590(a){playerFacingStateV590.attack(a);}
function playerMovementStepV590(dt,dx,dy,moving){playerFacingStateV590.step(dt,dx,dy,moving);}
const facingDashBaseV590=dash;
dash=function(...args){const x=player.x,y=player.y,out=facingDashBaseV590(...args);playerFacingStateV590.move(player.x-x,player.y-y);return out;};
function redPulseFootClearV590(x,y){
 if(mapNavV562){const f=MAP_PLAYER_FOOT_V562;if(x<f.radius+f.halfX+2||x>WORLD_W-f.radius-f.halfX-2||y+f.offsetY<f.radius+2||y+f.offsetY>WORLD_H-f.radius-2)return false;return mapFootContactV562({x,y},player.r).d>=player.r-.06;}
 const half=terrainHalfV505(player),steps=Math.ceil(half/3);
 if(x<=player.r+2||y<=player.r+half+2||x>=WORLD_W-player.r-2||y>=WORLD_H-player.r-half-2)return false;
 for(let i=-steps;i<=steps;i++)if(!terrainBodyClearV505({x,y:y+(steps?i*half/steps:0)},player.r))return false;
 return true;
}
function redPulseSiteClearV590(x,y){
 const r=24;if(x<r+28||y<r+28||x>WORLD_W-r-28||y>WORLD_H-r-28)return false;
 if(mapNavV562){if(mapSignedDistanceV562(null,x,y)<r+4)return false;}
 else if(!terrainBodyClearV505({x,y},r+4))return false;
 return !worldSites.some(s=>!s.claimed&&Math.hypot(x-s.x,y-s.y)<Math.max(120,r+s.r+40))&&!contractNodes.some(s=>Math.hypot(x-s.x,y-s.y)<r+s.r+32);
}
function redPulseReachablePointV590(){
 return fieldSpawnSamplerV590.sample({key:mapNavV562||terrainNodes,width:WORLD_W,height:WORLD_H,cell:mapNavV562?.cell||14,offsetY:mapNavV562?MAP_PLAYER_FOOT_V562.offsetY:0,player,clearFoot:redPulseFootClearV590,clearSite:redPulseSiteClearV590});
}
const resetFacingBaseV590=playerMotionResetV586;
playerMotionResetV586=function(...args){const out=resetFacingBaseV590(...args);playerFacingStateV590.reset(0);return out;};
const facingReadBaseV590=window.__EVOLVE_PLAYER_SCORPION_V586__.read;
window.__EVOLVE_PLAYER_SCORPION_V586__.read=()=>({...facingReadBaseV590(),...playerFacingStateV590.read(),facing:playerFacingV587(playerBodyAngleV590(),playerMotionV586.facing)});
window.__EVOLVE_MOVEMENT_FIELD_V590__={read:()=>({...playerFacingStateV590.read(),fieldSpawns:fieldSpawnSamplerV590.read(),fieldRespawnSeconds:60,fieldSpreadSeconds:1.56,fieldStrokeWidth:12})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_MOVEMENT_FIELD_V590__.test={recordAttack:recordWeaponAttackV590,move:playerMovementStepV590,reset:()=>playerFacingStateV590.reset(0),weaponAngle:side=>armItemAngleV589(side,playerBodyAngleV590()),safeFoot:redPulseFootClearV590,safeSite:redPulseSiteClearV590,spawnPoint:redPulseReachablePointV590,resetSampler:()=>fieldSpawnSamplerV590.reset()};
