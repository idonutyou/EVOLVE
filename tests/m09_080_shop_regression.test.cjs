'use strict';
/* M09 80% focused SHOP regression. No game assets, browser or network needed. */
const api=require('../web/shop-experience-v621.js');
function ok(x,label){if(!x)throw Error('FAIL '+label);}
function eq(a,b,label){ok(a===b,label+' expected '+JSON.stringify(b)+' got '+JSON.stringify(a));}
function fail(fn,code){
 let observed='';
 try{fn();}catch(e){observed=e.message;}
 eq(observed,code,'expected guarded failure '+code);
}
function fixture(ts='2026-10-01T03:00:00.000Z'){
 const data=Object.create(null),writes=[];
 const storage={getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,
  setItem:(k,v)=>{data[k]=v;writes.push(k);}};
 let now=Date.parse(ts);
 const store=api.createStore({storage,clock:()=>now});
 return {data,writes,storage,store,setTime:iso=>{now=Date.parse(iso);}};
}
const id=n=>'m09_080_request_'+String(n).padStart(6,'0');
eq(api.products.length,6,'existing SKUs preserved');
eq(api.products.find(p=>p.id==='starter').crystals,160,'starter new offer');
eq(api.products.find(p=>p.id==='researchpass').price,'₩5,900','unapproved mock display price');
eq(api.storageKey,'EVOLVE_SHOP_EXPERIENCE_V621_V1','save key');
eq(JSON.stringify(api.passDays),JSON.stringify([1,3,7,14,21]),'five KST milestone dates');
for(const [month,days] of [['2027-02',28],['2028-02',29],['2027-04',30],['2027-05',31]])eq(api.paidMonthWindow(month).days,days,'month '+month);
{
 const f=fixture('2027-05-01T06:00:00.000Z'),s=f.store;
 fail(()=>s.redeemUiCosmetic('lab_nameplate'),'INSUFFICIENT_CRYSTALS');
 eq(s.snapshot().starterBadgeOwned,false,'starter badge initially unavailable');
 const x=s.order('starter',id(1));eq(x.receipt.charged,false,'no billing');
 eq(x.receipt.crystals,160,'starter receipt');eq(x.receipt.firstBonus,50,'first purchase bonus');
 eq(s.snapshot().crystals,210,'starter crystal balance');
 eq(s.snapshot().starterBadgeOwned,true,'starter entitlement');
 eq(s.order('starter',id(1)).replayed,true,'idempotent order ID');
 fail(()=>s.order('starter',id(2)),'ALREADY_OWNED');
 eq(s.snapshot().crystals,210,'no repeated starter award');
 const red=s.redeemUiCosmetic('lab_nameplate');eq(red.spentCrystals,180,'nameplate costs 180');
 eq(s.snapshot().crystals,30,'single nameplate deduction');
 fail(()=>s.redeemUiCosmetic('lab_nameplate'),'ALREADY_OWNED');
 eq(s.equipUiCosmetic('lab_nameplate').equipped,true,'nameplate equipped');
 const reload=api.createStore({storage:f.storage,clock:()=>Date.parse('2027-05-01T06:00:00.000Z')});
 eq(reload.snapshot().uiCollectibles.equipped.home_nameplate,'lab_nameplate','equipped persisted');
 eq(reload.equipUiCosmetic('lab_nameplate').equipped,false,'nameplate unequipped');
 ok(f.writes.every(k=>k===api.storageKey),'only existing shop key writes');
}
{
 const f=fixture('2027-05-01T06:00:00.000Z'),s=f.store;
 s.order('researchpass',id(3));
 for(let day=1;day<=21;day++){
  f.setTime('2027-05-'+String(day).padStart(2,'0')+'T06:00:00.000Z');
  s.claimDaily();
  if(day===2)fail(()=>s.claimPremium(2),'PROGRESS_REQUIRED');
  if(api.passDays.includes(day))s.claimPremium(api.passDays.indexOf(day)+1);
 }
 eq(s.snapshot().crystals,50+21*20+175,'pass five tier payouts only once');
 ok(s.snapshot().pass.passBadgeClaimable,'21-day permanent badge eligible');
 s.claimPassBadge();
 fail(()=>s.claimPassBadge(),'ALREADY_CLAIMED');
 fail(()=>s.claimPremium(5),'ALREADY_CLAIMED');
 f.setTime('2027-06-01T03:00:00.000Z');
 ok(s.snapshot().pass.passBadgeOwned&&!s.snapshot().passActive,'badge survives KST month rollover');
}
{
 const f=fixture('2027-05-30T03:00:00.000Z'),s=f.store;
 ok(!s.snapshot().pass.canBuy,'late-month full path impossible');
 fail(()=>s.order('researchpass',id(4)),'PASS_COMPLETION_UNREACHABLE');
 eq(s.snapshot().crystals,0,'blocked purchase no funds awarded');
}
{
 const f=fixture('2027-05-03T03:00:00.000Z');
 const legacy={schema:'evolve.shop.experience.v621.v1',revision:8,crystals:7,firstPurchase:true,
  owned:{starter:true},orders:{},passMonths:{'2027-05':true},
  dailyClaims:{'2027-05-01':true,'2027-05-02':true,'2027-05-03':true},
  rewardClaims:{'2027-05:1':true,'2027-05:2':true},missionClaims:{}};
 const raw=JSON.stringify(legacy);f.data[api.storageKey]=raw;
 eq(f.store.snapshot().starterBadgeOwned,true,'old starter automatically receives badge');
 eq(f.store.snapshot().crystals,7,'old crystal balance unchanged');
 eq(f.store.snapshot().pass.progress,3,'old dailyClaims count retained');
 fail(()=>f.store.claimPremium(2),'ALREADY_CLAIMED');
 eq(f.data[api.storageKey],raw,'legacy saved bytes preserved for read');
 const broken=JSON.parse(raw);broken.uiCollectibles={owned:{lab_nameplate:false},equipped:{}};
 f.data[api.storageKey]=JSON.stringify(broken);
 fail(()=>f.store.snapshot(),'STORE_DATA_INVALID');
 eq(f.data[api.storageKey],JSON.stringify(broken),'corrupt state not erased');
}
{
 const f=fixture();
 const full={getItem:k=>f.storage.getItem(k),setItem:()=>{throw Error('QUOTA');}};
 const store=api.createStore({storage:full,clock:()=>Date.parse('2026-10-01T03:00:00.000Z')});
 fail(()=>store.order('starter',id(5)),'STORAGE_WRITE_FAILED');
 eq(Object.keys(f.data).length,0,'storage failure no partial grant');
}
console.log('M09 80% PASS: six SKUs, starter, nameplate, pass 28/29/30/31, month cutoff, legacy saves, no billing, no double grants.');
