import type { ProjectSnapshot } from "@ground/contracts";
export function classifyQuery(
  text: string,
): "tomorrow" | "inventory" | "progress" | "issues" | "tasks" | "unsupported" {
  const query = text
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/manana|tomorrow/.test(query)) return "tomorrow";
  if (/inventario|stock|inventory|balance|materiales/.test(query))
    return "inventory";
  if (/avance|progreso|progress|complete/.test(query)) return "progress";
  if (/problema|fuga|issue|leak/.test(query)) return "issues";
  if (/tarea|juan|review|task|asign/.test(query)) return "tasks";
  return "unsupported";
}
export function answerFromSnapshot(
  snapshot: ProjectSnapshot,
  text: string,
  locale: "en" | "es",
) {
  const intent = classifyQuery(text);
  const spanish = locale === "es";
  const name = (value: unknown) =>
    typeof value === "string" ? value : spanish ? "Sin nombre" : "Unnamed";
  const status = (value: unknown) => {
    const key = name(value);
    const labels: Record<string, string> = {
      pending: "pendiente",
      in_progress: "en curso",
      scheduled: "programada",
      blocked: "bloqueada",
      completed: "completada",
      cancelled: "cancelada",
      open: "abierta",
      in_review: "en revisión",
      resolved: "resuelta",
    };
    return spanish ? (labels[key] ?? key) : key.replaceAll("_", " ");
  };
  const unit = (value: unknown) => {
    const key = name(value);
    return key === "box"
      ? spanish
        ? "cajas"
        : "boxes"
      : key === "bag"
        ? spanish
          ? "sacos"
          : "bags"
        : key;
  };
  const material = (id: string) =>
    name(snapshot.stock.find((item) => item.id === id)?.fields.name);
  const tomorrow = new Date(`${snapshot.scenario_date}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const date = tomorrow.toISOString().slice(0, 10);
  const taskLine = (task: ProjectSnapshot["tasks"][number]) => {
    const member = name(
      snapshot.members.find((item) => item.id === task.fields.assignee_id)
        ?.fields.display_name,
    );
    const due =
      typeof task.fields.due_at === "string"
        ? new Intl.DateTimeFormat(spanish ? "es-CO" : "en-GB", {
            timeZone: snapshot.timezone ?? "America/Bogota",
            dateStyle: "medium",
            timeStyle: "short",
            hourCycle: "h23",
          }).format(new Date(task.fields.due_at))
        : spanish
          ? "por confirmar"
          : "to confirm";
    return `${member}: ${status(task.fields.status)}; ${spanish ? "vence" : "due"} ${due}.`;
  };
  let facts: string[] = [];
  switch (intent) {
    case "tomorrow":
      facts = [
        ...snapshot.work.filter(item=>item.fields.required_date===date&&item.fields.status!=='completed').map(item=>`${name(item.fields.name)}: ${spanish?'programado para':'planned for'} ${date} (${status(item.fields.status)}).`),
        ...snapshot.needs
          .filter((need) => need.required_date === date)
          .map(
            (need) =>
              `${material(need.material_id)}: ${need.net_quantity} ${unit(snapshot.stock.find((item) => item.id === need.material_id)?.fields.unit)} ${spanish ? "por conseguir para" : "needed by"} ${date}.`,
          ),
        ...snapshot.tasks
          .filter(
            (task) =>
              typeof task.fields.due_at === "string" &&
              new Intl.DateTimeFormat("en-CA", {
                timeZone: snapshot.timezone ?? "America/Bogota",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(new Date(task.fields.due_at)) === date &&
              !["completed", "cancelled"].includes(String(task.fields.status)),
          )
          .map(taskLine),
      ];
      break;
    case "inventory":
      facts = snapshot.stock.map(
        (item) =>
          `${name(item.fields.name)}: ${name(item.fields.quantity)} ${unit(item.fields.unit)}.`,
      );
      break;
    case "progress":
      facts = [
        `${spanish ? "Avance reportado" : "Reported progress"}: ${snapshot.reported_progress ?? (spanish ? "desconocido" : "unknown")}%.`,
        ...snapshot.work
          .filter((item) => item.fields.status !== "completed")
          .map(
            (item) =>
              `${name(item.fields.name)}: ${status(item.fields.status)}.`,
          ),
      ];
      break;
    case "issues":
      facts = snapshot.issues
        .filter((item) => item.fields.status !== "resolved")
        .map(
          (item) =>
            `${name(item.fields.description)}: ${status(item.fields.status)}.`,
        );
      break;
    case "tasks":
      facts = snapshot.tasks.map(taskLine);
      break;
    case "unsupported":
      return {
        answer: spanish
          ? "Puedo consultar inventario, avance, problemas abiertos, tareas o lo pendiente para mañana. ¿Cuál necesitas?"
          : "I can check inventory, progress, open issues, tasks or what is needed tomorrow. Which would you like?",
        status: "needs_input" as const,
        date: snapshot.scenario_date,
      };
  }
  return {
    answer:
      (facts.length
        ? facts.join("\n")
        : spanish
          ? "No hay registros pendientes para esta consulta."
          : "No matching pending records are recorded.") +
      `\n${spanish ? "Versión del proyecto" : "Project version"} ${snapshot.project_version}.`,
    status: "answered" as const,
    date: intent === "tomorrow" ? date : snapshot.scenario_date,
  };
}
