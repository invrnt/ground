import {
  GroundError,
  checkpointSchema,
  eventSchema,
  evidenceDetailSchema,
  liveStateSchema,
  normalizedMessageSchema,
  operationResultSchema,
  type ActorContext,
  type ApprovalCheckpoint,
  type OperationResult,
  type ProjectRepository,
  type TransactionContext,
} from "@ground/contracts";
import { PgTransactions } from "../../infra/database";
interface EventRow {
  event_id: string;
  project_id: string;
  run_id: string;
  sequence: string;
  project_version: number;
  operation_id: string;
  type: string;
  occurred_at: Date;
  schema_version: number;
  evidence_ids: string[];
  payload: unknown;
}
interface CheckpointRow {
  id: string;
  agent_id: string;
  thread_id: string;
  run_id: string;
  tool_call_id: string;
  proposal_id: string;
  proposal_version: number;
  expected_hash: string;
  expires_at: Date;
  status: string;
}
interface EvidenceRow {
  id: string;
  message: unknown;
  report_id: string | null;
  author: string;
}
export interface LiveEnrichment {
  history?: (
    context: ActorContext,
    evidenceId: string,
    tx: TransactionContext,
  ) => Promise<OperationResult[]>;
  transcript?: (
    context: ActorContext,
    inputId: string,
    tx: TransactionContext,
  ) => Promise<string | null>;
}
const restrictedEvent =
  /^(purchase|receipt|research|proposal|approval|request|followup)\./;
