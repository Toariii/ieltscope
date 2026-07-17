# IELTScope Public Homepage

## Selected Direction

Implement public homepage concept 3 as the unauthenticated entry surface. The authenticated student workbench remains a separate route and visual context.

## Brand

- Product name: `IELTScope`
- Descriptor: `AI 雅思提分系统`
- The wordmark should visually distinguish `Scope` without splitting the name into two brands.
- Commercial launch requires a separate trademark and official-association review.

## Conversion Flow

1. Public homepage offers `免费开始诊断`, `免费注册`, and `登录`.
2. Registration and login use the existing Better Auth routes.
3. Redemption is available only after authentication through the membership workflow.
4. The public homepage never displays a redemption input.

## Homepage Structure

1. Immersive product hero with writing and speaking modes.
2. Product workflow: diagnosis, detailed feedback, retry, plan update.
3. Interactive tool navigator for diagnosis, writing, speaking, planning, and focused practice.
4. Teacher-calibration and scoring-method explanation without unsupported accuracy claims.
5. Closing registration call to action and product footer.

## Motion

- Mode indicator slides between writing and speaking.
- Writing feedback items reveal in sequence.
- Speaking waveform responds only in speaking mode.
- Workflow progress advances purposefully.
- Sections enter on scroll with restrained distance and opacity.
- All non-essential animation is disabled under `prefers-reduced-motion: reduce`.

## Language Rules

- Student-facing commands use `查看批改详情`, never `查看证据`.
- AI score language remains preliminary and avoids official-score claims.
- The homepage demonstrates tools with realistic product states rather than promotional image cards.

