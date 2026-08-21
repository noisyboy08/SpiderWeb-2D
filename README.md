<div align="center">

# 🕸️ SPIDERWEB 🕸️
### *A 2D Web-Swinging Action-Platformer*

[![Version](https://img.shields.io/badge/Version-1.0-blue.svg?style=for-the-badge)](https://github.com/noisyboy08/SpiderWeb-2D)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=for-the-badge)](https://github.com/noisyboy08/SpiderWeb-2D)
[![Status](https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge)](https://github.com/noisyboy08/SpiderWeb-2D)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Browser-orange.svg?style=for-the-badge)](#)

> *"Sightings increase across the skyline — some are calling him 'Spiderweb.'"*

**[▶ Play Now on Vercel](#)** &nbsp;|&nbsp; **[🐛 Report a Bug](https://github.com/noisyboy08/SpiderWeb-2D/issues)** &nbsp;|&nbsp; **[⭐ Star this Repo](https://github.com/noisyboy08/SpiderWeb-2D)**

</div>

---

## 📖 Table of Contents

1. [About the Project](#-about-the-project)
2. [Features](#-features)
3. [How to Play](#-how-to-play)
4. [Controls](#-controls)
5. [Game World — All 12 Levels](#-game-world--all-12-levels)
6. [Boss Encounters](#-boss-encounters)
7. [Secret Cheat Codes](#-secret-cheat-codes--full-level-list)
8. [Characters](#-characters)
9. [Settings & Accessibility](#️-settings--accessibility)
10. [Deployment](#️-deployment)
11. [Project Structure](#-project-structure)
12. [Local Development](#-local-development)

---

## 🕷️ About the Project

**Spiderweb** is a fully playable, browser-based 2D action-platformer built on a custom **Canvas + JavaScript** engine. You play as **Jax Steele**, a masked vigilante equipped with web-shooters, as he fights his way through 12 escalating missions across a neon-lit city skyline.

The game features a custom **closed-form pendulum physics engine** that delivers realistic, stable web-swinging at any frame rate — solving the classic "web physics fall apart" problem found in most fan-made Spider-Man games.

> **Tech Stack:** HTML5 Canvas · Vanilla JS · Web Audio API · CSS3 Animations · localStorage save system

---

## 🚀 Features

| Feature | Details |
|---|---|
| 🕸️ **Web Swinging Physics** | Stable closed-form pendulum formulas. Smooth at any frame rate. |
| ⚔️ **Dynamic Combat** | Dodges, web-strikes, web projectiles, counter-attacks |
| 👾 **Enemy Variety** | Drones, Mercs, Elite Mercs, Snipers — each with unique AI |
| 🦹 **3 Epic Bosses** | The Enforcer, Thread, Stinger — all with multi-phase AI |
| 🗺️ **12 Missions** | 9 open-world levels + 3 dedicated boss arenas |
| 🔑 **Cheat Code System** | Level-skip & unlock-all codes built in (see below) |
| 🎮 **Mission Tracker** | Full level-select map with progress, best times, and lore |
| 🎵 **Original Music** | 4 iconic Spider-Man theme tracks (looped) + SFX |
| 💾 **Auto Save** | localStorage-based save system with unlocked level tracking |
| 📱 **Mobile-Aware** | Portrait-lock guard + fullscreen toggle |
| ♿ **Accessibility** | Reduce Flash + Reduce Screen Shake toggles in Settings |
| 🕹️ **2 Characters** | Unlock Spidergirl after completing all 12 missions |

---

## 🎮 How to Play

1. **Launch the game** — a photosensitivity notice will appear first. Read and continue.
2. **Title Screen** — press **▶ START GAME** to open the Mission Tracker.
3. **Mission Tracker** — click any unlocked level node to preview it, then press **🚀 DEPLOY** to launch.
4. **In-Level** — swing, run, jump, shoot webs and defeat enemies to reach the end of the level.
5. **Boss Levels** (6, 10, 12) — defeat the boss to complete the level and unlock the next one.
6. **Complete all 12** — unlock **Spidergirl** as a playable character!
7. **Stuck?** — use the Cheat Code system (see below) to skip any level.

---

## 🕹️ Controls

### Keyboard

| Action | Primary Key | Alternate Key |
|---|---|---|
| **Move Right** | `D` | `→` Arrow |
| **Move Left** | `A` | `←` Arrow |
| **Jump** | `Space` | `↑` Arrow |
| **Shoot Web / Swing** | `Shift` | Mouse Left Click |
| **Web Strike (Attack)** | `E` | |
| **Slide** | `S` + `→` / `←` | |
| **Pause / Menu** | `Esc` | |
| **Fullscreen** | `F` | ⛶ Button (HUD) |
| **Mission Tracker** | `Tab` | `M` |

---

## 🗺️ Game World — All 12 Levels

The game is structured across **12 missions** of escalating difficulty, set across the city skyline.  
Boss levels (6, 10, 12) take place in dedicated arenas.

---

### ⬜ Level 1 — No Warm-Up
> *"The city doesn't ease you in. Neither does Jax."*

| Property | Value |
|---|---|
| **World Length** | 4,000 units |
| **Checkpoints** | 1,400 · 2,800 |
| **Enemy Types** | Drones (×2) |
| **Hazards** | None |
| **Difficulty** | ⭐☆☆☆☆ |

The introductory level. Wide building gaps, forgiving layout, two patrolling drones. Perfect for learning the swing mechanics.

---

### 🌬️ Level 2 — Wind Corridor
> *"The wind doesn't care about your plan."*

| Property | Value |
|---|---|
| **World Length** | 4,500 units |
| **Checkpoints** | 1,500 · 3,000 |
| **Enemy Types** | Drones (×4) |
| **Hazards** | 💨 Wind — pushes Jax off course mid-swing |
| **Difficulty** | ⭐⭐☆☆☆ |

First hazard level. Wind gusts disrupt web-swinging trajectory. Plan your anchor points.

---

### 🏙️ Level 3 — Turf War
> *"Three factions. One rooftop. Zero negotiation."*

| Property | Value |
|---|---|
| **World Length** | 5,000 units |
| **Checkpoints** | 1,600 · 3,200 |
| **Enemy Types** | Mercs (×4) · Drone (×1) |
| **Hazards** | 🧱 Crumbling Roofs — platforms collapse under weight |
| **Difficulty** | ⭐⭐⭐☆☆ |

First level with melee enemies (Mercs). Crumbling roof sections punish slow play.

---

### 🎯 Level 4 — Crossfire
> *"They're waiting above and below. Pick your angle."*

| Property | Value |
|---|---|
| **World Length** | 5,200 units |
| **Checkpoints** | 1,700 · 3,400 |
| **Enemy Types** | Snipers (×2) · Merc (×1) · Drone (×1) |
| **Hazards** | 🔥 Fire Zones — ground-level flame damage areas |
| **Difficulty** | ⭐⭐⭐☆☆ |

Snipers force air-based traversal. Fire zones punish low swings. Stay mobile.

---

### 🏗️ Level 5 — Construction Chaos
> *"Half-built, half-wired, and fully on fire."*

| Property | Value |
|---|---|
| **World Length** | 5,500 units |
| **Checkpoints** | 1,800 · 3,600 |
| **Enemy Types** | Elite Mercs (×2) · Merc (×1) · Drone (×1) |
| **Hazards** | 🏗️ Moving Cranes · ⚡ Flashing effects |
| **Difficulty** | ⭐⭐⭐⭐☆ |

Elite Mercs have more health and hit harder. Moving cranes block swing paths. Contains flashing effects — enable **Reduce Flash** in Settings if needed.

---

### 💀 Level 6 — The Enforcer *(Mini-Boss)*
> *"He was the city's fist. Now he's yours to break."*

| Property | Value |
|---|---|
| **World Length** | 2,500 units (Arena) |
| **Checkpoints** | 800 |
| **Boss** | 🦴 **The Enforcer** — HP: 60 |
| **Boss Attacks** | Charge Slam · Ground Pound |
| **Difficulty** | ⭐⭐⭐⭐☆ |

**First boss arena.** The Enforcer charges across the arena and slams the ground. Watch for the red telegraph indicator above his head — dodge the moment it flashes red, then counter-attack.

---

### 🌙 Level 7 — Night Ops
> *"Darkness is a weapon. Learn to use it before they do."*

| Property | Value |
|---|---|
| **World Length** | 5,800 units |
| **Checkpoints** | 1,900 · 3,800 |
| **Enemy Types** | Elite Mercs (×2) · Drone (×1) · Sniper (×1) |
| **Hazards** | 🔦 Searchlights — getting spotted alerts nearby enemies · ⚡ Flashing effects |
| **Difficulty** | ⭐⭐⭐⭐☆ |

The darkest level. Searchlights sweep the rooftops — avoid their beams or defeat the operator. Contains flashing effects.

---

### 📡 Level 8 — Static in the Signal
> *"Someone's jamming the network. Someone has to stop it."*

| Property | Value |
|---|---|
| **World Length** | 6,000 units |
| **Checkpoints** | 2,000 · 4,000 |
| **Enemy Types** | Elite Mercs (×2) · Sniper (×1) · Drone (×1) |
| **Hazards** | 📺 Flickering Billboards — visual distraction hazards |
| **Difficulty** | ⭐⭐⭐⭐☆ |

The longest open-world level so far. Flickering billboards disrupt your vision. Snipers and Elite Mercs work in coordinated pairs.

---

### 🔥 Level 9 — Rooftop Siege
> *"Every rooftop. Every guard. It ends here."*

| Property | Value |
|---|---|
| **World Length** | 6,200 units |
| **Checkpoints** | 2,000 · 4,200 |
| **Enemy Types** | Mercs (×1) · Elite Mercs (×2) · Sniper (×1) · Drone (×1) |
| **Hazards** | 🧱 Crumbling Roofs · 🔥 Fire Zones · 🏗️ Moving Cranes |
| **Difficulty** | ⭐⭐⭐⭐⭐ |

The hardest open-world level. All three environment hazard types stack simultaneously. Enemy density is at its peak.

---

### 🕸️ Level 10 — Thread *(Mini-Boss)*
> *"She hunts in silence. She strikes in webs."*

| Property | Value |
|---|---|
| **World Length** | 2,500 units (Arena) |
| **Checkpoints** | 800 |
| **Boss** | 🕷️ **Thread** — HP: 70 |
| **Boss Attacks** | Web Snare (fast) · Aerial Dive |
| **Difficulty** | ⭐⭐⭐⭐⭐ |

**Second boss arena.** Thread moves fast and uses your own weapon against you. Web Snare has a very short telegraph (300ms) — you must react immediately. Aerial Dive telegraphs at 400ms and covers a wide area. Stay airborne and counter between her cooldowns.

---

### ⛈️ Level 11 — The Approach
> *"The storm is the least of your problems."*

| Property | Value |
|---|---|
| **World Length** | 6,500 units |
| **Checkpoints** | 2,100 · 4,400 |
| **Enemy Types** | Elite Mercs (×2) · Snipers (×1) · Drones (×2) |
| **Hazards** | 💨 Wind · ⚡ Lightning Strikes · Flashing effects |
| **Difficulty** | ⭐⭐⭐⭐⭐ |

The penultimate level. Wind + Lightning forces constant movement. This is your last practice run before the final boss. Contains heavy flashing effects.

---

### 🏆 Level 12 — Stinger Showdown *(Final Boss)*
> *"Two phases. No mercy. No escape."*

| Property | Value |
|---|---|
| **World Length** | 3,000 units (Final Arena) |
| **Checkpoints** | 1,000 |
| **Boss** | 🦂 **Stinger** — HP: 100 · **2 Phases** |
| **Phase 1 Attacks** | Tail Lash (600ms telegraph) · Poison Lunge (400ms) |
| **Phase 2** | Armor Phase activates at 50 HP — **invulnerable for 3 seconds** |
| **Difficulty** | ⭐⭐⭐⭐⭐ |

**The final confrontation.** At 50 HP, Stinger triggers an **Armor Phase** (glows white, fully invulnerable for 3s). Stop attacking and dodge during this phase. After it ends, he speeds up and uses all attacks more aggressively. Defeat him to complete the game and unlock **Spidergirl**.

---

## 👹 Boss Encounters

| # | Boss | Level | HP | Key Mechanic |
|---|---|---|---|---|
| 1 | 💪 **The Enforcer** | 6 | 60 | Charge Slam + Ground Pound. Dodge on red flash, then counter. |
| 2 | 🕸️ **Thread** | 10 | 70 | Ultra-fast Web Snare (300ms). Stay airborne between strikes. |
| 3 | 🦂 **Stinger** | 12 | 100 | 2-Phase. Stop ALL attacks during Armor Phase (white glow). |

> **Pro Tip:** All bosses display a red indicator above their head before attacking. This is your telegraph window — dodge as soon as it appears!

---

## 🔑 Secret Cheat Codes — Full Level List

Access the cheat code screen via:
- **🔑 CHEAT CODE** button in the **Mission Tracker** (top-right), OR
- **🔑 CHEAT CODE** button on the **Game Over** screen

Type the code in the input field and press **ACTIVATE CHEAT ▶** (or hit `Enter`).

---

### 🌟 Master Codes (Unlock Everything)

These three codes are identical in effect — they unlock **all 12 levels**, mark every level as completed, and unlock **Spidergirl**:

| Code | Effect |
|---|---|
| `UNLOCKALL` | ✨ Unlocks all 12 levels + Spidergirl instantly |
| `GODMODE` | ✨ Same as UNLOCKALL — full game access |
| `CHEATPASS` | ✨ Same as UNLOCKALL — full game access |

---

### 🗺️ Level-Specific Skip Codes

Each level has **3 unique codes** — any of them will skip directly to that level and unlock it in your save.

| Level | Name | Code 1 | Code 2 | Code 3 |
|---|---|---|---|---|
| **1** | No Warm-Up | `SPIDER1` | `WARMUP` | `LEVEL1` |
| **2** | Wind Corridor | `WIND2` | `CORRIDOR` | `LEVEL2` |
| **3** | Turf War | `TURF3` | `TURF` | `LEVEL3` |
| **4** | Crossfire | `FIRE4` | `CROSSFIRE` | `LEVEL4` |
| **5** | Construction Chaos | `BUILD5` | `CHAOS` | `LEVEL5` |
| **6** | The Enforcer (Boss) | `BOSS6` | `ENFORCER` | `LEVEL6` |
| **7** | Night Ops | `NIGHT7` | `NIGHTOPS` | `LEVEL7` |
| **8** | Static in the Signal | `SIGNAL8` | `SIGNAL` | `LEVEL8` |
| **9** | Rooftop Siege | `ROOF9` | `SIEGE` | `LEVEL9` |
| **10** | Thread (Boss) | `THREAD10` | `THREAD` | `LEVEL10` |
| **11** | The Approach | `STORM11` | `APPROACH` | `LEVEL11` |
| **12** | Stinger Showdown (Final Boss) | `STINGER12` | `STINGER` | `LEVEL12` |

> **Note:** Codes are **NOT** case-sensitive — `level1`, `LEVEL1`, and `Level1` all work. Level-specific codes **unlock the target level and all levels before it** in your save, so you never lose progress.

---

## 👤 Characters

### 🕷️ Jax Steele — *Spiderweb* (Default)
- **Appearance:** Navy base suit (`#0B192C`) with bright teal accents (`#00F2FE`), masked head, glowing white eyes
- **Unlock:** Available from the start
- **Animations:** Standing · Running · Jumping · Shooting · Sliding

### 🌸 Spidergirl (Unlockable)
- **Appearance:** Alternate pink/crimson colour scheme with distinct head silhouette
- **Unlock:** Complete all 12 levels OR use `UNLOCKALL` / `GODMODE` / `CHEATPASS` cheat
- **Toggle:** Switch between characters in the Mission Tracker using the **JAX STEELE / SPIDERGIRL** button (top-left)

---

## ⚙️ Settings & Accessibility

Open Settings from the **Title Screen**, **Mission Tracker**, or **Game Over** screen.

| Setting | Description |
|---|---|
| **Reduce Flash** | Disables strobing effects in Levels 5, 7, 11, and boss encounters |
| **Reduce Screen Shake** | Disables camera shake on impacts and boss attacks |
| **Sound Effects** | Toggle in-game SFX (web shots, hits, alerts) |
| **Music** | Toggle background music (4 iconic tracks) |

All settings are saved automatically via localStorage.

---

## 🏗️ Deployment

### Deploy to Vercel (Recommended)

This is a **zero-configuration static web game**. No build step required.

1. Push this repository to GitHub.
2. Sign into [vercel.com](https://vercel.com) and click **Add New → Project**.
3. Select the **SpiderWeb-2D** repository.
4. Leave ALL build settings as default (Framework: `Other`, Build Command: blank, Output Dir: blank).
5. Click **Deploy** — done! ✅

Vercel auto-serves `index.html` at the root. The game will be globally live instantly.

### Deploy to GitHub Pages

1. Go to your repo **Settings → Pages**.
2. Set Source to `main` branch, folder `/` (root).
3. Click **Save** — live at `https://noisyboy08.github.io/SpiderWeb-2D/`.

---

## 📁 Project Structure

```
SpiderWeb-2D/
├── index.html                      # Root entry point (serves the original game engine)
├── spiderman-game.js               # Core game engine (Canvas, physics, sprites, audio)
├── css/
│   └── spiderman-game.css          # Game styles
│
└── spiderman-2D-game-master/       # Full extended version with overlay UI
    ├── index.html                  # Extended entry point (12 levels, bosses, full UI)
    ├── spiderman-game.js           # Extended game engine
    ├── images/                     # All sprite & background assets
    ├── audio/                      # Background music & SFX
    ├── fonts/                      # Pixel & Adventure fonts
    └── src/
        ├── main.js                 # Master engine entry point
        ├── engine/
        │   └── physics.js          # Pendulum physics & math engine
        ├── entities/
        │   └── bosses.js           # Boss AI state machines
        ├── world/levels/
        │   └── levelData.js        # All 12 level definitions
        ├── audio/
        │   └── audioManager.js     # Web Audio API synthesizer
        ├── save/
        │   └── saveManager.js      # localStorage save system
        └── ui/
            ├── hud.js              # In-level HUD overlay
            └── missionTracker.js   # Mission Tracker screen
```

---

## 💻 Local Development

No build tools or npm required. Just a live server:

```bash
# Option 1 — Python (comes pre-installed on most systems)
python3 -m http.server 8000

# Option 2 — Node.js http-server
npx http-server

# Option 3 — VS Code
# Install the "Live Server" extension, right-click index.html → "Open with Live Server"
```

Then visit **`http://localhost:8000`** in your browser.

> ⚠️ The game **must** be served over HTTP — opening `index.html` directly as a file (`file://`) will block audio autoplay and font loading.

---

## 🐛 Known Issues & Tips

- **No audio on first click?** — Browsers require a user interaction before playing audio. Click anywhere to start music.
- **Portrait mode on mobile?** — The game shows a "rotate your device" screen on portrait orientation. Switch to landscape.
- **Flashing effects too intense?** — Enable **Reduce Flash** in ⚙️ Settings before starting.
- **Progress lost?** — Save data is in localStorage. Clearing browser data will reset progress. Use `UNLOCKALL` to restore.

---

<div align="center">

---

Made with 🕸️ by the **Spiderweb Team**  
*noisyboy08 · 2026*

[![GitHub](https://img.shields.io/badge/GitHub-noisyboy08-black?style=for-the-badge&logo=github)](https://github.com/noisyboy08/SpiderWeb-2D)

</div>
