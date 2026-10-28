#!/usr/bin/env python3
"""Validate M08 30% incremental ZIP, SHA256, CRC32, and tracked bytes."""
import hashlib
import json
from pathlib import Path
import zipfile
import zlib

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "checkpoints/EVOLVE_M08_030_20261028.json").read_text(encoding="utf-8"))
zip_path = root / manifest["archive"]
zip_data = zip_path.read_bytes()
assert len(zip_data) == manifest["archive_bytes"], "ZIP length"
assert hashlib.sha256(zip_data).hexdigest() == manifest["archive_sha256"], "ZIP SHA256"
with zipfile.ZipFile(zip_path) as package:
    assert package.testzip() is None, "ZIP CRC error"
    assert set(package.namelist()) == {x["path"] for x in manifest["files"]}, "ZIP membership"
    for entry in manifest["files"]:
        name = entry["path"]
        actual = package.read(name)
        assert actual == (root / name).read_bytes(), "Worktree difference: " + name
        assert len(actual) == entry["size"], "Size: " + name
        assert hashlib.sha256(actual).hexdigest() == entry["sha256"], "SHA256: " + name
        assert f"{zlib.crc32(actual)&0xffffffff:08x}" == entry["crc32"], "CRC: " + name
assert manifest["billing"] is False
assert manifest["reward_grants"] is False
assert manifest["main_deployed"] is False
print("M08 30% ZIP PASS:",len(manifest["files"]),"files,",len(zip_data),"bytes")
