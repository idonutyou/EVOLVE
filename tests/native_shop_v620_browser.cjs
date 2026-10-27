'use strict';
/* EVOLVE V620 browser QA: actual default home SHOP is the sole catalog. No DEV overlay/URL flags. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../dist'),output=path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const chrome=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const base=(process.env.EVOLVE_TEST_BASE_URL||('http://127.0.0.1:'+server.address().port+'/')).replace(/\/?$/,'/');const results=[];
 if(process.env.EVOLVE_TEST_BASE_URL){
  const p=await fetch(base+'version.json?nativev620='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(30000)});
  assert.equal(p.status,200,'Actual Pages version fetch failed');
  const actual=await p.json(),expected=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
  assert.equal(actual.build,expected.build,'PUBLIC Pages build differs from repository native SHOP build');
  assert.equal(actual.assets,1072);
 }
 try{
  for(const [w,h] of [[393,852],[320,568],[852,393]]){
   const context=await chrome.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
   await context.addInitScript(()=>{
    localStorage.setItem('EVOLVE_V575_TEST_NATIVE_620_SENTINEL','UNCHANGED_GAME_SAVE');
    localStorage.setItem('M03_LEDGER_NATIVE_620_SENTINEL','UNCHANGED_M03');
   });
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
   await p.goto(base+'?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
   try{await p.waitForFunction(()=>window.__EVOLVE_NATIVE_SHOP_V620__&&document.querySelector('#nativeShopV620')&&!document.getElementById('webLoader'),null,{timeout:30000})}
   catch(e){
    const debug=await p.evaluate(()=>({ready:!!window.__EVOLVE_NATIVE_SHOP_V620__,api:!!window.__EVOLVE_DEV_MOCK_STORE_V615__,visuals:!!window.__EVOLVE_DEV_CORE_VISUALS_V617__,home:!!document.getElementById('homeShopViewV601'),loader:!!document.getElementById('webLoader'),currentScript:[...document.scripts].filter(x=>x.hasAttribute('data-native-shop')).map(x=>({src:x.src,outer:x.outerHTML.slice(0,160)})),bodyText:document.body.innerText.slice(0,600),build:window.EVOLVE_WEB_CONFIG?.version}));
    console.error('V620_INIT_DEBUG',JSON.stringify({debug,errors}));await p.screenshot({path:path.join(output,'native-shop-v620-startup-error.png')});throw e;
   }
   await p.evaluate(()=>document.getElementById('introSplash')?.click());
   assert.equal(await p.locator('#homeTabs>button').count(),5);
   assert.equal(await p.locator('#m04MockTriggerV616').count(),0);
   assert.equal(await p.locator('#m04MockModalV616').count(),0);
   assert.equal(await p.evaluate(()=>!!window.__EVOLVE_DEV_M05_UI_V618__),false);
   await p.locator('#homeShopTabV601').click();
   assert.equal(await p.locator('#homeShopViewV601').isVisible(),true);
   assert.equal(await p.locator('#nativeShopV620').isVisible(),true);
   assert.equal(await p.locator('#homeShopViewV601 #labPanel').isVisible(),false,'old DNA shop still visible');
   assert.equal(await p.locator('button[data-native-sku]').count(),5);
   assert.equal(await p.locator('button[data-native-core]').count(),2);
   let old=await p.evaluate(()=>({
    game:localStorage.getItem('EVOLVE_V575_TEST_NATIVE_620_SENTINEL'),
    ledger:localStorage.getItem('M03_LEDGER_NATIVE_620_SENTINEL'),
    mock:localStorage.getItem('EVOLVE_DEV_MOCK_STORE_V1')
   }));
   await p.locator('button[data-native-sku="appearance_unlock_01"]').click();
   await p.locator('#nativeShopConfirmV620').waitFor();
   await p.locator('#nativeShopConfirmCancelV620').click();
   assert.equal(await p.evaluate(()=>localStorage.getItem('EVOLVE_DEV_MOCK_STORE_V1')),old.mock,'cancel modified storage');
   await p.locator('button[data-native-sku="appearance_unlock_01"]').click();
   await p.locator('#nativeShopConfirmAcceptV620').click();
   assert.equal(await p.locator('button[data-native-sku="appearance_unlock_01"]').isDisabled(),true);
   await p.locator('button[data-native-core="dev_core_theme_01"]').click();
   assert.equal(await p.locator('button[data-native-core="dev_core_theme_01"]').getAttribute('aria-pressed'),'true');
   await p.waitForFunction(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__?.read().theme==='dev_core_theme_01',null,{timeout:20000});
   await p.locator('button[data-native-sku="mutation_crystal_small"]').click();
   await p.evaluate(()=>{
    const btn=document.getElementById('nativeShopConfirmAcceptV620');btn.click();btn.click();btn.click();
   });
   assert.equal(await p.evaluate(()=>window.__EVOLVE_NATIVE_SHOP_V620__.getState().testCrystals),100,'triple-click granted multiple times');
   await p.locator('button[data-native-sku="mutation_crystal_mid"]').click();
   await p.locator('#nativeShopConfirmAcceptV620').click();
   assert.equal(await p.evaluate(()=>window.__EVOLVE_NATIVE_SHOP_V620__.getState().testCrystals),400);
   await p.locator('button[data-native-core="dev_core_theme_02"]').click();
   await p.locator('#nativeShopConfirmAcceptV620').click();
   assert.equal(await p.evaluate(()=>window.__EVOLVE_NATIVE_SHOP_V620__.getState().testCrystals),280);
   await p.locator('button[data-native-core="dev_core_theme_02"]').click();
   assert.equal(await p.waitForFunction(()=>window.__EVOLVE_DEV_CORE_BRIDGE_V617__.read().theme==='dev_core_theme_02').then(()=>true),true);
   assert.equal(await p.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_NATIVE_620_SENTINEL')),old.game);
   assert.equal(await p.evaluate(()=>localStorage.getItem('M03_LEDGER_NATIVE_620_SENTINEL')),old.ledger);
   const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert.ok(overflow<=2,'horizontal overflow');
   const heights=await p.locator('#nativeShopV620 button:visible').evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().height)));
   assert.ok(heights.every(h=>h>=44),'touch controls smaller than 44: '+JSON.stringify(heights));
   await p.screenshot({path:path.join(output,'native-shop-v620-'+w+'x'+h+'.png')});
   await p.locator('#homeBattleTabV522').click();
   assert.equal(await p.evaluate(()=>window.__EVOLVE_NATIVE_SHOP_V620__.hasPending()),false);
   assert.deepEqual(errors,[]);
   results.push({viewport:w+'x'+h,defaultShopVisible:true,legacyDevRemoved:true,oldDNAHidden:true,coreVisualSwitch:true,creditsAfterRedemption:280,originalSaveProtected:true,allTouch44:true});
   await context.close();
  }
  const context=await chrome.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('EVOLVE_DEV_MOCK_STORE_V1','broken-json{'));
  const p=await context.newPage();await p.goto(base+'?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await p.waitForFunction(()=>window.__EVOLVE_NATIVE_SHOP_V620__&&!document.getElementById('webLoader'),null,{timeout:220000});
  await p.evaluate(()=>document.getElementById('introSplash')?.click());
  await p.locator('#homeShopTabV601').click();
  assert.equal(await p.evaluate(()=>window.__EVOLVE_NATIVE_SHOP_V620__.isReadOnly()),true);
  assert.match(await p.locator('#nativeShopContentV620').innerText(),/읽을 수 없어/);
  assert.equal(await p.evaluate(()=>localStorage.getItem('EVOLVE_DEV_MOCK_STORE_V1')),'broken-json{');
  await context.close();
  console.log(JSON.stringify({success:true,viewports:results,corruptedStorageProtected:true,realBillingEnabled:false,legacyDevOverlayDeleted:true}));
 }finally{await chrome.close();server.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;server.close()});
