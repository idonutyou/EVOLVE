/* Web lifecycle only: preserve combat code and existing save keys. */
(() => {
  'use strict';
  const config=window.EVOLVE_WEB_CONFIG, $=id=>document.getElementById(id);
  let bytes=0,done=false,failed=false,latest=null;
  const progress={phase:'download',loaded:0,total:0,cached:0,network:0,files:0,totalFiles:0,started:0,percentage:0};
  let lastProgressPaint=0;
  function showProgress(force=false){
    const now=Date.now();if(!force&&now-lastProgressPaint<80)return;lastProgressPaint=now;
    progress.percentage=progress.total?Math.min(100,Math.floor(progress.loaded/progress.total*100)):0;
    const status=$('webStatus'),detail=$('webDetail'),meter=$('webProgress');
    if(status)status.textContent=progress.phase==='prepare'?'게임을 준비 중 · 다운로드 완료':'리소스를 다운로드 중 · '+progress.percentage+'%';
    if(meter)meter.value=progress.percentage;
    if(detail){
      const seconds=(now-progress.started)/1000,rate=seconds>.25?progress.network/seconds:0;
      const remaining=Math.max(0,progress.total-progress.loaded),eta=rate>0&&seconds>.8?Math.ceil(remaining/rate):null;
      const time=eta===null?'계산 중':eta<60?eta+'초':Math.floor(eta/60)+'분 '+eta%60+'초';
      detail.textContent=progress.phase==='prepare'?'다운로드한 리소스로 맵과 전투를 준비하고 있어.':(progress.loaded/1048576).toFixed(1)+' / '+(progress.total/1048576).toFixed(1)+' MB · 남은 시간 '+time;
    }
  }
  async function prepareResources(){
    const response=await fetch(new URL('asset-manifest.json',location.href),{cache:'no-store'});
    if(!response.ok)throw Error('리소스 목록을 불러오지 못했어.');
    const assets=(await response.json()).filter(e=>e.kind!=='web-shell');
    progress.total=assets.reduce((sum,e)=>sum+e.bytes,0);progress.totalFiles=assets.length;progress.started=Date.now();showProgress(true);
    let cache=null;try{if('caches' in window)cache=await caches.open('evolve-original-assets-v1:'+new URL('./',location.href).pathname);}catch(_){}
    let next=0;
    async function download(entry){
      const url=new URL(entry.path,location.href).href;
      if(cache&&await cache.match(url)){progress.loaded+=entry.bytes;progress.cached+=entry.bytes;progress.files++;showProgress();return;}
      const result=await fetch(url,{cache:'force-cache'});if(!result.ok)throw Error('리소스 다운로드가 중단됐어. 연결을 확인해 줘.');
      const storing=cache?cache.put(url,result.clone()).catch(()=>{}):null;let size=0;
      if(result.body?.getReader){
        const reader=result.body.getReader();while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;progress.loaded+=chunk.value.byteLength;progress.network+=chunk.value.byteLength;showProgress();}
      }else{size=(await result.arrayBuffer()).byteLength;progress.loaded+=size;progress.network+=size;}
      await storing;if(size!==entry.bytes){if(cache)await cache.delete(url);throw Error('일부 리소스가 완전히 다운로드되지 않았어. 다시 열어줘.');}
      progress.files++;showProgress();
    }
    await Promise.all(Array.from({length:4},async()=>{while(next<assets.length){const entry=assets[next++];await download(entry);}}));
    progress.phase='prepare';showProgress(true);
    for(const placeholder of document.querySelectorAll('script[data-evolve-src]')){
      await new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.async=false;script.src=placeholder.dataset.evolveSrc;
        if(placeholder.id){script.id=placeholder.id;placeholder.removeAttribute('id');}
        script.onload=resolve;script.onerror=()=>reject(Error('게임 실행 파일을 불러오지 못했어.'));document.body.appendChild(script);
      });
    }
    if(window.__EVOLVE_STARTUP_V595__)await window.__EVOLVE_STARTUP_V595__.ready;
    if(failed)return;done=true;progress.phase='ready';$('webLoader')?.remove();paint();
  }
  function fail(message){if(done)return;failed=true;const el=$('webStatus');if(el)el.textContent=message;const retry=$('webRetry');if(retry)retry.hidden=false;}
  window.EVOLVE_WEB_CLIENT={
    loaded(n){bytes+=n;if(config.preloadResources)return;if(!failed&&$('webStatus'))$('webStatus').textContent='실행 준비 '+Math.min(100,Math.round(bytes/config.scriptBytes*100))+'%';if(bytes>=config.scriptBytes&&!failed){done=true;$('webLoader')?.remove();}},
    failed(){fail('파일을 불러오지 못했어. 연결을 확인하고 다시 열어줘.');},
    read(){return {...progress,done,failed};}
  };
  addEventListener('error',e=>{if(e.message)fail('실행 준비 중 오류가 발생했어. 다시 열어줘.');});
  function home(){return done&&!failed&&!!window.EVOLVE_WEB_GUARD?.atHome();}
  function paint(){const el=$('webUpdate');if(el)el.hidden=!latest||!home();}
  async function check(){try{const url=new URL('version.json',location.href);url.searchParams.set('check',Date.now());const r=await fetch(url,{cache:'no-store'});if(!r.ok)return;const v=await r.json();latest=v.build&&v.build!==config.build?v:null;paint();}catch(_){}}
  function backup(){
    window.EVOLVE_WEB_GUARD.persist();
    const entries={};
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('EVOLVE_')&&!k.startsWith('EVOLVE_WEB_'))entries[k]=localStorage.getItem(k);}
    localStorage.setItem('EVOLVE_WEB_UPDATE_BACKUP_V1',JSON.stringify({at:new Date().toISOString(),version:config.version,entries}));
  }
  addEventListener('DOMContentLoaded',()=>{
    // Deferred game scripts can finish and remove the loader before this event.
    $('webRetry')?.addEventListener('click',()=>location.reload());
    $('webApply').onclick=()=>{if(!latest||!home())return;try{backup();}catch(_){$('webUpdateText').textContent='저장 백업 공간이 부족해. 설정에서 저장을 백업해 줘.';return;}location.reload();};
    setInterval(paint,1500);setInterval(check,300000);check();
    if('serviceWorker' in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname)))navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
    if(config.preloadResources)prepareResources().catch(e=>fail(e.message||'게임 준비 중 오류가 발생했어. 다시 열어줘.'));
  });
  addEventListener('online',check);addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
})();
