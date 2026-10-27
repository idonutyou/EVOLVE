/* M04-60: inserted inside the game closure only on an opted-in development URL. */
if(window.__EVOLVE_DEV_CORE_VISUALS_V617__&&window.__EVOLVE_DEV_MOCK_STORE_V615__){
 const mockCoreVisualsV617=window.__EVOLVE_DEV_CORE_VISUALS_V617__;
 const mockCoreRendererV617=mockCoreVisualsV617.createRenderer((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
 const mockCoreStoreV617=window.__EVOLVE_DEV_MOCK_STORE_V615__.createStore({enabled:true,storage:window.localStorage});
 let mockCoreThemeV617=null,mockCoreErrorV617=null,mockCoreCombatDrawsV617=0;
 const mockCoreProfileV617='dev_local_profile_01';
 const mockCoreOverlayV617=document.createElement('canvas');
 mockCoreOverlayV617.id='m04CorePartsOverlayV617';mockCoreOverlayV617.setAttribute('aria-hidden','true');
 mockCoreOverlayV617.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:3;width:100%;height:100%';
 function mockCorePreviewPointV617(size){
  const a=mutantArtV599,r=a.full.rect,u=mutantBaseScaleV599;
  const f=Math.min(size*.86/(r[2]*u),size*.86/(r[3]*u),size/a.displaySize);
  const ox=size/2-(r[0]+r[2]/2)*u*f,oy=size/2-(r[1]+r[3]/2)*u*f;
  return {x:ox+a.shell[0]*u*f,y:oy+a.shell[1]*u*f,radius:110*u*f};
 }
 function mockCorePaintPartsV617(){
  const image=$('partsSpecimenImgV523'),parent=image?.parentElement;
  if(!parent||!mutantV599.ready)return;
  if(mockCoreOverlayV617.parentElement!==parent)parent.appendChild(mockCoreOverlayV617);
  const bounds=parent.getBoundingClientRect(),box=image.getBoundingClientRect();
  const w=Math.round(bounds.width),h=Math.round(bounds.height);
  if(!w||!h)return;
  if(mockCoreOverlayV617.width!==w)mockCoreOverlayV617.width=w;
  if(mockCoreOverlayV617.height!==h)mockCoreOverlayV617.height=h;
  const g=mockCoreOverlayV617.getContext('2d');g.clearRect(0,0,w,h);
  mockCoreOverlayV617.hidden=!mockCoreThemeV617;
  if(!mockCoreThemeV617)return;
  const side=Math.min(box.width,box.height),point=mockCorePreviewPointV617(1536),s=side/1536;
  mockCoreRendererV617.draw(g,mockCoreThemeV617,box.left-bounds.left+(box.width-side)/2+point.x*s,box.top-bounds.top+(box.height-side)/2+point.y*s,point.radius*s,1);
 }
 function mockCoreSyncV617(){
  try{
   const v=mockCoreStoreV617.snapshot(mockCoreProfileV617),id=v.equipped.core;
   mockCoreThemeV617=v.owned[id]===true&&Object.prototype.hasOwnProperty.call(mockCoreVisualsV617.themes,id)?id:null;
   mockCoreErrorV617=null;
  }catch(e){mockCoreThemeV617=null;mockCoreErrorV617=e.code||'MOCK_STORAGE_UNAVAILABLE';}
  mockCorePaintPartsV617();
  // The existing viewport repaint preserves paused/home simulation state.
  if(typeof queueViewportPaintV609==='function')queueViewportPaintV609();
 }
 const mockCoreDrawBaseV617=drawPlayer;
 drawPlayer=function(shadowOnly=false){
  const out=mockCoreDrawBaseV617(shadowOnly);
  if(!shadowOnly&&mockCoreThemeV617&&mutantV599.ready&&player.hp>0){
   const p=mutantSourceWorldV599(mutantBodyPointV599(mutantArtV599.shell));
   const blink=player.hurtBlink>0?.4:1;
   mockCoreRendererV617.draw(ctx,mockCoreThemeV617,p.x,p.y,110*mutantScaleV599,blink);
   mockCoreCombatDrawsV617++;
  }
  return out;
 };
 const mockCoreRefreshBaseV617=mutantRefreshV599;
 mutantRefreshV599=function(...args){const out=mockCoreRefreshBaseV617(...args);mockCorePaintPartsV617();return out;};
 window.addEventListener('evolve:dev-mock-change',mockCoreSyncV617);
 window.addEventListener('storage',e=>{if(e.key===mockCoreStoreV617.storageKey||e.key===null)mockCoreSyncV617();});
 window.addEventListener('pageshow',mockCoreSyncV617);
 window.addEventListener('resize',mockCorePaintPartsV617);
 window.__EVOLVE_DEV_CORE_BRIDGE_V617__=Object.freeze({
  mode:'MOCK_ONLY',sync:mockCoreSyncV617,
  read:()=>({theme:mockCoreThemeV617,error:mockCoreErrorV617,combatDraws:mockCoreCombatDrawsV617,...mockCoreRendererV617.read(),ready:mutantV599.ready}),
  preview:(id,size=320)=>{
   if(!mutantV599.ready)return null;
   const c=mutantPreviewV599('bare',size),p=mockCorePreviewPointV617(size);
   if(id)mockCoreRendererV617.draw(c.getContext('2d'),id,p.x,p.y,p.radius);
   return c;
  }
 });
 mutantReadyV599.then(()=>{
  mockCoreSyncV617();
  if(typeof ResizeObserver==='function')new ResizeObserver(mockCorePaintPartsV617).observe($('partsSpecimenImgV523'));
  window.dispatchEvent(new Event('evolve:dev-cosmetics-ready'));
 });
}
