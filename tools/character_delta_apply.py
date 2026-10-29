#!/usr/bin/env python3
"""EVOLVE character/core delta staging: metadata + ONE live game JS, never all assets.

The script never pushes, deploys, downloads images or overwrites dist. Its staging
folder can be committed with existing immutable Git blob SHAs by the connected
GitHub tools. Call before any unnecessary Work-to-Work ZIP/Base64 transfer.
"""
import argparse
import copy
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGE_KEYS = ("original", "matte", "tail", "gun", "walkAtlas", "idleAtlas")
SHA_PATH = re.compile(r"assets/([a-f0-9]{64})\.(png|webp|js)$")
BUILD_CONFIG = re.compile(r"window\.EVOLVE_WEB_CONFIG=\{.*?\};")


class DeltaError(ValueError):
    pass


def compact(obj):
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=True)


def git_output(repo, *args):
    return subprocess.check_output(["git", *args], cwd=repo)


def git_file(repo, ref, path):
    return git_output(repo, "show", f"{ref}:{path}")


def content_hash(data):
    return hashlib.sha256(data).hexdigest()


def active_engine(manifest, html, report):
    # Release metadata can retain a historical V625 or V626 pointer; prefer the
    # most recent active engine and insist the real page executes that entry.
    candidate = report.get("auto_ambient_v627", {}).get("engine")
    if not candidate:
        candidate = report.get("bio_core_v625", {}).get("engine")
    matches = [e for e in manifest if e["path"] == candidate and e["kind"] == "game-code"]
    if len(matches) != 1 or html.count(candidate) != 1:
        raise DeltaError("Active game engine differs from manifest/HTML; stop, do not roll back.")
    return matches[0]


def check_images(art, manifest, blobs=None):
    """Only SHA/path/byte metadata; content was verified on original upload."""
    existing = {e["path"]: e for e in manifest}
    added, reused = [], []
    for key in IMAGE_KEYS:
        e = art[key]
        match = SHA_PATH.fullmatch(e["path"])
        if not match or match.group(2) not in ("png", "webp"):
            raise DeltaError(f"Invalid immutable image path for {key}")
        if match.group(1) != e["sha256"] or not isinstance(e["bytes"], int) or e["bytes"] < 1:
            raise DeltaError(f"Image hash/length metadata inconsistent: {key}")
        if e.get("kind") != "image":
            raise DeltaError(f"Unexpected asset type: {key}")
        registered = existing.get(e["path"])
        if registered:
            if any(registered[k] != e[k] for k in ("sha256", "bytes", "kind")):
                raise DeltaError(f"Conflicting asset registration: {key}")
            reused.append({"key": key, "path": e["path"], "sha256": e["sha256"]})
        else:
            blob = (blobs or {}).get(e["path"])
            if not blob or not re.fullmatch(r"[a-f0-9]{40}", blob):
                raise DeltaError(f"New {key} asset must have a verified reusable Git blob reference.")
            added.append({**e, "git_blob": blob, "key": key})
    return reused, added


def find_asset_blobs(repo, ref, art, manifest):
    """Metadata-only Git tree lookup; never reads image bytes or creates a ZIP."""
    found = {}
    registered = {x["path"] for x in manifest}
    for key in IMAGE_KEYS:
        e = art[key]
        if e["path"] in registered:
            continue
        if not ref:
            raise DeltaError(f"{key} missing in manifest: pass --image-ref to reuse an existing backup.")
        path = "dist/" + e["path"]
        out = git_output(repo, "ls-tree", "-r", ref, "--", path).decode().strip()
        parts = out.split("\t")
        if len(parts) != 2 or parts[1] != path:
            raise DeltaError(f"Image not found on --image-ref {ref}: {path}")
        m = re.fullmatch(r"100644 blob ([a-f0-9]{40})", parts[0])
        if not m:
            raise DeltaError(f"Unsupported Git object for image: {path}")
        found[e["path"]] = m.group(1)
    return found


