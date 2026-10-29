'use strict';
/* Build compact in-game animation atlases using original RGB and the generated alpha matte. */
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),W=724,H=543,FRAMES=36,STEP=22,CELL_W=256,CELL_H=192;
const dist=path.join(root,'dist'),assets=path.join(dist,'assets'),metadata=path.join(root,'web/bio-core-art-v625.json');
fs.mkdirSync(assets,{recursive:true});
function addAsset(bytes){
 const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
 const rel='assets/'+sha256+'.png',target=path.join(dist,rel);
 if(fs.existsSync(target)){if(Buffer.compare(fs.readFileSync(target),bytes)!==0)throw Error('Asset hash collision');}
 else fs.writeFileSync(target,bytes);
 return {path:rel,sha256,bytes:bytes.length,kind:'image'};
}

const legs=[
 {name:'near_left', hip:[160,260], knee:[111.5,350], foot:[105.5,444.5], phase:0, direction:1, kr:[40,45], fr:[38,36]},
 {name:'far_left', hip:[307.5,362], knee:[281,387], foot:[289.5,412.5], phase:.5, direction:1, kr:[23,24], fr:[21,20]},
 {name:'near_right',hip:[450,310], knee:[510,382], foot:[522,481], phase:.5, direction:1, kr:[44,45], fr:[42,35]},
 {name:'far_right',hip:[547,298.5], knee:[600,345], foot:[607.5,414.5], phase:0, direction:1, kr:[30,34], fr:[30,28]},
];
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
function roundPulse(t,center,width){let d=Math.abs(t-center);d=Math.min(d,1-d);return Math.exp(-Math.pow(d/width,2));}
function heart(t){return .042*roundPulse(t,.12,.065)+.020*roundPulse(t,.29,.055);}
function bodyWarp(x,y,t){
  const cx=358,cy=235,dx=x-cx,dy=y-cy;
  const r=(dx*dx)/(220*220)+(dy*dy)/(193*193);
  const w=Math.exp(-.8*r),p=heart(t);
  const sway=1.3*Math.sin(2*Math.PI*t),bob=1.2*Math.sin(4*Math.PI*t+.3);
  const roll=.0035*Math.sin(2*Math.PI*t);
  return [w*(dx*p+sway-dy*roll),w*(dy*p+bob+dx*roll)];
}
function stride(t,offset){
  const p=(t+offset)%1,stance=.64;
  if(p<stance) return {dx:mix(4.5,-4.5,smooth(p/stance)),lift:0,stance:true};
  const s=(p-stance)/(1-stance);
  return {dx:mix(-4.5,4.5,smooth(s)),lift:7.5*Math.sin(Math.PI*s),stance:false};
}
function solveLeg(l,t,idle=false){
  const [hdx,hdy]=bodyWarp(l.hip[0],l.hip[1],t),hip=[l.hip[0]+hdx,l.hip[1]+hdy];
  const q=idle?{dx:0,lift:0,stance:true}:stride(t,l.phase),foot=[l.foot[0]+l.direction*q.dx,l.foot[1]-q.lift];
  const l1=Math.hypot(l.knee[0]-l.hip[0],l.knee[1]-l.hip[1]);
  const l2=Math.hypot(l.foot[0]-l.knee[0],l.foot[1]-l.knee[1]);
  let dx=foot[0]-hip[0],dy=foot[1]-hip[1],d=Math.hypot(dx,dy)||1;
  const bounded=Math.max(Math.abs(l1-l2)+.01,Math.min(l1+l2-.02,d));
  if(bounded!==d){foot[0]=hip[0]+dx*bounded/d;foot[1]=hip[1]+dy*bounded/d;dx=foot[0]-hip[0];dy=foot[1]-hip[1];d=bounded;}
  const a=(l1*l1+d*d-l2*l2)/(2*d),b=Math.sqrt(Math.max(0,l1*l1-a*a));
  const ux=dx/d,uy=dy/d;
  const baseCross=(l.foot[0]-l.hip[0])*(l.knee[1]-l.hip[1])-(l.foot[1]-l.hip[1])*(l.knee[0]-l.hip[0]);
  const sign=baseCross>=0?1:-1;
  const knee=[hip[0]+ux*a-sign*uy*b,hip[1]+uy*a+sign*ux*b];
  return {hip,knee,foot,stance:q.stance,lengths:[l1,l2]};
}
function influence(x,y,cx,cy,rx,ry){
  const r=Math.hypot((x-cx)/rx,(y-cy)/ry);
  if(r<=.42)return 1;if(r>=1.55)return 0;
  return 1-smooth((r-.42)/(1.55-.42));
}
function legStates(t,idle=false){return legs.map(l=>({leg:l,pose:solveLeg(l,t,idle)}));}
function warp(x,y,t,states){
  if(x===0||y===0||x===W||y===H)return [x,y];
  let [dx,dy]=bodyWarp(x,y,t);
  for(const {leg:l,pose:p} of states){
    const k=influence(x,y,l.knee[0],l.knee[1],l.kr[0],l.kr[1]);
    const f=influence(x,y,l.foot[0],l.foot[1],l.fr[0],l.fr[1]);
    const [bkx,bky]=bodyWarp(l.knee[0],l.knee[1],t);
    const [bfx,bfy]=bodyWarp(l.foot[0],l.foot[1],t);
    dx+=k*(p.knee[0]-l.knee[0]-bkx)+f*(p.foot[0]-l.foot[0]-bfx);
    dy+=k*(p.knee[1]-l.knee[1]-bky)+f*(p.foot[1]-l.foot[1]-bfy);
  }
  return [x+dx,y+dy];
}
function rasterWarp(original,target,xs,ys,vertices){
  const src=original.data,dst=target.data;
  for(let y=0;y<H;y++){
    const j=Math.min(Math.floor(y/STEP),ys.length-2), fy=(y-ys[j])/(ys[j+1]-ys[j]);
    for(let x=0;x<W;x++){
      const i=Math.min(Math.floor(x/STEP),xs.length-2), fx=(x-xs[i])/(xs[i+1]-xs[i]);
      const a=vertices[j][i],b=vertices[j][i+1],c=vertices[j+1][i],d=vertices[j+1][i+1];
      const dx=(1-fy)*((1-fx)*a[0]+fx*b[0])+fy*((1-fx)*c[0]+fx*d[0]);
      const dy=(1-fy)*((1-fx)*a[1]+fx*b[1])+fy*((1-fx)*c[1]+fx*d[1]);
      const sx=Math.max(0,Math.min(W-1,x-dx)), sy=Math.max(0,Math.min(H-1,y-dy));
      const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(W-1,x0+1),y1=Math.min(H-1,y0+1),u=sx-x0,v=sy-y0;
      const aa=(y0*W+x0)*4,bb=(y0*W+x1)*4,cc=(y1*W+x0)*4,dd=(y1*W+x1)*4,o=(y*W+x)*4;
      for(let k=0;k<4;k++)dst[o+k]=(1-v)*((1-u)*src[aa+k]+u*src[bb+k])+v*((1-u)*src[cc+k]+u*src[dd+k]);
    }
  }
}
async function main(){
 let meta;
 if(process.argv[2]==='--import'){
  if(process.argv.length!==7)throw Error('Usage: --import original.png matte.png tail.png gun.png');
  const [original,matte,tail,gun]=process.argv.slice(3).map(f=>addAsset(fs.readFileSync(f)));
  meta={version:625,original,matte,tail,gun};
 }else meta=JSON.parse(fs.readFileSync(metadata,'utf8'));
 const [image,matte]=await Promise.all([loadImage(path.join(dist,meta.original.path)),loadImage(path.join(dist,meta.matte.path))]);
 if(image.width!==1448||image.height!==1086||matte.width!==1448||matte.height!==1086)throw Error('Reference/matte dimensions do not match approved reference');
 const source=createCanvas(W,H),sg=source.getContext('2d');sg.drawImage(image,0,0,W,H);
 sg.globalCompositeOperation='destination-in';sg.drawImage(matte,0,0,W,H);sg.globalCompositeOperation='source-over';
 const xs=[];for(let x=0;x<W;x+=STEP)xs.push(x);xs.push(W);
 const ys=[];for(let y=0;y<H;y+=STEP)ys.push(y);ys.push(H);
 const original=sg.getImageData(0,0,W,H);
 for(const idle of [false,true]){
  const atlas=createCanvas(CELL_W*6,CELL_H*6),ag=atlas.getContext('2d');
  ag.imageSmoothingEnabled=true;ag.imageSmoothingQuality='high';
  for(let frame=0;frame<FRAMES;frame++){
    const t=frame/FRAMES,states=legStates(t,idle),c=createCanvas(W,H),g=c.getContext('2d');
    const v=ys.map(y=>xs.map(x=>{const p=warp(x,y,t,states);return [p[0]-x,p[1]-y];}));
    const result=g.createImageData(W,H);rasterWarp(original,result,xs,ys,v);g.putImageData(result,0,0);
    ag.drawImage(c,(frame%6)*CELL_W,Math.floor(frame/6)*CELL_H,CELL_W,CELL_H);
  }
  meta[idle?'idleAtlas':'walkAtlas']=addAsset(atlas.toBuffer('image/png'));
 }
 Object.assign(meta,{width:1448,height:1086,anchor:[724,500],shell:[724,480],tailRoot:[300,490],wrists:[[810,465],[1110,395]],nativeFacing:.36,frames:FRAMES,cellWidth:CELL_W,cellHeight:CELL_H,columns:6,cycleSeconds:1.44,gaitDistance:40,referenceLegs:4});
 fs.writeFileSync(metadata,JSON.stringify(meta,null,2)+'\n');
 console.log(JSON.stringify({metadata,walk:meta.walkAtlas,idle:meta.idleAtlas,original:meta.original,matte:meta.matte}));
}
main().catch(e=>{console.error(e);process.exit(1)});
