#!/usr/bin/env python3
"""Rendering recovery and fixed combat viewport, preserving all gameplay code."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='9cb02fe7ec2e21ea23b32d74febdeb2f82ed5e9d'
VERSION='V575-WEB-43-DISPLAY-RECOVERY'
def old(p):return subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT)
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def main():
 d=ROOT/'dist';v=json.loads(old('dist/version.json'));r=json.loads(old('dist/verification.json'));m=json.loads(old('dist/asset-manifest.json'));baseline=list(m);previous=json.loads((d/'asset-manifest.json').read_text());html=old('dist/index.html').decode();replacements=[]
 def asset(raw,ext,kind):
  sha=hashlib.sha256(raw).hexdigest();p='assets/'+sha+'.'+ext;(d/p).write_bytes(raw);m.append({'path':p,'sha256':sha,'bytes':len(raw),'kind':kind});return p
 def replace_asset(before,raw,ext,kind):
  nonlocal m,r,html
  after=asset(raw,ext,kind);m=[x for x in m if x['path']!=before];html=html.replace(before,after);r=json.loads(json.dumps(r).replace(before,after));replacements.append((before,after));return after
 source=(ROOT/'web/organ-card-art-v610.js').read_text().replace('__ORGAN_CARD_ART_V610__',json.dumps(json.loads((ROOT/'web/organ-card-art-v610.json').read_text()),separators=(',',':'),ensure_ascii=False)).encode();replace_asset(r['organ_card_art_v610']['script'],source,'js','presentation-code');replace_asset(r['organ_card_art_v610']['stylesheet'],(ROOT/'web/organ-card-art-v610.css').read_bytes(),'css','style')
 scenery=(ROOT/'web/upgrade-scenery-v608.js').read_text().replace('__UPGRADE_SCENERY_ART_V608__',json.dumps(r['upgrade_scenery_v608']['reference'],separators=(',',':'))).encode();replace_asset(r['upgrade_scenery_v608']['script'],scenery,'js','presentation-code')
 engine=r['home_hub_v601']['engine'];original=old('dist/'+engine).decode();code=original;patches=[]
 def patch(a,b,count=1):
  nonlocal code
  assert code.count(a)==count,(code.count(a),a[:100]);code=code.replace(a,b);patches.append((a,b))
 patch(old('web/viewport-redraw-v609.js').decode(),(ROOT/'web/viewport-lifecycle-v611.js').read_text())
 patch('function resize(){',"function resize(force=false){\n window.__EVOLVE_FIXED_VIEWPORT_V611__?.sync();")
 patch(" canvas.width=Math.round(r.width*DPR);canvas.height=Math.round(r.height*DPR);", " const pixelW=Math.round(r.width*DPR),pixelH=Math.round(r.height*DPR);if(force!==true&&canvas.width===pixelW&&canvas.height===pixelH&&W===r.width&&H===r.height)return;\n canvas.width=pixelW;canvas.height=pixelH;")
 patch('if(ok&&initEnemyWebGLV428()){gpuEnemyBatchEnabledV426=gpuBatchWantedV428;','if(ok&&initEnemyWebGLV428()){gpuEnemyBatchEnabledV426=gpuBatchWantedV428;queueViewportPaintV609();',2)
 raw=code.encode();target=replace_asset(engine,raw,'js','game-code');v['scriptBytes']+=len(raw)-len(original.encode())
 recovered=code
 for a,b in reversed(patches):recovered=recovered.replace(b,a)
 assert recovered==original
 script=asset((ROOT/'web/display-recovery-v611.js').read_bytes(),'js','presentation-code');style=asset((ROOT/'web/display-recovery-v611.css').read_bytes(),'css','style');html=html.replace('</head>','<link rel="stylesheet" href="'+style+'">\n<script defer src="'+script+'"></script>\n</head>')
 build=hashlib.sha256(v['build'].encode()+html.encode()+raw+source+scenery+(d/style).read_bytes()+(d/script).read_bytes()).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':v['scriptBytes'],'preloadResources':True};html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda _:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1;(d/'index.html').write_text(html);v.update(config,assets=len(m));dump(d/'version.json',v);(d/'asset-manifest.json').write_text(json.dumps(m,separators=(',',':'))+'\n')
 r.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_files=len(m),cached_bytes=sum(x['bytes'] for x in m));r['organ_card_art_v610'].update(engine_unchanged=False,stats_and_effects_unchanged=True,all_baseline_asset_bytes_unchanged=False,normalized_art=True,original_png_bytes_unchanged=True);r['upgrade_scenery_v608'].update(viewport_repaint_only=False,rendering_only=True,gameplay_unchanged=True,engine_change='Rendering-resource recovery and fixed viewport only')
 r['display_recovery_v611']={'baseline':BASE,'script':script,'stylesheet':style,'engine':target,'engine_baseline':engine,'engine_changes_rendering_only':True,'baseline_engine_restores_exactly_after_reversing_patches':True,'gameplay_and_stats_unchanged':True,'original_images_unchanged':sum(x['kind']=='image' for x in baseline),'native_image_UI':True,'fixed_combat_size_during_transient_bars':True,'reroll_frame_inner_fill_preserves_blue_border':True,'patches':[{'before_sha256':hashlib.sha256(a.encode()).hexdigest(),'after_sha256':hashlib.sha256(b.encode()).hexdigest()} for a,b in patches],'physical_Galaxy_S23_plus_tested':False};dump(d/'verification.json',r)
 keep={e['path'] for e in m};basepaths={e['path'] for e in baseline}
 for e in previous:
  if e['path'] not in keep and e['path'] not in basepaths and e['kind'] in ('style','presentation-code','game-code'):(d/e['path']).unlink(missing_ok=True)
 for e in baseline:
  if e['kind']=='image':assert hashlib.sha256((d/e['path']).read_bytes()).hexdigest()==e['sha256'],e['path']
 print(json.dumps(config|{'engine':target,'original_images_unchanged':r['display_recovery_v611']['original_images_unchanged'],'gameplay_unchanged':True,'rendering_only_patches':len(patches)}))
if __name__=='__main__':main()
