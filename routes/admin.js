const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.isAdmin)
    return res.status(403).json({ error: 'Forbidden' });
  next();
}

router.use(requireAdmin);

/* ── USERS ── */

router.get('/users', (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.username, u.is_guest, u.is_admin, u.created_at,
           COUNT(s.id) AS run_count
    FROM users u
    LEFT JOIN scores s ON s.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  res.json(rows);
});

router.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.user.id)
    return res.status(400).json({ error: 'Cannot delete your own account' });
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
});

router.post('/users/:id/reset-password', async (req, res) => {
  const id = Number(req.params.id);
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const user = db.prepare('SELECT id, is_guest FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.is_guest) return res.status(400).json({ error: 'Guest accounts have no password' });
  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, id);
  res.json({ ok: true });
});

router.post('/users/:id/promote', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.user.id)
    return res.status(400).json({ error: 'Cannot change your own admin status' });
  const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const newVal = user.is_admin ? 0 : 1;
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(newVal, id);
  res.json({ ok: true, is_admin: newVal });
});

/* ── SCORES ── */

router.get('/scores', (req, res) => {
  const rows = db.prepare(`
    SELECT s.id, s.username, s.time, s.kills, s.level, s.damage, s.dps, s.won, s.created_at,
           u.is_guest, u.is_admin
    FROM scores s
    JOIN users u ON u.id = s.user_id
    ORDER BY s.created_at DESC
    LIMIT 500
  `).all();
  res.json(rows);
});

router.delete('/scores/:id', (req, res) => {
  const id = Number(req.params.id);
  const score = db.prepare('SELECT id FROM scores WHERE id = ?').get(id);
  if (!score) return res.status(404).json({ error: 'Score not found' });
  db.prepare('DELETE FROM scores WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
