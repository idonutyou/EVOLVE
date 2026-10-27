'use strict';
/** Browser integration of M04 DEV-ONLY mock purchase home UI with the real V614 game shell.
 * Never invokes real checkout and does not modify legacy saves.
 */
const {chromium}=require('playwright');
const {strict:assert}=require('node:assert');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../dist');
const type={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',type[path.extname(p)]||'application/octet-stream');
 fs.createReadStream(p).pipe(res);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
 try{
  await page.addInitScript(()=>{if(!localStorage.getItem('EVOLVE_V575_TEST_META_V1'))localStorage.setItem('EVOLVE_V575_TEST_META_V1',JSON.stringify({dna:1200,stage:3,unlockedStageV522:4,homeStageV522:3}));});
  await page.goto(base+'?evolveMockShop=1&evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_DEV_MOCK_UI_V616__&&document.getElementById('m04MockTriggerV616')&&!document.getElementById('webLoader'),null,{timeout:240000});
  const before=await page.locator('#homeTabs > button').count();assert.equal(before,5,'navigation tab count changed');
  assert.ok(await page.locator('#m04MockTriggerV616').count());
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
  await page.locator('#m04MockTriggerV616').click({timeout:30000});
  assert.equal(await page.locator('#m04MockModalV616').isVisible(),true);
  const rows=page.locator('.m04MockCard');
  assert.equal(await rows.count(),5,'all five mock catalog SKUs should be listed');
  assert.equal(await rows.nth(4).locator('button').isDisabled(),true,'unavailable season must stay disabled');
  const approve=()=>page.locator('#m04MockApproveV617').click();
  const rawMock=()=>page.evaluate(()=>localStorage.getItem('EVOLVE_DEV_MOCK_STORE_V1'));
  const originalMock=await rawMock();
  await rows.nth(1).locator('button').click();
  assert.equal(await rawMock(),originalMock,'purchase preview must not write a receipt');
  await page.locator('#m04MockConfirmV617').getByRole('button',{name:'취소',exact:true}).click();
  assert.equal(await rawMock(),originalMock,'cancel must preserve exact bytes');
  await rows.nth(1).locator('button').click();
  await approve();
  assert.match(await page.locator('.m04MockBalance').textContent(),/100/);
  await rows.nth(2).locator('button').click();
  await approve();
  assert.match(await page.locator('.m04MockBalance').textContent(),/400/);
  await rows.nth(3).locator('button').click();
  await approve();
  assert.equal(await rows.nth(3).locator('button').textContent(),'장착');
  const combatSignature=()=>page.evaluate(()=>{
   const c=window.__EVOLVE_COMBAT_V596__.test.context(),p=c.player;
   return {state:{...c.state},maxHp:p.maxHp,speed:p.speed,dmgMul:p.dmgMul,armor:p.armor,parts:window.__EVOLVE_PARTS_V523__.snapshot().worn};
  });
  const statsBefore=await combatSignature();
  await rows.nth(3).locator('button').click();
  assert.equal(await rows.nth(3).locator('button').textContent(),'해제');
  const snapshot=await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read());
  assert.equal(snapshot.testCrystals,400);
  assert.equal(snapshot.equipped.core,'dev_core_theme_01');
  assert.equal(snapshot.source,'dev_mock');
  await page.waitForFunction(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__?.read().ready);
  assert.equal(await page.locator('.m04CoreLook canvas').count(),2,'both real character previews must be rendered');
  const variants=await page.evaluate(()=>{
   const b=window.__EVOLVE_DEV_CORE_BRIDGE_V617__;
   const raw=b.preview(null),a=b.preview('dev_core_theme_01'),c=b.preview('dev_core_theme_02');
   return {base:raw.toDataURL(),first:a.toDataURL(),second:c.toDataURL(),bridge:b.read()};
  });
  assert.notEqual(variants.base,variants.first,'first core must produce visible pixels');
  assert.notEqual(variants.first,variants.second,'second theme must have distinct pixels');
  assert.equal(variants.bridge.theme,'dev_core_theme_01');
  const crimson=page.locator('.m04CoreLook[data-entitlement="dev_core_theme_02"] button');
  await crimson.click();
  await page.locator('#m04MockConfirmV617').getByRole('button',{name:'취소',exact:true}).click();
  assert.equal((await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read())).testCrystals,400);
  await crimson.click();
  await approve();
  assert.equal((await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read())).testCrystals,280);
  await crimson.click();
  assert.equal((await page.evaluate(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read())).theme,'dev_core_theme_02');
  assert.deepEqual(await combatSignature(),statsBefore,'cosmetic swaps modified gameplay stats or existing parts');
  const beforeFailure=await rawMock();
  await page.evaluate(()=>{
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(k==='EVOLVE_DEV_MOCK_STORE_V1')throw new DOMException('full','QuotaExceededError');return original.call(this,k,v)};
   window.__restoreM04Storage=()=>{Storage.prototype.setItem=original};
  });
  await rows.nth(1).locator('button').click();await approve();
  assert.match(await page.locator('#m04MockMessageV616').textContent(),/저장하지 못/);
  assert.equal(await rawMock(),beforeFailure,'failed persistence must not grant currency');
  await page.evaluate(()=>window.__restoreM04Storage());
  await page.locator('#m04MockConfirmV617').getByRole('button',{name:'취소',exact:true}).click();
  await page.evaluate(()=>document.fonts.ready);
  assert.match(await page.locator('.m04MockPanel').evaluate(e=>getComputedStyle(e).fontFamily),/EVOLVE Hangul/);
  const saved=await page.evaluate(()=>({
    legacy:localStorage.getItem('EVOLVE_V575_TEST_META_V1'),
    mock:localStorage.getItem('EVOLVE_DEV_MOCK_STORE_V1')
  }));
  assert.ok(saved.legacy&&saved.mock,'both old and new save must coexist');
  await page.screenshot({path:path.join(out,'m04-mock-shop-393x852.png')});
  await page.locator('#m04MockModalV616 button').first().click();
  assert.equal(await page.locator('#m04MockModalV616').isVisible(),false);
  await page.reload({waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_DEV_MOCK_UI_V616__&&!document.getElementById('webLoader'),null,{timeout:240000});
  const after=await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read());
  assert.equal(after.testCrystals,280);assert.equal(after.equipped.core,'dev_core_theme_02');
  assert.equal((await page.evaluate(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read())).theme,'dev_core_theme_02');
  const goodMock=await rawMock();
  await page.evaluate(()=>{const key='EVOLVE_DEV_MOCK_STORE_V1',d=JSON.parse(localStorage.getItem(key));d.profiles.dev_local_profile_01.equipped.core='invalid_core';localStorage.setItem(key,JSON.stringify(d));});
  const invalidMock=await rawMock();
  await page.reload({waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__?.read().ready&&!document.getElementById('webLoader'),null,{timeout:240000});
  assert.equal(await rawMock(),invalidMock,'invalid mock data must not be erased');
  assert.equal((await page.evaluate(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read())).theme,null);
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
  await page.locator('#m04MockTriggerV616').click();
  assert.equal(await rows.nth(1).locator('button').isDisabled(),true,'corrupt profile must not grant');
  await page.evaluate(raw=>{localStorage.setItem('EVOLVE_DEV_MOCK_STORE_V1',raw);window.dispatchEvent(new StorageEvent('storage',{key:'EVOLVE_DEV_MOCK_STORE_V1'}));},goodMock);
  assert.equal((await page.evaluate(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read())).theme,'dev_core_theme_02');
  await page.locator('#m04MockModalV616 button').first().click();
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
  await page.locator('#start').click();
  await page.locator('#cards .card').first().click();
  await page.waitForFunction(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().combatDraws>5,null,{timeout:30000});
  const live=await page.evaluate(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read());
  assert.equal(live.theme,'dev_core_theme_02');assert.ok(live.builds<=2,'no per-frame sprite rebuild');
  await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.open());
  assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.isOpen()),false,'store must not open during combat');
  await page.screenshot({path:path.join(out,'m04-core-combat-393x852.png')});
  await page.evaluate(()=>window.__EVOLVE_COMBAT_V596__.test.context().home());
  await page.locator('#m04MockTriggerV616').click();
  const beforeReset=await rawMock(),legacyAtReset=await page.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_META_V1'));
  await page.locator('.m04MockReset').click();assert.equal(await rawMock(),beforeReset,'first reset click must only confirm');
  await page.locator('.m04MockReset').click();
  assert.equal((await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read())).testCrystals,0);
  assert.equal((await page.evaluate(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read())).theme,null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_META_V1')),legacyAtReset,'test reset modified game save');
  await page.locator('#m04MockModalV616 button').first().click();
  const legacyAfter=JSON.parse(await page.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_META_V1')));
  const legacyBefore=JSON.parse(saved.legacy);
  assert.equal(legacyAfter.dna,legacyBefore.dna,'legacy DNA modified by mock shop');
  assert.equal(legacyAfter.unlockedStageV522,legacyBefore.unlockedStageV522,'legacy stage unlock modified by mock shop');
  await page.setViewportSize({width:320,height:568});
  await page.locator('#m04MockTriggerV616').click();
  const box=await page.locator('.m04MockPanel').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=321&&box.y>=0&&box.y+box.height<=569,'compact phone modal overflow');
  await page.screenshot({path:path.join(out,'m04-mock-shop-320x568.png')});
  await page.keyboard.press('Escape');
  await page.goto(base,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#m04MockTriggerV616').count(),0,'mock shop must remain hidden without explicit opt-in');
  assert.equal(await page.evaluate(()=>typeof window.__EVOLVE_DEV_CORE_BRIDGE_V617__),'undefined');
  assert.equal(await page.locator('#homeTabs > button').count(),5);
  assert.deepEqual(errors,[],'game or mock script raised an exception');
  console.log(JSON.stringify({pass:true,realGameShell:true,mobile:['393x852','320x568'],mockPurchase:true,testCreditsBeforeReset:280,coreStateBeforeReset:'dev_core_theme_02',visibleThemes:2,combatDraws:live.combatDraws,spriteBuilds:live.builds,cancelPreservesBytes:true,storageFailureNoGrant:true,corruptionPreserved:true,gameplayStatsAndPartsUnchanged:true,testResetIsolated:true,legacySavePreserved:true,navigationButtons:before,sceneImage:'test-results/m04-mock-shop-393x852.png'}));
 }catch(e){await page.screenshot({path:path.join(out,'m04-failure-393x852.png')}).catch(()=>{});console.error('PAGE_ERRORS',JSON.stringify(errors));throw e}
 finally{await browser.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
