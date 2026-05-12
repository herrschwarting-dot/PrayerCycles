# CLAUDE.md — PrayerCycles Project Brief

> **Read this file at the start of every session.** It defines the vision, stack, conventions, and hard rules for this project. When in doubt, this document wins over general best practices.

---

## 1. Vision

PrayerCycles helps believers remember to pray for the people in their lives. The app rotates prayers through user-defined lists according to user-defined cycles, so no one gets forgotten. The app is a quiet, faithful companion — solemn, not gamified, not corporate, not cute.

**Tagline:** *Godly discipline.*

**Guiding principles:**
- **Reverent, not gamified.** No streaks, no points, no badges, no guilt-tripping notifications ("you missed 3 days!"). Gentle, neutral language only.
- **Free, forever.** No paywalls, no premium tiers, no donations prompts inside the app.
- **Private by default.** Data lives on the user's device. The app never phones home.
- **Zero commitment.** No accounts, no email, no sign-up. The user opens the app and starts praying.

---

## 2. Architecture

**Local-first Progressive Web App (PWA).**

- All data stored in the user's browser via IndexedDB (Dexie.js wrapper).
- No backend, no server, no database hosted anywhere.
- Backup = user exports a `.json` file they save to USB / cloud drive / wherever.
- Restore = user imports that file.
- Installable to desktop and mobile home screens.
- Works fully offline after first load.

**Future path:** Same codebase wraps to iOS via Capacitor when desired. Do not introduce architectural decisions that block this path.

---

## 3. Tech Stack (Locked)

| Layer | Tool | Notes |
|---|---|---|
| Framework | React 18 + Vite | |
| Language | TypeScript (strict mode) | |
| Styling | Tailwind CSS | No CSS-in-JS, no styled-components |
| Local DB | Dexie.js | IndexedDB wrapper |
| PWA | `vite-plugin-pwa` | Workbox-powered service worker |
| Routing | React Router | |
| State | React Context + hooks for now | Add Zustand only if Context becomes painful |
| Forms | React Hook Form | |
| Validation | Zod | Shared schemas between forms and DB |
| Icons | Lucide React | |
| Testing | Vitest (unit) + Playwright (e2e) | Both headless, CLI-driven |
| Linting | ESLint + Prettier | |
| Deployment | GitHub Pages via GitHub Actions | |

**Do not swap these without explicit user approval.** If you think something should change, raise it as a question first — don't refactor.

---

## 4. Hard Rules (Non-Negotiable)

1. **No accounts, ever.** No login screens, no email capture, no OAuth.
2. **No external network calls at runtime.** No analytics, no telemetry, no Sentry, no Google Fonts, no CDN-loaded scripts. Everything ships in the bundle.
3. **No tracking.** Not even anonymous. Not even "just to see how many users."
4. **No ads.** Not now, not ever.
5. **No dark patterns.** No "are you sure you want to leave?" guilt prompts.
6. **All user data is local.** The only way data leaves the device is the user explicitly clicking Export.
7. **Exports are plaintext `.prayers` files.** The file is valid JSON with a custom extension. No encryption, no passphrases, no recovery codes. The user opens the app, clicks Export, gets a `.prayers` file they save wherever they want. Importing the file restores their data. Encryption may be added later as an opt-in feature — when that happens, plaintext imports must still work for backward compatibility.
8. **Accessibility matters.** WCAG AA minimum. Keyboard navigable. Screen reader friendly. High contrast supported.

---

## 5. Folder Structure

```
/
├── CLAUDE.md                  # This file
├── README.md                  # Public-facing, for GitHub
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions → GitHub Pages
├── public/
│   ├── icons/                 # PWA icons
│   └── manifest.webmanifest
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/                # Page-level components
│   ├── components/            # Reusable UI components
│   ├── features/              # Domain logic grouped by feature
│   │   ├── prayers/
│   │   ├── people/
│   │   ├── cycles/
│   │   └── backup/
│   ├── db/                    # Dexie schema + migrations
│   ├── lib/                   # Pure utility functions
│   ├── hooks/                 # Custom React hooks
│   └── styles/                # Global Tailwind layer
└── tests/
    ├── unit/
    └── e2e/
```

---

## 6. Conventions

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- **Branches:** `main` is always deployable. Feature branches named `feat/<short-desc>` or `fix/<short-desc>`.
- **PRs:** Open a PR for anything non-trivial. Squash-merge into main. Use `gh` CLI.
- **Types:** Prefer `type` over `interface` unless extending. No `any` without a `// reason:` comment.
- **Components:** Functional only. One component per file. Named exports.
- **Tests:** Every feature module gets unit tests. Critical user flows get Playwright e2e tests.
- **Naming:** Components `PascalCase`, hooks `useCamelCase`, files match the export.

---

## 7. Common Commands

```bash
npm install              # Install dependencies
npm run dev              # Local dev server (http://localhost:5173)
npm run build            # Production build → dist/
npm run preview          # Preview the production build locally
npm run test             # Vitest unit tests (watch mode)
npm run test:run         # Vitest one-shot
npm run test:e2e         # Playwright e2e tests
npm run lint             # ESLint
npm run format           # Prettier write
npm run typecheck        # tsc --noEmit
```

