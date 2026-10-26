// Repaint after resource restoration; never advance a paused simulation.
let viewportPaintQueuedV609=false,viewportPaintsV609=0,viewportForceV611=false,wasHiddenV611=false,recoveriesV611=0;
function queueViewportPaintV609(force=false){
 viewportForceV611 ||= force===true;
 if(viewportPaintQueuedV609)return;viewportPaintQueuedV609=true;
 requestAnimationFrame(()=>{
  viewportPaintQueuedV609=false;if(document.hidden)return;
  const forced=viewportForceV611;viewportForceV611=false;resize(forced);frozenFrameDrawnV438=false;
  if(running&&!ended&&(paused||choosing||rewardChoosing)&&!ctx.isContextLost?.()){draw();frozenFrameDrawnV438=true;viewportPaintsV609++;}
 });
}
function recoverDisplayV611(){
 if(document.hidden)return;
 try{
  renderedWorldKey='';worldChunkKeyV413='';worldChunksV413.clear();renderedWorld=null;renderedFront=null;mapSmokeSpritesV562=null;
  if(mapUnderLayerV575)mapUnderBuildV575(mapEditActiveV562);
  if(mutantV599.ready){const m=mutantV599,a=mutantArtV599;m.parts.full=mutantBuildPartV599(a.full);m.parts.body=mutantBuildPartV599(a.body);m.parts.tail=mutantBuildPartV599(a.tail);m.parts.legs=a.legs.map(l=>l.segments.map(mutantBuildPartV599));m.parts.tailParts=a.tailParts.map(mutantBuildPartV599);m.parts.armedBody=mutantWeaponBodyV599(m.parts.body);m.parts.armedFull=mutantWeaponBodyV599(m.parts.full);}
  if(upgradeSkinV594.ready){upgradeSkinV594.frames.length=0;upgradeSkinV594.icons={};upgradeSkinV594.art.clear();upgradeSkinV594.artMetrics.clear();organRunV598.art.clear();organRunV598.icons.clear();skinPaintActiveV594();}
  for(const c of document.querySelectorAll('#parts .partIcon'))delete c.dataset.asset;updateRenderedDock();
  window.__EVOLVE_UPGRADE_SCENERY_V608__?.refresh?.();window.__EVOLVE_FIXED_VIEWPORT_V611__?.refreshText?.();recoveriesV611++;
 }finally{queueViewportPaintV609(true);setTimeout(()=>queueViewportPaintV609(true),120);setTimeout(()=>queueViewportPaintV609(true),500);}
}
addEventListener('resize',queueViewportPaintV609,{passive:true});window.visualViewport?.addEventListener('resize',queueViewportPaintV609,{passive:true});
document.addEventListener('fullscreenchange',queueViewportPaintV609);document.addEventListener('webkitfullscreenchange',queueViewportPaintV609);
document.addEventListener('visibilitychange',()=>{if(document.hidden)wasHiddenV611=true;else if(wasHiddenV611){wasHiddenV611=false;recoverDisplayV611();}else queueViewportPaintV609();});
addEventListener('pageshow',event=>{if(event.persisted)recoverDisplayV611();});canvas.addEventListener('contextrestored',recoverDisplayV611);
new ResizeObserver(queueViewportPaintV609).observe(app);
window.__EVOLVE_VIEWPORT_V609__={read:()=>({redraws:viewportPaintsV609,recoveries:recoveriesV611,width:W,height:H,pausedFrameReady:frozenFrameDrawnV438,simulationUnchanged:true})};
