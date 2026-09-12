# Requirement ownership

Each RF has exactly one accountable implementation agent. Shared infrastructure and release verification support these owners; they do not create second implementations. A feature owner remains accountable when its acceptance is completed by wiring a later stage.

| RF | Required behavior | Sole owner | Product contract |
| --- | --- | --- | --- |
| RF01 | Project, roles, group, locations, catalog, plan and remote-user setup | runtime | [Project setup](project-setup.md) |
| RF02 | Real messages with identity and deduplication | telegram-intake | [Telegram intake](telegram-intake.md) |
| RF03 | Audio, photo and PDF extraction with originals | interpretation | [Interpretation](interpretation.md) |
| RF04 | Reply attachments and concurrent authors | telegram-intake | [Telegram intake](telegram-intake.md) |
| RF05 | Entity/context resolution and irrelevant input | interpretation | [Interpretation](interpretation.md) |
| RF06 | Clarification and idempotent continuation | interpretation | [Interpretation](interpretation.md) |
| RF07 | Weighted milestones and reported progress | site-domain | [Site state](site-state.md) |
| RF08 | Navigable source and operation evidence | live-workspace | [Live workspace](live-workspace.md) |
| RF09 | Movement-based stock and insufficient-stock handling | site-domain | [Site state](site-state.md) |
| RF10 | Invoice purchase and duplicate detection | purchases | [Purchases](purchases.md) |
| RF11 | Separate, idempotent physical receipt | purchases | [Purchases](purchases.md) |
| RF12 | Issue, evidence, status and responsible person | site-domain | [Site state](site-state.md) |
| RF13 | Assigned tasks, due dates and blocking dependencies | site-domain | [Site state](site-state.md) |
| RF14 | Material needs and linked task risks | site-domain | [Site state](site-state.md) |
| RF15 | Source-grounded project queries | reporting | [Queries and reports](reports.md) |
| RF16 | Same-version HTML, PDF and document content | reporting | [Queries and reports](reports.md) |
| RF17 | Candidate compatibility, quantities and comparison | sourcing | [Sourcing](sourcing.md) |
| RF18 | Exact, authorized and versioned decision | procurement | [Procurement](procurement.md) |
| RF19 | Request dispatch, reconciliation and incoming reply | dispatch | [Dispatch](dispatch.md) |
| RF20 | Durable, conditional follow-up | dispatch | [Dispatch](dispatch.md) |
| RF21 | Live shared state and reconnection | live-workspace | [Live workspace](live-workspace.md) |
| RF22 | Committed X-Ray activities and remote effects | live-workspace | [Live workspace](live-workspace.md) |
| RF23 | Append-only corrections and downstream invalidation | site-domain | [Site state](site-state.md) |
| RF24 | Health, pending work, retries, export and reset | operations | [Operations](operations.md) |
| RF25 | Real CopilotKit/AG-UI state, tools and resumable checkpoint | live-workspace | [Live workspace](live-workspace.md) |
| RF26 | Real Exa research with attributable sources | sourcing | [Sourcing](sourcing.md) |
| RF27 | Verified, idempotent Ambiguous Drive/Tasks/Docs projection | office-sync | [Office sync](office-sync.md) |
| RF28 | Per-run integration evidence export | operations | [Operations](operations.md) |

## Additional visible behavior and delivery ownership

| Scope from PRD | Sole owner |
| --- | --- |
| Shared layout, sign-in, common controls, accessibility, formatting and English UI defaults | interface-foundation |
| Spanish worker acknowledgement and evidence-preserving reply delivery | telegram-intake |
| Clarification questions and unreadable-input guidance | interpretation |
| StateChangeCard, IssueCard, evidence panel and provider activity attribution | live-workspace |
| SupplierComparisonCard, unknown-price and no-compatible-product presentation | sourcing |
| ProcurementApprovalCard, Change, Reject and exact request preview | procurement |
| Sent request, external reply and follow-up views | dispatch |
| Remote photo, task and report links and synchronization states | office-sync |
| Scenario configuration and prepared media manifest | runtime |
| 120-second video, subtitles, full recording, demo wording, event-rule verification and delivery README | release-readiness |

Stage 1 supplies SDK and contract feasibility, without claiming these behaviors implemented. `release-readiness` verifies integration and may fix defects under the explicit final ownership transfer. It does not add another feature owner.
