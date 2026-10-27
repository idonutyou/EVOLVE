#!/usr/bin/env python3
"""Build the STEP07 V614 visual-only candidate from exact V613 without altering public main."""
from pathlib import Path
import hashlib,json,re,subprocess

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
DOCS=ROOT/'docs/step07'
VERSION='V575-STEP07-MONSTER-FEEDBACK-V614'
BASE_VERSION='V575-STEP06-ORGAN-HITS-V613'
BASE_BUILD='054829b5e936f04e306a4ec40269e6cc811dda47a352f3bf2a810420559154bf'
BASE_ENGINE='assets/abea964a4ccb5c0f4ea1079f481aa6bb5a4ec0574cf85c0b0801038b1b17d255.js'
BASE_COMMIT='82ccefffaf801be3e560310493eae86003c82d93'
def baseline(path):
 return subprocess.check_output(['git','show',BASE_COMMIT+':'+path],cwd=ROOT)
def dump(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def main():
 subprocess.run(['git','fetch','--no-tags','--depth=1','origin',BASE_COMMIT],cwd=ROOT,check=True,capture_output=True)
 version=json.loads(baseline('dist/version.json'))
 assert version['version']==BASE_VERSION and version['build']==BASE_BUILD,'Refuse non-V613 baseline'
 html=baseline('dist/index.html').decode()
 manifest=json.loads(baseline('dist/asset-manifest.json'))
 report=json.loads(baseline('dist/verification.json'))
 assert sum(e['path']==BASE_ENGINE for e in manifest)==1
 assert html.count(BASE_ENGINE)>=1
 original=(DIST/BASE_ENGINE).read_bytes()
 assert hashlib.sha256(original).hexdigest()==Path(BASE_ENGINE).stem
 assert b'STEP06_V613_END' in original and b'STEP07_V614_BEGIN' not in original
 before_images={e['path']:e['sha256'] for e in manifest if e['kind']=='image'}
 core=(ROOT/'web/monster-feedback-v614.js').read_text()
 adapter=(ROOT/'web/monster-feedback-adapter-v614.js').read_text()
 addition='\n/* STEP07_V614_BEGIN */\n'+core+'\n'+adapter+'\n/* STEP07_V614_END */\n'
 code=original.decode('utf-8')
 point=code.rfind('\n})();')
 assert point>0
 code=code[:point]+addition+code[point:]
 assert code.count(addition)==1 and code.replace(addition,'').encode()==original
 encoded=code.encode('utf-8')
 sha=hashlib.sha256(encoded).hexdigest()
 new_path='assets/'+sha+'.js'
 (DIST/new_path).write_bytes(encoded)
 new_entry={'path':new_path,'sha256':sha,'bytes':len(encoded),'kind':'game-code'}
 manifest=[e for e in manifest if e['path']!=BASE_ENGINE]+[new_entry]
 assert {e['path']:e['sha256'] for e in manifest if e['kind']=='image'}==before_images
 html=html.replace(BASE_ENGINE,new_path)
 report=json.loads(json.dumps(report).replace(BASE_ENGINE,new_path))
 version['scriptBytes']+=len(encoded)-len(original)
 build=hashlib.sha256(version['build'].encode()+html.encode()+encoded).hexdigest()
 config={'version':VERSION,'build':build,'scriptBytes':version['scriptBytes'],'preloadResources':True}
 html,count=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',
  lambda _:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1)
 assert count==1
 (DIST/'index.html').write_text(html)
 version.update(config,assets=len(manifest));dump(DIST/'version.json',version)
 (DIST/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 info={'baseline_version':BASE_VERSION,'baseline_build':BASE_BUILD,'baseline_engine':BASE_ENGINE,
  'engine':new_path,'new_assets':[new_entry],'new_images':0,'original_image_hashes_unchanged':True,
  'original_image_count':len(before_images),'reversible_addition':True,
  'baseline_engine_restores_byte_for_byte':code.replace(addition,'').encode()==original,
  'damage_and_collision_unmodified':True,'boss_logic_unmodified':True,
  'existing_hit_reactions_unmodified':True,'save_keys_unchanged':True,
  'scoped_effects':'monster hit fallback + existing death echo',
  'published':False,'physical_Galaxy_S23_plus_tested':False}
 report.update(version=VERSION,build=build,index_bytes=len(html.encode()),
  cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
 report['monster_feedback_v614']=info
 dump(DIST/'verification.json',report)
 DOCS.mkdir(exist_ok=True)
 dump(DOCS/'PACKAGE_V614.json',info)
 dump(DOCS/'ENGINE_PATCHES_V614.json',{'baseline_engine':BASE_ENGINE,'new_engine':new_path,
  'addition':addition,'restore_sha256':hashlib.sha256(original).hexdigest()})
 status_path=DOCS/'IMPLEMENTATION_STATUS.json'
 status=json.loads(status_path.read_text())
 status.update(overall_step_progress=50,status='integrated candidate on private branch; local CI/unit/parity pending',
  candidate_version=VERSION,candidate_build=build,engine=new_path,code_modified=True,
  main_published=False,next_progress=60)
 dump(status_path,status)
 print(json.dumps({'ok':True,'version':VERSION,'build':build,'engine':new_path,
  'images':len(before_images),'assets':len(manifest),'patch_reversible':True},ensure_ascii=False))
if __name__=='__main__':main()
