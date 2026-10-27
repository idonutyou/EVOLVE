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
  await page.goto(base+'?evolveMockShop=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_DEV_MOCK_UI_V616__&&document.getElementById('m04MockTriggerV616')&&!document.getElementById('webLoader'),null,{timeout:240000});
  const before=await page.locator('#homeTabs > button').count();assert.equal(before,5,'navigation tab count changed');
  assert.ok(await page.locator('#m04MockTriggerV616').count());
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
  await page.locator('#m04MockTriggerV616').click({timeout:30000});
  assert.equal(await page.locator('#m04MockModalV616').isVisible(),true);
  const rows=page.locator('.m04MockCard');
  assert.equal(await rows.count(),5,'all five mock catalog SKUs should be listed');
  assert.equal(await rows.nth(4).locator('button').isDisabled(),true,'unavailable season must stay disabled');
  await rows.nth(1).locator('button').click();
  assert.match(await page.locator('.m04MockBalance').textContent(),/100/);
  await rows.nth(2).locator('button').click();
  assert.match(await page.locator('.m04MockBalance').textContent(),/400/);
  await rows.nth(3).locator('button').click();
  assert.equal(await rows.nth(3).locator('button').textContent(),'장착');
  await rows.nth(3).locator('button').click();
  assert.equal(await rows.nth(3).locator('button').textContent(),'해제');
  const snapshot=await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read());
  assert.equal(snapshot.testCrystals,400);
  assert.equal(snapshot.equipped.core,'dev_core_theme_01');
  assert.equal(snapshot.source,'dev_mock');
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
  assert.equal(after.testCrystals,400);assert.equal(after.equipped.core,'dev_core_theme_01');
  const legacyAfter=JSON.parse(await page.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_META_V1')));
  const legacyBefore=JSON.parse(saved.legacy);
  assert.equal(legacyAfter.dna,legacyBefore.dna,'legacy DNA modified by mock shop');
  assert.equal(legacyAfter.unlockedStageV522,legacyBefore.unlockedStageV522,'legacy stage unlock modified by mock shop');
  await page.goto(base,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#m04MockTriggerV616').count(),0,'mock shop must remain hidden without explicit opt-in');
  assert.equal(await page.locator('#homeTabs > button').count(),5);
  assert.equal(errors.filter(e=>e.includes('mock-premium')).length,0,'mock script raised an exception');
  console.log(JSON.stringify({pass:true,realGameShell:true,mobile:'393x852',mockPurchase:true,testCredits:400,coreState:'dev_core_theme_01',legacySavePreserved:true,navigationButtons:before,sceneImage:'test-results/m04-mock-shop-393x852.png'}));
 }finally{await browser.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
