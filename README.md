# EVOLVE — V575 Web Version

The complete V575 game is packaged for the owner's first manual upload. It has not been deployed yet.

First set **Settings → Pages → Build and deployment → Source: GitHub Actions** (leave it if already selected).

Download the provided `EVOLVE_V575_GITHUB_FULL_UPLOAD.zip`, extract it, and upload all **68 files inside `UPLOAD_FILES`** to the root of `main` using <https://github.com/idonutyou/EVOLVE/upload/main>. Do not upload the ZIP itself or create a nested `UPLOAD_FILES` directory in the repository.

For smaller batches, upload the 67 numbered BIN files first and **`EVOLVE_V575_INSTALL.json` last**. Previously committed parts can be reused. See [the Korean upload guide](docs/MANUAL_UPLOAD_KO.txt).

`Publish EVOLVE Web` waits for the upload, verifies every part and the complete archive, restores the full `dist/` website, verifies all 1001 content files, and runs browser checks. Only after those checks pass does it commit the restored website to `main` and deploy GitHub Pages. The workflow keeps the empty-site and image-integrity guards. Existing websites are never replaced with this first-upload package on subsequent runs.

Original baseline: `EVOLVE_V575_FLOOR_VISIBILITY_TEST.html`, 409,975,333 bytes, SHA-256 `d5ea39a2fc07eab4507d7782ccfbd339ab7c6285f0c874fd061716bde2ab63ea`.

All 977 unique original images are preserved byte for byte. Existing combat, maps, bosses, stages and save keys are retained. Hashed asset URLs reuse cached content; updates require an explicit action at home. A prior local HTML file and the new website use different browser storage, so transfer an old save once through the game's existing export/import settings.

Automated browser checks do not replace physical phone play tests. Deployment is complete only after `Deploy GitHub Pages` succeeds and the returned URL is checked.
