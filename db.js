const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'game.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE,
    password   TEXT,
    is_guest   INTEGER NOT NULL DEFAULT 0,
    is_admin   INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS scores (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username   TEXT    NOT NULL,
    time       REAL    NOT NULL,
    kills      INTEGER NOT NULL,
    level      INTEGER NOT NULL,
    damage     INTEGER NOT NULL,
    xp         INTEGER NOT NULL,
    dps        INTEGER NOT NULL,
    won        INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_scores_time ON scores(time DESC);
  CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
`);

module.exports = db;
