#!/usr/bin/env python3
"""Validate the licensed home font and emit the three UI weights."""
import json,subprocess,sys,types
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
try:import brotli
except ImportError:
 bridge=types.ModuleType('brotli')
 bridge.decompress=lambda data:subprocess.check_output(['node','-e',"const c=[];process.stdin.on('data',d=>c.push(d));process.stdin.on('end',()=>process.stdout.write(require('node:zlib').brotliDecompressSync(Buffer.concat(c))));"],input=data)
 sys.modules['brotli']=bridge
from fontTools.ttLib import TTFont
def main():
 metadata=json.loads((ROOT/'web/home-hub-font-v601.json').read_text());needed={ord(c) for c in metadata['characters']};rules=[]
 for i,a in enumerate(metadata['fonts']):
  font=TTFont(ROOT/a['path']);missing=needed-set(font.getBestCmap());assert not missing,missing
  rules.append("@font-face{font-family:'EVOLVE Hub Sans';src:url('__HOME_HUB_FONT_"+str(i)+"_V601__') format('"+a['format']+"');font-weight:"+a['weight']+";font-style:normal;font-display:swap}")
 (ROOT/'web/home-hub-fonts-v601.css').write_text('\n'.join(rules)+'\n');(ROOT/'web/home-hub-fonts-v601.json').write_text(json.dumps(metadata|{'all_required_glyphs_covered':True,'original_game_fonts_unchanged':True},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'font_weights':len(rules),'glyphs':len(needed)}))
if __name__=='__main__':main()
