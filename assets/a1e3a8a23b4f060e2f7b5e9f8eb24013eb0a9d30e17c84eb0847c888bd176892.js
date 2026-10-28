/* Fixed combat geometry and image-backed UI survive transient browser chrome. */
(() => {
 'use strict';
 const root=document.documentElement,state={locked:false,width:0,height:0,viewportWidth:0,copies:0,pending:0,failures:[]};
 const roles=['upgradeFrameV594','upgradeSpriteV593','upgradePartIconV594','upgradeSceneryHeaderV608','upgradeSceneryFooterV608'];
 const mirrors=new WeakMap(),dirty=new Set();let scheduled=false,app;
 function sync(force=false){
  app??=document.getElementById('app');if(!app)return;
  const combat=app.classList.contains('combat');
  if(!combat){root.classList.remove('evolveCombatV611','combatTallV611','combatCompactV611','combatLandscapeV611');state.locked=false;return;}
  if(state.locked&&!force&&Math.abs(innerWidth-state.viewportWidth)<2)return;
  root.classList.remove('evolveCombatV611');const r=app.getBoundingClientRect();
  state.width=r.width;state.height=r.height;state.viewportWidth=innerWidth;state.locked=true;
  root.style.setProperty('--combat-width-v611',r.width+'px');root.style.setProperty('--combat-height-v611',r.height+'px');
  root.classList.toggle('combatTallV611',r.height>640);root.classList.toggle('combatCompactV611',r.height<=640);root.classList.toggle('combatLandscapeV611',innerWidth>innerHeight);root.classList.add('evolveCombatV611');
 }
 function role(c){return roles.find(k=>c.classList.contains(k))||(c.closest('#parts')?'dock':'');}
 async function copy(c){
  const kind=role(c);if(!kind||!c.isConnected||!c.width||!c.height)return;
  if(kind==='upgradeSpriteV593'&&c.closest('.suppliedOrganCardV610'))return;
  let record=mirrors.get(c);if(record&&!dirty.has(c))return;
  dirty.delete(c);state.pending++;
  try{
   const url=c.toDataURL();if(!record){const image=new Image();image.className='rasterCopyV611';image.dataset.rasterRole=kind;image.alt='';image.draggable=false;c.after(image);record={image,revision:0};mirrors.set(c,record);}
   const revision=++record.revision;record.image.src=url;await record.image.decode();if(revision!==record.revision||!c.isConnected)return;
   c.classList.add('rasterBackedCanvasV611');state.copies++;
  }catch(error){state.failures.push(error.message);}finally{state.pending--;}
 }
 function scan(){scheduled=false;sync();for(const c of dirty)if(!c.isConnected)dirty.delete(c);for(const c of document.querySelectorAll('#levelPanel canvas,#parts canvas'))void copy(c);}
 function queue(){if(!scheduled){scheduled=true;requestAnimationFrame(scan);}}
 function install(){
  app=document.getElementById('app');if(!app)return;
  new MutationObserver(records=>{for(const r of records){if(r.type==='attributes'&&r.target.tagName==='CANVAS')dirty.add(r.target);else if(r.type==='attributes'&&r.target.id==='levelPanel')for(const c of r.target.querySelectorAll('canvas'))dirty.add(c);}queue();}).observe(app,{subtree:true,childList:true,attributes:true,attributeFilter:['width','height','data-upgrade-language','data-upgrade-scenery-ready']});
  new MutationObserver(()=>{sync();queue();}).observe(app,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',()=>{sync();queue();},{passive:true});document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement&&(!state.locked||innerWidth!==state.viewportWidth||innerHeight>state.height+2))sync(true);queue();});queue();
 }
 window.__EVOLVE_FIXED_VIEWPORT_V611__={sync,refreshText:()=>{for(const e of document.querySelectorAll('#levelPanel .upgradeNameV593,#levelPanel .upgradeStatsV593>div,#levelPanel .upgradeRarityV593,#levelPanel .upgradePartV593 span,.upgradeRerollLabelV608,.upgradeRerollCountV608'))e.replaceChildren(document.createTextNode(e.textContent));queue();},read:()=>({...state}),test:new URLSearchParams(location.search).get('evolveQA')==='1'?{recapture:()=>sync(true)}:undefined};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
