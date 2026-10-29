// Parts-page bridge for two independent arms.
(function(){
 'use strict';
 const model=window.EVOLVE_DUAL_ARM_MODEL_V631;
 if(!model)throw new Error('Dual-arm model is missing');
 const armSlots=['arm1','arm2'],preview={key:null,src:null};
 let preferredArm='arm1';
 const isArm=id=>partsItemV523(id)?.slot==='arm';
 const itemMode=id=>window.__EVOLVE_DUAL_ARM_ART_V631__?.visualMode(id)||armItemIdsV589[id]||null;
 const text=(en,ko)=>partsTextV523(en,ko);
 function hydrate(){
  const base={...partsStateV523,worn:{...(partsStateV523.worn||{})}};
  try{
   const raw=localStorage.getItem(PARTS_KEY_V523),saved=raw?JSON.parse(raw):null;
   if(saved?.schema===1&&saved.worn&&typeof saved.worn==='object'&&Object.prototype.hasOwnProperty.call(saved.worn,'arm2'))base.worn.arm2=saved.worn.arm2;
  }catch(_){}
  partsStateV523=model.migrate(base,isArm);
  if(partsStateV523.filter==='back')partsStateV523.filter='all';
 }
 function installStyle(){
  if(document.getElementById('dualArmStyleV631'))return;
  const style=document.createElement('style');style.id='dualArmStyleV631';
  style.textContent='.partsArmNumberV631{position:absolute;right:5px;bottom:5px;z-index:4;padding:2px 4px;border-radius:3px;background:#171721dd;color:#f4dfc9;font:700 10px/1.1 system-ui,sans-serif;pointer-events:none}.partsWornV631{position:absolute;right:4px;bottom:4px;z-index:4;min-width:17px;padding:3px;border-radius:4px;background:#25544dea;color:#e5fff3;font:700 10px/1 system-ui,sans-serif;text-align:center}.partsDetailActionsV523 .dualArmActionV631{border-color:#ad7b65;background:linear-gradient(145deg,#63313b,#382332);color:#ffe0bf}';
  document.head.appendChild(style);
 }
 function slotButton(slot){
  const id=partsStateV523.worn[slot.saveKey]??null,item=partsItemV523(id),b=partsButtonV523(item,true),info=partsSlotV523(slot.catalogSlot);
  b.dataset.partSlot=slot.saveKey;b.id='partsSlot_'+slot.saveKey+'_V523';
  if(!item){const empty=document.createElement('span');empty.className='partsEmptyV523';empty.textContent='+';empty.setAttribute('aria-hidden','true');b.appendChild(empty);}
  const badge=document.createElement('span');badge.className='partsSlotBadgeV523';badge.setAttribute('aria-hidden','true');badge.innerHTML=partsGlyphV524(info.icon);b.appendChild(badge);
  const label=partsNameV523(slot);b.setAttribute('aria-label',label+' · '+(item?partsNameV523(item):text('Empty slot','빈 슬롯')));
  if(armSlots.includes(slot.id)){
   b.dataset.armSlotV631=slot.id;
   const number=document.createElement('span');number.className='partsArmNumberV631';number.setAttribute('aria-hidden','true');number.textContent=label;b.appendChild(number);
  }
  return b;
 }
 function renderSlots(){
  const left=$('partsLeftSlotsV523'),right=$('partsRightSlotsV523');if(!left||!right)return;
  left.replaceChildren();right.replaceChildren();
  model.slotLayout.forEach((slot,index)=>(index<3?left:right).appendChild(slotButton(slot)));
 }
 function refreshGrid(){
  const grid=$('partsGridV523'),filters=$('partsFiltersV523');if(!grid||!filters)return;
  const backFilter=filters.querySelector('[data-filter="back"]');if(backFilter)backFilter.remove();
  for(const b of Array.from(grid.querySelectorAll('button[data-part-id]'))){
   const item=partsItemV523(b.dataset.partId);if(!item)continue;
   if(item.slot==='back'){b.remove();continue;} // Keep owned data, not the removed slot's cards.
   if(item.slot!=='arm')continue;
   const old=b.querySelector('.partsWornV523');if(old)old.remove();
   const equipped=armSlots.filter(slot=>model.getArm(partsStateV523,slot)===item.id);
   if(equipped.length){
    const badge=document.createElement('span');badge.className='partsWornV631';badge.textContent=equipped.map(slot=>slot==='arm1'?'1':'2').join('·');badge.setAttribute('aria-hidden','true');b.appendChild(badge);
    b.setAttribute('aria-label',partsNameV523(item)+' · '+text('ARM','팔')+' · '+partsNameV523(PARTS_RANKS_V523[item.rank])+' · '+text('Equipped on ','장착 ') + equipped.map(slot=>slot==='arm1'?'1':'2').join(', '));
   }
  }
  const empty=$('partsInventoryEmptyV523');if(empty)empty.hidden=grid.querySelectorAll('button[data-part-id]').length>0;
 }
 function drawPreviewArm(g,id,side,a,size,fit,s,ox,oy){
  const mode=itemMode(id);if(!mode)return false;
  const wrist=a.wrists[side],p={x:ox+wrist[0]*s,y:oy+wrist[1]*s};
  armItemSpriteV589(g,mode,side,p,bioWeaponPreviewAngleV625,fit,1,1);return true;
 }
 function updatePreview(){
  if(!bioV625.ready||!bioV625.surface)return;
  const first=model.getArm(partsStateV523,'arm1'),second=model.getArm(partsStateV523,'arm2'),key=JSON.stringify([first,second,window.__EVOLVE_DUAL_ARM_ART_V631__?.generation||0]);
  if(preview.key!==key){
   if(!first&&!second){preview.src=bioV625.previews.bare;}
   else{
    const a=bioArtV625,size=1536,c=document.createElement('canvas');c.width=c.height=size;
    const g=c.getContext('2d'),unit=mutantBaseScaleV599,fit=Math.min(size*.75/(a.width*unit),size*.75/(a.height*unit));
    const s=unit*fit,ox=(size-a.width*s)/2-size*.05,oy=(size-a.height*s)/2;
    if(second)drawPreviewArm(g,second,1,a,size,fit,s,ox,oy);
    g.drawImage(bioV625.surface,ox,oy,a.width*s,a.height*s);
    if(first)drawPreviewArm(g,first,0,a,size,fit,s,ox,oy);
    preview.src=c.toDataURL('image/png');c.width=c.height=1;
   }
   preview.key=key;
  }
  const hero=$('partsSpecimenImgV523');if(hero&&preview.src&&hero.src!==preview.src){hero.src=preview.src;hero.removeAttribute('data-origin-v522');delete hero.dataset.origin;}
 }
 function addArmButtons(){
  const original=$('partsDetailEquipV523');if(!original||!original.parentNode)return;
  for(const slot of armSlots){
   if($('partsDetail_'+slot+'_V631'))continue;
   const b=document.createElement('button');b.type='button';b.id='partsDetail_'+slot+'_V631';b.className='dualArmActionV631';b.hidden=true;
   b.addEventListener('click',()=>applyArm(slot));original.parentNode.appendChild(b);
  }
 }
 function updateArmDetail(){
  addArmButtons();const item=partsItemV523(partsSelectedV523),arm=!!item&&item.slot==='arm',original=$('partsDetailEquipV523');
  if(original)original.hidden=arm;
  for(const slot of armSlots){const b=$('partsDetail_'+slot+'_V631');if(!b)continue;b.hidden=!arm;if(!arm)continue;
   const equipped=model.getArm(partsStateV523,slot)===item.id,label=slot==='arm1'?text('ARM 1','팔 1'):text('ARM 2','팔 2');
   b.textContent=label+' '+(equipped?text('REMOVE','해제'):text('EQUIP','장착'));b.setAttribute('aria-pressed',String(equipped));
  }
  if(arm){
   const slots=armSlots.filter(slot=>model.getArm(partsStateV523,slot)===item.id);
   homeSetTextV522('partsDetailStateV523',slots.length?text('Equipped: ','장착: ')+slots.map(slot=>slot==='arm1'?'1':'2').join(', '):text('In storage','보관 중'));
   homeSetTextV522('partsDetailSlotV523',text('ARM 1 / ARM 2','팔 1 / 팔 2'));
   const art=window.__EVOLVE_DUAL_ARM_ART_V631__,mode=itemMode(item.id),failed=art?.status(item.id)==='error';
   homeSetTextV522('partsDetailHintV523',failed?text('Choose an arm. The existing item image could not be loaded.','팔을 선택하세요. 기존 장비 이미지를 불러오지 못했습니다.'):mode?text('Choose which arm to equip or remove.','장착하거나 해제할 팔을 선택하세요.'):text('Choose an arm. This item\'s combat appearance is not yet connected.','팔을 선택하세요. 이 장비의 전투 외형은 아직 연결 중입니다.'));
  }
 }
 function applyArm(slot){
  const item=partsItemV523(partsSelectedV523);if(!item||item.slot!=='arm')return false;
  const remove=model.getArm(partsStateV523,slot)===item.id;
  partsStateV523=model.setArm(partsStateV523,slot,remove?null:item.id,isArm);
  const saved=savePartsV523();preferredArm=slot;
  playerMotionV586.attack=null;playerMotionV586.cooldown=.18;player.shoot=.18;
  renderEvolvePartsV523(true);closePartsDetailV523();
  partsToastV523(partsNameV523(item)+' · '+(slot==='arm1'?text('ARM 1','팔 1'):text('ARM 2','팔 2'))+' · '+(remove?text('Removed','해제됨'):text('Equipped','장착됨'))+(saved?'':text(' · This session only',' · 이번 실행에만 적용')));
  return true;
 }
 function selectArmSlot(e){
  const b=e.target?.closest?.('button[data-arm-slot-v631]');if(!b)return;
  e.stopImmediatePropagation();const slot=b.dataset.armSlotV631;preferredArm=slot;
  const id=model.getArm(partsStateV523,slot);if(id)openPartsDetailV523(id);else setPartsFilterV523('arm');
 }
 hydrate();installStyle();addArmButtons();
 for(const id of ['partsLeftSlotsV523','partsRightSlotsV523'])$(id)?.addEventListener('click',selectArmSlot,true);
 const baseDetail=updatePartsDetailV523;
 updatePartsDetailV523=function(...args){const out=baseDetail(...args);updateArmDetail();return out;};
 const baseBioRefresh=bioRefreshV625;
 bioRefreshV625=function(...args){const out=baseBioRefresh(...args);updatePreview();return out;};
 const baseRender=renderEvolvePartsV523;
 renderEvolvePartsV523=function(...args){
  const before=partsRenderKeyV523,out=baseRender(...args);
  if(args[0]===true||before!==partsRenderKeyV523||!$('partsSlot_arm2_V523')){renderSlots();refreshGrid();}
  updatePreview();return out;
 };
 window.__EVOLVE_DUAL_ARM_V631__={snapshot:()=>({arm1:model.getArm(partsStateV523,'arm1'),arm2:model.getArm(partsStateV523,'arm2'),preferredArm,slots:model.slotLayout.map(x=>x.id),legacyBack:partsStateV523.worn.back??null,gameRendererConnected:false})};
 if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_DUAL_ARM_V631__.test={applyArm,refreshGrid,renderSlots,updatePreview,updateArmDetail};
 renderEvolvePartsV523(true);
})();
