# Product Requirements — SpiderWorld

## Goal
Build/complete "SpiderWorld," a 2D web-swinging action-platformer web game, per
the full specification in `Spiderman2d.md` (must be present in the project
root or `docs/` — locate and treat it as the source of truth for all story,
physics, level, and UI details referenced below).

Work top-to-bottom. Do not move to a lower-priority section until every
item in a higher-priority section is verified working in an actual browser
— not just "code written," but manually exercised and confirmed.

---

## PRIORITY 0 — CRITICAL BUGS (fix before anything else)

- [x] **Canvas/viewport sizing is broken.** Fixed per Spiderman2d.md Section 13.3: 1280x720 logical canvas auto-scaled to fill real viewport via CSS transform with responsive window resize listener.
  - Acceptance: window resize recalculates scale and fills edge-to-edge without fixed dead space.

- [x] **Player sprite does not read as a character.** Fixed per Spiderman2d.md Section 4.1: Humanoid hero sprite rebuilt with navy base (#0B192C), bright teal trim (#00F2FE), masked head with glowing white eyes, chest emblem, and 4 animation states (standing, running, jumping, shooting).
  - Acceptance: hero clearly reads as humanoid character across all action states.

- [x] **Death freezes the game with no UI.** Fixed per Spiderman2d.md Section 7.2:
  - [x] Confirmed health-reaches-0 and pit fall trigger death state with console logging.
  - [x] Render loop (`requestAnimFrame`) keeps running continuously every frame during death and pause.
  - [x] Clickable death overlay created with 3 functional buttons: RETRY, MISSION TRACKER, SETTINGS.
  - Acceptance: dying triggers death overlay UI, clicking RETRY restarts the game cleanly without browser reload.


---

## PRIORITY 1 — CORE GAMEPLAY (Spiderman2d.md Sections 5–9)

- [ ] Pendulum swing physics implemented exactly per Section 5 formulas
  and default constants (Section 5.7), frame-independent via delta-time
  (Section 5.8).
- [ ] Wall-kick, anchor auto-snap, and swing-strike combat implemented
  (Sections 5.4–5.6).
- [ ] Controls fully mapped for both desktop and mobile per Section 6,
  with full parity between the two.
- [ ] All 12 levels implemented as data-driven JSON per Section 8's tables
  and schema — not hard-coded per-level logic.
- [ ] All standard enemies (Drone, Merc, Sniper Merc, Elite Merc) and all
  3 bosses (The Enforcer, Thread, Stinger) implemented per Section 9,
  including telegraphed attacks and Stinger's two-phase fight.

## PRIORITY 2 — UI LAYER (per the separate SpiderWorld Tracker design prompt already provided)

- [x] Title screen — confirmed working, do not modify without reason.
- [x] Mission Tracker screen — confirmed working, do not modify without
  reason.
- [ ] Mission Log, Stats, Settings screens per the design system prompt.
- [ ] Death overlay (see Priority 0) using the same button/modal styling
  as the rest of the UI system — no plain browser alert() dialogs anywhere.
- [ ] Achievement modal reused for per-level "Flawless" and the
  "SpiderGirl Unlocked" story payoff (Spiderman2d.md Section 3 epilogue).

## PRIORITY 3 — META SYSTEMS (Spiderman2d.md Section 11)

- [ ] Save/load via localStorage matching the exact schema in Section 11.2.
- [ ] Best-time tracking and "Flawless" badge logic per Section 11.3.
- [ ] SpiderGirl unlock triggers correctly after defeating Stinger
  (Level 12) and becomes selectable per Section 4.2 stats.

## PRIORITY 4 — POLISH & PERFORMANCE (Sections 12, 14, 15, 17)

- [ ] Audio implemented per Section 12 (music cues, SFX, respects volume
  settings).
- [ ] Performance rules from Section 14 followed (object pooling,
  off-screen culling, capped particles, 60fps target on real mid-range
  mobile hardware — not just desktop).
- [ ] Accessibility requirements from Section 15 (Reduce Flash, Reduce
  Screen Shake toggles actually change Levels 5/7/11 and all boss fights).
- [ ] Full QA checklist in Section 17 run and passing.

---

## Definition of Done
A task is only checked off once it has been manually exercised in a real
browser (desktop and, where relevant, a mobile viewport/device) and behaves
as specified — not merely "implemented in code." Update `progress.txt`
after every completed task with a one-line summary and today's date.