def build_patch(manifest, html, version, report, current_engine, baseline_module,
                changed_module, baseline_art, changed_art, suffix, image_blobs=None):
    """Pure transformation, no network/filesystem. All changes are reversible."""
    manifest = copy.deepcopy(manifest)
    version, report = copy.deepcopy(version), copy.deepcopy(report)
    if not re.fullmatch(r"[A-Z0-9][A-Z0-9_-]{2,45}", suffix):
        raise DeltaError("Release suffix should be a short uppercase label.")
    if version["version"].endswith("-" + suffix):
        raise DeltaError("The target version is already applied.")
    engine = active_engine(manifest, html, report)
    if content_hash(current_engine) != engine["sha256"] or len(current_engine) != engine["bytes"]:
        raise DeltaError("Current engine bytes are not the manifest-listed live engine.")
    old = baseline_module.replace("__BIO_CORE_ART_V625__", compact(baseline_art))
    new = changed_module.replace("__BIO_CORE_ART_V625__", compact(changed_art))
    if current_engine.count(old.encode()) != 1:
        raise DeltaError("Current character module differs from baseline-ref; no unsafe engine overwrite.")
    reused, added = check_images(changed_art, manifest, image_blobs)
    if new == old and not added:
        return {"status": "unchanged", "live_engine": engine["path"],
                "image_reuse_count": len(reused), "changed_files": {}}
    new_engine = current_engine.replace(old.encode(), new.encode(), 1)
    if new_engine.replace(new.encode(), old.encode(), 1) != current_engine:
        raise DeltaError("Character-only reversible patch invariant failed.")
    digest = content_hash(new_engine)
    new_path = f"assets/{digest}.js"
    if any(e["path"] == new_path and e["path"] != engine["path"] for e in manifest):
        raise DeltaError("New engine path collides with another manifest entry.")
    old_path = engine["path"]
    engine.update({"path": new_path, "sha256": digest, "bytes": len(new_engine)})
    for e in added:
        manifest.append({k: e[k] for k in ("path", "sha256", "bytes", "kind")})
    if html.count(old_path) != 1:
        raise DeltaError("Expected one active HTML engine reference.")
    html = html.replace(old_path, new_path)
    old_build = version["build"]
    version["version"] += "-" + suffix
    version["build"] = content_hash((old_build + digest + suffix).encode())
    version["scriptBytes"] += len(new_engine) - len(current_engine)
    version["assets"] = len(manifest)
    config = {k: version[k] for k in ("version", "build", "scriptBytes", "preloadResources")}
    html, n = BUILD_CONFIG.subn(lambda _: "window.EVOLVE_WEB_CONFIG=" + compact(config) + ";", html, count=1)
    if n != 1:
        raise DeltaError("Missing embedded build config.")
    report.update(version=version["version"], build=version["build"],
                  index_bytes=len(html.encode()), cached_files=len(manifest),
                  cached_bytes=sum(e["bytes"] for e in manifest),
                  image_assets=sum(e["kind"] == "image" for e in manifest))
    if "bio_core_v625" in report:
        report["bio_core_v625"]["engine"] = new_path
    if "auto_ambient_v627" in report:
        report["auto_ambient_v627"]["engine"] = new_path
    report["fast_character_delta"] = {
        "baseline_engine": old_path, "active_engine": new_path, "source_sha256": digest,
        "original_images_untouched": True, "saves_untouched": True,
        "reused_images": len(reused), "added_images_by_git_blob": len(added)
    }
    files = {
        "dist/" + new_path: new_engine,
        "dist/index.html": html.encode(),
        "dist/version.json": (json.dumps(version, ensure_ascii=False, indent=2) + "\n").encode(),
        "dist/asset-manifest.json": (json.dumps(manifest, separators=(",", ":")) + "\n").encode(),
        "dist/verification.json": (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode(),
    }
    return {
        "status": "prepared", "live_engine": old_path, "new_engine": new_path,
        "version": version["version"], "build": version["build"],
        "image_reuse_count": len(reused),
        "reuse_git_blobs": [{"path": "dist/" + x["path"], "git_blob_sha": x["git_blob"],
                             "sha256": x["sha256"], "bytes": x["bytes"]} for x in added],
        "files": files,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=ROOT)
    parser.add_argument("--baseline-ref", default="HEAD",
                        help="immutable Git revision for current live engine and pre-edit character source")
    parser.add_argument("--image-ref", help="known checkpoint branch with new immutable images, if necessary")
    parser.add_argument("--suffix", default="CHAR-UPDATE")
    parser.add_argument("--mode", choices=("inspect", "prepare"), default="inspect")
    parser.add_argument("--output-dir", type=Path,
                        help="required for prepare; stage only small modified files, never overwrite dist")
    args = parser.parse_args()
    repo = args.repo.resolve()
    read_json = lambda path: json.loads((repo / path).read_text())
    manifest = read_json("dist/asset-manifest.json")
    version = read_json("dist/version.json")
    report = read_json("dist/verification.json")
    html = (repo / "dist/index.html").read_text()
    art = read_json("web/bio-core-art-v625.json")
    engine = active_engine(manifest, html, report)
    blobs = find_asset_blobs(repo, args.image_ref, art, manifest)
    reused, added = check_images(art, manifest, blobs)
    summary = {
        "mode": args.mode, "baseline_ref": args.baseline_ref,
        "live_engine": engine["path"], "live_engine_bytes": engine["bytes"],
        "original_manifest_entries": len(manifest), "known_images": len(reused),
        "reusable_image_git_blobs": len(added),
        "missing_image_blobs": 0, "downloaded_large_assets": False
    }
    if args.mode == "inspect":
        summary["reuse_git_blobs"] = [{"path": x["path"], "git_blob_sha": x["git_blob"]} for x in added]
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return
    if args.output_dir is None:
        parser.error("--output-dir required for --mode prepare")
    if args.output_dir.resolve() == repo or args.output_dir.resolve() == (repo / "dist"):
        raise DeltaError("Refusing to overwrite live repo/dist directly.")
    # If a sparse checkout omitted game assets, git show reads only the 1.7 MiB
    # current engine blob from Git object storage. No 382 MiB checkout needed.
    file_name = "dist/" + engine["path"]
    local_engine = repo / file_name
    if local_engine.is_file():
        data = local_engine.read_bytes()
    else:
        data = git_file(repo, args.baseline_ref, file_name)
    baseline_module = git_file(repo, args.baseline_ref, "web/bio-core-player-v625.js").decode()
    baseline_art = json.loads(git_file(repo, args.baseline_ref, "web/bio-core-art-v625.json"))
    updated_module = (repo / "web/bio-core-player-v625.js").read_text()
    result = build_patch(manifest, html, version, report, data, baseline_module,
                         updated_module, baseline_art, art, args.suffix, blobs)
    output = {k: v for k, v in result.items() if k != "files"}
    output.update(summary)
    output["status"] = result["status"]
    if result["status"] == "prepared":
        out = args.output_dir.resolve()
        for name, content in result["files"].items():
            p = out / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(content)
        output["staged_changed_files"] = [
            {"path": key, "bytes": len(val), "sha256": content_hash(val)}
            for key, val in result["files"].items()
        ]
        output["publish_requires_git_tree_composition"] = bool(result["reuse_git_blobs"])
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
