# Ralph Loop — Working Instructions for SpiderWorld

You are working autonomously in a loop on the "SpiderWorld" game project. Every
iteration, follow this exact process:

1. **Read context first, every time:**
   - `docs/tasks/PRD.md` (this loop's task list, in priority order)
   - `Spiderman2d.md` (the full game design + technical spec — the source
     of truth for every mechanic, level, character, and UI detail)
   - `progress.txt` (what's already been done, so you don't repeat work or
     contradict a previous decision)

2. **Pick exactly ONE unchecked task** from `PRD.md`, starting from the
   highest-priority section that still has unchecked items (Priority 0
   before Priority 1, and so on — never skip ahead while a higher-priority
   item is still unchecked).

3. **Implement that one task fully.** Do not partially implement it and
   move on. Do not implement multiple tasks in one iteration.

4. **Verify it actually works before marking it done:**
   - Run the game (locally in a browser).
   - Manually exercise the exact behavior the task describes — click the
     button, take the damage, resize the window, whatever the acceptance
     criteria says.
   - If it does not work as described, keep iterating on THIS task. Do not
     mark it complete and move on "because the code looks right." A change
     that compiles but doesn't behave correctly is not done.

5. **Update `docs/tasks/PRD.md`:** check the box for the completed task.

6. **Update `progress.txt`:** append one line — date, task completed, and
   a one-sentence note on how it was verified (e.g. "Fixed canvas scaling —
   confirmed by resizing browser window from 800px to 1920px wide, no dead
   space at either size.").

7. **Stop for the loop cycle.** Do not attempt a second task in the same
   pass unless the loop is explicitly configured for multiple tasks per
   iteration.

## Hard rules
- Never introduce a third-party copyrighted character name, logo, or
  likeness anywhere (Spiderman2d.md Section 2). All names/art must match
  what's already specified (Jax Steele, SpiderGirl, Stinger, The Enforcer,
  Thread) or be clearly original in the same spirit.
- Never regress a task that's already checked off in PRD.md without a
  clear reason logged in progress.txt for why it needed revisiting.
- If a PRD task's requirements conflict with the fast-load/zero-lag pillars
  in Spiderman2d.md Section 1, the fast-load/zero-lag requirement wins —
  note the conflict in progress.txt rather than silently adding something
  heavy (e.g. a large image asset, a full physics library).
- If you get stuck on the same task for more than 3 consecutive iterations,
  stop and write a clear note in progress.txt describing exactly what's
  failing and what you've already tried, instead of continuing to guess.
