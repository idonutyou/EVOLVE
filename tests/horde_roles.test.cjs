const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const env={};vm.createContext(env);vm.runInContext(fs.readFileSync(__dirname+'/../web/horde-roles-v591.js','utf8').split('const hordeSpawnRateBaseV591=')[0],env);
for(const type of ['crawler','brute','runner','embermaw','spitter','froststalker','warden','symbiote']){
 const e={type,burst:0};assert.equal(env.enemyMoveScaleV591(e),.5);assert.equal(env.enemyWarningAllowedV591({owner:e}),false);
 const role=env.enemyAttackRoleV591(e);assert.equal(env.enemyContactAllowedV591(e),true);e.burst=.2;assert.equal(env.enemyContactAllowedV591(e),true);
 for(const flag of ['boss','finalBoss','elite','midBoss','nemesis','worldHotspot']){const major={...e,[flag]:true};assert.equal(env.enemyMoveScaleV591(major),1);assert.equal(env.enemyContactAllowedV591(major),true);assert.equal(env.enemyWarningAllowedV591({owner:major}),true);}
}
assert.equal(env.enemyWarningAllowedV591({}),true);assert.equal(env.enemyWarningAllowedV591({owner:null}),true);
for(const delay of [.28,.7,1.2]){assert.equal(env.hordeSpawnDelayV591(delay,false),delay/1.95);assert.equal(env.hordeSpawnDelayV591(delay,true),delay);}
assert.equal(env.hordeDensityV591(100,600,false),195);assert.equal(env.hordeDensityV591(500,600,false),600);assert.equal(env.hordeDensityV591(100,600,true),100);
console.log(JSON.stringify({ok:true,checks:['all eight ordinary types move at half speed','ranged and support types cause contact damage','charge types also cause contact damage while walking','ordinary warning geometry is hidden','boss and named encounter behavior stays intact','additional 30% ambient spawn rate and population within the existing hard limit']}));
