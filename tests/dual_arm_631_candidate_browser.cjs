'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist');
const site='https://idonutyou.github.io/EVOLVE/';
const candidate='529c25c1d3089fb0df8cd7cf3d0892389966fa323e55b14805186ded3f9889d8.js';
const report={scope:'pre-publication staged HTML and engine with unchanged public original assets',checks:[],pageErrors:[],requestsFailed:[]};
const replacements=new Map([['/EVOLVE/',path.join(root,'index.html')],['/EVOLVE/version.json',path.join(root,'version.json')],['/EVOLVE/asset-manifest.json',path.join(root,'asset-manifest.json')],['/EVOLVE/assets/'+candidate,path.join(root,'assets',candidate)]]);
(async()=>{
 let browser,context;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
  context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
  await context.addInitScript(()=>{
    localStorage.setItem('EVOLVE_V575_TEST_PARTS_UI_V523',JSON.stringify({schema:1,worn:{arm:'arm_cannon',back:'back_neural'},filter:'all',sort:'default'}));
  });
  const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
  page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.requestsFailed.push(r.url().slice(0,220)+': '+r.failure()?.errorText);});
  await page.route('**/*',route=>{
    const u=new URL(route.request().url()),file=u.hostname==='idonutyou.github.io'?replacements.get(u.pathname):null;
    if(!file)return route.continue();
    if(!fs.existsSync(file))throw Error('missing staged '+file);
    const mime=file.endsWith('.json')?'application/json':file.endsWith('.html')?'text/html; charset=utf-8':'application/javascript';
    return route.fulfill({status:200,contentType:mime,body:fs.readFileSync(file)});
  });
  await page.goto(site+'?evolveQA=1&dual631='+Date.now(),{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>{
    const fail=window.EVOLVE_WEB_CLIENT?.read?.()?.failed||window.__EVOLVE_BIOCORE_V625__?.read?.()?.loadError;
    if(fail)throw Error('GAME_BOOT_FAILED '+String(fail));
    return !document.getElementById('webLoader')&&window.__EVOLVE_BIOCORE_V625__?.read()?.ready&&window.__EVOLVE_DUAL_ARM_V631__?.snapshot()?.gameRendererConnected;
  },null,{timeout:180000});
  report.checks.push('real published original assets + staged engine boot at mobile viewport');
  const result=await page.evaluate(()=>{
    const part=window.__EVOLVE_PARTS_V523__,arm=window.__EVOLVE_DUAL_ARM_V631__;
    const before=arm.snapshot(),rawBefore=localStorage.getItem('EVOLVE_V575_TEST_PARTS_UI_V523');
    if(before.arm1!=='arm_cannon'||before.arm2!=='arm_cannon')throw Error('legacy paired-arm migration failed: '+JSON.stringify(before));
    if(before.legacyBack!=='back_neural')throw Error('hidden back equipment lost');
    if(!before.slots||before.slots.length!==6||!before.gameRendererConnected)throw Error('six slots or combat renderer missing');
    if(!document.querySelector('[data-arm-slot-v631="arm1"]')||!document.querySelector('[data-arm-slot-v631="arm2"]'))throw Error('independent arm slots missing');
    part.open('arm_blades');if(!arm.test?.applyArm?.('arm2'))throw Error('arm2 equip failure');
    const both=arm.snapshot(),saved=JSON.parse(localStorage.getItem('EVOLVE_V575_TEST_PARTS_UI_V523')||'null');
    if(both.arm1!=='arm_cannon'||both.arm2!=='arm_blades'||saved?.worn?.arm2!=='arm_blades')throw Error('mixed arms failed '+JSON.stringify({both,saved}));
    part.open('arm_blades');if(!arm.test.applyArm('arm2'))throw Error('arm2 remove failure');
    const alone=arm.snapshot();if(alone.arm1!=='arm_cannon'||alone.arm2!==null)throw Error('single arm failed '+JSON.stringify(alone));
    return {version:window.EVOLVE_WEB_CONFIG?.version||'',before,afterMixed:both,afterSingle:alone,oldSaveHadArm2:JSON.parse(rawBefore).worn.hasOwnProperty('arm2')};
  });
  report.checks.push('legacy save migration, hidden back preservation, 6 slots, independent arm equip/unequip');
  if(result.oldSaveHadArm2)throw Error('old save changed before explicit equip');
  if(report.pageErrors.length||report.requestsFailed.length)throw Error('browser errors '+JSON.stringify({page:report.pageErrors,requests:report.requestsFailed.slice(0,5)}));
  report.result=result;report.success=true;
 }catch(err){report.success=false;report.error=String(err.stack||err);process.exitCode=1;}
 finally{
  fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});
  fs.writeFileSync(path.resolve(__dirname,'../test-results/dual-arm-631-candidate.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report,requestsFailed:report.requestsFailed.slice(0,10)},null,2));
  await context?.close();await browser?.close();
 }
})();