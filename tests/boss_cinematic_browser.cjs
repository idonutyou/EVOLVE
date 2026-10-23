const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),report={errors:[],failedRequests:[],encounters:[],obsoleteRequests:[]};page.on('request',r=>{if(/080eff25c63f7a7c|aed5400c9d32d768/.test(r.url()))report.obsoleteRequests.push(r.url())});page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push({url:r.url(),error:r.failure()?.errorText})});
try{
 // Manual simulation steps own this timeline; screenshot speed must not advance it.
 await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>callback.name==='loop'?0:raf(callback)});
 await page.goto(`http://127.0.0.1:${server.address().port}/?evolveQA=1`,{waitUntil:'domcontentloaded',timeout:180000});await page.waitForFunction(()=>window.__EVOLVE_CINEMATIC_V580__?.read().ready&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
 await require('./admin_unlock.cjs')(page);
 report.branding=await page.evaluate(async()=>{const api=window.__EVOLVE_PAINTED_WARNING_V581__;await api.ready;const sprites={};for(const name of ['bio','venom','warning','breach','phase','subtitle','crest','digit1','digit2','digit3','warning_ko','breach_ko','phase_ko','subtitle_ko']){const c=api.test.surface(name),pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let clear=0,painted=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)clear++;if(pixels[i]>200)painted++;}sprites[name]={clear,painted,width:c.width,height:c.height};}return{...api.read(),sprites};});assert.ok(report.branding.ready&&!report.branding.legacyFinalHUD);assert.equal(Object.keys(report.branding.sprites).length,14);assert.ok(Object.values(report.branding.sprites).every(s=>s.clear>0&&s.painted>0));

 report.locales=await page.evaluate(()=>{
  const brand=window.__EVOLVE_PAINTED_WARNING_V581__,film=window.__EVOLVE_CINEMATIC_V580__,i18n=window.EVOLVE_I18N,previous=i18n.getLanguage(),results=[];
  const names=['bio','venom','warning','breach','phase','subtitle','crest','digit1','digit2','digit3','warning_ko','breach_ko','phase_ko','subtitle_ko'];
  try{for(const language of ['en','ko'])for(const kind of ['bio','venom']){
   i18n.setLanguage(language);film.test.show(kind,1.65);const ctx=document.querySelector('.cineOverlayV581').getContext('2d'),original=ctx.drawImage,drawn=[];
   ctx.drawImage=function(surface,...args){const name=names.find(n=>brand.test.surface(n)===surface);if(name)drawn.push(name);return original.call(this,surface,...args)};
   try{film.test.show(kind,1.65)}finally{ctx.drawImage=original}
   results.push({language,kind,selected:brand.read().language,name:document.querySelector('.cineNameV580 span').textContent,aria:document.getElementById('bossWarningV526').getAttribute('aria-label'),drawn:[...new Set(drawn)]});
  }}finally{i18n.setLanguage(previous);film.test.hide()}return results;
 });
 for(const item of report.locales){
  assert.equal(item.selected,item.language);assert.equal(item.name,item.kind==='bio'?'BIO TITAN':'VENOM TITAN');assert.ok(item.aria.startsWith(item.name));assert.ok(item.drawn.includes(item.kind));
  for(const label of ['warning','breach','phase'])assert.ok(item.drawn.includes(label+(item.language==='ko'?'_ko':'')),JSON.stringify(item));assert.ok(!item.drawn.some(n=>n==='subtitle'||n==='subtitle_ko'));
  assert.ok(!item.drawn.some(n=>n==='bio_ko'||n==='venom_ko'));
 }
 report.wordmarks={};
 for(const orientation of ['portrait','landscape']){
  await page.setViewportSize(orientation==='portrait'?{width:393,height:852}:{width:852,height:393});
  const audit=await page.evaluate(()=>{
   const brand=window.__EVOLVE_PAINTED_WARNING_V581__,film=window.__EVOLVE_CINEMATIC_V580__,results={};
   for(const kind of ['venom','bio']){
    film.test.show(kind,1.65);const ctx=document.querySelector('.cineOverlayV581').getContext('2d'),original=ctx.drawImage,s=brand.test.surface(kind),pixels=s.getContext('2d').getImageData(0,0,s.width,s.height).data;let bounds=[s.width,s.height,-1,-1],green=0,opaque=0,draw=null;
    for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const i=(y*s.width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2],a=pixels[i+3];if(a>20&&Math.max(r,g,b)>100){bounds=[Math.min(bounds[0],x),Math.min(bounds[1],y),Math.max(bounds[2],x),Math.max(bounds[3],y)]}if(a>200){opaque++;if(g>100&&g>r*1.25&&g>b*1.15)green++;}}
    ctx.drawImage=function(surface,...args){if(surface===s)draw=args;return original.call(this,surface,...args)};
    try{film.test.show(kind,1.65)}finally{ctx.drawImage=original}
    const inkWidth=bounds[2]-bounds[0]+1,inkHeight=bounds[3]-bounds[1]+1;results[kind]={inkBounds:bounds,source:[s.width,s.height],destination:draw,visibleAspect:(inkWidth/s.width*draw[2])/(inkHeight/s.height*draw[3]),strongGreenPixels:green,opaquePixels:opaque};
   }film.test.hide();return results;
  });report.wordmarks[orientation]=audit;assert.ok(Math.abs(audit.venom.visibleAspect-13/3)<.015,JSON.stringify(audit.venom));assert.equal(audit.bio.strongGreenPixels,0);
 }
 const previousLanguage=await page.evaluate(()=>window.EVOLVE_I18N.getLanguage());
 await page.evaluate(()=>window.EVOLVE_I18N.setLanguage('ko'));
 try{for(const orientation of ['portrait','landscape']){
  await page.setViewportSize(orientation==='portrait'?{width:393,height:852}:{width:852,height:393});
  for(const kind of ['venom','bio']){
   await page.evaluate(kind=>window.__EVOLVE_CINEMATIC_V580__.test.show(kind,1.65),kind);
   await page.screenshot({path:path.join(out,`cinematic-ko-${kind}-${orientation}.png`)});
  }
 }}finally{await page.evaluate(language=>{window.EVOLVE_I18N.setLanguage(language);window.__EVOLVE_CINEMATIC_V580__.test.hide()},previousLanguage)}
 await page.setViewportSize({width:393,height:852});
 report.art=await page.evaluate(()=>{const api=window.__EVOLVE_CINEMATIC_V580__,hash=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=2166136261;for(let i=0;i<d.length;i+=13)n=Math.imul(n^d[i],16777619);return n>>>0};return Object.fromEntries(['bio','venom'].map(kind=>[kind,{hashes:[0,1,2,3].map(i=>hash(api.test.surface(kind,i))),sizes:[0,1,2,3].map(i=>{const c=api.test.surface(kind,i);return[c.width,c.height]})}]))});for(const v of Object.values(report.art))assert.equal(new Set(v.hashes).size,4);
 await page.locator('#start').click();await page.locator('[data-contract="exterminate"]').click();await page.locator('[data-weapon="arm"]').click();await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
 for(const orientation of ['portrait','landscape']){
  if(orientation==='landscape')await page.setViewportSize({width:852,height:393});
  for(const kind of ['venom','bio']){
   await page.evaluate(async kind=>{const api=window.__EVOLVE_TEST_MODULE_V575__,c=api.test.context();c.player.hp=c.player.maxHp;c.player.inv=2;if(!await api.boss(kind,kind==='venom'?3:1))throw Error('Cinematic boss request failed');c.step(.001);},kind);
   const initial=await page.evaluate(()=>{const c=window.__EVOLVE_TEST_MODULE_V575__.test.context();return{x:c.player.x,y:c.player.y,hp:c.player.hp}}),frames=[];
   for(const target of (orientation==='portrait'?[.15,.9,1.65,2.4]:[1.65])){
    const result=await page.evaluate(target=>{const api=window.__EVOLVE_CINEMATIC_V580__,game=window.__EVOLVE_TEST_MODULE_V575__,c=game.test.context();for(let i=0;i<200&&api.read().elapsed<target;i++){c.step(Math.min(.02,target-api.read().elapsed));c.draw();}const el=document.getElementById('bossWarningV526'),rect=el.getBoundingClientRect(),a={width:window.innerWidth,height:window.innerHeight};c.keys.d=true;c.joy.active=true;c.joy.dx=1;c.joy.dy=0;const x=c.player.x,y=c.player.y;c.step(.001);return{...api.read(),name:el.querySelector('.cineNameV580 span').textContent,viewportCovered:rect.width>=a.width-.5&&rect.height>=a.height-.5,inputLocked:Math.hypot(c.player.x-x,c.player.y-y)<.1,clock:game.read().seconds,paintedOnly:el.innerText.trim()===''&&!el.querySelector('svg')&&!!el.querySelector('.cineOverlayV581')};},target);
    assert.ok(result.visible&&result.ready&&result.viewportCovered&&result.inputLocked&&result.paintedOnly,JSON.stringify(result));assert.equal(result.kind,kind);frames.push({elapsed:result.elapsed,frame:result.frame,name:result.name});await page.screenshot({path:path.join(out,`cinematic-${kind}-${orientation}-${Math.floor(target*100)}.png`)});
   }
   let pausedSafely=true;if(orientation==='portrait')pausedSafely=await page.evaluate(()=>{const api=window.__EVOLVE_TEST_MODULE_V575__,c=api.test.context(),map=window.__EVOLVE_MAP_TEST_V562__.test.context();map.pause(true);const before=api.read().encounter.elapsed;for(let i=0;i<10;i++)c.step(.2);const frozen=api.read().encounter.elapsed===before;map.pause(false);c.step(.01);c.draw();return frozen&&window.__EVOLVE_CINEMATIC_V580__.read().visible});assert.ok(pausedSafely);
   const entry=await page.evaluate(()=>{const api=window.__EVOLVE_TEST_MODULE_V575__,c=api.test.context();let boss;for(let i=0;i<100&&!boss;i++){c.step(.02);boss=c.enemies.find(e=>!e.dead&&e.finalBoss);}const center=window.__EVOLVE_CENTERED_ARENA_V579__.read().mapCenter;const root=document.getElementById('artHudV417'),hud=document.getElementById(boss?.venomV537?'venomArtV538':'bioArtV484'),currentHUDImmediately=!!hud&&getComputedStyle(hud).display!=='none',arrivalProtected=!!boss?.arrivalInvuln,legacyAbsent=!document.getElementById('finalArtV417');let currentHUDThroughoutArrival=currentHUDImmediately,arrivalSamples=0;for(let i=0;boss?.arrivalInvuln&&i<30;i++){currentHUDThroughoutArrival&&=getComputedStyle(hud).display!=='none';arrivalSamples++;c.step(.05);}return{currentHUDImmediately,currentHUDThroughoutArrival,arrivalSamples,arrivalProtected,legacyAbsent,venomSelected:!boss?.venomV537||root.dataset.venomV538==='true',warningHidden:!window.__EVOLVE_CINEMATIC_V580__.read().visible,bossArrived:!!boss,centered:!!boss&&boss.x===center.x&&boss.y===center.y,playerNearCenter:Math.hypot(c.player.x-center.x,c.player.y-center.y)<=180,hp:c.player.hp};});assert.ok(entry.warningHidden&&entry.bossArrived&&entry.centered&&entry.playerNearCenter&&entry.currentHUDImmediately&&entry.currentHUDThroughoutArrival&&entry.arrivalProtected&&entry.legacyAbsent&&entry.venomSelected&&entry.arrivalSamples>0,JSON.stringify(entry));assert.equal(entry.hp,initial.hp);report.encounters.push({kind,orientation,frames,pausedSafely,...entry});console.log(JSON.stringify({checkpoint:'boss-cinematic',kind,orientation,frames,entry}));
  }
 }
 report.legacyShortcuts=[];
 for(const kind of ['venom','bio','frost']){
  const result=await page.evaluate(async kind=>{const api=window.__EVOLVE_TEST_MODULE_V575__;await api.go(20,'facility1',false);api.test.context().reset();const c=api.test.context();c.player.inv=999;if(!window.__EVOLVE_BOSS_TEST_V550__.start(kind,1))throw Error('Legacy boss shortcut unavailable');for(let i=0;i<18;i++)c.step(.05);c.draw();const film=window.__EVOLVE_CINEMATIC_V580__.read(),el=document.getElementById('bossWarningV526');if(kind==='frost')return{kind,visible:!el.hidden,originalWarningPreserved:el.querySelector('.bossWarningNameV526')?.textContent==='FROST TITAN'};const showing=film.visible&&film.kind===kind&&film.frame===1;let boss;for(let i=0;i<80&&!boss;i++){c.step(.05);boss=c.enemies.find(e=>!e.dead&&e.finalBoss);}const center=window.__EVOLVE_CENTERED_ARENA_V579__.read().mapCenter;return{kind,visible:showing,centered:!!boss&&boss.x===center.x&&boss.y===center.y};},kind);
  assert.ok(result.visible&&(kind==='frost'?result.originalWarningPreserved:result.centered),JSON.stringify(result));report.legacyShortcuts.push(result);console.log(JSON.stringify({checkpoint:'legacy-boss-shortcut',...result}));
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);assert.deepEqual(report.obsoleteRequests,[]);report.success=true;fs.writeFileSync(path.join(out,'boss-cinematic-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(error){report.success=false;report.failure=error.stack||String(error);fs.writeFileSync(path.join(out,'boss-cinematic-browser.json'),JSON.stringify(report,null,2)+'\n');await page.screenshot({path:path.join(out,'boss-cinematic-failure.png')}).catch(()=>{});throw error}finally{await context.close();await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
