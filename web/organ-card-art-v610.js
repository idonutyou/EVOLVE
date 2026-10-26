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
  const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);
  const pixels=g.getImageData(0,0,c.width,c.height),p=pixels.data;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
   if(x>=45&&x<c.width-45&&y>=50&&y<1465)continue;
   const i=(y*c.width+x)*4;p[i+3]=Math.round(p[i+3]*Math.max(0,Math.min(1,(Math.max(p[i],p[i+1],p[i+2])-4)/28)));
  }
  g.putImageData(pixels,0,0);
  // Remove example words from the display layer so the original live DOM remains authoritative.
  // The source PNG on disk and its rarity-specific frame/illustration are unchanged.
  g.globalCompositeOperation='destination-out';g.fillRect(350,115,240,110);
  g.fillRect(110,meta.text_top,701,1370-meta.text_top);
  g.globalCompositeOperation='source-over';return c;
 }
 async function decorate(button,meta){
  if(painted.get(button)===meta.path)return;painted.set(button,meta.path);state.pending++;
  try{
   const im=await load(meta);if(!button.isConnected)return;
   if(im.naturalWidth!==meta.width||im.naturalHeight!==meta.height)throw Error('Unexpected supplied card dimensions');
   const c=paint(im,meta);c.className='upgradeSuppliedCardV610';c.setAttribute('aria-hidden','true');c.style.pointerEvents='none';button.prepend(c);
   const position=y=>(y/1536*1.095-.035)*100+'%';
   button.style.setProperty('--supplied-name-top',position(meta.text_top));
   button.style.setProperty('--supplied-stats-top',position(meta.rule_y));
   button.style.setProperty('--supplied-part-top',position(meta.part_y-65));
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
 window.__EVOLVE_ORGAN_CARD_ART_V610__={read:()=>({...state,decodedCache:cache.size,sourceImages:10,engineUnchanged:true,statsUnchanged:true})};
})();
