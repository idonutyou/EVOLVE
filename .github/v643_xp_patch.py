#!/usr/bin/env python3
"""V643 XP crystal suction effects. Apply only to current V642 engine and its exact metadata."""
import sys,re,json,hashlib
from pathlib import Path

site=Path(sys.argv[1]); pre_sha=sys.argv[2] if len(sys.argv)>2 else None
if not pre_sha:
    ver=json.loads((site/'version.json').read_text())
    pre_sha=ver['source_sha256']
oldfile=site/'assets'/(pre_sha+'.js')
old=oldfile.read_bytes()
assert hashlib.sha256(old).hexdigest()==pre_sha, 'engine hash mismatch'
s=old.decode('utf-8')

def replace_once(before,after):
    global s
    n=s.count(before)
    if n!=1: raise AssertionError('Expected one anchor, found '+str(n)+': '+repr(before[:170]))
    s=s.replace(before,after,1)

# Keep all XP images identical. Only the drawing order changes.
replace_once('function drawXPV415(d,xpViewV439=null){','function drawXPV415(d,xpViewV439=null,scaleV643=1,alphaV643=1){')
replace_once(' const bob=Math.sin(t*2.2+d.x*.05)*.55;\n ctx.save();ctx.globalAlpha=1;',
'''  const bob=d.suctionV643?0:Math.sin(t*2.2+d.x*.05)*.55;
  ctx.save();ctx.globalAlpha=alphaV643;''')
replace_once(' ctx.drawImage(cached.surface,d.x-cached.w/2,d.y-cached.h/2+bob,cached.w,cached.h);ctx.restore();',
'''  ctx.drawImage(cached.surface,d.x-cached.w*scaleV643/2,d.y-cached.h*scaleV643/2+bob,cached.w*scaleV643,cached.h*scaleV643);ctx.restore();''')

# Short visual-only residual when the crystal is actually collected, so the last centimeters
# are visible above the core. Exp is granted immediately, with no impact on gameplay timing.
replace_once('let enemies=[], bullets=[], eBullets=[], drops=[], particles=[], damageTexts=[], telegraphs=[]',
             'let xpAbsorbGhostsV643=[];\n let enemies=[], bullets=[], eBullets=[], drops=[], particles=[], damageTexts=[], telegraphs=[]')

# Init for every new run, no saved-state changes.
replace_once('bankedThisRun=false;pendingBankGain=0;t=0;last=performance.now();',
             'bankedThisRun=false;pendingBankGain=0;xpAbsorbGhostsV643.length=0;t=0;last=performance.now();')

before='''  const xpPickupRadiusV416=effectivePickup();
  // V439: preserve all pickup motion/experience, but avoid sqrt + angle when outside both interaction ranges.
  const collectDistV439=player.r+8,pickSqV439=xpPickupRadiusV416*xpPickupRadiusV416,collectSqV439=collectDistV439*collectDistV439;
  for(const d of drops){
    if(d.previewXPV448)continue; // V451: visual comparison samples never auto-pick up or expire.
    const xd=player.x-d.x,yd=player.y-d.y;
    const far=Math.abs(xd)>W*1.25||Math.abs(yd)>H*1.15;d.life-=dt*(far?2.6:1);
    const distSq=xd*xd+yd*yd;if(distSq>=pickSqV439&&distSq>=collectSqV439)continue;
    let dd=Math.sqrt(distSq);
    if(dd<xpPickupRadiusV416){const a=Math.atan2(yd,xd),step=Math.min(dd,(160+(xpPickupRadiusV416-dd)*4)*dt);d.x+=Math.cos(a)*step;d.y+=Math.sin(a)*step;dd-=step;}
    if(dd<collectDistV439){d.dead=true;addXP(d.xp);pickupSoundTick++;if(pickupSoundTick%5===0)beep(480,.018,'sine',.004); }
  }compactArrayV426(drops,d=>!d.dead&&d.life>0);'''
