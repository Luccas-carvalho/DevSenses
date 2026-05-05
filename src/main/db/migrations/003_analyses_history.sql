CREATE TABLE IF NOT EXISTS analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_path TEXT NOT NULL,
  project_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  diff_mode TEXT NOT NULL,
  files_count INTEGER NOT NULL,
  additions INTEGER NOT NULL DEFAULT 0,
  deletions INTEGER NOT NULL DEFAULT 0,
  diff TEXT NOT NULL,
  analysis TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  seniority TEXT NOT NULL,
  professor_turbo INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS analyses_project_idx
  ON analyses (project_path, created_at DESC);

CREATE INDEX IF NOT EXISTS analyses_branch_idx
  ON analyses (project_path, branch, created_at DESC);
