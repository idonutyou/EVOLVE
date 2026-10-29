'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../web/dual-arm-model-v631.js');
const arm=id=>['arm_cannon','arm_blades','arm_lances','arm_lash'].includes(id);
const mode=id=>({arm_cannon:'cannon',arm_blades:'blades'}[id]||'unsupported');

test('six visible slots retain existing save/catalog identifiers',()=>{
 assert.deepEqual(model.slotLayout.map(x=>x.id),['arm1','head','core','arm2','feet','tail']);
 assert.deepEqual(model.slotLayout.map(x=>x.saveKey),['arm','head','skin','arm2','legs','tail']);
 assert.equal(model.slotLayout[0].catalogSlot,'arm');assert.equal(model.slotLayout[3].catalogSlot,'arm');
});
test('legacy paired arms migrate in memory without changing the input or other saved parts',()=>{
 const old={schema:1,worn:{arm:'arm_cannon',head:'head_sensor',skin:'skin_bastion',legs:'legs_phase',back:'back_neural',tail:'tail_spine'},filter:'all',sort:'rank'};
 const before=JSON.stringify(old),next=model.migrate(old,arm);
 assert.equal(JSON.stringify(old),before);assert.equal(next.worn.arm,'arm_cannon');assert.equal(next.worn.arm2,'arm_cannon');
 for(const key of ['head','skin','legs','back','tail'])assert.equal(next.worn[key],old.worn[key]);
 assert.equal(next.schema,1);assert.equal(next.sort,'rank');
});
test('an explicitly empty second arm stays empty after restore',()=>{
 const save={schema:1,worn:{arm:'arm_cannon',arm2:null,back:'back_neural'}};
 const next=model.migrate(save,arm);assert.equal(next.worn.arm,'arm_cannon');assert.equal(next.worn.arm2,null);assert.equal(next.worn.back,'back_neural');
});
test('arms can be equipped, changed, or removed independently',()=>{
 const initial={schema:1,worn:{arm:null,arm2:null,head:'head_sensor'}};
 const one=model.setArm(initial,'arm1','arm_cannon',arm);assert.equal(one.worn.arm,'arm_cannon');assert.equal(one.worn.arm2,null);
 const two=model.setArm(one,'arm2','arm_blades',arm);assert.equal(two.worn.arm,'arm_cannon');assert.equal(two.worn.arm2,'arm_blades');
 const onlyTwo=model.setArm(two,'arm1',null,arm);assert.equal(onlyTwo.worn.arm,null);assert.equal(onlyTwo.worn.arm2,'arm_blades');
 const empty=model.setArm(onlyTwo,'arm2',null,arm);assert.equal(empty.worn.arm,null);assert.equal(empty.worn.arm2,null);
 assert.equal(initial.worn.arm,null);assert.equal(two.worn.head,'head_sensor');
 assert.throws(()=>model.setArm(initial,'arm2','head_sensor',arm),TypeError);
});
test('the arm behind/in front switches with facing, including a single equipped arm',()=>{
 const both={worn:{arm:'arm_cannon',arm2:'arm_blades'}};
 let x=model.layers(1,both);assert.equal(x.behind.slot,'arm2');assert.equal(x.front.slot,'arm1');assert.equal(x.front.side,0);
 x=model.layers(-1,both);assert.equal(x.behind.slot,'arm1');assert.equal(x.front.slot,'arm2');assert.equal(x.front.side,1);
 const one={worn:{arm:null,arm2:'arm_blades'}};
 x=model.layers(1,one);assert.equal(x.front,null);assert.equal(x.behind.slot,'arm2');
 x=model.layers(-1,one);assert.equal(x.behind,null);assert.equal(x.front.slot,'arm2');
});
test('attacks never select an empty or differently equipped side',()=>{
 const one={worn:{arm:'arm_cannon',arm2:null}};
 assert.equal(model.attackSide(one,'cannon',mode,0),0);assert.equal(model.attackSide(one,'blades',mode,0),null);
 const mixed={worn:{arm:'arm_cannon',arm2:'arm_blades'}};
 assert.equal(model.attackSide(mixed,'cannon',mode,1),0);assert.equal(model.attackSide(mixed,'blades',mode,0),1);
 const both={worn:{arm:'arm_cannon',arm2:'arm_cannon'}};
 assert.equal(model.attackSide(both,'cannon',mode,0),1);assert.equal(model.attackSide(both,'cannon',mode,1),0);
});
