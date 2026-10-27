-- EVOLVE M03 / 20%: REVIEW-ONLY PostgreSQL sketch.
-- THIS IS NOT AN APPLIED MIGRATION. Do not run on production databases.
-- Payments/grants remain disabled until authenticated server + M04 provider checks.
-- PostgreSQL-compatible DDL proposal; transaction procedures not implemented yet.

CREATE TABLE m03_accounts (
  account_id UUID PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 0 CHECK (version >= 0)
);

CREATE TABLE m03_auth_identities (
  issuer TEXT NOT NULL,
  subject_hash BYTEA NOT NULL,
  account_id UUID NOT NULL REFERENCES m03_accounts(account_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (issuer, subject_hash)
);
CREATE INDEX m03_auth_identities_account_idx ON m03_auth_identities(account_id);

-- No local DNA here; premium crystal only. The free bucket is server-earned only.
CREATE TABLE m03_wallets (
  account_id UUID NOT NULL REFERENCES m03_accounts(account_id) ON DELETE RESTRICT,
  currency TEXT NOT NULL DEFAULT 'mutation_crystal' CHECK (currency = 'mutation_crystal'),
  origin_bucket TEXT NOT NULL CHECK (origin_bucket IN ('free','paid')),
  available_units BIGINT NOT NULL DEFAULT 0 CHECK (available_units >= 0),
  version BIGINT NOT NULL DEFAULT 0 CHECK (version >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id,currency,origin_bucket)
);

-- API idempotency is account-scoped. A repeated key with a new hash is a conflict.
-- Only server-verified sources may authorize a GRANT; no client balance input.
CREATE TABLE m03_ledger_operations (
  operation_id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES m03_accounts(account_id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('SERVER_REWARD','PROVIDER_GRANT','SPEND','REFUND_ADJUSTMENT','ADMIN_CORRECTION')),
  idempotency_key TEXT NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  request_hash BYTEA NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('server_reward','provider_payment','entitlement_spend','refund_case','admin_review')),
  source_ref TEXT NOT NULL CHECK (length(source_ref) BETWEEN 1 AND 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id,idempotency_key),
  UNIQUE (operation_id,account_id)
);

-- Each signed delta is immutable and must be paired to one server-authorized
-- operation. SUM(delta_units) per bucket must match the wallet snapshot.
CREATE TABLE m03_ledger_entries (
  entry_id UUID PRIMARY KEY,
  operation_id UUID NOT NULL,
  account_id UUID NOT NULL,
  currency TEXT NOT NULL DEFAULT 'mutation_crystal' CHECK (currency = 'mutation_crystal'),
  origin_bucket TEXT NOT NULL CHECK (origin_bucket IN ('free','paid')),
  delta_units BIGINT NOT NULL CHECK (delta_units <> 0),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (operation_id,account_id)
    REFERENCES m03_ledger_operations(operation_id,account_id) ON DELETE RESTRICT,
  FOREIGN KEY (account_id,currency,origin_bucket)
    REFERENCES m03_wallets(account_id,currency,origin_bucket) ON DELETE RESTRICT,
  UNIQUE (operation_id,currency,origin_bucket)
);
CREATE INDEX m03_ledger_entries_account_order_idx
  ON m03_ledger_entries(account_id,occurred_at,entry_id);

-- Provider event uniqueness does NOT mean signature verification has occurred.
-- State remains 'unverified' until M04's trusted provider adapter exists.
CREATE TABLE m03_provider_events (
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  payload_digest BYTEA NOT NULL,
  verification_state TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_state IN ('unverified','verified','rejected')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider,provider_event_id)
);

CREATE TABLE m03_provider_transactions (
  provider TEXT NOT NULL,
  provider_transaction_id TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES m03_accounts(account_id) ON DELETE RESTRICT,
  sku TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'disabled'
    CHECK (state IN ('disabled','sandbox_pending','verified','reversed','manual_review')),
  PRIMARY KEY (provider,provider_transaction_id)
);

-- A player may own the same cosmetic via two independent sources. Never
-- revoke the aggregate right just because one source is refunded.
CREATE TABLE m03_entitlement_sources (
  source_id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES m03_accounts(account_id) ON DELETE RESTRICT,
  entitlement_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('direct_purchase','crystal_spend','season_reward','admin_review')),
  source_ref TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','active','revoked','expired','manual_review')),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id,entitlement_id,source_type,source_ref)
);
CREATE INDEX m03_entitlement_sources_active_idx
  ON m03_entitlement_sources(account_id,entitlement_id,state);

CREATE TABLE m03_refund_review_cases (
  case_id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES m03_accounts(account_id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  provider_ref TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (state IN ('pending_review','approved','rejected','resolved')),
  notes_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider,provider_ref)
);

CREATE TABLE m03_reward_claims (
  claim_id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES m03_accounts(account_id) ON DELETE RESTRICT,
  reward_id TEXT NOT NULL,
  period_id TEXT NOT NULL,
  operation_id UUID REFERENCES m03_ledger_operations(operation_id) ON DELETE RESTRICT,
  UNIQUE (account_id,reward_id,period_id)
);

-- Dedicated DB role permissions must deny untrusted clients all direct writes.
-- Even privileged application code cannot mutate immutable history entries.
CREATE FUNCTION m03_prevent_ledger_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'M03 ledger history is append-only';
END;
$$;
CREATE TRIGGER m03_operations_no_update_delete
  BEFORE UPDATE OR DELETE ON m03_ledger_operations
  FOR EACH ROW EXECUTE FUNCTION m03_prevent_ledger_mutation();
CREATE TRIGGER m03_entries_no_update_delete
  BEFORE UPDATE OR DELETE ON m03_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION m03_prevent_ledger_mutation();

-- The server transaction flow is not implemented by this schema:
-- BEGIN -> authenticated account -> lock both wallet rows in (free,paid)
-- deterministic order -> find idempotency key and compare request_hash
-- -> verify server-side reward/payment/spend policy -> conditional balances
-- -> INSERT immutable operation + entries -> update wallet snapshots
-- -> COMMIT -> answer. Roll back on errors; never credit on client success URL.
-- An aborted transaction must persist NO wallet/ledger/entitlement changes.
