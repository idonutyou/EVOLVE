// WEB-24: slower, denser ordinary hordes with one consistent combat role per type.
const HORDE_RULES_V591=Object.freeze({movementMultiplier:.5,spawnMultiplier:1.95,fieldSpreadSeconds:1.56,fieldLifeSeconds:2.36,stageLevelCap:null});
function ordinaryEnemyV591(e){return !!e&&!e.boss&&!e.finalBoss&&!e.elite&&!e.midBoss&&!e.nemesis&&!e.worldHotspot;}
function enemyMoveScaleV591(e){return ordinaryEnemyV591(e)?HORDE_RULES_V591.movementMultiplier:1;}
function enemyAttackRoleV591(e){
 if(!ordinaryEnemyV591(e))return 'major';
 if(e.type==='spitter'||e.type==='froststalker')return 'ranged';
 if(e.type==='runner'||e.type==='embermaw')return 'charge';
 if(e.type==='warden'||e.type==='symbiote')return 'support';
 return 'melee';
}
function enemyContactAllowedV591(e){return !!e&&!e.dead;}
function enemyWarningAllowedV591(z){return !ordinaryEnemyV591(z?.owner);}
function hordeSpawnDelayV591(delay,major){return major?delay:delay/HORDE_RULES_V591.spawnMultiplier;}
function hordeDensityV591(density,hard,major){return major?density:Math.min(hard,Math.round(Math.round(density*1.5)*1.3));}

const hordeSpawnRateBaseV591=spawnRate,hordeDensityBaseV591=combatDensityCap,hordeWaveBaseV591=stageWaveDefV526;
function hordeMajorActiveV591(){return enemies.some(e=>!e.dead&&(e.finalBoss||e.elite||e.nemesis));}
spawnRate=function(...args){return hordeSpawnDelayV591(hordeSpawnRateBaseV591(...args),hordeMajorActiveV591());};
combatDensityCap=function(...args){return hordeDensityV591(hordeDensityBaseV591(...args),runtimeCaps().enemyHard,hordeMajorActiveV591());};
stageWaveDefV526=function(...args){const def=hordeWaveBaseV591(...args);return {...def,make:()=>def.make().map(([type,count])=>[type,Math.ceil(Math.ceil(count*1.5)*1.3)])};};
window.__EVOLVE_HORDE_ROLES_V591__={read:()=>({...HORDE_RULES_V591,ordinaryWarnings:false,roles:{crawler:'melee',brute:'melee',runner:'charge',embermaw:'charge',spitter:'ranged',froststalker:'ranged',warden:'support',symbiote:'support'},majorEncounterUnchanged:true,spawnDelay:spawnRate(),baselineSpawnDelay:hordeSpawnRateBaseV591(),density:combatDensityCap(),baselineDensity:hordeDensityBaseV591(),hardLimit:runtimeCaps().enemyHard,level:player.level,levelLimited:stageLevelLimitedV521(),physical_Galaxy_S23_plus_tested:false})};
if(new URLSearchParams(location.search).get('evolveQA')==='1')window.__EVOLVE_HORDE_ROLES_V591__.test={role:enemyAttackRoleV591,contact:enemyContactAllowedV591,speedScale:enemyMoveScaleV591,warning:enemyWarningAllowedV591,wave:index=>({baseline:hordeWaveBaseV591(index).make(),current:stageWaveDefV526(index).make()}),xp:addXP,need:xpNeedForLevel,context:()=>({player,enemies,eBullets,telegraphs,biomeHazards,drops,state,rebuild:rebuildEnemyGridV424,step:dt=>update(dt),draw,paused:()=>paused,choosing:()=>choosing,clock:()=>t})};
