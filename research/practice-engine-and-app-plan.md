# On-site practice engine and separate mobile app

Proposal prepared October 4, 2026. This extends the existing source review. It is an implementation plan, not a claim that the described engine or bank already exists. No live-site changes are included in this planning step.

## Product decision

Confirmed user direction: no official question files or reuse permission are currently available; plan for original standards-aligned questions. Licensed official material is an optional future addition, not a dependency.

Build one shared question/content service with two distinct experiences:

- Website: focused study, custom practice tests, explanations, saved study sheets, and competition preparation. Keep the NCCEE institutional design.
- App: short, interactive, scenario-based daily practice with a separate visual identity and navigation. Share learning history and standards coverage with the website, not its page layout.

The website is already mobile-compatible. The separate app should justify itself through its learning loop rather than simply wrapping the same website.

## Student flow on the website

1. Add topics or lesson resources to a study sheet. Each relevant resource maps to explicit skills; general guides and rules do not automatically imply question coverage.
2. Select Practice this sheet. Show available skills and distinct-question counts before the session begins.
3. Choose a focused practice mode, question count, and difficulty. Offer an optional timer. Do not label a custom topic set a full competition simulation.
4. Take the test inside this website, with accessible question controls, diagrams/tables where needed, flagged questions, and a clear remaining-question count.
5. In learning mode, show feedback after each response. In test mode, defer explanations until submission.
6. Review the correct answer, reasoning, why each distractor fails, source/standard reference, and suggested lesson. Allow reporting an unclear or incorrect item.
7. Offer a new set, review missed skills, or revisit the sheet. Avoid recently seen questions when the bank supports it. If the requested count exceeds eligible unseen material, offer a smaller set or disclose repeats.

Modes for the first implementation: Learn, Test, and Review mistakes. Official-format presets are separate, versioned configurations enabled only when the relevant competition/season/stage rules have been verified.

Saved sheets, attempts, and review history need persistent storage and student access controls. The current temporary page-session sheet is insufficient for this feature. Guest practice can work without account creation; an account can provide cross-device history. Define a suitable school/student sign-in arrangement before public deployment rather than pretending existing Sites owner access is student authentication.

## Where the bank comes from

### Official licensed items

Import NCCEE/CEE-supplied question files when their permitted use covers delivery through this website and app. Record provider, copyright/credit, permitted uses, restrictions, and any expiry. Do not infer bank reuse authorization from a general partnership document. Do not extract confidential live competition exams or repeatedly run a practice endpoint to harvest questions.

### Original standards-aligned items

Author original questions from the verified CEE economics and CEE/Jump$tart finance learning objectives. Cite the learning source and label authorship accurately. Alignment is an editorial mapping until independently reviewed; it does not imply CEE endorsement or that the item appeared on an official exam.

AI can assist drafting, generating distractors, and identifying possible ambiguities. An answer is not validated just because a second AI agrees. Use independently computed numerical answers, explicit conceptual explanations, duplicate checks, and subject review. Keep drafts separate from published practice content.

### Controlled numerical variants

A validated template can create different values for arithmetic practice such as opportunity cost or compound interest. Define units, rounding, allowed domains, plausible distractors, and answer constraints. Test boundary cases and equivalent answers. Count variants separately from unique conceptual items and limit repeated templates within one test.

### Published resource permissions

