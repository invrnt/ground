// Explicit local verification only. Never called by app startup or default tests.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import Fastify from "fastify";
import { HttpAgent } from "@ag-ui/client";
import {
  actorContextSchema,
  checkpointSchema,
  liveStateSchema,
  normalizedMessageSchema,
  sessionSchema,
} from "@ground/contracts";
import { isolatedDatabase } from "../../infra/test-database";
import { PgTransactions } from "../../infra/database";
import { PgJobQueue } from "../../infra/jobs";
import { Sessions, permissions } from "../../infra/sessions";
import { LocalPrivateFiles } from "../../infra/files";
import {
  configureDemo,
  seedDemo,
  demoProjectId,
  manifestSchema,
  PgProjectRepository,
  projectModule,
} from "../project";
import { SiteService } from "../site";
import { LiveService, liveModule } from "./index";
const url = process.env["TEST_DATABASE_URL"];
if (!url) throw new Error("TEST_DATABASE_URL required");
const fixture = await isolatedDatabase(url);
const transactions = new PgTransactions(fixture.pool);
const app = Fastify();
try {
  const manifest = manifestSchema.parse(
    JSON.parse(
      await readFile(
        new URL("../../../../../demo/manifest.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  const password = randomUUID();
  await configureDemo(
    transactions,
    manifest,
    Object.fromEntries(
      manifest.members.map((member) => [member.username, password]),
    ),
  );
  const run = await seedDemo(transactions, manifest);
  const sessions = new Sessions(fixture.pool, "http://localhost:4313");
  const projects = new PgProjectRepository(transactions);
  const site = new SiteService({
    transactions,
    queue: new PgJobQueue(transactions),
  });
  const service = new LiveService(transactions, projects, {
    history: (context, id, tx) => site.history(context, id, tx),
  });
  await projectModule(
    fixture.pool,
    sessions,
    new LocalPrivateFiles("/tmp/ground-live-check"),
  ).registerRoutes(app);
  await liveModule(service, sessions).registerRoutes(app);
  await app.listen({ host: "127.0.0.1", port: 4313 });
  async function login(username: string) {
    const response = await app.inject({
      method: "POST",
      url: "/api/session",
      headers: { origin: sessions.origin },
      payload: { username, password },
    });
    assert.equal(response.statusCode, 200);
    const cookie = response.headers["set-cookie"];
    assert.equal(typeof cookie, "string");
    return {
      session: sessionSchema.parse(response.json()),
      cookie: String(cookie).split(";")[0] ?? "",
    };
  }
  const supervisor = await login("ana"),
    worker = await login("luis");
  const context = actorContextSchema.parse({
    actor_id: supervisor.session.user.id,
    project_id: demoProjectId,
    run_id: run,
    roles: supervisor.session.user.roles,
    permissions: permissions(supervisor.session.user.roles),
    trusted_time: new Date().toISOString(),
  });
  const inputId = randomUUID(),
    fileId = randomUUID();
  const message = normalizedMessageSchema.parse({
    provider: "telegram",
    update_id: "live-check",
    chat_id: "isolated-demo",
    message_id: "1",
    sender_id: "test-author",
    text: "Isolated evidence check",
    sent_at: context.trusted_time,
    received_at: context.trusted_time,
    reply_to_message_id: null,
    media: [
      {
        id: fileId,
        provider_file_id: "test",
        mime_type: "application/pdf",
        filename: "test.pdf",
        size_bytes: 4,
        kind: "document",
        sha256: "test",
      },
    ],
    project_id: demoProjectId,
    run_id: run,
  });
  await fixture.pool.query(
    "INSERT INTO ingestion_inputs(id,bot_id,chat_id,message_id,project_id,run_id,operation_id,status,message) VALUES($1,'test','test','1',$2,$3,$4,'ready',$5)",
    [inputId, demoProjectId, run, randomUUID(), message],
  );
  await fixture.pool.query(
    "INSERT INTO private_files(id,project_id,run_id,content_type,sha256,size_bytes,restricted) VALUES($1,$2,$3,'application/pdf','test',4,true)",
    [fileId, demoProjectId, run],
  );
  assert.equal(
    (await app.inject(`/api/projects/${demoProjectId}/snapshot`)).statusCode,
    401,
  );
  assert.equal(
    (
      await app.inject({
        url: `/api/projects/${randomUUID()}/snapshot`,
        headers: { cookie: supervisor.cookie },
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        url: `/api/projects/${demoProjectId}/evidence/${fileId}`,
        headers: { cookie: worker.cookie },
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        url: `/api/projects/${demoProjectId}/evidence/${fileId}`,
        headers: { cookie: supervisor.cookie },
      })
    ).statusCode,
    200,
  );
  const checkpoint = checkpointSchema.parse({
    id: randomUUID(),
    agent_id: "ground",
    thread_id: `${demoProjectId}:${run}`,
    run_id: run,
    tool_call_id: randomUUID(),
    proposal_id: randomUUID(),
    proposal_version: 1,
    expected_hash: "isolated-check",
    expires_at: new Date(Date.now() + 60000).toISOString(),
    status: "pending",
  });
  await transactions.run((tx) =>
    service.persistCheckpoint(context, checkpoint, tx),
  );
  const reopened = new LiveService(transactions, projects);
  assert.equal(
    (await reopened.state(context)).checkpoints[0]?.tool_call_id,
    checkpoint.tool_call_id,
  );
  const headers = {
    cookie: supervisor.cookie,
    origin: sessions.origin,
    "X-CSRF-Token": supervisor.session.csrf_token,
    "Idempotency-Key": randomUUID(),
  };
  const makeAgent = () =>
    new HttpAgent({
      url: `${sessions.origin}/api/projects/${demoProjectId}/agent/run`,
      threadId: checkpoint.thread_id,
      headers,
    });
  const first = makeAgent(),
    second = makeAgent();
  await first.runAgent();
  await second.runAgent();
  assert.equal(
    liveStateSchema.parse(first.state).snapshot.project_version,
    liveStateSchema.parse(second.state).snapshot.project_version,
  );
  const work = await fixture.pool.query<{ id: string }>(
    "SELECT id FROM work_items WHERE name='Bathroom tiling' AND run_id=$1",
    [run],
  );
  const workId = work.rows[0]?.id;
  if (!workId) throw new Error("Missing seeded work");
  await site.execute({
    context,
    source_message_id: inputId,
    idempotency_key: randomUUID(),
    proposal: {
      type: "complete_work_item",
      entity_ids: { work_item_id: workId },
      fields: {},
      evidence_ids: [inputId],
      expected_version: 0,
    },
  });
  await first.runAgent();
  await second.runAgent();
  assert.equal(
    liveStateSchema.parse(first.state).snapshot.reported_progress,
    "81",
  );
  assert.equal(liveStateSchema.parse(second.state).snapshot.project_version, 1);
  for (const message of first.messages)
    if (message.role === "assistant")
      for (const call of message.toolCalls ?? [])
        assert.doesNotThrow(() => JSON.parse(call.function.arguments));
  const stream = await fetch(
    `${sessions.origin}/api/projects/${demoProjectId}/events?after=999`,
    { headers: { cookie: supervisor.cookie } },
  );
  assert.equal(stream.status, 200);
  const reader = stream.body?.getReader();
  assert.ok(reader);
  const chunk = await reader.read();
  assert.ok(new TextDecoder().decode(chunk.value).includes("STATE_SNAPSHOT"));
  await reader.cancel();
  const result = await app.inject({
    method: "POST",
    url: `/api/projects/${demoProjectId}/checkpoints/${checkpoint.tool_call_id}/resume`,
    headers,
    payload: {
      proposal_id: checkpoint.proposal_id,
      proposal_version: 1,
      decision: "approve",
      checkpoint_token: "isolated-test",
    },
  });
  assert.equal(result.statusCode, 503);
  console.info(
    "Live verification passed: authenticated twin AG-UI clients, committed version/progress, foreign/worker denial, evidence access, persisted checkpoint reload, stale cursor recovery, unavailable decision remains blocked.",
  );
} finally {
  await app.close();
  await fixture.close();
}
