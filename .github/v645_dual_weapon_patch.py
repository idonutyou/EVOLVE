#!/usr/bin/env python3
"""V645: physical weapon count drives actual cannon bullets and independent electric chains.
Only patch the verified V644 engine and site metadata, retaining every prior patch.
"""
from pathlib import Path
import hashlib,json,re,sys

site=Path(sys.argv[1]);version_path=site/'version.json';version=json.loads(version_path.read_text('utf-8'))
expected=sys.argv[2] if len(sys.argv)>2 else '7f23c70839c8ba8be0a085b949b1dc826aec86823e4cda345ff1a3690d1d8ed9'
assert version['source_sha256']==expected, ('Unexpected base engine!',version['source_sha256'])
assert version['build']=='V644-XP-BOMB-MAGNET-FIX-20261101', version['build']
old=site/'assets'/(expected+'.js');oldbytes=old.read_bytes();assert hashlib.sha256(oldbytes).hexdigest()==expected
s=oldbytes.decode('utf-8');before=s

def swap(old,new):
 global s
 n=s.count(old)
 assert n==1, ('Expected one patch location, got',n,old[:170])
 s=s.replace(old,new,1)

# V631 used one physical cannon per simultaneous volley, alternating arms.
# Duplicate ONLY real cannon projectiles at the second cannon muzzle; no cloned
# electric or blade hits. Every ordinary/multishot/precision shot gets two sources.
anchor=''' // V708: revive the original V576 chain lightning ONLY for electric equipment.
'''
assert anchor in s
snippet='''  // V645: two equipped cannons mean two physical gun barrels firing per volley.
  // Preserve all existing extra-shot, pierce and damage rules per weapon.
  const pushOneCannonProjectileV645=pushBasicShotV552;
  pushBasicShotV552=function(shot){
   pushOneCannonProjectileV645(shot);
   if(!(state.arm>0&&typeOf(itemId(0))==='cannon'&&typeOf(itemId(1))==='cannon'))return;
   const firedSide=armItemsV589.side===1?1:0,otherSide=1-firedSide;
   const first=armItemWorldPointV589(firedSide),second=armItemWorldPointV589(otherSide),
     gunArt=armItemsArtV589.items.cannon;
   const muzzleLengthDiff=(gunArt[otherSide?'right':'left'].length-gunArt[firedSide?'right':'left'].length)
      *gunArt.world_scale*playerWorldScaleV603();
   const angle=Math.atan2(shot.vy,shot.vx);
   const dx=second.x-first.x+Math.cos(angle)*muzzleLengthDiff;
   const dy=second.y-first.y+Math.sin(angle)*muzzleLengthDiff;
   pushOneCannonProjectileV645({...shot,x:shot.x+dx,y:shot.y+dy});
   // Both physical arm models visibly recoil when one volley fires.
   playerMotionV586[otherSide?'right':'left']++;
  };

'''
swap(anchor,snippet+anchor)
# Prepare a second fully independent chain instance. This is not doubled damage
# of one chain: each gun schedules its own victims and arcs from its own muzzle.
swap('const lightningV576=createCampaignLightningV576({','const lightningHostV645={')
end=''' kick:a=>{if(feedbackCfg().reducedMotion)return;cameraKickX-=Math.cos(a)*1.8;cameraKickY-=Math.sin(a)*1.8}
});
'''
assert end in s
swap(end,''' kick:a=>{if(feedbackCfg().reducedMotion)return;cameraKickX-=Math.cos(a)*1.8;cameraKickY-=Math.sin(a)*1.8}
};
const lightningV576=createCampaignLightningV576(lightningHostV645);
const lightningV645=createCampaignLightningV576({
 ...lightningHostV645,
 active:()=>window.__EVOLVE_ELECTRIC_GUN_DUAL_V709__?.()===true,
 origin:a=>window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__?.(a,1)
});
''')
# Main chain must always use first electric muzzle in dual mode.
swap('origin:a=>window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__?.(a),','origin:a=>window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__?.(a,0),')
# Keep electric shot frequency per gun, not an extra 22% rapid-fire buff on top of doubling.
swap('*(window.__EVOLVE_ELECTRIC_GUN_DUAL_V709__?.()?0.78:1)/(1+upgradeRunV593.gunHaste)', '/(1+upgradeRunV593.gunHaste)')
# Second chain has its own effects below enemies and over battlefield.
swap('if(window.__EVOLVE_LIGHTNING_V576__)lightningV576.drawGround(ctx);',
     'if(window.__EVOLVE_LIGHTNING_V576__){lightningV576.drawGround(ctx);lightningV645.drawGround(ctx);}')
swap('if(window.__EVOLVE_LIGHTNING_V576__)lightningV576.draw(ctx);',
     'if(window.__EVOLVE_LIGHTNING_V576__){lightningV576.draw(ctx);lightningV645.draw(ctx);}')
# On stage change/return to home, reset both attack queues.
swap('reset=function(...args){lightningV576.reset();return lightningResetBaseV576(...args)};',
     'reset=function(...args){lightningV576.reset();lightningV645.reset();return lightningResetBaseV576(...args)};')
swap('returnToHome=function(...args){lightningV576.reset();return lightningHomeBaseV576(...args)};',
     'returnToHome=function(...args){lightningV576.reset();lightningV645.reset();return lightningHomeBaseV576(...args)};')
# Strong electric ability fires one chain per equipped electric barrel.
swap('if(!lightningV576.castChain(true))return;activeReady=activeMaxCd=3.2;',
     'if(!lightningV576.castChain(true))return;lightningV645.castChain(true);activeReady=activeMaxCd=3.2;')
