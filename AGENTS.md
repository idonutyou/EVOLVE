# EVOLVE online maintenance

- Current baseline: V575. Never revert to V555 or historical Drive files.
- Keep image bytes exact. Do not regenerate, resize, re-encode, or reduce quality.
- Preserve existing combat, maps, bosses, stages, rewards and save keys unless requested.
- Game/data files have SHA-256 paths. Update the manifest and references with each intended change.
- After the first manual upload, dist/ contains the complete tracked website. Do not restore the first-upload archive over later game edits.
- The manual upload installer only fills an absent/empty dist/. Keep its checksum and path guards.
- Keep EVOLVE_V575_TEST_* persistence stable. Never erase browser storage during updates.
- Updates never reload automatically. Apply only at home after an explicit click.
- Retain deployment guards, image hashes, and browser verification. Confirm the actual Pages deployment.
- PUBLICATION SOURCE AS OF 2026-10-29 KST: GitHub Pages uses "Deploy from a branch", branch `pages-fast-evolve-20261029`, folder `/(root)`. That branch's root tree must be the same Git tree as the verified `main:dist/` folder. This switch was confirmed by successful GitHub Pages native runs 40747878309 and 40748607894.
- IMPORTANT FOR ALL CHAT ROOMS: updating `main` or `main/dist` alone no longer publishes the public game. After verification and a recoverable checkpoint, sync its verified `dist` Git tree into the root of `pages-fast-evolve-20261029` via the connected authenticated GitHub tool (create a commit with the `dist` tree as root, parent the current Pages-branch HEAD; update ref non-forced with expected SHA). This reuses unchanged game/image Git objects without re-uploading them.
- Do not use GitHub Actions `GITHUB_TOKEN` pushes as a replacement: GitHub docs explicitly state they do not trigger a branch-based Pages build. Do not claim publication unless the native Pages build/deploy is successful and the public URL serves the expected version and changed files.
- The old `deploy-pages.yml` workflow remains a separate artifact-deployment implementation, NOT the branch source selected by the user. Do not silently switch Pages settings or rely on its success to prove the branch source was published.
- The next character/core/weapon/image release is high-risk: require focused and full game/asset regression and verify original save compatibility BEFORE syncing Pages branch. For low-risk M08 UI the pre-existing targeted/browser checks suffice; unexpected HTML/engine changes fail closed.
- After branch sync, verify the new Pages branch's root tree equals the intended `main:dist` tree and previous recovery branch is preserved. The last two branch-build timings were 142 s and 233 s (variable 89/157 s native checkout); never claim the engine assets avoid GitHub's own internal Pages checkout.
- The user explicitly requires automatic upload and deployment of completed EVOLVE changes to the existing idonutyou/EVOLVE repository. Do not ask for confirmation again. Preserve safe in-game update timing.
- Commit intermediate migration results on online-v575 so interrupted work remains recoverable.
- Backups and recovery take priority over new implementation. Before rebuilding
  interrupted work, check this repository's previous scratch workspaces and
  local commits as well as its remote branch and saved recovery archives.
- Before reporting each 10% milestone, create a recoverable checkpoint, verify
  its archive and file hashes, and confirm persistent saving succeeded. A local
  commit or an attempted upload alone is not a confirmed persistent backup.
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
