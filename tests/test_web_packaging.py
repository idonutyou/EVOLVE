import sys,json,tempfile,unittest,base64
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from build_web import build,GUARD
from asset_bundles import pack,unpack
from verify_site import verify

class WebTests(unittest.TestCase):
 def create(self,root):
  src=root/'source.html';image=base64.b64encode(b'original image bytes').decode()
  src.write_text('<head></head><body><img src="data:image/png;base64,'+image+'"><script>\n(()=>{\nconst ENV_OPT_V518={"value":123};\nconst CAMPAIGN_MAPS_V567=[{"id":"a","field":"AAAA"},{"id":"b","field":"BBBB"}];\n})();\n</script><script id="evolveI18nENKO">window.language=true;</script></body>')
  out=root/'dist';build(src,out);return out
 def test_binary_and_script_order(self):
  with tempfile.TemporaryDirectory() as t:
   out=self.create(Path(t));verify(out);html=(out/'index.html').read_text();self.assertIn('<script id="evolveI18nENKO" defer src=',html)
   m=json.loads((out/'asset-manifest.json').read_text());images=[x for x in m if x['kind']=='image'];self.assertEqual((out/images[0]['path']).read_bytes(),b'original image bytes');self.assertEqual(sum(x['kind']=='game-code' for x in m),2)
 def test_bundle_round_trip_and_corruption_rejection(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);out=self.create(root);bundles=root/'bundles';pack(out,bundles);self.assertEqual(pack(out,bundles)['new_assets'],0);rest=root/'rest';rest.mkdir();(rest/'asset-manifest.json').write_bytes((out/'asset-manifest.json').read_bytes());unpack(rest,bundles)
   for e in json.loads((out/'asset-manifest.json').read_text()):self.assertEqual((out/e['path']).read_bytes(),(rest/e['path']).read_bytes())
   p=next(bundles.glob('*.bin'));p.write_bytes(p.read_bytes()+b'bad')
   with self.assertRaises(ValueError):unpack(rest,bundles)
 def test_rejects_altered_image(self):
  with tempfile.TemporaryDirectory() as t:
   out=self.create(Path(t));e=next(x for x in json.loads((out/'asset-manifest.json').read_text()) if x['kind']=='image');(out/e['path']).write_bytes(b'bad')
   with self.assertRaises(ValueError):verify(out)
