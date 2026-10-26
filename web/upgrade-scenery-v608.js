/* WEB-41: reference ornament around a visible, paused battlefield. */
(() => {
  'use strict';
  const reference = __UPGRADE_SCENERY_ART_V608__;
  const state = {ready:false, paints:0, language:'', failures:[]};
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => {const t=clamp(n);return t*t*(3-2*t);};
  const canvas = (w,h) => Object.assign(document.createElement('canvas'),{width:w,height:h});
  let original, panel, head, header, footerCanvas;

  function headerArt(language) {
    const c=canvas(864,446),g=c.getContext('2d',{willReadFrequently:true});
    g.drawImage(original,0,0,864,446,0,0,864,446);
    const plate=canvas(864,446),p=plate.getContext('2d');
    p.fill(new Path2D('M114 277L177 215H687L750 277V338L695 388H586L571 405H290L275 388H169L114 336Z'));
    const platePixels=p.getImageData(0,0,864,446).data;
    const pixels=g.getImageData(0,0,864,446),rgba=pixels.data;
    for(let y=0;y<446;y++)for(let x=0;x<864;x++) {
      const i=(y*864+x)*4,m=Math.max(rgba[i],rgba[i+1],rgba[i+2]);
      const alpha=platePixels[i+3]?1:smooth((m-7)/72);
      rgba[i+3]=Math.round(255*alpha*smooth(y/18)*smooth((445-y)/12));
    }
    g.putImageData(pixels,0,0);
    const mask=canvas(864,446),m=mask.getContext('2d');
    m.filter='blur(8px)';
    m.fill(new Path2D('M365 -18C348 66 299 122 227 163C148 192 85 257 36 351L20 464H844L828 351C779 257 716 192 637 163C565 122 516 66 499 -18Z'));
    g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);g.globalCompositeOperation='source-over';
    if(language==='en') {g.fillStyle='#03090f';g.fillRect(220,238,424,146);}
    return c;
  }

  function lowerArt() {
    const c=canvas(864,318),g=c.getContext('2d',{willReadFrequently:true});
    g.drawImage(original,0,1218,864,318,0,0,864,318);
    const pixels=g.getImageData(0,0,864,318),rgba=pixels.data;
    for(let y=0;y<318;y++)for(let x=0;x<864;x++) {
      const i=(y*864+x)*4,m=Math.max(rgba[i],rgba[i+1],rgba[i+2]);
      rgba[i+3]=Math.round(255*smooth((m-7)/86)*smooth((317-y)/16));
    }
    g.putImageData(pixels,0,0);
    const mask=canvas(864,318),m=mask.getContext('2d');
    m.filter='blur(9px)';
    m.fill(new Path2D('M-18 -18H882V-8C828 126 756 215 632 270C560 305 495 322 432 326C369 322 304 305 232 270C108 215 36 126 -18 -8Z'));
    g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);return c;
  }

  function syncReroll(language) {
    const button=document.getElementById('rerollBtn');if(!button)return;
    const decorated=button.querySelector('.upgradeRerollLabelV608');
    const remaining=decorated?button.dataset.rerollRemainingV608:button.textContent.match(/(\d+)\s*$/)?.[1];
    if(remaining===undefined)return;
    const key=language+':'+remaining;
    if(decorated&&button.dataset.rerollPresentationV608===key)return;
    const label=language==='en'?'REROLL':'다시 뽑기';
    button.innerHTML=`<svg class="upgradeRerollIconV608" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.5-1L20 9M4 15l2.4 3A7 7 0 0 0 17.9 17"/></svg><span class="upgradeRerollLabelV608">${label}</span><span class="upgradeRerollCountV608" aria-hidden="true">${remaining}</span>`;
    button.dataset.rerollRemainingV608=remaining;button.dataset.rerollPresentationV608=key;
    button.setAttribute('data-i18n-ignore','');
    button.setAttribute('aria-label',language==='en'?`Reroll, ${remaining} remaining`:`다시 뽑기, 남은 ${remaining}회`);
  }

  function sync() {
    if(!panel)return;
    const language=(window.EVOLVE_I18N?.getLanguage?.()||panel.dataset.upgradeLanguage)==='en'?'en':'ko';
    if(panel.dataset.upgradeLanguage!==language)panel.dataset.upgradeLanguage=language;
    const title=head.querySelector('h2'),subtitle=head.querySelector('p');
    const titleText=language==='en'?'LEVEL UP':'레벨 업';
    const subtitleText=language==='en'?'CHOOSE 1 UPGRADE':'강화 1개 선택';
    if(title&&title.textContent!==titleText)title.textContent=titleText;
    if(subtitle&&subtitle.textContent!==subtitleText)subtitle.textContent=subtitleText;
    const duplicate=document.getElementById('levelContext');
    if(duplicate)duplicate.setAttribute('aria-hidden','true');
    syncReroll(language);
    if(state.ready&&state.language!==language) {
      const art=headerArt(language);header.width=art.width;header.height=art.height;
      header.getContext('2d').drawImage(art,0,0);state.language=language;state.paints++;
    }
  }

  async function install() {
    panel=document.getElementById('levelPanel');head=panel?.querySelector('.levelHead');
    if(!panel||!head)throw Error('Upgrade presentation target is missing');
    panel.classList.add('upgradeSceneryV608');
    header=canvas(864,446);header.className='upgradeSceneryHeaderV608';header.setAttribute('aria-hidden','true');head.prepend(header);
    const footer=document.createElement('div');footer.className='upgradeFooterV608';
    footerCanvas=canvas(864,318);footerCanvas.className='upgradeSceneryFooterV608';footerCanvas.setAttribute('aria-hidden','true');footer.append(footerCanvas);
    const reroll=document.getElementById('rerollRow');panel.append(footer);if(reroll)footer.append(reroll);
    const observer=new MutationObserver(sync);
    observer.observe(document.getElementById('levelOverlay'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-upgrade-language','style']});
    sync();
    original=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Upgrade reference image could not load'));image.src=reference.path;});
    if(original.naturalWidth!==864||original.naturalHeight!==1536)throw Error('Unexpected upgrade reference dimensions');
    footerCanvas.getContext('2d').drawImage(lowerArt(),0,0);state.paints++;
    state.ready=true;panel.dataset.upgradeSceneryReady='true';sync();return true;
  }
  const ready=new Promise(resolve=>{
    const start=()=>install().then(resolve).catch(error=>{state.failures.push(error.message);resolve(false);});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  });
  window.__EVOLVE_UPGRADE_SCENERY_V608__={ready,read:()=>({...state,reference:reference.path,engineUnchanged:true,physical_Galaxy_S23_plus_tested:false})};
})();
