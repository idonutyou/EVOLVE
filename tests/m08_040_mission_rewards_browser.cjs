'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist'),mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let chrome;
 try{
  chrome=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
  const context=await chrome.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
  await context.addInitScript(()=>{localStorage.setItem('EVOLVE_V575_M08_040_SAFE','GAME');localStorage.setItem('EVOLVE_M03_M08_040_SAFE','LEDGER');});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_HOME_HUB_V601__?.read().ready&&!document.getElementById('webLoader')&&window.__EVOLVE_SHOP_V621__&&window.__EVOLVE_M08_MISSION_REWARDS_V624_ACTIVE__,null,{timeout:150000});
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
  await page.locator('#memoryBtn').click();
  await page.locator('#homeChallengeViewV601').waitFor({state:'visible'});
  assert.equal(await page.locator('#m08MissionRewardsV624').count(),1);
  assert.equal(await page.locator('#m08MissionRewardsV624 button[data-m08-claim]').count(),3);
  const before=await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().crystals);
  assert.equal(before,0);
  await page.evaluate(()=>{
   const day=window.__EVOLVE_SHOP_EXPERIENCE_V621__.kstDay(Date.now());
   const unlocked=window.__EVOLVE_ADMIN_MODE_V585__.read().normal.unlocked;
   localStorage.setItem('EVOLVE_M08_STAGE_MISSION_V622_V1',JSON.stringify({schema:'evolve.m08.stage.v622.1',seenUnlocked:unlocked,stageEvents:1,completed:{'1':true},days:{[day]:true},lastStage:1,revision:1}));
   localStorage.setItem('EVOLVE_M08_RUNTIME_MISSIONS_V623_V1',JSON.stringify({schema:'evolve.m08.runtime.v623.1',revision:1,runEnds:1,discoveries:1,codex:null,days:{[day]:{runEnds:1,discoveries:1}}}));
  });
  // M08 50%: returning to CHALLENGE refreshes without an idle 1.8s timer.
  await page.locator('#homeBattleTabV522').click();
  await page.locator('#memoryBtn').click();
  assert.equal(await page.locator('#m08MissionRewardsV624 .m08RewardWalletV624').textContent(),'보유 결정 ◆ 0');
  for(const id of ['stage','run','codex']){
   const button=page.locator('#m08MissionRewardsV624 button[data-m08-claim="'+id+'"]');
   await button.waitFor({state:'visible'});
   assert.equal(await button.isEnabled(),true,id);
   await button.click();
   assert.equal(await button.isEnabled(),false,'duplicate claim '+id);
  }
  assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().crystals),25);
  assert.equal(await page.locator('#m08MissionRewardsV624 .m08RewardWalletV624').textContent(),'보유 결정 ◆ 25');
  assert.equal(await page.evaluate(()=>window.__EVOLVE_M08_MISSION_REWARDS_V624_ACTIVE__.refreshMode),'EVENT_DRIVEN');
  assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().firstPurchase),false);
  const saved=await page.evaluate(()=>({original:localStorage.getItem('EVOLVE_V575_M08_040_SAFE'),ledger:localStorage.getItem('EVOLVE_M03_M08_040_SAFE')}));
  assert.deepEqual(saved,{original:'GAME',ledger:'LEDGER'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__EVOLVE_M08_MISSION_REWARDS_V624_ACTIVE__&&!document.getElementById('webLoader'),null,{timeout:150000});
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
  await page.locator('#memoryBtn').click();
  for(const id of ['stage','run','codex'])assert.equal(await page.locator('#m08MissionRewardsV624 button[data-m08-claim="'+id+'"]').textContent(),'수령 완료');
  // At 80% verify card touch targets fit small portrait, normal portrait and landscape.
  for(const [width,height] of [[320,568],[393,852],[852,393]]){
   await page.setViewportSize({width,height});
   const layout=await page.locator('#m08MissionRewardsV624').evaluate(card=>{
    const box=card.getBoundingClientRect(),buttons=[...card.querySelectorAll('button')].map(b=>{
     const r=b.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height};
    });
    return {left:box.left,right:box.right,buttons,viewport:window.innerWidth};
   });
   assert.ok(layout.left>=-3&&layout.right<=layout.viewport+3,'card horizontal fit '+JSON.stringify({width,layout}));
   assert.ok(layout.buttons.every(x=>x.left>=-3&&x.right<=layout.viewport+3&&x.height>=44),'reward tap targets '+JSON.stringify({width,layout}));
  }
  await page.setViewportSize({width:393,height:852});
  await page.locator('#homeShopTabV601').click();
  await page.locator('#evolveShopV621').waitFor({state:'visible'});
  assert.equal(await page.locator('#evolveShopV621 .eStoreWalletV621 strong').textContent(),'25');
  await page.locator('#evolveShopV621 .eStoreCardV621').filter({hasText:'첫 진화 패키지'}).getByRole('button',{name:/구매/}).click();
  await page.locator('#evolveShopV621 .eStoreConfirmV621 button').filter({hasText:'구매 확정'}).click();
  assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().crystals),150);
  assert.equal(await page.evaluate(()=>window.__EVOLVE_SHOP_V621__.read().firstPurchase),true);
  assert.equal(await page.locator('#homeTabs>button').count(),5);
  assert.deepEqual(errors,[],'page JS exceptions');
  await context.close();
  console.log('M08 40% real Chromium PASS: 3 daily claims => +25 SHOP crystals, reload idempotence, starter first-bonus preserved, saves unchanged.');
 }catch(e){console.error('M08 40% browser FAIL',e);process.exitCode=1;}
 finally{await chrome?.close();await new Promise(ok=>server.close(ok));}
})();
