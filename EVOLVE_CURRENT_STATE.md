# EVOLVE — Current Handoff (canonical short status)
Updated: 2026-10-29 20:28 KST. Source of truth: GitHub `main` + `dist/version.json` (recheck branch HEAD on every edit).

## Current baseline
- Repository: `idonutyou/EVOLVE`, development branch `main`.
- Verified base before this workflow-only fix: `7f33375e08388033f561f741de37cd55186adf31`.
- Live game release: **V627 AUTOAMBIENT** (V625 red BIO CORE, V626 raised/enlarged weapons, V627 map-adaptive ambient).
- Release branch/root: `pages-fast-evolve-20261029:/(root)`, commit `96a34c4d3e7dfb4b78a7b08c31871065fb5eb82c`. Its tree matched the then-current `main:dist` tree `86ad3c3f843b592542662cc20f8743c363c735a0`. Recheck before new publication.
- M09 shop/economy stage: **100% complete**, checkpoint `checkpoints/EVOLVE_M09_100_20261029.json`. M10 is the *next planned* stage, not a completed stage; use 30/30/30/10 batches when requested, with an actual 10%-interval recovery checkpoint.
- Current EVOLVE character assets are already stored in `main/dist/assets`. V625 six original PNGs and their engine also exist in `backup/biocore-v625-assets-uploaded-20261029` (tree `44e44404fb7759fac329d83b63908b2217acd024`). Never repeat ZIP/Base64 transfers for those existing immutable Git blobs.
- Recovery before this maintenance edit: `backup/fast-work-pre-fix-20261029` at `7f33375e08388033f561f741de37cd55186adf31`. Do not delete older checkpoints.

## Fast recovery and testing
1. Read `AGENTS.md` and THIS short file. Check the current HEAD, `dist/version.json`, and changed-file list ONCE. Historical `EVOLVE_HANDOFF.md`, `EVOLVE_PROGRESS.md`, and `EVOLVE_ROADMAP.md` still begin at M07 and are **archives, not the live state**.
2. Before attempting to move binary image/ZIP files between Work sessions, look up the exact blob path and Git tree SHA on the repository; reuse existing objects.
3. For intermediate character metadata-only checks (no 386MB download): `python3 tests/bio_core_090_static.py --metadata-only`. This validates references only, not rendered gameplay. On release, run the existing focused real-browser test plus save compatibility once.
4. Current character browser test fails early when V625 core art or web bootstrap reports failure. It must not wait 180s in an already-known failure state.
5. V627 packaging source now refreshes the V625 active-engine reference on regeneration; older already-published V627 `verification.json` still contains a historical V626 `bio_core_v625.engine` value. Use `auto_ambient_v627.engine` as the active one. Do NOT repackage the live engine solely to correct a historical QA reference; handle on the next actual engine release.
6. Game, art, saves, prices and deployed `dist` are not changed by this handoff/QA-only maintenance; no Pages deployment is required.

## FAST WORK second-stage update — source-only (2026-10-29)
- Base main before changes: `442318044e7f71d1d595fac51e60df7a7eae3b83`.
- Changed loader SOURCE: `web/client.js` now sets finite bounds on manifest fetch/parse, individual resource header/stream reads, Cache API operations, dynamic script tags and startup readiness. Cache failures disable repeated caching attempts instead of stalling resource preparation. Original image bytes and game logic are untouched.
- Added isolated loader Node/VM test: `node tests/web_client_020_loader.test.cjs`. It runs 8 tiny success/error/stall scenarios without original assets, browsers or map loading.
- Added image-only focused browser test: `node tests/bio_core_fast_visual_browser.cjs`. It only decodes six V625 images and checks animation frames in Chromium; requires local six PNGs and Playwright. Not equivalent to a full real-game smoke.
- **NOT YET PUBLISHED:** the live version remains **V627**; unchanged `dist` contains the old content-hashed web client. Source change must first pass the real focused game boot/save check, then be repackaged and published in a later release. Do not claim runtime stall handling is live yet. No image regeneration is required.
- Recovery branch: `backup/fast-loader-v628-pre-20261029` at `442318044e7f71d1d595fac51e60df7a7eae3b83`. Change branch: `fix/fast-loader-tests-v628-20261029`.

## On subsequent work
Update this file with the exact final git HEAD, active build, phase percent, changed files, backup branch and verified release BEFORE claiming completion. Keep it concise and preserve historical records.
