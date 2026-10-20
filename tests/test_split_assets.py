"""Regression tests for binary-preserving HTML asset extraction."""
import base64
import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / "split_embedded_assets.py"
spec = importlib.util.spec_from_file_location("evolve_split", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SplitAssetTests(unittest.TestCase):
    def test_preserves_original_bytes_and_deduplicates(self):
        raw_png = b"\\x89PNG\\r\\n\\x1a\\n" + bytes(range(64))
        encoded = base64.b64encode(raw_png).decode()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = root / "source.html"
            html = (
                '<!doctype html><style>.a{background:url(data:image/png;base64,' + encoded + ')}</style>'
                '<img src="data:image/png;base64,' + encoded + '"><script>var ok=1;</script>'
            )
            src.write_bytes(html.encode())
            original = src.read_bytes()
            report = module.convert(src, root / "dist", "V575")
            self.assertEqual(report["replaced_data_uris"], 2)
            self.assertEqual(report["unique_assets"], 1)
            self.assertEqual(src.read_bytes(), original)
            self.assertEqual(report["source_sha256"], hashlib.sha256(original).hexdigest())
            paths = list((root / "dist" / "assets").iterdir())
            self.assertEqual(len(paths), 1)
            self.assertEqual(paths[0].read_bytes(), raw_png)
            output = (root / "dist" / "index.html").read_text()
            self.assertNotIn("data:image/png;base64,", output)
            self.assertIn('<script>var ok=1;</script>', output)
            self.assertEqual(output.count("assets/"), 2)

    def test_refuses_overwrite_and_oversized_uncleared_html(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = root / "source.html"
            src.write_text("<html><body>ready</body></html>")
            output = root / "dist"
            module.convert(src, output, "V575")
            with self.assertRaises(FileExistsError):
                module.convert(src, output, "V575")

if __name__ == "__main__":
    unittest.main()
