import { loadConfig } from "./config.js";
import { createSlackAdapter } from "./slack-adapter.js";
import { HttpCore } from "./core-http.js";
import { FakeCore } from "./dev-core.js";

async function main(): Promise<void> {
  const cfg = loadConfig();

  let adapter;
  if (cfg.coreUrl) {
    const core = new HttpCore(cfg.coreUrl, cfg.coreChannelSecret);
    adapter = createSlackAdapter(cfg, core);
    console.log(`core: HTTP at ${cfg.coreUrl}`);
  } else {
    const core = new FakeCore(cfg.supplierChannel);
    adapter = createSlackAdapter(cfg, core);
    core.attach(adapter.egress);
    console.log("core: built-in fake core (set CORE_URL to use the real one)");
  }

  await adapter.start();

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, stopping`);
    await adapter.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
