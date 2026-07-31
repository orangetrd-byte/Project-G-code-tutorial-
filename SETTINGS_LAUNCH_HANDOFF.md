# Settings Launch Bug — Codex Handoff

## Symptom
- First launch: Settings tab/screen does not appear
- After switching between Learn/Reference/Progress tabs: Settings becomes visible
- Implication: `showScreen('screen-settings')` or equivalent is not firing on initial boot, or the CSS active state is not being applied until a later tab switch triggers it

## Context
- Repo: `C:\Users\Dad\Documents\GitHub\Project-G-code-tutorial-`
- The app is a vanilla JavaScript SPA that toggles screens through `showScreen(id)`, which adds or removes the `active` class.
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
- Call `showScreen('screen-settings')` *after* `State.load()` during boot.
- Alternatively, ensure that the navigation-rendering loop runs during the initial load rather than only after a click.

Do NOT rewrite routing. Add the missing boot call or fix the DOMContentLoaded order.

## Deliverables
- A two- or three-sentence explanation of the root cause
- Exact code change (file + function + lines)
- A brief explanation of why switching tabs masked the problem

## Boundaries
- Do NOT change unrelated screens
- Do NOT modify State schema
- Do NOT add new dependencies
