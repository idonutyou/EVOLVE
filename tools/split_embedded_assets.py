#!/usr/bin/env python3
"""Convert the single-file EVOLVE HTML into a static site without re-encoding art.

Usage: python3 tools/split_embedded_assets.py --source /path/to/EVOLVE_V575_FLOOR_VISIBILITY_TEST.html
Creates dist/index.html, dist/assets/* and dist/version.json.
WARNING: conversion is not sufficient proof of browser compatibility; test before publishing.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import mmap
import os
import re
import shutil
import tempfile
from pathlib import Path

IMAGE = re.compile(
    rb"data:image/(png|jpe?g|webp|gif|avif|bmp|svg\+xml);base64,([A-Za-z0-9+/]+={0,2})",
    re.IGNORECASE,
)
EXT = {b"jpeg": "jpg", b"jpg": "jpg", b"png": "png", b"webp": "webp",
       b"gif": "gif", b"avif": "avif", b"bmp": "bmp", b"svg+xml": "svg"}
MAX_GIT_BLOB = 100 * 1024 * 1024

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def convert(source: Path, output: Path, version: str) -> dict:
    if not source.is_file():
        raise FileNotFoundError(source)
    if source.resolve() == output.resolve():
        raise ValueError("output directory must not equal source")
    output.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".evolve-static-", dir=output.parent))
    assets = stage / "assets"
    assets.mkdir()
    names: set[str] = set()
    entries = []
    count = 0
    try:
        with source.open("rb") as inp, (stage / "index.html").open("wb") as html:
            with mmap.mmap(inp.fileno(), length=0, access=mmap.ACCESS_READ) as raw:
                end = 0
                for match in IMAGE.finditer(raw):
                    html.write(raw[end:match.start()])
                    mime = match.group(1).lower()
                    suffix = EXT[mime]
                    data = base64.b64decode(match.group(2), validate=True)
                    digest = hashlib.sha256(data).hexdigest()
                    name = digest + "." + suffix
                    if len(data) > MAX_GIT_BLOB:
                        raise ValueError("Oversized asset (requires separate hosting): " + name)
                    asset = assets / name
                    if name not in names:
                        asset.write_bytes(data)
                        # Compare stored bytes with decoded source bytes, never recompress.
                        if sha256_file(asset) != digest:
                            raise ValueError("Asset hash mismatch: " + name)
                        names.add(name)
                        entries.append({"path": "assets/" + name, "sha256": digest, "bytes": len(data)})
                    html.write(("assets/" + name).encode("ascii"))
                    end = match.end()
                    count += 1
                html.write(raw[end:])
        # Strictly flag unconverted embedded image payloads; do not silently publish them.
        remaining = (stage / "index.html").read_bytes()
        if re.search(rb"data:image/[^\s'\"<>)]*;base64,", remaining, re.IGNORECASE):
            raise ValueError("Unconverted embedded image data URI remains in index.html")
        if (stage / "index.html").stat().st_size > MAX_GIT_BLOB:
            raise ValueError("HTML still exceeds GitHub file limit; additional extraction required")
        # Source remains untouched.
        report = {
            "version": version,
            "source_filename": source.name,
            "source_bytes": source.stat().st_size,
            "source_sha256": sha256_file(source),
            "replaced_data_uris": count,
            "unique_assets": len(entries),
            "assets_bytes": sum(x["bytes"] for x in entries),
            "index_bytes": (stage / "index.html").stat().st_size,
        }
        (stage / "version.json").write_text(json.dumps(
            {"version": version, "assets": len(entries), "source_sha256": report["source_sha256"]},
            ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (stage / "asset-manifest.json").write_text(
            json.dumps(entries, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        (stage / "verification.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if output.exists():
            raise FileExistsError(f"Output already exists, refusing overwrite: {output}")
        stage.rename(output)
        return report
    finally:
        if stage.exists():
            shutil.rmtree(stage)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--source", type=Path, required=True)
    p.add_argument("--output", type=Path, default=Path("dist"))
    p.add_argument("--version", default="V575")
    args = p.parse_args()
    print(json.dumps(convert(args.source, args.output, args.version),
                     ensure_ascii=False, indent=2))
