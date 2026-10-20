/* Web lifecycle only: preserve combat code and existing save keys. */
(() => {
  'use strict';
  const config=window.EVOLVE_WEB_CONFIG, $=id=>document.getElementById(id);
  let bytes=0,done=false,failed=false,latest=null;
  function fail(message){if(done)return;failed=true;const el=$('webStatus');if(el)el.textContent=message;const retry=$('webRetry');if(retry)retry.hidden=false;}
  window.EVOLVE_WEB_CLIENT={
    loaded(n){bytes+=n;if(!failed&&$('webStatus'))$('webStatus').textContent='실행 준비 '+Math.min(100,Math.round(bytes/config.scriptBytes*100))+'%';if(bytes>=config.scriptBytes&&!failed){done=true;$('webLoader')?.remove();}},
    failed(){fail('파일을 불러오지 못했어. 연결을 확인하고 다시 열어줘.');}
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
    $('webRetry').onclick=()=>location.reload();
    $('webApply').onclick=()=>{if(!latest||!home())return;try{backup();}catch(_){$('webUpdateText').textContent='저장 백업 공간이 부족해. 설정에서 저장을 백업해 줘.';return;}location.reload();};
    setInterval(paint,1500);setInterval(check,300000);check();
    if('serviceWorker' in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname)))navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
  });
  addEventListener('online',check);addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
})();
