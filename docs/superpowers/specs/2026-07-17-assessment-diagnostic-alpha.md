# IELTScope Assessment Diagnostic Alpha

## Scope

This alpha turns `/assessment` from a static placeholder into a working free diagnostic flow. It does not implement AI scoring, audio upload, teacher review, plan generation or VIP credit consumption.

## Implemented Behavior

- Four diagnostic sections: listening, reading, writing and speaking.
- Total estimated time remains 60 minutes.
- One required alpha question is present for each section.
- Students can save each answer independently.
- The page shows answered progress and enables submission only after all required sections are answered.
- Submitted assessments use status `submitted`; they are not treated as scored or completed.
- Submitting a diagnostic now enqueues one `assessment_evaluations` record with status `queued`, stage `ai_initial_scoring` and rubric version `diagnostic-alpha-v1`.
- Submission is idempotent for scoring: repeated visits or duplicate submit actions reuse the existing evaluation record.
- The dashboard now distinguishes three post-onboarding states:
  - no diagnostic or draft/in-progress diagnostic: continue ability diagnostic;
  - submitted diagnostic: show a waiting-for-scoring handoff with the current evaluation status, AI initial scoring and teacher-calibration steps;
  - completed diagnostic: unlock the full workbench.
- The full dashboard remains locked until a future completed assessment exists.

## Data Flow

- `@ielts/contracts` owns the diagnostic blueprint and answer validation.
- `assessment-service` owns progress and submission rules.
- `assessment-repository` persists to `assessments`, `assessment_answers` and the new `assessment_evaluations` queue table.
- `/api/assessment` returns the current snapshot.
- `/api/assessment/answers` saves or replaces one answer by question id.
- `/api/assessment/submit` submits after all required alpha questions are answered and ensures an evaluation task exists.
- `/dashboard` reads the latest active assessment and its evaluation status. It never treats `submitted` as a scored result, so simulated plans stay hidden while scoring is pending.

## Deferred

- Real listening audio, reading passages and calibrated question bank.
- Browser microphone capture and private audio storage.
- Timers, pause/resume rules and anti-refresh edge cases.
- AI scoring, independent scoring engine, teacher anchors and provider routing.
- Conversion from submitted diagnostic to completed diagnostic, skill estimates and study plan generation.
- Actual scoring worker/provider calls, teacher adjudication UI and report page details beyond the current waiting shell.

## Verification

- Unit/component tests cover contracts, service logic and runner interactions.
- E2E covers onboarding into diagnostic, four answer saves and submission.
- Full project `test`, `typecheck`, `lint`, E2E and production build passed on 2026-07-17.
