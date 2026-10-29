'use strict';
// M09 release-prep lightweight UI check: REAL shop engine + UI, no 386MB game assets.
// Use a minimal DOM fixture to validate purchase, saving, pass gates and mobile CSS.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const repo=path.resolve(__dirname,'..');
const assets=new Map([
 ['/shop-experience-v621.js',path.join(repo,'web/shop-experience-v621.js')],
 ['/shop-front-v621.js',path.join(repo,'web/shop-front-v621.js')]
]);
const pageHtml='<!doctype html><html lang="ko"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;width:100%;max-width:100%;overflow-x:hidden;background:#0d1016}#homeShopViewV601{padding:9px;box-sizing:border-box;width:100%}</style></head><body>'+
 '<div id="homeStatusV525"><div class="profileInfoV525">EVOLVE</div></div>'+
 '<button id="homeShopTabV601">SHOP</button><button id="homeBattleTabV522">BATTLE</button>'+
 '<div id="homeShopViewV601"><div id="nativeShopV620"></div></div>'+
 '<div id="homePartsViewV523"></div><div id="homeChallengeViewV601"></div><button id="memoryBtn">CHALLENGE</button>'+
 '<script>window.EVOLVE_WEB_GUARD={atHome:()=>true};</script>'+
 '<script src="/shop-experience-v621.js"></script><script src="/shop-front-v621.js"></script></body></html>';
function serve(req,res){
 const url=new URL(req.url,'http://localhost'),asset=assets.get(url.pathname);
 if(asset){res.setHeader('Content-Type','application/javascript; charset=utf-8');return fs.createReadStream(asset).pipe(res)}
 if(url.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(pageHtml)}
 res.writeHead(404);res.end();
}
const timestamp=iso=>Date.parse(iso);
const run=async()=>{
 const server=http.createServer(serve);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/?evolveQA=1';
 let browser;
 try{
  const chromePath=process.env.CHROME_BIN||undefined;
  browser=await chromium.launch({executablePath:chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const results=[];
  for(const [width,height]of [[320,568],[393,852],[852,393]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,isMobile:width<600});
   await context.addInitScript(()=>{
    window.__M09_TEST_NOW=Date.parse('2027-05-01T04:00:00.000Z');
    Date.now=()=>window.__M09_TEST_NOW;
    localStorage.setItem('EVOLVE_M09_SAVE_SENTINEL','KEEP');
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'load'});
   await page.locator('#evolveShopV621').waitFor({state:'visible'});
   assert.equal(await page.locator('#evolveShopV621 .eStoreCardV621').count(),6,'preserves six SKUs');
   if(width===320){
    await page.locator('#evolveShopV621 .eStoreCardV621').filter({hasText:'첫 진화 패키지'}).getByRole('button',{name:/구매/}).click();
    await page.locator('#evolveShopV621 .eStoreConfirmV621').getByRole('button',{name:'구매 확정'}).click();
    assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().crystals),210);
    assert.equal(await page.evaluate(()=>window.getComputedStyle(document.querySelector('.eM09StarterBadgeV626')).display),'grid','profile badge visible');
    await page.locator('#evolveShopV621 .eM09NameplateRow button').click();
    await page.locator('#evolveShopV621 .eStoreConfirmV621').getByRole('button',{name:'해금 확정'}).click();
    assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().crystals),30);
    await page.locator('#evolveShopV621 .eM09NameplateRow button').click();
    assert.equal(await page.evaluate(()=>window.getComputedStyle(document.getElementById('m09HomeNameplateV625')).display),'block');
    await page.locator('#evolveShopV621 .eStoreCardV621').filter({hasText:'월간 연구 패스'}).getByRole('button',{name:/구매/}).click();
    await page.locator('#evolveShopV621 .eStoreConfirmV621').getByRole('button',{name:'구매 확정'}).click();
    assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().passActive),true);
    for(let day=1;day<=3;day++){
     await page.evaluate((d)=>{window.__M09_TEST_NOW=Date.parse('2027-05-'+String(d).padStart(2,'0')+'T04:00:00.000Z');},day);
     await page.locator('#homeShopTabV601').click();
     await page.locator('#evolveShopV621 .eStoreDailyV621').getByRole('button',{name:'보상 받기'}).click();
     if(day===1)await page.locator('#evolveShopV621 .eStoreDailyV621').getByRole('button',{name:/연구 단계 1/}).click();
     if(day===2)assert.equal(await page.locator('#evolveShopV621 .eStoreDailyV621').getByRole('button',{name:/연구 단계 2/}).isDisabled(),true);
     if(day===3)await page.locator('#evolveShopV621 .eStoreDailyV621').getByRole('button',{name:/연구 단계 2/}).click();
    }
    assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().rewardClaims['2027-05:2']),true);
    const counters=await page.evaluate(()=>window.__EVOLVE_M09_FUNNEL_V627__.read().counters);
    assert.ok(counters.product_view>=2&&counters.purchase_confirm_local>=2&&counters.cosmetic_redeem>=1&&counters.cosmetic_equip>=1);
    await page.reload({waitUntil:'load'});
    assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().uiCollectibles.equipped.home_nameplate),'lab_nameplate');
    assert.equal(await page.evaluate(()=>localStorage.getItem('EVOLVE_M09_SAVE_SENTINEL')),'KEEP');
   }
   const excess=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert.ok(excess<=3,'viewport horizontal overflow '+width+'x'+height+': '+excess);
   const sizes=await page.locator('#evolveShopV621 button:visible').evaluateAll(a=>a.map(b=>b.getBoundingClientRect().height));
   assert.ok(sizes.every(h=>h>=44),'tap controls under 44px at '+width+'x'+height);
   assert.deepEqual(errors,[],'browser JS errors');
   results.push(width+'x'+height);
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:393,height:852}});
  await context.addInitScript(()=>{window.__M09_TEST_NOW=Date.parse('2027-05-30T04:00:00Z');Date.now=()=>window.__M09_TEST_NOW});
  const late=await context.newPage();await late.goto(url,{waitUntil:'load'});await late.locator('#evolveShopV621').waitFor();
  const disabled=await late.locator('#evolveShopV621 .eStoreCardV621').filter({hasText:'월간 연구 패스'}).locator('button').isDisabled();
  assert.equal(disabled,true,'late-month can never reach 21 days');
  await context.close();
  console.log('M09 90% BROWSER PASS: real SHOP code, 320/393/852 viewports, starter/nameplate/pass UI, QA funnel, reload, late-month guard, no overflow/errors, no heavy engine.');
 }finally{if(browser)await browser.close();server.close()}
};
run().catch(e=>{console.error(e.stack||e);process.exitCode=1});
