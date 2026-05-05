CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recent_workspaces (
  path TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  last_opened_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS recent_workspaces_last_opened_idx
  ON recent_workspaces (last_opened_at DESC);
