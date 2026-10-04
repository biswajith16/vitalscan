# Interface refinement review

Scope: VitalScan’s dashboard, navigation, scanner, reports, history, trends and
settings. Next.js App Router, React, TypeScript; shared semantic CSS tokens in
`app/globals.css` with the refreshed presentation in `app/polish.css`. Repository
`AGENTS.md` requires checking the installed Next.js documentation; the client/server
boundary guide was inspected. No physical-device or clinical review is claimed.

## Coverage

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | Native links/buttons/dialog, scanner status, cancellation, reduced motion, axe on home/scan/history/settings | Contrast findings corrected; automated checks pass |
| Layout | Desktop sidebar, mobile bottom navigation, all primary routes at 375/390/430/1280 px, scanner video geometry | Responsive hierarchy and preview alignment corrected |
| Writing | Home claims, empty states, permission failures, startup progress, privacy and research notices | Ambiguous startup copy replaced with actionable states |
| Typography | Local variable Manrope, heading scale, card text, numeric results | Consistent family, scale and spacing applied |
| Colors | Evergreen/ivory tokens, feature/status surfaces, low-contrast labels | Token palette unified; audited contrast passes |
| UI | Button sizing, surface/radius hierarchy, icon consistency, loading and disabled states, motion behavior | Refined across common components and scanner |

## Resolved findings

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| HIGH | Writing | `components/scan/scanner.tsx:120`, `lib/camera/session.ts:2` | An unbounded startup spinner gave no useful diagnosis | Named permission/preview/model stages, bounded waits and recovery guidance | Users can understand blocked camera startup and retry |
| MEDIUM | Layout | `app/polish.css:1110`, `components/scan/scanner.tsx:80` | Cropped preview and raw-frame checks could disagree | Preserve the actual video aspect ratio; bring preview into view after mobile activation | The visible guide should match the pixels being analyzed |
| MEDIUM | Layout | `app/polish.css:149`, `app/polish.css:382` | Wide header navigation and weak desktop grouping | Dedicated desktop sidebar, clearer dashboard grouping and mobile collapse | Creates stable navigation and a clear primary action |
| MEDIUM | Colors | `app/polish.css:660`, `app/polish.css:690` | Pale feature labels failed contrast | Darker labels, slightly larger type | Supporting information remains readable |
| MEDIUM | Typography | `app/polish.css:17`, `app/layout.tsx:3` | Generic type and uneven visual emphasis | Locally served Manrope and a consistent heading/body hierarchy | Improves legibility without remote font dependencies |
| LOW | UI | `app/polish.css:50`, `app/polish.css:92` | Inconsistent card and control emphasis | Shared button dimensions, radii, surface and icon treatments | Makes interactions and grouping more predictable |

## Verification

- Production build, strict TypeScript, lint and 38 unit tests passed.
- `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/vitalscan-browsers npm run test:e2e`:
  15 passed, 1 intentionally skipped WebKit offline-interception case.
- Chromium and WebKit: eight main routes at four widths, no horizontal overflow;
  onboarding, persistence, filters, report export, deletion and camera recovery pass.
- axe WCAG 2 A/AA and 2.1 AA checks pass on the four audited pages in both engines.
- Desktop/mobile dashboard and scanner screenshots inspected visually.
- Real MediaPipe plus synthetic optical input completes the full 30-second capture
  in Chromium and WebKit, produces the expected test result, releases the camera,
  and persists across reload. No application demo fallback is used.
- Not verified: VoiceOver/TalkBack, physical phone camera/permission behavior,
  physiological accuracy, and exhaustive real-world lighting/movement conditions.

## Verdict

Approve — no HIGH interface findings remain in the reviewed scope. This is not
clinical approval or a claim that automated checks replace physical-device QA.
