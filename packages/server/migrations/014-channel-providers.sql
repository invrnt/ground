-- Every channel row records the provider that created it, so a worker can never hand a
-- pending job to a different provider's adapter. Existing rows predate Slack and are
-- Telegram by definition, which is what the default backfills.
ALTER TABLE channel_bindings ADD COLUMN provider text NOT NULL DEFAULT 'telegram' CHECK (provider IN ('telegram','slack'));
ALTER TABLE channel_bindings DROP CONSTRAINT channel_bindings_pkey;
ALTER TABLE channel_bindings ADD PRIMARY KEY (provider, chat_id);

ALTER TABLE ingestion_inputs ADD COLUMN provider text NOT NULL DEFAULT 'telegram' CHECK (provider IN ('telegram','slack'));
ALTER TABLE ingestion_replies ADD COLUMN provider text NOT NULL DEFAULT 'telegram' CHECK (provider IN ('telegram','slack'));
ALTER TABLE dispatch_replies ADD COLUMN provider text NOT NULL DEFAULT 'telegram' CHECK (provider IN ('telegram','slack'));
ALTER TABLE outbound_requests ADD COLUMN provider text NOT NULL DEFAULT 'telegram' CHECK (provider IN ('telegram','slack'));
ALTER TABLE request_followups ADD COLUMN provider text NOT NULL DEFAULT 'telegram' CHECK (provider IN ('telegram','slack'));

-- A member is reachable on one identity per provider. members.telegram_sender_id stays for
-- the demo provisioning scripts; this table is what authorization reads.
CREATE TABLE member_channel_identities (
  project_id uuid NOT NULL REFERENCES projects,
  member_id uuid NOT NULL REFERENCES members ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('telegram','slack')),
  external_id text NOT NULL,
  PRIMARY KEY (member_id, provider),
  UNIQUE (project_id, provider, external_id)
);
INSERT INTO member_channel_identities (project_id, member_id, provider, external_id)
  SELECT project_id, id, 'telegram', telegram_sender_id FROM members WHERE telegram_sender_id IS NOT NULL;
