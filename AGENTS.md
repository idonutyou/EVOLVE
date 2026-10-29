# EVOLVE online maintenance

- Current baseline: V575. Never revert to V555 or historical Drive files.
- Keep image bytes exact. Do not regenerate, resize, re-encode, or reduce quality.
- Preserve existing combat, maps, bosses, stages, rewards and save keys unless requested.
- Game/data files have SHA-256 paths. Update the manifest and references with each intended change.
- After the first manual upload, dist/ contains the complete tracked website. Do not restore the first-upload archive over later game edits.
- The manual upload installer only fills an absent/empty dist/. Keep its checksum and path guards.
- Keep EVOLVE_V575_TEST_* persistence stable. Never erase browser storage during updates.
- Updates never reload automatically. Apply only at home after an explicit click.
- Retain deployment guards and changed-asset hashes; do one essential browser smoke check just before release and one public-version check after release. Do not rerun previously passed tests without changed inputs.
- PUBLICATION SOURCE AS OF 2026-10-29 KST: GitHub Pages uses "Deploy from a branch", branch `pages-fast-evolve-20261029`, folder `/(root)`. That branch's root tree must be the same Git tree as the verified `main:dist/` folder. This switch was confirmed by successful GitHub Pages native runs 40747878309 and 40748607894.
- IMPORTANT FOR ALL CHAT ROOMS: updating `main` or `main/dist` alone no longer publishes the public game. After verification and a recoverable checkpoint, sync its verified `dist` Git tree into the root of `pages-fast-evolve-20261029` via the connected authenticated GitHub tool (create a commit with the `dist` tree as root, parent the current Pages-branch HEAD; update ref non-forced with expected SHA). This reuses unchanged game/image Git objects without re-uploading them.
- Do not use GitHub Actions `GITHUB_TOKEN` pushes as a replacement: GitHub docs explicitly state they do not trigger a branch-based Pages build. Do not claim publication unless the native Pages build/deploy is successful and the public URL serves the expected version and changed files.
- Old `.github/workflows/deploy-pages.yml` has been converted to **manual-only full game regression with NO publication**. The new `.github/workflows/pages-release-gate.yml` performs automatic read-only Git-tree comparison on main/dist updates; when trees match it is a no-op (no Pages build). See `docs/PAGES_RELEASE_RULES_KO.md`.
- Character/core/weapon/image release: test the changed character path and saved-game compatibility once before syncing Pages; use broader game/asset regression only for an actual engine/save-risk change or a focused-test failure. Do not run a full 28-test suite merely because images changed. Unexpected HTML/engine changes fail closed.
- Inspect `.github/workflows/pages-release-gate.yml` only when the deployment workflow or related files change, or immediately before an actual publication—not at every development edit. The gate is read-only and does not publish. `GITHUB_TOKEN` workflow pushes will not trigger Pages builds. For actual releases, use the connected authenticated GitHub user/app to create a new Pages commit only if `main:dist` and Pages root Git trees differ.\n- After branch sync, verify the new Pages branch's root tree equals the intended `main:dist` tree and previous recovery branch is preserved. The last two branch-build timings were 142 s and 233 s (variable 89/157 s native checkout); never claim the engine assets avoid GitHub's own internal Pages checkout.
- The user explicitly requires automatic upload and deployment of completed EVOLVE changes to the existing idonutyou/EVOLVE repository. Do not ask for confirmation again. Preserve safe in-game update timing.
- Commit intermediate migration results on online-v575 so interrupted work remains recoverable.
- Backups and recovery take priority over new implementation. Before rebuilding
  interrupted work, check this repository's previous scratch workspaces and
  local commits as well as its remote branch and saved recovery archives.
- Before reporting each 10% milestone, create a recoverable checkpoint and verify
  the changed files, archive and persistent storage once. Reuse already verified
  Git blob/tree hashes for untouched large resources; reserve full asset rehash
  for final release or meaningful integrity risk. A local commit or an attempted
  upload alone is not a confirmed persistent backup.
- Record the exact working folder, baseline/build, completed and remaining work,
  and the saved checkpoint identifier. Provide its real file link and size.
  Preserve earlier snapshots. If a remote write is blocked, save the recovery
  archive through the authorized file workflow and state which write is blocked.
- Distinguish automated mobile viewport checks from physical Galaxy S23+ testing.
- Split each roadmap STEP into three separately requested substeps: design
  (10-30%), implementation and local checks (40-70%), then regression,
  browser verification and public deployment (80-100%). Stop after the current
  substep and save its recovery point; do not continue into the next substep
  until the user asks. Keep every 10% remote checkpoint and verification.

