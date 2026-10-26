/* EVOLVE STEP 04 / V601 — observable hit events inside game engine.
 * The engine's lexical hurtEnemy calls a transparent wrapper; this module stores
 * subscribers and QA counters only. Original combat math is never changed.
 */
(function installHitEventsV601(){
  'use strict';
  const host=window;
  if(host.EVOLVE_HIT_EVENTS?.version==='STEP04-V601')return;
  const listeners=new Set();
  const qa=new URLSearchParams(location.search).get('evolveQA')==='1';
  const counts={attempts:0,hits:0,shields:0,kills:0,byKind:Object.create(null)};
  const organByKind=Object.freeze({arm:'arm',artillery:'arm',spike:'shell',spit:'mouth',acid:'mouth',tail:'tail',arc:'electric',leg:'leg',wing:'wing',core:'core'});
  let context=null;
  function finite(value,fallback=0){return Number.isFinite(value)?value:fallback;}
  const api={
    schema:1,version:'STEP04-V601',
    _active(){return qa||listeners.size>0;},
    _record(enemy,damage,kind,before,gameTime){
      const hp=finite(enemy.hp),barrier=Math.max(0,finite(enemy.barrier));
      const healthDamage=Math.max(0,Math.min(Math.max(0,before.hp),before.hp-hp));
      const shieldDamage=Math.max(0,before.barrier-barrier);
      if(healthDamage<=0&&shieldDamage<=0)return;
      const source=typeof kind==='string'&&kind?kind:'unknown';
      const meta=context;
      const event=Object.freeze({
        schema:1,type:healthDamage>0?'hit':'shield',kind:source,organ:organByKind[source]||'other',
        attemptedDamage:finite(damage),damage:healthDamage,shieldDamage,
        critical:typeof meta?.critical==='boolean'?meta.critical:null,
        heavy:typeof meta?.heavy==='boolean'?meta.heavy:null,
        x:finite(enemy.x),y:finite(enemy.y),
        knockback:Object.freeze({x:finite(enemy.kx)-before.kx,y:finite(enemy.ky)-before.ky}),
        target:Object.freeze({type:String(enemy.type||''),elite:!!enemy.elite,boss:!!enemy.finalBoss,
          hpBefore:before.hp,hpAfter:hp}),
        killed:!before.dead&&(!!enemy.dead||hp<=0),
        gameTime:Number.isFinite(gameTime)?gameTime:null
      });
      if(qa){
        counts.attempts++;
        if(event.type==='hit')counts.hits++;
        if(event.shieldDamage>0)counts.shields++;
        if(event.killed)counts.kills++;
        counts.byKind[source]=(counts.byKind[source]||0)+1;
      }
      for(const fn of listeners){try{fn(event);}catch(_){/* observational only */}}
    },
    subscribe(fn){if(typeof fn!=='function')throw TypeError('listener must be a function');listeners.add(fn);return ()=>listeners.delete(fn);},
    withContext(meta,fn){if(typeof fn!=='function')throw TypeError('callback must be a function');const old=context;context=meta;try{return fn();}finally{context=old;}},
    read(){return {ready:true,qa,listenerCount:listeners.size,attempts:counts.attempts,hits:counts.hits,shields:counts.shields,kills:counts.kills,byKind:{...counts.byKind}};}
  };
  host.EVOLVE_HIT_EVENTS=Object.freeze(api);
})();
