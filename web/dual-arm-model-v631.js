// EVOLVE dual-arm equipment model. The existing save key and all non-arm items
// remain unchanged; the caller decides when to persist an explicit equip action.
(function(){
 'use strict';
 const slotLayout=Object.freeze([
  {id:'arm1',saveKey:'arm',catalogSlot:'arm',side:0,ko:'팔 1',en:'ARM 1'},
  {id:'head',saveKey:'head',catalogSlot:'head',ko:'머리',en:'HEAD'},
  {id:'core',saveKey:'skin',catalogSlot:'skin',ko:'코어',en:'CORE'},
  {id:'arm2',saveKey:'arm2',catalogSlot:'arm',side:1,ko:'팔 2',en:'ARM 2'},
  {id:'feet',saveKey:'legs',catalogSlot:'legs',ko:'발',en:'FEET'},
  {id:'tail',saveKey:'tail',catalogSlot:'tail',ko:'꼬리',en:'TAIL'}
 ].map(Object.freeze));
 const keyByArm=Object.freeze({arm1:'arm',arm2:'arm2'});
 const sideByArm=Object.freeze({arm1:0,arm2:1});
 const isRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 function cleanArm(id,isArm){return typeof id==='string'&&isArm(id)?id:null;}
 // Old arm equipment was drawn as a pair. Restore both sides for old saves,
 // but preserve an explicitly empty arm2 on every subsequent load.
 // This function never writes to storage or mutates the old save.
 function migrate(saved,isArm){
  if(typeof isArm!=='function')throw new TypeError('An arm-item validator is required');
  const old=isRecord(saved)?saved:{},worn=isRecord(old.worn)?old.worn:{};
  const arm=cleanArm(worn.arm,isArm);
  const hasArm2=Object.prototype.hasOwnProperty.call(worn,'arm2');
  const arm2=hasArm2?cleanArm(worn.arm2,isArm):arm;
  return {...old,worn:{...worn,arm,arm2}};
 }
 function setArm(saved,slot,id,isArm){
  if(!Object.prototype.hasOwnProperty.call(keyByArm,slot))throw new RangeError('Choose arm1 or arm2');
  if(id!==null&&(typeof id!=='string'||!isArm(id)))throw new TypeError('The selected item is not an arm part');
  const next=migrate(saved,isArm);next.worn[keyByArm[slot]]=id;return next;
 }
 function getArm(saved,slot){
  if(!Object.prototype.hasOwnProperty.call(keyByArm,slot))throw new RangeError('Choose arm1 or arm2');
  return isRecord(saved?.worn)?saved.worn[keyByArm[slot]]??null:null;
 }
 // On the original right-facing art, arm1 is the near side. Mirroring changes
 // occlusion only: each equipped item stays attached to its anatomical side.
 function layers(facing,saved){
  const sequence=facing<0?['arm1','arm2']:['arm2','arm1'];
  const entry=slot=>{const itemId=getArm(saved,slot);return itemId===null?null:{slot,side:sideByArm[slot],itemId};};
  return {behind:entry(sequence[0]),front:entry(sequence[1])};
 }
 // A weapon can only attack from a side actually carrying that weapon type.
 // The final engine hookup can call this separately for cannon and blade.
 function attackSide(saved,weaponType,modeOf,lastSide){
  if(typeof modeOf!=='function')throw new TypeError('A weapon-type resolver is required');
  const candidates=['arm1','arm2'].filter(slot=>{const id=getArm(saved,slot);return id!==null&&modeOf(id)===weaponType;});
  if(!candidates.length)return null;
  if(candidates.length===1)return sideByArm[candidates[0]];
  return lastSide===0?1:0;
 }
 const model=Object.freeze({slotLayout,migrate,setArm,getArm,layers,attackSide});
 if(typeof module!=='undefined'&&module.exports)module.exports=model;
 else if(typeof window!=='undefined')window.EVOLVE_DUAL_ARM_MODEL_V631=model;
})();
