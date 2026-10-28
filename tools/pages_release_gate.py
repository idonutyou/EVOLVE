#!/usr/bin/env python3
"""Read-only EVOLVE Pages source comparison. Never deploy by GITHUB_TOKEN."""
import argparse
import json
import re
import subprocess
from pathlib import Path

SCRIPTS = (
    "shop-experience-v621.js", "shop-front-v621.js",
    "m08-stage-mission-v622.js", "m08-runtime-missions-v623.js",
    "m08-mission-rewards-v624.js",
)
FOCUSED = set(SCRIPTS) | {"index.html", "version.json", "verification.json"}
REQUIRED = {"index.html", "version.json", "verification.json", "asset-manifest.json", "sw.js", ".nojekyll"}
SHA = re.compile(r"^[a-f0-9]{64}$")
BUILD = re.compile(r'(window\.EVOLVE_WEB_CONFIG=\{[^}]*?"build":")[a-f0-9]{64}(")')


def normalize_html(html):
    html = BUILD.sub(r'\g<1>RELEASE_BUILD\g<2>', html)
    for name in SCRIPTS:
        html = re.sub(r'(src="' + re.escape(name) + r')(?:\?[^"<>]*)?(")',
                      r'\g<1>?CACHE_KEY\g<2>', html)
    return html


def cache_tokens(html):
    tokens = {}
    for name in SCRIPTS:
        matches = re.findall(r'src="' + re.escape(name) + r'(\?[^"<>]+)?"', html)
        if len(matches) > 1:
            raise ValueError("Duplicate script entry: " + name)
        tokens[name] = matches[0] if matches else None
    return tokens


def evaluate(changed, old_html, new_html, old_version, new_version, old_report, new_report):
    changed = set(changed)
    if not changed:
        return "unchanged", "Identical site; no Pages commit required."
    unknown = sorted(changed - FOCUSED)
    if unknown:
        return "full", "Engine, images, new scripts or unknown files changed: " + ", ".join(unknown[:12])
    try:
        oldv, newv = json.loads(old_version), json.loads(new_version)
        oldr, newr = json.loads(old_report), json.loads(new_report)
    except (TypeError, ValueError) as error:
        return "full", "Invalid release metadata: " + str(error)
    if not SHA.fullmatch(str(newv.get("build", ""))):
        return "full", "Invalid new build ID."
    for key in ("source_sha256", "assets", "scriptBytes", "preloadResources"):
        if oldv.get(key) != newv.get(key):
            return "full", "Protected build metadata changed: " + key
    for key in ("source_sha256", "image_recompression", "source_unchanged", "cached_bytes"):
        if oldr.get(key) != newr.get(key):
            return "full", "Protected asset report changed: " + key
    if newv["build"] != newr.get("build") or newv["build"] not in new_html:
        return "full", "Release build marker inconsistent."
    if newr.get("index_bytes") != len(new_html.encode("utf-8")):
        return "full", "HTML size inconsistent with asset verification."
    if "index.html" in changed and normalize_html(old_html) != normalize_html(new_html):
        return "full", "Index HTML changed beyond approved cache keys and build marker."
    try:
        old_tokens, new_tokens = cache_tokens(old_html), cache_tokens(new_html)
    except ValueError as error:
        return "full", str(error)
    if any(name in changed and old_tokens[name] == new_tokens[name] for name in SCRIPTS):
        return "full", "Changed script has no new cache key."
    if any(name in changed for name in SCRIPTS) and oldv.get("build") == newv.get("build"):
        return "full", "Changed script has no new update build ID."
    return "focused", "Known SHOP/M08 scope only; focused QA and authenticated sync still required."


def git(*args):
    return subprocess.run(["git", *args], check=True, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE).stdout.decode("utf-8")


def inspect(source, pages):
    wanted = git("rev-parse", f"{source}:dist").strip()
    live = git("rev-parse", f"{pages}^{{tree}}").strip()
    if wanted == live:
        return dict(status="unchanged", main_dist_tree=wanted, pages_root_tree=live,
                    changed_files=[], publish_needed=False, qa_required="none",
                    note="Exact Git trees match. Do NOT create a commit or deploy.")
    changed = git("diff", "--name-only", live, wanted).splitlines()
    available = set(git("ls-tree", "--name-only", wanted).splitlines())
    if not REQUIRED <= available:
        status, note = "full", "Required website files are missing: " + ", ".join(sorted(REQUIRED - available))
    else:
        try:
            status, note = evaluate(
                changed,
                git("show", f"{pages}:index.html"), git("show", f"{source}:dist/index.html"),
                git("show", f"{pages}:version.json"), git("show", f"{source}:dist/version.json"),
                git("show", f"{pages}:verification.json"), git("show", f"{source}:dist/verification.json"),
            )
        except (subprocess.CalledProcessError, UnicodeDecodeError) as error:
            status, note = "full", "Release metadata inspection failed: " + str(error)
    return dict(status=status, main_dist_tree=wanted, pages_root_tree=live,
                changed_files=changed, publish_needed=True, qa_required=status,
                note=note + " This gate never publishes: verified user/app-authenticated Pages branch sync is required.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default="HEAD")
    parser.add_argument("--pages", default="refs/remotes/origin/pages-fast-evolve-20261029")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = inspect(args.source, args.pages)
    payload = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    print(payload, end="")
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload)


if __name__ == "__main__":
    main()