---

## 8. Deployment

- GitHub Pages, deployed via GitHub Actions on push to `main`.
- Workflow file: `.github/workflows/deploy.yml`.
- Vite `base` path is set to the repo name for correct asset loading on Pages.
- No environment variables. There is nothing secret to configure.

---

## 9. Domain Model

The architecture follows an **inheritance model**: Prayer Lists own the rules (the "Cycle"). Prayers belong to one or more lists and inherit their surfacing behavior from those lists. The user thinks at the list level, not at the individual prayer level.

### Prayer List
The container and the rule-holder. Has a **Cycle** that governs all prayers inside it.

> **Vocabulary note:** A Cycle is composed of several precise internal properties (`cadence`, `persistence`, `lifecycle`, `rotationState`). These names exist only at the code/data layer for clarity. The user-facing UI uses only the umbrella word **"Cycle"** and concrete option labels like "Daily / Weekly / Monthly" or "One session / Sustained." Never expose the internal property names in the UI.

- `id`
- `name` (e.g., "Family", "Class of '0X", "Missions")
- `color` (Google Keep-style soft pastel)
- `cycle`:
  - `cadence`: how often a prayer from this list surfaces — `daily` | `weekly` | `monthly` | `custom`
  - `persistence`: how long a surfaced prayer stays before rotating — `one-session` | `sustained` (stays until cadence advances)
  - `lifecycle`: `indefinite` (rotates forever) | `finite` (auto-archives after one full pass through all prayers)
- `status`: `active` | `archived`
- `rotationState`: queue order of prayer IDs, pointer to currently-surfaced prayer(s), last cadence boundary timestamp
- `createdAt`

### Prayer
A Google Keep-style card. Inherits behavior from its parent list(s).

