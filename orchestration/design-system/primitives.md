# Shared UI components

The interface-foundation agent implements these once under `apps/web/src/ui/`. Add a component only when a feature uses it.

| Component | Contract |
| --- | --- |
| Button | Primary, secondary, danger; loading, disabled and focus states; real button semantics |
| Card | Title, optional provider/source label, content and action area |
| StatusBadge | Typed status mapped to text and visual treatment |
| Field | Visible label, help/error text, stable input association |
| Panel | Inline or modal detail; modal focus trap, Escape and return focus |
| SourceLink | Source domain, retrieved time, safe link; optional supporting excerpt |
| EvidenceLink | Authenticated Ground evidence route with attachment type |
| EmptyState | Missing data explanation and a real next action where available |
| ErrorState | Clear failure, preserved context and an allowed retry action |
| LoadingState | Short activity label; no invented completion percentage |

Feature cards remain with their feature owners. StateChangeCard and IssueCard belong to live-workspace. SupplierComparisonCard belongs to sourcing. ProcurementApprovalCard belongs to procurement. Share their base components; do not put domain computations into the UI library.

Use native HTML tables for up to three supplier rows, with proper headers and responsive wrapping. Use native form controls unless the chosen SDK needs a wrapper. Do not build a general-purpose design-system package or icon set.
