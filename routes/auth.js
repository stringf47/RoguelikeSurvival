const express = require('express');
const bcrypt  = require('bcrypt');
const { db }  = require('../db');

const router = express.Router();

const GUEST_ADJECTIVES = ['Dark','Shadow','Iron','Grim','Brave','Cursed','Ancient','Fallen','Lost','Silent','Hollow','Ashen'];
const GUEST_NOUNS      = ['Rooster','Hen','Feather','Spur','Flock','Wattle','Comb','Talon','Cockerel','Pullet'];

function guestName() {
  const adj  = GUEST_ADJECTIVES[Math.floor(Math.random() * GUEST_ADJECTIVES.length)];
  const noun = GUEST_NOUNS[Math.floor(Math.random() * GUEST_NOUNS.length)];
  const num  = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${num}`;
}

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username.length < 3 || username.length > 24) return res.status(400).json({ error: 'Username must be 3–24 characters' });
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Letters, numbers and underscores only' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) return res.status(409).json({ error: 'Username already taken' });

  const hash   = await bcrypt.hash(password, 10);
  const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?) RETURNING id', [username, hash]);
  req.session.user = { id: result.lastInsertRowid, username, isAdmin: false };
  res.json({ ok: true, username });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = await db.get('SELECT * FROM users WHERE username = ? AND is_guest = 0', [username]);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid username or password' });

  req.session.user = { id: user.id, username: user.username, isAdmin: !!user.is_admin };
  res.json({ ok: true, username: user.username });
});

router.post('/guest', async (req, res) => {
  let username, attempts = 0;
  do {
    username = guestName();
    attempts++;
  } while (await db.get('SELECT id FROM users WHERE username = ?', [username]) && attempts < 10);

  const result = await db.run('INSERT INTO users (username, is_guest) VALUES (?, 1) RETURNING id', [username]);
  req.session.user = { id: result.lastInsertRowid, username, isGuest: true, isAdmin: false };
  res.json({ ok: true, username });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  res.json({ user: req.session.user });
});

router.post('/change-username', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  if (req.session.user.isGuest) return res.status(403).json({ error: 'Guests cannot change username' });
  const { newUsername } = req.body;
  if (!newUsername) return res.status(400).json({ error: 'New username required' });
  if (newUsername.length < 3 || newUsername.length > 24) return res.status(400).json({ error: 'Username must be 3–24 characters' });
  if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) return res.status(400).json({ error: 'Letters, numbers and underscores only' });
  const existing = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, req.session.user.id]);
  if (existing) return res.status(409).json({ error: 'Username already taken' });
  await db.run('UPDATE users SET username = ? WHERE id = ?', [newUsername, req.session.user.id]);
  await db.run('UPDATE scores SET username = ? WHERE user_id = ?', [newUsername, req.session.user.id]);
  req.session.user.username = newUsername;
  res.json({ ok: true, username: newUsername });
});

router.post('/change-password', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  if (req.session.user.isGuest) return res.status(403).json({ error: 'Guests cannot change password' });
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(401).json({ error: 'Current password incorrect' });
  const hash = await bcrypt.hash(newPassword, 10);
  await db.run('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.user.id]);
  res.json({ ok: true });
});

module.exports = router;
