#!/usr/bin/env python3
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from ci_deploy_scope import classify
class DeployScopeTest(unittest.TestCase):
    def test_safe_m08(self):
        self.assertEqual(classify(["dist/index.html","dist/version.json","dist/verification.json","tests/m08_090_release_integrity.test.cjs","tests/m08_040_mission_rewards.test.cjs"]),"fast")
    def test_change_engine_or_asset(self):
        for name in ["dist/assets/123.png","web/client.js","dist/sw.js",".github/workflows/deploy-pages.yml","EVOLVE_V575_PART_001.bin","tools/ci_deploy_scope.py"]:
            self.assertEqual(classify(["dist/index.html",name]),"full")
    def test_empty_fails_closed(self):
        self.assertEqual(classify([]),"full")
if __name__=="__main__": unittest.main()
