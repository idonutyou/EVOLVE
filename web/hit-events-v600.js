/* EVOLVE STEP 04 / V600 — read-only hit event bridge.
 * Installs after every existing game engine module.
 * No damage, collision, crit, stun, knockback, kill or save mutations.
 */
(function installHitEventsV600(){
  'use strict';
  const host=window;
  const previous=host.hurtEnemy;
  if(typeof previous!=='function')throw Error('EVOLVE HIT EVENTS: missing hurtEnemy');
  if(previous.__evolveHitBridgeV600)return;
  const listeners=new Set();
  const qa=new URLSearchParams(location.search).get('evolveQA')==='1';
  const counts={attempts:0,hits:0,shields:0,kills:0,byKind:Object.create(null)};
  let context=null;
  function finite(v,fallback=0){return Number.isFinite(v)?v:fallback;}
  function snapshot(e){return {
    hp:finite(e.hp),barrier:Math.max(0,finite(e.barrier)),
    kx:finite(e.kx),ky:finite(e.ky)
  };}
  const kindOrgan=Object.freeze({arm:'arm',artillery:'arm',spike:'shell',spit:'mouth',acid:'mouth',tail:'tail',arc:'electric',leg:'leg',wing:'wing',core:'core'});
  function dispatch(event){
    if(qa){
      counts.attempts++;
      if(event.type==='hit')counts.hits++;
      if(event.shieldDamage>0)counts.shields++;
      if(event.killed)counts.kills++;
      counts.byKind[event.kind]=(counts.byKind[event.kind]||0)+1;
    }
    for(const listener of listeners){
      try{listener(event);}catch(_err){/* Never alter the original combat result. */}
    }
  }
  function wrappedHurtEnemy(e,damage,kind){
    if(!e||(!qa&&listeners.size===0))return previous.apply(this,arguments);
    const before=snapshot(e),wasDead=!!e.dead;
    const result=previous.apply(this,arguments);
    const after=snapshot(e);
    // No event for invulnerable, invalid or fully rejected calls.
    const healthDamage=Math.max(0,Math.min(Math.max(0,before.hp),before.hp-after.hp));
    const shieldDamage=Math.max(0,before.barrier-after.barrier);
    if(healthDamage<=0&&shieldDamage<=0)return result;
    const source=typeof kind==='string'&&kind?kind:'unknown';
    const metadata=context;
    const event=Object.freeze({
      schema:1, type:healthDamage>0?'hit':'shield', kind:source, organ:kindOrgan[source]||'other',
      attemptedDamage:finite(damage), damage:healthDamage, shieldDamage,
      critical:typeof metadata?.critical==='boolean'?metadata.critical:null,
      // Critical = null means unobserved, not a non-critical hit.
      heavy:typeof metadata?.heavy==='boolean'?metadata.heavy:null,
      x:finite(e.x), y:finite(e.y),
      knockback:Object.freeze({x:after.kx-before.kx,y:after.ky-before.ky}),
      target:Object.freeze({type:String(e.type||''),elite:!!e.elite,boss:!!e.finalBoss,
        hpBefore:before.hp,hpAfter:after.hp}),
      killed:!wasDead&&(!!e.dead||after.hp<=0),
      gameTime:typeof t==='number'&&Number.isFinite(t)?t:null
    });
    dispatch(event);
    return result;
  }
  Object.defineProperty(wrappedHurtEnemy,'__evolveHitBridgeV600',{value:true});
  host.hurtEnemy=wrappedHurtEnemy;
  host.EVOLVE_HIT_EVENTS=Object.freeze({
    schema:1,
    subscribe(fn){if(typeof fn!=='function')throw TypeError('listener must be a function');listeners.add(fn);return ()=>listeners.delete(fn);},
    withContext(meta,fn){if(typeof fn!=='function')throw TypeError('callback must be a function');const prior=context;context=meta;try{return fn();}finally{context=prior;}},
    read(){return {ready:host.hurtEnemy===wrappedHurtEnemy,qa,listenerCount:listeners.size,
      attempts:counts.attempts,hits:counts.hits,shields:counts.shields,kills:counts.kills,
      byKind:{...counts.byKind}};},
    version:'STEP04-V600'
  });
})();