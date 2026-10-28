'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const uri=new URL(req.url,'http://localhost');
 if(uri.pathname==='/m08-qa'){
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#16161a}#endOverlay,#codexOverlay{display:none}</style><script>
window.__qaHome=true;window.__qaStage=2;window.__qaAdmin=false;
window.EVOLVE_WEB_GUARD={atHome:()=>window.__qaHome};
window.__EVOLVE_ADMIN_MODE_V585__={read:()=>({enabled:window.__qaAdmin,normal:{unlocked:window.__qaStage}})};
</script><script defer src="/m08-stage-mission-v622.js"></script><script defer src="/m08-runtime-missions-v623.js"></script></head><body>
<button id="memoryBtn">CHALLENGE</button><button id="codexBtn">CODEX</button><section id="homeChallengeViewV601"></section>
<div id="endOverlay">END</div><div id="codexOverlay"><span id="codexSummary">DISCOVERED 4 / 20</span></div>
</body></html>`);return;
 }
 const name=path.resolve(dist,'.'+(uri.pathname==='/'?'/index.html':uri.pathname));
 if(!name.startsWith(dist+path.sep)||!fs.existsSync(name)||!fs.statSync(name).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.woff':'font/woff','.webp':'image/webp'};
 res.setHeader('Content-Type',mime[path.extname(name)]||'application/octet-stream');fs.createReadStream(name).pipe(res);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const [width,height] of [[320,568],[393,852],[852,393]]){
   const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const page=await ctx.newPage();await page.goto(base+'/m08-qa',{waitUntil:'load'});
   await page.waitForFunction(()=>window.__EVOLVE_M08_STAGE_MISSION_V622_ACTIVE__&&window.__EVOLVE_M08_RUNTIME_MISSIONS_V623_ACTIVE__);
   const checks=await page.evaluate(()=>{
    const s=window.__EVOLVE_M08_STAGE_MISSION_V622_ACTIVE__,r=window.__EVOLVE_M08_RUNTIME_MISSIONS_V623_ACTIVE__;
    localStorage.setItem('EVOLVE_V575_PRESERVE','GAME');localStorage.setItem('EVOLVE_SHOP_PRESERVE','SHOP');
    window.__qaStage=3;s.refresh();s.refresh();
    document.querySelector('#codexOverlay').style.display='block';r.refresh();
    document.querySelector('#codexSummary').textContent='DISCOVERED 5 / 20';r.refresh();r.refresh();
    document.querySelector('#codexOverlay').style.display='none';window.__qaHome=false;r.refresh();
    document.querySelector('#endOverlay').style.display='block';r.refresh();r.refresh();
    return {stage:s.read().total,run:r.read().runEnds,codex:r.read().discoveries,
      cards:document.querySelectorAll('#homeChallengeViewV601 > section').length,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      game:localStorage.getItem('EVOLVE_V575_PRESERVE'),shop:localStorage.getItem('EVOLVE_SHOP_PRESERVE')};
   });
   assert.equal(checks.stage,1);assert.equal(checks.run,1);assert.equal(checks.codex,1);
   assert.equal(checks.cards,2);assert.equal(checks.game,'GAME');assert.equal(checks.shop,'SHOP');
   assert.ok(checks.overflow<=3,'horizontal overflow: '+JSON.stringify({width,height,checks}));
   if(width===393)await page.screenshot({path:path.join(out,'m08-030-mobile-harness.png')});
   await page.reload({waitUntil:'load'});
   assert.equal(await page.evaluate(()=>window.__EVOLVE_M08_RUNTIME_MISSIONS_V623_ACTIVE__.read().discoveries),1);
   await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await ctx.newPage();
  await page.goto(base+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_HOME_HUB_V601__?.read().ready&&!document.getElementById('webLoader')&&window.__EVOLVE_M08_STAGE_MISSION_V622_ACTIVE__&&window.__EVOLVE_M08_RUNTIME_MISSIONS_V623_ACTIVE__,null,{timeout:160000});
  await page.evaluate(()=>document.getElementById('introSplash')?.click());
  await page.locator('#memoryBtn').click();
  await page.locator('#homeChallengeViewV601').waitFor({state:'visible'});
  assert.equal(await page.locator('#m08StageMissionV622').count(),1);
  assert.equal(await page.locator('#m08RuntimeMissionsV623').count(),1);
  assert.equal(await page.locator('#homeTabs>button').count(),5);
  await page.screenshot({path:path.join(out,'m08-030-real-game-challenge.png')});
  await ctx.close();
  console.log('M08 30% browser PASS: 3 mobile viewport DOM tests + real game HOME CHALLENGE at 393x852');
 }catch(e){console.error('M08 30% browser FAIL',e);process.exitCode=1;}
 finally{await browser?.close();await new Promise(ok=>server.close(ok));}
})();
