# Resumable V575 migration

Every fragment is committed immediately on online-v575. The authoritative
inventory is the GitHub branch tree, compared against transfer-manifest.json.
Skip a fragment only when its Git blob SHA matches. On an ambiguous timeout,
read the branch tree before retrying that exact file. Never overwrite a
different blob or start the upload from zero.

The bundle index and transfer manifest are immutable for this release.
Completed fragments remain recoverable even if local execution state is lost.
progress.json is a checkpoint summary; the branch tree is authoritative if the
summary lags behind the last successful commit.

GitHub Actions assembles missing .bin bundles directly from the 512KiB .b64
fragments, verifies every bundle and archive SHA-256, then restores and verifies
all original images and game files. Encoded fragments are never deployed.

If local bytes are lost, restore the retained V575 source, run build_web.py,
asset_bundles.py pack and prepare_fragments.py with these exact versioned tools.
Compare generated hashes with the existing manifests and resume only missing
fragments. Do not regenerate or re-upload completed data.
