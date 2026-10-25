// WEB-34: preserve game state and render the approved five-destination home.
const homeHubArtV601=__HOME_HUB_ART_V601__;
let homeHubInstalledV601=false;
const homeHubTabsV601=[['homeShopTabV601','shop','SHOP','상점'],['homeLabTab','parts','PARTS','파츠'],['homeBattleTabV522','battle','BATTLE','전투'],['memoryBtn','challenge','CHALLENGE','챌린지'],['codexBtn','codex','CODEX','도감']];
function homeHubSVGNodeV601(markup){const template=document.createElement('template');template.innerHTML=markup;return template.content.firstElementChild;}
function homeHubFrameV601(id,selected=false){
 const view=selected?'252 138 207 199':'145 171 136 166',hole=selected?'292 180 127 119':'168 203 91 101';
 const [x,y,w,h]=hole.split(' ');
 const outline=selected?'M356 138 368 153H406L431 174V275L455 296V308L432 332H279L255 309V296L280 275V176L306 154H344Z':'M178 174H250L279 197V316L258 336H165L146 317V207Z';
 return homeHubSVGNodeV601(`<svg class="hubPlateV601 ${selected?'hubPlateSelectedV601':'hubPlateRestV601'}" viewBox="${view}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="711" height="340"><path d="${outline}" fill="white"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="black"/></mask></defs><image href="${homeHubArtV601.path}" width="711" height="340" mask="url(#${id})"/></svg>`);
}
function homeHubGlyphV601(key){
 const boxes={shop:'48 202 65 65',parts:'180 202 65 65',challenge:'464 201 65 65',codex:'599 202 66 65'};
 if(key!=='battle')return homeHubSVGNodeV601(`<svg class="hubGlyphV601" viewBox="${boxes[key]}" aria-hidden="true" focusable="false"><image href="${homeHubArtV601.path}" width="711" height="340"/></svg>`);
 return homeHubSVGNodeV601('<svg class="hubGlyphV601" viewBox="0 0 64 70" aria-hidden="true" focusable="false"><defs><linearGradient id="hubClawGoldV601" x1="0" x2=".7" y2="1"><stop stop-color="#fff2c4"/><stop offset=".45" stop-color="#ffd48f"/><stop offset="1" stop-color="#c96a34"/></linearGradient></defs><g fill="url(#hubClawGoldV601)"><path d="M45 3 34 18l-2 8-8 7-3 9L7 61l8-21 7-10 1-8 9-5Z"/><path d="m58 8-9 15-2 10-9 8-2 10L20 69l9-23 6-11 1-8 10-8Z"/><path d="m62 30-8 11-1 8-7 6-2 6-11 9 6-14 4-9 6-6 1-5Z"/></g><g fill="none" stroke="#fff8da" stroke-width=".6" opacity=".7"><path d="m44 5-16 21-5 11L9 58M56 11 40 33l-5 13-13 20m38-34L46 49l-3 10-8 9"/></g></svg>');
}
function installHomeHubArtworkV601(){
 app.classList.add('homeHubShellV601');
 const poster=$('poster');poster.classList.add('homeHubV601');
 const shop=document.createElement('button');shop.id='homeShopTabV601';shop.type='button';shop.className='homeNavV522';shop.innerHTML='<span id="homeShopLabelV601">SHOP</span>';
 const organism=$('homeSpecimenTab'),tools=document.createElement('div');tools.className='hubPartsToolsV601';organism.className='hubSubButtonV601';tools.appendChild(organism);$('homePartsViewV523').prepend(tools);
 const nav=$('homeTabs');nav.classList.add('homeHubNavV601');nav.replaceChildren(...homeHubTabsV601.map(([id])=>id==='homeShopTabV601'?shop:$(id)));
 for(const [id,key]of homeHubTabsV601){const button=$(id),label=button.querySelector('span');label.classList.add('hubNavLabelV601');const fill=document.createElement('span');fill.className='hubPlateFillV601';fill.setAttribute('aria-hidden','true');button.replaceChildren(fill,homeHubFrameV601('hubPlateRest_'+key),homeHubFrameV601('hubPlateActive_'+key,true),homeHubGlyphV601(key),label);}
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