assert before in s
new='''  const xpPickupRadiusV416=effectivePickup();
  const xpMagnetModeV643=lootSweep>0||organPower('absorbCilia')>0||activeOrganSet()?.id==='harvester'||(meta.pickup||0)>0||routeMods.pickup>0;
  // Sweeps use a real extended attraction radius; normal pickups retain their old radius.
  const xpAutoSweepRadiusV643=lootSweep>0?Math.max(xpPickupRadiusV416,Math.min(260,Math.min(W,H)*.52)):xpPickupRadiusV416;
  const collectDistV439=player.r+8;
  const pullRadiusV643=Math.max(xpPickupRadiusV416,xpAutoSweepRadiusV643);
  const pullSqV643=pullRadiusV643*pullRadiusV643,collectSqV439=collectDistV439*collectDistV439;
  for(const d of drops){
    if(d.previewXPV448)continue;
    const xd=player.x-d.x,yd=player.y-d.y;
    const far=Math.abs(xd)>W*1.25||Math.abs(yd)>H*1.15;d.life-=dt*(far?2.6:1);
    const distSq=xd*xd+yd*yd;
    if(!d.suctionV643&&distSq>=pullSqV643&&distSq>=collectSqV439)continue;
    let dd=Math.sqrt(distSq);
    if(dd<pullRadiusV643||d.suctionV643){
      if(!d.suctionV643){
        d.suctionV643=true;
        d.suctionMagnetV643=!!xpMagnetModeV643;
        d.suctionClockV643=0;
        d.suctionInitialV643=Math.max(dd,pullRadiusV643*.35);
        d.suctionPhaseV643=rand(0,TAU);
      }
      d.suctionClockV643+=dt;
      d.suctionTailX643=d.x;d.suctionTailY643=d.y;
      if(dd>1e-4){
        const magnet=d.suctionMagnetV643;
        const pullSpeed=(magnet?100:140)+(magnet?2.1:1.35)*Math.max(0,d.suctionInitialV643-dd)
            +Math.min(magnet?470:230,d.suctionClockV643*(magnet?1000:680));
        const closeBoost=dd<Math.max(collectDistV439*3,d.suctionInitialV643*.36)?(magnet?175:100):0;
        const step=Math.min(dd,(pullSpeed+closeBoost)*dt);
        const ux=xd/dd,uy=yd/dd;
        const swirl=magnet?.23*Math.min(1,dd/35)*Math.sin(d.suctionPhaseV643+d.suctionClockV643*15):.05*Math.min(1,dd/20)*Math.sin(d.suctionPhaseV643+d.suctionClockV643*8);
        d.x+=(ux-uy*swirl)*step;d.y+=(uy+ux*swirl)*step;
        dd=Math.hypot(player.x-d.x,player.y-d.y);
      }
    }
    if(dd<collectDistV439){
      d.dead=true;
      // The last 0.1s stays visible as a foreground-only crystal. Never reward XP twice.
      if(d.suctionV643&&xpAbsorbGhostsV643.length<96)xpAbsorbGhostsV643.push({x:d.x,y:d.y,xpUnit:d.xpUnit||1,age:0,life:d.suctionMagnetV643?.15:.10,magnet:d.suctionMagnetV643,phase:d.suctionPhaseV643});
      addXP(d.xp);pickupSoundTick++;if(pickupSoundTick%5===0)beep(480,.018,'sine',.004);
    }
  }
  compactArrayV426(drops,d=>!d.dead&&d.life>0);
  for(const d of xpAbsorbGhostsV643)d.age+=dt;
  compactArrayV426(xpAbsorbGhostsV643,d=>d.age<d.life);'''
replace_once(before,new)

# The normal XP remains world-layer art. Flying XP goes on top of EVERY character,
# independent of GPU batching, depth sorting, player skin and mobile screen ratio.
replace_once('const xpViewV439=cameraRect(32);for(const d of drops)drawXPV415(d,xpViewV439);',
             'const xpViewV439=cameraRect(32);for(const d of drops)if(!d.suctionV643)drawXPV415(d,xpViewV439);')
replace_once('  mapUnderDrawV575(ctx);\n  drawPlayerHealthV411();',
'''  // Crystals actively flying in are rendered ABOVE the player and all monsters.
  drawXPForegroundSuctionV643(xpViewV439);
  mapUnderDrawV575(ctx);
  drawPlayerHealthV411();''')