- `id`
- `title` (short identifier — person's name or concise prayer subject, e.g., "Cousin Mike", "Aunt Sue's healing")
- `description` (longer freeform content — specifics, scriptures, context)
- `listIds[]` (can belong to multiple lists; appears separately in each)
- `createdAt`
- `lastPrayedAt` (most recent completion timestamp)
- `prayerTally` (cumulative tally — increments every time the prayer is completed, in any mode)

### PrayerLog
Minimal record for state tracking only. **Never surfaced as counts or stats in the UI** — gamification risk.

- `id`
- `prayerId`
- `listId` (which list's rotation triggered this surfacing)
- `prayedAt`

### Surfacing Rules

- Dashboard shows every prayer currently surfaced by any active list.
- A prayer in multiple lists may surface multiple times (two cards, two contexts) — this is intentional, not a bug.
- For `sustained` persistence: the "prayed today" indicator resets each morning. The card stays until the cadence boundary.
- For `one-session` persistence: completion immediately advances the rotation; the card disappears until the next cadence.
- When a `finite` list finishes a full pass through all prayers, it auto-archives silently. Prayers and the list are preserved, just hidden from the dashboard.
- Archived lists are reachable via a separate "Archived" view. Reactivation is one tap.

### Default Lists Seeded on First Run
None. The user starts with an empty app and builds their own lists. Seeding default categories would impose a structure they may not want.

### App Views

Three primary tabs in the bottom nav, plus a persistent search bar at the top of the screen across all views.

1. **Today's Prayers** (default landing) — Today's surfaced prayers as Google Keep-style cards showing the full prayer content. Tap a card to complete it — the card performs a brief flip animation (~400ms) to a blank backing, then fades out. No iconography, no verbiage on the back of the card — the flip itself is the acknowledgment of completion. Tally increments silently. A "Pray Today's Prayers" button launches Prayer Cycle Mode using the surfaced set. Resets at midnight local time.

2. **Lists** — Google Keep-style cards for every prayer list. **Active lists displayed on top, inactive (archived) lists displayed below in a grayed-out state** — both are clickable, and tapping an inactive list lets the user view its prayers or reactivate it. Each card shows the list title plus a small cycle indicator (e.g., "Weekly · Sustained"). Cards are **expandable**: collapsed shows the first few prayer titles within; expanded shows all prayer titles in the list. Tapping a prayer title opens the prayer detail view for that prayer (view/edit title and description, see tally and parent lists). Each list card has a "Pray List" action that launches Prayer Cycle Mode using that list's full prayer set. Nothing is hidden behind a toggle — the full history of the user's prayer life is always visible.

3. **Calendar** — Historical recollection view. A simple month-grid calendar. Tapping any past date opens a list of the prayers prayed on that day. No heat-mapping, no counts on the grid, no visual differentiation between "praying" and "non-praying" days — the calendar is for remembering, not measuring. Future dates are blank.

**Persistent search bar** (top of screen, across all views) — Searches the entire prayer master index. Results are displayed as **Google Keep-style list cards** showing each matching list and, expanded inside that card, **only the prayer titles within that list that matched the search query** — not the full list contents, and not as separate standalone prayer cards.

Example: searching "Joey" might surface the "Class of '0X" list card with just Joey's prayer title visible inside it (and any other matching names from that list), rather than every classmate or a free-floating Joey card divorced from his context. This keeps results contextual — you see *which list a prayer lives in* alongside the match.

If a search query matches a list **name** (e.g., searching "family"), the list card shows with its first few prayer titles visible (collapsed-state preview), since the match is at the list level.

Active lists always rank above inactive (archived) lists in results.

**Filter chips** under the search bar let the user narrow scope:
- **Lists** — match only list names
- **Prayers** — match only prayer titles
- **Descriptions** — match only prayer descriptions (full-text)

Default (no filter) searches all three. This replaces a separate "All Prayers" view.

**Floating action buttons (Today's Prayers view only):**
- **[+]** bottom-right — adds a new prayer, with multi-select list tagging (Google Keep style).
- **[↶ undo]** bottom-left — visible only when there is something to undo. Restores the most recently completed prayer back to today's set. Can be tapped repeatedly to walk back a chain of accidental completions. **Session-scoped**: closing the app clears the undo history.

### Prayer Detail View

Opens when a prayer is tapped from anywhere (Lists view, search results, Calendar entry).

- The prayer **title** (editable in place)
- The prayer **description** (editable in place — longer freeform content)
- Subtle tally in the bottom-left corner: `47 · since Mar '26`
- The list(s) this prayer belongs to, shown as small chips (tappable to add/remove)
- Edit, delete, and "move to a different list" actions

### Midnight Reset Rules

At local midnight every day:
- Today's surfaced dashboard prayers that weren't completed are removed (strict reset, no carryover)
- The Today's Prayers tab repopulates per the rotation rules of each active list
- Undo history is already cleared by the session-scope rule above; midnight is also a clear point
- The "Today's Prayed" memory becomes the Calendar entry for yesterday

### Prayer Cycle Mode

A timeboxed prayer session. Solemn, focused, no gimmicks. Functions like iPod Shuffle — randomly orders prayers from a selected source and serves them one at a time with a timer.

**Two entry points, same engine:**

1. **From Dashboard** — "Pray Today's Prayers" button. Loads all currently-surfaced dashboard prayers into the session. This is for the user who wants to sit down once a day and pray through everything the app has rotated to them today.

2. **From a List view** — "Pray List" button on any individual list's screen. Loads *that list's* full prayer set into the session, independent of the dashboard. This is for the user who feels prompted to specifically pray through their Church list, or Family list, or any other list, on demand.

The Lists view itself (the catalog of all lists) does not have a "pray" action — you must enter a specific list first. This keeps the action contextual and intentional.

**Session setup:**
- Total time available (5 / 10 / 20 / 30 min / custom)
- Time per prayer (30s / 1min / 2min / 5min / custom)
- App previews: "You'll pray for N people. Last one gets X seconds."
- Alternative: "Fit to time available" — app trims the count to fit cleanly
- Prayers are shuffled into random order each session

**During the session:**
- Full-screen, one prayer at a time
- Prayer content fills the screen — large, readable, calm
- Thin progress ring around the edge as the countdown — no large numbers
- Gentle chime at the boundary, auto-advances
- Tap to extend by 30s if more time is needed
- Tap to skip if focus isn't there

**End conditions:**
- Allotted total time runs out, OR
- All prayers in the source list have been served

**Completion behavior:**
- Every prayer served in a Cycle counts toward its `prayerTally`
- A prayer prayed in Cycle Mode also clears it from today's Dashboard, regardless of which list initiated the session — praying for a person in any context counts as having prayed for them today.

### Tally Display
- Shown subtly on the prayer card (bottom-left corner) and on the prayer's detail/edit view.
- Format: count + start month/year, e.g. `47 · since Mar '26`
- Treated as a quiet record, not a metric. Never expressed as a streak, goal, or comparison. No leaderboards, no "best days." It's a testimony, not a score.

---

## 10. Working With the User

- The user is the product owner and tester. They will not write code.
- The user has a CS background and understands the stack; explain trade-offs honestly, but don't over-explain basics.
- When you finish a task, summarize: what changed, what to test, what's next.
- Ask before introducing new dependencies. Justify with: what problem it solves, why nothing in the stack solves it, bundle size impact.
- When a decision is reversible and small, just decide. When it's structural or affects the hard rules, ask first.

---

## 11. Phase Map

- **Phase 0:** Repo scaffold, deploy pipeline, "Hello, PrayerCycles" live on GitHub Pages.
- **Phase 1:** Data model + Dexie setup, basic CRUD for People and Intentions.
- **Phase 2:** Today view — the daily prayer experience.
- **Phase 3:** Sequencing engine — who surfaces when.
- **Phase 4:** Backup/restore — export to `.prayers` file, import from file. Plaintext only for now.
- **Phase 5:** PWA polish — installable, offline, local notifications.
- **Phase 6 (later):** Capacitor wrap for iOS.

Update this section at the end of each phase with what shipped and any deviations from plan.
