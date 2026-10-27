# EVOLVE M03 private development server

Status: **development prototype only**. Not deployed, no real payment gateway, no verified free rewards or paid grants. Public EVOLVE Pages remains unchanged.

Node 20+ with `pg` dependency. The process refuses to start unless `NODE_ENV=development`, `ENABLE_M03_DEV_SERVER=1`, and all environment values `M03_DATABASE_URL`, `M03_OIDC_ISSUER`, `M03_OIDC_AUDIENCE`, `M03_OIDC_PUBLIC_KEY_PEM` are present.

The server listens only to `127.0.0.1:8787` and does not implement live checkout. **Never publish this prototype as a public production service.** Identity provider choice and token keys are not configured in this repository.

For a disposable PostgreSQL database, a developer must review then apply `docs/monetization/M03_020_LEDGER_SCHEMA.sql` followed by `m03-server/migrations/002_idempotent_results.sql`. This sequence passed a disposable PostgreSQL 17.11 test on GitHub Actions run 40505953388. Never apply to production without a complete migration review.

`m03-server/tests/*.test.cjs` uses Node native test runner and an in-memory SQL fake; these tests are not PostgreSQL integration tests. The GitHub Actions disposable PostgreSQL environment verified migrations, concurrent debits, rollback and backup/restore; operational disaster recovery and deadlock load tests remain pending.

Current limitations: 40% API is local-only, catalog reports disabled, all payment/reward mutation routes reject transactions. 50% spending function is internal-only and no real credit mechanism exists. 60% refund requests only create a pending manual review case, never revoke rights. Full customer authentication/session policy, JWT key rotation, database permission tests and source-specific refunds remain 80–100% work.
