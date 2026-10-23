# Implementation verification

Verified October 23, 2026 on the local production build (POS-1.1.0).
See [the scan rejection investigation](SCAN_RELIABILITY_FIX.md) for this release.

| Check | Result |
| --- | --- |
| `npm test` | 49 passed across 6 files |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, no warnings |
| `npm run build` | Passed using Next.js 16.4.3 and Webpack |
| `npm run test:e2e` | 19 passed in 3.6 minutes after dependency patches; 1 WebKit offline check intentionally skipped |
| Responsive routes | All main routes fit 375, 390, 430 and 1280 px widths in Chromium and WebKit |
| Accessibility | No axe WCAG 2 A/AA or 2.1 AA violations on audited home, scan, history and settings pages |
| Camera permission | Denial recovery verified in Chromium and WebKit |
| Real face model | MediaPipe loaded and rejected a no-face scene in Chromium and WebKit |
| Front-facing preference | Camera request asserted `facingMode: { ideal: "user" }` |
| Camera cleanup | Track stop confirmed after cancellation, late permission resolution, and completed capture in both engines |
| Startup recovery | Deadline disposal, abort, unsupported-constraint fallback, insecure context and permission-denial tests pass |
| Full 30-second workflow | Real tracker, readiness, RGB sampling, POS, analysis and persistence passed in Chromium and WebKit with steady and changing synthetic optical fixtures; flat signals rejected without saving a reading |
| Rejection diagnostics | Exact failed checks visible, lighting shown as passed in the flat fixture, camera stopped, no rejected BPM; expanded state passes axe in both engines |
| Storage | Reload persistence, individual-delete cancel/confirm, delete-all, and missing-record recovery passed |
| Trends | Filters and counts passed; demo records excluded; exact readings table available |
| Report export | Print invoked, report title and print layout verified, limited-confidence warning retained on screen and in print |
| PWA | Manifest inspected; production service worker and offline history, cached reports and trends passed in Chromium |
| Onboarding | Three screens complete once and remain dismissed after reload |

The one skipped WebKit case is service-worker offline interception, verified in
Chromium. WebKit’s real MediaPipe integration, full scan pipeline, routes,
persistence, reports, onboarding, permission/cancellation and accessibility pass.

## Design review

The interface skills guided the redesigned navigation, dashboard, typography,
semantic colors, readable states, native controls, visible focus, reduced-motion
behavior and safe-area-aware layouts. Contrast regressions were caught and fixed
before publication. See [the six-domain review](UI_REVIEW.md).

Screenshots of the final desktop and mobile home pages are saved beside this file.
No user scan data is shown in these screenshots.

## Production release

### October 23 deployment result

- **URL**: [vitalscan-nine.vercel.app](https://vitalscan-nine.vercel.app).
- **Target**: production.
- **Status**: READY; staged, checked with authenticated HTTP, then promoted.
- **Commit**: `7768b2a` (includes scan fix `6b91a67`).
- **Framework**: Next.js 16.4.3.
- **Build duration**: 54 seconds; post-build 20 seconds.
- **Deployment**: `dpl_H9L8QubgCtXtvqN4RsehjM2Z626R`.
- **Version check**: live `/scan` returns HTTP 200 and renders POS-1.1.0.
- **Live camera scenarios**: four passed in 2.3 minutes on the public HTTPS URL:
  changing-signal acceptance/persistence and flat-signal rejection/diagnostics in
  both Chromium and WebKit. These use synthetic streams, not physical cameras.

Post-deploy observability:

- Error scan: `vercel logs` scoped to this deployment, error level, last hour
  returned no logs. This does not monitor the client-side optical pipeline.
- Drains: configuration not inspected or changed.
- Monitoring: no new remote camera/measurement telemetry added; diagnostics are
  local and physical-device behavior still requires user verification.

### Existing hosting setup

- Public HTTPS app: [vitalscan-nine.vercel.app](https://vitalscan-nine.vercel.app).
- Private repository: [biswajith16/vitalscan](https://github.com/biswajith16/vitalscan),
  default branch `codex/vitalscan`.
- Vercel project: `biswa-projects1/vitalscan`; Next.js configuration is pinned in
  `vercel.json`. The initial generic-static-site preset caused a 404 and was
  corrected before handoff. Production responds with HTTP 200.
- Browser camera policy permits this origin only; framing and microphone access
  remain blocked. Camera processing uses same-origin model/WASM assets.
- Full 30-second synthetic camera workflow verified on the public HTTPS site in
  Chromium and WebKit at 390 px width. Test overrides retain the WebKit media-device
  wrapper so wrapper garbage collection does not silently restore the native camera.
- The route check accepts HTTP 200 and valid CDN cache-revalidation HTTP 304, while
  rejecting error status codes.
- `npm audit --omit=dev`: zero reported runtime vulnerabilities. The documented
  development-only dependency advisory remains.
- Deployment uses the authenticated CLI. Automatic GitHub deployment was not
  connected because Vercel’s GitHub integration lacks access to the private repo;
  no repository visibility or account-wide permissions were changed to bypass it.

To rerun the live suite:

```bash
PLAYWRIGHT_BASE_URL=https://vitalscan-nine.vercel.app \
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/vitalscan-browsers npm run test:e2e
```

## Not verified

- Physiological accuracy against a reference sensor, or clinical validation.
- Physical iPhone / Android camera performance and actual home-screen installation.
- VoiceOver / TalkBack navigation, hardware camera permission UI and behavior across
  OS-specific power-saving/background restrictions.
- Real face tracking on physical Safari hardware. WebKit automation is not a substitute.
- Exhaustive combinations of skin appearance, obstruction, lighting and movement.

Synthetic optical tests validate software behavior only. They do not validate
health measurements. The README documents the remaining development-only dependency
advisory, research limitations, deployment instructions and Phase 2 recommendations.
