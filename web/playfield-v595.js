// Re-entering the same prepared map must not recompose five million collision samples.
let mapFlightV595=null,mapPrepareCountV595=0,mapReuseCountV595=0;
const mapPrepareBaseV595=campaignPrepareStageV567;
campaignPrepareStageV567=function(stage){
 const id=campaignMapForStageV567(stage);
 if(!campaignLoadingV567&&id===(campaignActiveV567?.id||null)&&(!id||mapReadyV562)&&!mapEditBootBusyV562){mapReuseCountV595++;return Promise.resolve(true);}
 if(mapFlightV595?.id===id&&campaignRequestedV567===id)return mapFlightV595.task;
 if(campaignLoadingV567&&campaignRequestedV567===id){
  return new Promise(resolve=>{const check=()=>{if(campaignRequestedV567!==id)return resolve(false);if(!campaignLoadingV567)return resolve(!id||mapReadyV562);setTimeout(check,25);};check();});
 }
 mapPrepareCountV595++;const flight={id,task:null};
 flight.task=mapPrepareBaseV595(stage).finally(()=>{if(mapFlightV595===flight)mapFlightV595=null;});mapFlightV595=flight;return flight.task;
};

const groundArtV595=JSON.parse('__GROUND_ART_V595__'),groundImageV595=new Image();
const groundReadyV595=new Promise((resolve,reject)=>{groundImageV595.onload=resolve;groundImageV595.onerror=()=>reject(Error('바닥 공격 이미지를 불러오지 못했습니다.'));});
groundImageV595.src=groundArtV595.path;
let groundStampsV595=0;
function prepareGroundFieldsV595(){
 for(const [list,purge] of [[purges,true],[biomeHazards,false]])for(const z of list){
  if(z.groundPreparedV595)continue;z.groundPreparedV595=true;z.originalRadiusV595=z.r;
  z.r=purge?Math.max(72,z.r*1.65):z.r*(z.warn>0?1.5:1.35);
  if(z.warn>0)z.warn=Math.max(z.warn,purge?1.25:1.1);
  z.groundWarningV595=Math.max(.1,z.warn||0);z.groundPurgeV595=purge;
 }
}
function paintGroundFieldV595(z,purge,floor=false){
 if(!worldCircleVisibleV441(z.x,z.y,z.r,40))return;
 const warning=z.warn>0,pulse=.5+.5*Math.sin(t*8),label=purge?upgradeTextV593('시설 정화','PURGE'):upgradeTextV593(z.kind==='cryo'?'냉각 분출':'화염 분출',z.kind==='cryo'?'CRYO VENT':'FIRE VENT');
 ctx.save();ctx.translate(z.x,z.y);
 if(!warning&&floor){
  ctx.save();ctx.beginPath();ctx.arc(0,0,z.r,0,TAU);ctx.clip();ctx.globalAlpha=.78+.10*pulse;
  // Clip the rendered eruption to the exact damage radius. Sparks cannot imply extra damage.
  if(groundImageV595.complete&&groundImageV595.naturalWidth){ctx.drawImage(groundImageV595,-z.r*1.03,-z.r*1.03,z.r*2.06,z.r*2.06);groundStampsV595++;}
  else{ctx.fillStyle='rgba(255,37,17,.55)';ctx.fillRect(-z.r,-z.r,z.r*2,z.r*2);}
  ctx.restore();
 }
 if(floor){ctx.restore();return;}
 if(!warning){ctx.strokeStyle='#ff6548';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,z.r,0,TAU);ctx.stroke();}
 else{
  ctx.strokeStyle='#ffb09a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,z.r*.95,-Math.PI/2,-Math.PI/2+TAU*Math.max(0,1-z.warn/(z.groundWarningV595||1.25)));ctx.stroke();
 }
 ctx.font='600 10px "EVOLVE Upgrade Sans",system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 const text=label+' · '+(warning?upgradeTextV593('대피','MOVE'):upgradeTextV593('위험','DANGER')),width=ctx.measureText(text).width+14;
 ctx.fillStyle='#140606df';ctx.fillRect(-width/2,-z.r-21,width,17);ctx.fillStyle=warning?'#ffd2c3':'#ffb099';ctx.fillText(text,0,-z.r-12.5);ctx.restore();
}
const groundWarningBaseV595=drawAttackWarningsV582;
drawAttackWarningsV582=function(){groundWarningBaseV595();for(const z of purges)paintGroundFieldV595(z,true);for(const z of biomeHazards)paintGroundFieldV595(z,false);};
const groundUpdateBaseV595=update;
update=function(dt){prepareGroundFieldsV595();const result=groundUpdateBaseV595(dt);prepareGroundFieldsV595();return result;};
const startupReadyV595=Promise.all([groundReadyV595,upgradeSkinReadyV594]).then(()=>new Promise((resolve,reject)=>{
 const check=()=>{if(window.__EVOLVE_ASSET_ERROR__||homeLoadErrorV522)return reject(Error(window.__EVOLVE_ASSET_ERROR__||homeLoadErrorV522));if(homeReadyV522&&!campaignLoadingV567&&(!campaignActiveV567||mapReadyV562)&&!mapEditBootBusyV562)return resolve(true);setTimeout(check,30);};check();
}));
window.__EVOLVE_STARTUP_V595__={ready:startupReadyV595,read:()=>({mapPrepares:mapPrepareCountV595,mapReuses:mapReuseCountV595,ready:homeReadyV522&&!campaignLoadingV567&&(!campaignActiveV567||mapReadyV562),groundArt:groundArtV595.path,groundStamps:groundStampsV595})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_STARTUP_V595__.test={prepare:campaignPrepareStageV567,ground:prepareGroundFieldsV595,paint:paintGroundFieldV595,spawn:monsterCatalogSpawnOneV593,purges:()=>purges,biome:()=>biomeHazards};
