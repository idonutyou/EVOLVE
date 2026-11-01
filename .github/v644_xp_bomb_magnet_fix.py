#!/usr/bin/env python3
"""V644: suppress accidental map-bomb XP magnet; ease crystal attraction speed."""
from pathlib import Path
import hashlib,json,re,sys

site=Path(sys.argv[1]);verpath=site/'version.json';ver=json.loads(verpath.read_text(encoding='utf-8'))
oldsha='35712226f4407dfa0f0f50477677ad3323fba1b00f9f63917cdebf0218efc185'
assert ver['source_sha256']==oldsha and ver['build']=='V643-XP-MAGNET-FOREGROUND-20261101','Unexpected release base'
oldpath=site/'assets'/(oldsha+'.js');raw=oldpath.read_bytes()
assert hashlib.sha256(raw).hexdigest()==oldsha,'Original engine hash mismatch'
s=raw.decode('utf-8')
def single(before,after):
 global s
 n=s.count(before)
 assert n==1,('must match exactly one V643 code location',n,before)
 s=s.replace(before,after,1)

# The existing lootSweep timer is set by world-sites, elites, fusion, level-up,
# and map events.  It is not a pickup magnet skill and must never widen XP range.
single("const xpMagnetModeV643=lootSweep>0||organPower('absorbCilia')>0||activeOrganSet()?.id==='harvester'||(meta.pickup||0)>0||routeMods.pickup>0;",
       "const xpMagnetModeV643=organPower('absorbCilia')>0||activeOrganSet()?.id==='harvester'||(meta.pickup||0)>0||routeMods.pickup>0;")
single('  // Sweeps use a real extended attraction radius; normal pickups retain their old radius.\n  const xpAutoSweepRadiusV643=lootSweep>0?Math.max(xpPickupRadiusV416,Math.min(260,Math.min(W,H)*.52)):xpPickupRadiusV416;',
       '  // V644: lootSweep is a world-event timer (including bomb kills), NOT a magnet pickup.\n  // Keep the original effectivePickup radius; genuine pickup upgrades still increase it.\n  const xpAutoSweepRadiusV643=xpPickupRadiusV416;')
# Slightly slower, for both ordinary suction and genuine magnet upgrade, preserving visible foreground track.
single('const step=Math.min(dd,(pullSpeed+closeBoost)*dt);','const step=Math.min(dd,(pullSpeed+closeBoost)*dt*.82);')

# No game XP grant, event trigger, actual pickup skills, or render order changes.
assert s.count('addXP(d.xp)')==1
assert 'drawXPForegroundSuctionV643(xpViewV439);' in s
assert 'if(!d.suctionV643)drawXPV415(d,xpViewV439)' in s
assert 'const xpAutoSweepRadiusV643=xpPickupRadiusV416;' in s
assert 'xpMagnetModeV643=lootSweep>0' not in s
assert 'xpAutoSweepRadiusV643=lootSweep>0' not in s
assert 'hold:q.strong?.16:.12' in s and 'gunDamage)*.80' in s
assert '시설 정화 · 붉은 범위에서 벗어나세요' not in s
assert 'for(const list of [purges,biomeHazards])' in s
rawnew=s.encode('utf-8');newsha=hashlib.sha256(rawnew).hexdigest();(site/'assets'/(newsha+'.js')).write_bytes(rawnew)
idx=site/'index.html';html=idx.read_text(encoding='utf-8');oldrel='assets/'+oldsha+'.js';newrel='assets/'+newsha+'.js'
assert html.count(oldrel)==1
html=html.replace(oldrel,newrel,1)
m=re.search(r'window.EVOLVE_WEB_CONFIG=(\{[^;]+\});',html)
assert m
oldcfg=m.group(1);cfg=json.loads(oldcfg)
assert cfg['version']==ver['version'] and cfg['build']==ver['build'] and cfg['scriptBytes']==ver['scriptBytes']
newbuild='V644-XP-BOMB-MAGNET-FIX-20261101';newver=ver['version']+'-V644-XP-BOMB-MAGNET-FIX';delta=len(rawnew)-len(raw)
cfg.update(build=newbuild,version=newver,scriptBytes=cfg['scriptBytes']+delta)
ver.update(build=newbuild,version=newver,source_sha256=newsha,scriptBytes=ver['scriptBytes']+delta)
assert cfg['scriptBytes']==ver['scriptBytes']
html=html.replace(oldcfg,json.dumps(cfg,ensure_ascii=False,separators=(',',':')),1)
idx.write_text(html,encoding='utf-8');verpath.write_text(json.dumps(ver,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifestpath=site/'asset-manifest.json';manifest=json.loads(manifestpath.read_text(encoding='utf-8'))
a=[x for x in manifest if x.get('path')==oldrel]
assert len(a)==1
assert len(manifest)==ver['assets']==1081
a[0].update(path=newrel,sha256=newsha,bytes=len(rawnew))
manifestpath.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('V644_RELEASE_READY',json.dumps({'build':newbuild,'sha':newsha,'bytes':len(rawnew),'delta':delta,'lootSweepNoLongerAttractsXP':True,'pickupRadiusUnchanged':True,'speedFactor':0.82,'xpRewardUntouched':True}))
Path('/tmp/evolve-v644-sha').write_text(newsha)