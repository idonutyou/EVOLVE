'use strict';
/* M05 50% real-game shell mobile QA: owned/equipped CTA, collection, mock debit, save isolation. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../dist');
const mimes={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const loc=new URL(req.url,'http://localhost');
 const file=path.resolve(root,'.'+(loc.pathname==='/'?'/index.html':loc.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',mimes[path.extname(file)]||'application/octet-stream');
 fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const url='http://127.0.0.1:'+server.address().port+'/',out=path.resolve(__dirname,'../test-results');
 fs.mkdirSync(out,{recursive:true});
 const results=[];
 try{
  for(const [width,height] of [[393,852],[320,568]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const beforeGame='EVOLVE_V575_TEST_SAFE_SENTINEL';
   await page.addInitScript(key=>localStorage.setItem(key,'M05_DO_NOT_EDIT_GAME_SAVE'),beforeGame);
   await page.goto(url+'?evolveMockShop=1&evolveM05UX=1&evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForFunction(()=>window.__EVOLVE_DEV_M05_UI_V618__&&document.querySelector('#m04MockTriggerV616')&&!document.getElementById('webLoader'),null,{timeout:240000});
   assert.equal(await page.locator('#homeTabs>button').count(),5);
   await page.evaluate(()=>document.getElementById('introSplash')?.click());
   await page.locator('#m04MockTriggerV616').click();
   await page.locator('#m05NavigationV618').waitFor();
   await page.locator('.m05DetailLink[data-m05-sku="appearance_unlock_01"]').click();
   assert.equal(await page.locator('#m05DetailV618').getAttribute('data-owned'),'false');
   assert.match(await page.locator('#m05DetailActionV618').innerText(),/모의 획득/);
   const previous=await page.evaluate(()=>localStorage.getItem('EVOLVE_DEV_MOCK_STORE_V1'));
   await page.locator('#m05DetailActionV618').click();
   await page.locator('#m04MockConfirmV617').getByRole('button',{name:'취소'}).click();
   assert.equal(await page.evaluate(()=>localStorage.getItem('EVOLVE_DEV_MOCK_STORE_V1')),previous);
   await page.locator('#m05DetailActionV618').click();
   await page.locator('#m04MockApproveV617').click();
   await page.waitForFunction(()=>document.getElementById('m05DetailV618')?.dataset.owned==='true');
   assert.match(await page.locator('#m05DetailActionV618').innerText(),/장착/);
   assert.equal(await page.locator('#m05DetailV618 .m05Badge').innerText(),'보유 중');
   await page.locator('#m05DetailActionV618').click();
   await page.waitForFunction(()=>document.getElementById('m05DetailV618')?.dataset.equipped==='true');
   assert.equal(await page.locator('#m05DetailActionV618').innerText(),'해제');
   assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read().equipped.core),'dev_core_theme_01');
   await page.locator('#m05DetailActionV618').click();
   await page.waitForFunction(()=>document.getElementById('m05DetailV618')?.dataset.equipped==='false');
   assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read().equipped.core),undefined);
   await page.locator('#m05DetailV618').getByRole('button',{name:'코어 컬렉션 보기'}).click();
   assert.equal(await page.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'collection');
   assert.match(await page.locator('#m05CollectionStatusV618').innerText(),/1\/2/);
   assert.equal(await page.locator('.m04CoreLook[data-entitlement="dev_core_theme_01"]').getAttribute('data-owned'),'true');
   assert.equal(await page.locator('.m04CoreLook[data-entitlement="dev_core_theme_02"]').getAttribute('data-owned'),'false');
   await page.locator('#m05NavigationV618 button[data-m05-section="shop"]').click();
   for(const sku of ['mutation_crystal_small','mutation_crystal_mid']){
    await page.locator('.m05DetailLink[data-m05-sku="'+sku+'"]').click();
    await page.locator('#m05DetailActionV618').click();
    await page.locator('#m04MockApproveV617').click();
    await page.locator('#m05DetailV618 .m05Badge').waitFor();
    await page.locator('#m05DetailV618').getByRole('button',{name:'← 상품 목록'}).click();
   }
   assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read().testCrystals),400);
   await page.locator('#m05NavigationV618 button[data-m05-section="collection"]').click();
   const crimson=page.locator('.m04CoreLook[data-entitlement="dev_core_theme_02"]');
   await crimson.getByRole('button',{name:/120 TEST 결정으로 해금/}).click();
   await page.locator('#m04MockApproveV617').click();
   await page.waitForFunction(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read().owned.dev_core_theme_02===true);
   assert.equal(await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read().testCrystals),280);
   assert.match(await page.locator('#m05CollectionStatusV618').innerText(),/2\/2/);
   await crimson.getByRole('button',{name:/장착/}).click();
   await page.waitForFunction(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read().equipped.core==='dev_core_theme_02');
   assert.equal(await crimson.getAttribute('data-equipped'),'true');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),beforeGame),'M05_DO_NOT_EDIT_GAME_SAVE');
   const heights=await page.locator('#m05NavigationV618 button').evaluateAll(x=>x.map(b=>Math.round(b.getBoundingClientRect().height)));
   assert.ok(heights.every(x=>x>=44),'Navigation target too small: '+heights);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert.ok(overflow<=2,'Horizontal overflow '+overflow);
   assert.deepEqual(errors,[]);
   await page.screenshot({path:path.join(out,'m05-050-owned-'+width+'x'+height+'.png')});
   results.push({viewport:width+'x'+height,ownership:true,equip_unequip:true,crimson_unlocked:true,crimson_equipped:true,finalTestCredits:280,cancelBytesUnchanged:true,originalSaveUnchanged:true,navHeight:heights,overflow});
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  for(const params of ['','?evolveMockShop=1']){
   const page=await context.newPage();
   await page.goto(url+params,{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForFunction(()=>document.querySelector('#m04MockTriggerV616')||!document.getElementById('webLoader'),null,{timeout:240000});
   assert.equal(await page.evaluate(()=>Boolean(window.__EVOLVE_DEV_M05_UI_V618__)),false,'M05 enabled without both query flags');
   await page.close();
  }
  await context.close();
  console.log(JSON.stringify({pass:true,results,defaultAndM04OnlyModeUnaffected:true,realPayment:false}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;server.close()});
