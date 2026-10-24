// WEB-29: readable pursuit, evasive shooters and ranked mid-boss encounters.
const MIDBOSS_RANKS_V596=Object.freeze([
 {id:'common',name:'커먼',en:'COMMON',stage:3,color:'#d4e1e7',hp:6,damage:1.7,speed:1.12,size:2,armor:.06,cap:.40,cooldown:1},
 {id:'rare',name:'레어',en:'RARE',stage:6,color:'#489eff',hp:7.2,damage:2,speed:1.16,size:2.15,armor:.09,cap:.44,cooldown:.94},
 {id:'epic',name:'에픽',en:'EPIC',stage:11,color:'#ba6aff',hp:8.5,damage:2.35,speed:1.20,size:2.32,armor:.12,cap:.48,cooldown:.87},
 {id:'legendary',name:'전설',en:'LEGENDARY',stage:16,color:'#ffc34b',hp:10,damage:2.8,speed:1.24,size:2.52,armor:.16,cap:.54,cooldown:.80},
 {id:'mythic',name:'신화',en:'MYTHIC',stage:25,color:'#ff527d',hp:12,damage:3.4,speed:1.30,size:2.75,armor:.20,cap:.62,cooldown:.72}
]);
const MIDBOSS_SKILLS_V596=Object.freeze({
 crusher:['crush','rush','fault'],
 sentinel:['fan','cross','pools'],
 hunter:['pounce','scissors','needle'],
 omega:['rupture','rush','cross'],
 nemesis:['crush','cross','fan']
});
function midbossRankForStageV596(stage){let rank=MIDBOSS_RANKS_V596[0];for(const q of MIDBOSS_RANKS_V596)if(stage>=q.stage)rank=q;return rank;}
function midbossTitleV596(e){return (e.midRankV596?homeTextV522(e.midRankV596.en,e.midRankV596.name)+' · ':'')+(e.bossName||e.midBaseNameV596||e.eliteName||'MID-BOSS');}
function applyMidbossRankV596(e,profile='crusher'){
 if(!e||e.dead||e.finalBoss||e.midRankV596)return e;
 const rank=midbossRankForStageV596(meta.stage||1),stage=meta.stage||1,sc=campaignStageProfile(stage);
 const cap=4200*rank.cap*hpTempoAt(t)*stageScale*threatMods.hp*routeMods.enemyHp*(sc.bossHp||1);
 e.midBaseNameV596=e.eliteName;e.midRankV596=rank;e.midBoss=true;e.midProfileV596=profile;
 e.hp=e.maxHp=Math.max(e.maxHp,Math.min(e.maxHp*rank.hp,cap));e.dmg*=rank.damage;e.spd*=rank.speed;
 e.eliteArmor=Math.max(e.eliteArmor||0,rank.armor);
 e.midVisualSizeV596=gpuEnemyBaseSizeV426({type:e.type})*rank.size;
 const body={crawler:6.8,runner:5.8,brute:12.5,spitter:8,warden:10,froststalker:8,symbiote:9,embermaw:10}[enemyCombatTypeV596(e)]||10;
 e.r=body*rank.size;e.xp=Math.round((e.xp||52)*(1.5+MIDBOSS_RANKS_V596.indexOf(rank)*.4));
 e.midSkillIndexV596=0;e.midSkillCdV596=1.3;e.midActionV596=null;e.elitePatternCd=999;
 e.eliteName=homeTextV522(rank.en,rank.name)+' · '+e.midBaseNameV596;
 $('bossname').textContent=midbossTitleV596(e);$('bossname').style.color=rank.color;
 return e;
}
// Scheduled encounters rotate their combat identity instead of being an enlarged grunt.
const midAlphaSpawnV596=spawnElite,midSentinelSpawnV596=spawnEliteSpitter,midHunterSpawnV596=spawnEvoHunter,midNemesisSpawnV596=spawnNemesis;
spawnEliteSpitter=function(...args){return applyMidbossRankV596(midSentinelSpawnV596(...args),'sentinel');};
spawnEvoHunter=function(omega=false,...args){return applyMidbossRankV596(midHunterSpawnV596(omega,...args),omega?'omega':'hunter');};
spawnNemesis=function(...args){return applyMidbossRankV596(midNemesisSpawnV596(...args),'nemesis');};
spawnElite=function(...args){
 let e;
 if(upgradeSpawnPermissionV593)e=applyMidbossRankV596(midAlphaSpawnV596(...args),'crusher');
 else{
  const kind=Math.floor(Math.max(0,(meta.stage||1)-3)/3)%4;
  e=kind===1?spawnEliteSpitter():kind===2?spawnEvoHunter(false):kind===3?spawnEvoHunter(true):applyMidbossRankV596(midAlphaSpawnV596(...args),'crusher');
  if(e){e.stageMidV526=true;stageFlowV526.midSpawned=true;}
 }
 return e;
};

