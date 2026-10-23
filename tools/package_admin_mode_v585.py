#!/usr/bin/env python3
"""Expose developer controls only after five footer CODEX presses; preserve current game/art."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='c66a8a9ee606d11db22f9ce9949ba19e4a032f06'
VERSION='V575-WEB-18-HIDDEN-ADMIN'
def base(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def write(path,value,compact=False):path.write_text(json.dumps(value,ensure_ascii=False,**({'separators':(',',':')} if compact else {'indent':2}))+'\n')
def once(text,before,after):
    assert text.count(before)==1,'Unexpected source anchor: '+before[:100]
    return text.replace(before,after)
def main():
    d=ROOT/'dist';previous=json.loads(base('dist/version.json'));report=json.loads(base('dist/verification.json'))
    old_engine=report['attack_warnings']['engine'];original=base('dist/'+old_engine).decode();code=original
    state=(ROOT/'web/admin-state-v585.js').read_text();runtime=(ROOT/'web/admin-mode-v585.js').read_text()
    changes=[]
    for patch in json.loads((ROOT/'web/admin-mode-patches-v585.json').read_text()):
        before=patch['before'];after=patch['after'].replace('__ADMIN_STATE__',state).replace('__ADMIN_RUNTIME__',runtime)
        code=once(code,before,after);changes.append((before,after))
    reverted=code
    for before,after in reversed(changes):reverted=once(reverted,after,before)
    assert reverted==original,'Unexpected unrelated engine changes'
    raw=code.encode();sha=hashlib.sha256(raw).hexdigest();engine='assets/'+sha+'.js'
    prior_engine=json.loads((d/'verification.json').read_text())['attack_warnings']['engine']
    (d/engine).write_bytes(raw)
    manifest=json.loads(base('dist/asset-manifest.json'))
    for entry in manifest:
        if entry['path']==old_engine:entry.update(path=engine,sha256=sha,bytes=len(raw))
        elif entry['kind']=='image':assert hashlib.sha256((d/entry['path']).read_bytes()).hexdigest()==entry['sha256'],entry['path']
    build=hashlib.sha256(previous['build'].encode()+raw).hexdigest()
    config={'version':VERSION,'build':build,'scriptBytes':previous['scriptBytes']+len(raw)-len(original.encode())}
    html=base('dist/index.html').decode()
    html=once(html,'</head>','<style id="adminModeStyleV585">\n'+(ROOT/'web/admin-mode-v585.css').read_text()+'</style>\n</head>')
    html=re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda _:'window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';',html,count=1)
    html=once(html,f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(original.encode())})"',f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    (d/'index.html').write_text(html);write(d/'asset-manifest.json',manifest,True)
    write(d/'version.json',config|{'assets':len(manifest),'source_sha256':previous['source_sha256']})
    def update_refs(value):
        if isinstance(value,dict):return {k:update_refs(v) for k,v in value.items()}
        if isinstance(value,list):return [update_refs(v) for v in value]
        return engine if value==old_engine else value
    report=update_refs(report)
    report.update(version=VERSION,build=build,index_bytes=len(html.encode()),image_assets=sum(x['kind']=='image' for x in manifest),cached_files=len(manifest),cached_bytes=sum(x['bytes'] for x in manifest))
    report['admin_mode']={'engine':engine,'baseline_commit':BASE,'unlock':'five consecutive footer codex button clicks','default_enabled':False,'session_only':True,'normal_start_stage':1,'normal_start_level':1,'normal_progress_key':'EVOLVE_V575_TEST_NORMAL_PROGRESS_V585','saved_test_preferences_ignored_in_normal_play':True,'all_image_bytes_unchanged':True,'existing_maps_and_collision_data_unchanged':True}
    write(d/'verification.json',report)
    for path in {old_engine,prior_engine}-{engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js',path)
        (d/path).unlink(missing_ok=True)
    p=ROOT/'docs/admin-mode-v585-checkpoint.json';checkpoint=json.loads(p.read_text())
    checkpoint.update(progress=60,status='Normal play and hidden admin mode packaged; browser verification pending',version=VERSION,build=build,engine='dist/'+engine,next='Verify real footer clicks, level-one normal battle, admin controls, saved data and reload behavior',image_assets_unchanged=report['image_assets'])
    write(p,checkpoint)
    print(json.dumps(config|{'engine':engine,'image_assets_unchanged':report['image_assets']}))
if __name__=='__main__':main()
