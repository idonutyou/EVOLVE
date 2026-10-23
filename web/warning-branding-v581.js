// WEB-17: approved reference lettering and countdown; cache cutouts once, retain the crest.
const warningBrandArtV581=JSON.parse('__WARNING_BRANDING_ART__'),warningBrandSpritesV581=new Map(),warningBrandSpriteCountV584=Object.keys(warningBrandArtV581.sprites).length;
function warningBrandNameV584(name,language){const localized=name+'_'+language;return warningBrandArtV581.sprites[localized]?localized:name;}
let warningTapeMaterialV592=null;
function warningTapeSurfaceV592(){
 if(warningTapeMaterialV592)return warningTapeMaterialV592;
 const c=document.createElement('canvas');c.width=256;c.height=96;const g=c.getContext('2d'),base=g.createLinearGradient(0,0,0,96);base.addColorStop(0,'#605044');base.addColorStop(.12,'#32251f');base.addColorStop(.45,'#201b19');base.addColorStop(.83,'#34231f');base.addColorStop(1,'#77604c');g.fillStyle=base;g.fillRect(0,0,256,96);
 for(const y of [3,81]){g.save();g.beginPath();g.rect(0,y,256,12);g.clip();g.fillStyle='#211f1a';g.fillRect(0,y,256,12);for(let x=-24;x<280;x+=32){g.fillStyle='#a25743';g.beginPath();g.moveTo(x,y+12);g.lineTo(x+13,y);g.lineTo(x+29,y);g.lineTo(x+16,y+12);g.closePath();g.fill();}g.restore();}
 let seed=592;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<5400;i++){const light=random()>.56;g.fillStyle=light?'rgba(205,181,145,'+(.025+random()*.095)+')':'rgba(4,8,8,'+(.035+random()*.18)+')';g.fillRect(random()*256,random()*96,.35+random()*1.1,.35+random()*1.1);}
 for(let i=0;i<90;i++){g.strokeStyle=i%3?'rgba(185,166,137,.09)':'rgba(6,8,8,.22)';g.lineWidth=.35+random()*.7;const x=random()*256,y=random()*96;g.beginPath();g.moveTo(x,y);g.lineTo(x+3+random()*24,y+(random()-.5)*1.7);g.stroke();}
 g.fillStyle='#b6a58a70';g.fillRect(0,1,256,1);g.fillRect(0,94,256,1);g.fillStyle='#060b0b99';g.fillRect(0,16,256,1);g.fillRect(0,79,256,1);
 warningTapeMaterialV592=c;visualClarityStatsV592.tapeBuilds++;return c;
}
function paintWarningTapeV592(g,width,height){const tile=warningTapeSurfaceV592();for(let x=-width-256;x<width+256;x+=256)g.drawImage(tile,x,-height/2,256,height);}
let warningBrandErrorV581=null,warningBrandCanvasV581=null,warningBrandContextV581=null;
const warningBrandReadyV581=Promise.all(Object.entries(warningBrandArtV581.atlases).map(async([key,a])=>{
 const im=new Image();im.decoding='async';await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=()=>reject(Error('Warning artwork unavailable: '+key));im.src=a.path;});
 for(const [name,s]of Object.entries(warningBrandArtV581.sprites)){
  if(s.atlas!==key)continue;const [x,y,w,h]=s.crop,c=document.createElement('canvas'),scale=Math.min(1,s.cache_height/h);c.width=Math.round(w*scale);c.height=Math.round(h*scale);const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,x,y,w,h,0,0,c.width,c.height);warningBrandSpritesV581.set(name,c);
 }im.src='';
})).catch(error=>{warningBrandErrorV581=String(error);throw error;});
function paintWarningBrandV581(elapsed,reduced,kind,phase){
 const c=warningBrandCanvasV581,g=warningBrandContextV581;if(!c||!g||warningBrandSpritesV581.size!==warningBrandSpriteCountV584)return;
 const w=c.parentElement.clientWidth||W,h=c.parentElement.clientHeight||H,dpr=Math.min(window.devicePixelRatio||1,1.5),cw=Math.round(w*dpr),ch=Math.round(h*dpr),landscape=w>h;
 if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch;}g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
 const language=homeLanguageV522();
 const draw=(name,x,y,maxW,maxH,align=.5)=>{const key=warningBrandNameV584(name,language),s=warningBrandSpritesV581.get(key),heightScale=warningBrandArtV581.sprites[key].height_scale||1,scale=Math.min(maxW/s.width,maxH/(s.height*heightScale)),dw=s.width*scale,dh=s.height*heightScale*scale;g.drawImage(s,x-dw*align,y-dh*.5,dw,dh);return dw;};
 const headerY=h*(landscape?.105:.085),headerH=landscape?30:Math.min(48,h*.06);
 draw('breach',w*.07,headerY,w*(landscape?.32:.59),headerH,0);
 const phaseY=headerY+headerH*.5+15,phaseW=draw('phase',w*.07,phaseY,70,16,0);
 draw('digit'+Math.max(1,Math.min(3,phase||1)),w*.07+phaseW+9,phaseY,16,19,0);
 draw('digit'+cinematicPoseV580(elapsed,reduced).count,w*.9,headerY+5,52,landscape?48:62);
 const tape=warningTapeLayoutV592(w,h,elapsed,reduced),bandY=tape.centerY,warningH=tape.letterHeight,s=warningBrandSpritesV581.get(warningBrandNameV584('warning',language)),stride=s.width/s.height*warningH+27;
 visualClarityStatsV592.tape={...tape,letterCenterY:bandY,material:'weathered-oxide-steel'};
 g.save();g.translate(tape.centerX,bandY);g.rotate(tape.angle);g.translate(-tape.drift,0);paintWarningTapeV592(g,w,tape.height);
 for(let x=-w-stride;x<w+stride+120;x+=stride)draw('warning',x,0,stride-27,warningH);
 g.restore();
 draw('crest',w*.5,bandY,landscape?88:w*.29,landscape?88:Math.min(124,h*.15));
 draw(kind,w*.5,h*(landscape?.855:.83),w*(landscape?.7:.88),h*(landscape?.15:.16));
}
window.__EVOLVE_PAINTED_WARNING_V581__={ready:warningBrandReadyV581,read:()=>({ready:warningBrandSpritesV581.size===warningBrandSpriteCountV584,error:warningBrandErrorV581,sprites:warningBrandSpritesV581.size,cachedBytes:[...warningBrandSpritesV581.values()].reduce((n,c)=>n+c.width*c.height*4,0),design:'reference-1000027488',language:homeLanguageV522(),locales:['en','ko'],bossNames:'English in both locales',visibleFontText:false,legacyFinalHUD:!!document.getElementById('finalArtV417')})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_PAINTED_WARNING_V581__.test={surface:(name,language)=>warningBrandSpritesV581.get(language?warningBrandNameV584(name,language):name)};