# The origin resolver must obey physical sides, even on mixed loadouts.
origin_old='''window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__=a=>{
  const side=model.attackSide(partsStateV523,'electric',typeOf,lastElectric);
  if(side===null)return null;
  lastElectric=side;
  const point=armItemWorldPointV589(side),length=34*playerWorldScaleV603();
  return {x:point.x+Math.cos(a)*length,y:point.y+Math.sin(a)*length};
 };'''
origin_new='''window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__=(a,preferredSide=0)=>{
   const side=typeOf(itemId(preferredSide))==='electric'?preferredSide:
    model.attackSide(partsStateV523,'electric',typeOf,lastElectric);
  if(side===null)return null;
  lastElectric=side;
  const point=armItemWorldPointV589(side),length=34*playerWorldScaleV603();
  return {x:point.x+Math.cos(a)*length,y:point.y+Math.sin(a)*length};
 };'''
swap(origin_old,origin_new)
# Final combat loop: one active chain per electric, conditional second instance.
loop_old=''' const fireBeforeElectric=firePlayer;
 let electricWasActive=false;
 firePlayer=function(dt){
  const active=window.__EVOLVE_ELECTRIC_GUN_ACTIVE_V708__();
  if(!active&&electricWasActive)lightningV576.reset();
  electricWasActive=active;
  const result=fireBeforeElectric(dt); // cannon and blade retain existing original pipeline
  if(active)lightningV576.step(dt);
  return result;
 };'''
loop_new=''' const fireBeforeElectric=firePlayer;
 let electricWasActive=false,dualElectricWasActive=false;
 firePlayer=function(dt){
  const active=window.__EVOLVE_ELECTRIC_GUN_ACTIVE_V708__();
   const dual=window.__EVOLVE_ELECTRIC_GUN_DUAL_V709__();
  if(!active&&electricWasActive)lightningV576.reset();
   if(!dual&&dualElectricWasActive)lightningV645.reset();
  electricWasActive=active;dualElectricWasActive=dual;
  const result=fireBeforeElectric(dt); // each cannon's volley is duplicated per physical barrel
  if(active){lightningV576.step(dt);if(dual)lightningV645.step(dt);}
  return result;
 };'''
swap(loop_old,loop_new)
swap("chain:lightningV576.read(),originalV576:true", "chain:lightningV576.read(),secondChain:lightningV645.read(),cannonCount:[0,1].filter(side=>typeOf(itemId(side))==='cannon').length,originalV576:true")
# New lightweight diagnostic object works without modifying game/persistent saves.
read_anchor=''' // Refresh existing preview and parts, preserving two independent arm slots.
'''
assert read_anchor in s
swap(read_anchor,'''  window.__EVOLVE_DUAL_WEAPON_V645__={
   read:()=>({arms:[itemId(0),itemId(1)],cannons:[0,1].filter(side=>typeOf(itemId(side))==='cannon').length,electrics:[0,1].filter(side=>typeOf(itemId(side))==='electric').length,primary:lightningV576.read(),secondary:lightningV645.read(),mode:'per-equipped-weapon'}),
   test:new URLSearchParams(location.search).get('evolveQA')==='1'?{origin:(side,a)=>window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__(a,side),primary:()=>lightningV576.context(),secondary:()=>lightningV645.context()}:undefined
  };
'''+read_anchor)

assert s!=before and s.count('const lightningV645=createCampaignLightningV576(')==1
assert s.count('addXP(d.xp)')==1
assert 'xpMagnetModeV643=lootSweep>0' not in s
assert 'hold:q.strong?.16:.12' in s and 'gunDamage)*.80' in s
assert '시설 정화 · 붉은 범위에서 벗어나세요' not in s
# New asset filename is content SHA256, avoiding stale caches.
newdata=s.encode('utf-8');sha=hashlib.sha256(newdata).hexdigest();newfile=site/'assets'/(sha+'.js');newfile.write_bytes(newdata)
index_path=site/'index.html';index=index_path.read_text('utf-8')
oldref=f'assets/{expected}.js';newref=f'assets/{sha}.js';assert index.count(oldref)==1
index=index.replace(oldref,newref,1)
match=re.search(r'window.EVOLVE_WEB_CONFIG=(\{[^;]+\});',index);assert match
oldconf=match.group(1);inline=json.loads(oldconf)
assert inline['build']==version['build'] and inline['scriptBytes']==version['scriptBytes']
newbuild='V645-DUAL-WEAPON-INDEPENDENT-20261101';newversion=version['version']+'-V645-DUAL-WEAPON'
delta=len(newdata)-len(oldbytes)
inline.update(build=newbuild,version=newversion,scriptBytes=inline['scriptBytes']+delta)
version.update(build=newbuild,version=newversion,scriptBytes=version['scriptBytes']+delta,source_sha256=sha)
assert inline['scriptBytes']==version['scriptBytes']
index_path.write_text(index.replace(oldconf,json.dumps(inline,ensure_ascii=False,separators=(',',':')),1),'utf-8')
version_path.write_text(json.dumps(version,ensure_ascii=False,indent=2)+'\n','utf-8')
manifest_path=site/'asset-manifest.json';manifest=json.loads(manifest_path.read_text('utf-8'))
matches=[item for item in manifest if item.get('path')==oldref];assert len(matches)==1
matches[0].update(path=newref,sha256=sha,bytes=len(newdata))
assert len(manifest)==version['assets']==1081
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')),'utf-8')
print('V645_PATCH_READY',json.dumps({'old_sha':expected,'new_sha':sha,'delta':delta,'bytes':len(newdata),'build':newbuild,'independent_electric_instances':2,'cannon_projectiles_per_barrel':1,'two_cannon_volley_uses_two_muzzles':True},ensure_ascii=False))
Path('/tmp/evolve-v645-sha').write_text(sha)