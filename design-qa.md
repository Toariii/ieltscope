# Design QA: IELTScope Public Homepage

- Source visual truth: `docs/product-design/public-homepage-2026-07-16/03-dual-mode-practice-studio.png`
- Implementation screenshot: `apps/web/output/playwright/home-final-desktop-top.png`
- Full-page desktop screenshot: `apps/web/output/playwright/home-final-desktop-full.png`
- Full-page mobile screenshot: `apps/web/output/playwright/home-final-mobile-full.png`
- Side-by-side evidence: `apps/web/output/playwright/design-qa-comparison.png`
- Refined scoring section, desktop: `output/playwright/scoring-method-desktop-final.png`
- Refined scoring section, mobile: `output/playwright/scoring-method-mobile-final.png`
- Viewport: 1440 x 1080 desktop comparison; 390 x 844 mobile verification
- State: unauthenticated, writing mode selected, writing tool selected, mobile navigation closed

## Full-View Comparison

The implementation preserves the selected concept's light neutral field, teal right-side anchor, two-mode product demonstration, conversion hierarchy and visible learning-loop continuation. The hero and live product surface occupy equivalent visual roles. Typography is intentionally smaller and more spacious than the generated reference in response to user feedback.

## Focused Region Comparison

The hero is the fidelity-critical region. The implementation replaces generated placeholder prose with readable essay content, student-facing `批改详情`, a real preliminary score state, two prioritized feedback items and a working writing/speaking switch. The source's partially clipped speaking panel is represented as a functional second mode rather than static overflow.

## Required Fidelity Surfaces

- Fonts and typography: Local system fonts support Chinese and English without a mainland-blocked font request. Body text remains 14–16px where practical, headings wrap cleanly, and letter spacing is zero.
- Spacing and layout rhythm: Desktop uses the reference's left-copy/right-workspace balance. Tablet and mobile stack the workspace without overlap. Sections use full-width bands and row dividers rather than nested card grids.
- Colors and visual tokens: Warm white, cool gray, charcoal, deep teal and limited coral match the selected direction. No gradients, glow, purple or decorative blobs were introduced.
- Image quality and asset fidelity: The selected concept contains product UI rather than photography or illustration. The implementation uses real HTML product states and Lucide icons; no raster placeholder or approximate custom SVG asset is required.
- Copy and content: Brand is changed to `IELTScope`. Redemption is absent from the public page. Student-facing actions use `查看批改详情`, and preliminary scoring language avoids official-score claims.

## Comparison History

1. Initial development screenshots contained the Next development indicator and one capture occurred during the mode-transition opacity animation.
2. Built and launched the production server, exercised both mode switches, waited for animations to settle, reset the selected states and recaptured.
3. Final desktop and mobile screenshots contain no development overlay, no transition washout and no horizontal overflow.
4. Replaced internal scoring labels such as `四项独立分析`, `0.5 分档` and `区间 + 置信度` with concise student-facing explanations. Writing and speaking criteria are named, score ranges positively communicate both boundary handling and the goal of matching the student's real level, and confidence is tied to agreement among rules, teacher samples and model results.
5. Changed the mobile scoring metrics from a compressed three-column row to an icon-and-label row with the explanation below. This prevents truncation while preserving the desktop layout.

## Interaction And Browser Checks

- System Chrome loaded the production route successfully.
- Writing-to-speaking and speaking-to-writing mode changes completed.
- Core-tool selection changed from writing to dynamic planning and back.
- Mobile navigation opened and closed.
- Browser console errors: none.
- Horizontal overflow at 1440px and 390px: none.
- Refined scoring section overflow at 1280px and 412px: none.

## Findings

- P3: The generated source uses a more exaggerated floating-panel depth. The implementation reduces depth to keep the operational product credible and consistent with the authenticated workbench.
- P3: The source shows a sliver of the speaking panel while writing is selected. The implementation favors a complete, accessible mode switch on smaller screens.

## Implementation Checklist

- [x] Public registration and login entry points
- [x] No public redemption field
- [x] Functional writing and speaking demonstration
- [x] Functional core-tool navigator
- [x] Responsive desktop, tablet and mobile layouts
- [x] Reduced-motion support
- [x] Student-facing feedback terminology
- [x] Student-facing scoring method explanation
- [x] Mobile scoring explanations wrap without truncation

## Student Workbench QA

