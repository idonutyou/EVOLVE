# EVOLVE — Current Handoff (canonical short status)
Updated: 2026-10-29 KST, after verified V629 public release. Source of truth: GitHub `main` + `dist/version.json` (recheck branch HEAD on every edit).

## Current baseline
- Repository: `idonutyou/EVOLVE`, development branch `main`.
- Verified base before this workflow-only fix: `7f33375e08388033f561f741de37cd55186adf31`.
- Live game release: **V629 PRIORITY** (preserves V625 red BIO CORE, V626 weapon pose, V627 ambient and V628 loader guards). Public version ends `...-LOADER628-PRIORITY629`, build `a2be65cec86eb9285a86456c3fe0596c8564c96511ae2635d9ab328dd5c93878`.
- Release branch/root: `pages-fast-evolve-20261029:/(root)`, V629 commit `b3c057e1fdaed3b08b9b0653c85c95103db8a3ed` and tree `3eaa46c096621bf362ffb7b21889c49657a683e8`, matching verified `main:dist`. Native GitHub Pages deployment run `40872793148` succeeded. Public `version.json` and updated immutable JS URL were fetched and confirmed.
- M09 shop/economy stage: **100% complete**, checkpoint `checkpoints/EVOLVE_M09_100_20261029.json`. M10 is the *next planned* stage, not a completed stage; use 30/30/30/10 batches when requested, with an actual 10%-interval recovery checkpoint.
- Current EVOLVE character assets are already stored in `main/dist/assets`. V625 six original PNGs and their engine also exist in `backup/biocore-v625-assets-uploaded-20261029` (tree `44e44404fb7759fac329d83b63908b2217acd024`). Never repeat ZIP/Base64 transfers for those existing immutable Git blobs.
- Recovery branches: `backup/fast-work-pre-fix-20261029` (`7f33375...`), `backup/v628-prepublish-20261029` (`526f4466...`), and published-site rollback `backup/pages-before-loader628-96a34c4d-20261029` (`96a34c4d...`). Do not delete checkpoints.

## Fast recovery and testing
1. Read `AGENTS.md` and THIS short file. Check the current HEAD, `dist/version.json`, and changed-file list ONCE. Historical `EVOLVE_HANDOFF.md`, `EVOLVE_PROGRESS.md`, and `EVOLVE_ROADMAP.md` still begin at M07 and are **archives, not the live state**.
2. Before attempting to move binary image/ZIP files between Work sessions, look up the exact blob path and Git tree SHA on the repository; reuse existing objects.
3. For intermediate character metadata-only checks (no 386MB download): `python3 tests/bio_core_090_static.py --metadata-only`. This validates references only, not rendered gameplay. On release, run the existing focused real-browser test plus save compatibility once.
4. Current character browser test fails early when V625 core art or web bootstrap reports failure. It must not wait 180s in an already-known failure state.
5. V627 packaging source now refreshes the V625 active-engine reference on regeneration; older already-published V627 `verification.json` still contains a historical V626 `bio_core_v625.engine` value. Use `auto_ambient_v627.engine` as the active one. Do NOT repackage the live engine solely to correct a historical QA reference; handle on the next actual engine release.
6. V628 has shipped a new hashed **web loader only**. Original art, game engine, game content, prices, and save keys are unchanged. Future game or character edits must still pass focused real-browser/save compatibility checks before release.

## FAST WORK second-stage update — V628 shipped (2026-10-29)
- Base main before changes: `442318044e7f71d1d595fac51e60df7a7eae3b83`.
- Changed loader SOURCE: `web/client.js` now sets finite bounds on manifest fetch/parse, individual resource header/stream reads, Cache API operations, dynamic script tags and startup readiness. Cache failures disable repeated caching attempts instead of stalling resource preparation. Original image bytes and game logic are untouched.
- Added isolated loader Node/VM test: `node tests/web_client_020_loader.test.cjs`. It runs 8 tiny success/error/stall scenarios without original assets, browsers or map loading.
- Added image-only focused browser test: `node tests/bio_core_fast_visual_browser.cjs`. It only decodes six V625 images and checks animation frames in Chromium; requires local six PNGs and Playwright. Not equivalent to a full real-game smoke.
- **PUBLIC AND VERIFIED:** V628 source packaged in `main:dist`, with hashed web client `dist/assets/ee5fef06a1ac60e984e6c885ebc05a25e2868d66dea006a854e89cbaa03c2daf.js`. QA run `40870480673`: 8 isolated loader cases PASS, existing loader contract PASS, six-image Chromium PASS, actual 393×852 game/weapon/map/save Chromium smoke PASS. Native GitHub Pages deployment run `40870655122` succeeded, live `version.json` reports `-LOADER628`, and the changed JS asset is publicly readable. The earlier QA attempt `40870304525` failed only because the isolated browser test did not honor the runner's installed `CHROME_BIN`; fixed and retested. No new images rendered. No Work-internal hang fix is claimed.
- Recovery branch: `backup/fast-loader-v628-pre-20261029` at `442318044e7f71d1d595fac51e60df7a7eae3b83`. Change branch: `fix/fast-loader-tests-v628-20261029`.

## FAST WORK fourth-stage update — V629 public (2026-10-29)
- Source main release commit: `eb68653fd91b5da7cf4bf5fef82d67130e8ded43`. Latest main may advance with metadata-only handoff commits; always compare HEAD once when beginning new work.
- Preserved 1,027 original images and all actual game engine/map data. Preloading now blocks on exactly **12 manifest-verified code/data scripts (77,761,962 bytes = 74.16 MiB)** instead of **401,054,824 bytes = 382.48 MiB**. **80.61% less blocking preload work**, without claiming total browser traffic falls by that amount; native images still download as needed. Deferred files: 1,066, deferred bytes: 323,292,862.
- Existing ServiceWorker caches SHA-named original images on request. No longer guaranteed to have unvisited images cached offline after the initial visit; monitor and only introduce a user-controlled offline pack if asked. Never delete original images or reduce quality.
- Actual focused QA: GitHub Actions run `40872605406` succeeded (8 loader failures/cache cases, real Chromium character/weapon/map/save/game start). Startup gate measured 12 files, 77,761,962 bytes, with 323,292,862 bytes deferred. Native Pages run `40872793148` succeeded. Public version.json and the new web client `assets/80e69d0b91df519012e37724ef722493f475ab7457a915dfa869a7efe55a0d7d.js` were confirmed.
- Recovery before V629 source work: `backup/pre-priority-loader629-20261029` (V628 main). Public-site rollback: `backup/pages-before-priority629-6f708e0e-20261029` (V628 Pages HEAD). Preserve all older snapshots. New image rendering not needed.

## On subsequent work
Update this file with the exact final git HEAD, active build, phase percent, changed files, backup branch and verified release BEFORE claiming completion. Keep it concise and preserve historical records.
