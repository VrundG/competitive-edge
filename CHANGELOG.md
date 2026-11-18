# Feature releases

## 2026-11-17 — Independent identity and founders page

- Removed organizer logos, photography, challenge marks, colors, and organization-style navigation from the public product.
- Introduced the independent Competitive Edge mark, indigo-and-coral visual system, and student-built positioning.
- Added a public Meet the Founders page for Vrund Gurjar and Arnav Kandari with responsive split profiles and reduced-motion-aware scroll reveals.
- Replaced the sign-in photograph with Competitive Edge artwork and renamed visible downloads and browser metadata.

## 2026-11-17 — Competitive Edge identity

- Renamed the platform **Competitive Edge** across the student, management, print, and installable-app experiences.
- Added the tagline **Prep, Practice, Win** to the persistent page identity, browser metadata, and project documentation.
- Kept NCCEE visible as the partner organization and source of the official competition links.

## 2 — Saved progress (2026-10-05)

- Database-backed study sheets, resumable attempts, and the 20 most recent results.
- Per-user isolation using the private site's authenticated visitor identity.
- Save status, retry handling, optimistic conflict detection, and idempotent writes.
- Historical question versions and server-calculated result summaries.
- 11 automated checks passed. Browser reload checks passed for a saved sheet, an unfinished test at question 2, and a completed 2/2 result.
- Existing private audience preserved. This does not enable public student enrollment or a new identity provider.
- App frontend remains with the user's friend; current development focuses on the website.

## 1 — Study-sheet practice (2026-10-05)

- Start an on-site practice set from selected study resources.
- 18 original foundation questions across nine topics; two questions per topic.
- Question navigation, editable choices, scoring, explanations, and retry missed questions.
- Explicit coverage gaps for rules, standards, and case resources without pilot items.
- Page-session attempts only; no saved student account/history yet. Answers are present in the static practice bundle: this is a learning pilot, not a secure competition exam.
- Pilot questions have arithmetic/conceptual checks but no independent NCCEE subject review.

Validation: five automated checks cover catalog integrity, topic mapping, grading, shuffling, and numerical answers. Browser flow verified a 1/2 result, then a successful 1/1 missed-question retry, with no console errors.

## Next feature checkpoints

Each feature is implemented, checked, committed, pushed to GitHub, and deployed before beginning the next.

1. Student access rollout beyond the current prototype.
2. Question-bank expansion and staff review/import workflow.
3. Staff-approved accepted-answer alternatives and better evaluation of ambiguous spoken responses.
4. Optional rehearsal recording and playback after NCCEE defines retention and deletion rules.
5. Coach-assigned team sessions and shared performance history.
6. Distinct mobile decision-mission experience sharing the learning backend.

Recording must begin only after a student chooses it. Define retention and deletion before adding rehearsal recording. Quiz Bowl voice detection is opt-in and uses browser speech recognition; the browser may process speech through its own provider. Competitive Edge does not retain audio or transcripts.

## 2026-10-05 — Expanded calculation practice

- 960 original numerical variants across 24 explicitly scoped calculation types; original 18 items and versions preserved. Counts distinguish variants from independent questions.
- Study-sheet skill coverage, 10/20/40-question sets, skill rotation, and recent-item avoidance with disclosed fallback repeats.
- Independent exact-rational answer checks over all variants, unique-answer validation, fixed examples, sampling invariants, and server grading/session-limit checks.
- No claim of independent NCCEE review, official exam equivalence, or complete syllabus coverage.

## 2026-10-05 — Roomier layout and printable concepts

- Increased spacing across preparation pages, simplified header links, removed the repeated introduction from internal pages, and made navigation wrap on small screens.
- Compact saved topic rows now precede practice setup. Print preview is optional; printed output contains selected concept notes rather than the website interface.
- Added supply and demand to the library and economics page, with eight subtopics, a worked example, and an original labeled graph. Nine other core topics receive shorter outlines. Downloads use the same outline content.
- Fixed invalid source-table cells and the crowded finance sidebar logo. Supply-and-demand quiz questions remain a separate future release.

## 2026-10-05 — Student diagnostic and learning profile

