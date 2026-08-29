
**The Inspiration**:
Our platform YAAD aims to address the lack of personalised, accomodating, and diversified care platforms for the elderly by being a homely, welcoming
care package of activities and tasks that not only enrich their weakening minds but also remind them of the things they cherished the most. It is 
multilingual, accessible, and easy on the eyes, so that no user will be put off by complicated menus or facility-like feel that other mainstream apps do.

### Structure

- **`<style>`** — all styling, using CSS custom properties (`:root` variables) for the color palette so the warm/accessible theme can be re-tuned in one place.
- **`<body>`** — a phone-frame shell (`#phone`) containing a stack of `<section class="view" id="view-*">` elements, one per screen (role select, elder home, play list, each game, my day, family, progress, help, and the caregiver-side screens: profile, activity builder, memory capsule, progress & alerts, care connect).
- **`<script>`** — all app logic (navigation, game state, i18n), inline at the bottom.

### Navigation (view router)

There's no real router — `goto(id)` just toggles a `.active` class between the `.view` sections:

```js
function goto(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  ...
}
```

CSS shows/hides views based on that class. Each screen is reached via `onclick="goto('elder-play')"` etc. directly in the markup — a simple, dependency-free SPA pattern suited to a prototype.

### Two user tracks

The app branches early into two experiences sharing one codebase:
- **Elder-facing** screens (home, play, games, day, family, progress, help) — larger text, simple choices, minimal navigation depth.
- **Caregiver-facing** screens (profile, activity builder, memory capsule, progress/alerts, care connect) — form-based, denser, for the family member managing the elder's experience.

### Games / activities

Each game (Cricket Memories, Memory Match, Name That Tune, Everyday Decisions) is its own view with internal "step" divs (`#game-step-1`, `#tune-step-2`, etc.) shown/hidden via inline `style.display`, driven by small dedicated functions (`showStep()`, `pickChoice()`, `pickTune()`, `pickDecision()`, `startMatch()`/`flipMatchCard()`). State for in-progress games (e.g. `matchState` for Memory Match) is held in plain JS variables scoped to the script, not any framework store.

### Internationalization (i18n)

Language support is a small custom system, not a library:

- `TRANSLATIONS` — a single nested object keyed by view/field (`role.tagline`, `game.q1`, `capsulePrompts.photo.questions`, etc.), each with `en` / `hi` / `pa` / `bn` / `mr` values.
- Static text is marked in the markup with `data-i18n="key"` (and `data-i18n-value="key"` for input values); `applyI18n()` walks the DOM on load and on language change, looking up each key via `trGet()`/`tr()`/`trf()` (the latter handles `{n}`-style template substitution, e.g. move counts, question counts).
- Dynamic/JS-generated strings (mic status, quiz results, generated capsule questions) call `tr()`/`trf()` directly at creation time rather than relying on the DOM-scan pass, so newly created content is correctly localized too.
- `cycleLang()` advances through `LANGS`, toggles a `body.lang-*` class (used by a couple of legacy CSS rules), swaps the toggle button's label, and re-runs `applyI18n()`.
- Weekday/month names are localized via separate `WEEKDAYS`/`MONTHS` lookup tables (`updateTodayDate()`), while the numeric day and the "YAAD" wordmark are deliberately left untranslated.
- `applyI18n()` is invoked once at the very bottom of the script, after all state (like `matchState`) is declared, to avoid temporal-dead-zone issues with `let`/`const`.

### Accessibility features

A per-view "A+" button (`cycleFont()`) cycles a global font-scale class for readability, aimed at the elderly primary user base.

### Known limitations:
 -No persistence — state resets on reload (no localStorage/backend).
 -No real speech-to-text — the mic interactions are simulated with `setTimeout`.
-Translations were machine-generated across 4 languages and haven't had a native-speaker review pass yet.

 Live demo: [(http://yaad-playrememberconnect.netlify.app/)] 
 
  Video Demo: [<img width="870" height="1476" alt="ezgif-1d557fda57636a9f" src="https://github.com/user-attachments/assets/7bbd4512-5969-469c-96ee-3d3faf358587" />
]
