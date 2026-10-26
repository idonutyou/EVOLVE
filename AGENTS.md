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
