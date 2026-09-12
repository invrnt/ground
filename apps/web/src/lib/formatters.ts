import { decimalSchema, timestampSchema, dateSchema } from "@ground/contracts";
export const WEB_LOCALE = "en-GB";
export const PROJECT_TIMEZONE = "America/Bogota";
/** Display only: grouping strings preserves exact decimal digits, including amounts above 2^53. */
export function formatQuantity(value: string | null, unit?: string): string {
  if (value === null) return "Unknown";
  const exact = decimalSchema.parse(value);
  const [whole = "", fraction] = exact.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}${fraction === undefined ? "" : `.${fraction}`}${unit ? ` ${unit}` : ""}`;
}
export function formatMoney(value: string | null): string {
  return value === null ? "Price to confirm" : `COP ${formatQuantity(value)}`;
}
export function formatTimestamp(
  value: string,
  timezone: string = PROJECT_TIMEZONE,
): string {
  return new Intl.DateTimeFormat(WEB_LOCALE, {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestampSchema.parse(value)));
}
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(WEB_LOCALE, {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateSchema.parse(value)}T00:00:00Z`));
}