- User-approved map rules and the saved-JSON fast update procedure are in docs/MAP_UPDATE_RULES_KO.md. Read that file before map work. When a supplied save is already deployed byte-for-byte/equivalent, verify the live build and report completion without redoing the patch.

## Default FAST WORK protocol for EVERY EVOLVE chat room (2026-10-29, user-approved)

**Default to the fastest safe workflow without requiring the user to repeat the request.** This applies to character/core/weapon changes and subsequent monetization, UI, map, and game work. Existing protection/release rules still override shortcuts when real risk exists.

1. **Recover, do not repeat.** First locate the newest verified working ZIP, Git branch, or Library checkpoint; resume from its changed files instead of reconstructing finished work. Compare current main HEAD and original checkpoint. Don't confuse a reported percentage with a deployed commit.
2. **Never re-fetch/rebuild/hash ~386MB of unchanged original assets as a routine intermediate step.** Use tracked Git blob/tree IDs, preserved baseline manifest, and the delta list; validate SHA-256 of new/modified files and checkpoint archive once. Hash all resources only for a final high-risk release or if asset integrity is genuinely suspect.
3. **Implementation first, one minimal test at the right time.** Do not run browser or regression tests at each 10% checkpoint. For character work, complete missing image/code wiring first, then run a single existing focused smoke test and a save-compatibility check before public release. Re-run only the specific failing case after a fix. Never run the full 28-script suite or re-download 386MB unchanged assets by default. Do not build a new QA harness for already-tested behavior.
4. **Correct stale expectations instead of treating them as game defects.** When replacing the original character image/animation, update assertions tied to the intentionally replaced PNG SHA, shape, 20 frames, or anatomy; preserve actual movement, weapon, collision, save, and shop checks. Never silently disable a genuine behavioral assertion.
5. **Actual work before QA.** Continue the unfinished implementation immediately after locating the last checkpoint. Intermediate 10% marks require saving changed files and checking the new backup once, not another game test. At completion, perform one consolidated changed-feature smoke/save check, a changed-files integrity check, and verify actual public Pages publication. Expand checks only for a newly observed defect, change to engine/save/transactions, or an explicit user request; never repeat known PASS checks with identical inputs.
6. **10% recovery points remain mandatory; optimize their cost.** Save only new/modified project files plus exact base commit/build, paths, hashes and restore instructions. Verify once and preserve previous checkpoints. Do not repeatedly download and re-verify the same 13MB or repack 386MB on every milestone. If remote binary upload is unavailable, preserve the actual recoverable ZIP in authorized Library/files and report GitHub publication as pending—do not claim it was pushed.
7. **Deployment:** avoid repeated online deployments. Publish only when the intended feature passes the necessary integration/final checks. Remember Pages publishes from `pages-fast-evolve-20261029`, not directly from `main`. Never mistake a passing local browser test for an online build.
8. **Time and credit:** never turn an implementation request into repeated audits or speculative diagnostics. One initial current-state read, direct delta edit, one checkpoint verification, then advance. No repeated repo listings/branch comparisons/large download/hash runs or extra screenshots unless new evidence calls for them. Report concise actual progress; avoid claims of measured savings without measurement.
9. **No unrequested art changes:** reuse approved images, protect the central core and exactly four default walking legs; tell the user before a stage that truly needs image rendering. Preserve M08 shop, M09 economic docs, game saves and established character art unless explicitly changed.

This policy is stored in-repository so any new EVOLVE development conversation should read this `AGENTS.md` at the start and automatically use the protocol; note that a chat which does not consult the repository may not receive these instructions. Existing 10%-checkpoint, asset-safety and final-publication conditions are not waived.

## Current delivery cadence (user update: 2026-10-29)

- For the current monetization stage **M09**, advance in user-requested 20-percentage-point batches: from 50% to 70%, then 90%, then the last 10% to 100%. Preserve completed M09 10%-through-50% points; do not redo them.
- Starting with the **next monetization stage M10 and later stages**, advance per user request in four batches: **0→30%, 30→60%, 60→90%, 90→100%**. When work has an already saved starting percentage, adapt the first batch without regression.
- **Batch size is NOT the backup interval.** Preserve GitHub remote checkpoints and verification at every 10% increment (including intermediate points inside a 20% or 30% batch); do not delete any backups until 100% completion. Report progress after each checked 10% save, and summarize the full batch when finished.
- Existing safety rules (no unintended art/asset rewrites, targeted validation, actual Pages release after focused QA) remain effective. This cadence supersedes the previous mandatory user-turn request for each 10%/30% substep.

