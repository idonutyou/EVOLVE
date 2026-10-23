#!/usr/bin/env python3
"""Replace cinematic lettering on current WEB-16, preserving all gameplay and other art."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'd8f6d2eaa6aa28a884c3eb2a3c5009c5711353af'
VERSION = 'V575-WEB-17-REFERENCE-LETTERING'


def base(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)


def write(path, value, compact=False):
    path.write_text(json.dumps(value, ensure_ascii=False, **({'separators': (',', ':')} if compact else {'indent': 2})) + '\n')


def once(source, before, after):
    assert source.count(before) == 1, 'Unexpected source anchor: ' + before[:90]
    return source.replace(before, after)


def branding(source, art):
    return source.replace("JSON.parse('__WARNING_BRANDING_ART__')", json.dumps(art, separators=(',', ':')))


def package():
    d = ROOT / 'dist'
    previous = json.loads(base('dist/version.json'))
    report = json.loads(base('dist/verification.json'))
    old_engine = report['attack_warnings']['engine']
    old_art = json.loads(base('web/warning-branding-art-v581.json'))
    art = json.loads((ROOT / 'web/warning-branding-art-v581.json').read_text())
    assert len(art['sprites']) == 14
    assert {k for k in art['sprites'] if k.endswith('_ko')} == {'warning_ko', 'breach_ko', 'phase_ko', 'subtitle_ko'}
    assert art['sprites']['venom']['height_scale'] == 0.631868131868132
    assert art['sprites']['bio']['atlas'] == 'bio_regeneration'
    assert art['sprites']['crest'] == old_art['sprites']['crest']
    assert art['atlases']['crest_digits'] == old_art['atlases']['crest_digits']
    for a in art['atlases'].values():
        assert a['alpha'] and not a.get('draft')
        assert hashlib.sha256((d / a['path']).read_bytes()).hexdigest() == a['sha256']
    original = base('dist/' + old_engine).decode()
    old_module = branding(base('web/warning-branding-v581.js').decode(), old_art)
    new_module = branding((ROOT / 'web/warning-branding-v581.js').read_text(), art)
    code = once(original, old_module, new_module)
    old_cinematic = base('web/boss-cinematic-v580.js').decode()
    new_cinematic = (ROOT / 'web/boss-cinematic-v580.js').read_text()
    # A darker center behind the reference's red WARNING makes its lettering legible.
    assert new_cinematic.replace('linear-gradient(#23090cf2,#430e10f2)', 'linear-gradient(#b41c20b8,#dc3d28d9)') == old_cinematic
    cinematic_art = json.dumps(json.loads(base('web/boss-cinematic-art-v580.json')), separators=(',', ':'))
    old_cinematic = old_cinematic.replace("JSON.parse('__BOSS_CINEMATIC_ART__')", cinematic_art)
    new_cinematic = new_cinematic.replace("JSON.parse('__BOSS_CINEMATIC_ART__')", cinematic_art)
    code = once(code, old_cinematic, new_cinematic)
    # Only lettering presentation and the supporting tape contrast may change.
    assert code.replace(new_module, old_module).replace(new_cinematic, old_cinematic) == original
    raw = code.encode()
    sha = hashlib.sha256(raw).hexdigest()
    engine = 'assets/' + sha + '.js'
    prior_report = json.loads((d / 'verification.json').read_text())
    prior_engine = prior_report['attack_warnings']['engine']
    stale_art = {a['path'] for a in prior_report['painted_warning']['art']['atlases'].values()} - {a['path'] for a in art['atlases'].values()}
    (d / engine).write_bytes(raw)
    removed = {a['path'] for a in old_art['atlases'].values()} - {a['path'] for a in art['atlases'].values()}
    for p in removed:
        assert p not in code and p not in base('dist/index.html').decode()
    old_manifest = json.loads(base('dist/asset-manifest.json'))
    manifest = [e for e in old_manifest if e['path'] not in removed | {old_engine}]
    existing = {e['path'] for e in manifest}
    for a in art['atlases'].values():
        if a['path'] not in existing:
            manifest.append({k: a[k] for k in ['path', 'sha256', 'bytes']} | {'kind': 'image'})
    manifest.append({'path': engine, 'sha256': sha, 'bytes': len(raw), 'kind': 'game-code'})
    kept_images = [e for e in old_manifest if e['kind'] == 'image' and e['path'] not in removed]
    for e in kept_images:
        assert hashlib.sha256((d / e['path']).read_bytes()).hexdigest() == e['sha256'], e['path']
    build = hashlib.sha256(previous['build'].encode() + raw).hexdigest()
    config = {'version': VERSION, 'build': build, 'scriptBytes': previous['scriptBytes'] + len(raw) - len(original.encode())}
    html = base('dist/index.html').decode()
    html = re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};', lambda _: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config) + ';', html, count=1)
    html = once(html, f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(original.encode())})"', f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    (d / 'index.html').write_text(html)
    write(d / 'asset-manifest.json', manifest, True)
    write(d / 'version.json', config | {'assets': len(manifest), 'source_sha256': previous['source_sha256']})
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()), image_assets=sum(e['kind'] == 'image' for e in manifest), cached_files=len(manifest), cached_bytes=sum(e['bytes'] for e in manifest))
    report['painted_warning'].update(baseline_commit=BASE, engine=engine, art=art, reference='1000027488.png', typography_only=True, crest_unchanged=True, remaining_original_images=len(kept_images), remaining_original_image_bytes_unchanged=True)
    report['attack_warnings']['engine'] = engine
    write(d / 'verification.json', report)
    for p in (removed | stale_art | {old_engine, prior_engine}) - {engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.(js|png)', p)
        (d / p).unlink(missing_ok=True)
    p = ROOT / 'docs/reference-lettering-v584-checkpoint.json'
    c = json.loads(p.read_text())
    c.update(progress=50, status='WEB-17 packaged: approved reference lettering and digits, existing crest and all other artwork preserved', build=build, engine='dist/' + engine, art=art, original_images_unchanged=len(kept_images), removed_assets=sorted(removed), next='Inspect actual cinematic lettering in portrait and landscape; run required checks and deploy automatically')
    write(p, c)
    print(json.dumps(config | {'engine': engine, 'original_images_unchanged': len(kept_images), 'removed_assets': sorted(removed)}))


if __name__ == '__main__':
    package()
