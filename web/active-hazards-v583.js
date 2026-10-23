// Native active fields retain their original artwork below actors and foreground.
// The red telegraph pass is reserved for the preparation interval.
function drawActiveHazardsV583(){
 for(const z of purges){
  if(z.warn>0||!worldCircleVisibleV441(z.x,z.y,z.r,36))continue;
  const pulse=.5+.5*Math.sin(t*10);ctx.save();ctx.translate(z.x,z.y);
      ctx.globalAlpha=.30+.14*pulse;ctx.fillStyle='rgba(255,54,32,.28)';ctx.strokeStyle='#ff3e31';ctx.lineWidth=3;ctx.shadowBlur=14;ctx.shadowColor='#ff3728';
      ctx.beginPath();ctx.arc(0,0,z.r,0,TAU);ctx.fill();ctx.stroke();
      for(let i=0;i<5;i++){let a=i/5*TAU+t*1.7;ctx.strokeStyle='rgba(255,190,115,.55)';ctx.beginPath();ctx.moveTo(Math.cos(a)*z.r*.25,Math.sin(a)*z.r*.25);ctx.lineTo(Math.cos(a)*z.r*.9,Math.sin(a)*z.r*.9);ctx.stroke();}

  ctx.restore();
 }
  // biome route hazards
  for(const z of biomeHazards){
    if(z.warn>0||!worldCircleVisibleV441(z.x,z.y,z.r,36))continue;
    const warning=z.warn>0,p=.5+.5*Math.sin(t*7);ctx.save();ctx.translate(z.x,z.y);
    if(z.kind==='cryo'){
      ctx.fillStyle=warning?'rgba(91,186,255,.08)':'rgba(86,181,255,.19)';ctx.strokeStyle='#7ed0ff';ctx.shadowBlur=warning?5:13;ctx.shadowColor='#65c9ff';ctx.lineWidth=2;ctx.setLineDash(warning?[6,5]:[]);
      ctx.beginPath();ctx.arc(0,0,z.r*(warning?.88+.10*(1-Math.max(0,z.warn/.85)):1),0,TAU);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      if(!warning)for(let i=0;i<6;i++){let a=i/6*TAU;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*z.r*.82,Math.sin(a)*z.r*.82);ctx.stroke();}
    }else{
      ctx.fillStyle=warning?'rgba(255,89,40,.09)':'rgba(255,72,28,.24)';ctx.strokeStyle='#ff7549';ctx.shadowBlur=warning?5:15;ctx.shadowColor='#ff3c21';ctx.lineWidth=2.5;ctx.setLineDash(warning?[7,5]:[]);
      ctx.beginPath();ctx.arc(0,0,z.r,0,TAU);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      if(!warning){ctx.globalAlpha=.55;for(let i=0;i<5;i++){let a=i/5*TAU+t*.8;ctx.beginPath();ctx.arc(Math.cos(a)*z.r*.46,Math.sin(a)*z.r*.46,4+2*p,0,TAU);ctx.stroke();}}
    }
    ctx.restore();
  }

 for(const tg of telegraphs){
  if(!tg.active||tg.life<=0||!['acidZone','nullZone'].includes(tg.kind)||!telegraphVisibleV441(tg))continue;
  ctx.save();ctx.lineWidth=2.5;
  if(tg.kind==='nullZone'){
      ctx.globalAlpha=.24+.13*Math.sin(t*8);ctx.fillStyle='rgba(126,55,210,.28)';ctx.strokeStyle='#cf80ff';ctx.shadowBlur=15;ctx.shadowColor='#9140ff';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(tg.x,tg.y,tg.r,0,TAU);ctx.fill();ctx.stroke();
      ctx.globalAlpha=.52;for(let i=0;i<4;i++){let a=i/4*TAU-t*.8;ctx.beginPath();ctx.moveTo(tg.x+Math.cos(a)*8,tg.y+Math.sin(a)*8);ctx.lineTo(tg.x+Math.cos(a)*tg.r*.82,tg.y+Math.sin(a)*tg.r*.82);ctx.stroke();}
  }else{
      ctx.globalAlpha=.28+.12*Math.sin(t*7);ctx.fillStyle='rgba(82,255,61,.30)';ctx.strokeStyle='#6dff58';ctx.shadowBlur=14;ctx.shadowColor='#53ff3e';
      ctx.beginPath();ctx.arc(tg.x,tg.y,tg.r,0,TAU);ctx.fill();ctx.stroke();
      for(let i=0;i<6;i++){let a=i/6*TAU+t*.9;ctx.beginPath();ctx.arc(tg.x+Math.cos(a)*tg.r*.55,tg.y+Math.sin(a)*tg.r*.55,3.5+1.5*Math.sin(t*4+i),0,TAU);ctx.stroke();}
  }
  ctx.restore();
 }
}
