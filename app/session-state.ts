export const LEGACY_SESSION_STORAGE_KEY = "paiku-session-v1";

export const SESSION_DOMAIN_STORAGE_KEYS = {
  match: "paiku-match-v1",
  compare: "paiku-compare-v1",
  tour: "paiku-tour-v1",
  catalog: "paiku-catalog-v1",
} as const;

export type SessionDomain = keyof typeof SESSION_DOMAIN_STORAGE_KEYS;

const SESSION_DOMAIN_VERSION = 1 as const;
const MAX_SESSION_DOMAIN_LENGTH = 1_000_000;

type SessionDomainEnvelope = {
  version: typeof SESSION_DOMAIN_VERSION;
  value: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Keeps each independently edited product area in its own storage record. */
export function serializeSessionDomain(value: unknown) {
  return JSON.stringify({ version: SESSION_DOMAIN_VERSION, value } satisfies SessionDomainEnvelope);
}

/** Invalid or future records are ignored instead of poisoning the whole session. */
export function parseSessionDomain(raw: string | null): unknown | null {
  if (!raw || raw.length > MAX_SESSION_DOMAIN_LENGTH) return null;
  try {
    const envelope: unknown = JSON.parse(raw);
    if (!isRecord(envelope) || envelope.version !== SESSION_DOMAIN_VERSION || !("value" in envelope)) return null;
    return envelope.value;
  } catch {
    return null;
  }
}

export function sessionValueSignature(value: unknown) {
  return JSON.stringify(value);
}

/**
 * Match, Tour and catalog are tab-local workflows. Compare is intentionally
 * shared across windows, so its localStorage copy wins when both exist.
 * The same rule is used while migrating two conflicting legacy snapshots.
 */
export function selectSessionDomainCopy<T>(
  domain: SessionDomain,
  sessionCopy: T | null,
  localCopy: T | null,
) {
  return domain === "compare"
    ? localCopy ?? sessionCopy
    : sessionCopy ?? localCopy;
}
