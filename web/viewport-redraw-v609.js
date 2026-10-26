// A viewport change clears the game canvas even while the simulation is paused.
// Redraw once per viewport event; preserve the paused clock and combat state.
let viewportPaintQueuedV609=false,viewportPaintsV609=0;
function queueViewportPaintV609(){
 if(viewportPaintQueuedV609)return;
 viewportPaintQueuedV609=true;
 requestAnimationFrame(()=>{
  viewportPaintQueuedV609=false;
  if(document.hidden)return;
  resize();frozenFrameDrawnV438=false;
  if(running&&!ended&&(paused||choosing||rewardChoosing)){
   draw();frozenFrameDrawnV438=true;viewportPaintsV609++;
  }
 });
}
addEventListener('resize',queueViewportPaintV609,{passive:true});
window.visualViewport?.addEventListener('resize',queueViewportPaintV609,{passive:true});
document.addEventListener('fullscreenchange',queueViewportPaintV609);
document.addEventListener('webkitfullscreenchange',queueViewportPaintV609);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueViewportPaintV609();});
new ResizeObserver(queueViewportPaintV609).observe(app);
window.__EVOLVE_VIEWPORT_V609__={read:()=>({redraws:viewportPaintsV609,width:W,height:H,pausedFrameReady:frozenFrameDrawnV438,simulationUnchanged:true})};
