import { createHash, randomUUID } from "node:crypto";
import {
  GroundError,
  dateSchema,
  reportSnapshotSchema,
  queryAnswerSchema,
  roleSchema,
  type ActorContext,
  type DomainEvent,
  type ExternalObjectLink,
  type ProjectRepository,
  type ReportService,
  type ReportSnapshot,
  type TransactionContext,
  type CoalescingJobQueue,
} from "@ground/contracts";
import { PgTransactions } from "../../infra/database";
import { permissions } from "../../infra/sessions";
import { reportSections, type ReportReadData } from "./report-content";
import { answerFromSnapshot } from "./queries";
export interface ReportSupplements {
  sources?: (
    context: ActorContext,
    tx: TransactionContext,
  ) => Promise<ReportReadData["sources"]>;
  purchases?: (
    context: ActorContext,
    tx: TransactionContext,
  ) => Promise<{
    sections: ReportSnapshot["sections"];
    evidence_ids: string[];
  }>;
  links?: (
    context: ActorContext,
    tx: TransactionContext,
  ) => Promise<ExternalObjectLink[]>;
  followup?: (
    context: ActorContext,
    tx: TransactionContext,
  ) => Promise<ReportSnapshot["sections"]>;
}
export class ReportingService implements ReportService {
  constructor(
    private readonly deps: {
      transactions: PgTransactions;
      projects: ProjectRepository;
      supplements?: ReportSupplements;
      queue?: CoalescingJobQueue;
    },
  ) {}
  private async audience(context: ActorContext, tx: TransactionContext) {
    const result = await this.deps.transactions
      .client(tx)
      .query<{ roles: unknown }>(
        "SELECT roles FROM members WHERE id=$1 AND project_id=$2",
        [context.actor_id, context.project_id],
      );
    const member = result.rows[0];
    if (!member)
      throw new GroundError("FORBIDDEN", "Project membership required");
    const roles = roleSchema.array().parse(member.roles);
    const trusted = { ...context, roles, permissions: permissions(roles) };
    return {
      context: trusted,
      audience: trusted.permissions.includes("costs")
        ? "financial"
        : "operational",
    };
  }
  async snapshot(
    context: ActorContext,
    date: string,
    tx?: TransactionContext,
  ): Promise<ReportSnapshot> {
    if (!tx)
      return this.deps.transactions.run((current) =>
        this.snapshot(context, date, current),
      );
    dateSchema.parse(date);
    const access = await this.audience(context, tx);
    context = access.context;
    const db = this.deps.transactions.client(tx);
    const state = await this.deps.projects.snapshot(context, tx);
    // Historical dates must be retrieved from stored snapshots, never relabel today's live state.
    if (date !== state.scenario_date) {
      const existing = await db.query<{ snapshot: unknown }>(
        "SELECT snapshot FROM report_snapshots WHERE project_id=$1 AND run_id=$2 AND report_date=$3 AND audience=$4 ORDER BY project_version DESC LIMIT 1",
        [context.project_id, context.run_id, date, access.audience],
      );
      if (!existing.rows[0])
        throw new GroundError("NOT_FOUND", "No report is stored for this date");
      return reportSnapshotSchema.parse(existing.rows[0].snapshot);
    }
    const movements = await db.query<{
      quantity: string;
      unit: string;
      material_name: string;
      created_at: Date;
    }>(
      "SELECT i.quantity::text,i.unit,m.name AS material_name,i.created_at FROM inventory_movements i JOIN materials m ON m.id=i.material_id WHERE i.project_id=$1 AND i.run_id=$2 ORDER BY i.created_at,i.id LIMIT 500",
      [context.project_id, context.run_id],
    );
    const dependencies = await db.query<{
      description: string;
      resolved: boolean;
    }>(
      "SELECT description,resolved FROM dependencies WHERE project_id=$1 AND run_id=$2 ORDER BY id",
      [context.project_id, context.run_id],
    );
    const purchase = this.deps.supplements?.purchases
      ? await this.deps.supplements.purchases(context, tx)
      : {
          sections: [
            {
              title: "Purchases and receipts",
              text: "Purchase records are not connected yet. A recorded invoice does not confirm physical receipt.",
            },
          ],
          evidence_ids: [],
        };
    const sources =
      access.audience === "financial"
        ? ((await this.deps.supplements?.sources?.(context, tx)) ?? [])
        : [];
    if (access.audience !== "financial") {
      state.proposals = [];
      state.requests = [];
      state.decisions = [];
      state.remote_links = [];
    }
    const sections = reportSections(state, {
      movements: movements.rows.map((row) => ({
        ...row,
        created_at: row.created_at.toISOString(),
      })),
      dependencies: dependencies.rows,
      sources,
      purchaseSections: purchase.sections,
    });
    if (access.audience === "financial") {
      const followup = await this.deps.supplements?.followup?.(context, tx);
      if (followup) sections.push(...followup);
    }
    const candidates = [
      ...state.issues.flatMap((issue) =>
        Array.isArray(issue.fields.evidence_ids)
          ? issue.fields.evidence_ids
          : [],
      ),
      ...state.tasks.flatMap((task) =>
        Array.isArray(task.fields.evidence_ids) ? task.fields.evidence_ids : [],
      ),
      ...state.needs.flatMap((need) => need.evidence_ids),
      ...purchase.evidence_ids,
    ];
    const visible = await db.query<{ id: string }>(
      "SELECT id FROM ingestion_inputs WHERE project_id=$1 AND run_id=$2 AND id=ANY($3::uuid[]) AND ($4 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(message->'media') media WHERE media->>'kind'='document')) UNION SELECT id FROM private_files WHERE project_id=$1 AND run_id=$2 AND id=ANY($3::uuid[]) AND ($4 OR NOT restricted)",
      [
        context.project_id,
        context.run_id,
        [...new Set(candidates)],
        access.audience === "financial",
      ],
    );
    const content = {
      sections,
      evidence_ids: visible.rows.map((row) => row.id).sort(),
      source_ids: sources.map((source) => source.id).sort(),
      request_ids: state.requests.map((request) => request.id).sort(),
    };
    const hash = createHash("sha256")
      .update(JSON.stringify(content))
      .digest("hex");
    const previous = await db.query<{ snapshot: unknown }>(
      "SELECT snapshot FROM report_snapshots WHERE project_id=$1 AND run_id=$2 AND report_date=$3 AND audience=$4 AND content_hash=$5 ORDER BY project_version DESC LIMIT 1",
      [context.project_id, context.run_id, date, access.audience, hash],
    );
    if (previous.rows[0])
      return reportSnapshotSchema.parse(previous.rows[0].snapshot);
    const snapshot = reportSnapshotSchema.parse({
      id: randomUUID(),
      project_id: context.project_id,
      run_id: context.run_id,
      date,
      version: state.project_version,
      generated_at: context.trusted_time,
      ...content,
      links: [],
    });
    const inserted = await db.query<{ snapshot: unknown }>(
      "INSERT INTO report_snapshots(id,project_id,run_id,report_date,project_version,audience,content_hash,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(project_id,run_id,report_date,project_version,audience) DO UPDATE SET snapshot=report_snapshots.snapshot RETURNING snapshot",
      [
        snapshot.id,
        context.project_id,
        context.run_id,
        date,
        state.project_version,
        access.audience,
        hash,
        snapshot,
      ],
    );
    return reportSnapshotSchema.parse(inserted.rows[0]?.snapshot);
  }
  async version(context: ActorContext, date: string, version: number) {
    return this.deps.transactions.run(async (tx) => {
      const access = await this.audience(context, tx);
      await this.deps.projects.snapshot(access.context, tx);
      const result = await this.deps.transactions
        .client(tx)
        .query<{ snapshot: unknown }>(
          "SELECT snapshot FROM report_snapshots WHERE project_id=$1 AND run_id=$2 AND report_date=$3 AND project_version=$4 AND audience=$5",
          [
            context.project_id,
            context.run_id,
            dateSchema.parse(date),
            version,
            access.audience,
          ],
        );
      if (!result.rows[0])
        throw new GroundError(
          "NOT_FOUND",
          "Report version not found for this role",
        );
      return reportSnapshotSchema.parse(result.rows[0].snapshot);
    });
  }
  async links(context: ActorContext) {
    return this.deps.transactions.run(async (tx) => {
      const access = await this.audience(context, tx);
      await this.deps.projects.snapshot(access.context, tx);
      return access.audience === "financial"
        ? ((await this.deps.supplements?.links?.(access.context, tx)) ?? [])
        : [];
    });
  }
  async query(context: ActorContext, text: string, locale: "en" | "es" = "en") {
    return this.deps.transactions.run(async (tx) => {
      const access = await this.audience(context, tx);
      const snapshot = await this.deps.projects.snapshot(access.context, tx);
      const answer = answerFromSnapshot(snapshot, text, locale);
      const candidates = [...snapshot.issues, ...snapshot.tasks]
        .flatMap((item) =>
          Array.isArray(item.fields.evidence_ids)
            ? item.fields.evidence_ids
            : [],
        )
        .concat(snapshot.needs.flatMap((need) => need.evidence_ids));
      const visible = await this.deps.transactions
        .client(tx)
        .query<{ id: string }>(
          "SELECT id FROM private_files WHERE project_id=$1 AND run_id=$2 AND id=ANY($3::uuid[]) AND (NOT restricted OR $4) UNION SELECT id FROM ingestion_inputs WHERE project_id=$1 AND run_id=$2 AND id=ANY($3::uuid[]) AND ($4 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(message->'media') media WHERE media->>'kind'='document'))",
          [
            context.project_id,
            context.run_id,
            [...new Set(candidates)],
            access.audience === "financial",
          ],
        );
      return queryAnswerSchema.parse({
        ...answer,
        version: snapshot.project_version,
        evidence_ids: visible.rows.map((row) => row.id),
        source_ids: [],
      });
    });
  }
  async answer(context: ActorContext, text: string): Promise<{ text: string }> {
    const answer = await this.query(context, text, "es");
    return {
      text:
        answer.answer +
        (answer.evidence_ids.length
          ? `\nEvidencia: ${answer.evidence_ids.map((id) => `/projects/${context.project_id}/evidence/${id}`).join(", ")}`
          : ""),
    };
  }
  async poll(): Promise<void> {
    if (!this.deps.queue) return;
    const runs = await this.deps.transactions.pool.query<{
      project_id: string;
      run_id: string;
    }>(
      "SELECT r.project_id,r.id AS run_id FROM scenario_runs r WHERE r.status='active' AND EXISTS(SELECT 1 FROM domain_events e LEFT JOIN report_event_cursors c ON c.project_id=e.project_id AND c.run_id=e.run_id WHERE e.project_id=r.project_id AND e.run_id=r.id AND e.type=ANY($1::text[]) AND e.sequence>COALESCE(c.event_sequence,0)) ORDER BY r.created_at LIMIT 10",
      [[...REPORT_CONTENT_EVENTS]],
    );
    for (const run of runs.rows)
      await this.deps.transactions.run(async (tx) => {
        const db = this.deps.transactions.client(tx);
        const active = await db.query(
          "SELECT id FROM scenario_runs WHERE id=$1 AND project_id=$2 AND status='active' FOR UPDATE",
          [run.run_id, run.project_id],
        );
        if (!active.rowCount) return;
        await db.query(
          "INSERT INTO report_event_cursors(project_id,run_id,event_sequence) VALUES($1,$2,0) ON CONFLICT DO NOTHING",
          [run.project_id, run.run_id],
        );
        const cursor = await db.query<{
          event_sequence: string;
          last_report_id: string | null;
        }>(
          "SELECT event_sequence,last_report_id FROM report_event_cursors WHERE project_id=$1 AND run_id=$2 FOR UPDATE",
          [run.project_id, run.run_id],
        );
        const latest = await db.query<{
          sequence: string;
          operation_id: string;
        }>(
          "SELECT sequence,operation_id FROM domain_events WHERE project_id=$1 AND run_id=$2 AND type=ANY($3::text[]) AND sequence>$4 ORDER BY sequence DESC LIMIT 1",
          [
            run.project_id,
            run.run_id,
            [...REPORT_CONTENT_EVENTS],
            cursor.rows[0]?.event_sequence ?? "0",
          ],
        );
        const event = latest.rows[0];
        if (!event) return;
        const members = await db.query<{ id: string; roles: unknown }>(
          "SELECT id,roles FROM members WHERE project_id=$1 ORDER BY id",
          [run.project_id],
        );
        const covered = new Set<string>();
        let latestReportId = cursor.rows[0]?.last_report_id ?? null;
        for (const member of members.rows) {
          const roles = roleSchema.array().parse(member.roles);
          const grants = permissions(roles);
          const audience = grants.includes("costs")
            ? "financial"
            : "operational";
          if (covered.has(audience)) continue;
          covered.add(audience);
          const context: ActorContext = {
            actor_id: member.id,
            project_id: run.project_id,
            run_id: run.run_id,
            roles,
            permissions: grants,
            trusted_time: new Date().toISOString(),
          };
          const state = await this.deps.projects.snapshot(context, tx);
          const report = await this.snapshot(context, state.scenario_date, tx);
          if (
            audience === "financial" &&
            report.id !== latestReportId &&
            this.deps.queue
          )
            await this.deps.queue.enqueueLatest(
              {
                job_id: randomUUID(),
                kind: "sync_report",
                project_id: run.project_id,
                run_id: run.run_id,
                operation_id: event.operation_id,
                dedupe_key: `${run.run_id}:sync_report:${run.project_id}:${state.scenario_date}`,
                payload_version: 1,
                payload: {
                  subject_id: report.id,
                  expected_version: report.version,
                },
                status: "pending",
                attempts: 0,
                available_at: context.trusted_time,
                due_at: null,
                lease_owner: null,
                lease_expires_at: null,
                last_error: null,
                condition: null,
                result_reference: report.id,
              },
              tx,
            );
          if (audience === "financial") latestReportId = report.id;
        }
        await db.query(
          "UPDATE report_event_cursors SET event_sequence=$3,last_report_id=$4 WHERE project_id=$1 AND run_id=$2",
          [run.project_id, run.run_id, event.sequence, latestReportId],
        );
      });
  }
  /** Event dispatcher calls only for content changes, using the event's trusted actor context. */
  async onContentEvent(
    context: ActorContext,
    event: DomainEvent,
    tx?: TransactionContext,
  ) {
    if (
      event.project_id !== context.project_id ||
      event.run_id !== context.run_id
    )
      throw new GroundError("FORBIDDEN", "Report event scope mismatch");
    if (!REPORT_CONTENT_EVENTS.has(event.type)) return;
    const state = await this.deps.projects.snapshot(context, tx);
    await this.snapshot(context, state.scenario_date, tx);
  }
}
export const REPORT_CONTENT_EVENTS: ReadonlySet<DomainEvent["type"]> = new Set([
  "work.updated",
  "inventory.changed",
  "issue.updated",
  "assignment.updated",
  "need.changed",
  "operation.corrected",
  "purchase.recorded",
  "receipt.confirmed",
  "research.completed",
  "proposal.created",
  "proposal.changed",
  "proposal.invalidated",
  "approval.recorded",
  "request.sent",
  "request.failed",
  "request.uncertain",
  "request.reply_received",
  "followup.updated",
]);
