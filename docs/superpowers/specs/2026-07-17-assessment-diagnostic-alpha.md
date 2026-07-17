# IELTScope Assessment Diagnostic Alpha

## Scope

This alpha turns `/assessment` from a static placeholder into a working free diagnostic flow. It includes a development-only scoring simulator so the internal `submitted -> processing -> completed -> skill_estimates -> /report` chain can be tested. It does not implement real AI scoring, audio upload, teacher review, plan generation or VIP credit consumption.

## Implemented Behavior

- Four diagnostic sections: listening, reading, writing and speaking.
- Total estimated time remains 60 minutes.
- One required alpha question is present for each section.
- Students can save each answer independently.
- The page shows answered progress and enables submission only after all required sections are answered.
- Submitted assessments use status `submitted`; they are not treated as scored or completed.
- Submitting a diagnostic now enqueues one `assessment_evaluations` record with status `queued`, stage `ai_initial_scoring` and rubric version `diagnostic-alpha-v1`.
- Submission is idempotent for scoring: repeated visits or duplicate submit actions reuse the existing evaluation record.
- A guarded internal endpoint, `/api/internal/assessment-evaluations/run-dev`, can complete the latest submitted/completed diagnostic only when `ENABLE_DEV_EVALUATION_SIMULATOR=true`.
- The development simulator marks the evaluation as processing, writes four replaceable `skill_estimates`, completes the evaluation, and marks the assessment completed.
- Simulated rationale is explicitly marked as development-only and must be replaced by provider scoring plus teacher-calibrated evidence before production scoring.
- The dashboard now distinguishes three post-onboarding states:
  - no diagnostic or draft/in-progress diagnostic: continue ability diagnostic;
  - submitted diagnostic: show a waiting-for-scoring handoff with the current evaluation status, AI initial scoring and teacher-calibration steps;
  - completed diagnostic with four skill estimates and an active goal: unlock the full workbench from the same real plan view used by `/plan`.
- The full dashboard remains locked until a completed assessment, four `skill_estimates` and an active goal exist.
- `/report` is now the diagnostic report shell. It shows pending states without fake scores, an empty completed-report shell when four skill estimates are missing, and the full four-skill report when `skill_estimates` are present.
- `/plan` is now the first study-plan shell. It reads the active goal plus completed diagnostic `skill_estimates`, then generates a rule-based target breakdown, priority order and first-week task outline.
- The study-plan shell is explicitly an alpha rule generator. It does not claim AI personalization yet and can be replaced by the later provider/teacher-calibrated plan worker.

## Data Flow

- `@ielts/contracts` owns the diagnostic blueprint and answer validation.
- `assessment-service` owns progress and submission rules.
- `assessment-repository` persists to `assessments`, `assessment_answers` and the new `assessment_evaluations` queue table.
- `/api/assessment` returns the current snapshot.
- `/api/assessment/answers` saves or replaces one answer by question id.
- `/api/assessment/submit` submits after all required alpha questions are answered and ensures an evaluation task exists.
- `/api/internal/assessment-evaluations/run-dev` is an internal development trigger. It is authenticated, works only on the current student, and stays closed unless `ENABLE_DEV_EVALUATION_SIMULATOR=true`.
- `/dashboard` reads the latest active assessment and its evaluation status. It never treats `submitted` as a scored result, so simulated plans stay hidden while scoring is pending.
- When ready, `/dashboard` adapts the real `/plan` view into the existing workbench layout instead of showing demo skill scores.
- `/report` reads the latest assessment, `assessment_evaluations` and `skill_estimates`; `rationale.summary` and `rationale.priorities` provide the first stable slots for AI/teacher-produced feedback.
- `/plan` reads `goals`, the latest completed `assessments`, and `skill_estimates`. It uses target overall, optional single-skill minimums and weekly minutes to allocate a first-week training ratio.

## Deferred

- Real listening audio, reading passages and calibrated question bank.
- Browser microphone capture and private audio storage.
- Timers, pause/resume rules and anti-refresh edge cases.
- AI scoring, independent scoring engine, teacher anchors and provider routing.
- Production worker conversion from submitted diagnostic to completed diagnostic and skill estimates.
- Actual scoring worker/provider calls, teacher adjudication UI and AI/teacher-calibrated persistent study plan generation.

## Verification

- Unit/component tests cover contracts, service logic and runner interactions.
- E2E covers onboarding into diagnostic, four answer saves and submission.
- Full project `test`, `typecheck`, `lint`, E2E and production build passed on 2026-07-17.
