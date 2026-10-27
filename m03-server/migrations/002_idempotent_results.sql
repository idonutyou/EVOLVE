-- M03 50% development database extension; run AFTER reviewed 020 schema
-- Only on disposable/dev PostgreSQL; never on production.
ALTER TABLE m03_ledger_operations
 ADD COLUMN result_json JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX m03_operations_lookup_idx
 ON m03_ledger_operations(account_id,idempotency_key,created_at);
