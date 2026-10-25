# EVOLVE WEB-34 home hub

The approved main screen uses the existing stage miniatures, a red battle-start button and five bottom destinations: shop, parts, battle, challenge and codex. Selecting any destination enlarges that button and restores the previous selection to its normal size.

Baseline: `bbc738b6822f2836780b805b742da48e1313f128` (WEB-33 equipment fit).

Release: `8fe3788633acadd08d9d899789c125abb92f80e3`.

Build: `ae76b49f636bfc76fbd66ae02d9eccfcf9aec9b7903e165c409cc221ae744a68`.

The 24 release files were checked against GitHub's tree after upload. Original image bytes, equipment corrections, combat and existing save keys are preserved. Six Python tests, the web client test and eight combat model suites passed locally. GitHub Actions performs all browser regressions before publishing, then verifies the five destinations and real battle start at the public URL.

Recovery preserves the existing 10–70 percent archives. The 80 and 90 percent archives were also downloaded again and checked by size, archive CRC and every contained file's SHA-256. The portable checkpoint tool resolves its workspace from its own location and retains earlier backup receipts.

- Before-change branch: `backup/web34-before-home-hub-20261026`.
- Release backup branch: `backup/web34-090-20261026`.
- 80 percent archive: `libfile_9d7df81e10fc819185d54fd9e84834c7` (1,454,864 bytes).
- 90 percent archive: `libfile_68a69ebf81548191a0e7927db7ebae7f` (1,455,240 bytes).
- Deployment workflow: https://github.com/idonutyou/EVOLVE/actions/runs/40213484054

Physical Galaxy S23+ testing has not been performed in this environment.

Published successfully at https://idonutyou.github.io/EVOLVE/. The public build and all five enlarged navigation states passed with no JavaScript errors or failed requests. The public battle-start flow passed. Viewports checked: 320×568, 393×600, 393×852 and 852×393. Full publication evidence is retained by the successful GitHub Actions run above and the machine-readable reports beside this file.

Final recovery: `libfile_2936779b5a3081919613a654d5df7893`, `EVOLVE_WEB34_CHECKPOINT_100.zip`, 1,467,115 bytes. Downloaded again and verified by archive CRC, SHA-256 and all 27 contained file hashes. Final GitHub branch: `backup/web34-100-20261026`. Earlier checkpoints remain intact.
