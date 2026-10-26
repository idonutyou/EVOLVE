/* Supplied card pixels only. Original card handlers and live effects stay intact. */
(() => {
 'use strict';
 const config={"cards":[{"upload":"01-1000027658.png","organ":"tail","tier":0,"rarity":"common","bytes":218931,"sha256":"4919c511ffa0d272d04074aa59381f8eedc5e3d2577620433beb2c7a0ae5026f","path":"assets/4919c511ffa0d272d04074aa59381f8eedc5e3d2577620433beb2c7a0ae5026f.png","width":921,"height":1536,"text_top":898,"rule_y":1027,"part_y":1290},{"upload":"02-1000027657.png","organ":"tail","tier":1,"rarity":"rare","bytes":288273,"sha256":"c780af5660f695115005750a3648fc746c5e87683ccfd87a08fe7391ca24f489","path":"assets/c780af5660f695115005750a3648fc746c5e87683ccfd87a08fe7391ca24f489.png","width":921,"height":1536,"text_top":898,"rule_y":1027,"part_y":1290},{"upload":"03-1000027653.png","organ":"tail","tier":2,"rarity":"epic","bytes":350399,"sha256":"fbe09aa300e0d3d8d92df6ea323efeec743ee524615f5c7e6152c7430f18fc76","path":"assets/fbe09aa300e0d3d8d92df6ea323efeec743ee524615f5c7e6152c7430f18fc76.png","width":921,"height":1536,"text_top":943,"rule_y":1067,"part_y":1334},{"upload":"04-1000027652.png","organ":"tail","tier":3,"rarity":"legendary","bytes":309937,"sha256":"be9f9a7f68c07f5b1fb71bc0a749b66290199e2db5de327f28e5e834a524eaa8","path":"assets/be9f9a7f68c07f5b1fb71bc0a749b66290199e2db5de327f28e5e834a524eaa8.png","width":921,"height":1536,"text_top":898,"rule_y":1027,"part_y":1290},{"upload":"05-1000027654.png","organ":"tail","tier":4,"rarity":"mythic","bytes":441934,"sha256":"8f4bcecaf0aa45c787bacb0ec42a13c1aef507807d2dc3ce0fc9014af775f838","path":"assets/8f4bcecaf0aa45c787bacb0ec42a13c1aef507807d2dc3ce0fc9014af775f838.png","width":921,"height":1536,"text_top":946,"rule_y":1075,"part_y":1341},{"upload":"06-1000027651.png","organ":"shell","tier":0,"rarity":"common","bytes":190423,"sha256":"36d03eb365b3330e44dfbe7a7526d33fe655b3b291d54458843178703697113a","path":"assets/36d03eb365b3330e44dfbe7a7526d33fe655b3b291d54458843178703697113a.png","width":921,"height":1536,"text_top":870,"rule_y":1010,"part_y":1290},{"upload":"07-1000027659.png","organ":"shell","tier":1,"rarity":"rare","bytes":273670,"sha256":"74d74af58070ec832f9c58150cb3e5f278231ea8c85935ae8cae1ffccf28f4d7","path":"assets/74d74af58070ec832f9c58150cb3e5f278231ea8c85935ae8cae1ffccf28f4d7.png","width":921,"height":1536,"text_top":870,"rule_y":1010,"part_y":1290},{"upload":"08-1000027660.png","organ":"shell","tier":2,"rarity":"epic","bytes":308982,"sha256":"18d100e966f7cd0b037294eecbf3faa539135b67d6ff7656eea0e152de0511cf","path":"assets/18d100e966f7cd0b037294eecbf3faa539135b67d6ff7656eea0e152de0511cf.png","width":921,"height":1536,"text_top":906,"rule_y":1045,"part_y":1325},{"upload":"09-1000027655.png","organ":"shell","tier":3,"rarity":"legendary","bytes":277081,"sha256":"9b48e108934f85477bea9915ca6673968650241762f9d4448654535e9e3c7806","path":"assets/9b48e108934f85477bea9915ca6673968650241762f9d4448654535e9e3c7806.png","width":921,"height":1536,"text_top":870,"rule_y":1010,"part_y":1290},{"upload":"10-1000027656.png","organ":"shell","tier":4,"rarity":"mythic","bytes":400347,"sha256":"98ed19a788044eab015805351f8f3fedc0a736b71ce71b6c18b096ef7d11b965","path":"assets/98ed19a788044eab015805351f8f3fedc0a736b71ce71b6c18b096ef7d11b965.png","width":921,"height":1536,"text_top":918,"rule_y":1055,"part_y":1342}],"live_stats":true,"engine_unchanged":true,"maximum_decoded_cards":3};
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
