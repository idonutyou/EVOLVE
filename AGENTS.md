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
- Commit intermediate migration results on online-v575 so interrupted work remains recoverable.
- Distinguish automated mobile viewport checks from physical Galaxy S23+ testing.

- User-approved map rules and the saved-JSON fast update procedure are in docs/MAP_UPDATE_RULES_KO.md. Read that file before map work. When a supplied save is already deployed byte-for-byte/equivalent, verify the live build and report completion without redoing the patch.
