export const messages = {
  close: "Close",
  retry: "Try again",
  loading: "Loading…",
  cancel: "Cancel",
  priceUnknown: "Price to confirm",
  demoRecipient: "Demo recipient",
  signOut: "Sign out",
} as const;
export const statusLabels = {
  processing: "Processing",
  pending: "Pending",
  awaiting_approval: "Awaiting approval",
  sending: "Sending",
  sent: "Sent",
  failed: "Failed",
  uncertain: "Needs reconciliation",
  completed: "Completed",
  blocked: "Blocked",
  connected: "Live",
  disconnected: "Connection lost",
  not_ready: "Not ready",
  synced: "Synced",
  needs_review: "Needs review",
  demo: "Demo",
} as const;
export type Status = keyof typeof statusLabels;