// New appearances join ordinary spawns without replacing any existing species.
const speciesEnemyTypeBaseV596=enemyType;
enemyType=function(...args){const type=speciesEnemyTypeBaseV596(...args),entry=Object.entries(NEW_MONSTER_SPECIES_V596).find(([,s])=>s.combatType===type&&(meta.stage||1)>=s.unlock);return entry&&Math.random()<.24?entry[0]:type;};

function enemyIntentV596(e,dt,slowMul,d){
 if(e.dead||e.finalBoss||e.arrivalInvuln||(e.stunned||0)>0)return;
 if(e.midRankV596&&midbossStepV596(e,dt))return;
 if(e.telegraphing||e.dashPrep>0||e.chargePrep>0||e.burst>0)return;
 const type=enemyCombatTypeV596(e),dx=player.x-e.x,dy=player.y-e.y,len=Math.hypot(dx,dy)||1,tx=dx/len,ty=dy/len;
 const ranged=type==='spitter'||type==='froststalker';
 if(ranged){
  const desired=e.elite?220:type==='froststalker'?215:195,near=d<desired-28,far=d>desired+28;
  const radial=near?-1.85:far?.9:0,tangent=(near?.48:.72)*(e.strafe||1),sp=e.spd*slowMul;
  e.vx=(tx*radial-ty*tangent)*sp;e.vy=(ty*radial+tx*tangent)*sp;
  // Try the other lateral direction before existing terrain steering resolves the wall.
  if(terrainHitV418(e.x,e.y,e.x+e.vx*.3,e.y+e.vy*.3,Math.min(e.r,10))){e.strafe=-(e.strafe||1);e.vx=(tx*radial+ty*tangent)*sp;e.vy=(ty*radial-tx*tangent)*sp;}
 }else if(type==='crawler'||type==='brute'||type==='runner'||type==='embermaw'){
  const sp=e.spd*slowMul,weave=type==='runner'?.12*(e.flank||1):0;
  e.vx=(tx-ty*weave)*sp;e.vy=(ty+tx*weave)*sp;
 }
}

