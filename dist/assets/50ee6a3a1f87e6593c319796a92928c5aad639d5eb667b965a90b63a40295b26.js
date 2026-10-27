/* EVOLVE M05-40: opt-in view layer for M04 DEV mock shop. NO purchase/save implementation here. */
(()=>{
'use strict';
const params=new URLSearchParams(location.search);
if(params.get('evolveMockShop')!=='1'||params.get('evolveM05UX')!=='1'||!['idonutyou.github.io','localhost','127.0.0.1'].includes(location.hostname))return;
function initialize(){
const m04=window.__EVOLVE_DEV_MOCK_UI_V616__,api=window.__EVOLVE_DEV_MOCK_STORE_V615__;
const modal=document.getElementById('m04MockModalV616');
if(!m04||!api||!modal||api.mode!=='MOCK_ONLY')return;
const panel=modal.querySelector('.m04MockPanel');if(!panel)return;
const originalTrigger=document.getElementById('m04MockTriggerV616');
const skuData={
 starter_genome_once:{details:'개발용 스타터 지원 · TEST 결정 +75, 1회 · 실제 전투 보너스 없음',group:'STARTER'},
 mutation_crystal_small:{details:'TEST 결정 +100 · 반복 가능 · 실제 유료 재화로 전환 불가',group:'TEST DECISIONS'},
 mutation_crystal_mid:{details:'TEST 결정 +300 · 반복 가능 · 실제 유료 재화로 전환 불가',group:'TEST DECISIONS'},
 appearance_unlock_01:{details:'공명 코어 발광 외형 · 캐릭터·파츠·전투 시각 효과, 능력치 변화 없음',group:'APPEARANCE'},
 season_research_pass_01:{details:'미완성 시즌 보상 · 구매 및 지급 잠금',group:'LOCKED'}
};
let mode='shop',selected=null,scrollShop=0,scrollCollection=0,wasOpen=false;
const css=document.createElement('style');css.id='m05ShopStyleV618';css.textContent=[
 '#m04MockModalV616[data-m05-ux="true"] .m04MockPanel{overscroll-behavior:contain;scrollbar-gutter:stable}',
 '#m04MockModalV616[data-m05-ux="true"] .m04MockPanel button,#m04MockModalV616[data-m05-ux="true"] .m05DetailLink{min-height:44px;touch-action:manipulation}',
 '#m05NavigationV618{display:flex;gap:8px;margin:8px 0 13px}',
 '#m05NavigationV618 button{flex:1;border-radius:10px;border:1px solid #7c688e;background:#24233a;color:#e7daf3;padding:10px 7px;font:800 13px/1.4 system-ui}',
 '#m05NavigationV618 button[aria-pressed="true"]{background:#533269;border-color:#d9aff7;color:white}',
 '.m05DetailLink{display:inline-flex;align-items:center;color:#b8edff;text-decoration:underline;font:700 12px/1.35 system-ui;padding:4px 8px;margin:4px -8px 0;border-radius:6px}',
 '.m05DetailLink:focus-visible,#m05DetailV618 button:focus-visible,#m05NavigationV618 button:focus-visible{outline:3px solid #ffda85;outline-offset:2px}',
 '#m05DetailV618{border:1px solid #655a82;border-radius:12px;background:#181a2a;padding:13px 12px;margin:8px 0}',
 '#m05DetailV618 h3{margin:8px 0;color:#ffe7fc;font:900 18px/1.35 system-ui;overflow-wrap:anywhere}',
 '#m05DetailV618 p{margin:7px 0;color:#d7d5e6;font:500 13px/1.5 system-ui;overflow-wrap:anywhere}',
 '#m05DetailV618 .m05Tag{font:900 11px system-ui;letter-spacing:.12em;color:#e7b5ff}',
 '#m05DetailV618 .m05Badge{display:inline-block;border:1px solid #85cadf;color:#aeeafa;border-radius:8px;padding:5px 9px;font:700 12px system-ui}',
 '#m05DetailV618 button{width:100%;min-height:44px;border:1px solid #a88dca;color:white;background:#523567;border-radius:9px;font:800 13px system-ui;margin:6px 0}',
 '#m05DetailV618 button:disabled{opacity:.6}',
 '#m05DetailV618 .m05Back{background:#292b39}',
 '#m05DetailV618 .m05Disclaimer{font:600 12px/1.5 system-ui;color:#a9f4de}',
 '#m05DetailV618 .m05Secondary{background:#27394a;border-color:#77b8cf}',
 '#m05CollectionStatusV618{border:1px solid #536e7b;background:#142837;border-radius:8px;padding:9px 10px;color:#d9f7fa;font:700 12px/1.45 system-ui;margin:5px 0 10px}',
 '.m05CollectionMeta{font:700 12px/1.45 system-ui;color:#b9f1ec;margin:8px 0 5px}',
 '.m05GetTheme{width:100%;min-height:44px;border:1px solid #789bba;border-radius:8px;background:#1c3446;color:#e0f8ff;font:800 12px system-ui;margin-top:8px}',
 '#m04MockModalV616[data-m05-mode="shop"] .m04CoreGallery,#m04MockModalV616[data-m05-mode="shop"] .m04CoreSectionTitle{display:none}',
 '#m04MockModalV616[data-m05-mode="collection"] .m04MockCards{display:none}',
 '#m04MockModalV616[data-m05-mode="detail"] .m04MockCards,#m04MockModalV616[data-m05-mode="detail"] .m04CoreGallery,#m04MockModalV616[data-m05-mode="detail"] .m04CoreSectionTitle{display:none}',
 '#m04MockModalV616[data-m05-ux="true"] .m04MockCard{flex-wrap:wrap}',
 '#m04MockModalV616[data-m05-ux="true"] .m04MockCard>div{flex:1 1 145px;min-width:0}',
 '#m04MockModalV616[data-m05-ux="true"] .m04MockCard button{min-width:106px}',
 '@media(max-width:360px){#m04MockModalV616[data-m05-ux="true"] .m04MockCard button{flex:1 1 100%}}'
].join('\n');document.head.appendChild(css);
function make(tag,cls,content){const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el}
function navButton(label,section){const b=make('button','',label);b.type='button';b.dataset.m05Section=section;b.setAttribute('aria-pressed',String(mode===section));b.addEventListener('click',()=>change(section));return b}
function change(next){if(!m04.isOpen()||!['shop','collection'].includes(next))return;
 if(mode==='shop')scrollShop=panel.scrollTop;
 if(mode==='collection')scrollCollection=panel.scrollTop;
 mode=next;selected=null;render();requestAnimationFrame(()=>{panel.scrollTop=next==='shop'?scrollShop:scrollCollection});
}
function openDetail(sku){if(!m04.isOpen()||!skuData[sku])return;if(mode==='shop')scrollShop=panel.scrollTop;selected=sku;mode='detail';render();panel.scrollTop=0;document.getElementById('m05DetailTitleV618')?.focus()}
function backDetail(){mode='shop';selected=null;render();requestAnimationFrame(()=>{panel.scrollTop=scrollShop;document.querySelector('.m05DetailLink[data-m05-sku="'+lastSku+'"]')?.focus()})}
let lastSku=null;
function drawDetail(list,confirmOpen){
 if(!selected)return;
 const catalog=api.catalog(),idx=catalog.findIndex(x=>x.sku===selected);
 if(idx<0)return;
 const item=catalog[idx],info=skuData[item.sku];
 let state=null;try{state=m04.read()}catch{}
 const owned=!!(item.entitlement&&state?.owned?.[item.entitlement]);
 const equipped=!!(owned&&state?.equipped?.core===item.entitlement);
 const repeatable=item.repeatLimit!==1&&item.ready;
 const previouslyGranted=!!(repeatable&&Object.values(state?.receipts||{}).some(r=>r.sku===item.sku));
 const source=list?.querySelectorAll('.m04MockCard')[idx]?.querySelector('button');
 const box=make('section','');box.id='m05DetailV618';box.dataset.sku=item.sku;
 box.dataset.owned=String(owned);box.dataset.equipped=String(equipped);
 box.setAttribute('aria-label','DEV 모의 상품 상세');
 const back=make('button','m05Back','← 상품 목록');back.type='button';
 back.addEventListener('click',()=>{lastSku=selected;backDetail()});
 box.appendChild(back);
 box.appendChild(make('div','m05Tag',info.group));
 const title=make('h3','',item.label);title.id='m05DetailTitleV618';title.tabIndex=-1;box.appendChild(title);
 box.appendChild(make('p','',info.details));
 const badge=!item.ready?'준비 중':equipped?'장착 중':owned?'보유 중':repeatable?(previouslyGranted?'반복 지급 가능':'반복 획득 가능'):'미보유';
 const status=make('span','m05Badge',badge);status.dataset.status=equipped?'equipped':owned?'owned':!item.ready?'locked':'available';
 status.setAttribute('role','status');box.appendChild(status);
 if(state)box.appendChild(make('p','','현재 TEST 결정: '+state.testCrystals.toLocaleString('ko-KR')+'개'));
 const actionLabel=!item.ready?'준비 중':owned&&item.sku==='appearance_unlock_01'?(equipped?'해제':'장착'):owned?'보유 중':previouslyGranted?'다시 모의 획득':'모의 획득';
 const action=make('button','',actionLabel);action.type='button';action.id='m05DetailActionV618';
 action.disabled=!!confirmOpen||!item.ready||!state||!source||source.disabled||(owned&&item.sku!=='appearance_unlock_01');
 action.setAttribute('aria-label',item.label+' '+actionLabel);
 if(owned&&item.sku==='appearance_unlock_01')action.setAttribute('aria-pressed',String(equipped));
 action.addEventListener('click',()=>{if(!action.disabled&&!panel.querySelector('#m04MockConfirmV617'))source?.click()});
 box.appendChild(action);
 if(owned&&item.sku==='appearance_unlock_01'){
  const go=make('button','m05Secondary','코어 컬렉션 보기');
  go.type='button';go.disabled=!!confirmOpen;go.addEventListener('click',()=>change('collection'));box.appendChild(go);
 }
 box.appendChild(make('p','m05Disclaimer','DEV MOCK ONLY · 실제 결제 없음 · 원래 게임 재화와 별개'));
 const insertBefore=list||panel.querySelector('#m04MockMessageV616');panel.insertBefore(box,insertBefore);
}
function decorateCollection(){
 const gallery=panel.querySelector('.m04CoreGallery');
 if(!gallery)return;
 let state=null;try{state=m04.read()}catch{}
 const cards=gallery.querySelectorAll('.m04CoreLook');
 let count=0;
 cards.forEach(card=>{
  const key=card.dataset.entitlement,owned=!!state?.owned?.[key],equipped=!!(owned&&state?.equipped?.core===key);
  if(owned)count++;
  card.dataset.owned=String(owned);card.dataset.equipped=String(equipped);
  const btn=card.querySelector('button');
  if(btn&&owned)btn.setAttribute('aria-label',(key==='dev_core_theme_01'?'공명 코어':'심홍 코어')+' '+(equipped?'해제':'장착'));
  else if(btn)btn.removeAttribute('aria-label');
  if(owned&&btn)btn.setAttribute('aria-pressed',String(equipped));
  if(!card.querySelector('.m05CollectionMeta')){
   const copy=make('p','m05CollectionMeta',equipped?'장착 중':owned?'획득 완료 · 장착 가능':'미보유 · 해금이 필요해');
   card.appendChild(copy);
  }
  if(key==='dev_core_theme_01'&&!owned&&!card.querySelector('.m05GetTheme')){
   const jump=make('button','m05GetTheme','공명 코어 상품 상세');
   jump.type='button';jump.addEventListener('click',()=>openDetail('appearance_unlock_01'));card.appendChild(jump);
  }
 });
 if(mode==='collection'&&!panel.querySelector('#m05CollectionStatusV618')){
  const p=make('p','', '보유 중인 코어 '+count+'/'+cards.length+'개 · 획득 후 장착하면 파츠와 전투에 발광만 적용돼.');
  p.id='m05CollectionStatusV618';p.setAttribute('role','status');
  panel.insertBefore(p,gallery);
 }
}
function decorateRows(list){if(!list)return;const catalog=api.catalog(),rows=list.querySelectorAll('.m04MockCard');
 rows.forEach((row,index)=>{const item=catalog[index];if(!item||row.querySelector('.m05DetailLink'))return;
 const link=make('a','m05DetailLink','상세 보기');link.href='#m05DetailV618';link.dataset.m05Sku=item.sku;
 link.addEventListener('click',e=>{e.preventDefault();openDetail(item.sku)});
 row.querySelector('div')?.appendChild(link);
 });
}
function render(){if(!m04.isOpen())return;modal.dataset.m05Ux='true';modal.dataset.m05Mode=mode;
 const list=panel.querySelector('.m04MockCards');if(!list)return;
 if(!panel.querySelector('#m05NavigationV618')){
  const nav=make('nav');nav.id='m05NavigationV618';nav.setAttribute('aria-label','개발용 상점 화면');
  nav.append(navButton('모의 상점','shop'),navButton('코어 컬렉션','collection'));
  panel.insertBefore(nav,panel.querySelector('.m04MockBalance')?.nextSibling||list);
 }
 panel.querySelectorAll('#m05NavigationV618 button').forEach(b=>b.setAttribute('aria-pressed',String(mode===b.dataset.m05Section)));
 decorateRows(list);
 decorateCollection();
 if(mode!=='collection')panel.querySelector('#m05CollectionStatusV618')?.remove();
 const detail=panel.querySelector('#m05DetailV618');if(mode==='detail'){if(!detail)drawDetail(list,!!panel.querySelector('#m04MockConfirmV617'))}else detail?.remove();
 const confirmation=panel.querySelector('#m04MockConfirmV617');
 if(confirmation){confirmation.style.display='block';const cancel=confirmation.querySelector('button');if(cancel)cancel.focus()}
}
const observer=new MutationObserver(()=>{if(m04.isOpen()){if(!wasOpen){mode='shop';selected=null;scrollShop=0;scrollCollection=0;wasOpen=true}render()}else{wasOpen=false;mode='shop';selected=null}});
observer.observe(modal,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true});
originalTrigger?.addEventListener('click',()=>requestAnimationFrame(render));
modal.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode==='detail'&&!panel.querySelector('#m04MockConfirmV617')&&m04.isOpen()){e.stopImmediatePropagation();e.preventDefault();lastSku=selected;backDetail()}},true);
window.__EVOLVE_DEV_M05_UI_V618__=Object.freeze({mode:'DEV_UI_ONLY',enabled:true,current:()=>mode,openDetail,go:change});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
