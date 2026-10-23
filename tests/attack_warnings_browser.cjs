const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),p=path.resolve(dist,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),page=await context.newPage(),report={errors:[],failedRequests:[],geometry:{},bosses:[]};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))report.failedRequests.push({url:r.url(),status:r.status()})});
 try{
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>callback.name==='loop'?0:raf(callback)});
  await page.goto(`http://127.0.0.1:${server.address().port}/?evolveQA=1&evolveBioQA=1`,{waitUntil:'domcontentloaded',timeout:180000});
  await page.waitForFunction(()=>window.__EVOLVE_ATTACK_WARNINGS_V582__&&!document.getElementById('start').disabled&&!document.getElementById('webLoader'),null,{timeout:180000});
  await require('./admin_unlock.cjs')(page);
  await page.locator('#start').click();await page.locator('[data-contract="exterminate"]').click();await page.locator('[data-weapon="arm"]').click();
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
  report.geometry=await page.evaluate(()=>{
   const api=window.__EVOLVE_ATTACK_WARNINGS_V582__,a=api.test,c=a.context(),g=c.ctx,w=g.canvas.width,h=g.canvas.height,o=c.origin(),cx=o.x+150,cy=o.y+280,results={};
   const reset=()=>{g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle='#182c22';g.fillRect(0,0,w,h)},pixel=(x,y)=>Array.from(g.getImageData(x,y,1,1).data),red=p=>p[0]>29;
   g.save();reset();a.paint(a.circle(150,280,60));results.circleFilled=red(pixel(150,280))&&red(pixel(195,280));
   results.interiorPixel=pixel(150,280);results.softInterior=results.interiorPixel[0]-24<=25;
   reset();a.paint(a.lane(100,280,0,150,20));results.laneFilled=red(pixel(175,280))&&!red(pixel(175,320));
   reset();a.paint(a.sector(150,280,100,Math.PI,Math.PI-.35));results.sectorSafeGap=!red(pixel(220,280))&&red(pixel(80,280));
   reset();a.paint(a.sector(150,280,100,0,Math.PI,45));results.ringHole=!red(pixel(150,280))&&red(pixel(220,280));
   a.venom({boss:{x:150,y:280},attack:{key:'acid',stage:'windup',acidRays:[{x:150,y:280,a:0,len:0,w:20}]},geometry:{},zones:[],clouds:[],infections:[]},()=>new Path2D(),()=>0);results.fullyBlockedLaneDoesNotThrow=true;
   const fixtures=['acidBurst','charge','frostLine','spitPool','runnerDash','bruteSlam','ravagerStrike','alphaSlam','omegaPool','apexSweep','omegaLattice','genesisFracture','abyssCross','apexNova','counterPrism','counterBrood','counterPurify','counterExecution','counterNull','nullZone','acidZone','emberCharge','bioSpikes','frostFan','frostCross','geneLattice','magmaCrown'];
   results.legacy={};results.activeLegacy={};for(const kind of fixtures){reset();g.translate(-o.x,-o.y);const z={kind,x:cx,y:cy,r:55,w:30,len:150,a:0,life:.8,max:1,points:[{x:cx,y:cy}],safeA:kind==='magmaCrown'?Math.PI:undefined};a.legacy(z);g.setTransform(1,0,0,1,0,0);const d=g.getImageData(0,100,w,Math.min(500,h-100)).data;let count=0;for(let i=0;i<d.length;i+=4)if(d[i]>29)count++;results.legacy[kind]=count;
    reset();g.translate(-o.x,-o.y);const before=api.read().drawn;a.legacy({...z,active:true});results.activeLegacy[kind]=api.read().drawn-before;
   }
   // Active fields still have their own artwork, without the warning pass.
   c.telegraphs.length=0;c.purges.length=0;c.biomeHazards.length=0;
   results.activeNativeFields={};
   for(const kind of ['acidZone','nullZone','purge','cryo','magma']){
    const z={kind,x:cx,y:cy,r:40,life:2,max:2,active:2,warn:0};
    const list=kind==='purge'?c.purges:['cryo','magma'].includes(kind)?c.biomeHazards:c.telegraphs;list.push(z);
    reset();g.translate(-o.x,-o.y);c.warnings();const warningDraws=api.read().drawn;c.activeHazards();g.setTransform(1,0,0,1,0,0);const p=pixel(150,280);
    results.activeNativeFields[kind]={warningDraws,artVisible:p.some((v,i)=>i<3&&v!==[24,44,34][i])};list.length=0;
   }
   c.purges.push({x:cx,y:cy,r:40,warn:.5,active:2});reset();g.translate(-o.x,-o.y);c.warnings();results.environmentalWindup=api.read().drawn===1;c.purges.length=0;
   const venomBase={boss:{x:cx,y:cy,r:40},geometry:{},zones:[],clouds:[],infections:[]},count=s=>{const n=api.read().drawn;a.venom({...venomBase,...s},a.sector,()=>500);return api.read().drawn-n;};
   const zone={x:cx,y:cy,r:45,kind:'spore',life:3,warn:.5},cloud={x:cx,y:cy,r:50,maxR:100,innerR:10,alpha:1,age:0,warn:1};
   results.venomZone={windup:count({zones:[zone]}),active:count({zones:[{...zone,warn:0}]})};
   results.venomCloud={windup:count({clouds:[cloud]}),active:count({clouds:[{...cloud,age:1}]})};
   results.activeInfection=count({infections:[{x:cx,y:cy,r:40,time:1,a:0}],infectionRhythm:{frontGap:.9},geometry:{infection:500,infectionSpeed:100,infectionHalf:.4}});
   reset();a.paint(a.circle(150,280,60),true);results.activePainterSuppressed=!red(pixel(150,280));
   g.restore();c.draw();return results;
  });
  assert.ok(report.geometry.circleFilled&&report.geometry.softInterior&&report.geometry.laneFilled&&report.geometry.sectorSafeGap&&report.geometry.ringHole,JSON.stringify(report.geometry));
  assert.ok(Object.values(report.geometry.legacy).every(n=>n>25),JSON.stringify(report.geometry.legacy));
  assert.ok(Object.values(report.geometry.activeLegacy).every(n=>n===0));
  assert.ok(Object.values(report.geometry.activeNativeFields).every(r=>r.warningDraws===0&&r.artVisible),JSON.stringify(report.geometry.activeNativeFields));
  assert.ok(report.geometry.environmentalWindup&&report.geometry.activePainterSuppressed);
  assert.deepEqual(report.geometry.venomZone,{windup:1,active:0});assert.deepEqual(report.geometry.venomCloud,{windup:1,active:0});assert.equal(report.geometry.activeInfection,0);
  console.log(JSON.stringify({checkpoint:'red-warning-pixels',geometry:report.geometry}));
  // Use the actual underpass editor and foreground renderer, not a mock roof.
  await page.evaluate(async()=>window.__EVOLVE_TEST_MODULE_V575__.go(1,'biolab',false));
  await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().ready,null,{timeout:60000});
  await page.locator('#homeMapEditV562').click();await page.waitForFunction(()=>!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy);
  await page.locator('#meUnderV575').click();
  const roof=await page.evaluate(()=>{const e=window.__EVOLVE_MAP_TEST_V562__.test.editor,f=e.baseField();let x=432,y=768;outer:for(let yy=100;yy<1400;yy+=8)for(let xx=100;xx<760;xx+=8)if(f[yy*2*1728+xx*2]<-320){x=xx;y=yy;break outer}e.paint({mode:'under',radius:40,points:[[x,y],[x+2,y]]});return{x:x*1.25,y:y*1.25}});
  await page.locator('#meApplyV562').click();await page.waitForFunction(()=>document.getElementById('mapEditorV562').hidden&&!window.__EVOLVE_MAP_TEST_V562__.test.editor.read().busy,null,{timeout:60000});
  await page.locator('#start').click();await page.locator('[data-contract="exterminate"]').click();await page.locator('[data-weapon="arm"]').click();await page.waitForFunction(()=>window.__EVOLVE_TEST_MODULE_V575__.read().running);
  report.roof=await page.evaluate(roof=>{
   const game=window.__EVOLVE_TEST_MODULE_V575__.test.context(),a=window.__EVOLVE_ATTACK_WARNINGS_V582__.test,c=a.context();Object.assign(game.player,{...roof,inv:999});c.telegraphs.length=0;c.draw();
   const o=c.origin(),scale=c.ctx.canvas.width/innerWidth,x=Math.round((roof.x-o.x)*scale),y=Math.round((roof.y-o.y)*scale),pixel=()=>Array.from(c.ctx.getImageData(x,y,1,1).data),before=pixel(),layer=c.foreground();
   c.telegraphs.push({kind:'spitPool',...roof,r:48,life:1,max:1,locked:true});c.draw();const after=pixel(),visible=after[0]>before[0]+5&&after[0]-before[0]<30;
   return{before,after,visible,foregroundPresent:!!layer,drawn:window.__EVOLVE_ATTACK_WARNINGS_V582__.read().drawn};
  },roof);
  assert.ok(report.roof.visible&&report.roof.foregroundPresent&&report.roof.drawn>0,JSON.stringify(report.roof));
  await page.screenshot({path:path.join(out,'red-warning-over-roof.png')});console.log(JSON.stringify({checkpoint:'red-warning-over-actual-underpass',...report.roof}));
  // Exercise native boss skill state and the final draw pass in both orientations.
  for(const orientation of ['portrait','landscape']){
   if(orientation==='landscape')await page.setViewportSize({width:852,height:393});
   for(const kind of ['venom','bio']){
    await page.evaluate(async kind=>{const api=window.__EVOLVE_TEST_MODULE_V575__;await api.boss(kind,3);const c=api.test.context();c.player.inv=999;for(let i=0;i<260;i++)c.step(.02);c.draw();},kind);
    const results=await page.evaluate(kind=>{
     const api=window.__EVOLVE_ATTACK_WARNINGS_V582__,c=api.test.context(),game=window.__EVOLVE_TEST_MODULE_V575__.test.context(),results=[];
     if(kind==='venom'){
      const s=c.venom(),qa=window.__EVOLVE_V554_QA__,vc=qa.test.context();s.boss.venomDebugV537=true;qa.auto(false);
      for(const phase of [1,2,3]){s.boss.venomPhaseV554=phase;vc.reset(s.boss);
       for(const key of qa.info().availableSkills){const cast=qa.cast(key);c.draw();const grouped=window.__EVOLVE_VISUAL_CLARITY_V592__?.read().volley,blocked=key==='breath'&&!!c.venom().breath?.blocked||['dart','acid'].includes(key)&&grouped?.lanes===0,drawn=api.read().drawn;
        qa.test.step(c.venom().specs[key].prepare+.03);const active=c.venom(),before=api.read().drawn;
        api.test.venom({...active,zones:active.zones.filter(z=>!(z.warn>0)),clouds:active.clouds.filter(z=>z.age>=z.warn)},api.test.sector,()=>500);
        const activeDrawn=api.read().drawn-before,stage=active.attack?.stage;c.draw();
        results.push({key,phase,cast,drawn,blocked,stage,activeDrawn});
       }
      }
      // Infection's second volley has a separate real windup, then clears again.
      s.boss.venomPhaseV554=2;vc.reset(s.boss);qa.cast('infection');qa.test.step(c.venom().specs.infection.prepare+.03);
      const counts=[];for(const step of [0,1.05,1.05]){if(step)qa.test.step(step);const state=c.venom(),before=api.read().drawn;api.test.venom({...state,zones:[],clouds:[]},api.test.sector,()=>500);counts.push(api.read().drawn-before);}
      results.push({key:'infection-second-windup',cast:true,drawn:counts[1],stage:'active',activeDrawn:counts[0]+counts[2],recast:counts});
     }else{
      const d=c.bio();d.options.auto=false;
      for(const key of ['claw','twin','rear','spit','mortar','charge','crush2','pulse','backfire','feast']){d.resetCombat(true);d.combat.bossPhase=3;d.combat.auto=false;const cast=d.startAttack(key,true);c.draw();const drawn=api.read().drawn;d.enterActive(d.combat.current);d.tickCombat(.03);c.draw();results.push({key,cast,drawn,stage:d.combat.current?.stage,activeDrawn:api.read().drawn});}
     }
     return results;
    },kind);
    assert.ok(results.every(r=>r.cast&&(r.drawn>0||r.blocked)&&r.stage.toLowerCase()==='active'&&r.activeDrawn===0),JSON.stringify({kind,orientation,results}));report.bosses.push({kind,orientation,skills:results});
    await page.screenshot({path:path.join(out,`red-warning-${kind}-${orientation}.png`)});console.log(JSON.stringify({checkpoint:'red-warning-native-boss',kind,orientation,results}));
   }
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);report.success=true;
 }catch(e){report.success=false;report.failure=e.stack;await page.screenshot({path:path.join(out,'attack-warning-failure.png')}).catch(()=>{});throw e}
 finally{fs.writeFileSync(path.join(out,'attack-warnings-browser.json'),JSON.stringify(report,null,2)+'\n');await context.close();await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
