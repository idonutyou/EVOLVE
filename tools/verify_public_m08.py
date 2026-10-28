#!/usr/bin/env python3
"""Verify the actual Pages CDN published exactly the intended bytes, without retesting every unchanged boss."""
import argparse
import hashlib
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = (
    "index.html",
    "version.json",
    "shop-experience-v621.js",
    "shop-front-v621.js",
    "m08-stage-mission-v622.js",
    "m08-runtime-missions-v623.js",
    "m08-mission-rewards-v624.js",
)
def verify(url, timeout):
    root_url = url.rstrip("/") + "/"
    deadline = time.monotonic() + timeout
    last_error = None
    while True:
        stamp = str(int(time.time() * 1000))
        try:
            for name in FILES:
                target = urllib.parse.urljoin(root_url, name) + "?release_check=" + stamp
                req = urllib.request.Request(target, headers={
                    "Cache-Control": "no-cache, no-store",
                    "Pragma": "no-cache",
                    "User-Agent": "EVOLVE-M08-FAST-PUBLICATION-CHECK",
                })
                expected = (ROOT / "dist" / name).read_bytes()
                with urllib.request.urlopen(req, timeout=15) as response:
                    if response.status != 200:
                        raise ValueError(f"{name}: unexpected HTTP {response.status}")
                    actual = response.read(len(expected) + 1)
                if hashlib.sha256(actual).digest() != hashlib.sha256(expected).digest():
                    raise ValueError(f"{name}: published bytes do not match build")
            print(f"EVOLVE live publication PASS: {len(FILES)} exact files incl. index, version, mission and SHOP.")
            return
        except (OSError, ValueError, urllib.error.URLError) as error:
            last_error = str(error)
            if time.monotonic() >= deadline:
                raise SystemExit("EVOLVE live publication mismatch: " + last_error)
            time.sleep(min(5, max(0, deadline-time.monotonic())))
if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--url", required=True)
    p.add_argument("--timeout", type=int, default=180)
    a=p.parse_args()
    verify(a.url, a.timeout)
