// WEB-30: the battle home depicts the selected destination; organisms stay in their own menu.
const homeMapArtV597=JSON.parse('__HOME_MAP_ART_V597__');
let homeMapPaintsV597=0,homeMapInitialResolveV597,homeMapInitialRejectV597;
const homeMapReadyV597=new Promise((resolve,reject)=>{homeMapInitialResolveV597=resolve;homeMapInitialRejectV597=reject;});
function homeMapDestinationV597(){
 const id=campaignMapForStageV567(homeSelectedStageV522)||'infected';
 const art=homeMapArtV597.maps[id]||homeMapArtV597.maps.infected;
 const definition=CAMPAIGN_MAPS_V567.find(map=>map.id===id);
 const name=homeTextV522(art.en,definition?.label||art.ko);
 return {id:art.id,name,art};
}
function paintHomeMapV597(){
 if(!window.__EVOLVE_HOME_MAPS_V597__)return;
 const destination=homeMapDestinationV597(),image=$('heroSpecimenImg'),hero=$('posterHero');
 homeSetTextV522('homeStageTitleV522',destination.name);hero.dataset.destination=destination.id;
 hero.dataset.opaqueMap=destination.art.opaque?'true':'false';
 hero.style.setProperty('--map-accent',destination.art.accent);
 image.alt=destination.name+' · '+homeTextV522('map miniature','맵 미니어처');
 image.setAttribute('data-i18n-ignore','');image.removeAttribute('data-origin-v522');
 if(image.dataset.mapId!==destination.id){
  image.dataset.mapId=destination.id;hero.dataset.ready='false';homeMapPaintsV597++;
  image.onload=()=>{hero.dataset.ready='true';homeMapInitialResolveV597(true);};
  image.onerror=()=>{hero.dataset.ready='error';homeMapInitialRejectV597(Error(homeTextV522('Map preview failed to load.','맵 미니어처를 불러오지 못했습니다.')));};
  image.src=destination.art.path;
  if(image.complete&&image.naturalWidth){hero.dataset.ready='true';homeMapInitialResolveV597(true);}
 }
}
window.__EVOLVE_HOME_MAPS_V597__={
 ready:homeMapReadyV597,
 read:()=>({stage:homeSelectedStageV522,...homeMapDestinationV597(),paints:homeMapPaintsV597,ready:$('posterHero').dataset.ready==='true',physical_Galaxy_S23_plus_tested:false}),
 list:()=>Object.values(homeMapArtV597.maps).map(art=>({id:art.id,ko:art.ko,en:art.en,path:art.path,width:art.width,height:art.height,sha256:art.sha256}))
};
paintHomeMapV597();
const homeStartupBaseV597=window.__EVOLVE_STARTUP_V595__.ready;
window.__EVOLVE_STARTUP_V595__.ready=Promise.all([homeStartupBaseV597,homeMapReadyV597]).then(()=>true);
