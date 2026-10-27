'use strict';
/* M05 60% browser QA: corrupt/writable storage, rapid confirms and confirmation dismissal. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../dist'),mimes={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',mimes[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);
});
const KEY='EVOLVE_DEV_MOCK_STORE_V1';
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const origin='http://127.0.0.1:'+server.address().port+'/',records=[];
 const folder=path.resolve(__dirname,'../test-results');fs.mkdirSync(folder,{recursive:true});
 async function loadPage(context,pageUrl=origin+'?evolveMockShop=1&evolveM05UX=1&evolveQA=1'){
  const page=await context.newPage(),errors=[];page.on('pageerror',x=>errors.push(String(x)));
  await page.goto(pageUrl,{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_DEV_M05_UI_V618__&&document.querySelector('#m04MockTriggerV616')&&!document.getElementById('webLoader'),null,{timeout:240000});
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
  return {page,errors};
 }
 try{
  for(const [width,height] of [[393,852],[320,568]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   await context.addInitScript(()=>localStorage.setItem('EVOLVE_V575_TEST_OLD_SAVE','NO_M05_WRITES_ALLOWED'));
   const {page,errors}=await loadPage(context);
   assert.equal(await page.locator('#homeTabs>button').count(),5);
   await page.locator('#m04MockTriggerV616').click();
   await page.locator('#m05NavigationV618').waitFor();
   await page.locator('.m05DetailLink[data-m05-sku="mutation_crystal_small"]').click();
   await page.locator('#m05DetailActionV618').click();
   await page.locator('#m04MockConfirmV617').waitFor();
   const before=await page.evaluate(key=>localStorage.getItem(key),KEY);
   await page.evaluate(()=>document.getElementById('m04MockModalV616').click());
   await page.waitForFunction(()=>!document.getElementById('m04MockConfirmV617'));
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),before,'backdrop cancellation must not write');
   assert.equal(await page.locator('#m04MockModalV616').isVisible(),true);
   await page.locator('#m05DetailActionV618').click();
   await page.locator('#m04MockConfirmV617').waitFor();
   await page.locator('#m04MockModalV616 .m04MockHead button').click();
   await page.waitForFunction(()=>!document.getElementById('m04MockConfirmV617'));
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),before,'header close must cancel first');
   assert.equal(await page.locator('#m04MockModalV616').isVisible(),true);
   await page.locator('#m05DetailActionV618').click();
   await page.locator('#m04MockConfirmV617').waitFor();
   const blocked=await page.evaluate(()=>{const a=window.__EVOLVE_DEV_M05_UI_V618__;const b=a.safety().blockedActions;
    document.querySelector('#m05NavigationV618 button[data-m05-section="collection"]').click();
    document.querySelector('#m05DetailV618 .m05Back').click();
    return {before:b,after:a.safety().blockedActions,mode:a.current()};
   });
   assert.equal(blocked.mode,'detail');
   assert.ok(blocked.after>=blocked.before+2,JSON.stringify(blocked));
   await page.evaluate(()=>{
    const approve=document.getElementById('m04MockApproveV617');
    approve.click();approve.click();approve.click();
   });
   await page.waitForFunction(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read().testCrystals===100);
   const count=await page.evaluate(()=>window.__EVOLVE_DEV_MOCK_UI_V616__.read().testCrystals);
   assert.equal(count,100,'rapid approve caused duplicate rewards');
   assert.equal(await page.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_OLD_SAVE')),'NO_M05_WRITES_ALLOWED');
   const navHeights=await page.locator('#m05NavigationV618 button').evaluateAll(xs=>xs.map(x=>Math.round(x.getBoundingClientRect().height)));
   assert.ok(navHeights.every(x=>x>=44));
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert.ok(overflow<=2);
   await page.screenshot({path:path.join(folder,'m05-060-race-'+width+'x'+height+'.png')});
   assert.deepEqual(errors,[]);
   records.push({viewport:width+'x'+height,backdropCancelNoWrites:true,headerCancelNoWrites:true,navigationLocked:true,rapidTripleConfirmSingleGrant:true,legacySaveSafe:true,targetHeights:navHeights});
   await context.close();
  }
  const corrupt=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  await corrupt.addInitScript(key=>localStorage.setItem(key,'{invalid_json'),KEY);
  const {page:corruptPage,errors:corruptErrors}=await loadPage(corrupt);
  const badBefore=await corruptPage.evaluate(k=>localStorage.getItem(k),KEY);
  await corruptPage.locator('#m04MockTriggerV616').click();
  await corruptPage.locator('#m05SafeErrorV619').waitFor();
  assert.match(await corruptPage.locator('#m05SafeErrorV619').innerText(),/자동 삭제하거나 덮어쓰지 않아/);
  assert.equal(await corruptPage.locator('#m05SafeErrorV619 button').count(),1);
  assert.equal(await corruptPage.evaluate(k=>localStorage.getItem(k),KEY),badBefore);
  await corruptPage.locator('#m05SafeErrorV619 button').click();
  assert.equal(await corruptPage.locator('#m04MockModalV616').isVisible(),false);
  assert.equal(await corruptPage.evaluate(k=>localStorage.getItem(k),KEY),badBefore);
  assert.deepEqual(corruptErrors,[]);
  await corrupt.close();
  const broken=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  await broken.addInitScript(()=>localStorage.setItem('EVOLVE_V575_TEST_OLD_SAVE','SAVE_PROTECTED'));
  const {page:writePage,errors:writeErrors}=await loadPage(broken);
  await writePage.locator('#m04MockTriggerV616').click();
  await writePage.locator('.m05DetailLink[data-m05-sku="mutation_crystal_small"]').click();
  await writePage.locator('#m05DetailActionV618').click();
  await writePage.locator('#m04MockConfirmV617').waitFor();
  await writePage.evaluate(key=>{
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('TEST_WRITE_DENIED','QuotaExceededError');return original.call(this,name,value)};
  },KEY);
  await writePage.locator('#m04MockApproveV617').click();
  await writePage.locator('#m05SafeBannerV619').waitFor();
  assert.match(await writePage.locator('#m05SafeBannerV619').innerText(),/추가 구매·장착·초기화를 차단/);
  assert.equal(await writePage.locator('#m05DetailActionV618').isDisabled(),true);
  assert.equal(await writePage.locator('#m04MockApproveV617').isDisabled(),true);
  assert.equal(await writePage.evaluate(()=>window.__EVOLVE_DEV_M05_UI_V618__.safety().readOnly),true);
  assert.equal(await writePage.evaluate(key=>localStorage.getItem(key),KEY),null);
  assert.equal(await writePage.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_OLD_SAVE')),'SAVE_PROTECTED');
  assert.deepEqual(writeErrors,[]);
  await broken.close();
  console.log(JSON.stringify({success:true,mobile:records,corruptStoreReadOnly:true,storageWriteFailureReadOnly:true,originalGameKeysPreserved:true,realCheckout:false}));
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;server.close()});