let midFieldsV596=[],midCastCountV596=0;
function midLineDistanceV596(x,y,a){const dx=x-a.x,dy=y-a.y,c=Math.cos(a.a),s=Math.sin(a.a),u=dx*c+dy*s,v=-dx*s+dy*c;return u>=-player.r&&u<=a.len+player.r&&Math.abs(v)<=a.w+player.r;}
function midFieldContainsV596(f,x=player.x,y=player.y){
 if(f.shape==='line')return midLineDistanceV596(x,y,f);
 const dx=x-f.x,dy=y-f.y;
 if(dx*dx+dy*dy>(f.r+player.r)**2)return false;
 if(f.shape==='cone'){const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-f.a),Math.cos(Math.atan2(dy,dx)-f.a));return Math.abs(delta)<f.arc;}
 return true;
}
function midAddFieldV596(e,kind,shape,props={}){
 const rank=MIDBOSS_RANKS_V596.indexOf(e.midRankV596),prepare=props.prepare||Math.max(.72,1.05-rank*.04);
 const f={owner:e,kind,shape,x:e.x,y:e.y,r:95,a:Math.atan2(player.y-e.y,player.x-e.x),len:240,w:24,arc:1.0,warn:prepare,maxWarn:prepare,life:.30,damage:e.dmg*1.05,tick:0,hit:false,...props};
 midFieldsV596.push(f);return f;
}
function midbossCastV596(e,kind){
 const rank=MIDBOSS_RANKS_V596.indexOf(e.midRankV596),a=Math.atan2(player.y-e.y,player.x-e.x),grow=1+rank*.06;
 e.midActionV596={kind,left:.9,phase:'warn',a};e.telegraphing='mid_'+kind;e.patternLock=1.0;e.dashCd=e.shot=1.1;
 if(kind==='crush')midAddFieldV596(e,kind,'circle',{r:100*grow,prepare:1.05,damage:e.dmg*1.25});
 else if(kind==='rush'||kind==='pounce'){
  const length=kind==='pounce'?220:250;e.midActionV596.left=kind==='pounce'?.78:.95;
  midAddFieldV596(e,kind,'line',{len:length,w:e.r+7,prepare:e.midActionV596.left,damage:0,dash:true});
 }else if(kind==='fault'||kind==='rupture'){
  e.midActionV596.left=1.05;
  const targets=kind==='rupture'?[-.7,0,.7]:[-.30,0,.30];
  for(const da of targets)midAddFieldV596(e,kind,'circle',{x:e.x+Math.cos(a+da)*145,y:e.y+Math.sin(a+da)*145,r:(kind==='rupture'?62:48)*grow,prepare:1.05,damage:e.dmg*1.05});
 }else if(kind==='cross'){
  e.midActionV596.left=1.0;
  for(const da of [-.33,.33])midAddFieldV596(e,kind,'line',{a:a+da,len:270*grow,w:16+rank*2,prepare:1,damage:e.dmg*1.05});
 }else if(kind==='pools'){
  e.midActionV596.left=1.0;
  for(let i=0;i<3;i++){const da=a+Math.PI/2*(i-1),r=i===1?0:65;midAddFieldV596(e,kind,'circle',{x:clamp(player.x+Math.cos(da)*r,20,WORLD_W-20),y:clamp(player.y+Math.sin(da)*r,20,WORLD_H-20),r:43*grow,prepare:1,life:1.8,damage:e.dmg*.5,pool:true});}
 }else if(kind==='scissors'){
  e.midActionV596.left=.82;
  for(const da of [-.43,.43])midAddFieldV596(e,kind,'cone',{a:a+da,arc:.55,r:130*grow,prepare:.82,damage:e.dmg*1.05});
 }else{
  e.midActionV596.left=.85;midAddFieldV596(e,kind,'cone',{a,arc:kind==='needle'?.32:.65,r:300,prepare:.85,damage:0,volley:true,count:kind==='needle'?3:5+rank*2});
 }
 midCastCountV596++;return e.midActionV596;
}
function midbossStepV596(e,dt){
 if(!e.midRankV596||e.dead||e.finalBoss)return false;
 const q=e.midActionV596;
 if(!q){e.midSkillCdV596-=dt;if(e.midSkillCdV596<=0&&Math.hypot(e.x-player.x,e.y-player.y)<430&&!e.telegraphing){const skills=MIDBOSS_SKILLS_V596[e.midProfileV596];midbossCastV596(e,skills[e.midSkillIndexV596++%skills.length]);}return false;}
 q.left-=dt;e.patternLock=Math.max(e.patternLock||0,.15);e.dashCd=e.shot=Math.max(e.dashCd||0,.3);
 if(q.phase==='warn'){
  // Sentinel winds up while strafing; melee attacks plant their feet clearly.
  if(e.midProfileV596==='sentinel'){e.vx*=.55;e.vy*=.55;}else e.vx=e.vy=0;
  if(q.left<=0){
   if(q.kind==='rush'||q.kind==='pounce'){q.phase='dash';q.left=.58;e.burst=.58;e.chargeA=q.a;e.telegraphing=null;}
   else{q.phase='recover';q.left=.36;e.telegraphing=null;}
  }
 }else if(q.phase==='dash'){
  const sp=e.spd*(q.kind==='pounce'?4.5:4.1);e.vx=Math.cos(q.a)*sp;e.vy=Math.sin(q.a)*sp;
  if(q.left<=0){q.phase='recover';q.left=.4;e.burst=0;e.vx=e.vy=0;}
 }else{
  e.vx*=.2;e.vy*=.2;
  if(q.left<=0){e.midActionV596=null;e.telegraphing=null;e.midSkillCdV596=(2.7+(e.midProfileV596==='sentinel'?.3:0))*e.midRankV596.cooldown;}
 }
 return true;
}
function updateMidFieldsV596(dt){
 for(const f of midFieldsV596){
  if(f.owner.dead){f.expired=true;continue;}
  if(f.warn>0){f.warn-=dt;if(f.warn>0)continue;
   if(f.volley){const e=f.owner;for(let i=0;i<f.count;i++){const a=f.a+(i-(f.count-1)/2)*(f.kind==='needle'?.15:.145);eBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(155+MIDBOSS_RANKS_V596.indexOf(e.midRankV596)*9),vy:Math.sin(a)*(155+MIDBOSS_RANKS_V596.indexOf(e.midRankV596)*9),r:5.5,dmg:e.dmg*.65,life:3,midBossV596:true});}e.shotCount=(e.shotCount||0)+1;f.expired=true;continue;}
   if(!f.dash)particles.push({kind:'bossVfx',asset:'warning_ring',x:f.x,y:f.y,size:f.r*2,spin:.3,life:.30,maxLife:.30});
  }
  f.life-=dt;f.tick-=dt;
  if(f.damage>0&&f.tick<=0&&midFieldContainsV596(f)&&(!f.hit||f.pool)){playerDamage(f.damage);f.hit=true;f.tick=.55;}
  if(f.life<=0)f.expired=true;
 }
 midFieldsV596=midFieldsV596.filter(f=>!f.expired);
}
function drawMidFieldsV596(){
 for(const f of midFieldsV596){
  if(f.owner.dead||!worldCircleVisibleV441(f.x,f.y,Math.max(f.r,f.len),30))continue;
  const warning=f.warn>0,pulse=.5+.5*Math.sin(t*10);ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.shape==='circle'?0:f.a);
  ctx.fillStyle=warning?'rgba(255,34,38,'+(.15+.08*pulse)+')':'rgba(255,28,32,.48)';ctx.strokeStyle=warning?'#ff5b5e':'#ffb3a2';ctx.lineWidth=warning?2:3;ctx.beginPath();
  if(f.shape==='line')ctx.rect(0,-f.w,f.len,f.w*2);
  else if(f.shape==='cone'){ctx.moveTo(0,0);ctx.arc(0,0,f.r,-f.arc,f.arc);ctx.closePath();}
  else ctx.arc(0,0,f.r,0,TAU);
  ctx.fill();ctx.stroke();
  if(!warning&&f.pool&&groundImageV595.naturalWidth){ctx.beginPath();ctx.arc(0,0,f.r,0,TAU);ctx.clip();ctx.globalAlpha=.75;ctx.drawImage(groundImageV595,-f.r,-f.r,f.r*2,f.r*2);}
  ctx.restore();
 }
}

