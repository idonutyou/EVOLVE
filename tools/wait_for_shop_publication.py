#!/usr/bin/env python3
"""Wait for GitHub Pages CDN to expose the newly uploaded SHOP assets.
Prevents post-deploy browser QA from testing the previous publication during propagation.
Does not mutate game/server state, grant currencies, or mask genuine runtime errors.
"""
import argparse
import json
import time
import urllib.error
import urllib.parse
import urllib.request

MARKERS = (
    ("/", b"shop-experience-v621.js?v=100"),
    ("/", b"shop-front-v621.js?v=100"),
    ("/shop-experience-v621.js", b"id:'crimson'"),
    ("/shop-front-v621.js", b"eStoreCollectionV621"),
)

def fetch(url, stamp):
    joiner = '&' if '?' in url else '?'
    req = urllib.request.Request(url + joiner + 'm07_090=' + str(stamp), headers={
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
        'User-Agent': 'EVOLVE-V621-M07-090-pages-verify',
    })
    with urllib.request.urlopen(req, timeout=18) as res:
        if res.status != 200:
            raise ValueError(f'Unexpected HTTP {res.status}')
        return res.read(700000)

def wait_for_release(base, timeout=480, interval=10):
    end = time.monotonic() + timeout
    attempts = 0
    base = base.rstrip('/') + '/'
    while True:
        attempts += 1
        stamp = int(time.time() * 1000)
        checks = []
        for suffix,marker in MARKERS:
            url = base if suffix == '/' else urllib.parse.urljoin(base, suffix.lstrip('/'))
            try:
                content = fetch(url, stamp)
                checks.append({'asset':suffix, 'ok':marker in content, 'bytes':len(content)})
            except (urllib.error.URLError, ValueError, TimeoutError) as ex:
                checks.append({'asset':suffix, 'ok':False, 'error':str(ex)[:200]})
        print(json.dumps({'attempt':attempts,'checks':checks},ensure_ascii=False),flush=True)
        if all(check['ok'] for check in checks):
            print('EVOLVE M07 90% public Pages: new index and both script assets visible.',flush=True)
            return True
        if time.monotonic() >= end:
            raise SystemExit('New M07 90% SHOP revision not visible from public Pages after polling; failing deployment verify rather than accepting stale V620/V621.')
        time.sleep(min(interval, max(0,end-time.monotonic())))

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--url',required=True)
    p.add_argument('--timeout',type=int,default=480)
    p.add_argument('--interval',type=int,default=10)
    a=p.parse_args()
    wait_for_release(a.url,a.timeout,a.interval)
