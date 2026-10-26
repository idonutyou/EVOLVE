/* Fullscreen presentation only. Save keys, update timing and combat are unchanged. */
(() => {
 'use strict';
 let installPrompt=null,autoAttempted=false;
 const installed=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true||(window.matchMedia('(display-mode: fullscreen)').matches&&!active());
 const active=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
 const korean=()=>localStorage.getItem('EVOLVE_V575_TEST_UI_LANGUAGE_V1')!=='en';
 function sync(){
  document.documentElement.classList.toggle('evolveFullscreenV606',active()||installed());
  const b=document.getElementById('setFullscreenV606'),i=document.getElementById('installAppV606');
  if(b){b.textContent=korean()?(active()?'전체화면 해제':installed()?'전체화면 실행 중':'전체화면'):(active()?'EXIT FULLSCREEN':installed()?'FULLSCREEN APP':'FULLSCREEN');b.disabled=installed()||(!document.fullscreenEnabled&&!document.documentElement.webkitRequestFullscreen);}
  if(i){i.hidden=installed();i.textContent=korean()?'홈 화면에 설치':'INSTALL APP';}
 }
 async function enter(){
  if(active()||installed())return true;
  try{const root=document.documentElement;if(root.requestFullscreen)await root.requestFullscreen({navigationUI:'hide'});else if(root.webkitRequestFullscreen)await root.webkitRequestFullscreen();else return false;sync();return true;}catch(_){sync();return false;}
 }
 async function toggle(){if(active()){try{if(document.exitFullscreen)await document.exitFullscreen();else document.webkitExitFullscreen?.();}catch(_){}}else await enter();sync();}
 function setup(){
  const panel=document.getElementById('settingsPanel');if(!panel)return;
  const section=document.createElement('div');section.className='settingsSection';section.id='displaySettingsV606';
  section.innerHTML='<h3 data-i18n-ignore>DISPLAY</h3><div class="settingsGrid two"><button id="setFullscreenV606" class="settingBtn" type="button" data-i18n-ignore></button><button id="installAppV606" class="settingBtn" type="button" data-i18n-ignore></button></div><p id="installHintV606" hidden data-i18n-ignore></p>';
  panel.insertBefore(section,panel.querySelector('.settingsSection'));section.querySelector('h3').textContent=korean()?'화면':'DISPLAY';
  document.getElementById('setFullscreenV606').onclick=toggle;
  document.getElementById('installAppV606').onclick=async()=>{
   if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();await prompt.userChoice;sync();return;}
   const hint=document.getElementById('installHintV606');hint.hidden=false;hint.textContent=korean()?'크롬 메뉴(⋮) → 홈 화면에 추가 → 설치 후, 홈 화면의 EVOLVE 아이콘으로 실행하세요.':'Chrome menu (⋮) → Add to Home screen → Install, then open the EVOLVE icon.';
  };
  document.getElementById('settingsBtn')?.addEventListener('click',sync);
  document.addEventListener('click',event=>{if(autoAttempted||!event.isTrusted||!event.target.closest?.('#start')||!/Android/i.test(navigator.userAgent))return;autoAttempted=true;void enter();},true);
  sync();
 }
 addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;sync();});
 addEventListener('appinstalled',()=>{installPrompt=null;sync();});
 document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
 addEventListener('resize',sync);addEventListener('pageshow',sync);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
 window.__EVOLVE_DISPLAY_V606__={enter,toggle,read:()=>({fullscreen:active(),installed:installed(),installAvailable:!!installPrompt,autoAttempted})};
})();
