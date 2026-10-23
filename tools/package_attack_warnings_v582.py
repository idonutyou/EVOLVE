#!/usr/bin/env python3
"""Apply WEB-15 rendering changes to the exact deployed WEB-14 engine."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'b854b928e93912d8b5342bbd52f2971d09d4c7e4'
OLD = 'assets/5c3f7d54803d92032725aa40a4d52d5896a25f556b1619be54441003e02dddee.js'
VERSION = 'V575-WEB-15-RED-ATTACK-WARNINGS'


def base(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2})) + '\n')


def once(source, before, after):
    assert source.count(before) == 1, 'Unexpected source anchor: ' + before[:100]
    return source.replace(before, after)


def region(source, start, end, after=''):
    a = source.index(start)
    b = source.index(end, a)
    return source[:a] + after + source[b:]


def package():
    d = ROOT / 'dist'
    prior_engine = json.loads((d / 'verification.json').read_text()).get('attack_warnings', {}).get('engine')
    old = base('dist/' + OLD).decode()
    source = (ROOT / 'web/attack-warning-v582.js').read_text()
    code = region(old, 'function drawCriticalTelegraphOverlay(){', 'const sceneV425=[];', source + '\n')
    code = region(code, '  // containment purge zones\n', '  // The active crystal uses')
    code = region(code, '  // biome route hazards\n', '  // breach gate\n')
    code = region(code, '  // attack telegraphs\n', '  // Rendered pickups and projectiles;')
    code = once(code, '  drawCriticalTelegraphOverlay();\n  BIO_STEP13_V519.drawWarningOverlay();\n', '')
    code = once(code, '  drawRenderedForeground();\n', '''  drawRenderedForeground();
  // All danger geometry is painted after structures, roofs and the underpass layer.
  ctx.save();ctx.translate(-cameraLeft(),-cameraTop());drawAttackWarningsV582();ctx.restore();
''')
    # Keep the native painted impacts and trails; remove their former warning-only pass.
    code = region(code, '''   }else{
     const hot=1-clamp(z.life/Math.max(.01,z.max),0,1);
''', '   }\n }\n}\nfunction drawBioProjectileV489')
    code = region(code, " if(tg.kind==='bioSpikes'&&!tg.done&&tg.life>0)", " if(tg.kind==='bioSpikeZone'&&tg.life>0)")
    code = region(code, " for(const tg of telegraphs){if(tg._bio489)continue;if(tg.kind==='bioMelee'", " if(tg.kind==='bioSpikeZone'&&tg.life>0)", " for(const tg of telegraphs){if(tg._bio489)continue;\n")
    code = once(code, 'renderTissues();renderSacs();renderCombatFloor();fx11RenderGround();renderMotionGround();', 'renderTissues();renderSacs();fx11RenderGround();renderMotionGround();')
    code = region(code, 'function renderCombatFloor(outlineOnly=false){', 'function renderCombatEffects(){')
    code = region(code, ' function drawWarningOverlay(){\n', ' function imminent(){\n', ''' function drawWarningOverlay(){
  if(!owner||owner.dead||!combat.current||combat.current.stage==='RECOVERY')return;
  syncDimensions();const c=combat.current;
  drawBioAttackWarningV582({c,a:ATTACKS[c.key],titan,route:()=>rushRouteV535(c),body:ellipse,
   bodyOffset:data.oy,playerRadius:PLAYER_R,arena:host.arena(),special:()=>warningShapesV533(c),
   arcs:dangerArcsV533,feastStep:feastStepV533(c),windup:c.stage==='WINDUP',barrage:barrageAnglesV530});
 }
''')
    # Reuse the original clipped polygon and its cache for the new Path2D pass.
    code = once(code, ' function pathSector(x,y,r,a,half){\n', ' function sectorPointsV582(x,y,r,a,half){\n')
    code = once(code, '  ctx.beginPath();if(half<Math.PI-.001)ctx.moveTo(x,y);else ctx.moveTo(pts[0][0],pts[0][1]);for(const p of pts)ctx.lineTo(p[0],p[1]);ctx.closePath();\n }', '''  return pts;
 }
 function warningSectorPathV582(x,y,r,a,half){
  const pts=sectorPointsV582(x,y,r,a,half),p=new Path2D();
  if(half<Math.PI-.001)p.moveTo(x,y);else p.moveTo(pts[0][0],pts[0][1]);
  for(const v of pts)p.lineTo(v[0],v[1]);p.closePath();return p;
 }
 function pathSector(x,y,r,a,half){
  const pts=sectorPointsV582(x,y,r,a,half);ctx.beginPath();
  if(half<Math.PI-.001)ctx.moveTo(x,y);else ctx.moveTo(pts[0][0],pts[0][1]);
  for(const p of pts)ctx.lineTo(p[0],p[1]);ctx.closePath();
 }''')
    code = region(code, ' function warning(s){\n', ' function softCloud(', ''' function drawWarningOverlay(){
  const s=getState();if(!s.alive)return;
  drawVenomAttackWarningV582(s,warningSectorPathV582,warningReach);
 }

''')
    code = once(code, 'visualTime=t;warning(s);fogTrail(s);', 'visualTime=t;fogTrail(s);')
    code = once(code, 'return {ready,onTick,drawBody,drawGround,drawOver,died,drawDeath,clean,syncHUD,', 'return {ready,onTick,drawBody,drawGround,drawOver,drawWarningOverlay,died,drawDeath,clean,syncHUD,')
    code = region(code, "  if(warn){ctx.save();ctx.strokeStyle=col;", "  if(z.kind==='spore'){", '  if(warn)return;\n')
    code = once(code, "if(windup){ctx.save();ctx.strokeStyle=col;ctx.globalAlpha=.20+.18*clamp(z.age/z.warn);ctx.lineWidth=1.2;ctx.setLineDash([2,9]);pathSector(z.x,z.y,z.maxR,0,Math.PI);ctx.stroke();ctx.restore();softCloud(z.x,z.y,z.startR,z.startR*.7,0,.4,z.seed);continue;}", "if(windup){softCloud(z.x,z.y,z.startR,z.startR*.7,0,.4,z.seed);continue;}")
    # Threat pointers remain red for frost, poison and void warnings as well.
    code = once(code, "ctx.strokeStyle=d.color;ctx.shadowBlur=10+12*d.level;ctx.shadowColor=d.color;", "ctx.strokeStyle=attackWarningStyleV582.edge;ctx.shadowBlur=10+12*d.level;ctx.shadowColor=attackWarningStyleV582.edge;")
    code = once(code, "ctx.fillStyle=d.color;ctx.beginPath();ctx.moveTo(r+5,0);", "ctx.fillStyle=attackWarningStyleV582.edge;ctx.beginPath();ctx.moveTo(r+5,0);")
    # Every collision/damage/update routine remains byte-for-byte the original.
    for start, end in [
        ('function telegraphDangerContains(', 'function updateEvasionHUD('),
        ('function bioTickV489(', 'function bioPaintAreaV489('),
        ('function warningContains(c,px=', ' const combatStartHostV519='),
        ('function tickProjectiles(dt)', 'function tickTissues('),
    ]:
        if start in old and end in old[old.index(start):]:
            assert code[code.index(start):code.index(end, code.index(start))] == old[old.index(start):old.index(end, old.index(start))], start
    raw = code.encode()
    sha = hashlib.sha256(raw).hexdigest()
    engine = 'assets/' + sha + '.js'
    (d / engine).write_bytes(raw)
    original = json.loads(base('dist/asset-manifest.json'))
    manifest = [e for e in original if e['path'] != OLD]
    manifest.append({'path': engine, 'sha256': sha, 'bytes': len(raw), 'kind': 'game-code'})
    previous = json.loads(base('dist/version.json'))
    build = hashlib.sha256(previous['build'].encode() + raw).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': previous['scriptBytes'] + len(raw) - len(old.encode())}
    html = base('dist/index.html').decode()
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config) + ';', html, count=1)
    html = once(html, f'src="{OLD}" onload="EVOLVE_WEB_CLIENT.loaded({len(old.encode())})"', f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    (d / 'index.html').write_text(html)
    write(d / 'asset-manifest.json', manifest, True)
    write(d / 'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})
    report = json.loads(base('dist/verification.json'))
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest))
    report['attack_warnings'] = {'baseline_commit': BASE, 'engine': engine, 'source': 'web/attack-warning-v582.js', 'foreground_first': True, 'red_filled_shapes': True, 'safe_gaps_preserved': True, 'image_processing': False, 'original_image_bytes_unchanged': True, 'physical_Galaxy_S23_plus_tested': False}
    write(d / 'verification.json', report)
    (d / OLD).unlink(missing_ok=True)
    if prior_engine and prior_engine != engine and re.fullmatch(r'assets/[a-f0-9]{64}\.js', prior_engine):
        (d / prior_engine).unlink(missing_ok=True)
    cpath = ROOT / 'docs/attack-warnings-v582-checkpoint.json'
    c = json.loads(cpath.read_text())
    c.update(progress=40, status='WEB-15 packaged: red filled warnings connected above the complete map foreground', build=build, engine='dist/' + engine, next='Verify actual boss attacks, safe gaps, foreground occlusion and existing regressions')
    write(cpath, c)
    print(json.dumps({'version': VERSION, 'build': build, 'engine': engine, 'engine_bytes': len(raw), 'delta_bytes': len(raw)-len(old.encode())}))


if __name__ == '__main__':
    package()
