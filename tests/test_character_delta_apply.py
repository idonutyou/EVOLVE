#!/usr/bin/env python3
"""No-browser, no-382MiB regression tests for Git-blob-only character staging."""
import hashlib
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from character_delta_apply import (DeltaError, build_patch, check_images, compact,
                                   content_hash, active_engine)

KEYS = ("original", "matte", "tail", "gun", "walkAtlas", "idleAtlas")


def fixture():
    art = {"version": 625}
    for i, key in enumerate(KEYS):
        h = f"{i+1:064x}"
        art[key] = {"path": f"assets/{h}.png", "sha256": h, "bytes": 111 + i, "kind": "image"}
    baseline_module = "// character\nconst bioArtV625=__BIO_CORE_ART_V625__;\nconst weaponAngle=.10;\n"
    engine = ("// original gameplay before\n" +
              baseline_module.replace("__BIO_CORE_ART_V625__", compact(art)) +
              "// original combat and saves after\n").encode()
    digest = content_hash(engine)
    old_path = f"assets/{digest}.js"
    manifest = [{"path": old_path, "sha256": digest, "bytes": len(engine), "kind": "game-code"}]
    manifest += [art[key].copy() for key in KEYS]
    version = {"version": "V629", "build": "f" * 64, "scriptBytes": len(engine),
               "preloadResources": True, "assets": len(manifest), "source_sha256": "e" * 64}
    config = {k: version[k] for k in ("version", "build", "scriptBytes", "preloadResources")}
    html = "<script>window.EVOLVE_WEB_CONFIG=" + compact(config) + ";</script>\n" + old_path
    report = {"version": version["version"], "build": version["build"],
              "cached_files": len(manifest), "cached_bytes": sum(e["bytes"] for e in manifest),
              "bio_core_v625": {"engine": old_path},
              "auto_ambient_v627": {"engine": old_path}}
    return manifest, html, version, report, engine, baseline_module, art, old_path


class CharacterDeltaTests(unittest.TestCase):
    def test_unchanged_fast_noop(self):
        m, h, v, r, e, mod, art, old = fixture()
        out = build_patch(m, h, v, r, e, mod, mod, art, art, "CHAR630")
        self.assertEqual(out["status"], "unchanged")
        self.assertEqual(out["changed_files"], {})
        self.assertEqual(out["live_engine"], old)

    def test_reversible_character_only_patch_preserves_other_code_and_images(self):
        m, h, v, r, e, mod, art, old = fixture()
        modified = mod.replace("weaponAngle=.10", "weaponAngle=.22")
        out = build_patch(m, h, v, r, e, mod, modified, art, art, "CHAR630")
        self.assertEqual(out["status"], "prepared")
        self.assertEqual(out["image_reuse_count"], 6)
        self.assertEqual(len(out["reuse_git_blobs"]), 0)
        self.assertEqual(len(out["files"]), 5)
        self.assertNotIn("dist/" + old, out["files"])
        new_engine = out["files"]["dist/" + out["new_engine"]]
        self.assertEqual(new_engine.count(b"weaponAngle=.22"), 1)
        self.assertIn(b"// original combat and saves after", new_engine)
        self.assertIn(b"// original gameplay before", new_engine)
        self.assertEqual(hashlib.sha256(new_engine).hexdigest(), out["new_engine"][7:-3])
        manifest = json.loads(out["files"]["dist/asset-manifest.json"])
        self.assertEqual(len(manifest), len(m))
        self.assertEqual(sum(x["kind"]=="image" for x in manifest), 6)
        self.assertFalse(any(x["path"] == old for x in manifest))
        self.assertEqual(json.loads(out["files"]["dist/verification.json"])["auto_ambient_v627"]["engine"],
                         out["new_engine"])
        self.assertEqual(json.loads(out["files"]["dist/version.json"])["assets"], len(m))
        self.assertNotEqual(out["version"], v["version"])

    def test_old_engine_mismatch_fail_closed(self):
        m, h, v, r, e, mod, art, old = fixture()
        changed = mod.replace("weaponAngle=.10", "weaponAngle=.22")
        with self.assertRaisesRegex(DeltaError, "module differs"):
            build_patch(m, h, v, r, e, changed, changed, art, art, "CHAR630")

    def test_game_engine_integrity_guard(self):
        m, h, v, r, e, mod, art, old = fixture()
        with self.assertRaisesRegex(DeltaError, "Current engine bytes"):
            build_patch(m, h, v, r, e+b"tampered", mod, mod+" ", art, art, "CHAR630")

    def test_stale_active_ref_guard(self):
        m, h, v, r, e, mod, art, old = fixture()
        r["auto_ambient_v627"]["engine"] = "assets/"+"b"*64+".js"
        with self.assertRaisesRegex(DeltaError, "differs from manifest"):
            active_engine(m, h, r)

    def test_new_image_requires_verified_existing_git_blob(self):
        m, h, v, r, e, mod, art, old = fixture()
        updated_art=json.loads(json.dumps(art))
        h2="9"*64
        updated_art["gun"]={"path":f"assets/{h2}.png","sha256":h2,"bytes":2500,"kind":"image"}
        with self.assertRaisesRegex(DeltaError, "reusable Git blob"):
            build_patch(m,h,v,r,e,mod,mod,art,updated_art,"CHAR630")
        out=build_patch(m,h,v,r,e,mod,mod,art,updated_art,"CHAR630",
                        {updated_art["gun"]["path"]:"a"*40})
        self.assertEqual(out["status"], "prepared")
        self.assertEqual(len(out["reuse_git_blobs"]),1)
        self.assertEqual(out["reuse_git_blobs"][0]["git_blob_sha"],"a"*40)
        self.assertEqual(len(json.loads(out["files"]["dist/asset-manifest.json"])),len(m)+1)

    def test_corrupt_image_metadata_rejected(self):
        m, h, v, r, e, mod, art, old = fixture()
        bad=json.loads(json.dumps(art))
        bad["gun"]["sha256"]="b"*64
        with self.assertRaisesRegex(DeltaError,"hash/length"):
            check_images(bad,m)

    def test_duplicate_or_invalid_version_rejected(self):
        m, h, v, r, e, mod, art, old = fixture()
        with self.assertRaisesRegex(DeltaError,"suffix"):
            build_patch(m,h,v,r,e,mod,mod,art,art,"bad suffix!")

if __name__ == "__main__":
    unittest.main()
