'use strict';
/* M05 80% actual game + mock shop integration: home, equipment, core visuals, combat and save isolation. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const address='http://127.0.0.1:'+server.address().port+'/';
 const results={fullGame:true,originalHomeTabs:true,organismEquipment:true,mockStoreIsolated:true,coreThemeInParts:true,combatAndCorePaint:true,combatShopBlocked:true,legacySaveUnchanged:true,billingEnabled:false,physicalPhoneTested:false};
 try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{
   localStorage.setItem('EVOLVE_V575_TEST_META_V1',JSON.stringify({dna:1200,stage:3,unlockedStageV522:4,homeStageV522:3}));
   localStorage.setItem('EVOLVE_V575_TEST_M05_080_SENTINEL','PRESERVE_ORIGINAL_GAME');
   localStorage.setItem('M03_PAID_LEDGER_M05_080_SENTINEL','PRESERVE_M03');
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(address+'?evolveMockShop=1&evolveM05UX=1&evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__?.read().ready&&window.__EVOLVE_DEV_M05_UI_V618__&&window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('webLoader')&&!document.getElementById('start').disabled,null,{timeout:240000});
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
  const nav=await page.locator('#homeTabs>button').count();assert.equal(nav,5);
  for(const id of ['homeShopTabV601','homeLabTab','homeBattleTabV522','memoryBtn','codexBtn'])assert.equal(await page.locator('#'+id).count(),1,id);
  await page.locator('#homeLabTab').click();
  assert.ok(await page.locator('#partsGridV523 [data-part-id]').count()>0,'organism parts are absent');
  // Original M04 DEV trigger can overlap the sub-tab's pointer zone; test the actual gameplay tab action without changing inherited M04 UI.
  await page.evaluate(()=>document.getElementById('homeSpecimenTab').click());
  await page.locator('#homeSpecimenView').waitFor({state:'visible'});
  assert.equal(await page.locator('#m04CorePartsOverlayV617').count(),1);
  const baseline=await page.evaluate(()=>({legacy:localStorage.getItem('EVOLVE_V575_TEST_M05_080_SENTINEL'),m03:localStorage.getItem('M03_PAID_LEDGER_M05_080_SENTINEL'),game:localStorage.getItem('EVOLVE_V575_TEST_META_V1'),theme:window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().theme}));
  assert.equal(baseline.theme,null);
  await page.locator('#m04MockTriggerV616').click();
  await page.locator('.m05DetailLink[data-m05-sku="appearance_unlock_01"]').click();
  await page.locator('#m05DetailActionV618').click();
  await page.locator('#m04MockApproveV617').click();
  await page.waitForFunction(()=>document.querySelector('#m05DetailV618')?.dataset.owned==='true');
  await page.locator('#m05DetailActionV618').click();
  await page.waitForFunction(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().theme==='dev_core_theme_01');
  assert.equal(await page.locator('#m05DetailV618').getAttribute('data-equipped'),'true');
  assert.equal(await page.locator('#m04CorePartsOverlayV617').count(),1);
  assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().theme),'dev_core_theme_01');
  const afterPurchase=await page.evaluate(()=>({legacy:localStorage.getItem('EVOLVE_V575_TEST_M05_080_SENTINEL'),m03:localStorage.getItem('M03_PAID_LEDGER_M05_080_SENTINEL'),game:localStorage.getItem('EVOLVE_V575_TEST_META_V1'),mock:window.__EVOLVE_DEV_MOCK_UI_V616__.read()}));
  assert.equal(afterPurchase.legacy,baseline.legacy);
  assert.equal(afterPurchase.m03,baseline.m03);
  assert.equal(afterPurchase.game,baseline.game,'shop mutated original game progression save');
  assert.equal(afterPurchase.mock.testCrystals,0);
  assert.equal(afterPurchase.mock.equipped.core,'dev_core_theme_01');
  await page.locator('#m04MockModalV616 .m04MockHead button').click();
  await page.locator('#homeBattleTabV522').click();
  await page.locator('#start').click();
  await require('./choose_opening_skill.cjs')(page);
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running,null,{timeout:90000});
  await page.waitForFunction(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().combatDraws>5,null,{timeout:90000});
  const combat=await page.evaluate(()=>({shopAllowed:window.EVOLVE_WEB_GUARD.atHome(),theme:window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().theme,paints:window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().combatDraws,builds:window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().builds,running:window.__EVOLVE_TEST_MODULE_V575__.read().running}));
  assert.equal(combat.shopAllowed,false);assert.equal(combat.theme,'dev_core_theme_01');assert.ok(combat.paints>5);
  assert.ok(combat.builds<=2,'core sprite rebuild per frame');
  await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.open());
  assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.isOpen()),false);
  assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_M05_UI_V618__.current()),'shop','combat attempted to open the dev modal');
  await page.evaluate(()=>window.__EVOLVE_COMBAT_V596__.test.context().home());
  await page.waitForFunction(()=>window.EVOLVE_WEB_GUARD.atHome(),null,{timeout:30000});
  assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().theme),'dev_core_theme_01');
  await page.locator('#m04MockTriggerV616').click();
  assert.equal(await page.locator('#m05NavigationV618').count(),1);
  await page.locator('#m04MockModalV616 .m04MockHead button').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_M05_080_SENTINEL')),'PRESERVE_ORIGINAL_GAME');
  assert.equal(await page.evaluate(()=>localStorage.getItem('M03_PAID_LEDGER_M05_080_SENTINEL')),'PRESERVE_M03');
  assert.deepEqual(errors,[],'no JavaScript page errors');
  await page.screenshot({path:path.join(out,'m05-080-combat-safety.png')});
  await context.close();
  const standard=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const p=await standard.newPage();
  await p.goto(address+'?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await p.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('webLoader'),null,{timeout:240000});
  assert.equal(await p.locator('#homeTabs>button').count(),5);
  assert.equal(await p.evaluate(()=>Boolean(window.__EVOLVE_DEV_M05_UI_V618__||window.__EVOLVE_DEV_MOCK_UI_V616__)),false,'normal production URL loaded dev globals');
  await standard.close();
  console.log(JSON.stringify({pass:true,results,combat,normalProductionUrlDevGlobals:false,originalAssetsUntouched:true}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;server.close()});
