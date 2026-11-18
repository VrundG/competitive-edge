# Student diagnostic and profile — October 5, 2026

This release builds on the existing original question bank; no new claims of official question reuse or independent review are introduced.

## Available scope

31 skill groups cover all 978 bank records. The diagnostic selects one item per group: 24 calculation families plus seven standalone concepts (business-cycle patterns, total compensation, spending decisions, purchasing power, secured loans, diversification, and fraud). Overlapping original pilot items map to their calculation skill rather than being counted as extra coverage. The diagnostic checks each available skill, not an equally weighted or complete competition syllabus. Supply-and-demand graphs, case presentations, and broader economics concepts remain unassessed.

## Interpretable study rules

The profile is derived from the signed-in account's last 20 saved results. It uses the first response to each item ID/version within this retained window; repeated identical items do not add evidence or erase the initial response. Each skill's latest five distinct items provide the recent result. A missed first item produces a tentative check prompt, not a proficiency verdict.

Recurring-review status requires at least three recent distinct items, at least two recent misses, less than 70% correct in the recent window, and misses in at least two retained sessions. Positive recent feedback requires at least three recent items, at least 80% correct, and distinct-item evidence in two retained sessions. Trends compare the latest five with the previous five when both have at least three items; a change greater than 15 percentage points is labeled up/down. These are editorial study heuristics, not calibrated learning measurements. The UI explains the thresholds and retention window.

Seven singleton skills cannot establish a pattern until more original items are authored; replaying their lone item does not manufacture evidence. Review sets prefer unseen items but can repeat after exhausting the eligible pool. The bank's existing sampling limits sessions to 40; focused sets use up to 10 questions.

## Storage and safety

Uses existing authenticated per-user progress storage without additional personal information or schema changes. The server validates attempt mode and requires exactly one item from every diagnostic group for a new diagnostic; the mode cannot change mid-attempt. History preserves mode and grading remains server-computed. The client derives profile signals from saved records, not client-supplied scores. An inline replacement choice protects unfinished attempts. Submitted attempts alone affect the profile, and save failures remain visible through the existing retry/conflict UI.

## Validation

26 automated tests passed. New tests cover exact diagnostic skill coverage, fresh-item preference, tentative and repeated misses, singleton pools, replay deduplication, improvement, unknown/unanswered items, question versions, cross-session evidence after long review sets, server blueprint enforcement, immutable modes, and saved diagnostic results. Existing progress isolation and arithmetic checks pass.

Browser walkthrough completed a 31-question diagnostic, resumed midway after reload, verified the persisted review plan, added recommended topics to the sheet, completed a ten-question focused set, and reloaded the profile to confirm a recurring-review signal. No horizontal overflow at the in-app viewport. Only the top three review priorities are expanded initially; all other concepts remain available in expandable sections.
