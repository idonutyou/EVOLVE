// WEB-26: short, independently rolled stat cards. All bonuses belong to this run.
const UPGRADE_RARITIES_V593=Object.freeze([
 {id:'common',ko:'커먼',en:'COMMON',color:'#bec5ce',mult:1,count:1,chance:.60},
 {id:'rare',ko:'레어',en:'RARE',color:'#46ceff',mult:1.5,count:2,chance:.27},
 {id:'epic',ko:'에픽',en:'EPIC',color:'#c578ff',mult:2,count:3,chance:.10},
 {id:'legendary',ko:'전설',en:'LEGENDARY',color:'#ffe16b',mult:3,count:4,chance:.027},
 {id:'mythic',ko:'신화',en:'MYTHIC',color:'#ff913d',mult:5,count:5,chance:.003}
]);
const upgradeArtV593=JSON.parse('__UPGRADE_ART__');
const upgradeRunV593={};
const upgradeBleedsV593=new Map();
let upgradeSpawnPermissionV593=false;
const upgradeTextV593=(ko,en)=>homeTextV522(en,ko);
const upgradeNumberV593=n=>String(Number(n.toFixed(2)));
const upgradePercentV593=n=>upgradeNumberV593(n*100)+'%';
function upgradeResetV593(){
 Object.assign(upgradeRunV593,{gunDamage:0,gunHaste:0,gunCount:0,gunPierce:0,gunRange:0,gunBounce:0,
  bladeDamage:0,bladeHaste:0,bladeRange:0,bladeCrit:0,bladeBleed:0,moveSpeed:0,size:0,armor:0,regen:0,regenClock:0,
  baseSpeed:player.speed||132,baseRadius:player.r||10,baseSize:playerArtV586.displaySize,selected:0,mode:null,highest:{},taken:{}});
 upgradeBleedsV593.clear();
}
upgradeResetV593();
function upgradeBodyScaleV593(){return clamp(1+upgradeRunV593.size,.35,2);}
function upgradeBladeRateV593(){return 1+upgradeRunV593.bladeHaste;}
function upgradeGunRateV593(){return 1+upgradeRunV593.gunHaste;}
function upgradeGunRangeV593(){return playerBasicRangeV552()*(1+upgradeRunV593.gunRange);}
function upgradeBladeReachV593(base){return base*(1+upgradeRunV593.bladeRange);}
function upgradeSetBodyV593(){
 const scale=upgradeBodyScaleV593();player.r=upgradeRunV593.baseRadius*scale;playerArtV586.displaySize=upgradeRunV593.baseSize*scale;
 resolveTerrainBody(player,player.r);fieldSpawnSamplerV590.reset();
}
function upgradeMoveV593(amount){upgradeRunV593.moveSpeed+=amount;player.speed+=upgradeRunV593.baseSpeed*amount;}
function upgradeHealthV593(amount){player.maxHp+=amount;player.hp=Math.min(player.maxHp,player.hp+amount);}
function upgradeEquipV593(mode){
 // A card equips only for the current run. The saved home ARM equipment is untouched.
 upgradeRunV593.mode=mode;state.arm=Math.max(1,state.arm||0);playerMotionV586.attack=null;playerMotionV586.cooldown=.12;player.shoot=.12;
 armItemsRefreshV589();
}
const UPGRADE_CARDS_V593=[
 {id:'gun_equip',group:'gun',row:0,name:['생체 총','BIO CANNONS'],available:()=>armItemModeV589()!=='cannon',base:.10,lines:v=>[upgradeTextV593('총 장착','Equip cannons'),upgradeTextV593('공격력 +','Damage +')+upgradePercentV593(v)],apply:v=>{upgradeEquipV593('cannon');upgradeRunV593.gunDamage+=v;}},
 {id:'blade_equip',group:'blade',row:1,name:['생체 칼','BIO BLADES'],available:()=>armItemModeV589()!=='blades',base:.10,lines:v=>[upgradeTextV593('칼 장착','Equip blades'),upgradeTextV593('공격력 +','Damage +')+upgradePercentV593(v)],apply:v=>{upgradeEquipV593('blades');upgradeRunV593.bladeDamage+=v;}},
 {id:'gun_damage',group:'gun',row:0,name:['강력한 사격','POWER SHOT'],stat:'gunDamage',base:.10,label:['공격력','Damage'],unit:'percent'},
 {id:'gun_count',group:'gun',row:0,name:['다중 사격','MULTISHOT'],stat:'gunCount',count:true,label:['탄수','Projectiles']},
 {id:'gun_haste',group:'gun',row:0,name:['고속 사격','RAPID FIRE'],stat:'gunHaste',base:.10,label:['연사 속도','Fire rate'],unit:'percent'},
 {id:'gun_pierce',group:'gun',row:0,name:['관통탄','PIERCING'],stat:'gunPierce',count:true,label:['관통','Pierce']},
 {id:'gun_range',group:'gun',row:0,name:['장거리 사격','LONG SHOT'],stat:'gunRange',base:.10,label:['사거리','Range'],unit:'percent'},
 {id:'gun_bounce',group:'gun',row:0,name:['도탄','RICOCHET'],stat:'gunBounce',count:true,label:['튕김','Bounces']},
 {id:'blade_damage',group:'blade',row:1,name:['강력한 베기','HEAVY CUT'],stat:'bladeDamage',base:.10,label:['공격력','Damage'],unit:'percent'},
 {id:'blade_haste',group:'blade',row:1,name:['쾌속 베기','QUICK CUT'],stat:'bladeHaste',base:.10,label:['공격 속도','Attack speed'],unit:'percent'},
 {id:'blade_range',group:'blade',row:1,name:['넓은 베기','WIDE CUT'],stat:'bladeRange',base:.10,label:['범위','Range'],unit:'percent'},
 {id:'blade_crit',group:'blade',row:1,name:['급소 공격','CRITICAL'],stat:'bladeCrit',base:.10,label:['치명타 확률','Critical chance'],unit:'points',available:()=>upgradeRunV593.bladeCrit<1-1e-8},
 {id:'blade_bleed',group:'blade',row:1,name:['출혈','BLEED'],stat:'bladeBleed',base:15,lines:v=>[upgradeTextV593('3초간 출혈 +','Bleed over 3s +')+upgradeNumberV593(v)]},
 {id:'move',group:'legs',row:2,name:['신속','SWIFTNESS'],base:.05,lines:v=>[upgradeTextV593('이동 속도 +','Move speed +')+upgradePercentV593(v)],apply:upgradeMoveV593},
 {id:'light',group:'legs',row:2,name:['경량화','LIGHTWEIGHT'],base:.05,available:()=>upgradeRunV593.size>-.65+1e-8,
  lines:v=>[upgradeTextV593('이동 속도 +','Move speed +')+upgradePercentV593(v),upgradeTextV593('크기 −','Size −')+upgradePercentV593(Math.min(v,.65+upgradeRunV593.size))],
  apply:v=>{upgradeMoveV593(v);upgradeRunV593.size=Math.max(-.65,upgradeRunV593.size-v);upgradeSetBodyV593();}},
 {id:'health',group:'shell',row:3,name:['생명력','VITALITY'],base:10,lines:v=>[upgradeTextV593('체력 +','Health +')+upgradeNumberV593(v)],apply:upgradeHealthV593},
 {id:'giant',group:'shell',row:3,name:['거대화','GIGANTISM'],base:25,available:()=>upgradeRunV593.size<1-1e-8,
  lines:v=>[upgradeTextV593('체력 +','Health +')+upgradeNumberV593(v),upgradeTextV593('크기 +','Size +')+upgradePercentV593(Math.min(.05,1-upgradeRunV593.size))],
  apply:v=>{upgradeHealthV593(v);upgradeRunV593.size=Math.min(1,upgradeRunV593.size+.05);upgradeSetBodyV593();}},
 {id:'armor',group:'shell',row:3,name:['단단한 외피','HARD SHELL'],stat:'armor',base:1,label:['방어력','Armor']},
 {id:'regen',group:'shell',row:3,name:['재생','REGENERATION'],stat:'regen',base:1,lines:v=>[upgradeTextV593('5초마다 체력 +','Health / 5s +')+upgradeNumberV593(v)]}
];
function upgradeValueV593(card,tier){
 const r=UPGRADE_RARITIES_V593[tier];let n=card.count?r.count:(card.base||0)*r.mult;
 if(card.stat==='bladeCrit')n=Math.min(n,1-upgradeRunV593.bladeCrit);return n;
}
function upgradeLinesV593(card,tier){
 const n=upgradeValueV593(card,tier);if(card.lines)return card.lines(n);
 return [upgradeTextV593(...card.label)+' +'+(card.unit==='points'?upgradePercentV593(n)+'p':card.unit==='percent'?upgradePercentV593(n):upgradeNumberV593(n))];
}
function upgradePartV593(card){return {gun:upgradeTextV593('총','GUN'),blade:upgradeTextV593('칼','BLADE'),legs:upgradeTextV593('뒷발','HIND LEGS'),shell:upgradeTextV593('외피','SHELL')}[card.group];}
function upgradeApplyV593(card,tier){
 const amount=upgradeValueV593(card,tier);if(card.stat)upgradeRunV593[card.stat]+=amount;else card.apply(amount);
 upgradeRunV593.selected++;upgradeRunV593.taken[card.id]=(upgradeRunV593.taken[card.id]||0)+1;
 upgradeRunV593.highest[card.group]=Math.max(upgradeRunV593.highest[card.group]||0,tier);
}
function upgradeRollV593(random=Math.random){let n=Math.floor(random()*1000000);for(let i=0;i<UPGRADE_RARITIES_V593.length;i++){n-=Math.round(UPGRADE_RARITIES_V593[i].chance*1000000);if(n<0)return i;}return 4;}
function upgradePoolV593(){
 const mode=armItemModeV589();return UPGRADE_CARDS_V593.filter(c=>{
  if(c.available&&!c.available())return false;if(c.id.endsWith('_equip'))return true;
  if(c.group==='gun')return state.arm>0&&mode==='cannon';
  if(c.group==='blade')return state.arm>0&&mode!=='cannon';return true;
 });
}
chooseLevelPicks=function(){
 const pool=upgradePoolV593().slice(),picks=[];
 while(pool.length&&picks.length<3){const i=Math.floor(Math.random()*pool.length),c=pool.splice(i,1)[0],tier=upgradeRollV593();
  picks.push({kind:c.id,card:c,tier,title:()=>upgradeTextV593(...c.name),apply:()=>upgradeApplyV593(c,tier)});
 }return picks;
};
function upgradeArtStyleV593(row,tier){const [top,bottom]=upgradeArtV593.row_bounds[row],height=bottom-top;return `background-image:url('${upgradeArtV593.path}');background-size:500% ${upgradeArtV593.height/height*100}%;background-position:${tier*25}% ${top/(upgradeArtV593.height-height)*100}%;aspect-ratio:${upgradeArtV593.width/5}/${height};`; }
renderLevelChoices=function(isReroll=false){
 const picks=chooseLevelPicks(isReroll),cards=$('cards');cards.innerHTML='';levelLastOffer=picks.map(p=>p.kind);
 const head=$('levelPanel').querySelector('.levelHead');head.querySelector('h2').textContent=upgradeTextV593('레벨 업','LEVEL UP');head.querySelector('p').textContent=upgradeTextV593('강화 1개 선택','CHOOSE 1 UPGRADE');
 $('levelContext').textContent='Lv. '+player.level;$('levelCoach').textContent='';
 for(const p of picks){const c=p.card,r=UPGRADE_RARITIES_V593[p.tier],b=document.createElement('button');b.type='button';b.className='card upgradeCardV593';b.dataset.kind=c.id;b.dataset.rarity=r.id;b.style.setProperty('--rarity',r.color);
  b.innerHTML=`<div class="upgradeRarityV593">${upgradeTextV593(r.ko,r.en)}</div><div class="upgradeArtV593" aria-hidden="true"><div class="upgradeSpriteV593" style="${upgradeArtStyleV593(c.row,p.tier)}"></div></div><div class="upgradeNameV593">${p.title()}</div><div class="upgradeStatsV593">${upgradeLinesV593(c,p.tier).map(line=>'<div>'+line+'</div>').join('')}</div><div class="upgradePartV593">${upgradePartV593(c)}</div>`;
  b.setAttribute('aria-label',upgradeTextV593(r.ko,r.en)+' · '+p.title()+' · '+upgradeLinesV593(c,p.tier).join(' · '));
  b.onclick=()=>{if(!choosing||!choiceInputReady())return;p.apply();$('levelOverlay').style.display='none';choosing=false;updateHUD(true);audioCue('evolve');hapticCue('evolve');combatGrace(.20);addXP(0);};cards.appendChild(b);
 }
 updateRerollControls();$('rerollBtn').textContent=upgradeTextV593('다시 뽑기 ×','REROLL ×')+rerolls;updateHUD(true);
};
levelStatHtml=function(u){return u.card?upgradeLinesV593(u.card,u.tier).join('<br>'):'';};
const upgradeModeBaseV593=armItemModeV589;
armItemModeV589=function(){return running&&upgradeRunV593.mode?upgradeRunV593.mode:upgradeModeBaseV593();};
function upgradeGunTargetV593(){
 const range=upgradeGunRangeV593();if(playerTargetV586(focusEnemy)&&Math.hypot(focusEnemy.x-player.x,focusEnemy.y-player.y)<=range&&!terrainHitV418(player.x,player.y,focusEnemy.x,focusEnemy.y,1))return focusEnemy;
 let best=null,score=Infinity;enemyEachCandidateCircleV425(player.x,player.y,range,e=>{if(!playerTargetV586(e))return;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d>range)return;const priority=d*(e.finalBoss?.65:e.elite?.8:1);if(priority<score&&!terrainHitV418(player.x,player.y,e.x,e.y,1)){best=e;score=priority;}});return best;
}
function upgradeTagShotV593(b){
 if(armItemModeV589()!=='cannon'||!['arm','artillery'].includes(b.kind))return b;
 const range=upgradeGunRangeV593(),dx=b.x-player.x,dy=b.y-player.y,speed=Math.hypot(b.vx,b.vy),ux=speed?b.vx/speed:0,uy=speed?b.vy/speed:0,edge=Math.max(0,range-(b.r||0)),dot=dx*ux+dy*uy;
 b.basicRangeV552=range;b.rangeLeftV552=speed?Math.max(0,-dot+Math.sqrt(Math.max(0,dot*dot+edge*edge-dx*dx-dy*dy))):0;
 b.life=Math.max(b.life,speed?b.rangeLeftV552/speed+.05:0);b.upgradeHitsV593=new Set();b.upgradeBouncesV593=upgradeRunV593.gunBounce;return b;
}
const upgradePushBaseV593=pushBasicShotV552;
pushBasicShotV552=function(b){upgradePushBaseV593(b);upgradeTagShotV593(b);};
function upgradeBulletMayHitV593(b,e){return !b.upgradeHitsV593||!b.upgradeHitsV593.has(e);}
function upgradeBulletHitV593(b,e){b.upgradeHitsV593?.add(e);}
function upgradeBounceV593(b,source){
 if(!(b.upgradeBouncesV593>0))return false;let target=null,best=Infinity;const range=b.basicRangeV552||upgradeGunRangeV593();
 enemyEachCandidateCircleV425(source.x,source.y,range,e=>{if(e===source||!playerTargetV586(e)||!upgradeBulletMayHitV593(b,e))return;const d=Math.hypot(e.x-source.x,e.y-source.y);if(d<=range&&d<best&&!terrainHitV418(b.x,b.y,e.x,e.y,b.r)){target=e;best=d;}});
 if(!target)return false;const a=Math.atan2(target.y-b.y,target.x-b.x),speed=Math.hypot(b.vx,b.vy)||344;
 b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;b.pierce=1;b.upgradeBouncesV593--;b.rangeOriginXV552=b.x;b.rangeOriginYV552=b.y;b.rangeLeftV552=range;b.basicRangeV552=range;b.life=range/speed+.05;b.upgradeBouncedThisStepV593=true;return true;
}
let upgradeDamageSourceV593=null;
function upgradeProjectileDamageV593(e,damage,kind,bullet){const before=upgradeDamageSourceV593;upgradeDamageSourceV593=bullet.upgradeHitsV593?'gun':null;try{return hurtEnemy(e,damage,kind);}finally{upgradeDamageSourceV593=before;}}
const upgradeHurtBaseV593=hurtEnemy;
hurtEnemy=function(e,damage,kind){
 const firedGun=upgradeDamageSourceV593==='gun',blade=kind==='arm'&&!firedGun&&armItemModeV589()!=='cannon',gun=kind==='arm'&&(firedGun||armItemModeV589()==='cannon');
 if(blade){damage*=1+upgradeRunV593.bladeDamage;if(upgradeRunV593.bladeCrit>0&&Math.random()<upgradeRunV593.bladeCrit)damage*=2;}
 else if(gun)damage*=1+upgradeRunV593.gunDamage;
 const hp=e.hp;const result=upgradeHurtBaseV593(e,damage,kind);
 if(blade&&e.hp<hp&&!e.dead&&upgradeRunV593.bladeBleed>0)upgradeBleedsV593.set(e,{left:3,dps:upgradeRunV593.bladeBleed/3,clock:0});return result;
};
const upgradeDamageBaseV593=playerDamage;
playerDamage=function(damage){return upgradeDamageBaseV593(damage>0?Math.max(1,damage-upgradeRunV593.armor):damage);};
const upgradeUpdateBaseV593=update;
update=function(dt){
 const active=running&&!paused&&!choosing&&!rewardChoosing&&!ended,before=t,result=upgradeUpdateBaseV593(dt);
 if(!active||t<=before||ended)return result;const elapsed=t-before;
 if(upgradeRunV593.regen>0){upgradeRunV593.regenClock+=elapsed;while(upgradeRunV593.regenClock>=5){upgradeRunV593.regenClock-=5;player.hp=Math.min(player.maxHp,player.hp+upgradeRunV593.regen);}}
 for(const [e,b]of upgradeBleedsV593){if(e.dead){upgradeBleedsV593.delete(e);continue;}const step=Math.min(elapsed,b.left);b.left-=step;b.clock+=step;if(b.clock>=.20||b.left<=1e-8){upgradeHurtBaseV593(e,b.dps*b.clock,'bleedV593');b.clock=0;}if(b.left<=1e-8||e.dead)upgradeBleedsV593.delete(e);}
 return result;
};
const upgradeResetBaseV593=reset;
reset=function(...args){playerArtV586.displaySize=upgradeRunV593.baseSize;const result=upgradeResetBaseV593(...args);upgradeResetV593();armItemsRefreshV589();return result;};
const upgradeHomeBaseV593=returnToHome;
returnToHome=function(...args){playerArtV586.displaySize=upgradeRunV593.baseSize;upgradeRunV593.mode=null;upgradeBleedsV593.clear();const result=upgradeHomeBaseV593(...args);armItemsRefreshV589();return result;};
window.__EVOLVE_UPGRADE_CARDS_V593__={read:()=>({version:593,experiencePerLevel:12,cards:UPGRADE_CARDS_V593.length,rarities:UPGRADE_RARITIES_V593.map(r=>({...r})),run:{...upgradeRunV593,highest:{...upgradeRunV593.highest},taken:{...upgradeRunV593.taken}},bodyScale:upgradeBodyScaleV593(),bleeding:upgradeBleedsV593.size,art:upgradeArtV593.path,physical_Galaxy_S23_plus_tested:false})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_UPGRADE_CARDS_V593__.test={cards:UPGRADE_CARDS_V593,pool:upgradePoolV593,roll:upgradeRollV593,lines:upgradeLinesV593,value:upgradeValueV593,apply:(id,tier=0)=>{const c=UPGRADE_CARDS_V593.find(c=>c.id===id);if(!c)throw Error('Unknown card');upgradeApplyV593(c,tier);},reset:upgradeResetV593,show:showLevelUp,render:renderLevelChoices,damage:hurtEnemy,need:xpNeedForLevel,context:()=>({player,enemies,state,bullets,step:dt=>update(dt),fire:dt=>firePlayer(dt),draw,grid:rebuildEnemyGridV424,home:returnToHome,xp:addXP,clock:()=>t,choosing:()=>choosing}),bounce:upgradeBounceV593,tag:upgradeTagShotV593};

if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_UPGRADE_CARDS_V593__.test.offer=function(specs){const choose=chooseLevelPicks;try{chooseLevelPicks=()=>specs.map(([id,tier])=>{const c=UPGRADE_CARDS_V593.find(c=>c.id===id);return {kind:id,card:c,tier,title:()=>upgradeTextV593(...c.name),apply:()=>upgradeApplyV593(c,tier)};});choosing=true;$('levelOverlay').style.display='flex';armChoiceInput(260);renderLevelChoices();}finally{chooseLevelPicks=choose;}};
