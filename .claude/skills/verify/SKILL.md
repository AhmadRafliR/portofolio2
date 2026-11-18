---
name: verify
description: Verify a change to this portfolio before reporting it done — type-check + build, docs codemap check, and the Playwright smoke test when UI or behaviour changed. Use after editing anything in src/, scripts/, index.html or styles.
---

# Verify

Run from the repo root. Report results honestly with the failing output.

1. `npm run docs:check` — if it fails, add/remove the file's line in `docs/agent/codemap.md`.
2. `npm run build` — `tsc --noEmit` (strict, unused locals/params are errors) + `vite build`.
3. If the change affects anything visible or interactive (components, CSS, store, scene, data shown on the page):
   `npm run smoke` (needs the `dist/` from step 2 and a system Chrome/Edge; ~1 min). Expect **18/18**.
   - A failing check names the step. Selectors it relies on are listed in `AGENTS.md` invariant 6.
   - Skip only for docs-only or script-only changes, and say that you skipped it.
4. Content/behaviour docs: if controls, commands or features changed, confirm `docs/fitur.md` matches.

Output to the user: one line per step — `ok` / `failed: <first error line>` / `skipped (<reason>)`.
