import type { PurchaseList, ReportSnapshot } from "@ground/contracts";
export function purchaseReportSections(list: PurchaseList): {
  sections: ReportSnapshot["sections"];
  evidence_ids: string[];
} {
  const lines = list.purchases.flatMap((purchase) => [
    `${purchase.reference ?? "Invoice reference unknown"} (${purchase.issuer ?? "issuer unknown"}): ${purchase.status}.${list.can_view_costs ? ` Total: ${purchase.total === null ? "Price to confirm" : `COP ${purchase.total}`}.` : ""}`,
    ...purchase.lines.map(
      (line) =>
        `${line.material_name}: invoiced ${line.quantity} ${line.unit}; physically received ${line.received_quantity} ${line.unit}.`,
    ),
    ...purchase.receipts.map(
      (receipt) =>
        `Receipt ${receipt.id} confirmed ${new Intl.DateTimeFormat("en-GB", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short", hourCycle: "h23" }).format(new Date(receipt.confirmed_at))}.`,
    ),
  ]);
  return {
    sections: [
      {
        title: "Purchases and receipts",
        text:
          (lines.length
            ? lines.join("\n")
            : "No purchases or receipts recorded.") +
          "\nAn invoice does not increase stock. Only a confirmed physical receipt does.",
      },
    ],
    evidence_ids: list.can_view_costs
      ? list.purchases.flatMap((purchase) => purchase.evidence_ids)
      : [],
  };
}
