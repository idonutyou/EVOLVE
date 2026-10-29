// Battle character lighting from a tiny, cached sample of the active map.
// No core ID, original image data, gameplay or save data is changed.
const ambientCacheV627=new WeakMap();
const ambientMapCacheV627=new Map();
const ambientShadowCacheV627=new WeakMap();
const ambientStatsV627={samples:0,failures:0,shadowBuilds:0};
const ambientNeutralV627=Object.freeze({brightness:1,saturation:1,hue:0,sepia:0,luma:.5,shadow:.24,filter:'none'});
function ambientClampV627(n,lo,hi){return Math.max(lo,Math.min(hi,n));}
function ambientProfileFromPixelsV627(pixels){
 let r=0,g=0,b=0,weight=0;
 for(let i=0;i<pixels.length;i+=4){
  const alpha=pixels[i+3]/255;if(alpha<.1)continue;
  const y=(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2])/255;
  // Avoid a few black seams or tiny bright lamps dominating the map sample.
  const w=alpha*(y<.06?.35:y>.92?.35:1);
  r+=pixels[i]*w;g+=pixels[i+1]*w;b+=pixels[i+2]*w;weight+=w;
 }
 if(!weight)return ambientNeutralV627;
 r/=weight;g/=weight;b/=weight;
 const luma=ambientClampV627((.2126*r+.7152*g+.0722*b)/255,0,1);
 const brightness=ambientClampV627(.85+luma*.18,.85,.96);
 const saturation=ambientClampV627(.91+luma*.08,.91,.98);
 const hue=ambientClampV627((b-r)/255*5,-3,3);
 const sepia=ambientClampV627((r-b)/255*.07,0,.045);
 const shadow=ambientClampV627(.18+(1-luma)*.10,.18,.28);
 const filter=`brightness(${brightness.toFixed(3)}) saturate(${saturation.toFixed(3)}) sepia(${sepia.toFixed(3)}) hue-rotate(${hue.toFixed(2)}deg)`;
 return {brightness,saturation,hue,sepia,luma,shadow,filter};
}
function ambientSampleV627(image,applyFloorFilter){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=24;
 const g=canvas.getContext('2d',{willReadFrequently:true});
 if(!g)return ambientNeutralV627;
 try{
  if(applyFloorFilter&&typeof CLARITY_V574!=='undefined'&&CLARITY_V574.enabled)g.filter=CLARITY_V574.mapFilter;
  g.drawImage(image,0,0,24,24);g.filter='none';
  const profile=ambientProfileFromPixelsV627(g.getImageData(0,0,24,24).data);
  ambientStatsV627.samples++;return profile;
 }catch(error){ambientStatsV627.failures++;return ambientNeutralV627;}
}
function ambientProfileV627(){
 // The active campaign image also covers TEST map switching. The original
 // generated map has no campaign image, so use its existing floor texture.
 const mapped=!!campaignActiveV567;
 const image=mapped?mapImageV562:ART['floor_decals/floor_containment_clean'];
 if(!image||!(image.naturalWidth||image.width)||!(image.naturalHeight||image.height))return ambientNeutralV627;
 // Some map loaders recreate Image objects on return. Content-addressed URLs
 // let the same map reuse its earlier sample without keeping image data alive.
 const src=image.currentSrc||image.src||'',identity=src&&src.length<2048?`${mapped?campaignActiveV567.id:'legacy'}|${src}`:null;
 if(identity&&ambientMapCacheV627.has(identity))return ambientMapCacheV627.get(identity);
 let variants=ambientCacheV627.get(image);
 if(!variants){variants={};ambientCacheV627.set(image,variants);}
 const key=mapped?'campaign':'legacy';
 if(!variants[key])variants[key]=ambientSampleV627(image,mapped);
 if(identity){
  if(ambientMapCacheV627.size>=12)ambientMapCacheV627.delete(ambientMapCacheV627.keys().next().value);
  ambientMapCacheV627.set(identity,variants[key]);
 }
 return variants[key];
}
function ambientShadowCellV627(image,frame,art){
 let cells=ambientShadowCacheV627.get(image);
 if(!cells){cells=new Map();ambientShadowCacheV627.set(image,cells);}
 if(cells.has(frame))return cells.get(frame);
 const canvas=document.createElement('canvas');canvas.width=96;canvas.height=24;
 const g=canvas.getContext('2d');if(!g)return null;
 try{
  g.drawImage(image,(frame%art.columns)*art.cellWidth,Math.floor(frame/art.columns)*art.cellHeight,
   art.cellWidth,art.cellHeight,0,0,canvas.width,canvas.height);
  g.globalCompositeOperation='source-in';g.fillStyle='#000';g.fillRect(0,0,canvas.width,canvas.height);
  cells.set(frame,canvas);ambientStatsV627.shadowBuilds++;return canvas;
 }catch(error){ambientStatsV627.failures++;return null;}
}
function ambientDrawShadowV627(pose,m){
 const a=bioArtV625,world=playerWorldScaleV603(),unit=mutantBaseScaleV599*world;
 const idle=Math.floor((m.clock%a.cycleSeconds)/a.cycleSeconds*a.frames),
  walk=Math.floor((m.distance%a.gaitDistance)/a.gaitDistance*a.frames),blend=ambientClampV627(m.blend||0,0,1);
 const opacity=ambientProfileV627().shadow;
 ctx.save();ctx.translate(player.x,player.y+9*world);ctx.rotate(pose.rotation);ctx.scale(pose.facing,1);
 // A soft underlying patch and a frame-shaped contact shadow remain independent
 // of the particular core texture or colour.
 ctx.globalAlpha=opacity*.38;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(0,0,21*world,7*world,0,0,TAU);ctx.fill();
 const put=(image,frame,alpha)=>{
  if(alpha<=.01)return;const cell=ambientShadowCellV627(image,frame,a);if(!cell)return;
  ctx.globalAlpha=opacity*alpha;ctx.drawImage(cell,-a.anchor[0]*unit,-5*world,a.width*unit,10*world);
 };
 put(bioV625.images.idleAtlas,idle,1-blend);put(bioV625.images.walkAtlas,walk,blend);
 ctx.restore();
}
window.__EVOLVE_AUTO_AMBIENT_V627__={
 read:()=>({map:campaignActiveV567?.id||'infected',...ambientProfileV627(),samples:ambientStatsV627.samples,failures:ambientStatsV627.failures,shadowBuilds:ambientStatsV627.shadowBuilds}),
};
if(new URLSearchParams(location.search).get('evolveQA')==='1'){
 window.__EVOLVE_AUTO_AMBIENT_V627__.test={profileFromPixels:ambientProfileFromPixelsV627,sample:ambientSampleV627};
}