- Source visual truth: `docs/product-design/combined-dashboard-2026-07-16/quiet-workbench-with-score-trend-v2.png`
- Implementation screenshot: `output/playwright/student-workbench-desktop-qa.png`
- Combined comparison: `output/playwright/student-workbench-design-comparison.png`
- Responsive evidence: `output/playwright/student-workbench-desktop.png`, `output/playwright/student-workbench-tablet.png`, `output/playwright/student-workbench-mobile.png`
- Viewports: 1440 x 1080 fidelity comparison; 1440 x 900 desktop, 768 x 1024 tablet and 390 x 844 mobile verification
- State: authenticated student, writing trend selected on desktop, mobile navigation closed

### Full-View Comparison

The implementation preserves the selected concept's fixed learning navigation, top search and account tools, exam countdown, dominant daily-plan surface, four-skill target block, score-history chart and narrow recent-feedback/resource rail. `IELTS Path` is replaced with the approved `IELTScope` brand. Density and typography are intentionally quieter than the generated source in response to the user's earlier request for smaller type and better module proportions.

### Focused Region Comparison

The daily-plan rows, four-skill target tiles and score-history chart were checked at readable scale in the combined comparison. The implementation corrects generated-source artifacts such as duplicated skill labels, replaces `查看证据` with `查看批改详情`, and uses stable typed mock data that maps to goals, skill estimates, plan tasks, evaluations, credit ledger and streak records.

### Required Fidelity Surfaces

- Fonts and typography: local system fonts keep Chinese/English reliable in mainland China; compact 11–34px hierarchy matches an operational study tool and all letter spacing remains zero.
- Spacing and layout rhythm: desktop keeps the 240px fixed sidebar and narrow resource rail; tablet collapses to one main column; mobile stacks every task and data module without clipped controls.
- Colors and visual tokens: white, cool gray, charcoal, deep teal and one restrained amber priority state match the approved reduced-palette direction.
- Image quality and asset fidelity: the source is product UI rather than imagery. All icons use the installed Lucide library and the score visualization uses Recharts rather than handcrafted icon or chart assets.
- Copy and content: all visible copy is student-facing. Preliminary estimates are labeled, mock data maps to typed contracts, and the primary feedback action is `查看批改详情`.

### Comparison History

1. First browser capture showed an incomplete animated chart line and the mobile drawer still moving off-screen after its state closed.
2. Disabled chart entrance animation, waited for the drawer transition, removed the Next.js development indicator and recaptured all three breakpoints.
3. Final captures show complete trend lines, a closed mobile drawer, no development overlay and no horizontal overflow.

### Interaction And Browser Checks

- System Chrome registration redirects to `/dashboard`; sign-out and sign-in return to the workbench.
- Student access to staff routes is denied and teacher annotation access still works.
- Search suggestions, notification popover, profile menu, score tabs and mobile navigation were exercised.
- Horizontal overflow at 1440px, 768px and 390px: none.
- Browser console errors: none.

### Findings

- P3: The source uses heavier display type and larger task rows. The implementation intentionally uses a denser operational scale to fit more actionable information and follow the user's compact-typography feedback.
- P3: Membership and practice destinations remain anchored within the workbench until their dedicated routes are implemented in later plan tasks.

### Implementation Checklist

- [x] Authenticated dashboard route and login redirect
- [x] Complete responsive learning navigation
- [x] Typed mock view model with real database ownership boundaries reserved
- [x] Today's plan, target scores, trend chart, recent feedback, credits and streak
- [x] Desktop, tablet and mobile layout verification
- [x] System Chrome interaction and console verification

## Marketing And Authentication Photo Refinement

- User feedback references: `docs/product-design/user-feedback-2026-07-16/homepage-vertical-sections-feedback.png`, `docs/product-design/user-feedback-2026-07-16/auth-empty-color-panel-feedback.png`
- Homepage implementation: `output/playwright/public-home-carousel-feedback-viewport.png`
- Authentication implementation: `output/playwright/auth-login-feedback-viewport.png`
- Combined comparison: `output/playwright/marketing-auth-feedback-comparison.png`
- Responsive evidence: `output/playwright/public-home-carousel-writing-desktop.png`, `output/playwright/public-home-carousel-desktop.png`, `output/playwright/public-home-carousel-mobile.png`, `output/playwright/auth-login-photo-desktop.png`, `output/playwright/auth-login-photo-mobile.png`, `output/playwright/auth-register-photo-desktop.png`
- Production evidence: `output/playwright/public-home-carousel-production.png`
- Viewports: user feedback dimensions plus 1440 x 900 desktop and 390 x 844 mobile verification
- State: unauthenticated; writing and speaking carousel states checked; login and registration forms idle

### Full-View Comparison

The authentication screen now uses a full-height natural study photograph instead of a solid dark block while preserving the quiet IELTScope brand and focused form column. On the homepage, the separate tall learning-loop and tool sections are consolidated into one horizontal feature banner with photographic scenes, previous/next controls and direct tool tabs. This shortens the public page and makes each capability visually distinct.

