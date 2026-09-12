# Operations and run evidence

Owner: `operations`. Requirements: RF24, RF28.

Provide admin controls for live/readiness health, provider configuration, worker heartbeat, pending inputs, outbox/jobs, uncertain sends, remote mappings, retries and run export. Show stage durations and available provider cost. The initial rehearsal budget is US$25, with an alert at US$20. Unknown usage stays unknown.

Retry known failures through their original dedupe key after verifying the current run and preconditions. Exa reads and failed interpretation can retry with bounded backoff. Uncertain external writes require reconciliation. Never provide one unrestricted `retry everything` action.

Reset requires admin session, expected current run ID and explicit confirmation naming that run. Fence it as resetting, block new effects, settle active leases or retain uncertain outcomes, invalidate approvals and cancel unsent old jobs. Atomically create a new scenario run using the existing seed service. Keep old audit/events and provider links. Reuse no old authorization or inbound-message effects.

Separate old Ambiguous demo objects by run or safely archive only owned resources. Report any unsettled old write and block a clean recording until resolved. No manual database edits should be necessary to repeat the scenario.

Export one redacted bundle by `run_id`: scenario and code versions, model/SDK versions, original demo input references, operation IDs, event IDs, state diffs, provider calls and timing, source URLs and field evidence, remote IDs/URLs and read-back versions, approval version/hash, send result and follow-up. Include enough data to connect all four sponsors to visible results. Exclude tokens, passwords, session cookies and unrelated personal information.

Save the setup/reset/preflight instructions and machine-readable export contract. release-readiness packages the actual demo recording and confirms event submission requirements; it does not build a second exporter.
