'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser,context,page;
 const report={checks:[],errors:[],failedRequests:[],physical_Galaxy_S23_plus_tested:false};
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
  context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
  await context.addInitScript(()=>{
   if(!localStorage.getItem('EVOLVE_V575_TEST_META_V1'))localStorage.setItem('EVOLVE_V575_TEST_META_V1',JSON.stringify({dna:417,hp:2,dmg:1,stage:4,unlockedStageV522:4,homeStageV522:3}));
   localStorage.setItem('EVOLVE_V575_BIOCORE_SAVE_SENTINEL','KEEP');
  });
  page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push({url:r.url(),error:r.failure()?.errorText});});
  const ready=()=>page.waitForFunction(()=>window.__EVOLVE_BIOCORE_V625__?.read().ready&&window.__EVOLVE_SHOP_V621__&&window.__EVOLVE_DEV_CORE_BRIDGE_V617__?.read().ready&&!document.getElementById('webLoader')&&!document.getElementById('start').disabled,null,{timeout:180000});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});await ready();
  await page.locator('#homeShopTabV601').click();
  await page.locator('#evolveShopV621 .eStoreCardV621').filter({hasText:'첫 진화 패키지'}).getByRole('button',{name:/구매/}).click();
  await page.locator('#evolveShopV621 .eStoreConfirmV621 button').filter({hasText:'구매 확정'}).click();
  await page.locator('#evolveShopV621 .eStoreCardV621').filter({hasText:'공명 코어'}).getByRole('button',{name:/구매/}).click();
  await page.locator('#evolveShopV621 .eStoreConfirmV621 button').filter({hasText:'구매 확정'}).click();
  await page.waitForFunction(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__?.read().theme==='dev_core_theme_01');
  assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().owned.resonance),true);
  await page.reload({waitUntil:'domcontentloaded',timeout:180000});await ready();
  report.restored=await page.evaluate(()=>({theme:window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().theme,owned:window.__EVOLVE_SHOP_V621__.read().owned.resonance,dna:JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_META_V1')).dna,sentinel:localStorage.getItem('EVOLVE_V575_BIOCORE_SAVE_SENTINEL')}));
  assert.deepEqual(report.restored,{theme:'dev_core_theme_01',owned:true,dna:417,sentinel:'KEEP'});
  report.checks.push('mock cosmetic ownership, selected theme and previous save survive a reload');
  await page.locator('#homeBattleTabV522').click();await page.locator('#start').click();
  await require('./choose_opening_skill.cjs')(page);
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
  report.battle=await page.evaluate(()=>{
   const bridge=window.__EVOLVE_DEV_CORE_BRIDGE_V617__,game=window.__EVOLVE_TEST_MODULE_V575__.test.context();
   const before=bridge.read().combatDraws;for(let i=0;i<5;i++)game.draw();
   return {before,after:bridge.read().combatDraws,theme:bridge.read().theme,bio:window.__EVOLVE_BIOCORE_V625__.read()};
  });
  assert.equal(report.battle.theme,'dev_core_theme_01');
  assert.ok(report.battle.after>=report.battle.before+5,'equipped cosmetic must render on the new character in battle');
  assert.equal(report.battle.bio.character,'red-flesh-core');
  report.checks.push('the selected cosmetic actually renders over the new bio-core in battle');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);process.exitCode=1;}
 finally{
  fs.writeFileSync(path.join(out,'biocore-070-cosmetic-browser.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));await context?.close();await browser?.close();server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
