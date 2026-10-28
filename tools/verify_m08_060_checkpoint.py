#!/usr/bin/env python3
"""EVOLVE M08 60% recovery package verification (source bytes, CRC32, SHA-256)."""
from pathlib import Path
import hashlib, json, zipfile, zlib
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/"checkpoints/EVOLVE_M08_060_20261029.json").read_text(encoding="utf-8"))
archive=root/manifest["archive"]
raw=archive.read_bytes()
assert len(raw)==manifest["zip_bytes"], "archive size"
assert hashlib.sha256(raw).hexdigest()==manifest["zip_sha256"], "archive SHA256"
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None, "bad ZIP CRC32"
    assert set(z.namelist())=={e["path"] for e in manifest["files"]}, "unexpected ZIP entries"
    for e in manifest["files"]:
        data=z.read(e["path"])
        assert data==(root/e["path"]).read_bytes(), "repository differs from archive: "+e["path"]
        assert len(data)==e["bytes"], "byte count"
        assert hashlib.sha256(data).hexdigest()==e["sha256"], "entry SHA256"
        assert f"{zlib.crc32(data)&0xffffffff:08x}"==e["crc32"], "entry CRC32"
assert manifest["real_billing"] is False
assert manifest["main_deployed"] is False
assert manifest["base_checkpoint"]=="backup/monetization-m08-030-20261028"
print(f"M08 60% recovery ZIP PASS: {len(manifest['files'])} entries, {len(raw)} bytes, SHA256/CRC32/worktree match")
