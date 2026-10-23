#!/usr/bin/env python3
"""Recover exact generated WEB-17 artwork through a short-lived encrypted handoff."""
import base64, hashlib, json, os, re, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = Path(tempfile.mkdtemp(prefix='evolve-web17-'))
os.chmod(PRIVATE, 0o700)
KEY = PRIVATE / 'private.pem'
SESSION = ROOT / 'docs/web17-recovery-session.json'
ENVELOPE = ROOT / 'docs/web17-recovery-envelope.json'
RUN = os.environ['GITHUB_RUN_ID']

def run(args, **kwargs):
    return subprocess.run(args, check=True, cwd=ROOT, **kwargs)

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def checkpoint(progress, status, **extra):
    p = ROOT / 'docs/reference-lettering-v584-checkpoint.json'
    c = json.loads(p.read_text())
    c.update(progress=progress, status=status, **extra)
    write(p, c)

def commit(message, paths):
    run(['git', 'add', '--all', '--'] + paths)
    run(['git', 'commit', '-m', message])
    run(['git', 'push', 'origin', 'HEAD:online-v575'])

try:
    run(['git', 'config', 'user.name', 'github-actions[bot]'])
    run(['git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'])
    run(['openssl', 'genpkey', '-algorithm', 'RSA', '-pkeyopt', 'rsa_keygen_bits:2048', '-out', str(KEY)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.chmod(KEY, 0o600)
    modulus = subprocess.check_output(['openssl', 'rsa', '-in', str(KEY), '-modulus', '-noout'], text=True).strip().split('=', 1)[1]
    write(SESSION, {'run_id': RUN, 'modulus': modulus, 'exponent': 65537, 'encryption': 'RSA-OAEP-SHA256', 'status': 'waiting for encrypted original-image handoff'})
    commit('[skip ci] WEB-17: open temporary artwork recovery handoff', ['docs/web17-recovery-session.json'])
    envelope = None
    for _ in range(120):
        url = 'https://api.github.com/repos/idonutyou/EVOLVE/contents/docs/web17-recovery-envelope.json?ref=online-v575'
        request = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github.raw+json', 'User-Agent': 'EVOLVE-WEB17-Recovery'})
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                value = json.load(response)
            if value.get('run_id') == RUN:
                envelope = value
                break
        except Exception:
            pass
        time.sleep(10)
    if envelope is None:
        raise RuntimeError('Timed out waiting for the encrypted artwork handoff')
    blocks = []
    for block in envelope['blocks']:
        encrypted = base64.b64decode(block)
        result = run(['openssl', 'pkeyutl', '-decrypt', '-inkey', str(KEY), '-pkeyopt', 'rsa_padding_mode:oaep', '-pkeyopt', 'rsa_oaep_md:sha256', '-pkeyopt', 'rsa_mgf1_md:sha256'], input=encrypted, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        blocks.append(result.stdout)
    payload_raw = b''.join(blocks)
    if hashlib.sha256(payload_raw).hexdigest() != envelope['sha256']:
        raise RuntimeError('Recovered handoff checksum mismatch')
    payload = json.loads(payload_raw)
    for name in ['library_file_transfer.py', 'library_hosted_apps.py']:
        (PRIVATE / name).write_text(payload['helpers'][name])
    originals = {}
    for item in payload['files']:
        transfer = item['transfer']
        if transfer.get('workspace_path'):
            raise RuntimeError('The transfer was placed in the unavailable original workspace')
        destination = PRIVATE / item['key']
        destination.mkdir()
        source = destination / item['file_name']
        result = subprocess.run([sys.executable, str(PRIVATE / 'library_file_transfer.py'), 'materialize', str(source)], input=json.dumps(transfer), text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode:
            detail = re.sub(r'https?://\S+', '[private transfer]', result.stderr + result.stdout)
            raise RuntimeError('Artwork materialization failed: ' + detail[-1600:])
        raw = source.read_bytes()
        if len(raw) != item['bytes']:
            raise RuntimeError('Recovered original image size mismatch: ' + item['key'])
        digest = hashlib.sha256(raw).hexdigest()
        if item.get('sha256') and digest != item['sha256']:
            raise RuntimeError('Recovered original image hash mismatch: ' + item['key'])
        originals[item['key']] = (source, raw, digest)
    run(['git', 'fetch', 'origin', 'online-v575', '--depth=1'])
    run(['git', 'reset', '--hard', 'FETCH_HEAD'])
    art_path = ROOT / 'web/warning-branding-art-v581.json'
    art = json.loads(art_path.read_text())
    for key, atlas in [('bio', 'bio_regeneration'), ('ko', 'korean_labels')]:
        source, raw, digest = originals[key]
        image = Image.open(source)
        if image.mode != 'RGBA' or image.getextrema()[3] != (0, 255):
            raise RuntimeError('Original artwork must retain true RGBA transparency')
        path = 'assets/' + digest + '.png'
        (ROOT / 'dist' / path).write_bytes(raw)
        art['atlases'][atlas] = {'path': path, 'sha256': digest, 'bytes': len(raw), 'width': image.width, 'height': image.height, 'alpha': True, 'draft': False}
    bio = Image.open(originals['bio'][0])
    if bio.size != (2033, 773):
        raise RuntimeError('Unexpected BIO original dimensions')
    art['sprites']['bio'] = {'atlas': 'bio_regeneration', 'crop': [31, 107, 1971, 563], 'cache_height': 210, 'height_scale': 1}
    art['sprites']['venom']['height_scale'] = 0.631868131868132
    korean = Image.open(originals['ko'][0])
    if korean.size != (1774, 887):
        raise RuntimeError('Unexpected Korean original dimensions')
    selections = [('warning_ko', 0, 1, 96), ('breach_ko', 1, 1, 64), ('phase_ko', 0, 2, 48), ('subtitle_ko', 1, 2, 48)]
    crops = {}
    for name, col, row, height in selections:
        x0, y0, x1, y1 = col * korean.width // 2, row * korean.height // 3, (col + 1) * korean.width // 2, (row + 1) * korean.height // 3
        alpha = korean.getchannel('A').crop((x0, y0, x1, y1))
        bounds = alpha.point(lambda a: 255 if a > 20 else 0).getbbox()
        if bounds is None:
            raise RuntimeError('Korean lettering cell is empty: ' + name)
        left, top, right, bottom = max(0, bounds[0]-2), max(0, bounds[1]-2), min(x1-x0, bounds[2]+2), min(y1-y0, bounds[3]+2)
        crop = [x0+left, y0+top, right-left, bottom-top]
        art['sprites'][name] = {'atlas': 'korean_labels', 'crop': crop, 'cache_height': height}
        crops[name] = crop
    assert len(art['sprites']) == 14 and 'bio_ko' not in art['sprites'] and 'venom_ko' not in art['sprites']
    write(art_path, art)
    write(ROOT / 'docs/reference-lettering-v584-proportions.json', {'reference_ink_bounds': [45,1190,767,177], 'reference_ink_aspect': 13/3, 'browser_cached_venom_ink_bounds': [9,8,460,168], 'required_height_scale': 0.631868131868132, 'rendered_ink_aspect': 13/3, 'method': 'Native Canvas cached ink and actual destination scaling; original image bytes preserved'})
    write(ROOT / 'docs/reference-lettering-v584-recovery.json', {'original_bytes_recovered': True, 'bio_sha256': originals['bio'][2], 'korean_sha256': originals['ko'][2], 'bio_bytes': len(originals['bio'][1]), 'korean_bytes': len(originals['ko'][1]), 'korean_crops': crops, 'unused_korean_boss_names': True, 'boss_names': {'en': ['BIO TITAN','VENOM TITAN'], 'ko': ['BIO TITAN','VENOM TITAN']}, 'physical_Galaxy_S23_plus_tested': False})
    run(['git', 'fetch', 'origin', 'd8f6d2eaa6aa28a884c3eb2a3c5009c5711353af', '--depth=1'])
    run([sys.executable, 'tools/package_reference_lettering_v584.py'])
    checkpoint(80, 'Exact original images recovered and final lettering packaged; English boss names in both locales, four Korean labels; browser validation pending', latest_user_request='보스들 이름은 그대로 영어 쓰고 나머지만 한글화 해서 이어서 가자', corrections_pending={}, next='Run guarded browser and regression checks, then deploy automatically')
    ENVELOPE.unlink(missing_ok=True)
    SESSION.unlink(missing_ok=True)
    commit('[skip ci] WEB-17 80%: recover exact art, preserve English boss names and package Korean labels', ['dist', 'web/warning-branding-art-v581.json', 'docs/reference-lettering-v584-checkpoint.json', 'docs/reference-lettering-v584-proportions.json', 'docs/reference-lettering-v584-recovery.json', 'docs/web17-recovery-session.json', 'docs/web17-recovery-envelope.json'])
    print('Exact artwork restored and packaged; private transfer data removed.')
finally:
    import shutil
    shutil.rmtree(PRIVATE, ignore_errors=True)
