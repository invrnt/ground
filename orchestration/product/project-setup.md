# Project setup

Owner: `runtime`. Requirement: RF01.

Provide an admin-only setup command and validated manifest for one workspace/project, one real Telegram group, locations and aliases, members and roles, material units/conversions, weighted work plan, dependencies and Ambiguous identity mapping. Advanced onboarding UI is unnecessary.

Provision separate authenticated Ground accounts and explicit Telegram sender-ID bindings. Validate Luis, Ana and Juan, including Juan's actual Ambiguous user ID. Ground login does not accept a user ID or role chosen by the browser. The authorized demo recipient must already be reachable by the bot and be marked as a test recipient.

Seed [the scenario](scenario.md) with a scenario version and fresh run ID. Preserve declared baseline weights and inputs. Never seed fake remote success, source results or sent requests. Re-running setup is idempotent; a reset creates a different run through operations, not a destructive reseed.

Record manifest fields for date, timezone, currency, material brand/reference/finish/source, test address and desired delivery date, user mappings, group binding, media and hashes, drawing reference, reminder delay and recipient. Store credentials outside the manifest. Ground's configuration policy permits member reporting, material research and internal workspace maintenance; supplier request dispatch still requires Ana's approval.

Show invalid/missing mappings as configuration problems. Unknown commercial reference, workspace assignment fields or unreachable recipient blocks complete live acceptance. The rest of the application remains usable with an explicit pending state.
