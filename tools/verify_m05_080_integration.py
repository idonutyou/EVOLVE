#!/usr/bin/env python3
"""M05 80% premerge integration gate. Audit main -> opt-in M05 without modifying game bytes."""
import hashlib,json,re,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
BASE="fbe3224a3bdd95020829228427ddc3b05ed41f9e"
def old(path):return subprocess.check_output(["git","show",BASE+":"+path],cwd=R)
def sha(b):return hashlib.sha256(b).hexdigest()
def read(path):return (R/path).read_bytes()
def fail(message):raise AssertionError(message)
def main():
 base_version=json.loads(old("dist/version.json"))
 now_version=json.loads(read("dist/version.json"))
 base_report=json.loads(old("dist/verification.json"))
 now_report=json.loads(read("dist/verification.json"))
 assert now_version["version"].endswith("M05-UX70"),now_version["version"]
 assert now_version["assets"]==1082
 assert now_report["build"]==now_version["build"]
 assert now_version["source_sha256"]==base_version["source_sha256"]
 assert now_report["source_sha256"]==base_report["source_sha256"]
 assert now_report["source_unchanged"] and not now_report["image_recompression"]
 base_assets=json.loads(old("dist/asset-manifest.json"))
 new_assets=json.loads(read("dist/asset-manifest.json"))
 baseline={x["path"]:x for x in base_assets}
 now={x["path"]:x for x in new_assets}
 assert len(base_assets)==1078 and len(new_assets)==1082
 assert len(now)==len(new_assets)
 assert all(now.get(name)==entry for name,entry in baseline.items()),"Original M04 asset metadata changed"
 assert sum(x["kind"]=="image" for x in base_assets)==sum(x["kind"]=="image" for x in new_assets)==1021
 assert all(read("dist/"+name)==old("dist/"+name) for name in baseline),"An original M04 asset changed"
 added=sorted(set(now)-set(baseline))
 assert len(added)==4 and all(now[name]["kind"]=="dev-mock-only" and name.endswith(".js") for name in added),added
 for name in added:
  data=read("dist/"+name)
  assert len(data)==now[name]["bytes"] and sha(data)==now[name]["sha256"]
 for name in ("dist/sw.js","web/mock-premium-v615.js","web/mock-premium-ui-v616.js","web/mock-core-visuals-v617.js","web/mock-core-adapter-v617.js","monetization/catalog/draft_skus.json"):
  assert read(name)==old(name),"Existing protected file changed: "+name
 current=read("dist/index.html").decode()
 baseline_html=old("dist/index.html").decode()
 pattern=r'<script defer src="assets/[a-f0-9]{64}\.js" data-m05-dev-only="shop-ux"></script>\n'
 match=list(re.finditer(pattern,current))
 assert len(match)==1,len(match)
 script=match[0].group(0);active_script=re.search(r'assets/[a-f0-9]{64}\.js',script).group(0)
 assert active_script in added,"Rendered M05 script not in four new assets"
 current_without=current.replace(script,"",1)
 config_pattern=r'window\.EVOLVE_WEB_CONFIG=\{[^;]+\};'
 old_config=re.search(config_pattern,baseline_html)
 current_config=re.search(config_pattern,current_without)
 assert old_config and current_config
 normalized=current_without[:current_config.start()]+old_config.group(0)+current_without[current_config.end():]
 assert normalized==baseline_html,"M05 replaced original HTML outside a script tag and build metadata"
 draft=json.loads(read("monetization/catalog/draft_skus.json"))
 assert draft["checkout_enabled"] is False and draft["client_grants_enabled"] is False
 assert len(draft["products"])==5
 assert all(p["status"]=="draft_disabled" and p["price_minor"] is None for p in draft["products"])
 assert "evolveMockShop" in read("web/m05-shop-ui-v618.js").decode()
 assert "evolveM05UX" in read("web/m05-shop-ui-v618.js").decode()
 # Only M05 design, QA, backup and opt-in dist shell changes are allowed relative to M04 main.
 changed=subprocess.check_output(["git","diff","--name-only",BASE,"HEAD"],cwd=R,text=True).splitlines()
 permitted={
  "EVOLVE_HANDOFF.md","EVOLVE_PROGRESS.md","EVOLVE_ROADMAP.md",
  "dist/index.html","dist/version.json","dist/verification.json","dist/asset-manifest.json",
  "web/m05-shop-ui-v618.js"
 }
 def allowed(p):
  return p in permitted or p.startswith((".github/workflows/m05-","docs/monetization/M05_","monetization/m05/","checkpoints/EVOLVE_M05_","tests/monetization_m05_","tools/build_m05_","tools/checkpoint_m05","tools/verify_m05_")) or p in ("tools/verify_m05_080_integration.py",) or p.startswith("dist/assets/") and p[5:] in added
 forbidden=[p for p in changed if not allowed(p)]
 assert not forbidden,("Unexpected game/billing code modifications",forbidden)
 print(json.dumps({"stage":"M05","percent":80,"base":BASE,"new_build":now_version["build"],"original_assets_verified":len(base_assets),"original_images_verified":1021,"dev_script_additions":added,"normalized_html_equals_M04":True,"M04_engine_billing_sw_byte_identical":True,"unchanged_game_save_model":True,"original_source_sha":now_version["source_sha256"],"checked_git_changes":len(changed),"forbidden_changes":0,"real_checkout_enabled":False},ensure_ascii=False))
if __name__=="__main__":main()