# Single-pass cached sprite draws; trails capped to keep 1k-enemy Android performance.
new_draw='''
// V643: foreground crystal suction, deliberately stronger for magnet/auto-sweep than normal pickup.
function drawXPForegroundSuctionV643(view){
  const motionReduced=!!feedbackCfg().reducedMotion;
  let trailCount=0;
  for(const d of drops){
    if(!d.suctionV643||d.dead||d.x<view.l||d.x>view.r||d.y<view.t||d.y>view.b)continue;
    const mag=d.suctionMagnetV643,dist=Math.hypot(player.x-d.x,player.y-d.y);
    if(!motionReduced&&trailCount<(mag?135:90)){
      const dx=player.x-d.x,dy=player.y-d.y,len=Math.max(1,dist),trail=mag?Math.min(25,7+d.suctionClockV643*58):Math.min(11,3+d.suctionClockV643*25);
      const tx=Number.isFinite(d.suctionTailX643)?d.suctionTailX643:d.x,ty=Number.isFinite(d.suctionTailY643)?d.suctionTailY643:d.y;
      ctx.save();ctx.globalAlpha=mag?.55:.31;ctx.strokeStyle=mag?'#72e8ff':'#87c9ff';ctx.lineWidth=mag?1.9:1.05;ctx.shadowBlur=mag?9:3;ctx.shadowColor='#51d9ff';ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(tx+(d.x-player.x)/len*trail,ty+(d.y-player.y)/len*trail);ctx.stroke();ctx.restore();trailCount++;
    }
    const shrink=1-Math.min(.56,(1-dist/Math.max(1,d.suctionInitialV643||45))*.55);
    drawXPV415(d,view,(mag?1.19:1.04)*Math.max(.38,shrink));
  }
  for(const g of xpAbsorbGhostsV643){
    const u=Math.min(1,g.age/Math.max(.01,g.life)),k=1-(1-u)*(1-u);
    const tail={x:g.x+(player.x-g.x)*k,y:g.y+(player.y-g.y)*k,xpUnit:g.xpUnit,suctionV643:true};
    drawXPV415(tail,view,(g.magnet?1.0:.86)*(1-u*.93),Math.max(0,1-u*.92));
    if(g.magnet&&!motionReduced&&u>.42&&u<.85){
      ctx.save();ctx.globalAlpha=(.85-u)*.6;ctx.strokeStyle='#94ecff';ctx.lineWidth=1.25;ctx.beginPath();ctx.arc(player.x,player.y,9+u*14,0,TAU);ctx.stroke();ctx.restore();
    }
  }
}
'''
replace_once('function worldCircleVisibleV441(x,y,r=0,margin=0)',new_draw+'\nfunction worldCircleVisibleV441(x,y,r=0,margin=0)')

# The four existing damage tiers/previous work are regression guarded.
for invariant in ['function paintGroundFieldV595']:
    assert invariant in s,invariant
if 'V641-ELECTRIC-STUN-BALANCE' in json.loads((site/'version.json').read_text())['version']:
    assert 'hold:q.strong?.16:.12' in s, 'V641 stun regression'
    assert 'gunDamage)*.80' in s, 'V641 damage regression'
assert s.count('drawXPForegroundSuctionV643(xpViewV439);')==1
assert s.count('drawXPForegroundSuctionV643(')==2
assert s.count('addXP(d.xp)')==1
assert 'if(d.previewXPV448)continue;' in s
new_bytes=s.encode('utf-8'); sha=hashlib.sha256(new_bytes).hexdigest()
(site/'assets'/(sha+'.js')).write_bytes(new_bytes)
index=site/'index.html'; html=index.read_text('utf-8'); oldrel='assets/'+pre_sha+'.js';newrel='assets/'+sha+'.js'
assert html.count(oldrel)==1
html=html.replace(oldrel,newrel)
config=re.search(r'window.EVOLVE_WEB_CONFIG=(\{[^;]+\});',html)
assert config
old_cfg=config.group(1);cfg=json.loads(old_cfg)
version_path=site/'version.json';ver=json.loads(version_path.read_text('utf-8'))
assert ver['build']==cfg['build']=='V642-PURGE-WARNING-CLEAN-20261101'
assert ver['version']==cfg['version']
assert ver['source_sha256']==pre_sha
build='V643-XP-MAGNET-FOREGROUND-20261101'
new_version=ver['version']+'-V643-XP-MAGNET-FOREGROUND'
delta=len(new_bytes)-len(old)
cfg.update(build=build,version=new_version,scriptBytes=cfg['scriptBytes']+delta)
ver.update(build=build,version=new_version,source_sha256=sha,scriptBytes=ver['scriptBytes']+delta)
assert cfg['scriptBytes']==ver['scriptBytes']
html=html.replace(old_cfg,json.dumps(cfg,separators=(',',':'),ensure_ascii=False),1)
index.write_text(html,'utf-8')
version_path.write_text(json.dumps(ver,indent=2,ensure_ascii=False)+'\n','utf-8')
manifest_path=site/'asset-manifest.json'; manifest=json.loads(manifest_path.read_text('utf-8'))
entries=[x for x in manifest if x.get('path')==oldrel]
assert len(entries)==1
entries[0].update(path=newrel,sha256=sha,bytes=len(new_bytes))
assert len(manifest)==ver['assets']==1081
manifest_path.write_text(json.dumps(manifest,separators=(',',':'),ensure_ascii=False),'utf-8')
print('V643_RELEASE_READY',json.dumps({'sha':sha,'engineBytes':len(new_bytes),'delta':delta,'build':build,'assets':len(manifest),'magnet_sweep_max':260,'ghost_limit':96,'normal_pickup_effects':True,'magnet_visual_boost':True}))
Path('/tmp/evolve-v643-sha').write_text(sha)