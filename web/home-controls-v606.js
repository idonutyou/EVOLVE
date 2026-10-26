/* Presentation-only additions layered on the unchanged WEB-37 game engine. */
(() => {
 'use strict';
 function node(markup){const t=document.createElement('template');t.innerHTML=markup;return t.content.firstElementChild;}
// Reference image remains byte-for-byte original; SVG windows select ROW 1 only.
const controls=__HOME_CONTROLS_ART_V606__;
function homeHubGlyphV601(key){
 const [x,y,w,h]=controls.icons[key],id='hubReferenceKeyV606_'+key;
 return node(`<svg class="hubGlyphV601 hubGlyphFlatV604" data-glyph="${key}" data-reference-row="1" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><defs><filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 .2126 .7152 .0722 0 0"/><feComponentTransfer><feFuncA type="linear" slope="3.5" intercept="-.55"/></feComponentTransfer></filter></defs><image href="${controls.path}" x="${-x}" y="${-y}" width="1536" height="1024" filter="url(#${id})"/></svg>`);
}
 function install(){
  const frame=document.querySelector('.hubStartFrameV601'),buttons=[...document.querySelectorAll('#homeTabs>button')];
  if(!frame||buttons.length!==5||!buttons.every(b=>b.querySelector('.hubGlyphV601')))return false;
  if(frame.dataset.materialV606==='ready')return true;
  for(const button of buttons){const old=button.querySelector('.hubGlyphV601');old.replaceWith(homeHubGlyphV601(old.dataset.glyph));}
 // Overlay only the recessed material: the original outline, bevels and arrows stay intact.
 const interior='M83 32H164L176 39H537L549 32H629L642 46V94L629 107H82L69 94V46Z';
 const material=node(`<svg xmlns="http://www.w3.org/2000/svg"><g class="hubStartMaterialV606" data-reference-row="5"><defs><clipPath id="hubStartInteriorV606"><path d="${interior}"/></clipPath><pattern id="hubStartTextureV606" patternUnits="userSpaceOnUse" width="152" height="126" patternTransform="translate(28 25) scale(1.2 .7)"><svg x="0" y="0" width="76" height="126" viewBox="637 842 76 126" preserveAspectRatio="none"><image href="${controls.path}" width="1536" height="1024"/></svg><g transform="translate(152 0) scale(-1 1)"><svg width="76" height="126" viewBox="637 842 76 126" preserveAspectRatio="none"><image href="${controls.path}" width="1536" height="1024"/></svg></g></pattern><radialGradient id="hubStartHeatV606" cx=".5" cy="1" r=".8"><stop stop-color="#ff5a1210"/><stop offset=".72" stop-color="#8c080500"/><stop offset="1" stop-color="#ff6e172c"/></radialGradient><filter id="hubStartFeatherV606" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3.5"/></filter><mask id="hubStartMaterialMaskV606" maskUnits="userSpaceOnUse" x="60" y="24" width="594" height="92"><path d="${interior}" fill="white" filter="url(#hubStartFeatherV606)"/></mask></defs><g clip-path="url(#hubStartInteriorV606)" mask="url(#hubStartMaterialMaskV606)"><path d="${interior}" fill="url(#hubStartTextureV606)"/><path d="${interior}" fill="url(#hubStartHeatV606)"/></g></g></svg>`);
 frame.appendChild(material.firstElementChild);

  frame.dataset.materialV606='ready';
  window.__EVOLVE_HOME_CONTROLS_V606__={referenceRow:1,startMaterialRow:5,originalNavigationFrame:true};
  return true;
 }
 function start(){if(install())return;const observer=new MutationObserver(()=>{if(install())observer.disconnect();});observer.observe(document.getElementById('poster')||document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
