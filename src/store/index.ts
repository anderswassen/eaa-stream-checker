import type { AuditResult, AuditStore } from "../types/audit.js";
import { PgStore } from "./pg-store.js";

/**
 * Wraps PgStore behind the AuditStore interface so existing
 * routes (scan, report) work without changes. Writes go to both the
 * in-memory cache and PostgreSQL. Reads hit cache first, then DB.
 */
export class PersistentStore implements AuditStore {
  private cache = new Map<string, AuditResult>();
  readonly pg: PgStore;

  constructor(connectionString: string) {
    this.pg = new PgStore(connectionString);
  }

  async init(): Promise<void> {
    await this.pg.init();
  }

  async close(): Promise<void> {
    await this.pg.close();
  }

  /** Writes to cache immediately, persists to PG async. */
  set(id: string, audit: AuditResult): this {
    this.cache.set(id, audit);
    // Persist asynchronously — don't block the caller
    this.pg.set(id, audit).catch((err) => {
      console.error(`[PersistentStore] Failed to persist scan ${id}:`, err);
    });
    return this;
  }

  /** Cache first, no async fallback (scan routes need sync). */
  get(id: string): AuditResult | undefined {
    return this.cache.get(id);
  }

  /** Async get that falls back to PG (used by report route). */
  async getAsync(id: string): Promise<AuditResult | undefined> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const fromDb = await this.pg.get(id);
    if (fromDb) {
      this.cache.set(id, fromDb);
    }
    return fromDb;
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  values(): IterableIterator<AuditResult> {
    return this.cache.values();
  }
}

export function isPersistedStore(store: AuditStore): store is PersistentStore {
  return store instanceof PersistentStore;
}
