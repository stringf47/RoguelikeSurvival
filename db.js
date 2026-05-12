const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Convert SQLite ? placeholders to PostgreSQL $1 $2 ...
function pos(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

const db = {
  async get(sql, params = []) {
    const { rows } = await pool.query(pos(sql), params);
    return rows[0] || null;
  },
  async all(sql, params = []) {
    const { rows } = await pool.query(pos(sql), params);
    return rows;
  },
  async run(sql, params = []) {
    const res = await pool.query(pos(sql), params);
    return { lastInsertRowid: res.rows[0]?.id ?? null, changes: res.rowCount };
  },
  async exec(sql) {
    await pool.query(sql);
  }
};

async function initSchema() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      username   TEXT    NOT NULL UNIQUE,
      password   TEXT,
      is_guest   INTEGER NOT NULL DEFAULT 0,
      is_admin   INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT  NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      username   TEXT    NOT NULL,
      time       REAL    NOT NULL,
      kills      INTEGER NOT NULL,
      level      INTEGER NOT NULL,
      damage     INTEGER NOT NULL,
      xp         INTEGER NOT NULL,
      dps        INTEGER NOT NULL,
      won        INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT  NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )
  `);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_scores_time ON scores(time DESC)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id)`);
}

module.exports = { db, initSchema };
