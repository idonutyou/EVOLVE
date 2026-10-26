/* STEP06: observational hit feedback. Never writes to combat entities. */
function createOrganHitReactionsV613(host) {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let clock=0,poses=new WeakMap();
  const targets=new Set(),effects=[],errors=[];
  const stats={spike:0,tail:0,arc:0,normal:0,heavy:0,coalesced:0,dropped:0,drawn:0,peak:0};
  const now=()=>host.time?host.time():clock,settings=()=>host.settings?host.settings():{};
  const images={spike:host.image(),tail:host.image()};
  const ready=Promise.all(Object.entries(images).map(([kind,image])=>new Promise(resolve=>{
    image.onload=()=>resolve(true);
    image.onerror=()=>{errors.push(kind);resolve(false);};
    image.src=host.art[kind];
  })));
  function budget() {
    const cap=settings().reducedMotion?16:host.crowd&&host.crowd()>180?28:48;
    return Math.max(0,Math.min(24,cap-Math.max(0,host.otherEffects?host.otherEffects():0)));
  }
  function trim() {
    const cap=budget();
    while(effects.length>cap){effects.shift();stats.dropped++;}
    while(targets.size>cap){const e=targets.values().next().value;targets.delete(e);poses.delete(e);}
    return cap;
  }
  function strong(event,target) {
    return event.heavy===true||event.critical===true||event.damage>=52||
      event.damage>=Math.max(24,(target.maxHp||event.target?.hpBefore||100)*.28);
  }
  function receive(event,target,source=null) {
    trim();
    if(!target||event.type!=='hit'||!(event.damage>0))return false;
    if(event.kind==='arc') {
      stats.arc++;targets.delete(target);poses.delete(target);
      return true; // The existing lightning module owns its own pose and atlas.
    }
    if(!source||source.direct!==true||source.kind!==event.kind||!['spike','tail'].includes(event.kind))return false;
    const kind=event.kind,time=now(),heavy=strong(event,target),angle=Number.isFinite(source.angle)?source.angle:0;
    const old=poses.get(target);
    if(old&&old.kind===kind&&time-old.at<.025&&(!heavy||old.heavy)){stats.coalesced++;return false;}
    stats[kind]++;stats[heavy?'heavy':'normal']++;
    const cap=budget();if(cap<=0){stats.dropped++;return true;}
    const life=settings().reducedMotion?.07:kind==='spike'?(heavy?.135:.105):(heavy?.175:.14);
    if(!target.dead&&!settings().reducedMotion){
      if(!targets.has(target)&&targets.size>=cap){const e=targets.values().next().value;targets.delete(e);poses.delete(e);}
      poses.set(target,{kind,at:time,life,angle,heavy,major:target.finalBoss?.14:target.elite?.5:1});targets.add(target);
    }
    if(effects.length>=cap){effects.shift();stats.dropped++;}
    const radius=clamp(target.r||10,5,24),size=kind==='spike'?(heavy?39:30):(heavy?57:44);
    effects.push({kind,at:time,life,angle,heavy,x:event.x-Math.cos(angle)*radius*.22,
      y:event.y-7-Math.sin(angle)*radius*.22,size:size*(target.elite||target.finalBoss?1.1:1)});
    stats.peak=Math.max(stats.peak,effects.length);return true;
  }
  function step(dt) {
    if(!host.time&&Number.isFinite(dt)&&dt>0)clock+=dt;
    const time=now();
    for(let i=effects.length-1;i>=0;i--)if(time-effects[i].at>=effects[i].life)effects.splice(i,1);
    for(const e of targets){const p=poses.get(e);if(!p||e.dead||time-p.at>=p.life){targets.delete(e);poses.delete(e);}}
    trim();
  }
  function pose(enemy) {
    if(settings().reducedMotion||enemy.dead||enemy.arcShockV576&&enemy.arcShockV576.age<enemy.arcShockV576.life||
      host.weaponPose&&host.weaponPose(enemy))return null;
    const p=poses.get(enemy);if(!p)return null;
    const q=clamp((now()-p.at)/p.life,0,1);if(q>=1)return null;
    const force=Math.sin(Math.min(1,q/.2)*Math.PI/2)*Math.exp(-q*4.8)*p.major*(p.heavy?1.3:1);
    const x=Math.cos(p.angle),y=Math.sin(p.angle),whip=p.kind==='tail';
    return {kind:p.kind,heavy:p.heavy,
      sx:1+force*(whip?.045:-.072*(.25+x*x)),
      sy:1+force*(whip?-.055:.038*x*x-.04*y*y),
      rot:force*(whip?.085:.022)*(x>=0?1:-1),bob:force*y*(whip?1.8:1.1)};
  }
  function draw(ctx) {
    trim();stats.drawn=0;const time=now(),cfg=settings();
    for(const e of effects){
      const age=time-e.at;if(age<0||age>=e.life||host.visible&&!host.visible(e.x,e.y,e.size))continue;
      const image=images[e.kind];if(!image.complete||!image.naturalWidth)continue;
      const q=clamp(age/e.life,0,.999),frame=cfg.reducedMotion?1:Math.min(3,Math.floor(q*4));
      const x0=Math.round(frame*image.naturalWidth/4),x1=Math.round((frame+1)*image.naturalWidth/4);
      const y0=Math.round((e.heavy?1:0)*image.naturalHeight/2),y1=Math.round((e.heavy?2:1)*image.naturalHeight/2);
      const width=e.size*(e.kind==='tail'?1.4:1),height=e.size*(e.kind==='tail'?.52:.72);
      ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle-(e.kind==='tail'?Math.PI/4:0));
      ctx.globalAlpha=(cfg.flash===0?.48:cfg.flash===1?.65:.8)*Math.min(1,(1-q)*3);
      ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=true;
      ctx.drawImage(image,x0,y0,x1-x0,y1-y0,-width/2,-height/2,width,height);ctx.restore();stats.drawn++;
    }
  }
  function reset(){effects.length=0;targets.clear();poses=new WeakMap();clock=0;for(const k of Object.keys(stats))stats[k]=0;}
  function read(){return {version:'STEP06-V613',...stats,active:effects.length,poses:targets.size,budget:budget(),
    imageReady:Object.fromEntries(Object.entries(images).map(([k,v])=>[k,!!v.naturalWidth])),errors:[...errors],
    lightningDelegated:true,affectsDamage:false,affectsAttackTiming:false,affectsKnockback:false};}
  return Object.freeze({ready,receive,step,pose,draw,reset,read});
}
