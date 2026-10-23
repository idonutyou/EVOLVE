#!/usr/bin/env python3
"""Add the default painted player and unequipped melee path to the exact WEB-18 baseline."""
import hashlib,json,re,subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='2235f3b56c51434d0a555f0c9b3512c13c4708b6'
VERSION='V575-WEB-19-DEFAULT-SCORPION'
def base(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def write(path,value,compact=False):path.write_text(json.dumps(value,ensure_ascii=False,**({'separators':(',',':')} if compact else {'indent':2}))+'\n')
def replace(text,before,after,count=1):
    assert text.count(before)==count,'Unexpected source anchor: '+before[:100]
    return text.replace(before,after)
def main():
    d=ROOT/'dist';previous=json.loads(base('dist/version.json'));report=json.loads(base('dist/verification.json'))
    old_engine=report['admin_mode']['engine'];original=base('dist/'+old_engine).decode();code=original
    current_report=json.loads((d/'verification.json').read_text());prior_engine=current_report.get('player_scorpion',{}).get('engine',old_engine)
    art=json.loads((ROOT/'web/player-scorpion-art-v586.json').read_text());raw_art=(d/art['path']).read_bytes()
    assert hashlib.sha256(raw_art).hexdigest()==art['sha256'] and len(raw_art)==art['bytes']
    changes=[]
    def patch(before,after,count=1):
        nonlocal code
        code=replace(code,before,after,count);changes.append((before,after,count))
    patch("const PARTS_DEFAULT_V523={arm:'arm_cannon',head:'head_sensor',skin:'skin_bastion',legs:'legs_phase',back:'back_neural',tail:'tail_spine'};","const PARTS_DEFAULT_V523={arm:null,head:null,skin:null,legs:null,back:null,tail:null};")
    patch("const previewKey={prime:'base_specimen',razor:'tail_build',acid:'mouth_build',forge:'arm_build',abyss:'core_build'}[meta.origin]||'base_specimen';","const previewKey='base_specimen';",2)
    patch('redPulseImageReadyV579,cinematicReadyV580,warningBrandReadyV581]','redPulseImageReadyV579,cinematicReadyV580,warningBrandReadyV581,playerReadyV586]')
    source=(ROOT/'web/player-scorpion-v586.js').read_text().replace("JSON.parse('__PLAYER_SCORPION_ART__')",json.dumps(art,separators=(',',':')))
    marker='\nwindow.EVOLVE_WEB_GUARD=';patch(marker,'\n'+source+marker)
    reverted=code
    for before,after,count in reversed(changes):reverted=replace(reverted,after,before,count)
    assert reverted==original,'Unexpected unrelated engine change'
    raw=code.encode();sha=hashlib.sha256(raw).hexdigest();engine='assets/'+sha+'.js';(d/engine).write_bytes(raw)
    manifest=json.loads(base('dist/asset-manifest.json'));image_count=0
    for entry in manifest:
        if entry['path']==old_engine:entry.update(path=engine,sha256=sha,bytes=len(raw))
        elif entry['kind']=='image':
            assert hashlib.sha256((d/entry['path']).read_bytes()).hexdigest()==entry['sha256'],entry['path']
            image_count+=1
    manifest.append({k:art[k] for k in ['path','sha256','bytes']}|{'kind':'image'})
    build=hashlib.sha256(previous['build'].encode()+raw+raw_art).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':previous['scriptBytes']+len(raw)-len(original.encode())}
    html=base('dist/index.html').decode();html=re.sub(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda _:'window.EVOLVE_WEB_CONFIG='+json.dumps(config)+';',html,count=1)
    html=replace(html,f'src="{old_engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(original.encode())})"',f'src="{engine}" onload="EVOLVE_WEB_CLIENT.loaded({len(raw)})"')
    (d/'index.html').write_text(html);write(d/'asset-manifest.json',manifest,True);write(d/'version.json',config|{'assets':len(manifest),'source_sha256':previous['source_sha256']})
    def update_refs(value):
        if isinstance(value,dict):return {k:update_refs(v) for k,v in value.items()}
        if isinstance(value,list):return [update_refs(v) for v in value]
        return engine if value==old_engine else value
    report=update_refs(report);report.update(version=VERSION,build=build,index_bytes=len(html.encode()),image_assets=image_count+1,cached_files=len(manifest),cached_bytes=sum(x['bytes'] for x in manifest))
    report['player_scorpion']={'engine':engine,'baseline_commit':BASE,'art':{k:art[k] for k in ['path','sha256','bytes','width','height','alpha','columns','rows']},'painted_frames':20,'cached_frames':20,'unarmed_default':True,'existing_saved_equipment_preserved':True,'unarmed_attack':'alternating upper-limb forward contact stabs; impact at 0.12 seconds; 44-unit reach; no projectile/chain/poison/tail attack','existing_image_bytes_unchanged':image_count,'maps_and_bosses_unchanged':True,'save_keys_preserved':True,'physical_Galaxy_S23_plus_tested':False}
    write(d/'verification.json',report)
    for obsolete in {old_engine,prior_engine}-{engine}:
        assert re.fullmatch(r'assets/[a-f0-9]{64}\.js',obsolete)
        (d/obsolete).unlink(missing_ok=True)
    p=ROOT/'docs/player-scorpion-v586-checkpoint.json';checkpoint=json.loads(p.read_text());checkpoint.update(progress=50,status='Default scorpion and unequipped stabbing packaged; browser verification pending',version=VERSION,build=build,engine='dist/'+engine,next='Verify real normal play, exact contact timing/range, alternating poses, equipment persistence and mobile layout');write(p,checkpoint)
    print(json.dumps(config|{'engine':engine,'preserved_images':image_count,'new_image_bytes':art['bytes']}))
if __name__=='__main__':main()
