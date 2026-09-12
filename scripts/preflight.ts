const action = process.argv[2];
if (action) { console.error(`${action}: NOT_READY. Runtime/operations module has not been registered.`); process.exitCode = 1; }
else { for (const name of ['DATABASE_URL','TELEGRAM_BOT_TOKEN','OPENAI_API_KEY','EXA_API_KEY','AMBIGUOUS_API_TOKEN','AMBIGUOUS_WORKSPACE_ID']) console.info(`${name}: ${process.env[name] ? 'configured, unverified' : 'missing'}`); }
