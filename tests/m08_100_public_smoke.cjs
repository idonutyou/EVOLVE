'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.EVOLVE_TEST_BASE_URL||'https://idonutyou.github.io/EVOLVE/';
const url=base.replace(/\/?$/, '/')+'?m08_smoke='+Date.now();
const output=path.resolve(__dirname,'../test-results/m08-100-public-smoke.json');
(async()=>{
 let browser,report={url,checks:[],pageErrors:[],public:true};
 try{
  let proxy;
  const env=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;
  if(env){const u=new URL(env);proxy={server:u.protocol+'//'+u.host};if(u.username)proxy.username=decodeURIComponent(u.username);if(u.password)proxy.password=decodeURIComponent(u.password);}
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,proxy,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:393,height:852},hasTouch:true,isMobile:true,ignoreHTTPSErrors:!!proxy,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>report.pageErrors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:100000});
  await page.waitForFunction(()=>!document.getElementById('webLoader')&&window.__EVOLVE_HOME_HUB_V601__?.read()?.ready&&window.__EVOLVE_SHOP_V621__&&window.__EVOLVE_M08_MISSION_REWARDS_V624_ACTIVE__,null,{timeout:120000});
  report.checks.push('real Github Pages game boot, HOME, V621 SHOP and M08 mission global ready');
  const version=await page.evaluate(async()=>{
   const res=await fetch('version.json?m08_live_version='+Date.now(),{cache:'no-store'});
   assertBrowserResponse(res);
   const remote=await res.json();
   return {html:window.EVOLVE_WEB_CONFIG?.build||'',published:remote.build||''};
   function assertBrowserResponse(response){if(!response.ok)throw Error('PUBLIC_VERSION_HTTP_'+response.status);}
  });
  assert.ok(version.html.length>=32,'version identifier exists');
  assert.equal(version.html,version.published,'published HTML and version.json agree');
  report.checks.push('published HTML build exactly matches live version.json');
  await page.locator('#memoryBtn').click();
  const card=page.locator('#m08MissionRewardsV624');
  await card.waitFor({state:'visible',timeout:10000});
  assert.equal(await card.locator('.m08RewardRowV624').count(),3);
  assert.match(await card.innerText(),/일일 연구 보상/);
  report.checks.push('CHALLENGE shows 3 earnable research rewards');
  await page.locator('#homeShopTabV601').click();
  await page.locator('#evolveShopV621').waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('#evolveShopV621 .eStoreCardV621').count(),6);
  assert.equal(await page.evaluate(()=>window.__EVOLVE_HOME_HUB_V601__.read().page),'shop');
  report.checks.push('SHOP opens 6 item cards and HOME switches to shop');
  assert.deepEqual(report.pageErrors,[]);
  report.success=true;
 }catch(error){report.success=false;report.failure=String(error.stack||error);throw error;}
 finally{
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
  if(browser)await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
