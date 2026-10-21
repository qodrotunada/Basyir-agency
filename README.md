# Basyir Agency vNext.1

A runnable React + Vite educational investigation game prototype based on the uploaded integrated specification. The release is intentionally client-side only because the specification excludes a backend, accounts, and server database in this phase.

## Included in this build

- Four data-driven episodes: **Kasus Hilangnya Naskah Kuno**, **Logbook Biru**, **Catatan yang Berubah**, and **Jejak di Kantin**.
- Five evidence items per episode, clickable scene hotspots plus an accessible target list, evidence detail overlays, and a single overlay controller.
- Four-piece Arabic sentence puzzle, guarded game phases, suspect selection, retryable incorrect answers, and a score formula capped at 1,000.
- Three hints per investigation, 25-point penalty per hint, a five-second cooldown, three-second highlight, and unique hint targets.
- Ten-item language checkpoint per episode. Best and latest mastery scores are stored separately. Next episodes unlock only after the prior case is completed and best mastery is at least 70/100.
- Persistent Detective's Dictionary with stable vocabulary IDs, encounter history, retrieval history, and mastery status.
- `sessionStorage` for active episode state, `localStorage` for campaign and vocabulary progress, and JSON export/import with validation, preview, backup-before-replace, and rollback attempt.
- Separate reset actions for the active episode, campaign, dictionary, and full local data.
- Mobile-first layout, Arabic `lang` and `dir` attributes, keyboard-friendly controls, Escape-to-close overlays, live status messages, and reduced-motion support.
- Unit tests for scoring, puzzle progression, unlock rules, and guarded transitions.

## Run locally

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To run the production build and unit tests:

```bash
npm test
npm run build
npm run preview
```

See `DEPLOYMENT.md` for static-host deployment notes. Windows users can start with `run-windows.bat`; macOS/Linux users can use `./run-unix.sh`.

## Important implementation notes

1. **No backend is included.** Data stays in the current browser and device. There is no account or cloud synchronization.
2. **Audio recordings are not bundled.** The app attempts device speech synthesis in Arabic when available. Human recordings must be added and checked before release.
3. **Language content is draft.** The source specification explicitly requires teacher/speaker review of harakat, transliteration, translations, sentence ordering, and assessment content. The new episode 3 and 4 material also requires content review.
4. **Scene art is illustrative.** The scenes are SVG illustrations, not final photographic scene assets. Hotspots are paired with a text target list so gameplay does not depend on visual precision.
5. **Import uses replace mode, not merge.** The current progress is backed up before replacement. Keep a downloaded JSON backup for portable recovery.

## Project structure

```text
src/
  App.jsx
  components/SceneArt.jsx
  data/campaign.js
  engine/game.js
  engine/configValidator.js
  engine/persistence.js
  engine/scoring.js
  engine/vocabulary.js
  services/audioService.js
  styles.css
```