const publicFields = new Set([
  "name",
  "code",
  "unit",
  "coverage",
  "quantity",
  "weight",
  "status",
  "location_id",
  "area",
  "allowance",
  "material_id",
  "required_date",
  "display_name",
  "roles",
  "aliases",
  "description",
  "observed_condition",
  "assignee_id",
  "due_at",
  "issue_id",
  "blocking_work_item_id",
  "resolution_note",
  "evidence_ids",
  "drawing_reference",
]);
export class LiveService {
  constructor(
    readonly transactions: PgTransactions,
    readonly projects: ProjectRepository,
    private readonly enrichment: LiveEnrichment = {},
  ) {}
  async state(context: ActorContext) {
    return this.transactions.run(async (tx) => {
      const db = this.transactions.client(tx);
      const snapshot = await this.projects.snapshot(context, tx);
      if (!context.permissions.includes("costs")) {
        snapshot.proposals = [];
        snapshot.requests = [];
        snapshot.decisions = [];
        snapshot.remote_links = [];
        for (const entities of [
          snapshot.members,
          snapshot.locations,
          snapshot.work,
          snapshot.stock,
          snapshot.issues,
          snapshot.tasks,
        ])
          for (const entity of entities)
            entity.fields = Object.fromEntries(
              Object.entries(entity.fields).filter(([key]) =>
                publicFields.has(key),
              ),
            );
      }
      const rows = await db.query<EventRow>(
        "SELECT *,occurred_at::text FROM (SELECT * FROM domain_events WHERE project_id=$1 AND run_id=$2 AND sequence<=$3 ORDER BY sequence DESC LIMIT 100) latest ORDER BY sequence",
        [context.project_id, context.run_id, snapshot.event_cursor],
      );
      const events = rows.rows.flatMap((row) => {
        if (
          !context.permissions.includes("costs") &&
          restrictedEvent.test(String(row.type))
        )
          return [];
        const event = eventSchema.parse({
          ...row,
          sequence: Number(row.sequence),
          occurred_at: new Date(row.occurred_at).toISOString(),
        });
        if (!context.permissions.includes("costs"))
          event.payload = {
            ...event.payload,
            summary: event.type.replaceAll(".", " "),
            changed_fields: event.payload.changed_fields.filter(
              (key) => publicFields.has(key) || key === "input",
            ),
          };
        return [event];
      });
      const checkpoints: ApprovalCheckpoint[] = [];
      if (context.permissions.includes("approve")) {
        const pending = await db.query<CheckpointRow>(
          "SELECT id,agent_id,thread_id,run_id,tool_call_id,proposal_id,proposal_version,expected_hash,expires_at,status FROM live_interactions WHERE project_id=$1 AND run_id=$2 AND status='pending' ORDER BY expires_at LIMIT 10",
          [context.project_id, context.run_id],
        );
        for (const row of pending.rows)
          checkpoints.push(
            checkpointSchema.parse({
              ...row,
              expires_at: new Date(row.expires_at).toISOString(),
              status:
                new Date(row.expires_at).getTime() <=
                new Date(context.trusted_time).getTime()
                  ? "expired"
                  : row.status,
            }),
          );
      }
      return liveStateSchema.parse({ snapshot, events, checkpoints });
    });
  }
  async evidence(context: ActorContext, evidenceId: string) {
    return this.transactions.run(async (tx) => {
      const db = this.transactions.client(tx);
      await this.projects.snapshot(context, tx);
      const result = await db.query<EvidenceRow>(
        "SELECT i.id,i.message,i.report_id,COALESCE(m.display_name,'Unknown author') AS author FROM ingestion_inputs i LEFT JOIN members m ON m.project_id=i.project_id AND m.telegram_sender_id=i.message->>'sender_id' WHERE i.project_id=$1 AND i.run_id=$2 AND (i.id=$3 OR EXISTS(SELECT 1 FROM jsonb_array_elements(i.message->'media') item WHERE item->>'id'=$3::text)) LIMIT 1",
        [context.project_id, context.run_id, evidenceId],
      );
      const row = result.rows[0];
      if (!row) throw new GroundError("NOT_FOUND", "Evidence not found");
      const message = normalizedMessageSchema.parse(row.message);
      const docs = message.media.some((media) => media.kind === "document");
      if (docs && !context.permissions.includes("costs"))
        throw new GroundError("FORBIDDEN", "Document evidence is restricted");
      const fileRows = await db.query<{ id: string; content_type: string }>(
        "SELECT id,content_type FROM private_files WHERE project_id=$1 AND run_id=$2 AND id=ANY($3::uuid[]) AND (NOT restricted OR $4)",
        [
          context.project_id,
          context.run_id,
          message.media.map((media) => media.id),
          context.permissions.includes("costs"),
        ],
      );
      const operations =
        (await this.enrichment.history?.(context, evidenceId, tx)) ?? [];
      const eventsResult = await db.query<EventRow>(
        "SELECT * FROM domain_events WHERE project_id=$1 AND run_id=$2 AND ($3=ANY(evidence_ids) OR payload->>'entity_id'=$3::text) ORDER BY sequence LIMIT 100",
        [context.project_id, context.run_id, evidenceId],
      );
      const events = eventsResult.rows
        .filter(
          (event) =>
            context.permissions.includes("costs") ||
            !restrictedEvent.test(String(event.type)),
        )
        .map((event) =>
          eventSchema.parse({
            ...event,
            sequence: Number(event.sequence),
            occurred_at: new Date(event.occurred_at).toISOString(),
          }),
        );
      if (!context.permissions.includes("costs"))
        for (const event of events)
          event.payload = {
            ...event.payload,
            summary: event.type.replaceAll(".", " "),
            changed_fields: event.payload.changed_fields.filter(
              (key) => publicFields.has(key) || key === "input",
            ),
          };
      if (!context.permissions.includes("costs"))
        for (const operation of operations)
          for (const diff of operation.state_diff) {
            diff.before = Object.fromEntries(
              Object.entries(diff.before).filter(([key]) =>
                publicFields.has(key),
              ),
            );
            diff.after = Object.fromEntries(
              Object.entries(diff.after).filter(([key]) =>
                publicFields.has(key),
              ),
            );
          }
      return evidenceDetailSchema.parse({
        id: evidenceId,
        project_id: context.project_id,
        run_id: context.run_id,
        author: String(row.author),
        received_at: message.received_at,
        source_text: message.text,
        transcript:
          (await this.enrichment.transcript?.(
            context,
            String(row.report_id ?? row.id),
            tx,
          )) ?? null,
        attachments: fileRows.rows.map((file) => {
          const media = message.media.find((item) => item.id === file.id);
          return {
            id: file.id,
            kind: media?.kind ?? "document",
            content_type: file.content_type,
            filename: media?.filename ?? null,
          };
        }),
        operations: operations.map((value) =>
          operationResultSchema.parse(value),
        ),
        events,
      });
    });
  }
  /** Called by the decision owner in the same transaction that creates its proposal. */
  async persistCheckpoint(
    context: ActorContext,
    checkpoint: ApprovalCheckpoint,
    tx: TransactionContext,
  ) {
    const value = checkpointSchema.parse(checkpoint);
    await this.projects.snapshot(context, tx);
    if (
      value.thread_id !== `${context.project_id}:${context.run_id}` ||
      value.status !== "pending"
    )
      throw new GroundError("VALIDATION_ERROR", "Invalid checkpoint identity");
    if (value.run_id !== context.run_id)
      throw new GroundError("FORBIDDEN", "Checkpoint run mismatch");
    await this.transactions
      .client(tx)
      .query(
        "INSERT INTO live_interactions(id,project_id,run_id,agent_id,thread_id,tool_call_id,proposal_id,proposal_version,expected_hash,expires_at,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(run_id,proposal_id,proposal_version) DO NOTHING",
        [
          value.id,
          context.project_id,
          value.run_id,
          value.agent_id,
          value.thread_id,
          value.tool_call_id,
          value.proposal_id,
          value.proposal_version,
          value.expected_hash,
          value.expires_at,
          value.status,
        ],
      );
  }
  async checkpoint(context: ActorContext, toolCallId: string) {
    if (!context.permissions.includes("approve"))
      throw new GroundError("FORBIDDEN", "Approval access required");
    const result = await this.transactions.pool.query<CheckpointRow>(
      "SELECT id,agent_id,thread_id,run_id,tool_call_id,proposal_id,proposal_version,expected_hash,expires_at,status FROM live_interactions WHERE project_id=$1 AND run_id=$2 AND tool_call_id=$3",
      [context.project_id, context.run_id, toolCallId],
    );
    const row = result.rows[0];
    if (!row)
      throw new GroundError("NOT_FOUND", "Decision checkpoint not found");
    return checkpointSchema.parse({
      ...row,
      expires_at: new Date(row.expires_at).toISOString(),
    });
  }
}
