const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');if(u.pathname.startsWith('/assets/'))res.setHeader('Cache-Control','public,max-age=31536000,immutable');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true}),page=await context.newPage();
 const report={checks:[],maps:[],errors:[],failed:[]};page.on('pageerror',e=>report.errors.push(e.stack||e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))report.failed.push({url:r.url(),status:r.status()});});
 try{
  await page.addInitScript(()=>{if(!localStorage.getItem('EVOLVE_V574_TEST_META_V1'))localStorage.setItem('EVOLVE_V574_TEST_META_V1',JSON.stringify({dna:1234,stage:26,unlockedStageV522:31,homeStageV522:26,clears:30,origin:'acid',feedback:{graphics:'eco',sound:false,haptic:false}}));});
  await page.goto(`http://127.0.0.1:${server.address().port}/?evolveQA=1`,{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
  assert.equal(await page.evaluate(()=>window.__EVOLVE_ASSET_ERROR__||null),null);
  // The V575 floor-visibility source intentionally grants access to all 99 stages.
  const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_META_V1')));assert.equal(initial.dna,1234);assert.equal(initial.unlockedStageV522,99);assert.equal(initial.origin,'acid');report.checks.push('boot and prior-version save migration');
  assert.deepEqual(report.errors,[],'Game startup raised a JavaScript exception');
  await page.screenshot({path:path.join(out,'mobile-home.png')});
  await page.locator('#start').click();await page.locator('[data-contract="exterminate"]').click();await page.locator('[data-weapon="arm"]').click();
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running,null,{timeout:30000});
  const before=await page.evaluate(()=>{const p=window.__EVOLVE_TEST_MODULE_V575__.test.context().player;return{x:p.x,y:p.y};});
  await page.mouse.move(180,660);await page.mouse.down();await page.mouse.move(250,620,{steps:8});await page.waitForTimeout(650);await page.mouse.up();
  const after=await page.evaluate(()=>{const p=window.__EVOLVE_TEST_MODULE_V575__.test.context().player;return{x:p.x,y:p.y};});assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>1,'Joystick movement failed');
  await page.locator('#pauseBtn').click();assert.equal(await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.read().paused),true);await page.locator('#resume').click();report.checks.push('mobile movement, pause and resume');
  await page.route('**/version.json?check=*',r=>r.fulfill({status:200,contentType:'application/json',body:'{"build":"synthetic-next-version"}'}));await page.evaluate(()=>window.dispatchEvent(new Event('online')));await page.waitForTimeout(250);assert.equal(await page.locator('#webUpdate').isVisible(),false);assert.equal(await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running),true);
  await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().home('battle'));await page.waitForFunction(()=>!document.getElementById('webUpdate').hidden,null,{timeout:10000});await page.unroute('**/version.json?check=*');report.checks.push('update waits for home without interrupting combat');
  const maps=await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.definitions().map(m=>({id:m.id,stages:m.stages})));
  for(const m of maps){
   const approvedCount={facility1:345,hub:63}[m.id];
   if(approvedCount)await page.evaluate(id=>{localStorage.removeItem('EVOLVE_V575_TEST_'+id+'_COLLISION_EDITS_V1');localStorage.removeItem('EVOLVE_V575_TEST_'+id+'_COLLISION_DRAFT_V1');},m.id);
   await page.evaluate(async m=>window.__EVOLVE_TEST_MODULE_V575__.go(m.stages[0],m.id,false),m);
   await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().ready,null,{timeout:60000});
   const s=await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.read());assert.equal(s.map,m.id);report.maps.push(m.id);
   if(approvedCount){
    const fieldBefore=await page.evaluate(async()=>{const e=window.__EVOLVE_MAP_TEST_V562__.test.editor,f=e.field(),b=e.baseField();let differences=0;for(let i=0;i<f.length;i+=7)if(f[i]!==b[i])differences++;return {operations:window.__EVOLVE_MAP_TEST_V562__.read().editor.activeOperations,differences,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',f.buffer))).map(x=>x.toString(16).padStart(2,'0')).join('')};});
    assert.equal(fieldBefore.operations,approvedCount);assert.ok(fieldBefore.differences>0,'Approved collision field was not applied');
    await page.evaluate(id=>{const d={...window.__EVOLVE_WEB_DATA__.APPROVED_MAP_EDITS_V575[id],operations:[]};localStorage.setItem('EVOLVE_V575_TEST_'+id+'_COLLISION_EDITS_V1',JSON.stringify(d));localStorage.setItem('EVOLVE_V575_TEST_'+id+'_COLLISION_DRAFT_V1',JSON.stringify(d));},m.id);
    await page.evaluate(async m=>window.__EVOLVE_TEST_MODULE_V575__.go(m.stages[0],m.id,false),m);
    await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().ready,null,{timeout:60000});
    assert.equal(await page.evaluate(()=>window.__EVOLVE_MAP_TEST_V562__.read().editor.activeOperations),approvedCount);
    await page.locator('#homeMapEditV562').click();
    await page.waitForFunction(()=>!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy,null,{timeout:60000});
    assert.equal(await page.evaluate(()=>window.__EVOLVE_MAP_TEST_V562__.test.editor.read().work.operations.length),approvedCount,'Old empty draft hid the approved default');
    await page.locator('#meFilesV562 > summary').click();
    await page.locator('#meResetV562').click();
    await page.waitForFunction(()=>!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy,null,{timeout:60000});
    const resetDoc=await page.evaluate(()=>window.__EVOLVE_MAP_TEST_V562__.test.editor.read().work);
    const expectedDoc=await page.evaluate(id=>window.__EVOLVE_WEB_DATA__.APPROVED_MAP_EDITS_V575[id],m.id);
    assert.deepEqual(resetDoc.operations,expectedDoc.operations);assert.deepEqual(resetDoc.entrances,expectedDoc.entrances);
    await page.locator('#meApplyV562').click();
    await page.waitForFunction(()=>document.getElementById('mapEditorV562').hidden&&!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy,null,{timeout:60000});
    const fieldAfter=await page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',window.__EVOLVE_MAP_TEST_V562__.test.editor.field().buffer))).map(x=>x.toString(16).padStart(2,'0')).join(''));
    assert.equal(fieldAfter,fieldBefore.hash,'Default-map reset changed the approved collision field');
    report.checks.push(m.id+': approved default without storage, old empty saves/drafts, actual reset button and identical applied collision field');
   }
  }report.checks.push('all five maps load');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_META_V1')));await page.reload({waitUntil:'domcontentloaded',timeout:180000});await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('start').disabled,null,{timeout:180000});const next=await page.evaluate(()=>JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_META_V1')));assert.equal(next.dna,saved.dna);assert.equal(next.unlockedStageV522,saved.unlockedStageV522);assert.equal(next.origin,saved.origin);report.checks.push('reload preserves save');
  await page.setViewportSize({width:915,height:412});const bounds=await page.locator('#game').boundingBox();assert.ok(bounds.width>0&&bounds.height>0&&bounds.height<=413);await page.screenshot({path:path.join(out,'landscape.png')});report.checks.push('landscape layout');assert.deepEqual(report.errors,[]);assert.deepEqual(report.failed,[]);report.success=true;
 }catch(e){report.success=false;report.failure=e.stack;await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'browser-smoke.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e.stack);server.close();process.exitCode=1;});
