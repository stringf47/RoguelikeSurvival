const express = require('express');
const { db }  = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.post('/', requireAuth, async (req, res) => {
  const { time, kills, level, damage, xp, dps, won } = req.body;
  if ([time, kills, level, damage, xp, dps].some(v => v === undefined || v === null))
    return res.status(400).json({ error: 'Missing score fields' });

  const { id, username } = req.session.user;
  const wonInt = won ? 1 : 0;
  const t = Number(time), k = Number(kills);

  const insert = await db.run(
    `INSERT INTO scores (user_id, username, time, kills, level, damage, xp, dps, won)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [id, username, t, k, Number(level), Number(damage), Number(xp), Number(dps), wonInt]
  );
  const scoreId = insert.lastInsertRowid;

  const rankRow = await db.get(
    `SELECT COUNT(*)::int + 1 AS rank FROM scores
     WHERE won > ? OR (won = ? AND time > ?) OR (won = ? AND time = ? AND kills > ?)`,
    [wonInt, wonInt, t, wonInt, t, k]
  );
  const rank = rankRow.rank;

  const totalRow = await db.get('SELECT COUNT(*)::int AS total FROM scores');
  const total = totalRow.total;

  const top10 = await db.all(
    `SELECT id, username, time, kills, level, won FROM scores
     ORDER BY won DESC, time DESC, kills DESC LIMIT 10`
  );

  const inTop10 = top10.some(r => r.id === scoreId);
  if (!inTop10) {
    const mine = await db.get('SELECT id, username, time, kills, level, won FROM scores WHERE id = ?', [scoreId]);
    top10.push(mine);
  }

  res.json({ ok: true, rank, total, top10, scoreId, inTop10 });
});

router.get('/leaderboard', async (req, res) => {
  const winsOnly = req.query.filter === 'wins';
  const where = winsOnly ? 'WHERE won = 1' : '';
  const currentUserId = req.session.user ? req.session.user.id : null;

  const rows = (await db.all(
    `SELECT user_id, username, time, kills, level, damage, dps, won, created_at
     FROM scores ${where}
     ORDER BY won DESC, time DESC, kills DESC LIMIT 100`
  )).map((r, i) => ({
    rank: i + 1,
    username: r.username,
    time: r.time,
    kills: r.kills,
    level: r.level,
    damage: r.damage,
    dps: r.dps,
    won: r.won,
    created_at: r.created_at,
    isYou: currentUserId !== null && r.user_id === currentUserId
  }));

  res.json({ rows, total: rows.length });
});

router.get('/me', requireAuth, async (req, res) => {
  const rows = await db.all(
    `SELECT time, kills, level, damage, xp, dps, won, created_at
     FROM scores WHERE user_id = ?
     ORDER BY created_at DESC LIMIT 50`,
    [req.session.user.id]
  );
  res.json(rows);
});

module.exports = router;
