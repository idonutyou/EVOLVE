// WEB-34: preserve game state and render the approved five-destination home.
const homeHubArtV601=__HOME_HUB_ART_V601__;
let homeHubInstalledV601=false;
const homeHubTabsV601=[['homeShopTabV601','shop','SHOP','상점'],['homeLabTab','parts','PARTS','파츠'],['homeBattleTabV522','battle','BATTLE','전투'],['memoryBtn','challenge','CHALLENGE','챌린지'],['codexBtn','codex','CODEX','도감']];
function homeHubSVGNodeV601(markup){const template=document.createElement('template');template.innerHTML=markup;return template.content.firstElementChild;}
function homeHubGlyphV601(key){
 const glyphs={
  shop:'<path d="M12 29h40v27H12Z" fill="none"/><path d="m10 16 5-8h34l5 8v10c-4 5-10 5-14 0-4 5-12 5-16 0-4 5-10 5-14 0Z"/><path d="M19 9v16m13-16v18M45 9v16" stroke="#6c4933" stroke-width="2"/><path d="M20 39h10v17H20Zm18-2h9v9h-9Z" fill="#181719" stroke="none"/><path d="M9 56h46"/>',
  parts:'<path d="m32 5 23 13v28L32 59 9 46V18Z" fill="none" stroke-width="3"/><path d="m32 16 14 8v16l-14 8-14-8V24Z"/><path d="m18 24 14 8 14-8M32 32v16" fill="none" stroke="#7c553c" stroke-width="2.2"/>',
  challenge:'<path d="M15 8h34v22c0 13-9 19-17 23-8-4-17-10-17-23Z" fill="none" stroke-width="3"/><path d="M15 15H7v12c0 8 4 12 12 13m30-25h8v12c0 8-4 12-12 13M32 53v7m-12 0h24" fill="none" stroke-width="3"/><path d="m32 18 4.2 8.5 9.4 1.4-6.8 6.6 1.6 9.3-8.4-4.4-8.4 4.4 1.6-9.3-6.8-6.6 9.4-1.4Z" stroke="none"/>',
  codex:'<path d="M32 15C24 9 16 7 6 8v43c10-1 18 1 26 6 8-5 16-7 26-6V8c-10-1-18 1-26 7Z" fill="none" stroke-width="3"/><path d="M32 15v42M13 19c5 0 9 1 13 3m-13 7c5 0 9 1 13 3m-13 7c5 0 9 1 13 3m12-20c4-2 8-3 13-3m-13 13c4-2 8-3 13-3m-13 13c4-2 8-3 13-3" fill="none"/>',
  battle:'<path d="M30 7C23 18 16 33 8 53L19 44C23 30 29 17 36 5Zm14-2C36 18 29 35 22 60l12-12C38 32 44 17 51 4Zm14 8C50 26 43 41 37 60l11-11c4-13 9-25 14-36Z" stroke="none"/>'
 };
 return homeHubSVGNodeV601(`<svg class="hubGlyphV601 hubGlyphFlatV604" data-glyph="${key}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="hubGoldV604_${key}" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#f5ddb5"/><stop offset=".55" stop-color="#d1aa79"/><stop offset="1" stop-color="#9f714e"/></linearGradient></defs><g fill="url(#hubGoldV604_${key})" stroke="url(#hubGoldV604_${key})" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${glyphs[key]}</g></svg>`);
}
function installHomeHubArtworkV601(){
 app.classList.add('homeHubShellV601');
 const poster=$('poster');poster.classList.add('homeHubV601');
 const shop=document.createElement('button');shop.id='homeShopTabV601';shop.type='button';shop.className='homeNavV522';shop.innerHTML='<span id="homeShopLabelV601">SHOP</span>';
 const organism=$('homeSpecimenTab'),tools=document.createElement('div');tools.className='hubPartsToolsV601';organism.className='hubSubButtonV601';tools.appendChild(organism);$('homePartsViewV523').prepend(tools);
 const nav=$('homeTabs');nav.classList.add('homeHubNavV601');nav.replaceChildren(...homeHubTabsV601.map(([id])=>id==='homeShopTabV601'?shop:$(id)));
 for(const [id,key]of homeHubTabsV601){const button=$(id),label=button.querySelector('span');label.classList.add('hubNavLabelV601');button.replaceChildren(homeHubGlyphV601(key),label);}
 const contour='M60 9H165L177 16H534L547 9H651L680 38V102L652 130H62L32 102V39Z';
 const frame=homeHubSVGNodeV601(`<svg class="hubStartFrameV601" viewBox="24 0 663 138" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><clipPath id="hubStartContourV602" clipPathUnits="userSpaceOnUse"><path d="${contour}"/></clipPath><linearGradient id="hubStartFillV602" x2=".2" y2="1"><stop stop-color="#8b3325"/><stop offset=".53" stop-color="#6c2529"/><stop offset="1" stop-color="#3b161d"/></linearGradient><filter id="hubStartSoftEraseV601" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="9"/></filter><mask id="hubStartMaskV601" maskUnits="userSpaceOnUse" x="0" y="0" width="711" height="138"><rect width="711" height="138" fill="white"/><rect x="222" y="34" width="275" height="70" fill="black" filter="url(#hubStartSoftEraseV601)"/></mask></defs><path d="${contour}" fill="url(#hubStartFillV602)"/><image href="${homeHubArtV601.path}" width="711" height="340" mask="url(#hubStartMaskV601)" clip-path="url(#hubStartContourV602)"/></svg>`);
 $('start').parentElement.prepend(frame);
}
function homeHubPageKeyV601(page=homePageV522){return page==='parts'||page==='lab'||page==='specimen'?'parts':page==='memory'?'challenge':page;}
function refreshHomeHubV601(){
 if(!homeHubInstalledV601)return;
 const page=homeHubPageKeyV601(),language=homeLanguageV522();
 for(const [id,key,en,ko]of homeHubTabsV601){const button=$(id),active=page===key;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));button.lang=language;if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');button.querySelector('.hubNavLabelV601').textContent=homeTextV522(en,ko);}
 $('start').parentElement.classList.toggle('is-disabled',$('start').disabled);
 if($('homeShopTitleV601'))homeSetTextV522('homeShopTitleV601',homeTextV522('SHOP','상점'));
 if($('homeShopHintV601'))homeSetTextV522('homeShopHintV601',homeTextV522('Strengthen your organism with the DNA you collected.','모은 DNA로 생명체를 영구 강화하세요.'));
 if($('homeChallengeTitleV601'))homeSetTextV522('homeChallengeTitleV601',homeTextV522('CHALLENGE','챌린지'));
 if($('homeMemoryOpenV601'))homeSetTextV522('homeMemoryOpenV601',homeTextV522('Battle memories','전투 기억'));
 if($('homeChallengeViewV601'))renderHomeChallengesV601();
 const dna=Math.max(0,Number(meta.dna)||0),value=dna>=10000?(dna/1000).toFixed(dna%1000?1:0)+'K':dna.toLocaleString();homeSetTextV522('homeFreeValueV525',value);
}
const homeHubLegacySelectV601=selectHomePageV522;
selectHomePageV522=function(page='battle'){
 if(!homeHubInstalledV601)return homeHubLegacySelectV601(page);
 const custom=page==='shop'||page==='challenge';
 const result=homeHubLegacySelectV601(custom?'battle':page);
 if(custom){homePageV522=page;$('poster').dataset.homePage=page;for(const id of ['homeBattleViewV522','homePartsViewV523','homeSpecimenView'])$(id).classList.add('hidden');$('memoryOverlay').style.display='none';$('codexOverlay').style.display='none';}
 $('homeShopViewV601').classList.toggle('hidden',page!=='shop');$('homeChallengeViewV601').classList.toggle('hidden',page!=='challenge');
 refreshHomeHubV601();$('homeContentV522').scrollTop=0;return result;
};
const homeHubLegacyRefreshV601=refreshEvolveHomeV522;
refreshEvolveHomeV522=function(...args){const result=homeHubLegacyRefreshV601(...args);refreshHomeHubV601();return result;};
window.refreshEvolveHomeV522=refreshEvolveHomeV522;
function installHomeHubNavigationV601(){
 for(const [id,key]of homeHubTabsV601){const button=$(id);button.onclick=()=>setHomeTab(key);button.setAttribute('aria-controls',key==='shop'?'homeShopViewV601':key==='parts'?'homePartsViewV523':key==='battle'?'homeBattleViewV522':key==='challenge'?'homeChallengeViewV601':'codexOverlay');}
 for(const group of document.querySelectorAll('#homeStatusV525 .walletV525')){group.setAttribute('role','button');group.tabIndex=0;group.onclick=()=>setHomeTab('shop');group.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setHomeTab('shop');}};}
 window.__EVOLVE_HOME_HUB_V601__={read:()=>({version:601,page:homeHubPageKeyV601(),subpage:homePageV522,ready:homeReadyV522,order:homeHubTabsV601.map(t=>t[1]),selected:homeHubTabsV601.filter(t=>$(t[0]).classList.contains('active')).map(t=>t[1]),originalArtworkBytesPreserved:true,physical_Galaxy_S23_plus_tested:false})};
}
let homeHubChallengeStampV601='';
function renderHomeChallengesV601(){
 const unlocked=homeUnlockedStageV522(),language=homeLanguageV522(),stamp=[unlocked,homeSelectedStageV522,meta.claimedStages.join(','),language].join('|');if(stamp===homeHubChallengeStampV601)return;homeHubChallengeStampV601=stamp;
 homeSetTextV522('homeChallengeHintV601',homeTextV522('Stages cleared: ','클리어 ')+meta.claimedStages.length+homeTextV522(' · Highest unlocked: ',' · 최고 해금 ')+String(unlocked).padStart(2,'0'));
 const grid=$('homeChallengeGridV601');grid.replaceChildren();
 const stages=[...new Set([homeSelectedStageV522,unlocked,Math.min(99,Math.ceil(unlocked/5)*5)])].sort((a,b)=>a-b);
 for(const stage of stages){const locked=stage>unlocked,cleared=meta.claimedStages.includes(stage),id=campaignMapForStageV567(stage)||'infected',art=homeMapArtV597.maps[id]||homeMapArtV597.maps.infected,card=document.createElement('article');card.className='hubChallengeCardV601';
  const text=document.createElement('div'),title=document.createElement('b'),detail=document.createElement('p'),button=document.createElement('button');title.textContent='STAGE '+String(stage).padStart(2,'0');detail.textContent=homeTextV522(art.en,art.ko)+' · '+homeTextV522(locked?'Locked':cleared?'Clear':'Available',locked?'잠김':cleared?'클리어':'도전 가능');text.append(title,detail);button.type='button';button.className='hubSubButtonV601';button.textContent=homeTextV522(locked?'Locked':'Challenge',locked?'잠김':'도전');button.disabled=locked;button.dataset.challengeStageV601=String(stage);button.onclick=()=>{selectHomeStageV522(stage);setHomeTab('battle');};card.append(text,button);grid.append(card);
 }
}
function installHomeHubPagesV601(){
 const content=$('homeContentV522'),shop=document.createElement('section');shop.id='homeShopViewV601';shop.className='homeView hubPageV601 hidden';shop.setAttribute('aria-label',homeTextV522('Shop','상점'));
 shop.innerHTML='<div class="hubPageHeadV601"><h2 id="homeShopTitleV601" data-i18n-ignore></h2></div><p id="homeShopHintV601" class="hubPageIntroV601" data-i18n-ignore></p>';
 shop.appendChild($('labPanel'));content.appendChild(shop);
 const challenge=document.createElement('section');challenge.id='homeChallengeViewV601';challenge.className='homeView hubPageV601 hidden';challenge.setAttribute('aria-label',homeTextV522('Challenge','챌린지'));challenge.innerHTML='<div class="hubPageHeadV601"><h2 id="homeChallengeTitleV601" data-i18n-ignore></h2><button id="homeMemoryOpenV601" class="hubSubButtonV601" type="button" data-i18n-ignore></button></div><p id="homeChallengeHintV601" class="hubPageIntroV601" data-i18n-ignore></p><div id="homeChallengeGridV601" class="hubChallengeGridV601"></div>';content.appendChild(challenge);$('homeMemoryOpenV601').onclick=()=>setHomeTab('memory');
}
installHomeHubPagesV601();installHomeHubArtworkV601();homeHubInstalledV601=true;installHomeHubNavigationV601();selectHomePageV522('battle');
window.__EVOLVE_STARTUP_V595__.ready.then(()=>refreshHomeHubV601());
