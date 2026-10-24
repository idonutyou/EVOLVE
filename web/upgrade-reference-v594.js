// WEB-27: consume the supplied UI pixels, with independent transparent item art.
const upgradeReferenceV594=JSON.parse('__UPGRADE_REFERENCE__');
const upgradeSkinV594={ready:false,backgrounds:[],frames:[],icons:{},art:new Map(),artMetrics:new Map(),failures:[],builds:0};
const skinCanvasV594=(w,h)=>{const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);return c;};
function skinLoadV594(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('강화창 이미지를 불러오지 못했습니다.'));im.src=src;});}
let referenceImageV594=null,upgradeAtlasV594=null;
function skinFrameV594(tier){
 if(upgradeSkinV594.frames[tier])return upgradeSkinV594.frames[tier];
 const key=tier===2?'epic':tier===3?'legendary':'rare',box=upgradeReferenceV594.frames[key],c=skinCanvasV594(box[2],box[3]),g=c.getContext('2d');
 g.drawImage(referenceImageV594,...box,0,0,c.width,c.height);
 // Remove only the reference's static words and objects; keep the real frame pixels.
 g.globalCompositeOperation='destination-out';g.fillRect(35,35,c.width-70,c.height-77);g.globalCompositeOperation='source-over';
 if(tier===0||tier===4){const copy=skinCanvasV594(c.width,c.height),q=copy.getContext('2d');q.filter=tier===0?'grayscale(1) brightness(.65)':'hue-rotate(190deg) saturate(1.15)';q.drawImage(c,0,0);g.clearRect(0,0,c.width,c.height);g.drawImage(copy,0,0);}
 upgradeSkinV594.frames[tier]=c;upgradeSkinV594.builds++;return c;
}
function skinAlphaV594(c,feather=0){
 const g=c.getContext('2d',{willReadFrequently:true}),data=g.getImageData(0,0,c.width,c.height),p=data.data,w=c.width,h=c.height;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,m=Math.max(p[i],p[i+1],p[i+2]);let a=Math.max(0,Math.min(1,(m-16)/42));
  if(feather){const edge=Math.min(x,y,w-1-x,h-1-y),q=Math.min(1,edge/feather);a*=q*q*(3-2*q);}
  if(a<.004){p[i+3]=0;continue;}
  const light=Math.max(0,Math.min(1,(m-16)/42));if(light>0&&light<1){p[i]=Math.min(255,p[i]/light);p[i+1]=Math.min(255,p[i+1]/light);p[i+2]=Math.min(255,p[i+2]/light);}
  p[i+3]=Math.round(255*a);
 }g.putImageData(data,0,0);return c;
}
function skinIsolateArtV594(c,canonicalTop,canonicalBottom){
 const g=c.getContext('2d',{willReadFrequently:true}),data=g.getImageData(0,0,c.width,c.height),p=data.data,w=c.width,h=c.height,n=w*h,seen=new Uint8Array(n),keep=new Uint8Array(n),queue=new Int32Array(n);
 const bright=i=>Math.max(p[i*4],p[i*4+1],p[i*4+2])>=32;
 for(let seed=0;seed<n;seed++){
  if(seen[seed]||!bright(seed))continue;let read=0,write=1,inside=false;queue[0]=seed;seen[seed]=1;
  while(read<write){const k=queue[read++],x=k%w,y=(k/w)|0;if(x>12&&x<w-13&&y>canonicalTop+15&&y<canonicalBottom-15)inside=true;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx;if(!seen[j]&&bright(j)){seen[j]=1;queue[write++]=j;}}
  }if(inside)for(let i=0;i<write;i++)keep[queue[i]]=1;
 }
 // Keep the whole item and nearby glow; discard fragments of adjacent atlas rows.
 const distance=new Uint16Array(n);for(let i=0;i<n;i++)distance[i]=keep[i]?0:1000;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let d=distance[i];if(x)d=Math.min(d,distance[i-1]+1);if(y){d=Math.min(d,distance[i-w]+1);if(x)d=Math.min(d,distance[i-w-1]+1);if(x<w-1)d=Math.min(d,distance[i-w+1]+1);}distance[i]=d;}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;let d=distance[i];if(x<w-1)d=Math.min(d,distance[i+1]+1);if(y<h-1){d=Math.min(d,distance[i+w]+1);if(x)d=Math.min(d,distance[i+w-1]+1);if(x<w-1)d=Math.min(d,distance[i+w+1]+1);}distance[i]=d;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=y*w+x,i=k*4,m=Math.max(p[i],p[i+1],p[i+2]),base=Math.max(0,Math.min(1,(m-12)/36)),edge=Math.min(1,Math.min(x,y,w-1-x,h-1-y)/18),near=Math.max(0,Math.min(1,(34-distance[k])/10)),alpha=base*edge*edge*(3-2*edge)*near;
  if(alpha<.004){p[i+3]=0;continue;}if(base<1){p[i]=Math.min(255,p[i]/base);p[i+1]=Math.min(255,p[i+1]/base);p[i+2]=Math.min(255,p[i+2]/base);}p[i+3]=Math.round(alpha*255);
 }g.putImageData(data,0,0);return c;
}
function skinArtV594(row,tier){
 const key=row+':'+tier;if(upgradeSkinV594.art.has(key))return upgradeSkinV594.art.get(key);
 const [canonicalTop,canonicalBottom]=upgradeArtV593.row_bounds[row],top=Math.max(0,canonicalTop-20),bottom=Math.min(upgradeArtV593.height,canonicalBottom+20),left=Math.round(tier*upgradeArtV593.width/5),right=Math.round((tier+1)*upgradeArtV593.width/5),raw=skinCanvasV594(right-left,bottom-top),g=raw.getContext('2d');
 g.drawImage(upgradeAtlasV594,left,top,raw.width,raw.height,0,0,raw.width,raw.height);skinIsolateArtV594(raw,canonicalTop-top,canonicalBottom-top);
 // A genuine alpha margin lets the glow fade naturally instead of ending at a square edge.
 const pad=32,c=skinCanvasV594(raw.width+pad*2,raw.height+pad*2);c.getContext('2d').drawImage(raw,pad,pad);
 upgradeSkinV594.art.set(key,c);upgradeSkinV594.artMetrics.set(key,{width:c.width,height:c.height,padding:pad,edgeAlpha:0,source:[left,top,right-left,bottom-top],extendedSource:20,feather:18});return c;
}
function skinIconV594(group,tier){
 const key=group==='gun'||group==='blade'?'arm':group==='legs'?'feet':'shell';const cache=key+':'+tier;if(upgradeSkinV594.icons[cache])return upgradeSkinV594.icons[cache];
 const box=upgradeReferenceV594.icons[key],c=skinCanvasV594(box[2],box[3]);c.getContext('2d').drawImage(referenceImageV594,...box,0,0,c.width,c.height);skinAlphaV594(c);const q=c.getContext('2d');q.globalCompositeOperation='source-in';q.fillStyle=UPGRADE_RARITIES_V593[tier].color;q.fillRect(0,0,c.width,c.height);upgradeSkinV594.icons[cache]=c;return c;
}
function skinPaintCanvasV594(target,source){target.width=source.width;target.height=source.height;target.getContext('2d').drawImage(source,0,0);}
function skinBackgroundsV594(){
 const ref=upgradeReferenceV594,portrait=skinCanvasV594(ref.width,ref.height),p=portrait.getContext('2d');p.drawImage(referenceImageV594,0,0);
 p.fillStyle='#020106';p.fillRect(0,438,ref.width,780);p.drawImage(referenceImageV594,0,0,ref.width,446,0,0,ref.width,446);
 const landscape=skinCanvasV594(1200,550),g=landscape.getContext('2d');g.fillStyle='#020106';g.fillRect(0,0,landscape.width,landscape.height);
 g.drawImage(referenceImageV594,0,0,ref.width,215,0,0,1200,145);g.drawImage(referenceImageV594,0,1218,ref.width,318,0,350,1200,200);
 upgradeSkinV594.backgrounds=[portrait,landscape];
 const root=$('levelPanel');for(let i=0;i<2;i++){const c=document.createElement('canvas');c.className='upgradeReferenceBgV594 '+(i?'landscape':'portrait');c.setAttribute('aria-hidden','true');skinPaintCanvasV594(c,upgradeSkinV594.backgrounds[i]);root.prepend(c);}
 const header=skinCanvasV594(664,215);header.getContext('2d').drawImage(referenceImageV594,100,210,664,215,0,0,664,215);upgradeSkinV594.header=header;
}
const upgradeSkinReadyV594=Promise.all([skinLoadV594(upgradeReferenceV594.path),skinLoadV594(upgradeArtV593.path)]).then(([ref,atlas])=>{
 referenceImageV594=ref;upgradeAtlasV594=atlas;skinBackgroundsV594();upgradeSkinV594.ready=true;skinPaintActiveV594();return true;
}).catch(e=>{upgradeSkinV594.failures.push(e.message);return false;});
function skinPaintActiveV594(){
 if(!upgradeSkinV594.ready)return;
 const header=$('levelPanel').querySelector('.upgradeHeaderRefV594');if(header)skinPaintCanvasV594(header,upgradeSkinV594.header);
 for(const b of $('cards').querySelectorAll('.upgradeCardV593')){
  const row=Number(b.dataset.artRow),tier=Number(b.dataset.artTier),card=UPGRADE_CARDS_V593.find(c=>c.id===b.dataset.kind);if(!card)continue;
  skinPaintCanvasV594(b.querySelector('.upgradeFrameV594'),skinFrameV594(tier));skinPaintCanvasV594(b.querySelector('.upgradeSpriteV593'),skinArtV594(row,tier));skinPaintCanvasV594(b.querySelector('.upgradePartIconV594'),skinIconV594(card.group,tier));
 }
}
renderLevelChoices=function(isReroll=false){
 const picks=chooseLevelPicks(isReroll),cards=$('cards'),panel=$('levelPanel'),head=panel.querySelector('.levelHead');cards.innerHTML='';levelLastOffer=picks.map(p=>p.kind);
 panel.dataset.upgradeLanguage=upgradeTextV593('ko','en');head.querySelector('h2').textContent=upgradeTextV593('레벨 업','LEVEL UP');head.querySelector('p').textContent=upgradeTextV593('강화 1개 선택','CHOOSE 1 UPGRADE');
 if(!head.querySelector('.upgradeHeaderRefV594')){const c=document.createElement('canvas');c.className='upgradeHeaderRefV594';c.setAttribute('aria-hidden','true');head.prepend(c);}
 $('levelContext').textContent='Lv. '+player.level;$('levelCoach').textContent='';
 for(const p of picks){const c=p.card,r=UPGRADE_RARITIES_V593[p.tier],b=document.createElement('button');b.type='button';b.className='card upgradeCardV593';b.dataset.kind=c.id;b.dataset.rarity=r.id;b.dataset.artRow=c.row;b.dataset.artTier=p.tier;b.style.setProperty('--rarity',r.color);
  b.innerHTML=`<canvas class="upgradeFrameV594" aria-hidden="true"></canvas><div class="upgradeRarityV593">${upgradeTextV593(r.ko,r.en)}</div><div class="upgradeArtV593" aria-hidden="true"><canvas class="upgradeSpriteV593"></canvas></div><div class="upgradeNameV593">${p.title()}</div><div class="upgradeStatsV593">${upgradeLinesV593(c,p.tier).map(line=>'<div>'+line+'</div>').join('')}</div><div class="upgradePartV593"><canvas class="upgradePartIconV594" aria-hidden="true"></canvas><span>${upgradePartV593(c)}</span></div>`;
  b.setAttribute('aria-label',upgradeTextV593(r.ko,r.en)+' · '+p.title()+' · '+upgradeLinesV593(c,p.tier).join(' · '));
  b.onclick=()=>{if(!choosing||!choiceInputReady())return;p.apply();$('levelOverlay').style.display='none';choosing=false;updateHUD(true);audioCue('evolve');hapticCue('evolve');combatGrace(.20);addXP(0);};cards.appendChild(b);
 }
 updateRerollControls();$('rerollBtn').textContent=upgradeTextV593('다시 뽑기 ×','REROLL ×')+rerolls;$('rerollRow').hidden=rerolls<=0;skinPaintActiveV594();updateHUD(true);
};
// Geometric status/identity marks are presentation only. Combat, warnings and HP remain active.
drawEnemyHitLanguage=function(){};
drawThreatPriority=function(){};
drawEnemySilhouetteV165=function(){};
window.__EVOLVE_UPGRADE_REFERENCE_V594__={ready:upgradeSkinReadyV594,read:()=>({ready:upgradeSkinV594.ready,reference:upgradeReferenceV594.path,sourceBytesPreserved:true,originalItemAtlasUnchanged:true,transparentItemPadding:32,artCache:upgradeSkinV594.art.size,frameBuilds:upgradeSkinV594.builds,failures:[...upgradeSkinV594.failures],equippingCards:false,physical_Galaxy_S23_plus_tested:false})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_UPGRADE_REFERENCE_V594__.test={reference:()=>referenceImageV594,background:()=>upgradeSkinV594.backgrounds[0],frame:skinFrameV594,art:skinArtV594,artMetrics:()=>[...upgradeSkinV594.artMetrics.entries()],context:()=>({ctx,drawEnemy,normalOverlay:drawNormalEnemyOverlayV426,hitLanguage:drawEnemyHitLanguage,threat:drawThreatPriority,setGPU:value=>{gpuEnemyBatchEnabledV426=!!value&&gpuEnemyBatchReadyV426;},gpu:()=>({enabled:gpuEnemyBatchEnabledV426,ready:gpuEnemyBatchReadyV426}),draw,focus:e=>{focusEnemy=e;}})};

if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_UPGRADE_REFERENCE_V594__.test.probeGPU=function(){const original=gpuWriteInstanceV426,fx=[],uvs=new Map(Object.entries(gpuEnemyFXUVV426).map(([k,v])=>[v,k]));let body=0;gpuWriteInstanceV426=function(...args){const key=uvs.get(args[8]);if(key)fx.push(key);else body++;return original(...args);};try{visibleSimV428=-1;renderEnemyBatchV426('body');return {fx,body,ready:gpuEnemyBatchReadyV426};}finally{gpuWriteInstanceV426=original;}};
