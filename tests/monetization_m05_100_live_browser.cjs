'use strict';
/* M05 100% final verification AGAINST ACTUAL PUBLIC GITHUB PAGES, not local preview. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=(process.env.EVOLVE_TEST_BASE_URL||'https://idonutyou.github.io/EVOLVE/').replace(/\/?$/,'/');
const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/version.json'),'utf8'));
const out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const response=await fetch(base+'version.json?m05_final='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,'GitHub Pages version manifest not HTTP 200');
 const published=await response.json();
 assert.equal(published.build,expected.build,'LIVE PAGES BUILD DOES NOT MATCH MAIN');
 assert.equal(published.version,expected.version);
 assert.equal(published.assets,1083);
 const assetManifest=await fetch(base+'asset-manifest.json?m05_final='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(30000)}).then(x=>x.json());
 assert.equal(assetManifest.length,1083);
 assert.equal(assetManifest.filter(x=>x.kind==='image').length,1021);
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const report=[];
 try{
  for(const [width,height] of [[393,852],[320,568]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1,serviceWorkers:'block'});
   await context.addInitScript(()=>{localStorage.setItem('EVOLVE_V575_TEST_M05_100_SENTINEL','M05_KEEP_GAME_SAVE');localStorage.setItem('M03_LEDGER_M05_100_SENTINEL','M05_KEEP_OLD_LEDGER')});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'?evolveMockShop=1&evolveM05UX=1&evolveQA=1&m05_final='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForFunction(()=>window.__EVOLVE_DEV_M05_UI_V618__&&window.__EVOLVE_DEV_MOCK_UI_V616__&&window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&document.querySelector('#m04MockTriggerV616')&&!document.getElementById('webLoader'),null,{timeout:180000});
   await page.evaluate(()=>document.getElementById('introSplash')?.click());
   assert.equal(await page.locator('#homeTabs>button').count(),5);
   await page.locator('#homeLabTab').click();
   await page.locator('#homeSpecimenTab').click();
   assert.equal(await page.locator('#homeSpecimenView').isVisible(),true,'real tap on specimen blocked');
   const collided=await page.evaluate(()=>{
    const a=document.getElementById('m04MockTriggerV616').getBoundingClientRect();
    return [...document.querySelectorAll('#homeTabs>button')].filter(el=>{
     const r=el.getBoundingClientRect();return Math.min(a.right,r.right)>Math.max(a.left,r.left)&&Math.min(a.bottom,r.bottom)>Math.max(a.top,r.top);
    }).map(el=>el.id)
   });
   assert.deepEqual(collided,[],'LIVE DEV trigger still collides with home menu');
   await page.locator('#m04MockTriggerV616').click();
   await page.locator('#m05NavigationV618').waitFor();
   await page.locator('.m05DetailLink[data-m05-sku="appearance_unlock_01"]').click();
   await page.locator('#m05DetailActionV618').click();
   await page.locator('#m04MockApproveV617').click();
   await page.waitForFunction(()=>document.querySelector('#m05DetailV618')?.dataset.owned==='true');
   await page.locator('#m05DetailActionV618').click();
   await page.waitForFunction(()=>document.querySelector('#m05DetailV618')?.dataset.equipped==='true');
   assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().theme),'dev_core_theme_01');
   await page.locator('#m05DetailV618').getByRole('button',{name:'코어 컬렉션 보기'}).click();
   assert.equal(await page.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'collection');
   assert.match(await page.locator('#m05CollectionStatusV618').innerText(),/1\/2/);
   assert.equal(await page.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_M05_100_SENTINEL')),'M05_KEEP_GAME_SAVE');
   assert.equal(await page.evaluate(()=>localStorage.getItem('M03_LEDGER_M05_100_SENTINEL')),'M05_KEEP_OLD_LEDGER');
   await page.locator('#m04MockModalV616 .m04MockHead button').click();
   assert.deepEqual(errors,[]);
   await page.screenshot({path:path.join(out,'m05-100-live-'+width+'x'+height+'.png')});
   report.push({viewport:width+'x'+height,source:'ACTUAL_GITHUB_PAGES',fiveTabs:true,realTapSpecimen:true,devTouchOverlap:0,realPayment:false,mockOwnedEquipped:true,coreVisualBridge:true,originalSavePreserved:true,oldLedgerPreserved:true});
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  await page.goto(base+'?m05_normal='+Date.now(),{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('webLoader'),null,{timeout:180000});
  assert.equal(await page.locator('#homeTabs>button').count(),5);
  assert.equal(await page.locator('#m04MockTriggerV616').count(),0);
  assert.equal(await page.evaluate(()=>Boolean(window.__EVOLVE_DEV_M05_UI_V618__)),false);
  await context.close();
  console.log(JSON.stringify({success:true,actual_public_url:base,live_build:published.build,live_version:published.version,assets:assetManifest.length,images:1021,devices:report,default_url_dev_disabled:true,physical_device_tested:false}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
