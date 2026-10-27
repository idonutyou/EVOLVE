'use strict';
// Dev-local mock premium grant checks. No payment SDK, network or production ledger.
const test=require('node:test');
const assert=require('node:assert/strict');
const {createStore,storageKey,catalog,mode}=require('../web/mock-premium-v615.js');

function fakeStorage(){
 const data=new Map();
 return {
  getItem:k=>data.has(k)?data.get(k):null,
  setItem:(k,v)=>data.set(k,String(v)),
  removeItem:k=>data.delete(k),
  key:i=>[...data.keys()][i]||null,
  dump:()=>Object.fromEntries(data)
 };
}
function start(storage=fakeStorage()){return {storage,shop:createStore({storage,enabled:true})}}
const profile='local_tester_01';
const id=n=>'test_request_'+String(n).padStart(8,'0');
const buy=(shop,sku,key)=>shop.simulatePurchase(sku,profile,key);

test('mock store cannot be instantiated without explicit developer enable',()=>{
 assert.equal(mode,'MOCK_ONLY');assert.equal(storageKey,'EVOLVE_DEV_MOCK_STORE_V1');
 assert.throws(()=>createStore({storage:fakeStorage()}),/MOCK_MODE_DISABLED/);
});
test('all five proposal products exist; season purchase fails closed until content exists',()=>{
 const {shop}=start();
 assert.equal(catalog().length,5);
 assert.equal(shop.catalog().length,5);
 assert.throws(()=>buy(shop,'season_research_pass_01',id(1)),/MOCK_CONTENT_NOT_READY/);
 assert.throws(()=>buy(shop,'not_real_sku',id(2)),/UNKNOWN_MOCK_SKU/);
 assert.equal(shop.snapshot(profile).testCrystals,0);
});
test('mock grants test crystals and test receipts only',()=>{
 const {shop,storage}=start();
 const a=buy(shop,'mutation_crystal_small',id(1));
 const b=buy(shop,'mutation_crystal_mid',id(2));
 assert.equal(a.receipt.mockOnly,true);
 assert.equal(a.receipt.source,'dev_mock');
 assert.equal(b.receipt.status,'MOCK_GRANTED');
 assert.equal(shop.snapshot(profile).testCrystals,400);
 assert.deepEqual(Object.keys(storage.dump()),[storageKey]);
 assert.equal(storage.dump()[storageKey].includes('mutation_crystal_small'),true);
});
test('identical operation cannot grant twice after reload',()=>{
 const {shop,storage}=start();
 const first=buy(shop,'mutation_crystal_small',id(7));
 const reloaded=createStore({storage,enabled:true});
 const second=buy(reloaded,'mutation_crystal_small',id(7));
 assert.equal(first.replayed,false);assert.equal(second.replayed,true);
 assert.equal(first.receipt.mockTransactionId,second.receipt.mockTransactionId);
 assert.equal(second.state.testCrystals,100);
 assert.equal(Object.keys(second.state.receipts).length,1);
});
test('same idempotency key with different SKU is rejected and does not grant',()=>{
 const {shop}=start();buy(shop,'mutation_crystal_small',id(8));
 assert.throws(()=>buy(shop,'mutation_crystal_mid',id(8)),/MOCK_IDEMPOTENCY_CONFLICT/);
 assert.equal(shop.snapshot(profile).testCrystals,100);
});
test('starter pack is one-time, owned and credits are added once',()=>{
 const {shop}=start();buy(shop,'starter_genome_once',id(10));
 assert.equal(shop.snapshot(profile).owned.dev_starter_support_v1,true);
 assert.equal(shop.snapshot(profile).testCrystals,75);
 assert.throws(()=>buy(shop,'starter_genome_once',id(11)),/MOCK_ALREADY_OWNED/);
 assert.equal(shop.snapshot(profile).testCrystals,75);
});
test('core cosmetic requires mock ownership and supports equip/unequip',()=>{
 const {shop}=start();
 assert.throws(()=>shop.equip(profile,'core','dev_core_theme_01'),/MOCK_ENTITLEMENT_NOT_OWNED/);
 buy(shop,'appearance_unlock_01',id(12));
 assert.equal(shop.equip(profile,'core','dev_core_theme_01').equipped.core,'dev_core_theme_01');
 const v=shop.unequip(profile,'core');
 assert.equal(v.equipped.core,undefined);
 assert.throws(()=>shop.equip(profile,'tail','dev_core_theme_01'),/INVALID_MOCK_EQUIP/);
 assert.throws(()=>buy(shop,'appearance_unlock_01',id(13)),/MOCK_ALREADY_OWNED/);
});
test('mock purchases are isolated between profiles',()=>{
 const {shop}=start();
 buy(shop,'mutation_crystal_mid',id(15));
 assert.equal(shop.snapshot('other_tester_02').testCrystals,0);
 assert.equal(Object.keys(shop.snapshot('other_tester_02').receipts).length,0);
 assert.equal(shop.snapshot(profile).testCrystals,300);
});
test('a test profile reset does not damage other test profiles or unrelated game saves',()=>{
 const storage=fakeStorage();
 storage.setItem('EVOLVE_V575_TEST_OLD_SAVE','important-unchanged');
 const {shop}=start(storage);
 buy(shop,'mutation_crystal_small',id(16));
 shop.simulatePurchase('mutation_crystal_mid','other_tester_02',id(17));
 shop.resetTestProfile(profile);
 assert.equal(shop.snapshot(profile).testCrystals,0);
 assert.equal(shop.snapshot('other_tester_02').testCrystals,300);
 assert.equal(storage.getItem('EVOLVE_V575_TEST_OLD_SAVE'),'important-unchanged');
});
test('invalid mock account IDs and request IDs are rejected',()=>{
 const {shop}=start();
 assert.throws(()=>buy(shop,'mutation_crystal_small','__proto__'),/INVALID_MOCK_REQUEST_ID/);
 assert.throws(()=>shop.simulatePurchase('mutation_crystal_small','__proto__',id(20)),/INVALID_TEST_PROFILE/);
 assert.throws(()=>shop.simulatePurchase('mutation_crystal_small',profile,'constructor'),/INVALID_MOCK_REQUEST_ID/);
});
test('storage corruption fails closed without erasing the existing bytes',()=>{
 const storage=fakeStorage(),before='not valid json';
 storage.setItem(storageKey,before);
 const shop=createStore({storage,enabled:true});
 assert.throws(()=>shop.snapshot(profile),/INVALID_MOCK_STORAGE/);
 assert.throws(()=>buy(shop,'mutation_crystal_small',id(21)),/INVALID_MOCK_STORAGE/);
 assert.equal(storage.getItem(storageKey),before);
});
test('storage failure prevents reporting a successful grant',()=>{
 let data=null;
 const storage={getItem:()=>data,setItem:()=>{throw Error('STORAGE_FULL')}};
 const shop=createStore({storage,enabled:true});
 assert.throws(()=>buy(shop,'mutation_crystal_small',id(22)),/MOCK_STORAGE_WRITE_FAILED/);
 assert.equal(data,null);
});
test('receipt limits stop unlimited developer save growth',()=>{
 const {shop,storage}=start();
 const mock=JSON.parse(storage.getItem(storageKey)||JSON.stringify({schema:'evolve.dev-mock-shop.v1',profiles:{}}));
 mock.profiles[profile]={schema:'evolve.dev-mock-shop.v1',testCrystals:0,receipts:{},owned:{},equipped:{},revision:0};
 for(let i=0;i<500;i++)mock.profiles[profile].receipts['history_'+i]={sku:'mutation_crystal_small'};
 storage.setItem(storageKey,JSON.stringify(mock));
 assert.throws(()=>buy(shop,'mutation_crystal_small',id(24)),/MOCK_RECEIPT_LIMIT/);
 assert.equal(shop.snapshot(profile).testCrystals,0);
});
test('cosmetic entitlement has no falsely claimed rendered asset',()=>{
 const cosmetic=catalog().find(x=>x.sku==='appearance_unlock_01');
 assert.equal(cosmetic.visualReady,false);
 assert.equal(cosmetic.entitlement,'dev_core_theme_01');
 assert.equal(cosmetic.kind,'cosmetic');
});
