// Species retain independent identities while sharing a combat archetype.
const NEW_MONSTER_SPECIES_V596=Object.freeze({
 ripper:{name:'리퍼',en:'RIPPER',combatType:'runner',unlock:4,hp:.9,speed:1.12,damage:1},
 mauler:{name:'파쇄자',en:'MAULER',combatType:'brute',unlock:7,hp:1.25,speed:.9,damage:1.15},
 bileback:{name:'독낭수',en:'BILEBACK',combatType:'spitter',unlock:9,hp:1.1,speed:1,damage:1.1}
});
function enemyCombatTypeV596(enemy){
 const type=typeof enemy==='string'?enemy:enemy?.type;
 return NEW_MONSTER_SPECIES_V596[type]?.combatType||type;
}
