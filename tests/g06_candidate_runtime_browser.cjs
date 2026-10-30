'use strict';
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),{Readable}=require('stream');
const root=path.resolve(__dirname,'../dist');
const want=new Set(['/index.html','/asset-manifest.json','/version.json','/verification.json','/assets/7cac883b4a550784880a37ad4e4dac3ef6138db74ab514a82a1591713293c755.js']);
const mime={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript'};
const report={candidate:'G06UX632',errors:[],consoleErrors:[],failedRequests:[],httpErrors:[],events:[],proxies:0,started:null,loader:null};
const srv=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');const name=url.pathname==='/'?'/index.html':url.pathname;
  if(name==='favicon.ico'){res.writeHead(204);res.end();return;}
  try{
    if(want.has(name)){
      const file=path.resolve(root,'.'+name);
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);return;
    }
    report.proxies++;
    const upstream=await fetch('https://idonutyou.github.io/EVOLVE'+url.pathname,{signal:AbortSignal.timeout(60000)});
    const headers={'Content-Type':upstream.headers.get('content-type')||mime[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store'};
    res.writeHead(upstream.status,headers);
    if(upstream.body)Readable.fromWeb(upstream.body).pipe(res);else res.end();
  }catch(e){report.httpErrors.push({name,error:String(e)});if(!res.headersSent)res.writeHead(502);res.end();}
});
(async()=>{
 let browser,context;
 const save=()=>{fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/g06-candidate-real-game-qa.json',JSON.stringify(report,null,2));console.log('G06-QA-REPORT:',JSON.stringify(report));};
 try{
  await new Promise(r=>srv.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
  context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.stack||String(e)));
  page.on('console',e=>{if(e.type()==='error')report.consoleErrors.push(e.text());});
  page.on('requestfailed',e=>report.failedRequests.push({url:e.url(),error:e.failure()?.errorText}));
  page.on('response',e=>{if(e.status()>=400&&!e.url().includes('favicon.ico'))report.httpErrors.push({url:e.url(),status:e.status()});});
  await page.addInitScript(()=>{window.__g06Diagnostic=[];window.addEventListener('error',e=>window.__g06Diagnostic.push({message:e.message,filename:e.filename,lineno:e.lineno,colno:e.colno,stack:e.error?.stack||null}),true);window.addEventListener('unhandledrejection',e=>window.__g06Diagnostic.push({type:'unhandledrejection',reason:String(e.reason),stack:e.reason?.stack||null}));});
  await page.goto('http://127.0.0.1:'+srv.address().port+'/',{waitUntil:'domcontentloaded',timeout:60000});
  report.events.push('domcontentloaded');
  await page.waitForFunction(()=>{const el=document.getElementById('webLoader');return !el||window.EVOLVE_WEB_CLIENT?.read()?.failed||!document.getElementById('start')?.disabled;},null,{timeout:150000});
  report.loader=await page.evaluate(()=>({state:window.EVOLVE_WEB_CLIENT?.read(),status:document.querySelector('#webStatus')?.textContent,detail:document.querySelector('#webDetail')?.textContent,visible:!!document.querySelector('#webLoader'),errors:window.__g06Diagnostic}));
  if(report.loader.visible||report.loader.state?.failed||report.errors.length){report.events.push('FAIL: startup');throw Error('Startup loader or JavaScript error');}
  report.events.push('boot OK');
  await page.locator('#start').click({timeout:20000});report.events.push('start clicked');
  await page.locator('#cards .card').first().waitFor({state:'visible',timeout:20000});
  report.started=await page.evaluate(()=>({panel:document.querySelector('#levelPanel')?.dataset,header:document.querySelector('#levelPanel .levelHead')?.textContent,cardCount:document.querySelectorAll('#cards .card').length,errors:window.__g06Diagnostic}));
  if(report.started.panel.organOpening==='true'&&report.started.panel.upgradeLanguage==='ko'&&!report.started.header.includes('시작 스킬 하나 선택'))throw Error('First skill localized heading lost to legacy translator: '+report.started.header);
  report.events.push('opening choices visible');
  await page.locator('#cards .card').first().click({timeout:15000});report.events.push('first skill chosen');
  await page.waitForTimeout(9000);
  report.after=await page.evaluate(()=>({loader:window.EVOLVE_WEB_CLIENT?.read(),status:document.querySelector('#webStatus')?.textContent,start:document.querySelector('#start')?.disabled,game:window.__EVOLVE_TEST_MODULE_V575__?.read?.(),errors:window.__g06Diagnostic,overlay:document.querySelector('#levelOverlay')?.style.display}));
  if(report.errors.length||report.after.errors?.length||report.after.loader?.failed){report.events.push('FAIL: runtime JS error');throw Error('Runtime JS error');}
  report.events.push('9 seconds gameplay without reported JS errors');
 }catch(e){report.failure=String(e);process.exitCode=1}
 finally{save();await context?.close().catch(()=>{});await browser?.close().catch(()=>{});await new Promise(r=>srv.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
