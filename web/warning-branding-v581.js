// WEB-17: approved reference lettering and countdown; cache cutouts once, retain the crest.
const warningBrandArtV581=JSON.parse('__WARNING_BRANDING_ART__'),warningBrandSpritesV581=new Map();
let warningBrandErrorV581=null,warningBrandCanvasV581=null,warningBrandContextV581=null;
const warningBrandReadyV581=Promise.all(Object.entries(warningBrandArtV581.atlases).map(async([key,a])=>{
 const im=new Image();im.decoding='async';await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=()=>reject(Error('Warning artwork unavailable: '+key));im.src=a.path;});
 for(const [name,s]of Object.entries(warningBrandArtV581.sprites)){
  if(s.atlas!==key)continue;const [x,y,w,h]=s.crop,c=document.createElement('canvas'),scale=Math.min(1,s.cache_height/h);c.width=Math.round(w*scale);c.height=Math.round(h*scale);const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,x,y,w,h,0,0,c.width,c.height);warningBrandSpritesV581.set(name,c);
 }im.src='';
})).catch(error=>{warningBrandErrorV581=String(error);throw error;});
function paintWarningBrandV581(elapsed,reduced,kind,phase){
 const c=warningBrandCanvasV581,g=warningBrandContextV581;if(!c||!g||warningBrandSpritesV581.size!==10)return;
 const w=c.parentElement.clientWidth||W,h=c.parentElement.clientHeight||H,dpr=Math.min(window.devicePixelRatio||1,1.5),cw=Math.round(w*dpr),ch=Math.round(h*dpr),landscape=w>h;
 if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch;}g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
 const draw=(name,x,y,maxW,maxH,align=.5)=>{const s=warningBrandSpritesV581.get(name),heightScale=warningBrandArtV581.sprites[name].height_scale||1,scale=Math.min(maxW/s.width,maxH/(s.height*heightScale)),dw=s.width*scale,dh=s.height*heightScale*scale;g.drawImage(s,x-dw*align,y-dh*.5,dw,dh);return dw;};
 const headerY=h*(landscape?.105:.085),headerH=landscape?30:Math.min(48,h*.06);
 draw('breach',w*.07,headerY,w*(landscape?.32:.59),headerH,0);
 const phaseY=headerY+headerH*.5+15,phaseW=draw('phase',w*.07,phaseY,70,16,0);
 draw('digit'+Math.max(1,Math.min(3,phase||1)),w*.07+phaseW+9,phaseY,16,19,0);
 draw('digit'+cinematicPoseV580(elapsed,reduced).count,w*.9,headerY+5,52,landscape?48:62);
 const bandY=h*(landscape?.61:.65)+(landscape?35:43)/2+7,warningH=landscape?26:30,s=warningBrandSpritesV581.get('warning'),stride=s.width/s.height*warningH+27,drift=reduced?0:elapsed*27;
 g.save();g.translate(w*.5,bandY);g.rotate(-2*Math.PI/180);
 for(let x=-w-stride-drift%stride;x<w+stride;x+=stride)draw('warning',x,0,stride-27,warningH);
 g.restore();
 draw('crest',w*.5,bandY,landscape?88:w*.29,landscape?88:Math.min(124,h*.15));
 draw(kind,w*.5,h*(landscape?.855:.83),w*(landscape?.7:.88),h*(landscape?.15:.16));
 draw('subtitle',w*.5,h*(landscape?.935:.928),w*.52,landscape?14:Math.min(21,h*.026));
}
window.__EVOLVE_PAINTED_WARNING_V581__={ready:warningBrandReadyV581,read:()=>({ready:warningBrandSpritesV581.size===10,error:warningBrandErrorV581,sprites:warningBrandSpritesV581.size,cachedBytes:[...warningBrandSpritesV581.values()].reduce((n,c)=>n+c.width*c.height*4,0),design:'reference-1000027488',visibleFontText:false,legacyFinalHUD:!!document.getElementById('finalArtV417')})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_PAINTED_WARNING_V581__.test={surface:name=>warningBrandSpritesV581.get(name)};
