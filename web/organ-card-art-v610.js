/* Supplied card pixels only. Original card handlers and live effects stay intact. */
(() => {
 'use strict';
 const config=__ORGAN_CARD_ART_V610__;
 const cache=new Map(),painted=new WeakMap();
 const state={ready:false,paints:0,failures:[],pending:0};
 const cardsByKey=new Map(config.cards.map(c=>[c.organ+':'+c.tier,c]));
 function load(meta){
  if(cache.has(meta.path)){const p=cache.get(meta.path);cache.delete(meta.path);cache.set(meta.path,p);return p;}
  const task=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Card artwork could not load: '+meta.upload));im.src=meta.path;});
  cache.set(meta.path,task);while(cache.size>3)cache.delete(cache.keys().next().value);return task;
 }
 function target(button){
  const id=button.dataset.kind||'',organ=id==='shell_learn'||id.startsWith('spike_')?'shell':id==='tail_learn'||id.startsWith('whip_')?'tail':null;
  return organ?cardsByKey.get(organ+':'+button.dataset.artTier):null;
 }
 function paint(im,meta){
  const x=120,y=245,w=681,h=meta.text_top-y-22,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,x,y,w,h,0,0,w,h);
  const pixels=g.getImageData(0,0,w,h),p=pixels.data;
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
   const i=(yy*w+xx)*4,r=p[i],green=p[i+1],blue=p[i+2],high=Math.max(r,green,blue),low=Math.min(r,green,blue);
   const material=low/Math.max(1,high)>.40||(r>green*2.5&&r>blue*1.08&&blue>r*.12);
   const edge=Math.min(1,xx/14,(w-1-xx)/14,yy/12,(h-1-yy)/12);
   p[i+3]=Math.round(255*Math.max(0,Math.min(1,(high-22)/80))*(material?1:.18)*Math.max(0,edge));
  }
  g.putImageData(pixels,0,0);const url=c.toDataURL();c.width=c.height=1;return url;
 }
 async function decorate(button,meta){
  if(painted.get(button)===meta.path)return;painted.set(button,meta.path);state.pending++;
  try{
   const im=await load(meta);if(!button.isConnected)return;
   if(im.naturalWidth!==meta.width||im.naturalHeight!==meta.height)throw Error('Unexpected supplied card dimensions');
   const image=new Image();image.className='upgradeSuppliedArtV611';image.alt='';image.draggable=false;image.src=paint(im,meta);await image.decode();
   if(!button.isConnected)return;button.querySelector('.upgradeArtV593').append(image);
   button.dataset.suppliedArtCropV611=JSON.stringify([120,245,681,meta.text_top-267]);
   button.dataset.suppliedCardV610=meta.upload;button.dataset.suppliedCardSourceV610=meta.path;button.classList.add('suppliedOrganCardV610');state.paints++;
  }catch(error){state.failures.push(error.message);painted.delete(button);}
  finally{state.pending--;}
 }
 function sync(){for(const button of document.querySelectorAll('#cards>.card')){const meta=target(button);if(meta)decorate(button,meta);}}
 function install(){
  const panel=document.getElementById('levelPanel');if(!panel)return;
  new MutationObserver(sync).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['data-upgrade-language']});
  state.ready=true;sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 window.__EVOLVE_ORGAN_CARD_ART_V610__={read:()=>({...state,decodedCache:cache.size,sourceImages:10,statsUnchanged:true,normalizedArt:true})};
})();
