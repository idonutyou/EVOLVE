#!/usr/bin/env python3
"""M05 50% opt-in UI-only incremental build; retain every old hashed asset."""
from pathlib import Path
import hashlib,json,re
R=Path(__file__).resolve().parents[1]
D=R/'dist'
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 ui=(R/'web/m05-shop-ui-v618.js').read_bytes()
 digest=sha(ui)
 asset='assets/'+digest+'.js'
 oldhtml=(D/'index.html').read_text()
 manifest_path=D/'asset-manifest.json'
 manifest=json.loads(manifest_path.read_text())
 vpath=D/'version.json'
 version=json.loads(vpath.read_text())
 report_path=D/'verification.json'
 report=json.loads(report_path.read_text())
 previous=report['m05_ux_040']['asset']
 assert len(manifest)==1079 and version['assets']==1079
 assert version['version'].endswith('M05-UX40')
 assert report['m05_ux_040']['asset']==previous
 assert oldhtml.count('data-m05-dev-only="shop-ux"')==1
 oldscript='<script defer src="'+previous+'" data-m05-dev-only="shop-ux"></script>'
 assert oldhtml.count(oldscript)==1
 oldrecords=[e for e in manifest if e['path']==previous]
 assert len(oldrecords)==1 and (D/previous).is_file()
 assert sha((D/previous).read_bytes())==oldrecords[0]['sha256']
 assert not any(e['path']==asset for e in manifest)
 newscript='<script defer src="'+asset+'" data-m05-dev-only="shop-ux"></script>'
 newhtml=oldhtml.replace(oldscript,newscript)
 oldconfig=re.search(r'window\.EVOLVE_WEB_CONFIG=\{[^;]+\};',newhtml)
 assert oldconfig
 prevbuild=version['build']
 version['version']=version['version'].replace('M05-UX40','M05-UX50')
 version['build']=sha((prevbuild+'|'+asset+'|M05_050').encode())
 version['assets']=len(manifest)+1
 version['scriptBytes']+=len(ui)-oldrecords[0]['bytes']
 config={k:version[k] for k in ['version','build','scriptBytes','preloadResources']}
 newhtml=newhtml[:oldconfig.start()]+'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';'+newhtml[oldconfig.end():]
 manifest.append({'path':asset,'sha256':digest,'bytes':len(ui),'kind':'dev-mock-only'})
 report.update(version=version['version'],build=version['build'],index_bytes=len(newhtml.encode()),cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
 report['m05_ux_050']={'percent':50,'dev_only':True,'requires_query':['evolveMockShop=1','evolveM05UX=1'],'new_asset':asset,'old_asset_preserved':previous,'new_asset_sha256':digest,'assets':len(manifest),'image_count':sum(e['kind']=='image' for e in manifest),'original_m04_engine_unchanged':True,'real_checkout':False,'main_deployed':False}
 (D/asset).write_bytes(ui)
 (D/'index.html').write_text(newhtml)
 manifest_path.write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 vpath.write_text(json.dumps(version,ensure_ascii=False,indent=2)+'\n')
 report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'result':'M05_050_FEATURE_BUILD','asset':asset,'bytes':len(ui),'manifest':len(manifest),'images':report['m05_ux_050']['image_count'],'build':version['build']}))
if __name__=='__main__':main()
