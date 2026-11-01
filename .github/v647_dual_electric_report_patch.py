#!/usr/bin/env python3
"""V647: Render separate dual-electric bolts and report damage per real source.
Input: published V646 engine only. Preserve all previous combat and UI code.
"""
from pathlib import Path
import hashlib,json,re,sys

site=Path(sys.argv[1])
version_path=site/'version.json'
version=json.loads(version_path.read_text(encoding='utf-8'))
old_sha='54677cc079210bc9957363778dfe53b27c0280ff0b190007af9f9f255cb2458f'
assert version['source_sha256']==old_sha,('Unexpected active engine',version['source_sha256'])
assert version['build']=='V646-IDLE-ENEMY-VISIBILITY-20261102'
old_path=site/'assets'/(old_sha+'.js')
original_bytes=old_path.read_bytes()
assert hashlib.sha256(original_bytes).hexdigest()==old_sha
s=original_bytes.decode('utf-8')

def replace_once(before,after):
    global s
    n=s.count(before)
    if n!=1:
        raise AssertionError(f'Expected precisely one anchor; found {n}: {before[:190]!r}')
    s=s.replace(before,after,1)

# Which electric barrel actually dealt HP damage? Capture only during damageEnemy,
# not during the entire frame, because other effects may trigger nested hits.
replace_once('const lightningHostV645={', '''let electricDamageSideV647=null,firstElectricTargetV647=null;
const lightningHostV645={''')

# When there are at least two reachable monsters, the second equipped electric
# barrel should choose a distinct first victim. A single victim is still struck twice.
replace_once('''   const priority=host.focus(),first=reachable.includes(priority)?priority:reachable.reduce((best,e)=>{const score=q=>Math.hypot(q.x-p.x,q.y-p.y)*(q.finalBoss?.65:q.elite?.8:1);return !best||score(e)<score(best)?e:best},null);
''','''   const excluded=host.avoidFirst?.();
   const candidates=excluded&&reachable.length>1?reachable.filter(e=>e!==excluded):reachable;
   const priority=host.focus(),first=candidates.includes(priority)?priority:candidates.reduce((best,e)=>{const score=q=>Math.hypot(q.x-p.x,q.y-p.y)*(q.finalBoss?.65:q.elite?.8:1);return !best||score(e)<score(best)?e:best},null);
   host.noteFirst?.(first);
''')

# Draw two visible lanes even for one target / the same chain path. The visual
# positions are shifted; REAL target hit locations, damage and chain distances
# remain identical. The primary gun is centered when only one is equipped.
replace_once('''   for(const a of arcs){const p=1-a.age/a.life,dx=a.to.x-a.from.x,dy=a.to.y-a.from.y,d=Math.hypot(dx,dy)||1,angle=Math.atan2(dy,dx);sprite(ctx,0,(a.from.x+a.to.x)/2,(a.from.y+a.to.y)/2,d+28,clamp(d*.58,a.strong?100:73,a.strong?170:120),angle,Math.pow(p,.55)*(a.strong?.92:.76));''','''   for(const arc of arcs){
    const lane=host.visualLane?.()||0,ex=arc.to.x-arc.from.x,ey=arc.to.y-arc.from.y,
      unit=Math.max(1,Math.hypot(ex,ey)),nx=-ey/unit,ny=ex/unit;
    // A visible 22px total lane split on identical target paths.
    const a=lane?{...arc,from:{x:arc.from.x+nx*lane*10,y:arc.from.y+ny*lane*10},to:{x:arc.to.x+nx*lane*11,y:arc.to.y+ny*lane*11}}:arc;
    const p=1-a.age/a.life,dx=a.to.x-a.from.x,dy=a.to.y-a.from.y,d=Math.hypot(dx,dy)||1,angle=Math.atan2(dy,dx);sprite(ctx,0,(a.from.x+a.to.x)/2,(a.from.y+a.to.y)/2,d+28,clamp(d*.58,a.strong?100:73,a.strong?170:120),angle,Math.pow(p,.55)*(a.strong?.92:.76));''')

