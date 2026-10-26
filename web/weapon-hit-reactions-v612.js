/* STEP 05: visual responses only. Never changes health, physics or attack clocks. */
function createWeaponHitReactionsV612(host) {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let clock=0,poses=new WeakMap();
  const active=new Set(),effects=[];
  const stats={gun:0,blade:0,normal:0,heavy:0,coalesced:0,dropped:0,drawn:0,peak:0};
  const images={gun:host.image(),blade:host.image()},errors=[];
  const now=()=>host.time?host.time():clock;
  const cfg=()=>host.settings?host.settings():{};
  const ready=Promise.all(Object.entries(images).map(([kind,image])=>new Promise(resolve=>{
    image.onload=()=>resolve(true);
    image.onerror=()=>{errors.push(kind);resolve(false);};
    image.src=host.art[kind];
  })));
  function strong(event,target) {
    return event.heavy===true||event.critical===true||event.damage>=52||
      event.damage>=Math.max(24,(target.maxHp||event.target?.hpBefore||100)*.28);
  }
  function receive(event,target) {
    if(!target||event.type!=='hit'||!(event.damage>0)||!['gun','blade'].includes(event.weapon))return false;
    const weapon=event.weapon,time=now(),heavy=strong(event,target),settings=cfg();
    const angle=Number.isFinite(event.angle)?event.angle:0;
    const old=poses.get(target);
    if(old&&old.weapon===weapon&&time-old.at<.028&&(!heavy||old.heavy)){
      stats.coalesced++;return false;
    }
    const major=!!(target.finalBoss||target.elite),life=weapon==='gun'?(heavy?.20:.155):(heavy?.21:.17);
    const pose={weapon,at:time,life:weapon==='gun'?(heavy?.145:.105):(heavy?.165:.135),heavy,angle,major,boss:!!target.finalBoss};
    if(!target.dead){poses.set(target,pose);active.add(target);}
    const limit=settings.reducedMotion?16:(host.crowd&&host.crowd()>180?28:48);
    if(effects.length>=limit){effects.shift();stats.dropped++;}
    const size=weapon==='gun'?(heavy?48:36):(heavy?68:54);
    const radius=Math.min(24,Math.max(5,target.r||10));
    effects.push({weapon,at:time,life:settings.reducedMotion?.085:life,heavy,angle,
      x:event.x-(weapon==='gun'?Math.cos(angle)*radius*.36:0),
      y:event.y-(major?Math.min(18,radius*.5):7)-(weapon==='gun'?Math.sin(angle)*radius*.36:0),
      size:major?size*1.12:size});
    stats[weapon]++;stats[heavy?'heavy':'normal']++;stats.peak=Math.max(stats.peak,effects.length);
    return true;
  }
  function step(dt) {
    if(!host.time&&Number.isFinite(dt)&&dt>0)clock+=dt;
    const time=now();
    for(let i=effects.length-1;i>=0;i--)if(time-effects[i].at>=effects[i].life)effects.splice(i,1);
    for(const e of active){const p=poses.get(e);if(!p||e.dead||time-p.at>=p.life){active.delete(e);poses.delete(e);}}
  }
  function pose(enemy) {
    if(cfg().reducedMotion||enemy.dead)return null;
    const p=poses.get(enemy);if(!p)return null;
    const q=clamp((now()-p.at)/p.life,0,1);if(q>=1)return null;
    const impulse=Math.sin(Math.min(1,q/.23)*Math.PI/2)*Math.exp(-q*5.5);
    const rebound=q>.35?Math.sin((q-.35)/.65*Math.PI)*.12:0;
    const amount=(impulse-rebound)*(p.heavy?1.35:1)*(p.boss?.14:p.major?.52:1);
    const x=Math.cos(p.angle),y=Math.sin(p.angle),blade=p.weapon==='blade';
    return {sx:1-amount*(blade?.068:.095)*(x*x+.28),
      sy:1+amount*(blade?.045:.058)*(x*x+.18)-amount*.035*y*y,
      rot:amount*(blade?.095:.048)*(x>=0?1:-1),
      bob:amount*y*(blade?2.8:3.6),weapon:p.weapon,heavy:p.heavy};
  }
  function draw(ctx) {
    const time=now(),settings=cfg();stats.drawn=0;
    for(const e of effects){
      const age=time-e.at;if(age<0||age>=e.life||host.visible&&!host.visible(e.x,e.y,e.size))continue;
      const image=images[e.weapon];if(!image.complete||!image.naturalWidth)continue;
      const q=clamp(age/e.life,0,.999),frame=settings.reducedMotion?1:Math.min(3,Math.floor(q*4));
      const x0=Math.round(frame*image.naturalWidth/4),x1=Math.round((frame+1)*image.naturalWidth/4);
      const y0=Math.round((e.heavy?1:0)*image.naturalHeight/2),y1=Math.round((e.heavy?2:1)*image.naturalHeight/2);
      const fade=Math.min(1,(1-q)*3.2),alpha=(settings.flash===0?.60:settings.flash===1?.78:.95)*fade;
      ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle-(e.weapon==='blade'?Math.PI/4:0));
      ctx.globalAlpha=alpha;ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=true;
      ctx.drawImage(image,x0,y0,x1-x0,y1-y0,-e.size/2,-e.size/2,e.size,e.size);ctx.restore();stats.drawn++;
    }
  }
  function reset(){effects.length=0;active.clear();poses=new WeakMap();clock=0;for(const key of Object.keys(stats))stats[key]=0;}
  function read(){return {version:'STEP05-V612',...stats,active:effects.length,poses:active.size,
    imageReady:Object.fromEntries(Object.entries(images).map(([k,v])=>[k,!!v.naturalWidth])),errors:[...errors],
    affectsDamage:false,affectsAttackTiming:false,physical_Galaxy_S23_plus_tested:false};}
  return Object.freeze({ready,receive,step,pose,draw,reset,read});
}