Reviewed [EconEdLink's terms](https://econedlink.org/terms-of-use/) and [permission policy](https://econedlink.org/permission-policy/). The policy distinguishes limited instructional copying/adaptation from website reuse and expressly restricts copying/framing resources and modifying interactive tools. The published permission policy is dated November 6, 2013. These pages are not a blanket authorization to mirror its assessments. Specific institutional permission may provide a different authorized route. This policy concerns EconEdLink; permissions for UNL platform items and other CEE materials must be established separately.

No reusable large official question bank or supported question-delivery API has been established in the sources reviewed so far. That is a research limit, not proof none exists. An original bank lets development proceed without representing copied material as authorized.

## Content records and review

Each versioned question should include:

- Stable item and version IDs; source type (original, licensed, or generated variant).
- Track, topic, exact standards mapping, audience/course level, prerequisites, and editorial difficulty.
- Stem, choices or numeric response specification, answer, units/tolerance, and explanation.
- Distractor rationales identifying likely misconceptions.
- Accessible diagram/table content and alternative text where applicable.
- Learning-source citation, reuse provenance, author/reviewer, and date.
- Status: draft, checked, reviewed, published, or retired.
- Date-sensitive flag, expiration/review date, and template family if applicable.

Difficulty labels are editorial estimates until student response data supports calibration. Do not claim a readiness percentage or score prediction without evidence.

Publication flow: draft -> independent answer checks -> ambiguity/bias/accessibility review -> subject review -> publish. Students can flag issues; administrators can retire or correct an item. Preserve the item version used in historical attempts so later edits do not silently rewrite past results.

The first release should prioritize a coherent reviewed set across chosen skills. A reasonable planning target is 100–200 distinct questions for an initial pilot, expanding toward 1,000+ through reviewed batches. These are proposed targets, not existing inventory or a promise of review capacity. Expose actual coverage and counts. Do not pad a huge-bank claim with repeated wording or changed numbers.

## Implementation shape

Extend the current static prototype with a backend for question delivery, grading, sessions, and persistence. Preserve the existing Site and institutional shell; do not create a replacement Site merely to add storage.

Core records: learner, study sheet, sheet skills, question version, source/reuse record, test blueprint, attempt, attempt item, response, review queue, and issue report.

Core operations:

- Create/update a sheet and its skill selection.
- Start a test from an explicit selection of published question versions; save that selection server-side.
- Retrieve the current question without its answer key.
- Save responses and resume an interrupted attempt.
- Submit and grade using deterministic scoring with idempotent submission handling.
- Return explanations at the correct stage for learning/test mode.
- Schedule later review and fetch next suggested practice.
- Import, review, publish, revise, and retire content through a staff-only workflow.

Server checks enforce ownership of sheets and attempts and access to staff operations. Network interruption must preserve submitted responses and permit safe retry. Timer behavior must be defined for each mode; practice need not penalize poor connectivity. Offline app practice can cache permitted practice packs, while acknowledging that offline answers cannot be kept secret. This is a learning product, not a secure official competition proctoring system.

Meaningful tests should cover grading, numeric tolerances/rounding, question uniqueness and coverage, unpublished-item exclusion, answer-key timing, cross-user data isolation, repeated submission, version preservation, resume, and interrupted connections.

## Distinct app direction: decisions, consequences, understanding

Working concept: short decision missions. Name and visual identity remain open.

A session opens with a real situation rather than a list of links. For example, a school pop-up shop faces a higher ingredient cost. The student predicts the effect, adjusts a supply graph, answers a short question, and explains the trade-off. A later mission could involve choosing between fictional savings accounts or recognizing a credit misconception. Follow-up questions connect the scenario to the same standards used on the website.

A five-minute loop:

1. Encounter a short situation or visual question.
2. Make a decision or prediction.
3. See an explanation or consequence with the model's assumptions stated.
4. Complete a few retrieval questions.
5. Leave with a specific skill to revisit later.

App navigation: Today, Skills, Practice, and Team when team features are actually supported. Show skills practiced and review due; no fake precise mastery predictions. Bring in missed website topics and let app activity inform the next website practice set.

Visual direction: purpose-built illustrated situations, direct manipulation for graphs and budgets, clear feedback, compact mobile screens, and a distinct typography/layout system. NCCEE affiliation can remain visible without reproducing its desktop header, navigation, footer, or institutional photography.

Retention proposals: flexible weekly goals, optional reminders, visible progress through concepts, and supportive team milestones. Do not make missed days erase learning progress or use paid lives to block practice. Any leaderboard should be optional and should not define learning value by available free time or speed alone.

This borrows the idea of short repeatable learning from familiar apps without copying Duolingo's mascot, screen designs, or exact reward system. No claim is made that the proposed mechanics have been validated to improve outcomes; a pilot should measure completion, delayed retention, accessibility, and student feedback.

## Build order

1. Build the website's end-to-end practice flow and persistent study sheets using a small, clearly labeled original bank plus any authorized supplied questions.
2. Establish the content import/review workflow and expand coverage in reviewed batches. Add verified competition-format presets as their rules become available.
3. Pilot a separate app experience with one complete decision mission and shared account/history. Choose native distribution and offline requirements based on the pilot; do not confuse an installable website with a finished App Store release.
4. Expand the app's mission library and adaptive review using evidence from actual learners.

The user confirmed that the initial bank should contain original standards-aligned questions. Official licensed material can be added later if supplied with suitable permission. The next implementation can proceed around the original-item workflow.
