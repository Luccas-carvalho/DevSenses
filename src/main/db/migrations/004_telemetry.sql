CREATE TABLE IF NOT EXISTS telemetry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  payload TEXT,
  created_at INTEGER NOT NULL,
  flushed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_telemetry_event ON telemetry_events(event);
CREATE INDEX IF NOT EXISTS idx_telemetry_flushed ON telemetry_events(flushed, created_at);
