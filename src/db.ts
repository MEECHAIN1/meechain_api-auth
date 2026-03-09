import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'meechain.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    badges TEXT DEFAULT '[]',
    quota_used INTEGER DEFAULT 0,
    quota_limit INTEGER DEFAULT 100,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feature_flags (
    name TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1
  );

  -- Seed default flags
  INSERT OR IGNORE INTO feature_flags (name, enabled) VALUES ('rpc_access_enabled', 1);
  INSERT OR IGNORE INTO feature_flags (name, enabled) VALUES ('badge_awards_enabled', 1);
  INSERT OR IGNORE INTO feature_flags (name, enabled) VALUES ('contributor_list_visible', 1);
  INSERT OR IGNORE INTO feature_flags (name, enabled) VALUES ('market_insights_enabled', 1);
`);

export default db;
