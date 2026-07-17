# IELTScope Public Launch Security And Anti-Scraping Gate

## Purpose

This document protects four asset groups before IELTScope becomes publicly accessible:

1. scoring know-how: prompts, rubric versions, teacher anchors, retrieval logic, calibration and model routing;
2. proprietary content: original questions, explanations, samples, vocabulary and teaching logic;
3. source code and infrastructure: server code, credentials, deployment configuration and administrative tools;
4. student data: essays, recordings, personal experiences, exam history and learning records.

No technical control can guarantee that a public product is impossible to copy. Browser-delivered HTML, CSS and JavaScript are observable. The enforceable strategy is to keep valuable logic server-side, expose only the minimum result needed by the student, detect abuse, rate-limit extraction and preserve legal and audit evidence.

## Stage A: Security Boundaries Required During Development

These are architecture requirements now, not tasks to postpone until launch.

### Server-only intellectual property

- Keep scoring prompts, rubric definitions, teacher anchors, retrieval queries, calibration parameters, provider routing and cost controls in server-only packages or the private AI service.
- Never return full prompts, raw anchor samples, hidden rubric instructions, provider keys, internal confidence formulas or model-run traces to the browser.
- Browser responses contain only the student-facing score range, confidence explanation, feedback, task recommendations and identifiers needed for the screen.
- Do not embed secrets in `NEXT_PUBLIC_*`, client components, source maps, analytics events or error messages.

### Identity and authorization

- Enforce authentication and object-level authorization on every student, teacher and admin operation at the server boundary. Hiding controls in the UI is not authorization.
- Use UUIDs or equally unguessable public identifiers. Never authorize access only because an identifier is hard to guess.
- Keep teacher blind scoring, academic adjudication, content publication, credit changes and redemption operations behind explicit role checks and audit logs.
- Add negative authorization tests for cross-account essay, audio, report, plan, credit and membership access.

### Upload and data boundaries

- Enforce upload size, duration, file count and type allowlists at both Cloudflare and application layers.
- Validate file content rather than trusting extensions or client MIME values. Generate storage keys server-side and quarantine files that fail validation or malware scanning.
- Keep PostgreSQL, Redis, MinIO and FastAPI private; only the public web gateway is internet-facing.
- Use short-lived signed object URLs and never expose private bucket credentials or permanent public object URLs.

### Secure implementation baseline

- Validate all request bodies with strict schemas and reject unknown privilege-bearing fields.
- Avoid dynamic code execution, unsafe HTML insertion, user-controlled redirects, shell execution and arbitrary outbound URL fetching.
- Store production secrets in the deployment secret manager, rotate them, and run secret scanning before every release.
- Preserve security-relevant logs without storing raw essays, audio, passwords, API keys or complete redemption codes.

## Stage B: Mandatory Public Launch Hardening

Public access is blocked until these controls are implemented and verified.

### Edge protection and anti-automation

- Put Cloudflare WAF and managed bot protection in front of all public routes.
- Apply separate limits by IP, account, session and device signal for login, registration, redemption, search, content listing, uploads and AI evaluation.
- Use escalating responses: normal request, rate limit, proof-of-work or managed challenge, temporary lock and manual review. Do not rely on robots.txt as a security control.
- Add cost and concurrency ceilings for AI endpoints so account farms cannot drain model or audio-processing budgets.
- Detect abnormal sequential pagination, rapid content enumeration, repeated failed object IDs, multi-account device reuse and large-volume copy patterns.
- Use idempotency keys and replay protection for redemption, credit consumption, uploads and expensive evaluation requests.

### Content extraction resistance

- Return only the page, question or explanation the authorized workflow currently needs; do not provide bulk content APIs to student roles.
- Paginate and cap search results, remove predictable enumeration endpoints and apply per-user download ceilings.
- Add user- and request-specific watermark identifiers to downloadable reports and licensed content where legally appropriate.
- Record content access patterns and preserve canary records or honey identifiers that help identify bulk extraction without affecting normal students.
- Do not treat disabled right-click, minification or obfuscation as meaningful protection. They may add friction but cannot protect core logic.

