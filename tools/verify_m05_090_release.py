#!/usr/bin/env python3
"""M05 90% release candidate: M04 original game bytes unchanged, opt-in DEV UI only, no real payments."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
M04="fbe3224a3bdd95020829228427ddc3b05ed41f9e"
M080="c61623a5274defb54f3a725101fc9f7ea4c9ccf9"
sha=lambda b:hashlib.sha256(b).hexdigest()
def git(path,ref=M04):return subprocess.check_output(["git","show",ref+":"+path],cwd=ROOT)
def local(path):return (ROOT/path).read_bytes()
def main():
 old_assets=json.loads(git("dist/asset-manifest.json"))
 latest_assets=json.loads(local("dist/asset-manifest.json"))
 assert len(old_assets)==1078 and len(latest_assets)==1083
 base={x["path"]:x for x in old_assets};current={x["path"]:x for x in latest_assets}
 assert all(current.get(p)==d and git("dist/"+p)==local("dist/"+p) for p,d in base.items()),"A published original asset was modified"
 assert sum(x['kind']=='image' for x in latest_assets)==1021
 additional=set(current)-set(base)
 assert len(additional)==5 and all(current[p]['kind']=='dev-mock-only' for p in additional)
 for p in additional:
  b=local("dist/"+p)
  assert len(b)==current[p]['bytes'] and sha(b)==current[p]['sha256']
 new=json.loads(local("dist/version.json"));proof=json.loads(local("dist/verification.json"))
 assert new["version"].endswith("M05-UX90") and new["assets"]==1083
 assert new["build"]==proof["build"] and new["source_sha256"]==json.loads(git("dist/version.json"))["source_sha256"]
 assert proof["m05_ux_090"]["dev_trigger_fixed"] and not proof["m05_ux_090"]["real_checkout"]
 script=local("web/m05-shop-ui-v618.js")
 assert b'#poster #m04MockTriggerV616{top:auto;bottom:calc(96px' in script
 assert b"evolveM05UX" in script and b"evolveMockShop" in script
 assert sha(script)==proof["m05_ux_090"]["new_asset"].rsplit("/",1)[1][:-3]
 before=git("dist/index.html").decode()
 after=local("dist/index.html").decode()
 rx=r'<script defer src="assets/[a-f0-9]{64}\.js" data-m05-dev-only="shop-ux"></script>\n'
 found=re.findall(rx,after);assert len(found)==1
 assert proof["m05_ux_090"]["new_asset"] in found[0]
 cleaned=after.replace(found[0],"")
 pattern=r'window\.EVOLVE_WEB_CONFIG=\{[^;]+\};'
 a=re.search(pattern,before);b=re.search(pattern,cleaned);assert a and b
 assert cleaned[:b.start()]+a.group(0)+cleaned[b.end():]==before
 for p in ("dist/sw.js","web/mock-premium-v615.js","web/mock-premium-ui-v616.js","web/mock-core-visuals-v617.js","web/mock-core-adapter-v617.js","monetization/catalog/draft_skus.json"):
  assert git(p)==local(p),p
 old_80=json.loads(git("dist/version.json",M080))
 assert old_80["version"].endswith("M05-UX70")
 catalog=json.loads(local("monetization/catalog/draft_skus.json"))
 assert catalog["checkout_enabled"] is False and catalog["client_grants_enabled"] is False
 assert len(catalog["products"])==5
 assert all(x["status"]=="draft_disabled" and x["price_minor"] is None for x in catalog["products"])
 changed=subprocess.check_output(["git","diff","--name-only",M080,"HEAD"],cwd=ROOT,text=True).splitlines()
 forbidden=[p for p in changed if p.startswith(("web/mock-premium-","web/mock-core-","monetization/catalog/"))]
 assert not forbidden,forbidden
 print(json.dumps({"stage":"M05","percent":90,"main_baseline":M04,"original_assets_unchanged":1078,"original_images_unchanged":1021,"total_assets":1083,"dev_assets":5,"M04_engine_unchanged":True,"service_worker_unchanged":True,"game_source_unchanged":True,"M05_touch_fix_in_optin_script":True,"real_billing":False,"forbidden_changes":[],"build":new["build"]}))
if __name__=="__main__":main()
