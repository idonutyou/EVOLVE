// Explicit administrator specimens bypass stage type restrictions only inside a guarded call.
const MONSTER_CATALOG_V593=[
 {id:'crawler',type:'crawler',name:'크롤러',en:'CRAWLER',group:'일반'},
 {id:'runner',type:'runner',name:'러너',en:'RUNNER',group:'일반'},
 {id:'brute',type:'brute',name:'브루트',en:'BRUTE',group:'일반'},
 {id:'spitter',type:'spitter',name:'스피터',en:'SPITTER',group:'일반'},
 {id:'warden',type:'warden',name:'워든',en:'WARDEN',group:'일반'},
 {id:'froststalker',type:'froststalker',name:'프로스트 스토커',en:'FROST STALKER',group:'일반'},
 {id:'symbiote',type:'symbiote',name:'심비오트',en:'SYMBIOTE',group:'일반'},
 {id:'embermaw',type:'embermaw',name:'엠버모',en:'EMBERMAW',group:'일반'},
 {id:'legacy_crawler',type:'crawler',legacy:true,name:'크롤러 · 변형',en:'CRAWLER · LEGACY',group:'변형'},
 {id:'legacy_warden',type:'warden',legacy:true,name:'워든 · 변형',en:'WARDEN · LEGACY',group:'변형'},
 {id:'alpha',type:'brute',elite:'alpha',name:'알파 브루트',en:'ALPHA BRUTE',group:'정예'},
 {id:'sentinel',type:'spitter',elite:'sentinel',name:'타이탄 센티넬',en:'TITAN SENTINEL',group:'정예'},
 {id:'hunter',type:'runner',elite:'hunter',name:'게놈 사냥꾼',en:'GENOME HUNTER',group:'정예'},
 {id:'omega',type:'brute',elite:'omega',name:'오메가 사냥꾼',en:'OMEGA HUNTER',group:'정예'},
 {id:'nemesis_brute',type:'brute',elite:'nemesis',name:'네메시스 · 근접',en:'NEMESIS · BRUTE',group:'정예'},
 {id:'nemesis_spitter',type:'spitter',elite:'nemesis',name:'네메시스 · 원거리',en:'NEMESIS · SPITTER',group:'정예'}
];
function monsterCatalogAssetV593(c){return c.asset||enemyAppearanceAssetV516(c.legacy?'legacy_'+c.type:c.type);}
const monsterPermittedBaseV593=permittedEnemyV526;
permittedEnemyV526=function(type,boss=false){return evolveAdminEnabledV585&&upgradeSpawnPermissionV593?type:monsterPermittedBaseV593(type,boss);};
let monsterCatalogQueueV593=null,monsterCatalogSelectedV593='crawler',monsterCatalogSpawnedV593=0;
function monsterCatalogStatusV593(message){$('monsterStatusV593').textContent=message;}
function monsterCatalogPointV593(e,index){
 const start=(index*2.399963229728653)%TAU;
 for(const radius of [120,160,210,260,320])for(let j=0;j<24;j++){
  const a=start+j*TAU/24,x=clamp(player.x+Math.cos(a)*radius,24,WORLD_W-24),y=clamp(player.y+Math.sin(a)*radius,24,WORLD_H-24),p={x,y};
  if(!terrainBodyClearV505(p,e.r))continue;
  // Same reachable-foot component used by the environmental field; never use a sealed room.
  if(terrainHitV418(player.x,player.y,x,y,Math.min(e.r,10)))continue;
  e.x=x;e.y=y;return true;
 }return false;
}
function monsterCatalogSpawnOneV593(c){
 let e;upgradeSpawnPermissionV593=true;
 try{
  if(c.elite==='alpha')e=spawnElite();else if(c.elite==='sentinel')e=spawnEliteSpitter();else if(c.elite==='hunter'||c.elite==='omega')e=spawnEvoHunter(c.elite==='omega');
  else if(c.boss)e=stressBossPresetV424(c.boss);else e=spawnEnemy(c.type,false);
 }finally{upgradeSpawnPermissionV593=false;}
 if(!e||e.dead)return false;
 // Gate births expose locked coordinate accessors: restore actual writable positions first.
 if(e._mapBirthLockedV562)mapReleaseBirthV562(e);
 if(c.elite==='nemesis')Object.assign(e,{elite:true,nemesis:true,eliteName:c.en,nemesisPower:1,adaptKind:'core',elitePatternCd:1.15,hp:e.hp*4,maxHp:e.maxHp*4,r:e.r+3,xp:160});
 if(!monsterCatalogPointV593(e,monsterCatalogSpawnedV593)){e.dead=true;return false;}
 if(c.legacy)e.visualSetV516='legacy';else if(c.type==='crawler'||c.type==='warden')e.visualSetV516='base';
 Object.assign(e,{testModuleSpawnV573:true,catalogSpawnV593:c.id,arrivalTime:0,arrivalInvuln:false,spawnFx:0,mapDoorSpawnV562:false,_mapBirthLockedV562:false,mapEntranceRouteV562:null,mapRoadGateV562:null,_mapX560:e.x,_mapY560:e.y,vx:0,vy:0});
 delete e._mapBirthRecordV562;
 monsterCatalogSpawnedV593++;return e;
}
function monsterCatalogRequestV593(id,count=1){
 if(!evolveAdminEnabledV585)return false;const c=MONSTER_CATALOG_V593.find(c=>c.id===id);if(!c)return false;
 if(!running||ended){monsterCatalogStatusV593(upgradeTextV593('전투를 시작한 뒤 소환해 주세요.','Start a battle before summoning.'));return false;}
 if(choosing||rewardChoosing){monsterCatalogStatusV593(upgradeTextV593('강화 선택을 먼저 완료해 주세요.','Finish the current choice first.'));return false;}
 if(monsterCatalogQueueV593)return false;
 if(c.boss==='bio'||c.boss==='venom')return window.__EVOLVE_TEST_MODULE_V575__.boss(c.boss,Number($('tmPhaseV573').value)||1);
 if(enemies.some(e=>!e.dead&&e.finalBoss)||bossArena?.active){monsterCatalogStatusV593(upgradeTextV593('현재 보스전을 마치거나 새 전투로 이동해 주세요.','Finish this boss fight or start a new battle.'));return false;}
 const n=c.boss||c.elite?1:Math.max(1,Math.min(50,Math.trunc(Number(count)||1)));
 monsterCatalogQueueV593={id:c.id,total:n,left:n,spawned:0,failures:0};
 window.__EVOLVE_TEST_MODULE_V575__.close(true);monsterCatalogStatusV593(`${c.name} · ${n}`);return true;
}
function monsterCatalogPumpV593(){
 const q=monsterCatalogQueueV593;if(!q)return;
 if(!evolveAdminEnabledV585||!running||ended){monsterCatalogQueueV593=null;return;}
 const c=MONSTER_CATALOG_V593.find(c=>c.id===q.id);let n=0;
 while(q.left>0&&n++<3){if(enemies.filter(e=>!e.dead).length>=runtimeCaps().enemyHard)break;
  const e=monsterCatalogSpawnOneV593(c);if(e){q.spawned++;q.left--;}else if(++q.failures>=12){q.left=0;break;}}
 monsterCatalogStatusV593(`${c.name} · ${q.spawned}/${q.total}`);
 if(q.left<=0){monsterCatalogQueueV593=null;rebuildEnemyGridV424();}
}
{
 const block=document.createElement('div');block.className='tmBlockV573';block.id='monsterCatalogV593';
 block.innerHTML=`<h3>전체 몬스터 직접 선택</h3><label class="tmLabelV573">몬스터 <select id="monsterSelectV593">${['일반','변형','정예'].map(group=>'<optgroup label="'+group+'">'+MONSTER_CATALOG_V593.filter(c=>c.group===group).map(c=>'<option value="'+c.id+'">'+c.name+' · '+c.en+'</option>').join('')+'</optgroup>').join('')}</select></label><div id="monsterPreviewV593"><img id="monsterImageV593" alt=""><div><b id="monsterNameV593"></b><p id="monsterRoleV593"></p></div></div><div class="tmTripleV573"><button type="button" data-monster-count-v593="1">1마리 소환</button><button type="button" data-monster-count-v593="10">10마리 소환</button><button type="button" data-monster-count-v593="50">50마리 소환</button></div><p id="monsterStatusV593" role="status"></p>`;
 $('tmModalV573').querySelectorAll('.tmBlockV573')[1].before(block);
 function preview(){
  const c=MONSTER_CATALOG_V593.find(c=>c.id===$('monsterSelectV593').value);monsterCatalogSelectedV593=c.id;
  const im=$('monsterImageV593');im.src=ASSET_SRC[monsterCatalogAssetV593(c)];im.alt=c.name;$('monsterNameV593').textContent=c.name+' · '+c.en;
  const role=c.boss?['bio','venom'].includes(c.boss)?'보스전 · 선택한 페이즈로 시작':'보스 외형 · 기존 시험 패턴':c.elite?'정예 · 1마리씩 소환':({melee:'근접',ranged:'원거리',charge:'돌격',support:'지원'}[enemyAttackRoleV591({type:c.type})]||'');
  $('monsterRoleV593').textContent=role;for(const b of block.querySelectorAll('[data-monster-count-v593]'))b.disabled=!!(c.boss||c.elite)&&b.dataset.monsterCountV593!=='1';
 }
 $('monsterSelectV593').onchange=preview;for(const b of block.querySelectorAll('[data-monster-count-v593]'))b.onclick=()=>{Promise.resolve(monsterCatalogRequestV593(monsterCatalogSelectedV593,Number(b.dataset.monsterCountV593))).catch(e=>monsterCatalogStatusV593(e.message));};preview();
 const style=document.createElement('style');style.textContent='#monsterPreviewV593{display:flex;align-items:center;gap:14px;min-height:125px;margin:10px 0;background:#070b09;border:1px solid #34443b;border-radius:9px;padding:8px}#monsterImageV593{width:112px;height:112px;object-fit:contain;flex:0 0 112px}#monsterNameV593{font-size:12px;line-height:1.6;color:#f2eee1}#monsterRoleV593,#monsterStatusV593{font-size:11px;line-height:1.6;color:#aebeac;margin:6px 0}#monsterCatalogV593 select{font-size:12px}html:not([data-evolve-admin-v585="true"]) #monsterCatalogV593{display:none!important}';document.head.appendChild(style);
}
const monsterUpdateBaseV593=update;
update=function(dt){const active=running&&!paused&&!choosing&&!rewardChoosing&&!ended,result=monsterUpdateBaseV593(dt);if(active&&!paused&&!choosing&&!rewardChoosing&&!ended)monsterCatalogPumpV593();return result;};
const monsterResetBaseV593=reset;
reset=function(...args){monsterCatalogQueueV593=null;return monsterResetBaseV593(...args);};
const monsterHomeBaseV593=returnToHome;
returnToHome=function(...args){monsterCatalogQueueV593=null;return monsterHomeBaseV593(...args);};
window.__EVOLVE_MONSTER_CATALOG_V593__={read:()=>({count:MONSTER_CATALOG_V593.length,selected:monsterCatalogSelectedV593,queued:monsterCatalogQueueV593?{...monsterCatalogQueueV593}:null,spawned:monsterCatalogSpawnedV593,enabled:evolveAdminEnabledV585}),list:()=>MONSTER_CATALOG_V593.map(c=>({...c,asset:monsterCatalogAssetV593(c)})),summon:monsterCatalogRequestV593};
