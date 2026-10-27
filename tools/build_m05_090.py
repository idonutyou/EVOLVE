#!/usr/bin/env python3
"""M05 90% hashed UI asset rebuild for opt-in DEV trigger hitbox safety; preserve all existing game bytes."""
from pathlib import Path
import hashlib,json,re
R=Path(__file__).resolve().parents[1];D=R/'dist'
sha=lambda b:hashlib.sha256(b).hexdigest()
def main():
 data=(R/'web/m05-shop-ui-v618.js').read_bytes()
 asset='assets/'+sha(data)+'.js'
 hp=D/'index.html';html=hp.read_text()
 mp=D/'asset-manifest.json';manifest=json.loads(mp.read_text())
 vp=D/'version.json';v=json.loads(vp.read_text())
 rp=D/'verification.json';report=json.loads(rp.read_text())
 assert v['version'].endswith('M05-UX70') and v['assets']==1082 and len(manifest)==1082
 old=report['m05_ux_070']['new_asset']
 entry=next(x for x in manifest if x['path']==old)
 assert sha((D/old).read_bytes())==entry['sha256']
 assert all(x['path']!=asset for x in manifest)
 before='<script defer src="'+old+'" data-m05-dev-only="shop-ux"></script>'
 assert html.count(before)==1
 html=html.replace(before,'<script defer src="'+asset+'" data-m05-dev-only="shop-ux"></script>')
 match=re.search(r'window\.EVOLVE_WEB_CONFIG=\{[^;]+\};',html);assert match
 v['version']=v['version'].replace('M05-UX70','M05-UX90')
 v['build']=sha((v['build']+'|'+asset+'|M05_090').encode())
 v['assets']=1083
 v['scriptBytes']+=len(data)-entry['bytes']
 cfg={k:v[k] for k in ['version','build','scriptBytes','preloadResources']}
 html=html[:match.start()]+'window.EVOLVE_WEB_CONFIG='+json.dumps(cfg,separators=(',',':'))+';'+html[match.end():]
 manifest.append({'path':asset,'sha256':sha(data),'bytes':len(data),'kind':'dev-mock-only'})
 report.update(version=v['version'],build=v['build'],index_bytes=len(html.encode()),cached_files=len(manifest),cached_bytes=sum(x['bytes'] for x in manifest))
 report['m05_ux_090']={'percent':90,'dev_only':True,'flag':['evolveMockShop=1','evolveM05UX=1'],'new_asset':asset,'prior_asset':old,'image_count':1021,'real_checkout':False,'main_published':False,'dev_trigger_fixed':True}
 assert sum(x['kind']=='image' for x in manifest)==1021
 (D/asset).write_bytes(data)
 hp.write_text(html)
 mp.write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
 rp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':'M05_090_DEV_TOUCH_FIXED_BUILD','build':v['build'],'script':asset,'resources':len(manifest),'images':1021}))
if __name__=='__main__':main()
