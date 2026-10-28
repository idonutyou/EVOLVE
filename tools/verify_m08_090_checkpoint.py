#!/usr/bin/env python3
"""Check 90% delta ZIP against SHA-256/CRC32 and tracked files."""
import hashlib
import json
from pathlib import Path
import zipfile
import zlib

root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/"checkpoints/EVOLVE_M08_090_20261029.json").read_text(encoding="utf-8"))
archive=root/manifest["archive"]
raw=archive.read_bytes()
assert len(raw)==manifest["archive_bytes"],"archive bytes"
assert hashlib.sha256(raw).hexdigest()==manifest["archive_sha256"],"archive SHA256"
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None,"ZIP CRC check"
    assert set(z.namelist())=={f["path"] for f in manifest["files"]},"ZIP entries"
    for f in manifest["files"]:
        data=z.read(f["path"])
        assert data==(root/f["path"]).read_bytes(),"source differs "+f["path"]
        assert len(data)==f["size"],"entry size"
        assert hashlib.sha256(data).hexdigest()==f["sha256"],"entry SHA256"
        assert f"{zlib.crc32(data)&0xffffffff:08x}"==f["crc32"],"entry CRC32"
assert manifest["backup_from"]=="backup/monetization-m08-060-20261029"
assert manifest["real_money"] is False
assert manifest["public_deployed"] is False
print("M08 90% recovery PASS",len(manifest["files"]),"files",len(raw),"bytes SHA256 CRC32 verified")
