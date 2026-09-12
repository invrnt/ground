CREATE TABLE IF NOT EXISTS foundation_checkpoints (
 id text PRIMARY KEY,
 tool_call_id text NOT NULL UNIQUE,
 status text NOT NULL CHECK (status IN ('pending', 'confirmed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 confirmed_at timestamptz
);
