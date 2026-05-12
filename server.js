const express  = require('express');
const session  = require('express-session');
const path     = require('path');
const { initSchema } = require('./db');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth',   require('./routes/auth'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/admin',  require('./routes/admin'));

app.get('/', (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
});

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/leaderboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'views', 'leaderboard.html'));
});

app.get('/stats', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'views', 'stats.html'));
});

app.get('/admin', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!req.session.user.isAdmin) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

initSchema()
  .then(() => app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
