/* Presentation-only additions layered on the unchanged WEB-37 game engine. */
(() => {
 'use strict';
 function node(markup){const t=document.createElement('template');t.innerHTML=markup;return t.content.firstElementChild;}
// Reference image remains byte-for-byte original; SVG windows select ROW 1 only.
const controls={"source":"art/home-controls-v606/reference.png","sha256":"0cdb7abf01c2796bbe97652184777e8939b337308dd3c0b5fc78f5bf99624eb8","width":1536,"height":1024,"icons":{"shop":[182,43,87,82],"parts":[425,39,83,87],"battle":[708,31,122,97],"challenge":[1025,40,93,85],"codex":[1283,42,97,82]},"startMaterial":[637,842,76,126],"icon_reference_row":1,"start_material_reference_row":5,"source_bytes_unchanged":true,"path":"assets/0cdb7abf01c2796bbe97652184777e8939b337308dd3c0b5fc78f5bf99624eb8.png","material":{"source":"art/home-balance-v607/start-material.png","sha256":"e74daffae533812ff998b2c97abd61df6b32fd5f5cfc81fedb1b93ccbfdbceeb","reference":"upload/03-1000027706.jpg","reference_material_row":3,"source_bytes_unchanged":true,"path":"assets/e74daffae533812ff998b2c97abd61df6b32fd5f5cfc81fedb1b93ccbfdbceeb.png"}};
function homeHubGlyphV601(key){
 const [x,y,w,h]=controls.icons[key],id='hubReferenceKeyV606_'+key;
 const alpha=key==='battle'?'0 4 0 0 -1.6':'.2126 .7152 .0722 0 0';
 return node(`<svg class="hubGlyphV601 hubGlyphFlatV604" data-glyph="${key}" data-reference-row="1" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><defs><filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 ${alpha}"/><feComponentTransfer><feFuncA type="linear" slope="${key==='battle'?1:3.5}" intercept="${key==='battle'?0:-.55}"/></feComponentTransfer></filter></defs><image href="${controls.path}" x="${-x}" y="${-y}" width="1536" height="1024" filter="url(#${id})"/></svg>`);
}
 function install(){
  const frame=document.querySelector('.hubStartFrameV601'),buttons=[...document.querySelectorAll('#homeTabs>button')];
  if(!frame||buttons.length!==5||!buttons.every(b=>b.querySelector('.hubGlyphV601')))return false;
  if(frame.dataset.materialV606==='ready')return true;
  for(const button of buttons){const old=button.querySelector('.hubGlyphV601');old.replaceWith(homeHubGlyphV601(old.dataset.glyph));}
 // Replace the complete recessed surface with one uninterrupted reference-derived image.
 const interior='M70 29H165L177 36H535L548 29H640L657 46V95L641 113H69L53 96V45Z';
 const material=node(`<svg xmlns="http://www.w3.org/2000/svg"><g class="hubStartMaterialV606" data-reference-row="5" data-reference-image="3"><defs><clipPath id="hubStartInteriorV607"><path d="${interior}"/></clipPath><filter id="hubStartGlowV607" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><g clip-path="url(#hubStartInteriorV607)"><image class="hubStartTextureV607" href="${controls.material.path}" x="53" y="29" width="604" height="84" preserveAspectRatio="none"/><path d="${interior}" fill="none" stroke="#ff9c27" stroke-width="3.2" opacity=".8" filter="url(#hubStartGlowV607)"/></g></g></svg>`);
 frame.appendChild(material.firstElementChild);

  frame.dataset.materialV606='ready';
  window.__EVOLVE_HOME_CONTROLS_V606__={referenceRow:1,startMaterialRow:5,originalNavigationFrame:true};
  return true;
 }
 function start(){if(install())return;const observer=new MutationObserver(()=>{if(install())observer.disconnect();});observer.observe(document.getElementById('poster')||document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
