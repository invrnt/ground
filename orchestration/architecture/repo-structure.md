# Planned repository structure

These paths do not yet exist. Stage 1 creates only buildable entrypoints, shared contracts and registration slots. Later agents fill their exclusive directories.

```text
apps/
  web/src/
    main.tsx, app.tsx, routes.tsx, feature-registry.ts
    lib/                 # one API client and display formatters
    ui/                  # shared UI components
    styles/              # tokens and global styles
    features/
      auth/ workspace/ evidence/ purchases/ sourcing/
      procurement/ requests/ reports/ operations/
    copilot/             # SDK provider, tool registration and state adapter
  api/src/main.ts, register.ts
  worker/src/main.ts, register.ts
packages/
  contracts/src/         # wire schemas, DTOs, ports and error/event names
  domain/src/            # pure calculations and construction invariants
  server/
    migrations/         # one numbered sequence, shared owner only
    src/
      composition.ts
      infra/            # pg, transactions, sessions, storage and job runner
      adapters/telegram/ openai/ exa/ ambiguous/
      modules/
        project/ ingestion/ interpretation/ site/ live/
        purchases/ sourcing/ reporting/ procurement/
        workspace-sync/ dispatch/ operations/
scripts/                # migration, setup, seed and reset entrypoints
demo/                   # manifest, authorized media and sourcing fixtures
docs/release/            # final runbook, evidence index and submission notes
tests/release/           # only a needed cross-module release regression
orchestration/          # this contract and implementation handoffs
```

Co-locate module tests with their owner. Each server module exports a single `index.ts` describing its routes, job handlers and services. Each web feature exports its component and registration descriptor. Only the shared owner connects exports in the registration files and `composition.ts` after peers finish.

Workspace packages are `@ground/contracts`, `@ground/domain`, `@ground/server`, `@ground/web`, `@ground/api` and `@ground/worker`. The shared owner creates package configuration. Leaf owners do not add packages.

Required root commands are `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test:critical`, `pnpm check`, `pnpm db:migrate`, `pnpm demo:configure`, `pnpm demo:seed`, `pnpm demo:reset` and `pnpm demo:preflight`. `check` runs typecheck, build and the small critical set. These commands are a future scaffold contract, not available commands today.

Private runtime files and generated recordings belong on ignored storage or the team's approved artifact storage. Commit the media manifest and redacted release evidence, not credentials or unrelated personal data.
