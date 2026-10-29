'use strict';
// Focused character PNG browser smoke: only six new BIO CORE images, no maps or game engine.
// This is NOT a substitute for the real-game/save regression before a character release.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const art=require('../web/bio-core-art-v625.json');
const images=['original','matte','tail','gun','walkAtlas','idleAtlas'];
const paths=new Map(images.map(key=>['/'+art[key].path,path.resolve(__dirname,'../dist',art[key].path)]));
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://127.0.0.1/').pathname;
 if(name==='/'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><canvas id="stage" width="512" height="384"></canvas></body></html>');return;}
 const local=paths.get(name);
 if(!local||!fs.existsSync(local)){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});fs.createReadStream(local).pipe(res);
});
(async()=>{
 let browser,context;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:15000});
  const stats=await page.evaluate(async ({art,images})=>{
   const loaded={};
   for(const key of images){
    const img=new Image();img.src='/'+art[key].path;await img.decode();loaded[key]=img;
   }
   const stage=document.getElementById('stage'),ctx=stage.getContext('2d',{willReadFrequently:true});
   const atlasStats={};
   for(const key of ['walkAtlas','idleAtlas']){
    const image=loaded[key],columns=art.columns,frames=art.frames;
    const rows=Math.ceil(frames/columns);
    if(image.naturalWidth<columns*art.cellWidth||image.naturalHeight<rows*art.cellHeight)throw Error(key+': insufficient atlas dimensions');
    let nonEmpty=0;
    for(let i=0;i<frames;i++){
     ctx.clearRect(0,0,stage.width,stage.height);
     ctx.drawImage(image,(i%columns)*art.cellWidth,Math.floor(i/columns)*art.cellHeight,art.cellWidth,art.cellHeight,0,0,art.cellWidth,art.cellHeight);
     const data=ctx.getImageData(0,0,art.cellWidth,art.cellHeight).data;
     let visible=false;
     for(let j=3;j<data.length;j+=128){if(data[j]>0){visible=true;break;}}
     if(visible)nonEmpty++;
    }
    atlasStats[key]={width:image.naturalWidth,height:image.naturalHeight,nonEmptyFrames:nonEmpty};
   }
   ctx.clearRect(0,0,stage.width,stage.height);
   ctx.drawImage(loaded.original,0,0,256,192);
   ctx.globalCompositeOperation='destination-in';
   ctx.drawImage(loaded.matte,0,0,256,192);
   ctx.globalCompositeOperation='source-over';
   ctx.drawImage(loaded.gun,250,180,128,64);
   ctx.drawImage(loaded.tail,200,230,128,64);
   const dimensions=Object.fromEntries(images.map(key=>[key,{width:loaded[key].naturalWidth,height:loaded[key].naturalHeight}]));
   return {atlasStats,dimensions,renderedPixels:ctx.getImageData(0,0,stage.width,stage.height).data.length};
  },{art,images});
  assert.deepEqual(errors,[]);assert.equal(art.frames,36);assert.equal(art.referenceLegs,4);
  for(const name of ['walkAtlas','idleAtlas'])assert.equal(stats.atlasStats[name].nonEmptyFrames,36,name+': missing/blank frame');
  assert.ok(stats.renderedPixels>0);
  console.log(JSON.stringify({success:true,scope:'isolated BIO CORE art only; not full-game QA',imageCount:images.length,stats},null,2));
 }finally{await context?.close();await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
