'use strict';
// STEP08: test-only review runner. Existing published V614 game and assets are never modified.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),out=path.join(root,'test-results/step08');
fs.mkdirSync(out,{recursive:true});
const matrix=JSON.parse(fs.readFileSync(path.join(root,'docs/step08/PLAYTEST_MATRIX_V1.json')));
const version=JSON.parse(fs.readFileSync(path.join(dist,'version.json')));
const mode=process.env.STEP08_MODE||'probe',phase=process.env.STEP08_PHASE||'40';
assert.equal(matrix.cases.length,23);
assert.equal(version.version,'V575-STEP07-MONSTER-FEEDBACK-V614');
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.css':'text/css','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1');
 const f=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!f.startsWith(dist+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);
});
function capture(page,report){page.on('pageerror',e=>report.errors.push(String(e.message)));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.requestFailures.push({url:r.url(),reason:r.failure()?.errorText});});}
async function ready(page){
 await page.waitForFunction(()=>window.__EVOLVE_MONSTER_FEEDBACK_V614__?.read().version==='STEP07-V614' &&
 window.__EVOLVE_TEST_MODULE_V575__?.read().ready &&
 !!document.querySelector('#start') && !document.getElementById('start').disabled && !document.getElementById('webLoader'),
 null,{timeout:180000});
}
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const chrome=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const context=await chrome.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const report={step:8,percent:Number(phase),mode,version:version.version,build:version.build,
   scenarios_planned:matrix.cases.length,scenarios:[],errors:[],requestFailures:[],
   realPhoneTested:false,humanRatingsCollected:false,gameFilesChanged:false};
 capture(page,report);
 try{
  // Only deterministic functional mode deliberately freezes the game's own animation loop.
  if(mode!=='realtime')await page.addInitScript(()=>{
   const original=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>fn.name==='loop'?0:original(fn);
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await ready(page);
  const boot=await page.evaluate(()=>({
   version:window.EVOLVE_WEB_CONFIG,feedback:window.__EVOLVE_MONSTER_FEEDBACK_V614__.read(),
   testAPI:typeof window.__EVOLVE_TEST_MODULE_V575__.test?.context==='function',
   catalog:window.__EVOLVE_MONSTER_CATALOG_V593__?.list().map(x=>x.id),
   weaponMode:window.__EVOLVE_ARM_ITEMS_V589__?.read().mode,
   bossQA:typeof window.__EVOLVE_TEST_MODULE_V575__.boss==='function'
  }));
  assert.equal(boot.version.build,version.build);
  assert.equal(boot.feedback.version,'STEP07-V614');
  assert.equal(boot.testAPI,true);
  assert.ok(boot.catalog?.includes('crawler')&&boot.catalog?.includes('alpha'));
  report.boot=boot;
  report.scenarios=matrix.cases.map(x=>({id:x.id,status:'not_executed'}));
  if(mode==='probe')report.success=true;
  else throw new Error('Mode '+mode+' is not yet implemented in 40% scaffold (intentionally not fake tested)');
 }catch(e){report.success=false;report.failure=String(e.stack||e);
  await page.screenshot({path:path.join(out,'step08-'+mode+'-failed.png')}).catch(()=>{});throw e;
 }finally{
  fs.writeFileSync(path.join(out,'step08-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({mode,success:report.success,scenarios_planned:report.scenarios_planned,
   executed:report.scenarios.filter(x=>x.status!=='not_executed').length,
   errors:report.errors,requestFailures:report.requestFailures,build:report.build}));
  await context.close();await chrome.close();server.close();
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close();});
