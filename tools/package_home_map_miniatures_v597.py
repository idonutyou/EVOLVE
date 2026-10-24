#!/usr/bin/env python3
"""Package destination miniatures into WEB-29 without touching combat or map data."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

from PIL import Image
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
BASE = 'f336a949c51a9dedc74c48c031c8c594f0a5b59f'
VERSION = 'V575-WEB-30-MAP-HOME'
DESTINATIONS = [
    ('infected', '감염 시설', 'INFECTED FACILITY', '#954a40'),
    ('facility1', '독성 화학공장', 'TOXIC CHEMICAL PLANT', '#809b44'),
    ('facility2', '핵폐기물 처리시설', 'NUCLEAR WASTE PROCESSING', '#a39641'),
    ('hub', '방사성 폐기물 중앙 광장', 'RADIOACTIVE WASTE PLAZA', '#87984a'),
    ('biolab', '격리 배양시설', 'QUARANTINE CULTIVATION LAB', '#9d6556'),
    ('red_biolab', '적색 배양공장', 'RED CULTIVATION FACTORY', '#aa3e3a'),
]


def old(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT)


def dump(path, value, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False,
                              **({'separators': (',', ':')} if compact else {'indent': 2})) + '\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--font', type=Path, required=True, help='Original NotoSansKR variable TTF')
    args = parser.parse_args()
    dist = ROOT / 'dist'
    manifest = json.loads(old('dist/asset-manifest.json'))
    version = json.loads(old('dist/version.json'))
    report = json.loads(old('dist/verification.json'))
    engine = report['admin_combat_v596']['engine']
    original = old('dist/' + engine).decode()
    code = original
    html = old('dist/index.html').decode()

    def asset(raw, ext, kind):
        sha = hashlib.sha256(raw).hexdigest()
        target = 'assets/' + sha + '.' + ext
        (dist / target).write_bytes(raw)
        if not any(e['path'] == target for e in manifest):
            manifest.append({'path': target, 'sha256': sha, 'bytes': len(raw), 'kind': kind})
        return {'path': target, 'sha256': sha, 'bytes': len(raw)}

    art = {'version': VERSION, 'maps': {}}
    source_dir = ROOT / 'art/home-map-miniatures-v597'
    for ident, ko, en, accent in DESTINATIONS:
        source = source_dir / (ident + ('.jpg' if ident == 'infected' else '.png'))
        raw = source.read_bytes()
        with Image.open(source) as image:
            width, height = image.size
            transparent = 'A' in image.getbands() and image.getchannel('A').getextrema()[0] == 0
            assert ident == 'infected' or transparent, 'Generated miniature must have real alpha: ' + ident
            assert width >= 1024 and height >= 1024
        if ident == 'infected':
            assert hashlib.sha256(raw).hexdigest() == '0bac4ff84e93141d62bc5de185dc551903b97932c2498a6a1c5f98328b083c1e'
        art['maps'][ident] = {'id': ident, 'ko': ko, 'en': en, 'accent': accent,
                             **asset(raw, source.suffix[1:], 'image'),
                             'width': width, 'height': height, 'opaque': not transparent}
    dump(ROOT / 'web/home-map-art-v597.json', art)

    # Only the new destination heading needs this small, licensed Korean subset.
    text = ''.join(ko + en for _, ko, en, _ in DESTINATIONS) + ' 0123456789·맵미니어처'
    options = subset.Options()
    options.flavor = 'woff'
    font = subset.load_font(str(args.font), options)
    sub = subset.Subsetter(options=options)
    sub.populate(text=text)
    sub.subset(font)
    font_path = source_dir / 'destination-labels.woff'
    subset.save_font(font, str(font_path), options)
    font_asset = asset(font_path.read_bytes(), 'woff', 'font')
    dump(ROOT / 'web/home-map-font-v597.json', font_asset | {
        'family': 'Noto Sans KR', 'license': 'docs/NOTO_SANS_KR_OFL.txt',
        'source': 'https://github.com/google/fonts/tree/main/ofl/notosanskr', 'subset_text': text})
    css = (ROOT / 'web/home-map-miniatures-v597.css').read_text().replace(
        '__HOME_MAP_FONT_V597__', Path(font_asset['path']).name)
    style_asset = asset(css.encode(), 'css', 'style')

    def replace(before, after, count=1):
        nonlocal code
        assert code.count(before) == count, (before[:100], code.count(before))
        code = code.replace(before, after)

    replace(" homeSetTextV522('homeStageTitleV522',homeTextV522('INFECTED FACILITY','감염 시설'));\n", '')
    start = code.index(" homeSetTextV522('homeOriginNameV522',ORIGINS[meta.origin]?.name||'PRIME CELL');")
    end = code.index(" $('start').disabled=", start)
    code = code[:start] + ' paintHomeMapV597();\n' + code[end:]
    # Equipped-arm and original-creature preview refreshes belong in the parts menu.
    replace("for(const id of ['heroSpecimenImg','partsSpecimenImgV523'])",
            "for(const id of ['partsSpecimenImgV523'])", count=2)
    for path in ['web/player-original-v588.js', 'web/arm-items-v589.js']:
        source = ROOT / path
        source.write_text(source.read_text().replace(
            "for(const id of ['heroSpecimenImg','partsSpecimenImgV523'])",
            "for(const id of ['partsSpecimenImgV523'])"))
    module = (ROOT / 'web/home-map-miniatures-v597.js').read_text().replace(
        "'__HOME_MAP_ART_V597__'", json.dumps(json.dumps(art, ensure_ascii=False, separators=(',', ':')), ensure_ascii=False))
    marker = '\nwindow.EVOLVE_WEB_GUARD='
    replace(marker, '\n' + module + marker)

    # The old specimen chamber is replaced only within the battle home view.
    start = html.index('        <div id="posterHero">')
    end = html.index('        <div class="stageIntelV522">', start)
    html = html[:start] + '''        <div id="posterHero" class="homeMapStageV597">
          <div class="homeMapShadowV597" aria-hidden="true"></div>
          <img id="heroSpecimenImg" alt="" decoding="async" data-i18n-ignore>
        </div>
''' + html[end:]
    html = html.replace('</head>', '<link rel="stylesheet" href="' + style_asset['path'] + '">\n</head>')

    raw = code.encode()
    engine_asset = asset(raw, 'js', 'game-code')
    manifest = [e for e in manifest if e['path'] != engine]
    html = html.replace(engine, engine_asset['path'])
    build = hashlib.sha256(version['build'].encode() + raw + html.encode() + css.encode()).hexdigest()
    config = {'version': VERSION, 'build': build,
              'scriptBytes': version['scriptBytes'] + len(raw) - len(original.encode()),
              'preloadResources': version['preloadResources']}
    html, replacements = re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',
                                 lambda m: 'window.EVOLVE_WEB_CONFIG=' + json.dumps(config, separators=(',', ':')) + ';', html, count=1)
    assert replacements == 1
    report = json.loads(json.dumps(report).replace(engine, engine_asset['path']))
    report.update(version=VERSION, build=build, index_bytes=len(html.encode()),
                  cached_bytes=sum(e['bytes'] for e in manifest))
    report['home_map_miniatures_v597'] = {
        'baseline': BASE, 'engine': engine_asset['path'], 'stylesheet': style_asset['path'],
        'art': art['maps'], 'font': font_asset, 'stage_mapping_unchanged': True,
        'original_image_bytes_unchanged': sum(e['kind'] == 'image' for e in json.loads(old('dist/asset-manifest.json'))),
        'recovered_reference_unchanged': True, 'physical_Galaxy_S23_plus_tested': False}
    version.update(config, assets=len(manifest))
    (dist / 'index.html').write_text(html)
    dump(dist / 'asset-manifest.json', manifest, compact=True)
    dump(dist / 'version.json', version)
    dump(dist / 'verification.json', report)
    if engine != engine_asset['path']:
        (dist / engine).unlink(missing_ok=True)
    # Validate every pre-existing image, including actual combat maps, byte-for-byte.
    for entry in json.loads(old('dist/asset-manifest.json')):
        if entry['kind'] == 'image':
            raw = (dist / entry['path']).read_bytes()
            assert len(raw) == entry['bytes'] and hashlib.sha256(raw).hexdigest() == entry['sha256']
    dump(ROOT / 'docs/home-map-v597-checkpoint.json', {
        'version': VERSION, 'build': build, 'progress': 70,
        'status': 'Six original-resolution miniatures packaged; browser verification pending',
        'baseline': BASE, 'branch': 'home-map-miniatures-v597',
        'saved_images': list(art['maps']), 'deployment_pending': True})
    print(json.dumps(config | {'engine': engine_asset['path'], 'assets': len(manifest)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
