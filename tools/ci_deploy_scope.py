#!/usr/bin/env python3
"""Fail closed: only an approved M08 browser UI/mission release may skip full engine browser suite."""
import sys
from pathlib import Path

SAFE = {
    "dist/index.html",
    "dist/version.json",
    "dist/verification.json",
    "dist/shop-experience-v621.js",
    "dist/m08-stage-mission-v622.js",
    "dist/m08-runtime-missions-v623.js",
    "dist/m08-mission-rewards-v624.js",
    "web/shop-experience-v621.js",
    "web/m08-stage-mission-v622.js",
    "web/m08-runtime-missions-v623.js",
    "web/m08-mission-rewards-v624.js",
    "tests/m08_090_release_integrity.test.cjs",
    "tests/m08_040_mission_rewards.test.cjs",
}
def classify(lines):
    paths = [s.strip() for s in lines if s.strip()]
    return "fast" if paths and set(paths) <= SAFE else "full"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("expected diff file")
    print(classify(Path(sys.argv[1]).read_text().splitlines()))
