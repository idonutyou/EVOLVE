'use strict';
/* M05 90% verify actual touch target collision removal, not programmatic click, on three mobile shapes. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const url='http://127.0.0.1:'+server.address().port+'/',results=[];
 try{
  for(const [width,height] of [[393,852],[320,568],[852,393]]){
   const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url+'?evolveMockShop=1&evolveM05UX=1&evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
   await page.waitForFunction(()=>window.__EVOLVE_DEV_M05_UI_V618__&&document.querySelector('#m04MockTriggerV616')&&!document.getElementById('webLoader'),null,{timeout:240000});
   await page.evaluate(()=>document.getElementById('introSplash')?.click());
   await page.locator('#homeLabTab').click({timeout:30000});
   const geometry=await page.evaluate(()=>{
    const elem=id=>document.getElementById(id),rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
    const trigger=rect(elem('m04MockTriggerV616'));
    const nav=[...document.querySelectorAll('#homeTabs>button')].map(e=>({id:e.id,...rect(e)}));
    const collision=nav.filter(r=>Math.min(trigger.right,r.right)>Math.max(trigger.left,r.left)&&Math.min(trigger.bottom,r.bottom)>Math.max(trigger.top,r.top)).map(r=>r.id);
    return {trigger,nav,collision,source:document.querySelector('#m05ShopStyleV618')?.textContent.includes('bottom:calc(96px')};
   });
   assert.equal(geometry.nav.length,5);
   assert.deepEqual(geometry.collision,[],'DEV trigger overlaps main nav '+JSON.stringify(geometry));
   assert.equal(geometry.source,true,'M05 opt-in CSS was not applied');
   await page.locator('#homeSpecimenTab').click({timeout:30000});
   assert.equal(await page.locator('#homeSpecimenView').isVisible(),true,'Specimen REAL touch did not select view');
   await page.locator('#homeLabTab').click({timeout:30000});
   assert.equal(await page.locator('#homeSpecimenView').isVisible(),false,'RESEARCH touch did not switch back');
   for(const id of ['homeShopTabV601','homeLabTab','homeBattleTabV522','memoryBtn','codexBtn']){
    await page.locator('#'+id).click({timeout:30000});
   }
   await page.locator('#m04MockTriggerV616').click({timeout:30000});
   assert.equal(await page.locator('#m04MockModalV616').isVisible(),true);
   assert.equal(await page.locator('#m05NavigationV618 button').count(),2);
   await page.screenshot({path:path.join(out,'m05-090-touch-'+width+'x'+height+'.png')});
   await page.locator('#m04MockModalV616 .m04MockHead button').click();
   assert.equal(await page.locator('#m04MockModalV616').isVisible(),false);
   assert.deepEqual(errors,[]);
   results.push({viewport:width+'x'+height,devTriggerNoNavOverlap:true,realSpecimenTap:true,allFiveTabsTouchable:true,mockShopOpens:true,trigger:geometry.trigger});
   await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const p=await ctx.newPage();await p.goto(url+'?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await p.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('webLoader'),null,{timeout:240000});
  assert.equal(await p.locator('#m04MockTriggerV616').count(),0);
  assert.equal(await p.evaluate(()=>!!window.__EVOLVE_DEV_M05_UI_V618__),false);
  await ctx.close();
  console.log(JSON.stringify({pass:true,results,publicDefaultDevHidden:true,realBilling:false}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;server.close()});
