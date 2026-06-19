# Settings Launch Bug — Codex Handoff

## Symptom
- First launch: Settings tab/screen does not appear
- After switching between Learn/Reference/Progress tabs: Settings becomes visible
- Implication: `showScreen('screen-settings')` or equivalent is not firing on initial boot, or the CSS active state is not being applied until a later tab switch triggers it

## Context
- Repo: `C:\Users\Dad\Documents\GitHub\Project-G-code-tutorial-`
- App is a vanilla JS SPA toggling screens via `showScreen(id)` which adds/removes `active` class
- State key: `State.setupComplete` controls whether setup/settings should show
- Bottom nav likely triggers `showScreen()` on click

## Investigation Steps
1. Open `js/app.js` and find:
   - `showScreen(id)` implementation
   - The boot/routing logic in `DOMContentLoaded` or equivalent init
   - Any `setupComplete` check that might skip Settings on first render
2. Check `index.html` for:
   - The Settings screen element (`id="screen-settings"` or similar)
   - Whether it has `active` by default or expects JS to add it
3. Check `css/style.css` for:
   - `.screen` and `.screen.active` display rules
   - Any condition that hides Settings until a flag is set

## Likely Fix Pattern
If the issue is “first render misses the active toggle,” the fix is usually:
- Calling `showScreen('screen-settings')` *after* `State.load()` during boot
- Or ensuring the nav render loop runs on initial load, not just on click

Do NOT rewrite routing. Add the missing boot call or fix the DOMContentLoaded order.

## Deliverables
- 2–3 sentence explanation of root cause
- Exact code change (file + function + lines)
- Brief rationale why the tab-switch workaround masked it

## Boundaries
- Do NOT change unrelated screens
- Do NOT modify State schema
- Do NOT add new dependencies
