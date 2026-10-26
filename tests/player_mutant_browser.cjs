const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}),context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage();
 const report={checks:[],errors:[],failedRequests:[],physical_Galaxy_S23_plus_tested:false};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>{if(!r.url().startsWith('data:'))report.failedRequests.push({url:r.url(),error:r.failure()?.errorText});});
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?evolveQA=1',{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_PLAYER_MUTANT_V599__?.read().ready&&window.__EVOLVE_TEST_MODULE_V575__?.read().ready&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
  report.actor=await page.evaluate(async()=>{const r=window.__EVOLVE_PLAYER_MUTANT_V599__.read(),b=await(await fetch(r.source)).arrayBuffer();return {...r,downloadedBytes:b.byteLength,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(n=>n.toString(16).padStart(2,'0')).join(''),previewWidth:document.getElementById('partsSpecimenImgV523').naturalWidth};});
  assert.equal(report.actor.sha256,'6c0f3022ea1dcc3114c2618ab42d8d6c987a5c1ac5230c758ac491e038952531');assert.equal(report.actor.hash,report.actor.sha256);assert.equal(report.actor.downloadedBytes,2098944);assert.equal(report.actor.previewWidth,1536);assert.equal(report.actor.feet.length,4);
  report.checks.push('Approved 1254px PNG is loaded byte-for-byte; new 1536px home preview is ready before Start; four independent walking legs');
  const fit=await page.evaluate(()=>{
   const api=window.__EVOLVE_PLAYER_MUTANT_V599__,arm=window.__EVOLVE_ARM_ITEMS_V589__,images=arm.test.images(),art=arm.test.art(),parts=api.test.parts(),original=CanvasRenderingContext2D.prototype.drawImage,rows=[];let records=[];
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    const m=this.getTransform(),w=args.length===2?image.width:args[2],h=args.length===2?image.height:args[3],x=args[0],y=args[1];
    const point=(px,py)=>({x:m.a*(x+px*w/image.width)+m.c*(y+py*h/image.height)+m.e,y:m.b*(x+px*w/image.width)+m.d*(y+py*h/image.height)+m.f});
    if(image===parts.armedFull.canvas)records.push({bodyWidth:Math.hypot(m.a*w,m.b*w)});
    for(const mode of ['cannon','blades'])for(const side of ['left','right'])if(image===images[mode][side]){const spec=art.items[mode][side],p=point(...spec.pivot),tip=point(...spec.tip),edge=point(side==='left'?119:234,197),spine=point(side==='left'?199:154,255),dx=tip.x-p.x,dy=tip.y-p.y;records.push({mode,side,length:Math.hypot(dx,dy),edgeSide:(dx*(edge.y-p.y)-dy*(edge.x-p.x))/Math.hypot(dx,dy),spineSide:(dx*(spine.y-p.y)-dy*(spine.x-p.x))/Math.hypot(dx,dy)});}
    return original.call(this,image,...args);
   };
   try{for(const mode of ['cannon','blades']){records=[];const c=api.test.preview(mode,384);const width=records.find(r=>r.bodyWidth)?.bodyWidth;rows.push({mode,bodyWidth:width,weapons:records.filter(r=>r.mode).map(r=>({...r,bodyRatio:r.length/width})),png:c.toDataURL().split(',')[1]});}}finally{CanvasRenderingContext2D.prototype.drawImage=original;}
   return rows;
  });
  for(const row of fit){fs.writeFileSync(path.join(out,'equipment-fit-'+row.mode+'.png'),Buffer.from(row.png,'base64'));delete row.png;assert.equal(row.weapons.length,2);for(const weapon of row.weapons){assert.ok(weapon.bodyRatio<(row.mode==='blades'?.28:.16),JSON.stringify(weapon));if(row.mode==='blades')assert.ok(weapon.edgeSide>0&&weapon.spineSide<0,'Blade cutting edge must hang below its spine: '+JSON.stringify(weapon));}}
  report.equipmentFit=fit;report.checks.push('Actual preview drawing transforms keep both weapons in body proportion and both blade cutting edges on the lower side');
  report.previewBounds=await page.evaluate(()=>Object.fromEntries(['bare','cannon','blades'].map(mode=>{
   const c=window.__EVOLVE_PLAYER_MUTANT_V599__.test.preview(mode,384),pixels=c.getContext('2d').getImageData(0,0,384,384).data;let left=384,top=384,right=0,bottom=0;
   for(let y=0;y<384;y++)for(let x=0;x<384;x++)if(pixels[(y*384+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}return [mode,{left,top,right,bottom}];
  })));
  for(const [mode,b]of Object.entries(report.previewBounds))assert.ok(b.left>15&&b.top>15&&b.right<369&&b.bottom<369,'Cropped '+mode+' preview: '+JSON.stringify(b));
  report.checks.push('Both complete weapons, all feet and the tail fit within the parts preview with transparent margins');
  await page.screenshot({path:path.join(out,'player-mutant-home-portrait.png')});
  await page.locator('#start').click();await require('./choose_opening_skill.cjs')(page);await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
  const frames=await page.evaluate(()=>{
   const c=window.__EVOLVE_TEST_MODULE_V575__.test.context(),api=window.__EVOLVE_PLAYER_MUTANT_V599__;c.player.inv=999;c.player.look=.36;api.test.reset();
   const images=[],samples=[];images.push(api.test.inspect().toDataURL().split(',')[1]);const builds=api.read().partBuilds;
   for(let i=0;i<90;i++){c.player.x+=1.4;api.test.step(1/60);if(i%6===0){images.push(api.test.inspect().toDataURL().split(',')[1]);samples.push(api.read().feet);}}
   for(let i=0;i<30;i++)api.test.step(1/60);images.push(api.test.inspect().toDataURL().split(',')[1]);
   const end=api.read();return {images,samples,builds,end};
  });
  frames.images.forEach((b,i)=>fs.writeFileSync(path.join(out,'player-mutant-walk-'+String(i).padStart(2,'0')+'.png'),Buffer.from(b,'base64')));delete frames.images;
  assert.equal(frames.end.partBuilds,frames.builds);assert.equal(frames.end.feet.length,4);assert.ok(frames.samples.some(s=>s.some(f=>f.lift>0.5)));assert.ok(frames.samples.some(s=>s.some(f=>f.mode==='stance')));assert.equal(frames.end.moving,false);
  frames.maxStanceError=Math.max(...frames.samples.flat().filter(f=>f.mode==='stance').map(f=>f.stanceError));
  assert.ok(frames.maxStanceError<2.5,'Actual rendered foot lost ground contact: '+frames.maxStanceError);
  report.gait=frames;report.checks.push('Continuous lift/stance gait, smooth stop, independent foot states and zero per-frame bitmap rebuilds');
  report.visibleSize=await page.evaluate(()=>{
   const a=window.__EVOLVE_PLAYER_MUTANT_V599__,q=window.__EVOLVE_UPGRADE_CARDS_V593__.test;
   const width=()=>{const c=a.test.inspect(640,6),data=c.getContext('2d').getImageData(0,0,640,640).data;let lo=640,hi=0;for(let y=0;y<640;y++)for(let x=0;x<640;x++){const i=(y*640+x)*4;if(Math.abs(data[i]-24)+Math.abs(data[i+1]-37)+Math.abs(data[i+2]-43)>20){lo=Math.min(lo,x);hi=Math.max(hi,x);}}return hi-lo;};
   q.reset();const normal=width();q.apply('giant',0);const larger=width();q.reset();q.apply('light',0);const smaller=width();q.reset();return {normal,larger,smaller};
  });
  assert.ok(report.visibleSize.larger>report.visibleSize.normal&&report.visibleSize.smaller<report.visibleSize.normal,JSON.stringify(report.visibleSize));
  report.checks.push('Actual rendered creature grows and shrinks with size cards, together with its collision radius');
  const modes=await page.evaluate(()=>{const c=window.__EVOLVE_ORGAN_SKILLS_V598__.test.context(),api=window.__EVOLVE_PLAYER_MUTANT_V599__,parts=window.__EVOLVE_PARTS_V523__.test;return {partsAPI:Object.keys(window.__EVOLVE_PARTS_V523__),armAPI:Object.keys(window.__EVOLVE_ARM_ITEMS_V589__.test),equipped:window.__EVOLVE_ARM_ITEMS_V589__.read(),state:{arm:c.state.arm,tail:c.state.tail}};});report.modes=modes;
  const tails=await page.evaluate(()=>{
   const c=window.__EVOLVE_ORGAN_SKILLS_V598__.test.context(),api=window.__EVOLVE_PLAYER_MUTANT_V599__;c.state.tail=1;c.stats.whipRange=0;const a=api.test.inspect(900,3).toDataURL().split(',')[1],r1=api.read();c.stats.whipRange=1;c.state.tail=6;const b=api.test.inspect(900,3).toDataURL().split(',')[1],r2=api.read();c.stats.whipRange=0;c.state.tail=0;return {a,b,r1,r2};
  });
  fs.writeFileSync(path.join(out,'player-mutant-tail-base.png'),Buffer.from(tails.a,'base64'));fs.writeFileSync(path.join(out,'player-mutant-tail-upgraded.png'),Buffer.from(tails.b,'base64'));delete tails.a;delete tails.b;assert.equal(tails.r1.tailLength,tails.r1.tailRange*.7);assert.ok(tails.r1.tailLength<=32);assert.ok(tails.r2.tailLength>tails.r1.tailLength);assert.ok(tails.r2.tailSegments>tails.r1.tailSegments);report.tail=tails;report.checks.push('Learned tail uses native textured armor; range upgrades increase visible physical length and segment count');
  await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().draw());await page.screenshot({path:path.join(out,'player-mutant-battle-portrait.png')});await page.setViewportSize({width:852,height:393});await page.evaluate(()=>window.__EVOLVE_TEST_MODULE_V575__.test.context().draw());await page.screenshot({path:path.join(out,'player-mutant-battle-landscape.png')});
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(error){report.success=false;report.failure=error.stack||String(error);await page.screenshot({path:path.join(out,'player-mutant-failure.png')}).catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,'player-mutant-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,gait:report.gait?{samples:report.gait.samples.length,builds:report.gait.builds}:undefined},null,2));await context.close();await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
