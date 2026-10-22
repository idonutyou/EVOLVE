#!/usr/bin/env python3
"""Replace warning branding and remove the proven obsolete final-boss HUD."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'f882e4fa847fcfec7eabe842e1c50e145730d312'
OLD = 'assets/929efe5ea18e03f6f8eb28f7491e5b03db8b47e40b3cf00f4c39387130087afb.js'
VERSION = 'V575-WEB-14-PAINTED-WARNING'
REMOVED = [
    'assets/080eff25c63f7a7cf59845f5077ea5793f48f266cd1ee1eb59c8350aae2f99e4.jpg',
    'assets/aed5400c9d32d768d8ab73e00a3165ef007a4584c48e11c41d0689e53ef2d50d.jpg',
]


def base(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2})) + '\n')


def replace_once(source, before, after):
    assert source.count(before) == 1, 'Unexpected source anchor: ' + before[:90]
    return source.replace(before, after)


def remove_final_svg(html):
    start = html.index('<svg id="finalArtV417"')
    depth = 0
    for tag in re.finditer(r'</?svg\b[^>]*>', html[start:]):
        depth += -1 if tag.group().startswith('</') else 1
        if depth == 0:
            end = start + tag.end()
            return html[:start] + html[end:], end - start
    raise ValueError('Unbalanced obsolete final HUD SVG')


def clean_final_css(html):
    def style(match):
        def rule(m):
            selectors = [s for s in m[1].split(',') if '#finalArtV417' not in s]
            return ','.join(selectors) + '{' + m[2] + '}' if selectors else ''
        return match[1] + re.sub(r'([^{}]+)\{([^{}]*)\}', rule, match[2]) + match[3]
    return re.sub(r'(<style\b[^>]*>)(.*?)(</style>)', style, html, flags=re.S)


def package():
    d = ROOT / 'dist'
    art = json.loads((ROOT / 'web/warning-branding-art-v581.json').read_text())
    assert len(art['atlases']) == 2 and len(art['sprites']) == 10
    for a in art['atlases'].values():
        assert not a.get('draft') and a['alpha']
        assert hashlib.sha256((d / a['path']).read_bytes()).hexdigest() == a['sha256']
    old = base('dist/' + OLD).decode()
    old_cinematic = base('web/boss-cinematic-v580.js').decode().replace(
        "JSON.parse('__BOSS_CINEMATIC_ART__')", json.dumps(json.loads(base('web/boss-cinematic-art-v580.json')), separators=(',', ':')))
    new_cinematic = (ROOT / 'web/boss-cinematic-v580.js').read_text().replace(
        "JSON.parse('__BOSS_CINEMATIC_ART__')", json.dumps(json.loads((ROOT / 'web/boss-cinematic-art-v580.json').read_text()), separators=(',', ':')))
    branding = (ROOT / 'web/warning-branding-v581.js').read_text().replace(
        "JSON.parse('__WARNING_BRANDING_ART__')", json.dumps(art, separators=(',', ':')))
    code = replace_once(old, old_cinematic, branding + '\n' + new_cinematic)
    start = code.index('  if(threat.finalBoss){\n', code.index('function syncArtHUDV417(){'))
    end = code.index('    fitArtTextV417($(\'midNameV417\')', start)
    legacy_code_bytes = len(code[start:end].encode())
    code = code[:start] + '  if(!threat.finalBoss){\n' + code[end:]
    code = replace_once(code, "'#artHudV417 #midArtV417 image, #artHudV417 #finalArtV417 image'", "'#artHudV417 #midArtV417 image'")
    code = replace_once(code,
        "  const s=getState(),root=$('artHudV417'),on=!!s.alive&&hudThreatV411()===s.boss&&running&&!ended;\n  root.dataset.venomV538=on?'true':'false';if(!on)return;",
        "  const observed=getState(),boss=hudThreatV411(),root=$('artHudV417'),on=!!boss?.venomV537&&running&&!ended;\n  root.dataset.venomV538=on?'true':'false';if(!on)return;\n  // The visible boss owns the HUD during arrival, before its combat AI starts.\n  const s=observed.alive&&observed.boss===boss?observed:{boss,phase:boss.venomPhaseV554||boss.encounterPhaseV526||1,toxin:0,poison:{count:0},corrosion:0,cycle:{mode:'arrival',remaining:0}};")
    code = replace_once(code, "if(e.finalBoss)discover('boss:'+e.bossName);return e;", "if(e.finalBoss){discover('boss:'+e.bossName);syncArtHUDV417();}return e;")
    code = replace_once(code, "$('bossname').textContent=s.name;updateBossPhaseStrip(e);", "$('bossname').textContent=s.name;updateBossPhaseStrip(e);syncArtHUDV417();")
    code = replace_once(code, 'monsterReadyV577,redPulseImageReadyV579,cinematicReadyV580]', 'monsterReadyV577,redPulseImageReadyV579,cinematicReadyV580,warningBrandReadyV581]')
    raw = code.encode()
    sha = hashlib.sha256(raw).hexdigest()
    engine = 'assets/' + sha + '.js'
    (d / engine).write_bytes(raw)
    html, svg_bytes = remove_final_svg(base('dist/index.html').decode())
    html = clean_final_css(html)
    assert 'finalArtV417' not in html
    # Prove these images have no other runtime consumer before deleting them.
    for p in REMOVED:
        assert p not in html and p not in code
        for candidate in d.rglob('*'):
            if candidate.suffix in ['.html', '.css', '.js'] and candidate != d / 'index.html' and candidate != d / OLD:
                assert p not in candidate.read_text(), str(candidate)
    original = json.loads(base('dist/asset-manifest.json'))
    images = [e for e in original if e['kind'] == 'image' and e['path'] not in REMOVED]
    for e in images:
        assert hashlib.sha256((d / e['path']).read_bytes()).hexdigest() == e['sha256'], e['path']
    removed_bytes = sum(e['bytes'] for e in original if e['path'] in REMOVED)
    manifest = [e for e in original if e['path'] not in REMOVED + [OLD]]
    manifest += [{'path': engine, 'sha256': sha, 'bytes': len(raw), 'kind': 'game-code'}]
    manifest += [{k: a[k] for k in ['path', 'sha256', 'bytes']} | {'kind': 'image'} for a in art['atlases'].values()]
    previous = json.loads(base('dist/version.json'))
    build = hashlib.sha256(previous['build'].encode() + raw).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': previous['scriptBytes'] + len(raw) - len(old.encode())}
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config) + ';', html, count=1)
    html = replace_once(html, f'src="{OLD}" onload="EVOLVE_WEB_CLIENT.loaded({len(old.encode())})"', f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    (d / 'index.html').write_text(html)
    write(d / 'asset-manifest.json', manifest, True)
    write(d / 'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})
    cleanup = {'removed_assets': REMOVED, 'removed_asset_bytes': removed_bytes, 'removed_svg_bytes': svg_bytes, 'removed_legacy_update_code_bytes': legacy_code_bytes, 'final_hud_preprocessing_removed': True, 'remaining_original_images': len(images), 'remaining_original_image_bytes_unchanged': True, 'venom_hud_owner': 'visible threat from first arrival, independently of AI activation'}
    write(ROOT / 'docs/obsolete-final-hud-v581-audit.json', cleanup)
    report = json.loads(base('dist/verification.json'))
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), image_assets=len(images) + 2, cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest))
    report['painted_warning'] = {'baseline_commit': BASE, 'engine': engine, 'art': art, 'sprite_cache_once': True, 'per_frame_image_processing': False, 'visible_font_rendering': False, 'cleanup': cleanup, 'physical_Galaxy_S23_plus_tested': False}
    write(d / 'verification.json', report)
    checkpoint = ROOT / 'docs/warning-branding-v581-checkpoint.json'
    c = json.loads(checkpoint.read_text())
    c.update(progress=40, status='WEB-14 packaged; obsolete final HUD and two dedicated images removed', build=build, engine='dist/' + engine, cleanup=cleanup, next='Verify raster branding and the first native VENOM arrival frame, then run existing regressions')
    write(checkpoint, c)
    for path in REMOVED + [OLD]:
        (d / path).unlink(missing_ok=True)
    print(json.dumps({'version': VERSION, 'build': build, 'engine': engine, 'cleanup': cleanup}))


if __name__ == '__main__':
    package()
