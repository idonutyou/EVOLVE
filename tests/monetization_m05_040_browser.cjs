'use strict';
// Browser smoke against the real M04 web shell; M05 UI is additionally opt-in.
const {chromium}=require('playwright'),{strict:assert}=require('node:assert');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../dist');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res)
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const results=[];const output=path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
 try{
  for(const size of [[393,852],[320,568]]){
   const ctx=await browser.newContext({viewport:{width:size[0],height:size[1]},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const page=await ctx.newPage(),errors=[];page.on('pageerror',x=>errors.push(String(x)));
   const origin='http://127.0.0.1:'+server.address().port+'/';
   await page.addInitScript(()=>localStorage.setItem('EVOLVE_V575_TEST_META_V1',JSON.stringify({dna:1200,stage:3,unlockedStageV522:4,homeStageV522:3})));
   await page.goto(origin+'?evolveMockShop=1&evolveM05UX=1&evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForFunction(()=>window.__EVOLVE_DEV_M05_UI_V618__&&document.querySelector('#m04MockTriggerV616')&&!document.getElementById('webLoader'),null,{timeout:240000});
   assert.equal(await page.locator('#homeTabs>button').count(),5);
   await page.evaluate(()=>document.getElementById('introSplash')?.click());
   await page.locator('#m04MockTriggerV616').click();
   await page.locator('#m05NavigationV618').waitFor();
   assert.equal(await page.locator('#m05NavigationV618>button').count(),2);
   assert.equal(await page.locator('.m04MockCard').count(),5);
   assert.equal(await page.locator('.m05DetailLink').count(),5);
   assert.equal(await page.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'shop');
   await page.locator('.m05DetailLink[data-m05-sku="mutation_crystal_small"]').click();
   await page.locator('#m05DetailTitleV618').waitFor();
   assert.match(await page.locator('#m05DetailV618').innerText(),/TEST 결정 \+100/);
   assert.equal(await page.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'detail');
   const stateBefore=await page.evaluate(()=>localStorage.getItem('EVOLVE_DEV_MOCK_STORE_V1'));
   await page.locator('#m05DetailV618').getByRole('button',{name:'모의 획득'}).click();
   await page.locator('#m04MockConfirmV617').waitFor();
   await page.locator('#m04MockConfirmV617').getByRole('button',{name:'취소'}).click();
   assert.equal(await page.evaluate(()=>localStorage.getItem('EVOLVE_DEV_MOCK_STORE_V1')),stateBefore);
   await page.locator('#m05DetailV618').getByRole('button',{name:'모의 획득'}).click();
   await page.locator('#m04MockApproveV617').click();
   assert.match(await page.locator('.m04MockBalance').innerText(),/100/);
   await page.locator('#m05DetailV618').getByRole('button',{name:'← 상품 목록'}).click();
   await page.locator('#m05NavigationV618').getByRole('button',{name:'코어 컬렉션'}).click();
   assert.equal(await page.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'collection');
   assert.equal(await page.locator('.m04CoreLook').count(),2);
   await page.screenshot({path:path.join(output,'m05-040-'+size.join('x')+'.png')});
   const controls=await page.locator('#m05NavigationV618 button').evaluateAll(ns=>ns.map(b=>Math.round(b.getBoundingClientRect().height)));
   assert.ok(controls.every(h=>h>=44),JSON.stringify(controls));
   const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert.ok(horizontal<=2,'horizontal browser overflow '+horizontal);
   assert.deepEqual(errors,[]);
   results.push({viewport:size.join('x'),mockTabs:2,details:5,cancelBytesPreserved:true,mockCredits:100,coreItems:2,navHeights:controls,horizontal});
   await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveMockShop=1&evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_DEV_MOCK_UI_V616__&&!document.getElementById('webLoader'),null,{timeout:240000});
  assert.equal(await page.evaluate(()=>Boolean(window.__EVOLVE_DEV_M05_UI_V618__)),false,'M05 must require second opt-in');
  await ctx.close();
  console.log(JSON.stringify({pass:true,viewports:results,oldM04WithoutSecondFlagPreserved:true,actualPayment:false}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;server.close()});
