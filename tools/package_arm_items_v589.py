#!/usr/bin/env python3
"""Add ARM equipment to the exact current WEB-21 engine; preserve other bytes."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '2243d05e416cdabfc12137ab34a7afd4d7e96c74'
VERSION = 'V575-WEB-22-ARM-ITEMS'


def base(path):
    return subprocess.check_output(['git', 'show', BASE+':'+path], cwd=ROOT)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2}))+'\n')


def main():
    d = ROOT/'dist'
    previous = json.loads(base('dist/version.json'))
    report = json.loads(base('dist/verification.json'))
    old_engine = report['original_player']['engine']
    original = base('dist/'+old_engine).decode()
    current = json.loads((d/'verification.json').read_text())
    prior_engine = current.get('arm_items', {}).get('engine', old_engine)
    art = json.loads((ROOT/'web/arm-items-art-v589.json').read_text())
    module = (ROOT/'web/arm-items-v589.js').read_text().replace("JSON.parse('__ARM_ITEMS_ART__')", json.dumps(art, separators=(',', ':')))
    code = original
    changes = []

    def patch(before, after):
        nonlocal code
        assert code.count(before) == 1, before[:100]
        code = code.replace(before, after)
        changes.append((before, after))

    patch('if(false&&state.arm>0&&player.shoot<=0){', "if(armItemModeV589()==='cannon'&&state.arm>0&&player.shoot<=0){")
    patch('if(target){let a=Math.atan2(target.y-player.y,target.x-player.x);\n      let siegeActive=',
          'if(target){let a=Math.atan2(target.y-player.y,target.x-player.x);a=armCannonVolleyV589(a,target);\n      let siegeActive=')
    patch('let aa=a+(i-(shots-1)/2)*spread,px=player.x+Math.cos(aa)*18,py=player.y+Math.sin(aa)*18;',
          'let aa=a+(i-(shots-1)/2)*spread,origin=armShotOriginV589(aa),px=origin.x,py=origin.y;')
    # The extra original ARM volleys retain all of their original behavior,
    # changing only their launch point to the equipped barrel.
    arm_start = code.index('  // ARM: 1★ single')
    arm_end = code.index('  // MOUTH: splash', arm_start)
    branch = code[arm_start:arm_end]
    for before in ['let px=player.x+Math.cos(a)*20,py=player.y+Math.sin(a)*20;']:
        assert branch.count(before) == 3
        after = 'let origin=armShotOriginV589(a),px=origin.x,py=origin.y;'
        new_branch = branch.replace(before, after)
        patch(branch, new_branch)
        branch = new_branch
    marker = '\nwindow.EVOLVE_WEB_GUARD='
    patch(marker, '\n'+module+'\nwindow.EVOLVE_WEB_GUARD=')
    reverted = code
    for before, after in reversed(changes):
        assert reverted.count(after) == 1
        reverted = reverted.replace(after, before)
    assert reverted == original, 'Unrelated baseline engine code changed'
    raw = code.encode()
    sha = hashlib.sha256(raw).hexdigest()
    engine = 'assets/'+sha+'.js'
    (d/engine).write_bytes(raw)
    manifest = json.loads(base('dist/asset-manifest.json'))
    preserved = 0
    for e in manifest:
        if e['path'] == old_engine:
            e.update(path=engine, sha256=sha, bytes=len(raw))
        elif e['kind'] == 'image':
            data = (d/e['path']).read_bytes()
            assert len(data) == e['bytes'] and hashlib.sha256(data).hexdigest() == e['sha256']
            preserved += 1
    assert preserved == 988
    for item in art['items'].values():
        for kind in ['left', 'right', 'icon']:
            e = item[kind]
            data = (d/e['path']).read_bytes()
            assert hashlib.sha256(data).hexdigest() == e['sha256'] and len(data) == e['bytes']
            manifest.append({k: e[k] for k in ['path', 'sha256', 'bytes']} | {'kind': 'image'})
    build = hashlib.sha256(previous['build'].encode()+raw+json.dumps(art, sort_keys=True).encode()).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': previous['scriptBytes']+len(raw)-len(original.encode())}
    html = base('dist/index.html').decode()
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';', html, count=1)
    before = f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(original.encode())})"'
    assert html.count(before) == 1
    html = html.replace(before, f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    (d/'index.html').write_text(html)
    write(d/'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})
    write(d/'asset-manifest.json', manifest, True)

    def refs(value):
        if isinstance(value, dict): return {k: refs(v) for k, v in value.items()}
        if isinstance(value, list): return [refs(v) for v in value]
        return engine if value == old_engine else value

    report = refs(report)
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), image_assets=preserved+6,
                  cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest))
    report['arm_items'] = {
        'engine': engine, 'baseline_commit': BASE, 'source': 'web/arm-items-v589.js',
        'implemented_ids': ['arm_cannon', 'arm_blades'], 'saved_equipment_ids_preserved': True,
        'icons_and_attachments': 'only the marked distal ends, extracted from supplied originals with RGB pixels unchanged',
        'cannon': 'the original ARM projectile fire, damage, collision, pierce and star progression; emitted from the equipped barrel',
        'blades': 'alternating timed swings; swept arc contact, one hit per enemy per swing, terrain occlusion, no ranged fallback',
        'bare_arm': 'unchanged alternating contact stabs', 'lightning_locked': True,
        'home_and_combat_equipment': True, 'original_character_source_and_anatomy_preserved': True,
        'armed_pose_cache': 20, 'per_frame_mesh_rebuilds': 0, 'existing_image_bytes_unchanged': preserved,
        'maps_bosses_save_keys_and_other_weapon_code_unchanged': True,
        'physical_Galaxy_S23_plus_tested': False,
    }
    write(d/'verification.json', report)
    for obsolete in {old_engine, prior_engine}-{engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js', obsolete)
        (d/obsolete).unlink(missing_ok=True)
    checkpoint = {
        'task': 'Implement the supplied cannon and blades as real ARM equipment, with marked-end-only icons',
        'progress': 50, 'status': 'Implementation packaged; functional and visual browser verification pending',
        'baseline_commit': BASE, 'version': VERSION, 'build': build, 'engine': 'dist/'+engine,
        'constraints': report['arm_items'],
        'next': 'Verify equipment UI and saved switching, actual original projectiles, swept blade contacts and walls, bare stabs, all preserved gameplay checks; then automatically publish and verify Pages',
    }
    write(ROOT/'docs/arm-items-v589-checkpoint.json', checkpoint)
    print(json.dumps(config | {'engine': engine, 'preserved_images': preserved, 'new_images': 6}))


if __name__ == '__main__':
    main()