- Added My profile and a resumable 31-question diagnostic covering every skill currently represented in the bank, one question per skill.
- Profile separates tentative flags from recurring misses and shows explicit evidence counts. Fresh practice updates recent performance; repeated item versions do not inflate evidence.
- Targeted skill/review sets, lesson links, and one-click additions to the printable study sheet connect diagnosis to review.
- Server validates diagnostic coverage and preserves attempt mode in saved history. Existing account isolation and saved question snapshots remain in place.
- Coverage limits and the last-20-results window are disclosed; these are transparent study rules, not validated proficiency scores.

## 2026-10-06 — Choose Your Challenge and student account backend

- Replaced the opening overview with Economics and Personal Finance choices. Diagnostics lead each card; subject exploration remains available.
- Added separate 8-question economics and 23-question finance diagnostics, with server-enforced coverage, saved track identity, and retained support for earlier combined results.
- Added username/password registration, login, session lookup, and logout APIs. Passwords use salted scrypt; session cookies are Secure and HttpOnly, expire after 24 hours, and store only token hashes in D1. Requests have same-origin checks, size limits, and persistent attempt throttling.
- Student sessions isolate sheets, attempts, and history. Invalid student sessions cannot fall back to the platform identity. Existing platform progress remains separate.
- Added an append-only database migration and bundled the Worker dependencies. No sign-in UI, password recovery, or wider student access is enabled in this release.

Validation: 33 automated tests pass, including an independent native scrypt oracle, session rotation/expiry, account isolation, and challenge blueprint validation. Browser checks confirm both diagnostic paths, saved attempts, and unfinished-set replacement warnings. Production dependency audit reports no known vulnerabilities at the time of this change.

## 2026-10-06 — Challenge-specific navigation

- Reduced the opening navigation to Economics Challenge and Personal Finance Challenge.
- After a student chooses a challenge, the navigation contains only that challenge, its research library, Start a Team, Study Sheet, and History.
- Scoped the research library to the selected challenge and removed the redundant competition filter. Shared North Carolina standards remain available in both libraries.
- Preserved the selected challenge while moving through team setup, study, practice, and history; team outreach defaults to the selected competition.

Validation: all 33 automated checks pass. Browser checks confirm the two-link opening navigation, five-link Economics and Personal Finance navigation, and correctly scoped research libraries.

## 2026-10-06 — Refresh flash removal

- Removed the retired introduction hero from the initial HTML so it cannot appear briefly before saved progress and route state load.
- Added a stable Competition Preparation page title above the challenge navigation on every route.
- Declared the opening route in the initial document for a consistent first paint.

Validation: all 33 automated checks pass. The served first-paint HTML contains the stable title and no retired hero; full browser reloads of the opening and Economics pages preserve the intended header.

## 2026-10-06 — Diagnostic-gated Learning Maps

- Added separate Economics and Personal Finance Learning Maps that unlock only after the matching diagnostic is submitted.
- Stored diagnostic completion independently from the 20-result history window, with automatic recognition of earlier combined diagnostics.
- Organized all 31 available skills into three economics units and six personal finance units. Tiles show Not started, Needs review, Developing, or Strong recent evidence with answer counts and no mastery claim.
- Added a three-step skill module: a concept overview, up to five official CEE/NCCEE/NCDPI resources, and a focused quiz of up to five original questions. Students can move step by step or jump directly to the quiz.
- Diagnostic results now open the map; focused-quiz results return to it. The Learning Map link appears in challenge navigation only after that challenge is unlocked.

Validation: all 38 automated checks pass, including durable unlock retention beyond the 20-result window, challenge isolation, unit grouping, evidence labels, and resource filtering. Browser checks cover the locked map, unlocked map, navigation, skill overview, and official-resource step.

## 2026-10-06 — Remove duplicate challenge overviews

- Removed Economics Challenge and Personal Finance Challenge from the contextual navigation after a student selects a challenge.
- Routed the opening-page secondary actions, diagnostic exploration links, and older challenge-page URLs directly to the matching Research Library.
- Kept the two challenge choices on the opening page and preserved diagnostics, Learning Maps, team setup, study sheets, and history.

## 2026-10-07 — Competitive Edge identity

