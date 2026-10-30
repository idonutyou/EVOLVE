/* EVOLVE DEX01 - isolated encyclopedia UI; no game state writes. */
(()=>{
'use strict';
const CATEGORIES=[['core','코어'],['parts','파츠'],['monsters','몬스터'],['titans','타이탄']];
const CORES=[{"id":"basic_red","name":"붉은 육질 코어","group":"기본","description":"뜨거운 생체 조직으로 이루어진 기본 코어. 안정적이고 강인한 생명력의 근원체.","rarity":"basic","image":"core_alpha/core_01.png"},{"id":"basic_purple","name":"보라 혈관 코어","group":"기본","description":"선명한 혈관이 드러난 변이형 코어. 강력한 생체 흐름과 빠른 재생 능력.","rarity":"basic","image":"core_alpha/core_02.png"},{"id":"basic_blue","name":"푸른 에너지 코어","group":"기본","description":"불안정한 에너지가 응축된 코어. 내부 생체 에너지가 지속적으로 순환.","rarity":"basic","image":"core_alpha/core_03.png"},{"id":"basic_green","name":"녹색 독성 코어","group":"기본","description":"부식성 체액으로 채워진 코어. 독성 물질이 끊임없이 움직임.","rarity":"basic","image":"core_alpha/core_04.png"},{"id":"basic_bone","name":"창백한 골격 코어","group":"기본","description":"뼈와 유사한 생체 구조로 감싸진 코어. 생명 에너지를 보호.","rarity":"basic","image":"core_alpha/core_05.png"},{"id":"basic_dark","name":"어둠의 변종 코어","group":"기본","description":"불안정한 변이로 태어난 코어. 여러 개의 생체 구체가 융합.","rarity":"basic","image":"core_alpha/core_06.png"},{"id":"premium_gold","name":"황금의 로열 코어","group":"프리미엄","description":"고귀한 황금 생체 조직으로 구성된 코어.","rarity":"premium","image":"core_alpha/core_07.png"},{"id":"premium_abyss","name":"어비스 바이올렛 코어","group":"프리미엄","description":"심연의 힘이 응축된 코어. 짙은 보랏빛 생체 조직.","rarity":"premium","image":"core_alpha/core_08.png"},{"id":"premium_pearl","name":"펄 셀레스티얼 코어","group":"프리미엄","description":"순수한 빛의 생체 결정이 담긴 코어.","rarity":"premium","image":"core_alpha/core_09.png"},{"id":"premium_emerald","name":"에메랄드 베놈 코어","group":"프리미엄","description":"맹독이 주입된 에메랄드 생체 코어.","rarity":"premium","image":"core_alpha/core_10.png"},{"id":"premium_lava","name":"라바 옵시디언 코어","group":"프리미엄","description":"화산의 마그마가 응축된 코어.","rarity":"premium","image":"core_alpha/core_11.png"},{"id":"premium_rainbow","name":"레인보우 뮤테이션 코어","group":"프리미엄","description":"다중 변이로 태어난 희귀한 코어.","rarity":"premium","image":"core_alpha/core_12.png"}];
const SLOT_LABEL={arm:'팔1 / 팔2',head:'머리',skin:'코어 외피',legs:'발',back:'등(기존 데이터)',tail:'꼬리'};
const SOURCE_KIND={core:'코어',parts:'장비',monsters:'일반 몬스터',titans:'타이탄'};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={tab:'core',selected:null,ready:false,model:{core:[],parts:[],monsters:[],titans:[]},listeners:false,restoreFocus:null};
const ENEMY_IMAGE_KEYS={crawler:'enemy/crawler',runner:'enemy/runner',brute:'enemy/brute',spitter:'enemy/spitter',warden:'enemy/warden',froststalker:'enemy/frost_stalker',symbiote:'enemy/symbiote',embermaw:'enemy/embermaw'};
const TITAN_IMAGE_KEYS={'boss:FROST TITAN':'boss/frost_titan','boss:ABERRANT TITAN':'boss/aberrant_titan','boss:PYRE TITAN':'boss/pyre_titan','boss:ORIGIN COLOSSUS':'boss/origin_colossus','boss:ABYSS MATRIARCH':'boss/abyss_matriarch','boss:BIO TITAN':'boss/bio_titan'};
const TITAN_NAME_ALIASES={'boss:ABERRANT TITAN':'VENOM TITAN','boss:ABYSS MATRIARCH':'VOID TITAN'};
const TITAN_EXTRA=[['boss:BIO TITAN','BIO TITAN','대형 생체 포식자 · 기존 BIO TITAN 데이터와 이미지']];
const KNOWN_IMAGE=/^assets\/[0-9a-f]{64}\.(?:webp|png|jpe?g)$/;
const CORE_FEATURES={basic_red:'안정적인 생체 조직과 강인한 생명력',basic_purple:'발달한 혈관과 빠른 생체 재생',basic_blue:'몸속을 순환하는 푸른 에너지',basic_green:'부식성 체액과 독성 분비',basic_bone:'골격형 외피로 보호되는 내부 에너지',basic_dark:'여러 생체 구체가 융합된 불안정한 변이',premium_gold:'황금 생체 조직과 강한 존재감',premium_abyss:'심연의 힘과 깊은 보랏빛 발광',premium_pearl:'투명한 결정질과 부드러운 빛',premium_emerald:'맹독을 품은 녹색 생체 조직',premium_lava:'고열 마그마가 응축된 몸체',premium_rainbow:'다양한 생체 에너지가 섞인 다중 변이'};
const RARITY_KO={common:'일반',rare:'희귀',epic:'영웅',legendary:'전설',mythic:'신화',basic:'기본',premium:'프리미엄'};
const KNOWN_PART_ART={'parts:legs':'assets/632e378f81b2d63c65baad81d30ed405b75462e3027af78800ddce2e266160e2.png','parts:back':'assets/198d9df4f803746333cd78058b0d5950b325f8336fad2789c03a36bf232bad77.png'};
const ENEMY_INFO={
 crawler:['무리 지어 접근하며 양쪽 측면에서 압박','군집 접근 · 측면 포위'],
 runner:['측면 돌격으로 접근하고 체력이 낮은 대상을 추적','예고 후 돌진 · 추격'],
 brute:['큰 피해를 주는 근거리 내려찍기','공격 범위 예고 후 강타'],
 spitter:['산성 투사체를 퍼뜨리며 산성 표식을 남김','원거리 산성탄 · 산성 표식'],
 warden:['보호막으로 주변 몬스터를 지원','보호막 · 배리어 파동'],
 froststalker:['빙결 투사체와 사전 예고되는 냉기 광선','원거리 냉기탄 · 빙결 광선'],
 symbiote:['다른 몬스터에게 재생 연결을 제공','주변 아군 회복 · 재생 연결'],
 embermaw:['고열 돌진 후 바닥에 용암 흔적을 남김','화염 돌진 · 용암 궤적']
};
const BOSS_INFO={
 'boss:FROST TITAN':['극저온 영역을 지배하는 빙결형 타이탄','냉기·빙결'],
 'boss:ABERRANT TITAN':['독성 축적과 부식으로 압박하는 침식형 타이탄','독성·부식'],
 'boss:PYRE TITAN':['고열을 사용하는 화염형 타이탄','화염'],
 'boss:ORIGIN COLOSSUS':['기존 게임에 등록된 거대 보스','거대 보스'],
 'boss:ABYSS MATRIARCH':['심연 계열 생물로 구상된 보스','심연'],
 'boss:BIO TITAN':['재생과 포식을 활용하는 생체형 타이탄','포식·재생']
};

const MONSTER_ROSTER_V593=[{"id":"crawler","type":"crawler","name":"크롤러","en":"CRAWLER","group":"일반","unlock":null},{"id":"runner","type":"runner","name":"러너","en":"RUNNER","group":"일반","unlock":null},{"id":"brute","type":"brute","name":"브루트","en":"BRUTE","group":"일반","unlock":null},{"id":"spitter","type":"spitter","name":"스피터","en":"SPITTER","group":"일반","unlock":null},{"id":"warden","type":"warden","name":"워든","en":"WARDEN","group":"일반","unlock":null},{"id":"froststalker","type":"froststalker","name":"프로스트 스토커","en":"FROST STALKER","group":"일반","unlock":null},{"id":"symbiote","type":"symbiote","name":"심비오트","en":"SYMBIOTE","group":"일반","unlock":null},{"id":"embermaw","type":"embermaw","name":"엠버모","en":"EMBERMAW","group":"일반","unlock":null},{"id":"ripper","type":"ripper","name":"리퍼","en":"RIPPER","group":"신규","unlock":4,"combatType":"runner"},{"id":"mauler","type":"mauler","name":"파쇄자","en":"MAULER","group":"신규","unlock":7,"combatType":"brute"},{"id":"bileback","type":"bileback","name":"독낭수","en":"BILEBACK","group":"신규","unlock":9,"combatType":"spitter"},{"id":"legacy_crawler","type":"crawler","name":"크롤러 · 변형","en":"CRAWLER · LEGACY","group":"변형","unlock":null},{"id":"legacy_warden","type":"warden","name":"워든 · 변형","en":"WARDEN · LEGACY","group":"변형","unlock":null},{"id":"alpha","type":"brute","name":"알파 브루트","en":"ALPHA BRUTE","group":"정예","unlock":null},{"id":"sentinel","type":"spitter","name":"타이탄 센티넬","en":"TITAN SENTINEL","group":"정예","unlock":null},{"id":"hunter","type":"runner","name":"게놈 사냥꾼","en":"GENOME HUNTER","group":"정예","unlock":null},{"id":"omega","type":"brute","name":"오메가 사냥꾼","en":"OMEGA HUNTER","group":"정예","unlock":null},{"id":"nemesis_brute","type":"brute","name":"네메시스 · 근접","en":"NEMESIS · BRUTE","group":"정예","unlock":null},{"id":"nemesis_spitter","type":"spitter","name":"네메시스 · 원거리","en":"NEMESIS · SPITTER","group":"정예","unlock":null}];
const NEW_MONSTER_IMAGE_V577={"ripper":"monster_alpha/ripper.png","mauler":"monster_alpha/mauler.png","bileback":"monster_alpha/bileback.png","legacy_crawler":"monster_alpha/legacy_crawler.png","legacy_warden":"monster_alpha/legacy_warden.png"};
ENEMY_INFO["ripper"]=["빠른 측면 접근형 변종", "빠르게 돌진 · 러너 계열"];
ENEMY_INFO["mauler"]=["높은 체력과 강한 근접 공격을 가진 변종", "강타 · 브루트 계열"];
ENEMY_INFO["bileback"]=["독성 분비를 활용하는 원거리 변종", "산성 투사체 · 스피터 계열"];
ENEMY_INFO["legacy_crawler"]=["크롤러의 이전 등록 외형", "크롤러 계열 · 기존 모션"];
ENEMY_INFO["legacy_warden"]=["워든의 이전 등록 외형", "워든 계열 · 기존 모션"];

function createModel(input={}){
 const codex=input.codex||{}, parts=Array.isArray(input.parts)?input.parts:[];
 const seen=new Set(Array.isArray(input.seen)?input.seen:[]);
 const assets=input.assets&&typeof input.assets==='object'?input.assets:{};
 const resolve=(key)=>{const val=assets[key]||KNOWN_PART_ART[key];return typeof val==='string'&&(KNOWN_IMAGE.test(val)||val.startsWith('data:image/'))?val:null;};
 const record=(id,name,description,category,more={})=>({id:String(id),name:String(name),description:String(description||''),category,seen:seen.has(id),image:null,details:[],...more});
 const core=CORES.map(c=>record(c.id,c.name,c.description,'core',{
  group:c.group,rarity:c.rarity,image:c.image,
  details:[['분류',c.group+' 바이오 코어'],['특징',CORE_FEATURES[c.id]||c.description],['외형','업로드 원본 시안']]
 }));
 const itemParts=parts.map(p=>{
  const group=SLOT_LABEL[p.slot]||p.slot||'파츠';
  const desc=(p.en||'')+(p.en?' · ':'')+'기존 장비 카탈로그 등록 파츠';
  return record('part:'+p.id,p.ko||p.en||p.id,desc,'parts',{
   group, rarity:p.rank||'',assetKey:p.art||'',image:resolve(p.art),sourceId:p.id,seen:true,
   details:[['장착 부위',group],['희귀도',RARITY_KO[p.rank]||p.rank||'미등록'],['원문 이름',p.en||'미등록'],['효과','기존 장비 카탈로그에 상세 효과 미등록'],['획득처','기존 장비 카탈로그에 정보 미등록']]
  });
 });
 const observed=Array.isArray(codex.ENEMIES)?codex.ENEMIES:[];
 const knownIds=new Set(observed.map(p=>String(p[0]).replace(/^enemy:/,'')));
 const monsters=MONSTER_ROSTER_V593.filter(spec=>{
   // Current runtime source is authoritative for the 8 base species;
   // additional types come from the game's V593 specimen roster.
   return spec.group!=='일반'||knownIds.has(spec.id);
 }).map(spec=>{
   const key=ENEMY_IMAGE_KEYS[spec.type];
   const info=ENEMY_INFO[spec.id]||ENEMY_INFO[spec.type]||['기존 데이터 설명 미등록','미등록'];
   const art=NEW_MONSTER_IMAGE_V577[spec.id]||resolve(key);
   const isShared=spec.group==='정예';
   const id='enemy:'+spec.id;
   const desc=spec.group==='신규'?info[0]:spec.group==='정예'?`${spec.name} · ${spec.type} 전투 계열의 정예 개체`:info[0];
   return record(id,spec.name,desc,'monsters',{
     group:spec.group+' 몬스터',sourceId:id,assetKey:key||'',image:art,
     details:[['분류',spec.group],['영문명',spec.en],['전투 계열',(spec.combatType||spec.type).toUpperCase()],
       ['행동',info[1]],
       ...(spec.unlock?[['등장 시작',`${spec.unlock}스테이지부터 선택 가능 (엔진 등록 기준)`]]:[]),
       ...(isShared?[['외형','기본종 이미지 공유 · 정예 전용 개별 일러스트 미등록']]:[])]
   });
 });
 const existing=Array.isArray(codex.BOSSES)?codex.BOSSES.filter(p=>String(p[0]).startsWith('boss:')):[];
 const ids=new Set(existing.map(p=>p[0]));const all=existing.concat(TITAN_EXTRA.filter(p=>!ids.has(p[0])));
 const titans=all.map(p=>{
  const info=BOSS_INFO[p[0]]||[p[2]||'등록된 보스','미등록'];
  return record(p[0],TITAN_NAME_ALIASES[p[0]]||p[1],info[0],'titans',{
   group:'타이탄',sourceId:p[0],sourceName:p[1],assetKey:TITAN_IMAGE_KEYS[p[0]]||'',image:resolve(TITAN_IMAGE_KEYS[p[0]]),
   details:[['분류','타이탄 / 보스'],['타입',info[1]],['원본 데이터명',p[1]],['전투 콘셉트',info[0]],['주요 스킬','현재 도감 데이터에 상세 기술 미등록'],['페이즈 특징','현재 도감 데이터에 세부 페이즈 미등록']]
  });
 });
 return {core,parts:itemParts,monsters,titans};
}
function header(){
 const buttons=CATEGORIES.map(([id,name])=>`<button type="button" role="tab" data-dex-tab="${id}" id="dex01-tab-${id}" aria-controls="dex01-list" aria-selected="${String(state.tab===id)}" tabindex="${state.tab===id?'0':'-1'}" class="dex01Tab ${state.tab===id?'is-active':''}">${name} <span class="dex01Count">${state.model[id].length}</span></button>`).join('');
 return `<div class="dex01" data-dex01><div class="dex01Intro"><span>EVOLVE / BIOLOGICAL ARCHIVE</span><small>발견한 생체 기록 · 코어 · 파츠 · 몬스터 · 타이탄</small></div><nav class="dex01Tabs" role="tablist" aria-label="도감 분류">${buttons}</nav><div id="dex01-list" class="dex01List" role="tabpanel" aria-labelledby="dex01-tab-${state.tab}"></div><div class="dex01Detail" data-dex-detail hidden></div></div>`;
}
function card(entry,index){
 const kind=entry.category, premium=entry.rarity==='premium';
 const avatar=entry.image?`<img src="${esc(entry.image)}" alt="${esc(entry.name)}" loading="lazy">`:`<span class="dex01ArtPlaceholder" aria-hidden="true">${kind==='core'?'◉':kind==='parts'?'⌬':kind==='monsters'?'✦':'◆'}</span>`;
 return `<button class="dex01Card" type="button" data-dex-card="${esc(entry.id)}" aria-label="${esc(entry.name)} 상세 정보"><span class="dex01CardArt ${premium?'premium':''}">${avatar}</span><span class="dex01CardNo">${String(index+1).padStart(2,'0')}</span><span class="dex01CardName">${esc(entry.name)}</span><span class="dex01CardGroup">${esc(entry.group||SOURCE_KIND[kind])}</span></button>`;
}
function renderList(){
 const root=document.querySelector('#codexContent .dex01');if(!root)return;
 const list=root.querySelector('#dex01-list'),values=state.model[state.tab];
 root.dataset.category=state.tab;
 root.querySelectorAll('[data-dex-tab]').forEach(b=>{const selected=b.dataset.dexTab===state.tab;b.classList.toggle('is-active',selected);b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
 list.setAttribute('aria-labelledby','dex01-tab-'+state.tab);
 const name=CATEGORIES.find(x=>x[0]===state.tab)?.[1]||'';
 const groupCards=(items)=>`<div class="dex01Grid">${items.map((item,idx)=>card(item,values.indexOf(item))).join('')}</div>`;
 if(!values.length){list.innerHTML='<p class="dex01Empty">등록된 항목이 없습니다.</p>';}
 else if(state.tab==='parts'||state.tab==='core'||state.tab==='monsters'){
  const groups=[...new Set(values.map(x=>x.group||'기타'))];
  list.innerHTML=`<div class="dex01SectionHead"><strong>${esc(name)}</strong><small>${values.length}개 항목</small></div>`+groups.map(group=>`<section class="dex01Group" aria-label="${esc(group)}"><h3>${esc(group)} <small>${values.filter(x=>x.group===group).length}</small></h3>${groupCards(values.filter(x=>x.group===group))}</section>`).join('');
 }else{list.innerHTML=`<div class="dex01SectionHead"><strong>${esc(name)}</strong><small>${values.length}개 항목</small></div>${groupCards(values)}`;}
 const summary=document.getElementById('codexSummary');if(summary){summary.setAttribute('aria-live','polite');summary.textContent= `${name} · ${values.length}종 · 항목을 터치하면 상세 정보를 볼 수 있습니다.`;}
}
function render(input={}){
 state.model=createModel(input);
 const content=document.getElementById('codexContent'),panel=document.getElementById('codexPanel');if(!content||!panel)return false;
 const title=panel.querySelector('.codexTop h2');if(title)title.textContent='생체 도감';
 closeDetail();content.innerHTML=header();renderList();state.ready=true;
 if(!state.listeners)bindEvents(content);
 return true;
}
function bindEvents(content){
 state.listeners=true;
 content.addEventListener('click',e=>{
   const tab=e.target.closest('[data-dex-tab]');if(tab){closeDetail();if(!CATEGORIES.some(x=>x[0]===tab.dataset.dexTab))return;state.tab=tab.dataset.dexTab;renderList();return;}
   const card=e.target.closest('[data-dex-card]');if(card){const item=state.model[state.tab].find(x=>x.id===card.dataset.dexCard);if(item)openDetail(item,card);return;}
   if(e.target.closest('[data-dex-close]'))closeDetail();
   if(e.target.matches('[data-dex-detail]'))closeDetail();
 });
 content.addEventListener('keydown',e=>{
   if(e.key==='Escape'){closeDetail();return;}
   if(e.key==='Tab'){const d=document.querySelector('#codexContent [data-dex-detail]');if(d&&!d.hidden){const buttons=Array.from(d.querySelectorAll('button'));if(buttons.length){const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}}
   const b=e.target.closest('[data-dex-tab]');if(b&&['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const n=CATEGORIES.findIndex(x=>x[0]===state.tab);const idx=e.key==='Home'?0:e.key==='End'?CATEGORIES.length-1:(n+(e.key==='ArrowRight'?1:-1)+CATEGORIES.length)%CATEGORIES.length;state.tab=CATEGORIES[idx][0];renderList();content.querySelector('[data-dex-tab="'+state.tab+'"]').focus();}
 });
}
function openDetail(item,from){
 state.restoreFocus=from;
 const root=document.querySelector('#codexContent .dex01'),box=root?.querySelector('[data-dex-detail]');if(!box)return;
 const name=esc(item.name),group=esc(item.group||SOURCE_KIND[item.category]);
 const avatar=item.image?`<img src="${esc(item.image)}" alt="${name}" loading="eager">`:`<span class="dex01ArtPlaceholder" aria-hidden="true">◉</span><span class="dex01ArtSoon">게임 원본 이미지 없음</span>`;
 const facts=Array.isArray(item.details)&&item.details.length?item.details:[['분류',item.group||SOURCE_KIND[item.category]]];
 const scaleInset=item.image?`<span class="dex01ScaleInset"><img src="${esc(item.image)}" alt="${name} 축소 비교"><small>스케일 참고</small></span>`:'';
 const factHTML=facts.map(row=>`<span>${esc(row[0])}</span><b>${esc(row[1])}</b>`).join('');
 box.innerHTML=`<div class="dex01DetailSurface" role="dialog" aria-modal="true" aria-labelledby="dex01-detail-heading"><button type="button" data-dex-close class="dex01Close" aria-label="상세 닫기">×</button><div class="dex01DetailArt">${avatar}${scaleInset}</div><span class="dex01Eyebrow">${group}</span><h3 id="dex01-detail-heading">${name}</h3><p>${esc(item.description)}</p><div class="dex01Facts">${factHTML}</div><button type="button" data-dex-close class="dex01Done">닫기</button></div>`;
 box.hidden=false;box.querySelector('.dex01Close')?.focus();
}
function closeDetail(){const box=document.querySelector('#codexContent [data-dex-detail]');if(!box||box.hidden)return;box.hidden=true;box.replaceChildren();state.restoreFocus?.focus?.();state.restoreFocus=null;}
window.EVOLVE_DEX01={version:'DEX-ALPHA-19-20261031',render,createModel,getState:()=>({tab:state.tab,counts:Object.fromEntries(CATEGORIES.map(([id])=>[id,state.model[id].length])),artReady:Object.fromEntries(CATEGORIES.map(([id])=>[id,state.model[id].filter(x=>!!x.image).length]))})};
})();


/* DEX bridge: use immutable catalog snapshot from unchanged production engine. */
const DEX_LIVE_PARTS=[
 {id:'arm_cannon',slot:'arm',ko:'생체 쌍포',en:'BIO CANNON',rank:'legendary',art:'capstone_apex/rail_organ'},
 {id:'arm_blades',slot:'arm',ko:'절단 쌍날',en:'RENDING BLADES',rank:'epic',art:'mutation_parts/arm_l3'},
 {id:'arm_lances',slot:'arm',ko:'관통 쌍창',en:'IMPALER LANCES',rank:'rare',art:'capstone_apex/execution_spine'},
 {id:'arm_lash',slot:'arm',ko:'촉수 쌍편',en:'TENDRIL LASH',rank:'epic',art:'mutation_parts/tail_l2'},
 {id:'head_sensor',slot:'head',ko:'감각 갑각',en:'SENSORY PLATE',rank:'rare',art:'mutation_parts/mouth_l1'},
 {id:'head_fang',slot:'head',ko:'치열 갑각',en:'FANGED PLATE',rank:'epic',art:'mutation_parts/mouth_l3'},
 {id:'head_crown',slot:'head',ko:'군체 두관',en:'BROOD CROWN',rank:'legendary',art:'mutation_parts/mouth_l5'},
 {id:'skin_bastion',slot:'skin',ko:'중추 외피',en:'CORE CARAPACE',rank:'epic',art:'mutation_parts/core_l3'},
 {id:'skin_scale',slot:'skin',ko:'분절 외피',en:'SEGMENTED SKIN',rank:'common',art:'mutation_parts/core_l1'},
 {id:'skin_reactor',slot:'skin',ko:'융합 외피',en:'FUSED CARAPACE',rank:'legendary',art:'mutation_parts/core_l5'},
 {id:'legs_phase',slot:'legs',ko:'위상 관절',en:'PHASE JOINTS',rank:'rare',art:'parts:legs'},
 {id:'legs_chitin',slot:'legs',ko:'갑각 관절',en:'CHITIN JOINTS',rank:'common',art:'parts:legs'},
 {id:'legs_rush',slot:'legs',ko:'질주 관절',en:'RUSH JOINTS',rank:'epic',art:'parts:legs'},
 {id:'back_neural',slot:'back',ko:'신경 날개',en:'NEURAL WINGS',rank:'epic',art:'parts:back'},
 {id:'back_membrane',slot:'back',ko:'생체 익막',en:'BIO MEMBRANE',rank:'common',art:'parts:back'},
 {id:'back_synapse',slot:'back',ko:'시냅스 익막',en:'SYNAPSE WINGS',rank:'legendary',art:'parts:back'},
 {id:'tail_spine',slot:'tail',ko:'가시 후갑',en:'SPINED SHEATH',rank:'epic',art:'mutation_parts/tail_l3'},
 {id:'tail_segment',slot:'tail',ko:'분절 후갑',en:'SEGMENT SHEATH',rank:'common',art:'mutation_parts/tail_l1'},
 {id:'tail_edge',slot:'tail',ko:'칼날 후갑',en:'BLADED SHEATH',rank:'rare',art:'mutation_parts/tail_l2'},
 {id:'tail_crescent',slot:'tail',ko:'초승 후갑',en:'CRESCENT SHEATH',rank:'legendary',art:'mutation_parts/tail_l5'}
];
const DEX_LIVE_CODEX={
  MUTATIONS:[
    ['mutation:arm','CANNON ARM','Rapid-fire biological artillery organ'],
    ['mutation:mouth','ACID MOUTH','Acid projectiles that slow enemies'],
    ['mutation:tail','SPIKE TAIL','Close-range sweeping slash organ'],
    ['mutation:wing','RAZOR WING','Orbiting bio-blades with multiple hits'],
    ['mutation:leg','CRUSH LEG','Shockwave strikes focused on stagger']
  ],
  EVOLUTIONS:[],
  EVOS:[],
  APEX_FUSIONS:[],
  S:[],
  ASCENSIONS:[
    ['ascension:perfect','PERFECT ADAPTATION','PRIME CELL ultimate adaptation'],
    ['ascension:blade','BLADE SERAPH','RAZORLING ultimate adaptation'],
    ['ascension:plague','PLAGUE WYRM','ACID WHELP ultimate adaptation'],
    ['ascension:siege','SIEGE ORGANISM','FORGE SPAWN ultimate adaptation'],
    ['ascension:blackSun','BLACK SUN','ABYSS LARVA ultimate adaptation']
  ],
  RELICS:[
    ['relic:lens','VORACIOUS LENS','Pickup range and DNA efficiency'],
    ['relic:gland','SERRATED GLAND','Tail and overall damage boost'],
    ['relic:sac','THERMAL SAC','Damage and maximum HP'],
    ['relic:node','CRYO NODE','Armor and movement speed'],
    ['relic:shard','NEURAL SHARD','Attack cadence and movement speed boost']
  ],
  BIO_ORGANS:[
    ['organ:predatorFang','PREDATOR FANG','Bonus damage against elites and TITANs'],
    ['organ:siegeLobe','SIEGE LOBE','Increased ARM attack damage'],
    ['organ:venomSack','VENOM SACK','Increased ACID attack damage'],
    ['organ:razorTendon','RAZOR TENDON','Increased TAIL attack damage'],
    ['organ:reactiveShell','REACTIVE SHELL','Reduced damage taken'],
    ['organ:regenMesh','REGEN MESH','Continuous HP regeneration'],
    ['organ:phaseMuscle','PHASE MUSCLE','Faster dash recharge'],
    ['organ:absorbCilia','ABSORPTION CILIA','Increased pickup range'],
    ['organ:impactMarrow','IMPACT MARROW','ALPHA BRUTE signature organ'],
    ['organ:omegaBladder','OMEGA BLADDER','OMEGA SPITTER signature organ'],
    ['organ:titanHeart','TITAN HEART','TITAN signature organ'],
    ['organ:originNucleus','ORIGIN NUCLEUS','ORIGIN COLOSSUS signature organ'],
    ['organ:abyssEye','ABYSS EYE','ABYSS MATRIARCH signature organ']
  ],
  ENEMIES:[
    ['enemy:crawler','CRAWLER','Swarm pressure · flanking waves from both sides'],
    ['enemy:runner','RUNNER','Flanking assault · telegraphed charge · chases low-HP targets'],
    ['enemy:brute','BRUTE','Telegraphed close-range slam with heavy area damage'],
    ['enemy:spitter','SPITTER','Ranged · spreading acid shots + periodic ACID MARK'],
    ['enemy:warden','WARDEN','Shield · protects nearby units + periodic BARRIER PULSE'],
    ['enemy:froststalker','FROST STALKER','Slow · cryo shots + telegraphed freezing beam'],
    ['enemy:symbiote','SYMBIOTE','Heal · supports nearby units with a regenerative tether'],
    ['enemy:embermaw','EMBERMAW','Inferno charge · leaves a molten trail']
  ],
  BOSSES:[
    ['elite:alpha','ALPHA BRUTE','First elite predator'],
    ['elite:omega','OMEGA SPITTER','Toxic artillery elite'],
    ['boss:FROST TITAN','FROST TITAN','Final CRYO organism'],
    ['boss:ABERRANT TITAN','ABERRANT TITAN','Final GENE organism'],
    ['boss:PYRE TITAN','PYRE TITAN','Final INFERNO organism'],
    ['boss:ORIGIN COLOSSUS','ORIGIN COLOSSUS','Major boss every 5 stages'],
    ['boss:ABYSS MATRIARCH','ABYSS MATRIARCH','OMEGA boss every 10 stages']
  ],
  BOSS_COUNTERS:[
    ['bossCounter:prism','PRISM CARAPACE','Countermeasure against ARM / SUN LANCE'],
    ['bossCounter:brood','DISPERSAL BROOD','Countermeasure against area blasts / BROODSTORM'],
    ['bossCounter:purify','PURIFIER PULSE','Countermeasure against ACID / PLAGUE'],
    ['bossCounter:execution','EXECUTION DENIAL','Countermeasure against TAIL / RED REAPER'],
    ['bossCounter:null','NULL FIELD','Countermeasure against DASH / VOID CARAPACE']
  ],
  COMBAT_SKILL:[
    ['skill:evasion','PERFECT EVASION','Enter a danger zone, then escape before impact to charge COUNTER'],
    ['skill:counterbreak','COUNTER BREAK','Trigger 3 PERFECT EVASIONS to expose an enemy bio-core for 3 seconds'],
    ['combat:focus','FOCUS TARGET','Tap an enemy to prioritize it for auto-attacks'],
    ['combat:waves','TACTICAL WAVES','Quickly clear timed enemy groups for bonus DNA and PREDATION'],
    ['combat:stagger','STAGGER','Repeated heavy hits briefly interrupt normal enemies']
  ],
  NEMESIS:[
    ['nemesis:memory','NEMESIS MEMORY','An elite or boss that ended your run returns stronger next run']
  ],
  MEMORY_ARCHIVE:[
    ['memory:arm','BALLISTIC MEMORY','Defeat an ARM-adapted Nemesis to obtain'],
    ['memory:mouth','CORROSIVE MEMORY','Defeat an ACID-adapted Nemesis to obtain'],
    ['memory:tail','RAZOR MEMORY','Defeat a TAIL-adapted Nemesis to obtain'],
    ['memory:core','CORE MEMORY','Defeat a CORE-adapted Nemesis to obtain'],
    ['memory:speed','HUNTER MEMORY','Defeat a HASTE-adapted Nemesis to obtain']
  ],
  ELITE_VARIANTS:[
    ['eliteAffix:ravager','RAVAGER','Elite variant with high speed and damage'],
    ['eliteAffix:bulwark','BULWARK','Elite variant with high HP and damage reduction'],
    ['eliteAffix:regenerative','REGENERATIVE','Elite variant with continuous regeneration']
  ]
};
const DEX_LIVE_ASSETS={"pickups/xp_atlas_v415":"assets/a0a4b01ea24d65bee4dee871dfa2b2c34ec62074661dd4be88f06f9847f62ff7.jpg","floor_decals/acid_puddle_large":"assets/3dd6cf7f2e05ecf4337ed38e77af9b64abea89363658fdc4480bfd47fc1c8ba8.webp","floor_decals/acid_puddle_small":"assets/5ffaf1de369136e174d07a8833fe843eeb3a3a4907b174612d704249b717f865.webp","floor_decals/biohazard_sign":"assets/dbedfbdb6f2e3e69064e9bebe46b40c503069d8d97c695f12237593f8285092d.webp","floor_decals/floor_containment_clean":"assets/507606872115245e5e758a5bc4a96151bc401ac7d0d595aa6e3d572b59005c41.webp","floor_decals/floor_containment_cracked":"assets/a7fb2ce6fd7304f66c82571a3adda0dc2ba6567fa00611c31a14383e8605f14e.webp","floor_decals/floor_fan":"assets/a26597df5e6835e53986399f547ba56121c575dbeadd361750aad80504cc0862.webp","floor_decals/floor_red_grate":"assets/cfe88e63553d4889cfd450e11681fbbe6f4a896e75374d2b643eac8c40d017c7.webp","floor_decals/floor_rubble_edge":"assets/fe2a423193126225fc2423b5ddd8c6f8eafd554351289c677047b09c7fcb60b8.webp","floor_decals/floor_target_circle":"assets/98bd5733ee5d1e01ae60452069809039ba3ef75897981d8eb0a1d297f2e6397c.webp","floor_decals/floor_vent":"assets/afb773eaa41489953d88e11c6b8d6e4b3c485065b437223529d04537ae88b34f.webp","floor_decals/growth_branch":"assets/1a8c282bb6eb8644a07b01cdefef5da1d92940a31553a18db3e91ea313c22c92.webp","floor_decals/growth_corner":"assets/ea17006b1db5bf9595f6b36151f34292808eae53111bc0042a871e0c78ad4d75.webp","floor_decals/growth_node":"assets/b415d578b8e07b96ea83648efa8054729f919881371a4e8a90ad4a554f419c1a.webp","floor_decals/hazard_chevron":"assets/44135f59d0b3543abaff74f8b95d0d43bb6861d4d044abeabd4fa29f7b237281.webp","floor_decals/hazard_strip":"assets/e86cc7abd92b67410596dd2fc6bf86f6262c15e923abff4617a40f7ec346141a.webp","floor_decals/rubble_hazard":"assets/aa8721da404d9a85a749027b9b30f632860336d66ebc97c6c300f0e964289d0f.webp","floor_decals/rubble_infected":"assets/3a3e03f5e3096be69309b1d9f04cc70f4bc74cb4e9e6290e8d3426ffc5044014.webp","floor_decals/scorch_large":"assets/3f9c07be3f348cf4753c2c3a5bfbc9f48dec8fc751f16e9f7e9d73abecc0b461.webp","environment/barrel_biohazard":"assets/8bb0cdbab95988b83388e4e590756706b99e67e16f5992c3d4ceceba5261c41d.webp","environment/barrel_red":"assets/b84dc715e6b7a9945ac5ee21c58e9a776bfc2895a6bbe7c8b1da430e620981a6.webp","environment/barrel_spill":"assets/eaf5c311e310ec61bd3edfd230add3022d6a3269aa63db79a08757cab2d058f4.webp","environment/barrier_hazard":"assets/ec1665085319670eb307bf15a73c7453d457a4be4363bef0b1b87063b18b171a.webp","environment/beacon_short":"assets/424863fc3fb7133db4a2e313cfb15957bf82649ba170221c46a8dac417ec3c6a.webp","environment/console_biohazard":"assets/124c7480b77a64773d2103e69f7cd72c607d093275a9c92d3e81267710392a55.webp","environment/crate_biohazard":"assets/46ad6696ed35e0bee1cacb366a7476328549166fb0112f48039da5541b6ae189.webp","environment/fence_biohazard":"assets/d0767b00717d9c8b2931e30262b0622f52d052d11d9e99d536629937022caced.webp","environment/fence_corner":"assets/a706b95b179df83208359ad576bc54d9d20a370661045ed6b79cc81c0b64a8f2.webp","environment/fence_straight":"assets/f9ac6aef458b987c0dcec90fb26a25ee7409ae43490741839b6aef3cdb9dcff2.webp","environment/floor_hatch_round":"assets/319cefa50c10cf505a7d7118c39aeceb9337fae5f4f4ec1a258be0a5191e8372.webp","environment/generator":"assets/6c88abaa9455ed01421e9760a231ef5e24ff6e0d18ac2649f31767d5b5d08a98.webp","environment/growth_egg_cluster":"assets/aec124c4dcb16797d9e25c23eb3a0df27005e02be50ae847665b38489712efa7.webp","environment/growth_tendril":"assets/af58e68b86807b3be4db618fc634121e0a8a1407363a0d0179bddaaa357c4299.webp","environment/pipe_arch":"assets/75c212aa0ce8ffc61aac51b25c2e0c40874756c7b9fc8d854e6abdd81491fac9.webp","environment/pipe_elbow":"assets/6a01a700f8b52cca18d1be3fd7620818888e4a107065ff4ee7c7a6146d83957f.webp","environment/pipe_short":"assets/a6b97c1801917002e95eaa096aa620da5c94ae6d01d71c03fe4f54128fdf12f2.webp","environment/pipe_valve":"assets/17ef24c7faaf9763ef8e65a6f30708c4a23f7202245d7744140de6ac5f65743a.webp","environment/server_column":"assets/549c5fe150c5e675bfb2e52bbb7253dd727de38dbd3ba22e5a7d97002c6faf7c.webp","environment/spotlight":"assets/e466f4079e02fb3bf7f7dc75aba18bae16fdbc522096e43412731b567c4994e9.webp","environment/tank_broken":"assets/96587894e92f37a62709b0c7a8ba7ad0d87effbb773e4db1d510d9b380065c60.webp","environment/tank_containment":"assets/2932e4c8faaa1b7aa9ae72f3845106a79bde6cded4c73033cdbf6fad59b64219.webp","environment/vent_fan":"assets/11db9774ca726ade4db7bc65154edd07f025c2d095e783ff768493113e7157b3.webp","environment/vent_industrial":"assets/a9620feea3307cfec877327cb90c7d9f89316a51e57fe3d7563092a418ca62d5.webp","environment/wall_panel":"assets/3878e5754f2f829f9ced9a035f3bc9a871a82736d82f8873cdfd4c6fe885c359.webp","ui/boss_hp_frame":"assets/5c0a92c6303702f1ca1e6cf468f0871aa5a00e49af8ccc3ca14faf2e7a473865.webp","ui/button_dash":"assets/263b2a4624875fd841d09713cc4d92ff30ecb351783887ecb22f87b6fe76cc42.webp","ui/card_arm":"assets/f08277a0949e1d7cb029fe99aecb9e9cdd9f2ebc6ba63c8c516406786914e349.webp","ui/card_base":"assets/99441edee5e62b79ada1b3fcb6db1e73c9542b5819585d4c319e228e14fdbf20.webp","ui/card_haste":"assets/94db386bd9c9dd43a5d4831284bba83b3a8712ee796e451c5cae1e572b5212bd.webp","ui/card_mouth":"assets/a4ba11fa6c94e06d15f626dee67a7e01e4a2971c8c5a53444a49f4f0b9219f53.webp","ui/card_tail":"assets/1aa72b70dd751b099d292ad9646b6326939a72049e81c13a041c27ac9c1b0a5f.webp","ui/hud_dna_frame":"assets/e93817188050cb97138dac3c3d94501d4ea13e679f23cc2870050adc40e2ac49.webp","ui/hud_hp_frame":"assets/fa805e9ed436b90ab5999e5ac6ff91871ae42a03e9e2fcefff7f03215df610b3.webp","ui/hud_timer":"assets/7278bd9553c8d18cfaaaaa434c5ad364dd2209e617ed044eec6347aa58b496e1.webp","ui/joystick_ring":"assets/8ea5d7f7070b9a168443c7aad24d4294d76df92908b6f7a48fb9aabf43ff73dd.webp","ui/joystick_thumb":"assets/80b46f2f3c41c04ca2e6ceb8203962753d8bec7942cf630bb4e3000bf0788749.webp","ui/pause":"assets/1258dad6cb5387d361b3cdd44d03199013b8ac267411b4656fc874b70b758dc5.webp","enemy/brute":"assets/8871e0334ad3cef49c5e53ef80db2e572204f636340e975377f65c4c22ed7a3e.png","enemy/crawler":"assets/2b26b870db71f27620f2742ad4b914d8701f0dad758045f35dca3a39b615ce7b.png","enemy/embermaw":"assets/1dc96cefe90e34556268161f43cfa49415fdd6424c12fb87193f7e21252499d7.png","enemy/frost_stalker":"assets/5c38f811c29f608a7268e4a004c44afa67533825d72e93aa0d4a79db7fac4ab4.png","enemy/runner":"assets/99d21db5829338b803d8bed02318c2f896099a19551009963e0d049208786ae8.png","enemy/spitter":"assets/0976848339e72de7f30d33190462b74434b9be78d2135e038bed2da8b8f386ca.png","enemy/symbiote":"assets/ff6f285a19af91dc74fe26b6d7058082774fbe6ae345076b1a2da3b39cdac863.png","enemy/warden":"assets/2325d540aad3121675d894ea103ef6233948275fc28ceb55c81a4ab79fcb789b.png","boss/aberrant_titan":"assets/9546befb06bd42d056a3a667e59accd83a60af91c10cd1a019016413e7ed927f.webp","boss/abyss_matriarch":"assets/94a22cd27c2eea7182ebd91988831ae08e27fb6f1fd81cc234aba656ce2be4a4.webp","boss/bio_titan":"assets/f48ef7189f8785819d188b6986a92b9823221578bfdd966a38b8df119e36101a.webp","boss/boss_blade_variant":"assets/2b0ead90c3b8f19590b03b17b3b77c82d270f6b51f8a1a166cb4ec056c02efdc.webp","boss/frost_titan":"assets/cfa35499695086fd806cde8d827748477aaafc24dd3fee1624250bfa43e84136.webp","boss/origin_colossus":"assets/81d408aed2fd5e58d6fa30a5add54a5c698db11097da216df836598d8fd53cd1.webp","boss/pyre_titan":"assets/2799c33b63ae3b76ac8631f0b1273e871e9d3050ab637adf3a928ac302e6816e.webp","player_static/arm_build":"assets/b078ffc5d15873b156b9818092aaa739a24b0df339196d6928729626979554f0.webp","player_static/base_specimen":"assets/c96d13fcfaaeebcff17c2449e6acadb3a7020494ab3e693421bf8a414d371315.webp","player_static/core_build":"assets/10d7a343b082a9bfd0c46d4f31bc60f41fa5bff6d88ef4c147dc831b31bfd3ef.webp","player_static/haste_build":"assets/1698523eace1db30e790954259bf87eb88e8db0393dfea25141493e8286f2561.webp","player_static/mouth_build":"assets/9979a8c0598c39faa44b396edddba1430ea0ffef5ddfc6b3688f0f937a27e481.webp","player_static/tail_build":"assets/ac0b752c0a83e03de95e5462d8c10bf20c9f60a8d525327a5221f6da68726911.webp","mutation_parts/arm_l1":"assets/7ad2ad7e5130a720f04318749e9f7552ab8e79223cb6de5dd508601a0326b6d1.webp","mutation_parts/arm_l2":"assets/71de4381276487f8f67022d2c2ba1f2e4715d4ec1eb7b2e3798b640ebc491a05.webp","mutation_parts/arm_l3":"assets/075fe58ea960ada9962ada03f4acc8256663a8251fd76e82cf9d9fd4c704310c.webp","mutation_parts/arm_l4":"assets/8d56fcc5ad9135ec0e54253964ec80ded901f434dd10e71a46999b3c59f1c4ac.webp","mutation_parts/arm_l5":"assets/95437eefe28905614eae84f18f9dafc5dfe9064f24a5dbd9f6c5da00dc768e0d.webp","mutation_parts/core_l1":"assets/4bc47ca5c717cb27641bf4703b784c9a7e07afc17dc929a1d1eaff23d1a27305.webp","mutation_parts/core_l2":"assets/79e8b7c7a9aad5ea97a1aab3ab71b013c576a0ebefc705e6b1921b5c39bd1db0.webp","mutation_parts/core_l3":"assets/a30973b2c9e74b0e452a66d1180c0f8993c93e65e24303c9879cad21c27eddab.webp","mutation_parts/core_l4":"assets/6a128d8f5e82539479bdb1bf898648f1886cfecba44f76569f2b43b01130eba7.webp","mutation_parts/core_l5":"assets/5a798ed2f93fa36fbf7d3d485d9f74efe955849ebc1edae58fd55aee80ea05c5.webp","mutation_parts/haste_l1":"assets/5dd94007b1f36cc5269870bea5d5ce61f3abd61fd3a5794f970397ef89c85086.webp","mutation_parts/haste_l2":"assets/ddc9483a5f4d449c7e9cfbb9f92f45ab895869427579b650bc680a5a1a3502c4.webp","mutation_parts/haste_l3":"assets/626478e5a109f95747ff47ad7117df64b0ce3b84459b4db2b084e846b2acda70.webp","mutation_parts/haste_l4":"assets/12d3d56be0a13e8f256febec240564a9c1aaabdf60606c168b0fb5f63c5b8154.webp","mutation_parts/haste_l5":"assets/5aadb26cb762f11c68254ffed1f58929b828b0de217b75ac40e78178ef364cfc.webp","mutation_parts/mouth_l1":"assets/e14eec8ed345f5c9de1985c1c0b229e120ca2e9ff55572e99988ff0f0d3bedd6.webp","mutation_parts/mouth_l2":"assets/2d454339d0d44571bcc53eae931531586c88c911bb68f87539f878d84129b68d.webp","mutation_parts/mouth_l3":"assets/f56f970d12deaec5f968fcdc17cef0167c08b717bf17bbc359c2674560a3da70.webp","mutation_parts/mouth_l4":"assets/ed60a76279ae1bbd72cf4f33ac869fb52ceeb0e46bae0b1b09431abfc5758959.webp","mutation_parts/mouth_l5":"assets/bc951b7fadac4e439e392486d04641e541d2fa51333f91998a48655ab2219ece.webp","mutation_parts/tail_l1":"assets/934f5fa836ea264c085c091dc092137de3b6ee8dab8b96e095dd074cca7866aa.webp","mutation_parts/tail_l2":"assets/32ae31819f5cf3f51cded36af51c52f1e5413f0c834fa54a7ffe458475f8d9ea.webp","mutation_parts/tail_l3":"assets/671dfe0ab761fd4542696574618273192432fe8cc5da7a9112a284888bd9fde7.webp","mutation_parts/tail_l4":"assets/31293d542aad5b9430e822e395c82c0031e8a090069f4594601581b9cf5dc524.webp","mutation_parts/tail_l5":"assets/7f3d4f59376ded7b861ac3629c467ef6afaee2fa5f7dacebc5f73207ec8167a4.webp","capstone_apex/bastion_core":"assets/6975245dcf2bacb833d3b3eb8295d9e5ddaeb3b8e73ab1c2d14f6591b2ed9e05.webp","capstone_apex/blood_cyclone":"assets/f38cecc2d3ca4263a0dbc8e2abfc3e84b951138397d30007dc2b8cafa4d3bd58.webp","capstone_apex/broodstorm":"assets/147524348dc20521fdc97f30c52e3e9556afe3615659f09970a334c9c288c5b6.webp","capstone_apex/execution_spine":"assets/421c3ad00f2c0e967d8ac8b6fb73d1234d18a7ba197bbc896eb98453cd517648.webp","capstone_apex/hunt_nerve":"assets/68df0d00c27caab6ea99ce28295e06675f9dd4c5b0b8a265e819fc42b14815e7.webp","capstone_apex/hydra_maw":"assets/e97ab723af397b5905301ff334a55d08c2bf09a99dd924e644d76b75ae16a0fd.webp","capstone_apex/phase_nerve":"assets/972160642b54f18d812641f2c38b033afad560707cbed7281954225e373015d6.webp","capstone_apex/plague_vortex":"assets/a465b830839723d6788c6728a0b36b0e01424906dfcce0b3f963050f898dfd0b.webp","capstone_apex/rail_organ":"assets/5f2ca3d823312e9afd501f53ba5af40eeadd50f980ab743379e093af690e96cf.webp","capstone_apex/reactor_core":"assets/60b0753de4c91cb3b1c67dc494e8f60bf00db98820cc2a66c4f128dc9e49f07f.webp","capstone_apex/red_reaper":"assets/3643cc37e126b5a9cfaf122afbc39eec1a54615dd7c90ee69b746973acafeefe.webp","capstone_apex/sun_lance":"assets/e10b84c6a51b922e50fb99eaed19597419e4a1d30c5c9c4f0f933738a5d30cc0.webp","capstone_apex/virulent_maw":"assets/579b4440914e5686284e7fe839709b7e841305fe2bae161706c697000c8dc845.webp","capstone_apex/void_carapace":"assets/cd3eff4c8052ca65955c5b181fb3078f7703037974211dc729deaf36799e7a55.webp","pickups/apex_crystal":"assets/2641cff090f9808b3462df0d1f484adad3549f2d81398ee84f4a014727f96e89.webp","pickups/capsule_health":"assets/c53ddd7782c71f00878957e15f368e9d5449c70c763323864062ed0da25d4281.webp","pickups/capsule_shield":"assets/84b6c036618d8037228675cf6d54337a8789db7f71662efe85824cd85550091f.webp","pickups/dna_large":"assets/b7d517b315625627e8932a0cb9f5570b5141a49724d77d43f9eddf447d7644ad.webp","pickups/dna_medium":"assets/20767f81b985e52ac5f32c8458055b44cc33898d6b966561a5c7698dbb05fc63.webp","pickups/dna_small":"assets/1eef25ddc50182e771e86b9b36d0f1cc92cf4ef72043ad201700318f563a9a49.webp","pickups/route_cryo":"assets/7016ab2a2561fb6bab0c74010bc42747042972de75dcf796ed4368bb6928cb08.webp","pickups/route_gene":"assets/0c9d8025d667e381fb73d3b9d773825c3cfd1e81b80fc1ed785a33f5fbdafa5e.webp","pickups/route_inferno":"assets/a34145f12130efb7526fbabb877cb448b7a8f7fac40404eeb38a942154f918d6.webp","icons/blueprint":"assets/c844e09ac1f2db8440bfc8c66cee852e3ef84a5cd24c05b9e66b5c82a8147379.webp","icons/health":"assets/6dcb3be16a7a2e79f09491902f6f713a95ee0cafbb911e315ab64e5878a60a4a.webp","icons/knowledge":"assets/26343c6eec050f367078f381453b30b9ec8f48ce2e4cde618b9017d32d1c22af.webp","icons/reward":"assets/08c81244061c5cc2fa28c52ed4f7966ab87e90be61b4e35f5cdc119ebf8f0453.webp","icons/shield":"assets/d592e49c252b51c2704c66cfbfbdc8922d846dcb02af5b5a7178d6bfb5ee1162.webp","icons/target":"assets/a7241967b1d48b93591c5a78c9723958e691a5d22bcb89b08f2c4e77a3eb0f8e.webp","vfx/acid_pool":"assets/1350001e93b0e6280ddfa3018588d59d02e016502bb1d669810cd9987445c139.webp","vfx/acid_projectile":"assets/ac99b628e676529523a76c910ae2d34f24ce05fb13143884ab2e2ab782afece7.webp","vfx/acid_splash":"assets/0ae21707474d232973001ff831c646f0f123241d1d2e6b937fcd8e491449a50f.webp","vfx/acid_zone":"assets/9441fe844e9eaf5216e92eeaec026ae46b07e2f529de7e8d4ebaeef924b3158e.webp","vfx/arm_beam":"assets/54b2b351ba827d56a7fc6b5b9c77fcecc8a293df8863913e8e6a9638db56cf0a.webp","vfx/arm_impact":"assets/c1fda6f8a09e64f563eaa3beb467c5d112ff16e14203fc08160cdcfe44f99461.webp","vfx/arm_orb":"assets/0b423c7fb919023df5872107e9d7464f2baabb254ad81605de0ec82b4ce3de5a.webp","vfx/arm_projectile":"assets/2a9f555f7813402267b710410b668b78969ee0f02f0e965efb739215551fa2b6.webp","vfx/boss_impact":"assets/6a8913b3cf4612add3731008afd2c6d216800c7f4ee0f5416d4caaf4af2626e9.webp","vfx/core_blast":"assets/257251922ecdc3c86c5facbefb3177a23d1b52078d23326f020560b666dfd1ed.webp","vfx/core_ring":"assets/688fe9296c845aac47ba8de83a4989f818627ee1ddc7d98547b812fd05961070.webp","vfx/cryo_impact":"assets/92183ed75fb30e83e367b16b5783db4c6167a9971ae84fa6c5cb7be2c750e53b.webp","vfx/cryo_zone":"assets/496d048196074dd0a1fe9c4b41239c045b8aa9ec49623e9bedc297ef1a563bb5.webp","vfx/death_burst":"assets/d8d1e2c4dad046dc1b3531eefc01a29ea94a7e53b9f245b2d68a66d564e59498.webp","vfx/dna_pickup":"assets/d494f244e0a3f0ab9e547c8ba8643635bfac51662cff833adff75b16ed8b594f.webp","vfx/haste_dash":"assets/603b51b6b59ef574b95954e07376a579fc5cb5bc2099ee1f0d60d0c459bbae4f.webp","vfx/haste_impact":"assets/8799542d4a4ec3f752824d231f7441d9d68ff664f763d8cdf56802b0094130ce.webp","vfx/haste_ring":"assets/54f724ed19d82158940f207500ebd60aea6c10ebaad6d3eff7b46dbb0440fb7e.webp","vfx/levelup":"assets/39f31b29d093c71c6a700abef650a92ad381718573c89e96b6204aa05d60193f.webp","vfx/reward_spark":"assets/176c35b96efc4f191ff09e92292520a6fe184e8b84025d36d98b82faa3274e12.webp","vfx/tail_slash":"assets/813e1d1edf53f2251ad58463f745ed278d8c6dc2211dcf9d522467e8ed039ace.webp","vfx/tail_spin":"assets/450b168cc5ec72b366a4b0df23bcca1cd7daf47de23dd161d8f6a61d2a054eac.webp","vfx/void_zone":"assets/3f0ec423150d33d592deb9026f7f0312ab2ac5e2edb38025fc307bbab68fd7c7.webp","vfx/warning_ring":"assets/bdf9e5ebc1615f681d6c27b9057b4ce13f87523aa012a9890fcd282a8917ae89.webp","floor_decals/floor_biohazard":"assets/3cf1093541f5ad97fb3773148a8f9f43579d28fd4279e9e20105e062cb110930.webp","pickups/capsule_knowledge":"assets/77802e2b9c29dc5e86fd5a8c59967b5c59a30b14c4f11846abeeeecde9739c70.webp","ui/joystick_reference":"assets/23d51ef89003817bc910b76f4832235ea08583e9ea2ba137844826c537b89102.jpg","pickups/capsule_vortex":"assets/48da80880158856010cbd88674cffaca1ec8e2f8936b3d1087b3a0c58e7e302c.webp","vfx/reward_beacon":"assets/3ece0e48dfcde3b7381f22595c50bd34f40a598a37d98f05b085de4d3e54bc49.webp","vfx/reward_ring":"assets/5b37dac47007d0e92b8b967a18473639c1aecf24cfac626b8396933217f53efa.webp"};

/* Read-only compatibility adapter. Preserve original V635 combat script and save keys. */
(()=>{
  'use strict';
  const init=()=>{
    const content=document.getElementById('codexContent');
    if(!content||!window.EVOLVE_DEX01)return;
    const dex=window.EVOLVE_DEX01;
    let applying=false;
    const paint=()=>{
      if(applying||content.querySelector('[data-dex01]'))return;
      const overlay=document.getElementById('codexOverlay');
      if(!overlay)return;
      applying=true;
      try{dex.render({codex:DEX_LIVE_CODEX,parts:DEX_LIVE_PARTS,seen:[],assets:DEX_LIVE_ASSETS})}
      finally{applying=false;}
    };
    new MutationObserver(paint).observe(content,{childList:true});
    if(content.childElementCount)paint();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
