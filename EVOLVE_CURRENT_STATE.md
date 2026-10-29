# EVOLVE — Current Handoff (canonical short status)
Updated: 2026-10-29 KST, after V628 public release. Source of truth: GitHub `main` + `dist/version.json` (recheck branch HEAD on every edit).

## Current baseline
- Repository: `idonutyou/EVOLVE`, development branch `main`.
- Verified base before this workflow-only fix: `7f33375e08388033f561f741de37cd55186adf31`.
- Live game release: **V628 LOADER** (preserves V625 red BIO CORE, V626 weapon pose, V627 map-adaptive ambient). Public version: `...-AUTOAMBIENT627-LOADER628`, build `bde1fb8221389139a2f6eb8dfb50ae2548da2802058ec0436d72a99ee0fddebf`.
- Release branch/root: `pages-fast-evolve-20261029:/(root)`, commit `6f708e0ea6c7a0846f04da8283f4fa3d2aea5979` and deployed tree `bb74f68b7c81ffb034ec89432197dc7f66f89b93`, matching verified `main:dist`. GitHub Pages native build/deployment run `40870655122` succeeded, and the live public `version.json` plus hashed JS asset were fetched and verified.
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

## On subsequent work
Update this file with the exact final git HEAD, active build, phase percent, changed files, backup branch and verified release BEFORE claiming completion. Keep it concise and preserve historical records.
