// WEB-18: five consecutive presses of the real footer CODEX button reveal admin tools.
// No administrator flag is persisted; reopening the game always starts in normal mode.
{
 const notice=document.createElement('div');notice.id='adminNoticeV585';notice.hidden=true;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');document.body.appendChild(notice);let noticeTimer=0;
 const tell=message=>{clearTimeout(noticeTimer);notice.textContent=message;notice.hidden=false;noticeTimer=setTimeout(()=>{notice.hidden=true;},2200);};
 const persistSelection=()=>{if(!evolveAdminEnabledV585&&homeSelectedStageV522<=normalProgressV585.unlocked){normalProgressV585.stage=homeSelectedStageV522;saveNormalProgressV585();}};
 const select=selectHomeStageV522,home=returnToHome,start=startHomeBattleV522,grant=grantStageClearReward;
 selectHomeStageV522=function(...args){const result=select(...args);if(result)persistSelection();return result;};
 startHomeBattleV522=function(...args){const result=start(...args);if(result)persistSelection();return result;};$('start').onclick=startHomeBattleV522;
 grantStageClearReward=function(...args){if(!evolveAdminEnabledV585){normalProgressV585.unlocked=Math.max(normalProgressV585.unlocked,Math.min(99,(meta.stage||1)+1));saveNormalProgressV585();}return grant(...args);};
 returnToHome=function(...args){const result=home(...args);persistSelection();return result;};
 const enable=()=>{if(evolveAdminEnabledV585)return;evolveAdminEnabledV585=true;evolveAdminTapsV585=0;document.documentElement.dataset.evolveAdminV585='true';campaignPrepareStageV567(homeSelectedStageV522);refreshEvolveHomeV522();tell(homeTextV522('Administrator mode enabled','관리자 모드가 켜졌어요.'));};
 $('homeTabs').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(evolveAdminEnabledV585)return;
  if(button.id!=='codexBtn'){evolveAdminTapsV585=0;return;}
  if(++evolveAdminTapsV585===5)enable();
 },true);
 const exit=document.createElement('button');exit.type='button';exit.id='adminExitV585';exit.textContent=homeTextV522('Exit administrator mode','관리자 모드 종료');exit.dataset.i18nIgnore='';
 exit.onclick=()=>{
  window.__EVOLVE_TEST_MODULE_V575__.close(false);closeMapModalV562();setMapOverlayV562(false);evolveAdminEnabledV585=false;evolveAdminTapsV585=0;delete document.documentElement.dataset.evolveAdminV585;
  meta.stage=meta.homeStageV522=homeSelectedStageV522=normalProgressV585.stage;
  returnToHome('battle');refreshEvolveHomeV522();tell(homeTextV522('Returned to normal play','일반 플레이로 돌아왔어요.'));
 };
 $('tmModalV573').querySelector('.tmIntroV573').after(exit);
 window.__EVOLVE_ADMIN_MODE_V585__={read:()=>({enabled:evolveAdminEnabledV585,taps:evolveAdminTapsV585,required:5,normal:{...normalProgressV585},stage:meta.stage,selected:homeSelectedStageV522,level:player.level})};
 saveNormalProgressV585();setMapOverlayV562(false);refreshEvolveHomeV522();
}