- Renamed the student experience, browser title, navigation label, footer, and printable study materials to Competitive Edge.
- Added a site-wide mission banner: “Competition access is unequal. Preparation shouldn’t be.”
- Positioned Competitive Edge as a way to put trusted preparation resources, practice, and personalized guidance within reach of every North Carolina student.

# Student account interface — October 10, 2026

- Added create-account, sign-in, signed-in status, and sign-out screens for the existing student account backend.
- Account transitions finish pending saves, clear browser memory, and reload the progress attached to the new identity.
- Added explicit notices about progress separation and the current lack of password recovery.

# Question-quality reporting — October 10, 2026

- Added an inline Report a Question form to submitted practice, diagnostic results, and saved history.
- Reports identify the exact attempt, question, and version and accept answer, wording, duplicate, or other issue categories.
- The server verifies that the question belongs to a submitted set for the signed-in identity, limits notes and daily volume, and deduplicates repeated category reports.
- Added a durable D1 report table for later editorial review.

# Team Practice — October 11, 2026

- Added a challenge-specific Team Practice area for Economics and Personal Finance.
- Added Quiz Bowl rounds with 10, 20, or 40 unique questions, 15/20/30-second timers, optional browser read-aloud, answer explanations, and team self-scoring.
- Added six original presentation cases for each challenge, preparation and presentation timers, local team notes, judge-style follow-ups, and a five-category reflection rubric.
- Added an optional local camera preview for both modes. It requests video only and does not record or upload the feed.
- Preserved setup choices and presentation notes when the camera preview changes.

Validation: all 57 automated checks pass. Browser checks cover both challenge entrances, Quiz Bowl progression and scoring, case selection, preparation, timed presentation, judge questions, and reflection.

# Fresh Edge Bot demo account — November 3, 2026

- Cleared only the `edge_bot_student` account's saved study sheet, active attempt, practice history, diagnostic unlocks, question reports, question sessions, profile image, recovery code, and active sessions for the upcoming demonstration.
- Preserved the demo username, password hash, demo role, and North Central region while leaving every real student and management record untouched.

# Optional Quiz Bowl voice answers — October 11, 2026

- Added an opt-in voice-answer setting to Quiz Bowl when the browser supports speech recognition.
- Microphone access begins only after the student presses **Say your answer**. The interface shows exactly what the browser heard before revealing the accepted answer.
- Added cautious matching for answer text, numerical answers, and meaningful keyword overlap. Results are labeled “Likely match” or “Needs team review” and never score the question automatically.
- Kept answer reveal and team self-scoring as the final decision so speech-recognition errors are not treated as knowledge errors.
- Added explicit privacy and compatibility notices. Competitive Edge does not save audio or transcripts to the student account; browsers may use their own speech-processing service.

Validation: all 58 automated checks pass. Browser checks confirm opt-in setup, microphone activation, listening state, timer cleanup, and manual reveal fallback.

# Quiz Bowl question rotation — October 11, 2026

- Expanded the bank to 57 original conceptual questions plus 960 checked numerical variants, for 1,017 total practice items.
- Increased Quiz Bowl variety to 40 Economics question families and 41 Personal Finance question families.
- Added recent-round memory by challenge so the first two standard 20-question rounds use different question families and exact questions stay out of rotation for the most recent 120 selections.
- Preserved within-round topic balance and delayed recently used calculation structures until fresh families are exhausted.

Validation: all 62 automated checks pass, including round-to-round family rotation, recent-ID exclusion, bank inventory, answer validation, and challenge-specific selection.

# More natural Quiz Bowl narration — October 11, 2026

- Prioritized neural, online-natural, premium, and enhanced English voices before standard system voices.
- Waited briefly for the browser's full voice list before the first question instead of immediately falling back to its basic default.
- Adjusted the reader to a conversational pace and neutral pitch while continuing to start the response clock only after narration ends.

# Fresh Edge Bot demo account — October 13, 2026

- Cleared only the `edge_bot_student` account's saved study sheet, active attempt, practice history, and diagnostic unlock records.
- Removed any demo-account question reports and profile image, and invalidated its existing sessions so the next sign-in loads a clean student experience.
- Preserved the demo username, password hash, role, and North Central region while leaving every real student and management record untouched.
