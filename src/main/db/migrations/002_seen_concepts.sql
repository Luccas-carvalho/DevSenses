CREATE TABLE IF NOT EXISTS concepts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT,
  framework TEXT,
  UNIQUE(name, language, framework)
);

CREATE TABLE IF NOT EXISTS user_seen_concepts (
  concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  first_seen_at INTEGER NOT NULL,
  times_seen INTEGER NOT NULL DEFAULT 1,
  marked_learned INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (concept_id)
);
