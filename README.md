# EVOLVE — V575 Web Version

Current update: **V575-WEB-29-ADMIN-COMBAT**. Original monster identities are restored; RIPPER, MAULER and BILEBACK are separate species. Contracts are removed. All monsters cause contact damage, shooters retreat while firing, and ranked mid-bosses have distinct attacks, body vapor and the existing dedicated health HUD. See [current combat rules](docs/ADMIN_COMBAT_RULES_KO.md) and [browser evidence](docs/ADMIN_COMBAT_BROWSER_REPORT.json).

Play EVOLVE: **https://idonutyou.github.io/EVOLVE/**

The full V575-WEB-2 website is deployed on GitHub Pages and installed in `main` under `dist/`. All 68 manual upload files were restored successfully. All 1001 asset checksums and automated browser checks passed. The public game URL was opened in a browser; the home screen, original character image and enabled battle-start button were verified.

Pages is configured to use GitHub Actions. Future verified changes to the website deploy through `Publish EVOLVE Web`; players continue using the same HTTPS address.

The initial upload is complete. No game files need to be uploaded again. The original first-upload package remains in the repository as a verified recovery source.

The browser verification covered prior-version save migration, mobile movement, pause/resume, all five maps, save persistence across reload, landscape layout, and updates waiting for home. Browser JavaScript exceptions and HTTP failures were both empty. Physical Galaxy S23+ play testing remains necessary.

`Publish EVOLVE Web` restores the first-upload archive only if the website is absent, verifies all 1001 content files, and runs browser checks. The online-shell startup-order bug was repaired without changing the original gameplay scripts or images. Once Pages is enabled, the workflow deploys the verified `dist/` site. The workflow keeps the empty-site and image-integrity guards. Existing websites are never replaced with this first-upload package on subsequent runs.

Original baseline: `EVOLVE_V575_FLOOR_VISIBILITY_TEST.html`, 409,975,333 bytes, SHA-256 `d5ea39a2fc07eab4507d7782ccfbd339ab7c6285f0c874fd061716bde2ab63ea`.

All 977 unique original images are preserved byte for byte. Existing combat, maps, bosses, stages and save keys are retained. Hashed asset URLs reuse cached content; updates require an explicit action at home. A prior local HTML file and the new website use different browser storage, so transfer an old save once through the game's existing export/import settings.

Automated browser checks do not replace physical phone play tests. Deployment is complete only after `Deploy GitHub Pages` succeeds and the returned URL is checked.
