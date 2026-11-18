# Diagnostic-gated Learning Maps — October 6, 2026

## Student flow

Each challenge has its own gate. A student must submit the Economics diagnostic before opening the Economics Learning Map and must separately submit the Personal Finance diagnostic before opening the Personal Finance map. A direct visit to a locked map or skill page shows the diagnostic requirement and links to the correct test. Submitted diagnostic results link directly to the newly unlocked map.

The economics map contains Microeconomics, Macroeconomics, and International economics. The personal finance map contains Earning income, Spending, Saving, Managing credit, Investing, and Managing risk. These groups organize the 31 skills currently represented in the original question bank. They do not claim complete competition-syllabus coverage.

## Evidence labels

Tiles translate the existing transparent study rules into four labels: Not started, Needs review, Developing, and Strong recent evidence. Each attempted tile also displays the number correct among the most recent distinct questions. “Strong recent evidence” replaces mastery language because the bank and heuristic are not calibrated assessments. The page repeats this limitation below the map.

## Skill module

Each skill opens a three-step module. The first step gives a plain-language topic overview and current evidence. The second step links the topic resource plus relevant official competition practice, CEE preparation collections or toolkits, national standards, and North Carolina standards. The third step starts up to five original focused questions, favoring items not seen recently. Singleton skills explicitly disclose that one item cannot establish a pattern. Students may move sequentially or jump to the quiz.

## Durable unlock storage

Diagnostic completion is stored in `diagnostic_completions`, keyed by authenticated user and challenge. This keeps a map unlocked after its diagnostic result leaves the retained 20-result history. The progress API owns this marker: it records only server-validated submitted diagnostics and never accepts unlock fields from the client. Earlier combined diagnostics unlock both maps when progress is next loaded. Existing challenge-specific diagnostics unlock only their matching map.

## Validation

Automated coverage checks unit grouping, separate gates, evidence wording, challenge-safe resource selection, server-controlled unlock persistence, and retention after the diagnostic result rolls out of history. The browser walkthrough checks the locked state, the unlocked Economics map, contextual navigation, a skill overview, and the five-link official resource step.
