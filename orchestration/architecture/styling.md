# UI structure and styling

Assumption: use a restrained light interface suited to a legible desktop demo. One shared shell holds project identity, run label and connection status. The workspace places project facts beside the activity list and opens evidence or decisions in focused panels.

Use [tokens](../design-system/tokens.md), [components](../design-system/primitives.md) and [interactions](../design-system/interactions.md). CSS variables and feature-local CSS are sufficient. Keep global rules under `apps/web/src/styles/`; feature CSS cannot override unrelated components.

The four named cards are `StateChangeCard`, `IssueCard`, `SupplierComparisonCard` and `ProcurementApprovalCard`. Their owners are respectively live-workspace, live-workspace, sourcing and procurement. All compose the same Card, StatusBadge, SourceLink and Field components.

The recording target is 1920 by 1080 with visible text at least 24 px after framing. Use focused zoom or a demo display mode for that target; do not make every desktop metadata label 24 px. At narrow widths, collapse into one column, retain keyboard access and avoid horizontal form scrolling.

Show OpenAI beside extraction, Exa beside sourced candidates, Ambiguous beside remote task/report links and CopilotKit beside the decision. Sponsor names are textual attribution. Reserve most space for project facts. No invented charts, photography, logos or animations are required.
