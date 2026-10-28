#!/usr/bin/env python3
import importlib.util
import json
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('pages_release_gate',Path(__file__).resolve().parents[1]/'tools'/'pages_release_gate.py')
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
A,B='a'*64,'b'*64
OLD='<script>window.EVOLVE_WEB_CONFIG={"version":"V575","build":"'+A+'"};</script><script defer src="m08-mission-rewards-v624.js?v=100"></script>'
NEW=OLD.replace(A,B).replace('v=100','v=101')
V1=json.dumps(dict(build=A,source_sha256='s',assets=1072,scriptBytes=81,preloadResources=True))
V2=json.dumps(dict(build=B,source_sha256='s',assets=1072,scriptBytes=81,preloadResources=True))
R1=json.dumps(dict(build=A,source_sha256='s',image_recompression=False,source_unchanged=True,cached_bytes=386221027,index_bytes=len(OLD)))
R2=json.dumps(dict(build=B,source_sha256='s',image_recompression=False,source_unchanged=True,cached_bytes=386221027,index_bytes=len(NEW)))

class ReleaseGate(unittest.TestCase):
    def verdict(self,paths=('index.html','version.json','verification.json','m08-mission-rewards-v624.js'),h1=OLD,h2=NEW,v1=V1,v2=V2,r1=R1,r2=R2):
        return m.evaluate(paths,h1,h2,v1,v2,r1,r2)[0]
    def test_noop(self): self.assertEqual(self.verdict(paths=[]),'unchanged')
    def test_focused(self): self.assertEqual(self.verdict(),'focused')
    def test_character_images(self): self.assertEqual(self.verdict(paths=['assets/new_character.png']),'full')
    def test_unknown_engine(self): self.assertEqual(self.verdict(paths=['game-engine.js']),'full')
    def test_engine_html(self): self.assertEqual(self.verdict(h2=NEW+'<script>mutation()</script>'),'full')
    def test_cache_not_bumped(self):
        self.assertEqual(self.verdict(h2=OLD.replace(A,B),r2=json.dumps(dict(build=B,source_sha256='s',image_recompression=False,source_unchanged=True,cached_bytes=386221027,index_bytes=len(OLD)))),'full')
    def test_build_not_bumped(self): self.assertEqual(self.verdict(v2=V1),'full')
    def test_asset_count_changed(self): self.assertEqual(self.verdict(v2=V2.replace('1072','1073')),'full')
    def test_report_corrupt(self): self.assertEqual(self.verdict(r2=R2.replace('386221027','386221026')),'full')
    def test_index_length_mismatch(self): self.assertEqual(self.verdict(r2=R2.replace(str(len(NEW)),'1')),'full')
    def test_duplicate_js(self): self.assertEqual(self.verdict(h2=NEW+'<script defer src="m08-mission-rewards-v624.js?v=101"></script>'),'full')

if __name__=='__main__':unittest.main()