# Feed the chain-specific visual lane and first target data into the existing
# two V645 instances. Single electric gun stays on its original central path.
replace_once(" origin:a=>window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__?.(a,1)\n});", """ origin:a=>window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__?.(a,1),
 visualLane:()=>1,
 avoidFirst:()=>firstElectricTargetV647,
 damageEnemy:(...args)=>{
  const saved=electricDamageSideV647;electricDamageSideV647=1;
  try{return baseElectricDamageV647(...args)}finally{electricDamageSideV647=saved;}
 }
});""")
replace_once(" origin:a=>window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__?.(a,0),", """ origin:a=>window.__EVOLVE_ELECTRIC_GUN_ORIGIN_V708__?.(a,0),
 visualLane:()=>window.__EVOLVE_ELECTRIC_GUN_DUAL_V709__?.()?-1:0,
 noteFirst:e=>{firstElectricTargetV647=e;},""")
replace_once('''const lightningV576=createCampaignLightningV576(lightningHostV645);
const lightningV645=createCampaignLightningV576({''','''const baseElectricDamageV647=lightningHostV645.damageEnemy;
lightningHostV645.damageEnemy=(...args)=>{
 const saved=electricDamageSideV647;
 electricDamageSideV647=window.__EVOLVE_ELECTRIC_GUN_DUAL_V709__?.()?0:null;
 try{return baseElectricDamageV647(...args)}finally{electricDamageSideV647=saved;}
};
const lightningV576=createCampaignLightningV576(lightningHostV645);
const lightningV645=createCampaignLightningV576({''')

# The previously anonymous 1,985 damage in the screenshot comes from the red
# pulse's *fieldPulse* kind. Split it out explicitly, then preserve any future
# previously unseen source under its OWN kind rather than merging it into 기타.
replace_once("let runDamageDetailR19={gun:0,blade:0,electric:0,tail:0,acid:0,shell:0,wing:0,leg:0,core:0,other:0};", "let runDamageDetailR19={gun:0,blade:0,electric:0,electricArm1:0,electricArm2:0,redPulse:0,tail:0,acid:0,shell:0,wing:0,leg:0,core:0};")
replace_once("runDamageDetailR19={gun:0,blade:0,electric:0,tail:0,acid:0,shell:0,wing:0,leg:0,core:0,other:0};", "runDamageDetailR19={gun:0,blade:0,electric:0,electricArm1:0,electricArm2:0,redPulse:0,tail:0,acid:0,shell:0,wing:0,leg:0,core:0};")
replace_once("const damageTypeR19=kind==='arc'?'electric':sourceWeaponR19==='blade'?'blade':sourceWeaponR19==='gun'?'gun':", "const damageTypeR19=kind==='arc'?(electricDamageSideV647===0?'electricArm1':electricDamageSideV647===1?'electricArm2':'electric'):kind==='fieldPulse'?'redPulse':sourceWeaponR19==='blade'?'blade':sourceWeaponR19==='gun'?'gun':")
replace_once("kind==='arm'||kind==='artillery'?(armItemModeV589()==='blades'?'blade':'gun'):'other';", "kind==='arm'||kind==='artillery'?(armItemModeV589()==='blades'?'blade':'gun'):'source_'+String(kind||'unidentified').replace(/[^a-zA-Z0-9_]/g,'_').slice(0,40);")
replace_once("const names={gun:['GUN','총'],blade:['BLADE','칼'],electric:['ELECTRIC GUN','전기총'],tail:['TAIL','꼬리'],acid:['ACID','산성'],shell:['SHELL','외피'],wing:['WING','날개'],leg:['LEG','다리'],core:['CORE','코어'],other:['OTHER','기타']};", "const names={gun:['GUN','총'],blade:['BLADE','칼'],electric:['ELECTRIC GUN','전기총'],electricArm1:['ELECTRIC GUN · ARM 1','전기총 · 팔1'],electricArm2:['ELECTRIC GUN · ARM 2','전기총 · 팔2'],redPulse:['RED PULSE EXPLOSION','붉은 파동 폭발'],tail:['TAIL','꼬리'],acid:['ACID','산성'],shell:['SHELL','외피'],wing:['WING','날개'],leg:['LEG','다리'],core:['CORE','코어']};")
replace_once("name.textContent=label(...(names[key]||names.other));", "name.textContent=names[key]?label(...names[key]):(key.startsWith('source_')?key.slice(7).replaceAll('_',' '):key);")

