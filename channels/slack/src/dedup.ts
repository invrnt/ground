/**
 * Short-lived in-process dedup. Slack retries an event when the app does not ack
 * within 3 s, and Socket Mode can redeliver on reconnect.
 *
 * This is a fast path only. The real guarantee is the unique constraint on
 * dedupKey in the core's inbox table (PRD §10). If the process restarts, the core
 * still rejects the duplicate.
 */
export class RecentKeys {
  private readonly seen = new Map<string, number>();

  constructor(private readonly ttlMs = 10 * 60 * 1000, private readonly max = 5000) {}

  /** Returns true if the key was already seen within the TTL. Marks it either way. */
  check(key: string, now = Date.now()): boolean {
    this.sweep(now);
    const hit = this.seen.has(key);
    this.seen.set(key, now);
    return hit;
  }

  private sweep(now: number): void {
    if (this.seen.size < this.max) return;
    for (const [k, t] of this.seen) {
      if (now - t > this.ttlMs) this.seen.delete(k);
    }
    // Still full after expiring: drop oldest insertions.
    while (this.seen.size >= this.max) {
      const oldest = this.seen.keys().next().value;
      if (oldest === undefined) break;
      this.seen.delete(oldest);
    }
  }
}
