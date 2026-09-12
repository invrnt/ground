# Original acceptance inventory

Preserves PRD T01 through T30. This is a traceability checklist, not thirty required automated suites. The method column is the cheapest intended evidence; outcomes are not yet measured. Main/support refer to [critical journeys](critical-journeys.md). Critical tests refer to [strategy](strategy.md).

| ID | Expected outcome | Minimum evidence |
| --- | --- | --- |
| T01 | Bound project/group/users allowed; unauthorized identity rejected | Main setup + support access check |
| T02 | Audio/photo gives 81%, zero boxes, issue and Juan task | Main |
| T03 | Ambiguous alias requires selection before consumption | Support |
| T04 | Repeated milestone remains 81% | Site critical test |
| T05 | Consume 9 from 8 stays pending | Site critical test |
| T06 | Invoice 228,000; cement remains 4 | Purchase critical test + support |
| T07 | Repeated receipt ends at 10 once | Purchase critical test |
| T08 | Evidence, assignee, dependency and changed local due date | Main; inspect due-date edit in support |
| T09 | Query returns 20 boxes and Juan review with sources | Main/support query |
| T10 | A/B/C expected values and classification | Sourcing critical test |
| T11 | Worker denied; Ana sends one authorized request | Approval critical test + main |
| T12 | Same-version report/PDF/X-Ray, navigable evidence | Main |
| T13 | Three webhooks produce one consumption identity | Intake critical test + site operation idempotency |
| T14 | Concurrent authors and late evidence do not duplicate changes | Intake critical test |
| T15 | Concurrent stock commands preserve valid balance/version | Site critical test |
| T16 | Changed price, quantity or recipient invalidates old approval | Approval critical test |
| T17 | Uncertain send is reconcilable without blind resend | Dispatch critical test |
| T18 | Follow-up survives restart; resolved subject cancels it | Dispatch critical test + support |
| T19 | Correction leaves one box and need 19; stale proposal invalid | Site/approval critical tests + support |
| T20 | Illegible invoice asks concrete fields and keeps original | Support |
| T21 | Source instructions cannot change permissions or destinations | Support + server-boundary inspection |
| T22 | Wrong session or expired token cannot approve | Approval critical test |
| T23 | Failed input recoverable; reconnect restores consistent state | Main reload + support failure |
| T24 | Reset repeatability without manual SQL | One support reset required; original three runs deferred |
| T25 | Real CopilotKit tools/state/edit/approval and reload while waiting | Main, including one Change before approval |
| T26 | Real Exa query and opened attributable source | Main; cannot use fixtures |
| T27 | Per-m² price, changed coverage and unknown transport handled | Sourcing critical test |
| T28 | Real file, assigned task and document with verified reads | Main; cannot use fixtures |
| T29 | Remote timeout/retry gives one resource or explicit review | Office-sync critical test |
| T30 | Sent request appears in Ground, recipient and same document/export | Main |

The original numeric targets remain in [security and performance](../architecture/security-performance.md). Record single-run timing as observed timing, not a percentile. The original 20-input/95% accuracy study and three-consecutive-run requirement are optional post-delivery work under the user's override.
