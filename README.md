# Competitive Edge: Prep, Practice, Win

A student-built economics and personal-finance competition preparation platform using NCCEE-aligned branding and links to official competition resources.

- `public/`: website source; `server/`: authenticated progress API; `db/` and `drizzle/`: schema and migrations.
- `research/research-brief.md`: source review, resource inventory, standards analysis, conflicts, and design rationale.
- `research/validation.md`: checks and limitations.

Run `npm install`, `npm run build`, then `npm run dev`. Local preview uses a development-only identity and SQLite. Production uses D1 and supports student sessions alongside the existing Sites signed-in visitor identity. Official competition registration remains on organizer platforms. Do not describe this as an organizer-approved production service or a hosted official exam bank.

## Practice bank

Add a topic resource to **Study sheet**, then choose **Start practice**. This release contains 57 original foundation questions plus 960 numerical variants across 24 calculation types (1,017 exercises total). Choose 10, 20, or 40 questions; new sets favor exercises absent from the current attempt and recent results and rotate across question families. Includes grading, explanation review, and missed-question retries. Study sheets and attempts now persist across reloads for the signed-in account. All 960 variant answers are checked with an independent exact-rational arithmetic test, plus hand-worked anchors. This is not independent subject review or a guarantee of error-free content. The bank does not claim complete competition coverage. See `CHANGELOG.md` for feature-sized checkpoints.

After submitting any practice set or diagnostic, a student can report the exact question version for a possible answer/explanation error, unclear wording, duplication, or another issue. Reports are accepted only for submitted attempts owned by that signed-in identity, limited to 500-character notes, deduplicated by issue category, and stored as open editorial-review records.

Run checks with `npm test` (Node.js required). Run `npm run build` before preview or publication.

Public GitHub source: https://github.com/VrundG/competitive-edge

The public source deliberately disables the seeded management and demonstration passphrases. Configure fresh credentials in the deployment database before using either seeded account. Never commit production credentials or runtime secrets.

The checked-in Sites manifest intentionally contains no project ID. Create or select the destination Site before deployment so a collaborator cannot accidentally publish into the original project.

## Printable concepts

Add **Supply and demand** from Economics or Resource library, then open Study sheet → **Print concepts & subtopics**. The screen keeps a compact topic list. **Preview print outline** reveals the full notes, and text downloads include the same subtopics. Ten core topics have original outlines; guides and other references are explicitly labeled when no outline is included. Print CSS omits navigation, save status, and quiz controls.

## Diagnostic and learning profile

Start at **Choose Your Challenge**, then select **Explore Diagnostics** for Economics (8 questions) or Personal Finance (23 questions). Each untimed, resumable diagnostic samples one question per available skill in that challenge, then recommends review concepts and focused practice. Earlier combined 31-question results remain supported. The profile uses first responses to distinct question versions in the most recent 20 saved results. It shows recent evidence and trends instead of claiming mastery from a single answer. Seven concepts have only one original item; their limited evidence is labeled. Graphs, case presentations, and full competition coverage are not yet assessed.

## Team practice

Each challenge includes a **Team Practice** area. Quiz Bowl runs timed 10-, 20-, or 40-question rounds from the original practice bank, optionally reads prompts aloud, and lets a team self-score after revealing each answer. Students may opt into voice detection, press **Say your answer**, review the browser-generated transcript, and see an advisory “likely match” or “needs review” result. Microphone access is requested only after that button is pressed. Competitive Edge does not store audio or transcripts in the account, although the browser may use its own speech-processing provider. Presentation Center includes six original case prompts per challenge, separate preparation and presentation timers, judge-style follow-ups, and a five-part reflection rubric. Its optional camera preview does not record or upload video. These activities are practice formats, not official organizer or CEE rounds or prompts.

## Student account backend

Students can create a Competitive Edge username and 15-character-or-longer passphrase, sign in, see the active account, and sign out from the website. Account changes reload the correct isolated study sheet, diagnostic state, learning maps, and history. Progress stored under the surrounding Site access is not automatically copied into a student account. Password recovery and account deletion are not implemented. The public frontend connects only to the Competitive Edge API origin configured in `api-client.js`. See `research/student-accounts.md` for the API contract and rollout requirements.
