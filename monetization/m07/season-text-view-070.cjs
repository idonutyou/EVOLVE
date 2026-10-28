/* EVOLVE M07 70% — read-only season text preview, NOT connected to the game.
 * Only renders synthetic LOCAL_TEST_ONLY snapshots. No purchases, rewards,
 * live account claims, storage writes, external resources or asset generation.
 */
'use strict';
const paid=require('./paid-month-calendar-v1.cjs');
const free=require('./utc-period-planner-v1.cjs');
const MISSION_TITLES=Object.freeze({
 m07_daily_first_run:'일일 · 플레이 완료',
 m07_daily_stage_activity:'일일 · 스테이지 활동',
 m07_weekly_codex_discovery:'주간 · 도감 신규 발견'
});
const FREE_RANGE_DAYS_MAX=366;
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function assertPreviewOnly(s){
 if(!s||typeof s!=='object'||!['LOCAL_TEST_ONLY','M07_LOCAL_TEST_BATCH_ONLY'].includes(s.mode))throw new Error('M07_PREVIEW_TEST_SNAPSHOT_ONLY');
 if(s.paidState!=='DRAFT_DISABLED'||s.checkoutEnabled!==false||s.clientGrantsEnabled!==false||s.realRewardsGranted!==0)throw new Error('M07_PREVIEW_NO_LIVE_ENTITLEMENTS');
 if(!Array.isArray(s.missions)||s.missions.length!==3)throw new Error('M07_PREVIEW_MISSIONS_REQUIRED');
 const mSeen=new Set();
 for(const m of s.missions){
  if(!m||typeof m!=='object'||!Object.hasOwn(MISSION_TITLES,m.missionId)||mSeen.has(m.missionId))throw new Error('M07_PREVIEW_MISSION_ID_INVALID');
  mSeen.add(m.missionId);
  if(m.claimable!==false||m.claimed!==false||m.awardsGranted!==0||m.goal!==1||![0,1].includes(m.previewCount)||typeof m.previewCompleted!=='boolean')throw new Error('M07_PREVIEW_CLAIM_DISABLED');
  if(m.previewCompleted!==(m.previewCount===1))throw new Error('M07_PREVIEW_PROGRESS_INVALID');
 }
 const p=paid.paidMonthWindow(s.paidMonth);
 if(s.paidStartUtc!==p.startUtc||s.paidEndExclusiveUtc!==p.endExclusiveUtc)throw new Error('M07_PREVIEW_PAID_DATE_MISMATCH');
 const start=Date.parse(s.freeStartUtc),end=Date.parse(s.freeEndExclusiveUtc);
 if(!Number.isFinite(start)||!Number.isFinite(end)||!s.freeStartUtc.endsWith('Z')||!s.freeEndExclusiveUtc.endsWith('Z'))throw new Error('M07_PREVIEW_FREE_DATE_INVALID');
 const days=(end-start)/86400000;
 if(!Number.isSafeInteger(days)||days<1||days>FREE_RANGE_DAYS_MAX||free.seasonWindow(s.freeStartUtc,days).endUtc!==s.freeEndExclusiveUtc)throw new Error('M07_PREVIEW_FREE_DATE_MISMATCH');
 if(typeof s.freeActive!=='boolean'||typeof s.paidActive!=='boolean')throw new Error('M07_PREVIEW_ACTIVITY_INVALID');
 return p;
}
function formatMonth(p){
 const [year,month]=p.month.split('-').map(Number);
 const last=new Date(Date.UTC(year,month,0)).getUTCDate();
 return year+'년 '+month+'월 1일 00:00 ~ '+year+'년 '+month+'월 '+last+'일 23:59 (KST)';
}
function viewModel(snapshot){
 const p=assertPreviewOnly(snapshot);
 const model={
  kind:'ISOLATED_TEST_UI',freeDates:htmlEscape(snapshot.freeStartUtc)+' ~ '+htmlEscape(snapshot.freeEndExclusiveUtc)+' (종료 미포함 · UTC)',
  freeLabel:snapshot.freeActive?'무료 이벤트 기간 · 테스트':'무료 이벤트 기간 외 · 테스트',
  paidDates:formatMonth(p),paidLabel:'판매 준비 중 · 구매 불가',
  disclaimer:'TEST 전용 미리보기입니다. 실제 플레이 진행률·결제·보상 지급과 연결되어 있지 않습니다.',
  missions:snapshot.missions.map(m=>({name:MISSION_TITLES[m.missionId],progress:m.previewCount,
  label:m.previewCount===1?'가상 완료 · 실제 보상 없음':'가상 진행 대기',goal:1})),
  paidMonth:p.month,checkoutEnabled:false,grantEnabled:false,realRewardsGranted:0
 };
 return Object.freeze({...model,missions:Object.freeze(model.missions.map(m=>Object.freeze(m)))});
}
function renderSeasonSection(snapshot){
 const s=viewModel(snapshot);
 const missions=s.missions.map(m=>'<li class="m07-mission"><div class="m07-row"><strong>'+htmlEscape(m.name)+'</strong><span>'+htmlEscape(m.label)+'</span></div><progress max="1" value="'+m.progress+'" aria-label="'+htmlEscape(m.name)+' 테스트 진척">'+m.progress+' / 1</progress></li>').join('');
 return '<section class="m07-text-panel" aria-label="연구 시즌 테스트 미리보기" data-preview-only="true">'+
 '<header><p class="m07-eyebrow">EVOLVE · RESEARCH / TEST</p><h1>연구 시즌</h1><p class="m07-warning" role="status">'+htmlEscape(s.disclaimer)+'</p></header>'+
 '<section aria-labelledby="m07-free-title"><h2 id="m07-free-title">무료 연구 미션</h2><p>'+htmlEscape(s.freeLabel)+'</p><p class="m07-meta">'+htmlEscape(s.freeDates)+'</p><ol class="m07-list">'+missions+'</ol><p class="m07-note">보상: 서버 검증 전 수령 불가 · 실제 지급 0</p></section>'+
 '<section aria-labelledby="m07-paid-title"><h2 id="m07-paid-title">월간 유료 연구 패스</h2><p class="m07-meta">'+htmlEscape(s.paidDates)+'</p><p class="m07-locked">'+htmlEscape(s.paidLabel)+'</p><p class="m07-note">월간 유료 상품은 매월 1일~말일(KST)입니다. 무료 28일 이벤트와 별개입니다.</p></section>'+
 '<footer><p class="m07-note">기존 SHOP은 변경하지 않았으며 구매/보상 버튼이 없습니다.</p></footer></section>';
}
const styles=`*{box-sizing:border-box}html{background:#0c0e13;color:#f5e8dc;font-family:system-ui,-apple-system,sans-serif}body{margin:0;padding:18px max(12px,env(safe-area-inset-right)) 28px max(12px,env(safe-area-inset-left))}.m07-text-panel{max-width:440px;margin:0 auto;padding:17px;border:1px solid #815f59;border-radius:14px;background:linear-gradient(160deg,#262027,#10141b)}h1{margin:4px 0 12px;color:#f8c3a0;font-size:25px}h2{font-size:17px;margin:0 0 8px;color:#ffe1bd}.m07-eyebrow{font-size:11px;letter-spacing:.11em;color:#c3a99e}.m07-warning{border:1px solid #a47863;border-radius:8px;background:#352528;padding:10px;font-size:13px;line-height:1.5}.m07-text-panel section{margin-top:16px;padding:13px 11px;background:#191b23;border:1px solid #5b4a4b;border-radius:9px}.m07-text-panel section p{font-size:13px;line-height:1.5}.m07-meta{color:#d2b7a7;overflow-wrap:anywhere}.m07-list{list-style:none;margin:10px 0;padding:0}.m07-mission{padding:10px 0;border-top:1px solid #41353b}.m07-row{display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;font-size:13px}.m07-row span{color:#c8b0a9;font-size:12px}.m07-mission progress{display:block;width:100%;height:13px;accent-color:#d58872;margin-top:9px}.m07-note{font-size:12px!important;color:#c8b4af}.m07-locked{display:inline-block;border-radius:7px;padding:8px 11px;background:#372d30;color:#eed2c2;font-weight:700}@media(max-width:350px){body{padding:8px}.m07-text-panel{padding:10px}.m07-text-panel section{padding:11px 8px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}`;
function renderStandaloneHtml(snapshot){
 const s=renderSeasonSection(snapshot);
 return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark"><title>EVOLVE · 연구 시즌 미리보기 (TEST)</title><style>'+styles+'</style></head><body>'+s+'</body></html>';
}
module.exports=Object.freeze({viewModel,renderSeasonSection,renderStandaloneHtml,htmlEscape,mode:'READ_ONLY_TEST_PREVIEW'});
