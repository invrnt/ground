import {
  dateSchema,
  idSchema,
  queryInputSchema,
  externalObjectLinkSchema,
  GroundError,
} from "@ground/contracts";
import type { Sessions } from "../../infra/sessions";
import type { ServerModule } from "../../composition";
import { ReportingService } from "./report-service";
import { renderReportHtml, renderReportPdf } from "./renderers";
export * from "./report-service";
export * from "./renderers";
export * from "./purchase-sections";
export function reportingModule(
  service: ReportingService,
  sessions: Sessions,
): ServerModule & { poll: () => Promise<void> } {
  return {
    poll: () => service.poll(),
    name: "reporting",
    registerRoutes: async (app) => {
      app.post<{ Params: { p: string } }>(
        "/api/projects/:p/queries",
        async (request) => {
          await sessions.mutation(request);
          const context = await sessions.context(
            request,
            idSchema.parse(request.params.p),
          );
          return service.query(
            context,
            queryInputSchema.parse(request.body).text,
          );
        },
      );
      app.get<{
        Params: { p: string; date: string };
        Querystring: { version?: string };
      }>("/api/projects/:p/reports/:date", async (request, reply) => {
        const context = await sessions.context(
          request,
          idSchema.parse(request.params.p),
        );
        const date = dateSchema.parse(request.params.date);
        const version =
          request.query.version === undefined
            ? undefined
            : Number(request.query.version);
        if (
          version !== undefined &&
          (!Number.isSafeInteger(version) || version < 0)
        )
          throw new GroundError("VALIDATION_ERROR", "Invalid report version");
        const report =
          version === undefined
            ? await service.snapshot(context, date)
            : await service.version(context, date, version);
        reply.header("Cache-Control", "private, no-store");
        if (request.headers.accept?.includes("text/html"))
          return reply
            .type("text/html")
            .send(renderReportHtml(report, sessions.origin));
        return report;
      });
      app.get<{
        Params: { p: string; date: string };
        Querystring: { version?: string };
      }>("/api/projects/:p/reports/:date.pdf", async (request, reply) => {
        const context = await sessions.context(
          request,
          idSchema.parse(request.params.p),
        );
        const date = dateSchema.parse(request.params.date);
        const version = Number(request.query.version);
        if (!Number.isSafeInteger(version) || version < 0)
          throw new GroundError(
            "VALIDATION_ERROR",
            "An exact report version is required",
          );
        const report = await service.version(context, date, version);
        return reply
          .header("Cache-Control", "private, no-store")
          .header(
            "Content-Disposition",
            `attachment; filename="ground-${date}-v${version}.pdf"`,
          )
          .header("X-Content-Type-Options", "nosniff")
          .type("application/pdf")
          .send(Buffer.from(await renderReportPdf(report, sessions.origin)));
      });
      app.get<{ Params: { p: string; date: string } }>(
        "/api/projects/:p/reports/:date/links",
        async (request, reply) => {
          const context = await sessions.context(
            request,
            idSchema.parse(request.params.p),
          );
          dateSchema.parse(request.params.date);
          reply.header("Cache-Control", "private, no-store");
          return externalObjectLinkSchema
            .array()
            .parse(
              (await service.links(context)).filter(
                (link) => link.object_kind === "document",
              ),
            );
        },
      );
    },
  };
}