### Production application hardening

- Disable production browser source maps unless a private error-monitoring upload requires them; never publish maps publicly.
- Deliver restrictive security headers at Next.js or Cloudflare: Content Security Policy, `frame-ancestors`, MIME sniffing protection, referrer policy and a deliberate permissions policy.
- Keep third-party scripts to a minimum and review each as code executing with first-party page privileges.
- Restrict FastAPI documentation and OpenAPI exposure in production, authenticate private service calls and enforce request-size and timeout limits.
- Scan dependencies and containers, generate an SBOM, pin production images by digest and run services as non-root users with read-only filesystems where practical.

### Operations and response

- Alert on authentication anomalies, role changes, scraping patterns, credit spikes, provider-cost spikes, WAF blocks and repeated authorization failures.
- Maintain an incident runbook for credential rotation, account lock, content leak investigation, API-provider revocation and student notification.
- Encrypt backups, isolate backup credentials and complete a restore drill before public launch.
- Preserve repository history, release hashes and ownership agreements as evidence of source-code and content authorship.

## Legal And Ownership Controls

- Complete trademark similarity checks and filing decisions for `IELTScope` before broad promotion.
- Keep the source repository private and require MFA for Git hosting, Cloudflare, deployment, model providers, storage and email accounts.
- Use least-privilege collaborator access; remove access promptly when a teacher, contractor or vendor leaves.
- Confirm copyright ownership, licensing and permitted usage for teacher samples, question banks, recordings and imported Word annotations.
- Use written confidentiality and intellectual-property assignment terms for contractors or contributors who can access proprietary scoring materials.

## Public Launch Acceptance Tests

The public launch gate fails if any item below fails:

- production client bundles and public source maps contain no secret, API key, scoring prompt, raw anchor, hidden rubric or internal provider route;
- unauthenticated and cross-account requests cannot access private content, objects or reports;
- student accounts cannot call teacher/admin operations or enumerate unpublished content;
- signed media URLs expire and cannot be expanded to neighboring objects;
- rate-limit tests return `429` or a managed challenge before bulk extraction becomes economical;
- login, redemption, upload and AI endpoints resist replay and enforce cost/size ceilings;
- WAF, bot rules, security headers, audit alerts and backup restore are verified in the actual deployment;
- dependency, container, secret, SAST and DAST scans have no unresolved critical or high findings;
- an independent penetration test covers authentication, authorization, uploads, business logic, AI cost abuse and content scraping;
- security owner signs the release checklist and records exceptions with an expiry date.

## Current Repository Evidence And Gaps

Existing foundations:

- Drizzle entities use UUID primary keys;
- Better Auth is configured server-side and public registration cannot choose a privileged role;
- environment files are ignored and `.env.example` documents secret injection;
- admin routing has an initial server-side role gate;
- PostgreSQL, Redis and MinIO are modeled as internal services in Docker Compose;
- onboarding API helpers reject anonymous sessions and resources owned by another student;
- exam-history PDFs are validated by MIME, size and `%PDF-` signature before private storage;
- text-layer PDF parsing rejects zero-page, over-20-page, JavaScript-bearing and attachment-bearing files;
- scanned PDFs enter a review/manual-confirmation path instead of fabricating scores;
- student dashboard now gates detailed plans behind free onboarding plus a completed assessment;
- the free diagnostic alpha stores answers server-side and leaves submitted assessments unscored until the scoring engine is connected.

Known gaps to close before public launch:

- student and content object-level authorization is not implemented across the unfinished feature routes;
- production security headers and Cloudflare WAF/bot rules are not yet configured;
- rate limiting, upload scanning, signed media delivery and anti-enumeration controls are not yet implemented;
- FastAPI currently exposes only a health skeleton and has no service authentication boundary yet;
- AI scoring prompts, retrieval anchors, provider routing, credit debiting and cost ceilings are not implemented yet;
- diagnostic answer editing currently has no autosave conflict handling, audio upload, timer enforcement or scoring worker;
- production source-map policy, security scanning pipeline and penetration testing are not yet configured.
