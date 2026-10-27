#!/usr/bin/env python3
"""Package M05-40 isolated opt-in UX UI on the M04 development website, without rebuilding game/assets."""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
SOURCE=ROOT/'web/m05-shop-ui-v618.js'
def build():
 raw=SOURCE.read_bytes()
 checksum=hashlib.sha256(raw).hexdigest()
 asset=f'assets/{checksum}.js'
 target=DIST/asset
 if target.exists() and target.read_bytes()!=raw:raise AssertionError('M05 asset digest collision')
 target.write_bytes(raw)
 html_path=DIST/'index.html'
 html=html_path.read_text()
 marker='</body>'
 assert html.count(marker)==1
 assert html.count('data-m04-dev-only="ui"')==1
 assert 'data-m05-dev-only=' not in html,'M05 script already integrated'
 script=f'<script defer src="{asset}" data-m05-dev-only="shop-ux"></script>\n'
 html=html.replace(marker,script+marker)
 manifest_path=DIST/'asset-manifest.json'
 manifest=json.loads(manifest_path.read_text())
 assert len(manifest)==1078
 assert all(entry['path']!=asset for entry in manifest)
 manifest.append(dict(path=asset,sha256=checksum,bytes=len(raw),kind='dev-mock-only'))
 version_path=DIST/'version.json'
 version=json.loads(version_path.read_text())
 assert version['version']=='V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK70'
 assert version['assets']==1078
 version['version']='V575-STEP07-MONSTER-FEEDBACK-V614-M04-MOCK70-M05-UX40'
 version['assets']=len(manifest)
 version['build']=hashlib.sha256((version['build']+asset+'M05_040').encode()).hexdigest()
 version['scriptBytes']+=len(raw)
 config={k:version[k] for k in ['version','build','scriptBytes','preloadResources']}
 old=re.search(r'window\.EVOLVE_WEB_CONFIG=\{[^;]+\};',html)
 assert old,'Embedded current build config missing'
 html=html[:old.start()]+'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';'+html[old.end():]
 html_path.write_text(html)
 manifest_path.write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 version_path.write_text(json.dumps(version,ensure_ascii=False,indent=2)+'\n')
 report_path=DIST/'verification.json'
 report=json.loads(report_path.read_text())
 report.update(version=version['version'],build=version['build'],index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
 report['m05_ux_040']={'percent':40,'dev_only':True,'requires_query':['evolveMockShop=1','evolveM05UX=1'],'asset':asset,'asset_sha256':checksum,'asset_bytes':len(raw),'game_engine_unchanged':True,'original_images_unchanged':True,'new_images':0,'real_billing_enabled':False,'integration_branch_only':True}
 report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':'M05_040_FEATURE_BRANCH_READY','asset':asset,'bytes':len(raw),'version':version['version'],'assets':len(manifest)}))
if __name__=='__main__':build()
