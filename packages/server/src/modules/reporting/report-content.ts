import type { ProjectSnapshot, ReportSnapshot } from "@ground/contracts";
export interface ReportReadData {
  movements: {
    quantity: string;
    unit: string;
    material_name: string;
    created_at: string;
  }[];
  dependencies: { description: string; resolved: boolean }[];
  sources: { id: string; url: string; title: string | null }[];
  purchaseSections: ReportSnapshot["sections"];
}
const field = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : "Unknown";
export function reportSections(
  snapshot: ProjectSnapshot,
  data: ReportReadData,
): ReportSnapshot["sections"] {
  const member = (id: unknown) =>
    field(
      snapshot.members.find((member) => member.id === id)?.fields.display_name,
    );
  const material = (id: string) =>
    field(snapshot.stock.find((item) => item.id === id)?.fields.name);
  const due = (value: unknown) =>
    typeof value === "string"
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: snapshot.timezone ?? "America/Bogota",
          dateStyle: "medium",
          timeStyle: "short",
          hourCycle: "h23",
        }).format(new Date(value))
      : "Unknown";
  const lines = (values: string[], empty: string) =>
    values.length ? values.join("\n") : empty;
  const restricted = snapshot.proposals.length || snapshot.requests.length;
  return [
    {
      title: "Project and source version",
      text: `${snapshot.project_name ?? "Project"}\nScenario ${snapshot.scenario_version} / ${snapshot.scenario_date}\nTimezone: ${snapshot.timezone ?? "America/Bogota"}\nDemo records. Reported progress is not technical certification.`,
    },
    {
      title: "Progress and remaining work",
      text: `Reported progress: ${snapshot.reported_progress ?? "Unknown"}%\n${lines(
        snapshot.work.map(
          (item) => `${field(item.fields.name)}: ${field(item.fields.status)}`,
        ),
        "No work plan configured.",
      )}`,
    },
    {
      title: "Inventory and movements",
      text:
        lines(
          snapshot.stock.map(
            (item) =>
              `${field(item.fields.name)} (${field(item.fields.code)}): ${field(item.fields.quantity)} ${field(item.fields.unit)}`,
          ),
          "No inventory recorded.",
        ) +
        "\n" +
        lines(
          data.movements.map(
            (item) =>
              `${item.material_name}: ${item.quantity} ${item.unit} at ${due(item.created_at)}`,
          ),
          "No inventory movements recorded.",
        ),
    },
    {
      title: "Material needs",
      text: lines(
        snapshot.needs.map(
          (need) =>
            `${material(need.material_id)}: ${need.net_quantity} ${field(snapshot.stock.find((item) => item.id === need.material_id)?.fields.unit)} required by ${need.required_date}; usable ${need.usable_stock}, committed in time ${need.committed_stock}.`,
        ),
        "No material needs recorded.",
      ),
    },
    ...data.purchaseSections,
    {
      title: "Issues and assigned reviews",
      text:
        lines(
          snapshot.issues.map(
            (issue) =>
              `${field(issue.fields.description)}: ${field(issue.fields.status)}. ${field(issue.fields.observed_condition)}${typeof issue.fields.resolution_note === "string" ? ` Resolution: ${issue.fields.resolution_note}` : ""}`,
          ),
          "No issues recorded.",
        ) +
        "\n" +
        lines(
          snapshot.tasks.map(
            (task) =>
              `${member(task.fields.assignee_id)}: ${field(task.fields.status)}; due ${due(task.fields.due_at)}.`,
          ),
          "No assignments recorded.",
        ),
    },
    {
      title: "Dependencies",
      text: lines(
        data.dependencies.map(
          (item) =>
            `${item.description}: ${item.resolved ? "resolved" : "blocking"}`,
        ),
        "No dependencies recorded.",
      ),
    },
    {
      title: "Research sources",
      text: lines(
        data.sources.map(
          (source) => `${source.title ?? "Source"}\n${source.url}`,
        ),
        "No visible research sources recorded.",
      ),
    },
    {
      title: "Requests and follow-up",
      text: restricted
        ? lines(
            [
              ...snapshot.proposals.map(
                (proposal) =>
                  `Proposal ${proposal.id}, version ${proposal.version}: ${proposal.status}. A quote request is not a confirmed purchase.`,
              ),
              ...snapshot.requests.map(
                (request) =>
                  `Request ${request.id}: ${request.status}. ${request.status === "uncertain" ? "Reconciliation is required before any further send." : ""}`,
              ),
            ],
            "No visible requests recorded.",
          )
        : "No visible requests recorded. A quote request is not a purchase or a receipt.",
    },
  ];
}
