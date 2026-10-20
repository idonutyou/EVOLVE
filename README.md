# EVOLVE — Web Version

This repository is the deployment workspace for the EVOLVE mobile survival/evolution action game.

## Current status

Repository write access verification and online deployment preparation. **The playable game has not been published yet.**

- Baseline: `EVOLVE_V575_FLOOR_VISIBILITY_TEST.html` (approx. 410 MB)
- Target: a stable HTTPS game URL with automatic deployment on approved updates
- Assets: preserve original image bytes without recompression or degradation
- Regression requirements: keep existing combat, maps, bosses, rewards, and saves intact
- Delivery: split assets and game code below GitHub's individual file limit; cache unchanged assets on the device
- Validation: verify extracted asset hashes, game boot, mobile controls, and save compatibility before release

Do not replace the latest test build with older versions.
