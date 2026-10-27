#!/usr/bin/env python3
"""M05 70% immutable additional UI asset; do not rebuild game or modify any old hashed image."""
from pathlib import Path
import hashlib,json,re
R=Path(__file__).resolve().parents[1];D=R/'dist'
def sha(data):return hashlib.sha256(data).hexdigest()
def main():
 source=(R/'web/m05-shop-ui-v618.js').read_bytes()
 newasset='assets/'+sha(source)+'.js'
 html_path=D/'index.html';html=html_path.read_text()
 manifest_path=D/'asset-manifest.json';manifest=json.loads(manifest_path.read_text())
 version_path=D/'version.json';version=json.loads(version_path.read_text())
 verify_path=D/'verification.json';report=json.loads(verify_path.read_text())
 assert version['version'].endswith('M05-UX60') and version['assets']==1081
 assert len(manifest)==1081 and sum(entry['kind']=='image' for entry in manifest)==1021
 oldasset=report['m05_ux_060']['new_asset']
 oldrecord=next(e for e in manifest if e['path']==oldasset)
 assert sha((D/oldasset).read_bytes())==oldrecord['sha256']
 assert all(e['path']!=newasset for e in manifest)
 oldscript='<script defer src="'+oldasset+'" data-m05-dev-only="shop-ux"></script>'
 assert html.count(oldscript)==1
 newscript='<script defer src="'+newasset+'" data-m05-dev-only="shop-ux"></script>'
 html=html.replace(oldscript,newscript)
 config_match=re.search(r'window\.EVOLVE_WEB_CONFIG=\{[^;]+\};',html)
 assert config_match
 version['version']=version['version'].replace('M05-UX60','M05-UX70')
 version['build']=sha((version['build']+'|'+newasset+'|M05_070').encode())
 version['assets']=1082
 version['scriptBytes']+=len(source)-oldrecord['bytes']
 config={k:version[k] for k in ['version','build','scriptBytes','preloadResources']}
 html=html[:config_match.start()]+'window.EVOLVE_WEB_CONFIG='+json.dumps(config,separators=(',',':'))+';'+html[config_match.end():]
 manifest.append(dict(path=newasset,sha256=sha(source),bytes=len(source),kind='dev-mock-only'))
 report.update(version=version['version'],build=version['build'],index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(e['bytes'] for e in manifest))
 report['m05_ux_070']={'percent':70,'dev_only':True,'requires_query':['evolveMockShop=1','evolveM05UX=1'],'new_asset':newasset,'previous_asset':oldasset,'new_asset_sha256':sha(source),'original_image_count':1021,'M04_engine_modified':False,'real_checkout':False,'main_deployed':False,'landscape_keyboard_focus_scroll':True}
 (D/newasset).write_bytes(source)
 html_path.write_text(html)
 manifest_path.write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 version_path.write_text(json.dumps(version,ensure_ascii=False,indent=2)+'\n')
 verify_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'stage':'M05','percent':70,'asset':newasset,'asset_bytes':len(source),'assets':len(manifest),'images':1021,'build':version['build']}))
if __name__=='__main__':main()
