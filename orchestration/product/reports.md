# Queries and reports

Owner: `reporting`. Requirements: RF15, RF16.

Answer `¿Qué falta para mañana?` from current persisted plan, stock, due assignments and procurement needs. The baseline response identifies 20 tile boxes and Juan's review with source/evidence links and the requested date. Query permissions apply to the response, including Telegram replies and web chat. Do not invent a plan or use remembered model balances.

Assumption: support this question and direct inventory, progress, open-issue and task queries through bounded read functions. Clarify unsupported questions rather than implementing unrestricted database chat. All answers declare their snapshot version and preserve recoverable error states.

Build one ReportSnapshot per requested project/run/date/version. It includes progress and remaining work, inventory movements and needs, purchase/receipt distinction, issue and assignment with deadline, dependencies, research sources, proposal/send status, follow-up and evidence links. Record generated time and project version.

Render HTML and PDF from the same DTO. Provide a server PDF download with legible wrapping and the same dates, quantities, amounts and status. office-sync transforms the same DTO into the managed Ambiguous document section; it does not re-query or recalculate its own report.

A report can display local version N while Ambiguous is syncing N. Once read-back succeeds, show its URL and synced version. The main scenario's task creation and final send update the same document. Original media remain protected; link to evidence views rather than embedding bearer URLs in a public report.

Expose the query widget and report view as registered features. Other modules call `ReportService` and use its snapshot contract. No separate PDF-only data model, daily scheduler or template designer is needed.
