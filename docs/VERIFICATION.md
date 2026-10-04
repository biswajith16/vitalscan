# Implementation verification

Verified October 4, 2026 on the local production build.

| Check | Result |
| --- | --- |
| `npm test` | 38 passed across 5 files |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, no warnings |
| `npm run build` | Passed using Next.js 16.3.8 and Webpack |
| `npm run test:e2e` | 15 passed; 1 WebKit offline check intentionally skipped |
| Responsive routes | All main routes fit 375, 390, 430 and 1280 px widths in Chromium and WebKit |
| Accessibility | No axe WCAG 2 A/AA or 2.1 AA violations on audited home, scan, history and settings pages |
| Camera permission | Denial recovery verified in Chromium and WebKit |
| Real face model | MediaPipe loaded and rejected a no-face scene in Chromium and WebKit |
| Front-facing preference | Camera request asserted `facingMode: { ideal: "user" }` |
| Camera cleanup | Track stop confirmed after cancellation, late permission resolution, and completed capture in both engines |
| Startup recovery | Deadline disposal, abort, unsupported-constraint fallback, insecure context and permission-denial tests pass |
| Full 30-second workflow | Real tracker, readiness, RGB sampling, POS, analysis and persistence passed in Chromium and WebKit with a synthetic 72 BPM optical fixture |
| Storage | Reload persistence, individual-delete cancel/confirm, delete-all, and missing-record recovery passed |
| Trends | Filters and counts passed; demo records excluded; exact readings table available |
| Report export | Print invoked, report title and print layout verified |
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
