# Interaction and motion

Preserve the sequence message, committed changes, remote task, material need, decision and result. X-Ray expands technical details without crowding the default view.

- New activity may fade in over 150 ms. Expand/collapse may use 150 to 200 ms. Disable motion for `prefers-reduced-motion`.
- Never animate stock or progress toward an uncommitted result. Mark work `processing` until the server event confirms it.
- Preserve open evidence and unfinished edits during unrelated event updates. If a proposal version changes, show the new version and require review before approval.
- `Approve & send request`, `Change` and `Reject` are separate explicit controls. Disable the in-flight submit locally; backend deduplication remains required.
- Show `Awaiting approval`, `Sending`, `Sent`, failed and uncertain states as text. An uncertain send has reconciliation guidance and no blind resend button.
- On disconnect, retain the last snapshot with a connection warning. Reconnect from its cursor or replace it with a new snapshot. Never silently show stale data as live.
- Announce meaningful status changes using a polite live region without reading the entire event log. Keep keyboard focus stable.
- Unknown price uses `Price to confirm`; an authorized test destination uses `Demo recipient`; cached research uses `Retrieved at ...` with a real timestamp.

Manual inspection of keyboard focus, one narrow viewport and the 1080p recording layout is enough for the hackathon. No animation test suite is required.
