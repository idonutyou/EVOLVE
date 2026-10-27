'use strict';
/* EVOLVE M05 70% responsive, keyboard focus, scroll preservation and repeated-open browser gate. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)
});
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const chrome=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const origin='http://127.0.0.1:'+server.address().port+'/',results=[];
 async function game(context){
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(origin+'?evolveMockShop=1&evolveM05UX=1&evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await p.waitForFunction(()=>window.__EVOLVE_DEV_M05_UI_V618__&&document.querySelector('#m04MockTriggerV616')&&!document.getElementById('webLoader'),null,{timeout:240000});
  await p.evaluate(()=>document.getElementById('introSplash')?.click());
  return {p,errors};
 }
 try{
  for(const [w,h] of [[320,568],[393,852],[852,393]]){
   const context=await chrome.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:1});
   await context.addInitScript(()=>localStorage.setItem('EVOLVE_V575_TEST_A11Y_SENTINEL','NO_CHANGES'));
   const {p,errors}=await game(context);
   const trigger=p.locator('#m04MockTriggerV616');
   await trigger.click();
   const nav=p.locator('#m05NavigationV618');await nav.waitFor();
   assert.equal(await p.locator('#homeTabs>button').count(),5);
   assert.equal(await nav.locator('button').count(),2);
   const dims=await p.evaluate(()=>{
    const panel=document.querySelector('#m04MockModalV616 .m04MockPanel'),overlay=document.getElementById('m04MockModalV616');
    const r=panel.getBoundingClientRect(),a=overlay.getBoundingClientRect();
    return {client:panel.clientHeight,scroll:panel.scrollHeight,width:panel.clientWidth,scrollWidth:panel.scrollWidth,viewportHeight:a.height,panelTop:r.top,panelBottom:r.bottom,overlayTop:a.top,overlayBottom:a.bottom};
   });
   assert.ok(dims.scroll>dims.client,'modal must scroll internally even on small viewport: '+JSON.stringify(dims));
   assert.ok(dims.scrollWidth<=dims.width+3,'unexpected horizontal scroll '+JSON.stringify(dims));
   assert.ok(dims.panelTop>=dims.overlayTop-2&&dims.panelBottom<=dims.overlayBottom+2,'modal vertically clipped '+JSON.stringify(dims));
   const btnSizes=await p.locator('#m04MockModalV616 .m04MockHead button,#m05NavigationV618 button,#m04MockModalV616 .m04CoreLook button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>({name:n.textContent.trim().slice(0,25),height:Math.round(n.getBoundingClientRect().height)})));
   assert.ok(btnSizes.every(x=>x.height>=44),'button under 44px '+JSON.stringify(btnSizes));
   await p.evaluate(()=>document.querySelector('#m04MockModalV616 .m04MockPanel').scrollTop=116);
   const previous=await p.evaluate(()=>document.querySelector('#m04MockModalV616 .m04MockPanel').scrollTop);
   await p.locator('.m05DetailLink[data-m05-sku="appearance_unlock_01"]').click();
   assert.equal(await p.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'detail');
   assert.equal(await p.evaluate(()=>document.activeElement?.id),'m05DetailTitleV618');
   await p.keyboard.press('Escape');
   assert.equal(await p.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'shop');
   await p.waitForTimeout(75);
   const restored=await p.evaluate(()=>document.querySelector('#m04MockModalV616 .m04MockPanel').scrollTop);
   assert.ok(Math.abs(restored-previous)<=2,'shop scroll lost: '+previous+' vs '+restored);
   assert.equal(await p.locator('#m04MockModalV616').isVisible(),true);
   await p.locator('#m05NavigationV618 button[data-m05-section="collection"]').click();
   assert.equal(await p.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'collection');
   await p.evaluate(()=>document.querySelector('.m04MockPanel').scrollTop=80);
   const originalCollectionY=await p.evaluate(()=>document.querySelector('.m04MockPanel').scrollTop);
   await p.locator('.m05GetTheme').click();
   assert.equal(await p.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'detail');
   assert.equal(await p.evaluate(()=>window.__EVOLVE_DEV_M05_UI_V618__.detailOrigin()),'collection');
   await p.keyboard.press('Escape');
   assert.equal(await p.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'collection');
   await p.waitForTimeout(80);
   const colY=await p.evaluate(()=>document.querySelector('.m04MockPanel').scrollTop);
   assert.ok(Math.abs(originalCollectionY-colY)<=2,'collection scroll lost: '+originalCollectionY+' vs '+colY);
   await p.locator('#m05NavigationV618 button[data-m05-section="shop"]').click();
   await p.locator('.m05DetailLink[data-m05-sku="mutation_crystal_small"]').focus();
   await p.keyboard.press('Tab');
   const focused=await p.evaluate(()=>document.getElementById('m04MockModalV616').contains(document.activeElement));
   assert.equal(focused,true,'Tab escaped open mock dialog');
   await p.locator('.m05DetailLink[data-m05-sku="mutation_crystal_small"]').click();
   await p.locator('#m05DetailActionV618').click();
   await p.locator('#m04MockConfirmV617').waitFor();
   await p.keyboard.press('Tab');
   const focusWithinConfirm=await p.evaluate(()=>document.getElementById('m04MockConfirmV617').contains(document.activeElement));
   assert.equal(focusWithinConfirm,true,'Tab escaped purchase confirmation');
   await p.keyboard.press('Escape');
   assert.equal(await p.locator('#m04MockConfirmV617').count(),0);
   assert.equal(await p.locator('#m04MockModalV616').isVisible(),true);
   await p.keyboard.press('Escape');
   assert.equal(await p.locator('#m04MockModalV616').getAttribute('data-m05-mode'),'shop');
   await p.locator('#m04MockModalV616 .m04MockHead button').click();
   assert.equal(await p.locator('#m04MockModalV616').isVisible(),false);
   assert.equal(await p.evaluate(()=>document.activeElement?.id),'m04MockTriggerV616','close lost focus restoration');
   for(let i=0;i<12;i++){
    await trigger.click();await p.locator('#m05NavigationV618').waitFor();
    const section=i%2?'collection':'shop';
    await p.locator('#m05NavigationV618 button[data-m05-section="'+section+'"]').click();
    await p.locator('#m04MockModalV616 .m04MockHead button').click();
   }
   assert.equal(await p.evaluate(()=>document.activeElement?.id),'m04MockTriggerV616');
   assert.equal(await p.evaluate(()=>localStorage.getItem('EVOLVE_V575_TEST_A11Y_SENTINEL')),'NO_CHANGES');
   assert.deepEqual(errors,[]);
   await trigger.click();await p.locator('#m05NavigationV618').waitFor();
   await p.screenshot({path:path.join(out,'m05-070-responsive-'+w+'x'+h+'.png')});
   await context.close();
   results.push({viewport:w+'x'+h,internalScroll:true,scrollRestoreShop:true,scrollRestoreCollection:true,escapeAndTab:true,allButtons44px:true,reopenCycles:12,previousGameSaveUntouched:true});
  }
  console.log(JSON.stringify({pass:true,viewports:results,oldGamePreserved:true,realCheckout:false}));
 }finally{await chrome.close();server.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;server.close()});
