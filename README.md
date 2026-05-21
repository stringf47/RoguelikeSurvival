# Butterball's Last Stand

A browser-based roguelike survivor built from scratch with vanilla JavaScript, Node.js, and PostgreSQL. Survive 10 minutes of escalating enemy waves, level up between rounds, and compete on a global leaderboard.

**[Play Now](https://roguelikesurvival-production.up.railway.app/login)**

---

## Features

### Gameplay
- Canvas-based game loop with fixed timestep, camera shake, and particle effects
- 10+ weapon types (projectile, AoE, orbital, chain) each with 10-level upgrade trees
- 8 enemy types across 5 wave tiers, each with distinct AI behaviours — charging rams, teleporting scarecrows, poison-trail snails, zigzagging foxes
- Boss encounters (Strengthening Seal, Crimson Cross) that apply run-wide debuffs
- 60+ passive upgrades selectable between waves with synergistic interactions
- Continuous difficulty scaling: enemy HP/speed ramps with game time, damage multiplier steps every 2.5 minutes after the 5-minute mark
- Mutually exclusive enemy class system — each run randomly picks one mob from each class pair, keeping runs varied

### Backend
- **Auth** — registration, login, guest play, password and username changes; passwords hashed with bcrypt
- **Sessions** — server-side session persistence via `express-session`
- **Score tracking** — records time survived, kills, level, total damage, XP, and DPS per run
- **Leaderboard** — ranked by wins → time → kills, with personal stats page
- **Admin panel** — user management (promote, reset password, delete), score moderation

### Technical Stuff
- Pure vanilla JS frontend — no frameworks, no build step
- ~3 000 lines of client-side game logic split across focused modules (`combat.js`, `render.js`, `spawn.js`, `audio.js`, `xp.js`)
- Tone.js generative soundtrack: sequenced arpeggios, bass, drums, and contextual drones (chest proximity, XP vacuum, combat intensity)
- PostgreSQL with indexed queries for fast leaderboard lookups
- RESTful Express API with input validation and role-based access control for admin routes

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | PostgreSQL (`pg`) |
| Auth | bcrypt + express-session |
| Frontend | Vanilla JS, HTML5 Canvas |
| Audio | Tone.js |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Start the server
npm start
```

Visit `http://localhost:4000`

---

## Project Structure

```
├── server.js          # Express app entry point
├── db.js              # PostgreSQL connection and schema
├── routes/
│   ├── auth.js        # Register, login, session management
│   ├── scores.js      # Score submission and leaderboard
│   └── admin.js       # Admin user and score moderation
├── views/             # HTML pages (game, leaderboard, stats, admin)
└── public/js/
    ├── main.js        # Game loop, state machine, wave logic
    ├── config.js      # Weapon and enemy definitions
    ├── combat.js      # Damage, projectiles, kill handling
    ├── render.js      # Canvas draw calls, particles, UI
    ├── spawn.js       # Enemy spawning and wave weighting
    ├── xp.js          # Level-up and passive upgrade system
    └── audio.js       # Tone.js music and SFX
```
