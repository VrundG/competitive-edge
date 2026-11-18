# Calculation bank release — October 5, 2026

## Scope and evidence

18 existing original questions remain unchanged. The expansion adds 960 numerical exercises, generated deterministically from 24 original calculation types with 40 parameter combinations each. These are variants, not 960 distinct concepts. IDs and version 1 records are stable; historical results retain snapshots.

The standards source review was completed before this expansion; see research-brief.md. Rechecked the locally extracted official 2025 CEE economics standards and 2021 CEE/Jump$tart finance standards for the covered topics. The bank records broad editorial topic alignment, not an assertion that every arithmetic exercise satisfies an entire high-school benchmark.

- Economics standards 1 and 2: production trade-offs and forgone earnings.
- Economics 9: exchange-rate conversion and price changes.
- Economics 11 and 15: real GDP and price-index inflation.
- Personal finance Earning Income: gross and net pay.
- Spending: budgets, unit prices, discounts.
- Saving: simple interest, annual compounding, savings goals.
- Managing Credit: total cost, comparing loans, simple interest over months.
- Investing: total returns, dollar gains, portfolio percentages.
- Managing Risk: deductibles, payout limits, annual premiums.

Sources: https://www.councilforeconed.org/policy-advocacy/k-12-standards/ and https://www.councilforeconed.org/wp-content/uploads/2021/10/2021-National-Standards-for-Personal-Financial-Education.pdf . No official assessment questions were copied.

## Validation and limits

`tests/variants.test.cjs` checks every generated answer with separate BigInt rational arithmetic (including rounding), unique displayed answers, nonnegative values, unique stems, and hand-worked anchor cases. It also checks sampling bounds, original item compatibility, and repeat avoidance. Progress API tests exercise saving and server grading for 40 generated items and reject 41-item attempts.

Each exercise states the relevant assumptions: currencies and exchange-rate direction; base-year price index; simple versus compound interest; rates per year; taxes/fees excluded or explicitly stated; premium versus claim cost; remaining deductible and payout limits. Values are fictional, not current market rates or tax-law claims. Discount exercises ask for the price, not the saving; interest exercises distinguish interest from final balance. Payouts include losses below deductibles and losses above policy limits. Existing pilot item texts were preserved.

These tests establish arithmetic consistency for the published finite parameter domain. They do not constitute independent subject-matter review, student psychometric validation, or a guarantee of no errors. Distractors are arithmetic alternatives, not a calibrated misconception model. The expansion remains private review content. Broad conceptual coverage, graphs, fiscal/monetary policy, negative investment returns, and case studies need separate authored and reviewed batches.

The browser receives answer keys as before; this is self-study practice, not a secure competition exam. Students can now report a problem from a submitted result. Each report is tied to the signed-in identity, attempt, question ID, and version and is stored with an open editorial-review status. A reviewer dashboard and formal approval workflow remain future work.

Release checks: all 16 automated tests passed. Local browser verification confirmed 122 eligible saving exercises, selection of a 40-question set, an answer saved successfully, and the same answer and set restored after reload. The existing two-question history result remained available after the expansion.
