const express = require('express');
const db = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

router.post('/', requireAuth, (req, res) => {
  const { time, kills, level, damage, xp, dps, won } = req.body;
  if ([time, kills, level, damage, xp, dps].some(v => v === undefined || v === null)) {
    return res.status(400).json({ error: 'Missing score fields' });
  }

  const { id, username } = req.session.user;
  const wonInt = won ? 1 : 0;
  const t = Number(time), k = Number(kills);

  const insert = db.prepare(`
    INSERT INTO scores (user_id, username, time, kills, level, damage, xp, dps, won)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, username, t, k, Number(level), Number(damage), Number(xp), Number(dps), wonInt);

  const scoreId = insert.lastInsertRowid;

  // Rank = number of scores strictly better + 1 (won beats not-won, then time, then kills)
  const { rank } = db.prepare(`
    SELECT COUNT(*) + 1 AS rank FROM scores
    WHERE won > ? OR (won = ? AND time > ?) OR (won = ? AND time = ? AND kills > ?)
  `).get(wonInt, wonInt, t, wonInt, t, k);

  const { total } = db.prepare('SELECT COUNT(*) AS total FROM scores').get();

  const top10 = db.prepare(`
    SELECT id, username, time, kills, level, won
    FROM scores
    ORDER BY won DESC, time DESC, kills DESC
    LIMIT 10
  `).all();

  // If current run didn't make top 10, append it so the client can show it
  const inTop10 = top10.some(r => r.id === scoreId);
  if (!inTop10) {
    top10.push(db.prepare('SELECT id, username, time, kills, level, won FROM scores WHERE id = ?').get(scoreId));
  }

  res.json({ ok: true, rank, total, top10, scoreId, inTop10 });
});

router.get('/leaderboard', (req, res) => {
  const winsOnly = req.query.filter === 'wins';
  const where = winsOnly ? 'WHERE won = 1' : '';
  const currentUserId = req.session.user ? req.session.user.id : null;

  const rows = db.prepare(`
    SELECT user_id, username, time, kills, level, damage, dps, won, created_at
    FROM scores
    ${where}
    ORDER BY won DESC, time DESC, kills DESC
    LIMIT 100
  `).all().map((r, i) => ({
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

router.get('/me', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT time, kills, level, damage, xp, dps, won, created_at
    FROM scores
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.session.user.id);
  res.json(rows);
});

module.exports = router;
