#!/usr/bin/env python3
"""Build the requested upgrade UI and a viewport-only paused repaint fix."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '824612442201bc2a6a15d5e6e5642b03e9792d17'
VERSION = 'V575-WEB-41-UPGRADE-SCENERY'

def old(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)

def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def main():
    dist = ROOT / 'dist'
    version = json.loads(old('dist/version.json'))
    report = json.loads(old('dist/verification.json'))
    manifest = json.loads(old('dist/asset-manifest.json'))
    previous = json.loads((dist / 'asset-manifest.json').read_text())
    reference = report['upgrade_reference']['reference']
    assert hashlib.sha256((dist / reference['path']).read_bytes()).hexdigest() == reference['sha256']

    def add(raw, extension, kind):
        sha = hashlib.sha256(raw).hexdigest()
        name = 'assets/' + sha + '.' + extension
        (dist / name).write_bytes(raw)
        manifest.append({'path': name, 'sha256': sha, 'bytes': len(raw), 'kind': kind})
        return name

    base_engine = report['home_hub_v601']['engine']
    base_code = old('dist/' + base_engine)
    anchor = b'let frozenFrameDrawnV438=false,pausedDrawsSkippedV438=0;'
    assert base_code.count(anchor) == 1
    viewport_hook = (ROOT / 'web/viewport-redraw-v609.js').read_bytes()
    engine_code = base_code.replace(anchor, anchor + b'\n' + viewport_hook, 1)
    engine_kind = next(e['kind'] for e in manifest if e['path'] == base_engine)
    manifest = [e for e in manifest if e['path'] != base_engine]
    engine = add(engine_code, 'js', engine_kind)
    report = json.loads(json.dumps(report).replace(base_engine, engine))
    version['scriptBytes'] += len(engine_code) - len(base_code)

    source = (ROOT / 'web/upgrade-scenery-v608.js').read_text()
    assert source.count('__UPGRADE_SCENERY_ART_V608__') == 1
    js = source.replace('__UPGRADE_SCENERY_ART_V608__', json.dumps(reference, separators=(',', ':'))).encode()
    css = (ROOT / 'web/upgrade-scenery-v608.css').read_bytes()
    script = add(js, 'js', 'presentation-code')
    style = add(css, 'css', 'style')
    html = old('dist/index.html').decode().replace(base_engine, engine)
    html = html.replace('</head>', '<link rel="stylesheet" href="' + style + '">\n<script defer src="' + script + '"></script>\n</head>')
    build = hashlib.sha256(version['build'].encode() + js + css + html.encode()).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': version['scriptBytes'], 'preloadResources': True}
    html, count = re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config, separators=(',', ':')) + ';', html, count=1)
    assert count == 1
    (dist / 'index.html').write_text(html)
    version.update(config, assets=len(manifest))
    dump(dist / 'version.json', version)
    (dist / 'asset-manifest.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest))
    report['upgrade_reference'].update(level_visible=False, level_display='Original top-left combat HUD only')
    report['upgrade_scenery_v608'] = {
        'baseline': BASE, 'script': script, 'stylesheet': style,
        'reference': reference, 'original_image_bytes_unchanged': True,
        'engine_unchanged': False, 'engine_baseline': base_engine,
        'engine_change': 'Only the viewport event repaint hook; no simulation or combat changes',
        'gameplay_unchanged': True, 'viewport_repaint_only': True,
        'opaque_contour_interior': True, 'blue_reference_reroll_frame': True,
        'partial_reference_contours': True,
        'paused_battlefield_visible': True, 'exact_korean_reference_header': True,
        'duplicate_player_level_hidden': True, 'original_skill_levels_retained': True,
        'reroll_centered': True, 'reroll_handler_and_rules_unchanged': True,
        'save_keys_unchanged': True, 'physical_Galaxy_S23_plus_tested': False,
    }
    dump(dist / 'verification.json', report)
    keep = {e['path'] for e in manifest}
    for e in previous:
        if e['path'] not in keep and e['kind'] in ('style', 'presentation-code'):
            (dist / e['path']).unlink(missing_ok=True)
    images = [e for e in json.loads(old('dist/asset-manifest.json')) if e['kind'] == 'image']
    for e in images:
        assert hashlib.sha256((dist / e['path']).read_bytes()).hexdigest() == e['sha256'], e['path']
    assert engine_code.replace(anchor + b'\n' + viewport_hook, anchor, 1) == base_code
    print(json.dumps(config | {'script': script, 'stylesheet': style, 'original_images_preserved': len(images), 'engine_change': 'viewport repaint only'}))

if __name__ == '__main__':
    main()
