'use strict';
// EVOLVE M07 100% final shop / calendar / restore acceptance contract.
// All awards remain browser-local and no payment provider is ever contacted.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const api=require('../web/shop-experience-v621.js');
const months=[
 ['2026-10','2026-09-30T15:00:00.000Z','2026-10-31T15:00:00.000Z',31],
 ['2026-11','2026-10-31T15:00:00.000Z','2026-11-30T15:00:00.000Z',30],
 ['2027-02','2027-01-31T15:00:00.000Z','2027-02-28T15:00:00.000Z',28],
 ['2028-02','2028-01-31T15:00:00.000Z','2028-02-29T15:00:00.000Z',29],
 ['2026-12','2026-11-30T15:00:00.000Z','2026-12-31T15:00:00.000Z',31]
];
for(const [month,start,end,days] of months){
 const w=api.paidMonthWindow(month);
 assert.deepEqual([w.startUtc,w.endExclusiveUtc,w.days],[start,end,days]);
 assert.equal(api.kstMonth(Date.parse(start)),month);
 const last=new Date(Date.parse(end)-1);
 assert.equal(api.kstMonth(last.valueOf()),month);
}
const disk={};
const storage={getItem:k=>Object.hasOwn(disk,k)?disk[k]:null,setItem:(k,v)=>{disk[k]=v}};
const date=iso=>Date.parse(iso);
let now=date('2026-10-01T11:30:00.000Z');
const create=()=>api.createStore({storage,clock:()=>now});
const store=create();
const id=n=>'m07_100_receipt_'+String(n).padStart(8,'0');
assert.equal(api.mode,'LOCAL_PREVIEW_NO_BILLING');
assert.equal(store.snapshot().noBilling,true);
const pass=store.order('researchpass',id(1));
assert.equal(pass.receipt.charged,false);
assert.equal(pass.receipt.month,'2026-10');
assert.equal(pass.receipt.firstBonus,50);
assert.equal(store.snapshot().crystals,50);
assert.equal(store.snapshot().passActive,true);
store.claimDaily();
store.claimPremium(1);
assert.equal(store.snapshot().crystals,105);
assert.equal(store.snapshot().rewardClaims['2026-10:1'],true);
const rev=store.snapshot().revision,balances=store.snapshot().crystals;
now=date('2026-10-31T14:59:59.999Z');
assert.equal(store.snapshot().passActive,true);
now=date('2026-10-31T15:00:00.000Z');
assert.equal(store.snapshot().passActive,false);
assert.equal(store.snapshot().month,'2026-11');
assert.equal(store.snapshot().paidWindow.days,30);
assert.equal(store.snapshot().crystals,balances);
assert.throws(()=>store.claimPremium(1),/PASS_REQUIRED/);
// Old request IDs can arrive late: receipt replays safely, NOT buying November.
const delayed=store.order('researchpass',id(1));
assert.equal(delayed.replayed,true);
assert.equal(delayed.receipt.month,'2026-10');
assert.equal(delayed.receipt.charged,false);
assert.equal(store.snapshot().revision,rev);
assert.equal(store.snapshot().passActive,false);
assert.equal(store.snapshot().crystals,balances);
assert.throws(()=>store.order('starter',id(1)),/ORDER_ID_CONFLICT/);
const november=store.order('researchpass',id(2));
assert.equal(november.receipt.month,'2026-11');
assert.equal(november.receipt.firstBonus,0);
assert.equal(store.snapshot().passActive,true);
assert.equal(store.snapshot().revision,rev+1);
const second=create();
assert.equal(second.snapshot().passActive,true);
assert.equal(second.snapshot().rewardClaims['2026-10:1'],true);
const beforeCosmetic=second.snapshot().crystals;
const crystal=second.order('crystal100',id(3));
assert.equal(crystal.receipt.firstBonus,0);
assert.equal(second.snapshot().crystals,beforeCosmetic+100);
const item=second.order('crimson',id(4));
assert.equal(item.receipt.spentCrystals,120);
assert.equal(item.receipt.charged,false);
assert.equal(second.snapshot().owned.crimson,true);
assert.equal(second.order('crimson',id(4)).replayed,true);
assert.throws(()=>second.order('crimson',id(5)),/ALREADY_OWNED/);
assert.equal(second.snapshot().owned.crimson,true);
now=date('2026-11-30T15:00:00.000Z');
assert.equal(second.snapshot().month,'2026-12');
assert.equal(second.snapshot().passActive,false);
assert.equal(second.snapshot().owned.crimson,true);
const oldBalance=second.snapshot().crystals,oldRev=second.snapshot().revision;
const archive=disk[api.storageKey];
assert.throws(()=>second.order('crimson',id(6)),/ALREADY_OWNED/);
assert.equal(second.snapshot().revision,oldRev);
assert.equal(second.snapshot().crystals,oldBalance);
disk[api.storageKey]='{"broken":';
assert.throws(()=>second.snapshot(),/STORE_DATA_INVALID/);
assert.equal(disk[api.storageKey],'{"broken":');
disk[api.storageKey]=archive;
assert.equal(create().snapshot().owned.crimson,true);
assert.equal(create().snapshot().revision,oldRev);
// no touch to existing game and no buyer server data.
const web=fs.readFileSync(path.join(__dirname,'../web/shop-front-v621.js'),'utf8');
const dist=fs.readFileSync(path.join(__dirname,'../dist/shop-front-v621.js'),'utf8');
const engine=fs.readFileSync(path.join(__dirname,'../web/shop-experience-v621.js'),'utf8');
const distEngine=fs.readFileSync(path.join(__dirname,'../dist/shop-experience-v621.js'),'utf8');
assert.equal(web,dist);assert.equal(engine,distEngine);
for(const sign of ['evolveResearchV621','eStoreCollectionV621','결제 연결 전 체험 중','금액 청구 없음','이번 달 종료까지 24시간 미만','현재 남은 기간 약','다음 달 자동 갱신되지 않습니다'])assert.ok(web.includes(sign),sign);
for(const forbidden of ['모의 구매','TEST 상품','실제 결제 완료'])assert.equal(web.includes(forbidden),false,forbidden);
assert.equal((web.match(/function drawChallenge\(/g)||[]).length,1);
assert.equal((web.match(/function bridgeOwnedCore\(/g)||[]).length,1);
const document=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
assert.equal((document.match(/shop-front-v621\.js\?v=120/g)||[]).length,1);
assert.equal((document.match(/shop-experience-v621\.js\?v=120/g)||[]).length,1);
assert.ok(document.indexOf('shop-experience-v621.js?v=120')<document.indexOf('shop-front-v621.js?v=120'));
const publishWait=fs.readFileSync(path.join(__dirname,'../tools/wait_for_shop_publication.py'),'utf8');
assert.ok(publishWait.includes('shop-front-v621.js?v=120'));
assert.ok(!publishWait.includes('shop-front-v621.js?v=90'));
console.log('M07 100% PASS: KST paid month boundaries incl leap, delayed retry cannot buy next month, double claims blocked, permanent skin retained, no billing, and V100 public gate.');
