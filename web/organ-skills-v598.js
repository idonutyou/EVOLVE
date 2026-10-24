// WEB-31: equipped ARM is always available; three learned organs grow within this run.
const organNamesV598={arm:['팔','ARM'],shell:['외피','SHELL'],tail:['꼬리','TAIL'],mouth:['입','MOUTH']};
const organSlotsV598={shell:'skin',tail:'tail',mouth:'head'};
const organDefaultsV598={shell:'spike',tail:'whip',mouth:'spit'};
const organStatKeysV598=['spikeDamage','spikeCount','spikePierce','spikeHaste','spikeRange','whipDamage','whipHaste','whipRange','whipArc','whipPush','spitDamage','spitCount','spitPierce','spitHaste','spitRange'];
const organStatCapsV598={spikeCount:11,spikePierce:8,spikeRange:5,spikeHaste:1.34/.14-1,whipRange:230/82-1,whipArc:235,whipPush:400/82-1,whipHaste:1.48/.22-1,spitCount:11,spitPierce:8,spitRange:1800/275-1,spitHaste:1.42/.14-1};
const organRunV598={opening:false,openingChosen:false,projectiles:[],whips:[],breaths:[],dots:new Map(),stats:{},cooldowns:{},casts:{},hits:{},serial:0,art:new Map(),icons:new Map()};
function organClearV598(){
 organRunV598.opening=organRunV598.openingChosen=false;organRunV598.projectiles.length=organRunV598.whips.length=organRunV598.breaths.length=0;organRunV598.dots.clear();
 organRunV598.stats=Object.fromEntries(organStatKeysV598.map(k=>[k,0]));organRunV598.cooldowns={shell:.18,tail:.18,mouth:.18};organRunV598.casts={shell:0,tail:0,mouth:0};organRunV598.hits={shell:0,tail:0,mouth:0};organRunV598.serial=0;
}
organClearV598();
function organVariantV598(organ){
 const slot=organSlotsV598[organ],item=partsItemV523(partsStateV523.worn[slot]),variant=item?.skillVariantsV598?.[organ];
 return ORGAN_SKILL_MODEL_V598.profiles[variant]?.organ===organ?variant:organDefaultsV598[organ];
}
function organSpecV598(organ){return ORGAN_SKILL_MODEL_V598.spec(organ,state[organ]||0,organRunV598.stats,organVariantV598(organ));}
function organBodyPointV598(kind){
 const local=kind==='mouth'?{x:13,y:20}:kind==='tail'?{x:-7,y:-12}:{x:-2,y:-3},scale=playerArtV586.displaySize/96;
 const pose=playerFacingV587(playerBodyAngleV590(),playerMotionV586.facing),c=Math.cos(pose.rotation),s=Math.sin(pose.rotation);
 return {x:player.x+(local.x*pose.facing*c-local.y*s)*scale,y:player.y+(local.x*pose.facing*s+local.y*c)*scale};
}
function organNearestV598(x,y,range,exclude=null){
 let best=null,distance=Infinity;enemyEachCandidateCircleV425(x,y,range+36,e=>{
  if(!playerTargetV586(e)||exclude?.has(e))return;const d=Math.hypot(e.x-x,e.y-y);if(d>range+(e.r||0)||d>=distance||terrainHitV418(x,y,e.x,e.y,1))return;best=e;distance=d;
 });return best;
}
function organElementV598(e,s,damage){
 if(s.element==='ice')e.slow=Math.max(e.slow||0,1.15);
 if((s.element==='poison'||s.element==='fire')&&!e.dead){const old=organRunV598.dots.get(e);organRunV598.dots.set(e,{left:2,clock:old?.clock||0,dps:Math.max(old?.dps||0,damage*.12),organ:s.organ});}
}
function organHitV598(e,s,damage){
 if(!playerTargetV586(e))return;const before=e.hp;hurtEnemy(e,damage,s.organ==='shell'?'spike':s.organ==='mouth'?'spit':'tail');
 if(e.hp<before){organRunV598.hits[s.organ]++;organElementV598(e,s,damage);}
}
function organCastV598(organ){
 const s=organSpecV598(organ);if(!s.enabled)return false;
 const origin=organBodyPointV598(organ),range=s.radius||s.range,target=organNearestV598(player.x,player.y,range);if(!target)return false;
 const aim=Math.atan2(target.y-player.y,target.x-player.x);organRunV598.casts[organ]++;const damage=s.damage*coreDamageBoost();
 if(organ==='tail'){
  organRunV598.whips.push({id:++organRunV598.serial,age:0,aim,s:{...s,damage},targets:new Set()});player.tailKick=.35;return true;
 }
 if(s.mode==='breath'){
  organRunV598.breaths.push({id:++organRunV598.serial,age:0,clock:0,aim,s:{...s,damage},origin});player.acidKick=.2;return true;
 }
 const spread=Math.min(.15,1.1/Math.max(1,s.count-1)),assigned=new Set();
 for(let i=0;i<s.count&&organRunV598.projectiles.length<180;i++){
  const tracked=s.mode==='homing'?(organNearestV598(origin.x,origin.y,s.range,assigned)||target):null;if(tracked)assigned.add(tracked);
  const a=Math.atan2((tracked||target).y-origin.y,(tracked||target).x-origin.x)+(i-(s.count-1)/2)*spread;
  organRunV598.projectiles.push({id:++organRunV598.serial,organ,x:origin.x,y:origin.y,angle:a,remaining:s.range,life:s.range/s.speed+.3,hitsLeft:s.hits,hit:new Set(),target:tracked,s:{...s,damage}});
 }
 if(organ==='mouth')player.acidKick=.16;return true;
}
function organProjectileStepV598(p,dt){
 const s=p.s;p.life-=dt;if(p.life<=0||p.remaining<=0)return false;
 if(s.mode==='homing'){
  if(!playerTargetV586(p.target)||p.hit.has(p.target))p.target=organNearestV598(p.x,p.y,p.remaining,p.hit);
  if(p.target){const desired=Math.atan2(p.target.y-p.y,p.target.x-p.x),delta=ORGAN_SKILL_MODEL_V598.angle(desired-p.angle);p.angle+=clamp(delta,-s.turn*dt,s.turn*dt);}
 }
 const distance=Math.min(p.remaining,s.speed*dt),a={x:p.x,y:p.y},b={x:p.x+Math.cos(p.angle)*distance,y:p.y+Math.sin(p.angle)*distance},contacts=[];
 enemyEachCandidateCircleV425((a.x+b.x)/2,(a.y+b.y)/2,distance/2+56,e=>{
  if(!playerTargetV586(e)||p.hit.has(e))return;const contact=ORGAN_SKILL_MODEL_V598.segmentHit(a,b,e,p.organ==='shell'?2.8:4);if(contact===null)return;
  const x=a.x+(b.x-a.x)*contact,y=a.y+(b.y-a.y)*contact;if(!terrainHitV418(a.x,a.y,x,y,1))contacts.push({e,t:contact});
 });
 contacts.sort((x,y)=>x.t-y.t);
 for(const {e}of contacts){if(!playerTargetV586(e))continue;p.hit.add(e);organHitV598(e,s,s.damage);p.hitsLeft--;if(p.hitsLeft<=0)return false;if(e===p.target)p.target=null;}
 if(terrainHitV418(a.x,a.y,b.x,b.y,1))return false;p.x=b.x;p.y=b.y;p.remaining-=distance;return p.remaining>0;
}
function organWhipStepV598(w,dt){
 w.age+=dt;const window=ORGAN_SKILL_MODEL_V598.sweepWindow(w.age,dt,w.s.arc);
 if(window)enemyEachCandidateCircleV425(player.x,player.y,w.s.radius+48,e=>{
  if(!playerTargetV586(e)||w.targets.has(e)||!ORGAN_SKILL_MODEL_V598.sweepHit(player,w.aim,w.s.radius,window,e)||terrainHitV418(player.x,player.y,e.x,e.y,1))return;
  w.targets.add(e);organHitV598(e,w.s,w.s.damage);const a=Math.atan2(e.y-player.y,e.x-player.x),push=w.s.push*(e.finalBoss?.14:e.elite?.38:1);e.kx=(e.kx||0)+Math.cos(a)*push;e.ky=(e.ky||0)+Math.sin(a)*push;
 });return w.age<w.s.duration;
}
function organStepV598(dt){
 if(!(dt>0))return;
 for(const organ of ['shell','tail','mouth']){
  const s=organSpecV598(organ);if(!s.enabled)continue;organRunV598.cooldowns[organ]-=dt;
  if(organRunV598.cooldowns[organ]<=0)organRunV598.cooldowns[organ]=organCastV598(organ)?s.cooldown:.12;
 }
 compactArrayV426(organRunV598.projectiles,p=>organProjectileStepV598(p,dt));compactArrayV426(organRunV598.whips,w=>organWhipStepV598(w,dt));
 compactArrayV426(organRunV598.breaths,b=>{
  b.age+=dt;b.clock-=dt;b.origin=organBodyPointV598('mouth');if(b.clock<=0){b.clock=.12;let hits=0;enemyEachCandidateCircleV425(b.origin.x,b.origin.y,b.s.range+40,e=>{
   if(!playerTargetV586(e)||!ORGAN_SKILL_MODEL_V598.sweepHit(b.origin,b.aim,b.s.range,{lo:-.35,hi:.35},e)||terrainHitV418(b.origin.x,b.origin.y,e.x,e.y,1))return;organHitV598(e,b.s,b.s.damage*.28);if(++hits>=32)return false;
  });}return b.age<.55;
 });
 for(const [e,d]of organRunV598.dots){if(!playerTargetV586(e)){organRunV598.dots.delete(e);continue;}const elapsed=Math.min(dt,d.left);d.left-=elapsed;d.clock+=elapsed;if(d.clock>=.25||d.left<=0){hurtEnemy(e,d.dps*d.clock,d.organ==='shell'?'spike':d.organ==='mouth'?'spit':'tail');d.clock=0;}if(d.left<=0||e.dead)organRunV598.dots.delete(e);}
}
function drawOrganNeedleV598(g,color='#e9ddc1'){
 g.fillStyle=color;g.strokeStyle='#69484a';g.lineWidth=.8;g.beginPath();g.moveTo(12,0);g.lineTo(-7,-3.5);g.lineTo(-3,0);g.lineTo(-7,3.5);g.closePath();g.fill();g.stroke();g.strokeStyle='#fff6dd';g.lineWidth=.6;g.beginPath();g.moveTo(-2,0);g.lineTo(9,0);g.stroke();
}
function drawOrganWhipV598(g,w,preview=false){
 const progress=clamp((w.age-.055)/.285,0,1),angle=w.aim-w.s.arc/2+progress*w.s.arc,root=preview?{x:0,y:0}:organBodyPointV598('tail'),center=preview?{x:0,y:0}:player;
 const tip={x:center.x+Math.cos(angle)*w.s.radius,y:center.y+Math.sin(angle)*w.s.radius},c1={x:center.x+Math.cos(angle-.55)*w.s.radius*.42,y:center.y+Math.sin(angle-.55)*w.s.radius*.42},c2={x:center.x+Math.cos(angle-.25)*w.s.radius*.82,y:center.y+Math.sin(angle-.25)*w.s.radius*.82};
 g.save();g.lineCap='round';g.lineJoin='round';g.globalAlpha*=Math.min(1,Math.max(0,(w.s.duration-w.age)/.07));
 for(const [width,color]of [[7,'#593b41'],[4.5,w.s.color],[1.2,'#f6ecdb']]){g.lineWidth=width;g.strokeStyle=color;g.beginPath();g.moveTo(root.x,root.y);g.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,tip.x,tip.y);g.stroke();}
 // Segmentation belongs to the actual curved tail, not an unrelated circular hit effect.
 for(let i=1;i<=9;i++){const t=i/10,q=1-t,x=q*q*q*root.x+3*q*q*t*c1.x+3*q*t*t*c2.x+t*t*t*tip.x,y=q*q*q*root.y+3*q*q*t*c1.y+3*q*t*t*c2.y+t*t*t*tip.y;g.fillStyle='#905f62';g.beginPath();g.arc(x,y,1.8*(1-t*.5),0,TAU);g.fill();}
 g.translate(tip.x,tip.y);g.rotate(angle);g.scale(.75,.75);drawOrganNeedleV598(g,w.s.color);g.restore();
}
function drawOrganAttacksV598(){
 for(const p of organRunV598.projectiles){if(!worldCircleVisibleV441(p.x,p.y,14,20))continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);if(p.organ==='shell')drawOrganNeedleV598(ctx,p.s.color);else{ctx.fillStyle=p.s.color;ctx.strokeStyle='#6e8779';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(0,0,6,3.6,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#f4fff1';ctx.beginPath();ctx.ellipse(1,-1,2.4,1,0,0,TAU);ctx.fill();}ctx.restore();}
 for(const w of organRunV598.whips)drawOrganWhipV598(ctx,w);
 for(const b of organRunV598.breaths){ctx.save();ctx.translate(b.origin.x,b.origin.y);ctx.rotate(b.aim);const fade=1-b.age/.55,g=ctx.createLinearGradient(0,0,b.s.range,0);g.addColorStop(0,b.s.color+'99');g.addColorStop(1,b.s.color+'00');ctx.fillStyle=g;ctx.globalAlpha=fade;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,b.s.range,-.35,.35);ctx.closePath();ctx.fill();ctx.restore();}
}
const organLearnNamesV598={shell:['가시','SPIKES'],tail:['채찍','WHIP'],mouth:['침 뱉기','SPIT']};
const organNewCardsV598=[];
for(const organ of ['shell','tail','mouth'])organNewCardsV598.push({id:organ+'_learn',organ,group:organ,row:3,learn:true,name:organLearnNamesV598[organ],base:.1,apply:()=>{},lines:()=>[upgradeTextV593('Lv.0 → Lv.1','Lv.0 → Lv.1'),upgradeTextV593(organ==='shell'?'유도 가시 1개':organ==='tail'?'휩쓸기 · 밀치기':'침 1개 발사',organ==='shell'?'1 homing spike':organ==='tail'?'Sweep · knockback':'1 spit projectile')]});
for(const [organ,prefix,defs]of [
 ['shell','spike',[['damage','강한 가시','SHARP SPIKES','공격력','Damage',.1,'percent'],['count','다중 가시','MULTISPIKE','발사 수','Projectiles',1,'count'],['pierce','관통 가시','PIERCING SPIKES','관통','Pierce',1,'count'],['haste','빠른 가시','RAPID SPIKES','발사 속도','Fire rate',.1,'percent'],['range','긴 가시','LONG SPIKES','사거리','Range',.12,'percent']]],
 ['tail','whip',[['damage','강한 채찍','HEAVY WHIP','공격력','Damage',.1,'percent'],['haste','빠른 채찍','QUICK WHIP','공격 속도','Attack speed',.1,'percent'],['range','긴 채찍','LONG WHIP','범위','Range',.12,'percent'],['arc','넓은 채찍','WIDE WHIP','공격 각도','Arc',30,'degrees'],['push','밀치는 채찍','REPELLING WHIP','밀치기','Knockback',.15,'percent']]],
 ['mouth','spit',[['damage','강한 침','POWER SPIT','공격력','Damage',.1,'percent'],['count','다중 침','MULTISPIT','발사 수','Projectiles',1,'count'],['pierce','관통 침','PIERCING SPIT','관통','Pierce',1,'count'],['haste','빠른 침','RAPID SPIT','발사 속도','Fire rate',.1,'percent'],['range','긴 사거리','LONG SPIT','사거리','Range',.12,'percent']]]
])for(const [key,ko,en,label,labelEn,base,unit]of defs)organNewCardsV598.push({id:prefix+'_'+key,organ,group:organ,row:3,name:[ko,en],organStat:prefix+key[0].toUpperCase()+key.slice(1),base,count:unit==='count',unit,label:[label,labelEn]});
organNewCardsV598.push(...[
 {id:'bare_damage',name:['강한 찌르기','HEAVY STAB'],stat:'bladeDamage',label:['공격력','Damage'],base:.1,unit:'percent'},
 {id:'bare_haste',name:['빠른 찌르기','QUICK STAB'],stat:'bladeHaste',label:['공격 속도','Attack speed'],base:.1,unit:'percent'},
 {id:'bare_range',name:['긴 찌르기','LONG STAB'],stat:'bladeRange',label:['범위','Range'],base:.1,unit:'percent'}
].map(c=>({...c,organ:'arm',group:'bare',row:1})));
for(const c of UPGRADE_CARDS_V593)if(c.group==='gun'||c.group==='blade')c.organ='arm';
UPGRADE_CARDS_V593.push(...organNewCardsV598);
const organApplyBaseV598=upgradeApplyV593,organLinesBaseV598=upgradeLinesV593,organPartBaseV598=upgradePartV593;
const organValueBaseV598=upgradeValueV593;
upgradeValueV593=function(c,tier){const value=organValueBaseV598(c,tier),cap=organStatCapsV598[c.organStat];return cap===undefined?value:Math.min(value,Math.max(0,cap-organRunV598.stats[c.organStat]));};
upgradePartV593=function(c){return c.organ?upgradeTextV593(...organNamesV598[c.organ]):organPartBaseV598(c);};
upgradeLinesV593=function(c,tier){
 if(c.organStat){const n=upgradeValueV593(c,tier);return [upgradeTextV593(...c.label)+' +'+(c.unit==='percent'?upgradePercentV593(n):upgradeNumberV593(n)+(c.unit==='degrees'?'°':''))];}
 return organLinesBaseV598(c,tier);
};
upgradeApplyV593=function(c,tier){
 if(c.organ&&c.organ!=='arm'){
  if(!state[c.organ])state[c.organ]=1;else if(!c.learn)state[c.organ]=Math.min(5,state[c.organ]+1);
  organRunV598.cooldowns[c.organ]=Math.min(organRunV598.cooldowns[c.organ]||0,.15);
 }
 if(c.organStat){organRunV598.stats[c.organStat]+=upgradeValueV593(c,tier);upgradeRunV593.selected++;upgradeRunV593.taken[c.id]=(upgradeRunV593.taken[c.id]||0)+1;upgradeRunV593.highest[c.group]=Math.max(upgradeRunV593.highest[c.group]||0,tier);}
 else{organApplyBaseV598(c,tier);if(c.learn){const prefix=c.organ==='shell'?'spike':c.organ==='tail'?'whip':'spit';organRunV598.stats[prefix+'Damage']+=.1*(UPGRADE_RARITIES_V593[tier].mult-1);}}
 if(organRunV598.opening){organRunV598.opening=false;organRunV598.openingChosen=true;}
};
upgradePoolV593=function(){
 const mode=armItemModeV589();return UPGRADE_CARDS_V593.filter(c=>{
  if(c.available&&!c.available()||c.id.endsWith('_equip'))return false;
  if(c.organStat&&organStatCapsV598[c.organStat]!==undefined&&organRunV598.stats[c.organStat]>=organStatCapsV598[c.organStat]-1e-8)return false;
  if(c.organ==='mouth'&&organSpecV598('mouth').mode==='breath'&&['spitCount','spitPierce'].includes(c.organStat))return false;
  if(c.organ==='arm')return state.arm>0&&(mode==='cannon'?c.group==='gun':mode==='blades'?c.group==='blade':c.group==='bare');
  if(c.organ)return c.learn?!(state[c.organ]>0):state[c.organ]>0;
  return !organRunV598.opening;
 });
};
chooseLevelPicks=function(){
 const pool=upgradePoolV593(),families=new Map();for(const c of pool){const key=c.organ||c.group;if(!families.has(key))families.set(key,[]);families.get(key).push(c);}
 const keys=[...families.keys()],selected=[];
 // An equipped-arm upgrade stays available at entry, alongside two different organs.
 if(organRunV598.opening&&families.has('arm'))selected.push('arm');
 while(keys.length&&selected.length<3){const key=keys.splice(Math.floor(Math.random()*keys.length),1)[0];if(!selected.includes(key))selected.push(key);}
 return selected.map(key=>{const options=families.get(key),c=options[Math.floor(Math.random()*options.length)],tier=upgradeRollV593();return {kind:c.id,card:c,tier,title:()=>upgradeTextV593(...c.name),apply:()=>upgradeApplyV593(c,tier)};});
};
function organCardArtV598(c,tier){
 if(!c.organ||c.organ==='arm')return skinArtV594(c.row,tier);
 const key=c.organ+':'+tier;if(organRunV598.art.has(key))return organRunV598.art.get(key);
 const canvas=skinCanvasV594(320,320),g=canvas.getContext('2d'),color=UPGRADE_RARITIES_V593[tier].color;g.translate(160,160);g.shadowColor=color;g.shadowBlur=tier*3;
 if(c.organ==='shell'){g.rotate(-.7);g.scale(8,8);drawOrganNeedleV598(g);}
 else if(c.organ==='tail'){g.scale(1.4,1.4);drawOrganWhipV598(g,{age:.25,aim:-.25,s:{arc:2.4,radius:83,duration:.42,color:'#e5d2be'}},true);}
 else{g.rotate(-.6);g.fillStyle='#d8e9d3';g.strokeStyle='#819580';g.lineWidth=2;g.beginPath();g.moveTo(-60,0);g.bezierCurveTo(-25,-5,20,-45,50,-25);g.bezierCurveTo(100,15,0,55,-60,0);g.fill();g.stroke();g.fillStyle='#f3fff0';g.beginPath();g.ellipse(35,-10,14,5,-.4,0,TAU);g.fill();}
 organRunV598.art.set(key,canvas);return canvas;
}
function organCardIconV598(c,tier){
 if(!c.organ||c.organ==='arm')return skinIconV594(c.group==='bare'?'blade':c.group,tier);
 const key=c.organ+':'+tier;if(organRunV598.icons.has(key))return organRunV598.icons.get(key);
 const canvas=skinCanvasV594(40,40),g=canvas.getContext('2d');g.strokeStyle=UPGRADE_RARITIES_V593[tier].color;g.lineWidth=2;g.lineCap='round';g.lineJoin='round';g.beginPath();
 if(c.organ==='shell'){g.moveTo(8,30);g.lineTo(29,5);g.lineTo(24,28);g.lineTo(18,23);g.closePath();}
 else if(c.organ==='tail'){g.moveTo(7,31);g.bezierCurveTo(35,36,37,8,20,7);g.bezierCurveTo(5,6,12,23,24,17);}
 else{g.moveTo(20,5);g.bezierCurveTo(17,14,8,20,8,25);g.bezierCurveTo(8,39,32,39,32,25);g.bezierCurveTo(32,20,23,13,20,5);}
 g.stroke();organRunV598.icons.set(key,canvas);return canvas;
}
const organDockBaseV598=updateRenderedDock;
updateRenderedDock=function(){
 for(const el of document.querySelectorAll('#parts .part')){
  const organ=el.dataset.kind,level=state[organ]||0,icon=el.querySelector('.partIcon'),name=el.querySelector('.partName');
  if(organ==='arm'){
   const mode=armItemModeV589(),key=mode==='bare'?partKey('arm',level):'arm_items/'+mode;if(icon.dataset.asset!==key){icon.dataset.asset=key;icon.innerHTML='<img alt="" src="'+ASSET_SRC[key]+'">';}
  }else if(icon.dataset.asset!==organ){icon.dataset.asset=organ;icon.replaceChildren();const c=document.createElement('canvas');skinPaintCanvasV594(c,organCardArtV598({organ},0));icon.appendChild(c);}
  icon.style.opacity=level>0?'1':'.32';name.textContent=upgradeTextV593(...organNamesV598[organ]);el.setAttribute('aria-label',name.textContent+' Lv.'+level);
 }
};
const organUpdateBaseV598=update;
update=function(dt){const active=running&&!paused&&!choosing&&!rewardChoosing&&!ended,before=t,result=organUpdateBaseV598(dt);if(active&&running&&!ended&&t>before&&!choosing&&!rewardChoosing)organStepV598(t-before);return result;};
const organDrawBaseV598=drawPlayer;
drawPlayer=function(shadowOnly=false){const result=organDrawBaseV598(shadowOnly);if(!shadowOnly)drawOrganAttacksV598();return result;};
function startOrganRunV598(){selectedStartWeapon='arm';reset();return true;}
const organResetBaseV598=reset;
reset=function(...args){
 const result=organResetBaseV598(...args);organClearV598();Object.assign(state,{arm:1,shell:0,mouth:0,tail:0,wing:0,leg:0});selectedStartWeapon='arm';
 organRunV598.opening=true;showLevelUp();updateHUD(true);return result;
};
const organHomeBaseV598=returnToHome;
returnToHome=function(...args){organClearV598();return organHomeBaseV598(...args);};
const organRenderBaseV598=renderLevelChoices;
renderLevelChoices=function(...args){const result=organRenderBaseV598(...args);$('levelPanel').dataset.organOpening=String(organRunV598.opening);for(const b of $('cards').querySelectorAll('.card')){const c=UPGRADE_CARDS_V593.find(c=>c.id===b.dataset.kind);b.dataset.organ=c?.organ||c?.group||'';}if(organRunV598.opening){const h=$('levelPanel').querySelector('.levelHead');h.querySelector('h2').textContent=upgradeTextV593('스킬 선택','CHOOSE SKILL');h.querySelector('p').textContent=upgradeTextV593('강화 1개 선택','CHOOSE 1 UPGRADE');}return result;};
const organUpgradeResetV598=upgradeResetV593;
upgradeResetV593=function(){const result=organUpgradeResetV598();organClearV598();return result;};
window.__EVOLVE_ORGAN_SKILLS_V598__={
 read:()=>({version:598,opening:organRunV598.opening,openingChosen:organRunV598.openingChosen,levels:Object.fromEntries(Object.keys(organNamesV598).map(k=>[k,state[k]||0])),equippedArm:partsStateV523.worn.arm,armMode:armItemModeV589(),stats:{...organRunV598.stats},casts:{...organRunV598.casts},hits:{...organRunV598.hits},projectiles:organRunV598.projectiles.length,whips:organRunV598.whips.length,variants:Object.fromEntries(Object.keys(organSlotsV598).map(k=>[k,organVariantV598(k)])),physical_Galaxy_S23_plus_tested:false}),
 variants:()=>Object.fromEntries(Object.entries(ORGAN_SKILL_MODEL_V598.profiles).map(([id,v])=>[id,{...v}]))
};
if(new URLSearchParams(location.search).get('evolveQA')==='1'){
 window.__EVOLVE_ORGAN_SKILLS_V598__.test={spec:organSpecV598,step:organStepV598,cast:organCastV598,clear:organClearV598,projectiles:()=>organRunV598.projectiles,whips:()=>organRunV598.whips,geometry:ORGAN_SKILL_MODEL_V598,canChoose:choiceInputReady,context:()=>({player,state,enemies,stats:organRunV598.stats,cooldowns:organRunV598.cooldowns,grid:rebuildEnemyGridV424,draw,home:returnToHome,lineClear:(a,b,r=1)=>!terrainHitV418(a.x,a.y,b.x,b.y,r)}),setItemVariant:(itemId,organ,variant)=>{const item=partsItemV523(itemId),p=ORGAN_SKILL_MODEL_V598.profiles[variant];if(!item||p?.organ!==organ||item.slot!==organSlotsV598[organ])throw Error('Invalid item/organ variant');item.skillVariantsV598={...item.skillVariantsV598,[organ]:variant};}};
 const q=window.__EVOLVE_UPGRADE_CARDS_V593__.test;q.cards=UPGRADE_CARDS_V593;q.pool=()=>upgradePoolV593();q.apply=(id,tier=0)=>{const c=UPGRADE_CARDS_V593.find(c=>c.id===id);if(!c)throw Error('Unknown card');upgradeApplyV593(c,tier);};q.lines=(c,tier)=>upgradeLinesV593(c,tier);q.value=(c,tier)=>upgradeValueV593(c,tier);q.reset=()=>upgradeResetV593();
}
