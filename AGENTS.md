# EVOLVE online maintenance

- Current baseline: V575. Never revert to V555 or historical Drive files.
- Keep image bytes exact. Do not regenerate, resize, re-encode, or reduce quality.
- Preserve existing combat, maps, bosses, stages, rewards and save keys unless requested.
- Game/data files have SHA-256 paths. Update the manifest and references with each intended change.
- Restore assets with tools/asset_bundles.py unpack before editing. Later packages reuse existing bundles and add only new hashes.
- Keep EVOLVE_V575_TEST_* persistence stable. Never erase browser storage during updates.
- Updates never reload automatically. Apply only at home after an explicit click.
- Retain deployment guards, image hashes, and browser verification. Confirm the actual Pages deployment.
- Commit intermediate migration results on online-v575 so interrupted work remains recoverable.
- Distinguish automated mobile viewport checks from physical Galaxy S23+ testing.