// Cached tinted anatomy creates rising body vapor; no ground ring or body symbol.
const midAuraCacheV596=new WeakMap();let midAuraDrawsV596=0;
function drawMidAuraV596(e){
 const image=renderedEnemy(e),rank=e.midRankV596;if(!image||!rank)return;
 const mip=actorMipV424(image,e.midVisualSizeV596*2);if(!mip?.source)return;
 let colors=midAuraCacheV596.get(mip.source);if(!colors)midAuraCacheV596.set(mip.source,colors=new Map());let tint=colors.get(rank.id);
 if(!tint){tint=document.createElement('canvas');tint.width=mip.w;tint.height=mip.h;const g=tint.getContext('2d');g.drawImage(mip.source,0,0);g.globalCompositeOperation='source-in';g.fillStyle=rank.color;g.fillRect(0,0,tint.width,tint.height);colors.set(rank.id,tint);}
 const clock=feedbackCfg().reducedMotion?0:t,size=e.midVisualSizeV596,sc=size/Math.max(tint.width,tint.height),w=tint.width*sc,h=tint.height*sc;
 ctx.save();ctx.translate(e.x,e.y);ctx.scale(player.x<e.x?-1:1,1);ctx.globalCompositeOperation='screen';
 for(let i=3;i>=0;i--){const phase=(clock*(.6+i*.1)+i*.24)%1,rise=phase*(10+MIDBOSS_RANKS_V596.indexOf(rank)*2),wave=Math.sin(clock*3+i*1.8)*2;ctx.globalAlpha=(1-phase)*(.16+.045*Math.sin(clock*5+i));ctx.drawImage(tint,-w/2-2+wave,-h/2-rise-1,w+4,h+3);}
 ctx.restore();midAuraDrawsV596++;
}
const midDrawBaseV596=drawEnemy;
drawEnemy=function(e,shadowOnly=false){if(!shadowOnly&&e.midRankV596&&!e.dead)drawMidAuraV596(e);return midDrawBaseV596(e,shadowOnly);};
const midWarningBaseV596=drawAttackWarningsV582;
drawAttackWarningsV582=function(...args){const out=midWarningBaseV596(...args);drawMidFieldsV596();return out;};
const midUpdateBaseV596=update;
update=function(dt){const before=t,out=midUpdateBaseV596(dt);if(t>before)updateMidFieldsV596(t-before);const e=enemies.find(e=>!e.dead&&e.midRankV596&&!e.finalBoss);if(e&&!finalBossAlive()){$('bossname').textContent=midbossTitleV596(e);$('bossname').style.color=e.midRankV596.color;}else $('bossname').style.color='';return out;};
const midResetBaseV596=reset,midHomeBaseV596=returnToHome;
reset=function(...args){midFieldsV596=[];return midResetBaseV596(...args);};
returnToHome=function(...args){midFieldsV596=[];$('bossname').style.color='';return midHomeBaseV596(...args);};
window.__EVOLVE_COMBAT_V596__={read:()=>({contactAllTypes:true,contracts:false,species:Object.keys(NEW_MONSTER_SPECIES_V596),ranks:MIDBOSS_RANKS_V596.map(r=>({...r})),casts:midCastCountV596,fields:midFieldsV596.length,auraDraws:midAuraDrawsV596,physical_Galaxy_S23_plus_tested:false})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_COMBAT_V596__.test={rank:midbossRankForStageV596,apply:applyMidbossRankV596,cast:midbossCastV596,contains:midFieldContainsV596,fields:()=>midFieldsV596,stepFields:updateMidFieldsV596,intent:enemyIntentV596,types:NEW_MONSTER_SPECIES_V596,baseType:enemyCombatTypeV596,appearance:enemyAppearanceKeyV516,asset:enemyAppearanceAssetV516,health:()=>enemyHealthVisibilityV592.read(),context:()=>({player,enemies,meta,state,eBullets,step:dt=>update(dt),draw,home:returnToHome,damage:playerDamage,clock:()=>t})};
