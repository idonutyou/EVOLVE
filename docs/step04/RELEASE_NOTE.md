# STEP04 publish checkpoint (2026-10-26)

This changes only game hit observation. No damage, collision, knockback, maps, sprites, saves or timed in-game updates changed.

- Baseline: 0e4d79f4e17107235dbafb945c3bab5be2a15048
- New build: fd2f525bbb49278c9ad38afb8b511759fec477a043fdc42d9ca4408df206e5e1
- Safe rollback: reset main to baseline commit only by explicit decision; preserve branch and user data.
- Tests: isolated Node, headless Chromium portrait/landscape fixture, staged asset manifest invariants PASS.
- Limits: no Galaxy S23+ actual gameplay test; local whole-game smoke was blocked by environment policy. Critical events are nullable until callers report actual crit outcome.
