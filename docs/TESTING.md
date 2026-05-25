# Testing — true-occupancy

End-to-end tests run via [Playwright](https://playwright.dev). The runtime
of the app stays buildless (HTML still opens directly in a browser); the
test harness lives entirely in `devDependencies` and `tests/`.

## How to run

```bash
npm install                       # once
npx playwright install chromium   # once

npm run test:smoke                # ~10–20s, the PR gate
npm test                          # full suite (smoke + flows + visual)
npm run test:ui                   # Playwright UI debugger
npm run test:report               # open the last HTML report
npm run test:update-snapshots     # after an intentional visual change
```

Playwright owns the dev server: it spawns `python3 -m http.server 8765`
on demand and tears it down. You can pre-start the server with
`npm run serve` for faster local iteration; tests will reuse it.

## Layout

```
tests/
├── helpers/app.ts          # seedSignedIn, waitForBoot, openAppRoute, console-error collector
├── smoke/                  # tagged @smoke — every HTML host boots clean
├── flows/                  # navigation through key app routes
└── regression/             # tagged @regression — visual snapshots
```

Tags drive selection:

- `--grep @smoke` runs only smoke specs (the PR gate).
- `--grep @regression` runs only visual snapshots.
- Default `npm test` runs everything.

## CI

[.github/workflows/test.yml](../.github/workflows/test.yml) runs:

- **Pull requests to `main`** → `npm run test:smoke` (fast gate).
- **Pushes to `main`** → `npm test` (full suite including visual regression).
- On failure, the workflow uploads `playwright-report/` and `test-results/`
  as an artifact you can download from the run summary.

The Playwright browser cache is keyed on the Playwright version so PRs
that don't bump it skip the ~200MB chromium download.

## Playwright MCP

[.mcp.json](../.mcp.json) wires the Playwright MCP server into Claude
Code when launched from this folder. This is for *interactive* browser
driving during dev sessions — separate from the CI test runs above.
The existing `Claude_Preview` and `Claude_in_Chrome` MCPs remain
available; Playwright MCP adds headless automation suitable for
repeatable checks.

## Coverage checklist

When you add a screen, flow, or critical interaction, add a row here and
tick it once the matching spec lands. Unchecked rows are the visible
backlog.

### Smoke — must always pass

- [x] `app.html` boots, no console errors → [tests/smoke/pages-boot.spec.ts](../tests/smoke/pages-boot.spec.ts)
- [x] `design-spec.html` boots → same spec
- [x] `states-spec.html` boots → same spec
- [x] `components.html` boots → same spec
- [x] Components gallery renders core sections → [tests/smoke/components-gallery.spec.ts](../tests/smoke/components-gallery.spec.ts)
- [x] Result Clean route renders → [tests/flows/scan-clean.spec.ts](../tests/flows/scan-clean.spec.ts)

### Flows

- [x] Result Clean screen → [tests/flows/scan-clean.spec.ts](../tests/flows/scan-clean.spec.ts)
- [x] Result Medium + Why-expanded → [tests/flows/scan-medium.spec.ts](../tests/flows/scan-medium.spec.ts)
- [x] Result High + listings → [tests/flows/scan-high.spec.ts](../tests/flows/scan-high.spec.ts)
- [x] History list → [tests/flows/history-and-batch.spec.ts](../tests/flows/history-and-batch.spec.ts)
- [x] Batch list → same spec
- [x] Batch detail (`/batch/hb1`) → same spec
- [x] Scheduled list → [tests/flows/schedule.spec.ts](../tests/flows/schedule.spec.ts)
- [x] Schedule detail (`/scheduled/s01`) → same spec
- [ ] Scan Start → Scan Mid full animation
- [ ] Profile screen
- [ ] Auth screen (sign in + sign up toggle)
- [ ] Command palette (⌘K) open / search / navigate
- [ ] Automation cadence modal — see [automation cadence note](../../../.claude/projects/-Users-emani-projects-Halcyon/memory/feedback_automation_cadence_notifications.md)
- [ ] PDF certificate generation (see [docs/pdf-certificate-spec.md](pdf-certificate-spec.md))

### Visual regression — screenshots

5 snapshots total. Keep this list small; only stable, high-signal views.

- [x] `design-spec.html` full canvas → [tests/regression/visual.spec.ts](../tests/regression/visual.spec.ts)
- [x] `components.html` full gallery → same spec
- [x] `app.html` Result Clean → same spec
- [x] `app.html` Result Medium → same spec
- [x] `app.html` Result High → same spec

### Out of scope (deliberate)

- **Unit tests.** State in `src/state/AppState.tsx` is exercised through
  the UI. No Vitest/Jest layer.
- **Cross-browser.** Chromium only. Extend `projects` in
  `playwright.config.ts` to add Firefox / WebKit if the prototype
  starts targeting them.
- **Mobile viewports.** 1440×900 desktop only.
- **Accessibility audits.** `@axe-core/playwright` is a future add-on.

## Adding a new test

1. Pick the folder: smoke / flows / regression.
2. Use the helpers in [tests/helpers/app.ts](../tests/helpers/app.ts):
   `seedSignedIn` bypasses the AuthGate, `openAppRoute` navigates and
   waits for boot, `collectConsoleErrors` captures errors so the test
   fails on noisy logs.
3. Tag with `@smoke` if it must run on every PR.
4. Add or tick the row in the **Coverage checklist** above.

## Snapshots are platform-specific

Playwright names snapshot files with the OS suffix (`*-chromium-darwin.png`
locally, `*-chromium-linux.png` in CI). Snapshots generated on macOS will
**not** match in CI. Two options:

1. **Commit Linux-only snapshots** by running the update inside the CI
   image once and copying the artifacts down (or via `act` locally).
2. **Generate in CI first** — push a PR with no snapshots, let the
   `update-snapshots` job fail, download the artifact, commit those
   files. Subsequent runs match.

Until Linux snapshots exist in the repo, the visual regression job will
fail in CI even though it passes locally. Run smoke-only in PRs until
this is resolved (the workflow already does this).

## Updating visual snapshots

When you make an intentional design change that moves a snapshotted
view:

```bash
npm run test:update-snapshots
git add tests/__snapshots__/
```

Then review the diff in PR — committed snapshots act as the visual
source of truth.