# Built-in QA status only when explicitly requested, no visible UI overlay.
anchor='window.__EVOLVE_DUAL_WEAPON_V645__={'
replace_once(anchor, '''window.__EVOLVE_ELECTRIC_VISUAL_REPORT_V647__={
 read:()=>({dual:window.__EVOLVE_ELECTRIC_GUN_DUAL_V709__?.(),primaryLane:window.__EVOLVE_ELECTRIC_GUN_DUAL_V709__?.()?-1:0,secondaryLane:1,firstPrimary:!!firstElectricTargetV647,categoryTotals:{...runDamageDetailR19},labels:'weapon and pulse'}),
 test:new URLSearchParams(location.search).get('evolveQA')==='1'?{primary:()=>lightningV576.context(),secondary:()=>lightningV645.context(),report:()=>({...runDamageDetailR19})}:undefined
};
  '''+anchor)

# Build hash, updated index and manifest; avoid touching save keys or old assets.
assert s.count('const lightningV645=createCampaignLightningV576(')==1
assert s.count('for(const arc of arcs){')==1
assert s.count('electricDamageSideV647=1;')==1
assert 'kind===\'fieldPulse\'?\'redPulse\'' in s
assert "names.other" not in s
assert 'hold:q.strong?.16:.12' in s and 'gunDamage)*.80' in s
assert 'xpAutoSweepRadiusV643=xpPickupRadiusV416;' in s
assert "V646" in s
assert s.count('addXP(d.xp)')==1
new_data=s.encode('utf-8')
new_sha=hashlib.sha256(new_data).hexdigest()
(site/'assets'/(new_sha+'.js')).write_bytes(new_data)
old_asset='assets/'+old_sha+'.js';new_asset='assets/'+new_sha+'.js'
index_path=site/'index.html'
html=index_path.read_text(encoding='utf-8')
assert html.count(old_asset)==1
html=html.replace(old_asset,new_asset,1)
m=re.search(r'window.EVOLVE_WEB_CONFIG=(\{[^;]+\});',html)
assert m
old_config=m.group(1);cfg=json.loads(old_config)
assert cfg['build']==version['build'] and cfg['version']==version['version']
build='V647-DUAL-ELECTRIC-VISUAL-DAMAGE-20261102'
new_version=version['version']+'-V647-DUAL-ELECTRIC-REPORT'
delta=len(new_data)-len(original_bytes)
cfg.update(build=build,version=new_version,scriptBytes=cfg['scriptBytes']+delta)
version.update(build=build,version=new_version,scriptBytes=version['scriptBytes']+delta,source_sha256=new_sha)
assert cfg['scriptBytes']==version['scriptBytes']
index_path.write_text(html.replace(old_config,json.dumps(cfg,ensure_ascii=False,separators=(',',':')),1),encoding='utf-8')
version_path.write_text(json.dumps(version,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest_path=site/'asset-manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
row=[x for x in manifest if x.get('path')==old_asset]
assert len(row)==1
row[0].update(path=new_asset,sha256=new_sha,bytes=len(new_data))
assert len(manifest)==version['assets']==1081
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('V647_RELEASE_READY',json.dumps({'build':build,'engine_sha256':new_sha,'bytes':len(new_data),'delta':delta,'dual_lanes':[-1,1],'lane_gap_pixels':22,'split_red_pulse_from_other':True,'independent_electric_weapon_damage':True}))
Path('/tmp/evolve-v647-sha').write_text(new_sha)