### Focused Region Comparison

The carousel image, copy, typed preview data and navigation controls were checked in both desktop and mobile captures. Desktop uses a wide photo/content split comparable to an advertising banner; mobile keeps the same sequence as photo, explanation and data preview without horizontal overflow. Authentication keeps the student's face and study action visible at both breakpoints without obscuring form controls.

### Required Fidelity Surfaces

- Fonts and typography: existing compact system typography is preserved; photography adds emphasis without increasing heading scale.
- Spacing and layout rhythm: the former large blank sections are removed. The carousel remains one bounded surface and the authentication photo fills its entire visual column.
- Colors and visual tokens: photographs use natural daylight and restrained teal/neutral environments that connect to the existing interface tokens without becoming monochromatic.
- Image quality and asset fidelity: six Grok-generated editorial photographs were rebuilt around 2025-2026 architect-designed learning spaces, polished smart-casual subjects and plausible real-world objects. They were inspected at source resolution and responsive crop, converted to WebP and reduced to approximately 48-75 KB. Writing and speaking scenes intentionally contain no electronic screens or cables.
- Copy and content: carousel copy still uses the approved student-facing feature language and every image has a specific accessible alt description.

### Comparison History

1. User feedback showed a color-only authentication panel and two vertically stacked homepage explanation sections with excessive whitespace.
2. Generated and inspected six natural learning photographs, rebuilt authentication around the vertical scene, removed the redundant loop section and implemented the five-step horizontal carousel.
3. Initial carousel evidence captured the 320ms entrance fade. Added a settled-state wait and recaptured full-opacity desktop evidence.
4. Final desktop/mobile captures show no clipped form controls, no carousel overflow and no browser-console errors.
5. A full-resolution review caught an impossible laptop screen/base orientation in the first modern writing image. The writing scene was replaced with a screen-free paper review, the speaking scene was also replaced to remove an oddly oriented laptop and loose cable, and all image URLs were versioned to bypass stale Next.js image caches.

### Interaction And Browser Checks

- Previous/next buttons cycle in order and wrap across five tools.
- Direct tabs remain keyboard-accessible and update the photo, copy and preview together.
- Login and registration retain their real submission states and dashboard redirect.
- Horizontal overflow at 1440px and 390px: none.
- Browser console errors: none.
- Production Chrome check on port 3001 loaded the versioned speaking asset after carousel navigation and found no photo-overlay label.

### Findings

- No actionable P0/P1/P2 findings remain.
- Remaining device screens are dim and unreadable; their bases, hinges, stands and cable paths were checked separately from the overall composition.

final result: passed

## Onboarding And Assessment Gate QA

- Implementation surfaces: `/onboarding`, `/onboarding/[step]`, `/assessment`, `/dashboard`
- Evidence suite: `apps/web/tests/e2e/onboarding.spec.ts`, `apps/web/tests/e2e/auth.spec.ts`, `apps/web/tests/e2e/student-workbench.spec.ts`
- Viewports: desktop default Chrome and 390 x 844 mobile verification
- State: authenticated student, no paid redemption code required for onboarding or basic diagnostic entry

### Flow Checks

The first student flow now starts with a free four-step profile: preparation status, exam history, target/time and review. Students can skip exam history, upload a PDF, or add records manually; all historical records are described as reference-only and do not produce precise four-skill targets before the diagnostic.

The post-login dashboard is stage-gated. New students see only `建立备考档案`, students who have completed onboarding see only `继续能力诊断`, and the full simulated workbench appears only after a completed assessment exists.

The diagnostic page is no longer a placeholder. It presents a four-section 60-minute blueprint: listening, reading, writing and speaking. The current alpha stores one required answer per section, supports saving progress through `/api/assessment/answers`, and submits through `/api/assessment/submit`. Submitted diagnostics remain `submitted` rather than `completed`, so AI scoring and plan generation can be connected later without prematurely unlocking the full workbench.

### Mobile Layout Checks

The onboarding wizard was checked at 390px width after restoring saved progress and reloading the records step. The document scroll width equals the viewport width, with the step navigation scrolling inside its own row instead of widening the page.

### Regression Checks

- Registration redirects to `/onboarding/status`.
- Login redirects to `/dashboard` and then resumes unfinished onboarding from `/onboarding`.
- Onboarding and assessment entry do not display a redemption-code requirement.
- The free diagnostic placeholder is reachable after profile confirmation.
- Four diagnostic answers can be saved and submitted after onboarding.
- Public homepage, authentication, workbench, onboarding and diagnostic E2E coverage passed in one serial run.
