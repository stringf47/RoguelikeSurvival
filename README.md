# Butterball's Last Stand

A browser-based roguelike survivor built from scratch with vanilla JS, Node.js, and PostgreSQL. Survive 10 minutes of enemy waves, pick up upgrades between rounds, and compete on a leaderboard.

**[Play Now](https://roguelikesurvival-production.up.railway.app/login)**

---

## Features

### Gameplay
- Canvas game loop with camera shake and particle effects
- 10+ weapon types (projectile, AoE, orbital, chain) each with 10-level upgrade trees
- 8 enemy types across 5 wave tiers with distinct behaviours: charging rams, teleporting scarecrows, poison-trail snails, zigzagging foxes
- Boss encounters (Strengthening Seal, Crimson Cross) that apply run-wide debuffs
- 60+ passive upgrades to choose between waves, many with synergies
- Difficulty scales continuously: enemy stats ramp with time, damage multiplier increases every 2.5 minutes past the 5-minute mark
- Each run randomly picks one mob from each class pair, so no two runs play exactly the same

### Backend
- **Auth:** registration, login, guest play, password/username changes; bcrypt hashed
- **Sessions:** server-side persistence via `express-session`
- **Score tracking:** time survived, kills, level, damage, XP, and DPS per run
- **Leaderboard:** ranked by wins, then time, then kills; personal stats page included
- **Admin panel:** user management (promote, reset password, delete), score moderation

### Technical
- Generative soundtrack via Tone.js: arpeggios, bass, drums, and contextual drones that react to gameplay
- PostgreSQL with indexed queries for leaderboard lookups
- Express REST API with input validation and role-based access on admin routes

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
npm install
cp .env.example .env
# fill in your PostgreSQL credentials
npm start
```

Visit `http://localhost:4000`

---

## Project Structure

```
├── server.js          # Express entry point
├── db.js              # PostgreSQL connection and schema
├── routes/
│   ├── auth.js        # Register, login, session management
│   ├── scores.js      # Score submission and leaderboard
│   └── admin.js       # Admin moderation
├── views/             # HTML pages (game, leaderboard, stats, admin)
└── public/js/
    ├── main.js        # Game loop, state machine, wave logic
    ├── config.js      # Weapon and enemy definitions
    ├── combat.js      # Damage, projectiles, kill handling
    ├── render.js      # Canvas rendering, particles, UI
    ├── spawn.js       # Enemy spawning and wave weighting
    ├── xp.js          # Level-up and passive upgrade system
    └── audio.js       # Tone.js music and SFX
```
