#!/usr/bin/env python3
"""Reversible visual-only STEP06 patch against the verified V612 tree."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='95af335a3beda5c66110eb882baf027850bbf921'
LOCAL_BASE='a62ae18ac26167dd6ee4591323984f7c8774ca2c'
VERSION='V575-STEP06-ORGAN-HITS-V613'
def dump(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def baseline(path):
    reference=BASE if subprocess.run(['git','cat-file','-e',BASE+'^{commit}'],cwd=ROOT,capture_output=True).returncode==0 else LOCAL_BASE
    return subprocess.check_output(['git','show',reference+':'+path],cwd=ROOT)
def main():
    dist=ROOT/'dist';docs=ROOT/'docs/step06';docs.mkdir(exist_ok=True)
    version=json.loads(baseline('dist/version.json'));assert version['version']=='V575-STEP05-GUN-BLADE-V612'
    html=baseline('dist/index.html').decode();manifest=json.loads(baseline('dist/asset-manifest.json'))
    report=json.loads(baseline('dist/verification.json'))
    prior=json.loads(baseline('docs/step05/PACKAGE_V612.json'));engine=prior['engine']
    original=(dist/engine).read_text();assert hashlib.sha256(original.encode()).hexdigest()==Path(engine).stem
    code=original;patches=[]
    def patch(before,after):
        nonlocal code
        assert code.count(before)==1,(code.count(before),before[:120])
        code=code.replace(before,after);patches.append([before,after])
    patch('  weaponHitConnectV612(bridge);','  weaponHitConnectV612(bridge);organHitConnectV613(bridge);')
    patch('function organHitV598(e,s,damage){','function organHitV598(e,s,damage,hitAngleV613=null){')
    patch("if(!playerTargetV586(e))return;const before=e.hp;hurtEnemy(e,damage,s.organ==='shell'?'spike':s.organ==='mouth'?'spit':'tail');",
          "if(!playerTargetV586(e))return;const before=e.hp,kindV613=s.organ==='shell'?'spike':s.organ==='mouth'?'spit':'tail';\n const directV613=(s.organ==='shell'||s.organ==='tail')&&Number.isFinite(hitAngleV613);\n if(directV613)withOrganHitSourceV613(kindV613,hitAngleV613,()=>hurtEnemy(e,damage,kindV613));else hurtEnemy(e,damage,kindV613);")
    patch('p.hit.add(e);organHitV598(e,s,s.damage);','p.hit.add(e);organHitV598(e,s,s.damage,p.angle);')
    patch('w.targets.add(e);organHitV598(e,w.s,w.s.damage);','w.targets.add(e);organHitV598(e,w.s,w.s.damage,Math.atan2(e.y-player.y,e.x-player.x));')
    patch('weaponHitFeedbackV612.draw(ctx);drawAttackWarningsV582();','weaponHitFeedbackV612.draw(ctx);organHitFeedbackV613.draw(ctx);drawAttackWarningsV582();')
    addition='\n/* STEP06_V613_BEGIN */\n'+(ROOT/'web/organ-hit-reactions-v613.js').read_text()+'\n'+(ROOT/'web/organ-hit-adapter-v613.js').read_text()+'\n/* STEP06_V613_END */\n'
    end=code.rfind('\n})();');assert end>0;code=code[:end]+addition+code[end:]
    restored=code.replace(addition,'')
    for before,after in reversed(patches):assert restored.count(after)==1;restored=restored.replace(after,before)
    assert restored==original
    raw=code.encode();sha=hashlib.sha256(raw).hexdigest();new_path='assets/'+sha+'.js';(dist/new_path).write_bytes(raw)
    entry={'path':new_path,'sha256':sha,'bytes':len(raw),'kind':'game-code'}
    images=[e for e in manifest if e['kind']=='image'];manifest=[e for e in manifest if e['path']!=engine]+[entry]
    html=html.replace(engine,new_path);report=json.loads(json.dumps(report).replace(engine,new_path))
    version['scriptBytes']+=len(raw)-len(original.encode())
    build=hashlib.sha256(version['build'].encode()+html.encode()+raw).hexdigest()
    config={'version':VERSION,'build':build,'scriptBytes':version['scriptBytes'],'preloadResources':True}
    html,count=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda _:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert count==1
    (dist/'index.html').write_text(html);version.update(config,assets=len(manifest));dump(dist/'version.json',version)
    (dist/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
    info={'baseline':BASE,'equivalent_local_baseline':LOCAL_BASE,'baseline_engine':engine,'engine':new_path,
          'scope':['spike','tail','arc'],'spit_excluded_from_this_step':True,'new_images':0,'original_images':len(images),
          'reversible_engine_patches':len(patches),'baseline_engine_restores_exactly':True,
          'damage_and_collision_unchanged':True,'attack_timing_unchanged':True,'knockback_unchanged':True,
          'warnings_above_effects':True,'shared_gun_blade_organ_effect_budget':48,'lightning_delegated':True,
          'published':False,'physical_Galaxy_S23_plus_tested':False,'new_assets':[entry]}
    report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
    report['organ_hits_v613']=info;dump(dist/'verification.json',report);dump(docs/'PACKAGE_V613.json',info)
    dump(docs/'ENGINE_PATCHES.json',{'patches':patches,'addition':addition})
    status=json.loads((docs/'IMPLEMENTATION_STATUS.json').read_text());status.update(overall_progress=50,status='Actual projectile/whip hit paths connected; local behavior checks next');dump(docs/'IMPLEMENTATION_STATUS.json',status)
    print(json.dumps(config|info))
if __name__=='__main__':main()
