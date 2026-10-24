#!/usr/bin/env python3
"""Apply WEB-31 to the saved WEB-30 build, retaining original map/art bytes."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from fontTools import subset

ROOT=Path(__file__).resolve().parents[1]
BASE='169505e96c4331a2072219e674862f51632e06a6'
VERSION='V575-WEB-31-ORGAN-SKILLS'
def old(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def dump(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def main():
 p=argparse.ArgumentParser();p.add_argument('--font',type=Path,required=True);args=p.parse_args()
 dist=ROOT/'dist';manifest=json.loads(old('dist/asset-manifest.json'));report=json.loads(old('dist/verification.json'));version=json.loads(old('dist/version.json'))
 engine=report['home_map_miniatures_v597']['engine'];original=old('dist/'+engine).decode();code=original;html=old('dist/index.html').decode()
 def replace(before,after,count=1):
  nonlocal code
  assert code.count(before)==count,(code.count(before),before[:150]);code=code.replace(before,after)
 def remove_between(start,end):
  nonlocal code
  a=code.index(start);b=code.index(end,a);code=code[:a]+code[b:]
 def asset(raw,ext,kind):
  sha=hashlib.sha256(raw).hexdigest();path='assets/'+sha+'.'+ext;(dist/path).write_bytes(raw)
  if not any(e['path']==path for e in manifest):manifest.append({'path':path,'sha256':sha,'bytes':len(raw),'kind':kind})
  return {'path':path,'sha256':sha,'bytes':len(raw)}
 # Delete the selection screen, its handlers, decorative rules and selection-only metadata.
 remove_between('const START_WEAPONS={','function updatePredationHUD(){')
 replace("const playerLegacyStartSelectV586=openStartWeaponSelect;openStartWeaponSelect=function(...args){playerWeaponLabelsV586();const result=playerLegacyStartSelectV586(...args);playerWeaponLabelsV586();return result;};\n",'')
 code=code.replace('openStartWeaponSelect()','startOrganRunV598()')
 code=code.replace("$('weaponSelectOverlay').style.display='none';",'')
 code=code.replace("||$('weaponSelectOverlay').style.display==='flex'",'')
 replace(" homeSetTextV522('homeWeaponBackV522',homeTextV522('‹ HOME','‹ 홈으로'));\n",'')
 replace(" $('homeWeaponBackV522').onclick=()=>returnToHome('battle');\n",'')
 # START_WEAPONS was a selection menu dictionary, not the equipped weapon source.
 replace("Object.assign(START_WEAPONS.arm,{name:'CHAIN LIGHTNING',glyph:'ϟ',role:'자동 연쇄전격 · E 강화전격'});\n",'')
 for source_path in ['web/player-original-v588.js','web/arm-items-v589.js']:
  before=old(source_path).decode();after=before
  if 'player-original' in source_path:
   start=after.index('function playerWeaponLabelsV586(){');end=after.index('levelStatHtml=function',start)
   label='''function playerWeaponLabelsV586(){
 const upgrade=upgrades.find(u=>u.active&&u.kind==='arm');if(upgrade)upgrade.title=()=>homeTextV522('ARM UPGRADE','팔 강화');
}
'''
   after=after[:start]+label+after[end:]
   # This block's old selection wrapper has already been deleted from the engine.
   engine_before=before[start:end].replace("const playerLegacyStartSelectV586=openStartWeaponSelect;openStartWeaponSelect=function(...args){playerWeaponLabelsV586();const result=playerLegacyStartSelectV586(...args);playerWeaponLabelsV586();return result;};\n",'')
   replace(engine_before,label)
  else:
   lines=after.splitlines(True)
   removed=[line for line in lines if 'Object.assign(START_WEAPONS.arm' in line or 'const b=document.querySelector(\'[data-weapon=' in line]
   after=''.join(line for line in lines if line not in removed)
   for line in removed:replace(line,'')
  (ROOT/source_path).write_text(after)
 # Only the already equipped ARM is active before the opening skill choice.
 replace('const state={arm:0,mouth:0,tail:0,wing:0,leg:0,core:1,speed:0};','const state={arm:0,shell:0,mouth:0,tail:0,wing:0,leg:0,core:1,speed:0};')
 replace("for(const k of ['arm','mouth','tail','wing','leg'])state[k]=0;if(['arm','mouth','tail','wing','leg'].includes(selectedStartWeapon))state[selectedStartWeapon]=1;","Object.assign(state,{arm:1,shell:0,mouth:0,tail:0,wing:0,leg:0});")
 # Retire the native acid, distant tail fallback, wing and stomp casting blocks.
 start=code.index('  // MOUTH: splash starts at 2★');end=code.index('\nfunction protectedByWarden(e){',start)
 code=code[:start]+'}\n'+code[end:]
 # The new organs keep distinct damage buckets; physical spit has no implicit acid effect.
 replace('runDamage={arm:0,acid:0,tail:0,wing:0,leg:0,core:0};','runDamage={arm:0,acid:0,shell:0,tail:0,wing:0,leg:0,core:0};',count=2)
 replace("let bucket=kind==='acid'?'acid':kind==='tail'?'tail':", "let bucket=kind==='spike'?'shell':kind==='spit'||kind==='acid'?'acid':kind==='tail'?'tail':")
 replace("$('wingLv').textContent=evoState.wing?'EVO':starString(state.wing);$('legLv').textContent=evoState.leg?'EVO':starString(state.leg);","$('shellLv').textContent=starString(state.shell||0);")
 replace("const kind=el.dataset.kind,icon=el.querySelector('.partIcon'),key=partKey(kind,state[kind]);if(icon.dataset.asset!==key){", "const kind=el.dataset.kind,icon=el.querySelector('.partIcon'),key=partKey(kind,state[kind]);if(!ASSET_SRC[key])continue;if(icon.dataset.asset!==key){")
 # Compact home: stage number, actual map name, optional clear/locked state and Start.
 lines=code.splitlines(True)
 remove_ids=['homeProgressV522','homeLatestV522','homeBossLabelV522','homeCapLabelV522','homeLevelCapV522']
 code=''.join(line for line in lines if not any("'"+ident+"'" in line for ident in remove_ids))
 start=code.index(' const status=locked?homeTextV522(');end=code.index(" $('homeStageStateV522').style.color",start)
 code=code[:start]+" homeSetTextV522('homeStageStateV522',cleared?homeTextV522('CLEAR','클리어'):locked?homeTextV522('LOCKED','잠김'):'');\n"+code[end:]
 # Delete optional footer updates from home wrappers as well as their DOM.
 code=''.join(line for line in code.splitlines(True) if not line.lstrip().startswith(("homeSetTextV522('homeBossNameV522'","const boss=homeBossV522(s);","homeSetTextV522('homeStartHintV522'")))
 # The two wrapper lines containing `return out` need an explicit replacement.
 pattern=r"  if\(homeReadyV522&&!homeLoadErrorV522&&s\.stage<=homeUnlockedStageV522\(\)\)homeSetTextV522\('homeStartHintV522'.*?;return out;"
 code,n=re.subn(pattern,'  return out;',code);assert n==1,n
 code,n=re.subn(r"  if\(!ready\)\{\$\('start'\)\.disabled=true;homeSetTextV522\('homeStartHintV522'.*?\}\n  else if\(id&&!homeLoadErrorV522\)homeSetTextV522\('homeStartHintV522'.*?;return out;", "  if(!ready)$('start').disabled=true;return out;",code);assert n==1,n
 replace("$('homeStartHintV522').after(homeMapEditV562);","$('homeBattleViewV522').appendChild(homeMapEditV562);")
 replace("return $('homeBossNameV522').textContent;","return $('homeStageTitleV522').textContent;")
 # Deferred administrator summons wait for the real opening skill choice to finish.
 before="if(pending){const epoch=B.epoch;Promise.resolve().then(()=>{if(epoch!==B.epoch||!running||ended)return;return pending.type==='boss'?boss(pending.kind,pending.phase):queue(pending.count);}).catch(error=>{if(epoch!==B.epoch)return;B.busy=B.preparing=false;paused=false;status(error.message);paint();});}"
 after="if(pending){const epoch=B.epoch;const deliver=()=>{if(epoch!==B.epoch||!running||ended)return;if(choosing||rewardChoosing){setTimeout(deliver,40);return;}Promise.resolve(pending.type==='boss'?boss(pending.kind,pending.phase):queue(pending.count)).catch(error=>{if(epoch!==B.epoch)return;B.busy=B.preparing=false;paused=false;status(error.message);paint();});};Promise.resolve().then(deliver);}"
 replace(before,after)
 code=code.replace('시작 무기를 선택하면 시험이 시작됩니다.','첫 스킬을 선택하면 시험이 시작됩니다.')
 # Reuse the existing choice frames; supply code-native icons for new organs.
 source_path=ROOT/'web/upgrade-reference-v594.js';before=old('web/upgrade-reference-v594.js').decode()
 hook='skinArtV594(row,tier));skinPaintCanvasV594(b.querySelector(\'.upgradePartIconV594\'),skinIconV594(card.group,tier));'
 replacement='organCardArtV598(card,tier));skinPaintCanvasV594(b.querySelector(\'.upgradePartIconV594\'),organCardIconV598(card,tier));'
 after=before.replace(hook,replacement)
 assert after!=before;replace(hook,replacement);source_path.write_text(after)
 module=(ROOT/'web/organ-skill-model-v598.js').read_text()+'\n'+(ROOT/'web/organ-skills-v598.js').read_text()
 replace('\nwindow.EVOLVE_WEB_GUARD=','\n'+module+'\nwindow.EVOLVE_WEB_GUARD=')
 for token in ['START_WEAPONS','weaponSelectOverlay','openStartWeaponSelect','homeWeaponBackV522','homeLatestV522','homeStartHintV522','homeBossNameV522','homeLevelCapV522']:
  assert token not in code,token
 html,n=re.subn(r'  <div id="weaponSelectOverlay">.*?</div></div>\n','',html,count=1);assert n==1
 html,n=re.subn(r'        <div class="homeProgressV522">.*?</div>\n','',html,count=1);assert n==1
 html,n=re.subn(r'        <div class="stageIntelV522">.*?</div></div>\n','',html,count=1);assert n==1
 html,n=re.subn(r'<p id="homeStartHintV522">.*?</p>','',html,count=1);assert n==1
 html=html.replace('>READY TO ENTER</div>','></div>')
 start=html.index('  <div id="parts" style="display:none">');end=html.index('  <div id="joyBase">',start)
 html=html[:start]+'''  <div id="parts" style="display:none" data-i18n-ignore>
    <div class="part" data-kind="arm"><div class="partIcon"></div><div class="partName">팔</div><div id="armLv" class="partLv">Lv.1</div></div>
    <div class="part" data-kind="shell"><div class="partIcon"></div><div class="partName">외피</div><div id="shellLv" class="partLv">Lv.0</div></div>
    <div class="part" data-kind="tail"><div class="partIcon"></div><div class="partName">꼬리</div><div id="tailLv" class="partLv">Lv.0</div></div>
    <div class="part" data-kind="mouth"><div class="partIcon"></div><div class="partName">입</div><div id="mouthLv" class="partLv">Lv.0</div></div>
  </div>
'''+html[end:]
 bad=re.compile(r'weaponSelect|weaponGlyph|weaponRole|weaponStart|startWeaponCard|setupHomeBackV522|homeProgressV522|homeLatestV522|stageIntelV522|homeStartHintV522|homeLevelCapV522|homeCapLabelV522|homeBossLabelV522|homeBossNameV522')
 def clean_style(m):
  def clean_rule(r):
   selectors=[s for s in r[1].split(',') if not bad.search(s)];return ','.join(selectors)+'{'+r[2]+'}' if selectors else ''
  return m[1]+re.sub(r'([^{}]+)\{([^{}]*)\}',clean_rule,m[2])+'</style>'
 html=re.sub(r'(<style[^>]*>)(.*?)</style>',clean_style,html,flags=re.S)
 # The miniature's original raster bytes stay unchanged; only its CSS animation changes.
 home_css=(ROOT/'web/home-map-miniatures-v597.css').read_text();home_css=home_css.replace('6s ease-in-out','5.5s ease-in-out').replace('translate:0 3px','translate:0 8px').replace('translate:0 -4px','translate:0 -8px')
 (ROOT/'web/home-map-miniatures-v597.css').write_text(home_css)
 old_style=report['home_map_miniatures_v597']['stylesheet'];font_path=report['home_map_miniatures_v597']['font']['path']
 new_home_style=asset(home_css.replace('__HOME_MAP_FONT_V597__',Path(font_path).name).encode(),'css','style')
 manifest=[e for e in manifest if e['path']!=old_style];html=html.replace(old_style,new_home_style['path']);report=json.loads(json.dumps(report).replace(old_style,new_home_style['path']));(dist/old_style).unlink(missing_ok=True)
 # Licensed Korean text subset for the new short skill labels.
 text=module+'팔외피꼬리입가시채찍침뱉기공격력발사수관통속도사거리범위각도밀치기0123456789%°+→Lv.'
 options=subset.Options();options.flavor='woff';font=subset.load_font(str(args.font),options);sub=subset.Subsetter(options=options);sub.populate(text=text);sub.subset(font)
 font_output=ROOT/'web/organ-labels-v598.woff';subset.save_font(font,str(font_output),options);organ_font=asset(font_output.read_bytes(),'woff','font')
 css=(ROOT/'web/organ-skills-v598.css').read_text().replace('__ORGAN_FONT_V598__',Path(organ_font['path']).name);organ_style=asset(css.encode(),'css','style');html=html.replace('</head>','<link rel="stylesheet" href="'+organ_style['path']+'">\n</head>')
 raw=code.encode();target=asset(raw,'js','game-code');manifest=[e for e in manifest if e['path']!=engine];html=html.replace(engine,target['path'])
 build=hashlib.sha256(version['build'].encode()+raw+html.encode()+css.encode()).hexdigest();config={'version':VERSION,'build':build,'scriptBytes':version['scriptBytes']+len(raw)-len(original.encode()),'preloadResources':True}
 html,n=re.subn(r'window\.EVOLVE_WEB_CONFIG=\{.*?\};',lambda m:'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';',html,count=1);assert n==1
 report=json.loads(json.dumps(report).replace(engine,target['path']));report.update(version=VERSION,build=build,index_bytes=len(html.encode()),cached_bytes=sum(e['bytes'] for e in manifest))
 report['organ_skills_v598']={'baseline':BASE,'engine':target['path'],'stylesheet':organ_style['path'],'font':organ_font,'opening_choices':3,'arm_initial_level':1,'other_organs_initial_level':0,'weapon_selection_removed':True,'organs':['arm','shell','tail','mouth'],'variant_slots':{'arm':'arm','shell':'skin','tail':'tail','mouth':'head'},'projectile_limit':180,'original_image_bytes_unchanged':sum(e['kind']=='image' for e in manifest),'physical_Galaxy_S23_plus_tested':False}
 version.update(config,assets=len(manifest));(dist/'index.html').write_text(html);(dist/engine).unlink(missing_ok=True)
 known={e['path'] for e in manifest};baseline={line.removeprefix('dist/') for line in subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--','dist/assets'],cwd=ROOT,text=True).splitlines()}
 for generated in (dist/'assets').iterdir():
  path=generated.relative_to(dist).as_posix()
  if path not in known and path not in baseline and generated.suffix in ['.js','.css','.woff']:generated.unlink()
 for path in baseline:
  if path not in [engine,old_style] and not (dist/path).exists():(dist/path).write_bytes(old('dist/'+path))
 (dist/'asset-manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');dump(dist/'version.json',version);dump(dist/'verification.json',report)
 for e in json.loads(old('dist/asset-manifest.json')):
  if e['kind']=='image':assert hashlib.sha256((dist/e['path']).read_bytes()).hexdigest()==e['sha256'],e['path']
 checkpoint=json.loads((ROOT/'docs/organ-skills-v598-checkpoint.json').read_text());checkpoint.update(progress=50,status='Organ skill model, screen removal and immediate three-choice start implemented; browser verification pending',build=build);dump(ROOT/'docs/organ-skills-v598-checkpoint.json',checkpoint)
 print(json.dumps(config|{'engine':target['path'],'assets':len(manifest)}))

if __name__=='__main__':main()
