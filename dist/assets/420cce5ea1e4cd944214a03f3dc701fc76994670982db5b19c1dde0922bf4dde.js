/* M04-60: cached cosmetic light overlays. Original artwork and combat values are untouched. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&root.window===root&&root.location&&
    ['idonutyou.github.io','localhost','127.0.0.1'].includes(root.location.hostname)&&
    new URLSearchParams(root.location.search).get('evolveMockShop')==='1'){
  Object.defineProperty(root,'__EVOLVE_DEV_CORE_VISUALS_V617__',{value:api});
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const themes=Object.freeze({
  dev_core_theme_01:Object.freeze({label:'공명 코어',light:'#a5f8ff',accent:'#36a8f5',dark:'#194b8f'}),
  dev_core_theme_02:Object.freeze({label:'심홍 코어',light:'#ffd8c1',accent:'#ef645d',dark:'#8d203b'})
 });
 function createRenderer(makeCanvas){
  const sprites=new Map(),stats={builds:0,draws:0};
  function sprite(id){
   if(!Object.prototype.hasOwnProperty.call(themes,id))return null;
   if(sprites.has(id))return sprites.get(id);
   const c=makeCanvas(192,192);c.width=c.height=192;
   const g=c.getContext('2d'),v=themes[id];
   g.save();g.translate(96,96);
   const halo=g.createRadialGradient(0,0,3,0,0,89);
   halo.addColorStop(0,v.accent+'c8');halo.addColorStop(.28,v.accent+'73');halo.addColorStop(.64,v.dark+'38');halo.addColorStop(1,v.dark+'00');
   g.fillStyle=halo;g.fillRect(-96,-96,192,192);
   g.lineCap='round';g.strokeStyle=v.accent;g.lineWidth=3;g.globalAlpha=.72;
   for(const side of [-1,1]){
    g.beginPath();g.moveTo(side*8,0);g.bezierCurveTo(side*31,-14,side*34,-31,side*46,-41);g.stroke();
    g.beginPath();g.moveTo(side*9,9);g.bezierCurveTo(side*29,13,side*25,32,side*39,43);g.stroke();
   }
   g.globalAlpha=.9;g.lineWidth=2;g.strokeStyle=v.light;
   g.beginPath();g.ellipse(0,0,16,25,-.22,0,Math.PI*2);g.stroke();
   const nucleus=g.createRadialGradient(-3,-5,1,0,0,16);
   nucleus.addColorStop(0,'#ffffff');nucleus.addColorStop(.25,v.light);nucleus.addColorStop(1,v.accent+'18');
   g.fillStyle=nucleus;g.beginPath();g.ellipse(0,0,11,19,-.22,0,Math.PI*2);g.fill();
   g.restore();sprites.set(id,c);stats.builds++;return c;
  }
  function draw(g,id,x,y,radius=22,alpha=1){
   if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<=0)return false;
   const image=sprite(id);if(!image)return false;
   g.save();g.globalCompositeOperation='screen';g.globalAlpha*=Math.max(0,Math.min(1,alpha));
   g.drawImage(image,x-radius,y-radius,radius*2,radius*2);g.restore();stats.draws++;return true;
  }
  return Object.freeze({draw,read:()=>({...stats,cached:sprites.size,cacheBytes:sprites.size*192*192*4})});
 }
 return Object.freeze({themes,createRenderer,mode:'MOCK_ONLY'});
});
