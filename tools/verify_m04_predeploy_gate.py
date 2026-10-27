#!/usr/bin/env python3
"""M04 release gate for preserving existing art and disabled billing."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text())
if __name__=='__main__':
 d=read('monetization/catalog/draft_skus.json')
 assert d['checkout_enabled'] is False
 assert d['client_grants_enabled'] is False
 assert len(d['products'])==5
 assert all(x['status']=='draft_disabled' and x['price_minor'] is None for x in d['products'])
 print('M04 predeploy safety gate: OK')
