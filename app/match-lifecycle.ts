import {
  matchPriorities,
  matchStages,
  matchStyles,
  type MatchProfile,
  type MatchQuestionStep,
  type MatchScreenSnapshot,
} from "./match-flow";
import { appViewIds, type AppRoute } from "./navigation-state";

export const MATCH_JOURNEY_LIFECYCLE_STORAGE_KEY = "paiku-match-journey-lifecycle-v1";
export const MATCH_JOURNEY_LIFECYCLE_VERSION = 1 as const;
export const DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT = 32;

const MAX_MATCH_JOURNEY_LIFECYCLE_LIMIT = 100;
const MAX_SERIALIZED_LIFECYCLE_LENGTH = 256 * 1024;
const MAX_JOURNEY_ID_LENGTH = 160;
const MAX_ROUTE_ID_LENGTH = 240;

export type MatchJourneyOutcome = "complete" | "cancel" | "pause";

export type MatchJourneyDestination = {
  route: AppRoute;
  screen?: MatchScreenSnapshot;
};

export type SettledMatchJourney = {
  journeyId: string;
  outcome: MatchJourneyOutcome;
  settledAt: number;
  destination: MatchJourneyDestination;
};

export type MatchJourneyLifecycle = {
  version: typeof MATCH_JOURNEY_LIFECYCLE_VERSION;
  /** Newest settlement first; each journey id appears at most once. */
  records: SettledMatchJourney[];
};

export type SettleMatchJourneyInput = SettledMatchJourney;

export const emptyMatchJourneyLifecycle: MatchJourneyLifecycle = {
  version: MATCH_JOURNEY_LIFECYCLE_VERSION,
  records: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedLimit(value: number) {
  if (!Number.isSafeInteger(value) || value < 1) return DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT;
  return Math.min(value, MAX_MATCH_JOURNEY_LIFECYCLE_LIMIT);
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001F\u007F\uFFFD]/u.test(trimmed)) return null;
  return Array.from(trimmed).slice(0, maxLength).join("");
}

function normalizeRoute(value: unknown): AppRoute | null {
  if (!isRecord(value) || typeof value.view !== "string" || !appViewIds.includes(value.view as AppRoute["view"])) {
    return null;
  }

  const route: AppRoute = { view: value.view as AppRoute["view"] };
  const familyId = cleanText(value.familyId, MAX_ROUTE_ID_LENGTH);
  const racketId = cleanText(value.racketId, MAX_ROUTE_ID_LENGTH);
  if (familyId) route.familyId = familyId;
  if (racketId) route.racketId = racketId;

  if (
    route.view === "match"
    && !route.familyId
    && !route.racketId
    && (value.matchStep === 0 || value.matchStep === 1 || value.matchStep === 2 || value.matchStep === 3)
  ) {
    route.matchStep = value.matchStep;
  }
  return route;
}

function normalizeProfile(value: unknown): MatchProfile | null {
  if (!isRecord(value)) return null;
  if (!(matchStages as readonly unknown[]).includes(value.stage)) return null;
  if (!(matchStyles as readonly unknown[]).includes(value.style)) return null;
  if (!(matchPriorities as readonly unknown[]).includes(value.priority)) return null;
  return {
    stage: value.stage as MatchProfile["stage"],
    style: value.style as MatchProfile["style"],
    priority: value.priority as MatchProfile["priority"],
  };
}

function normalizeQuestionScreen(value: Record<string, unknown>): MatchScreenSnapshot | null {
  if (!isRecord(value.draft)) return null;
  const answersValue = isRecord(value.draft.answers) ? value.draft.answers : {};
  const answers: Partial<MatchProfile> = {
    ...((matchStages as readonly unknown[]).includes(answersValue.stage)
      ? { stage: answersValue.stage as MatchProfile["stage"] }
      : {}),
    ...((matchStyles as readonly unknown[]).includes(answersValue.style)
      ? { style: answersValue.style as MatchProfile["style"] }
      : {}),
    ...((matchPriorities as readonly unknown[]).includes(answersValue.priority)
      ? { priority: answersValue.priority as MatchProfile["priority"] }
      : {}),
  };
  const requestedStep: MatchQuestionStep = value.draft.step === 1 || value.draft.step === 2 ? value.draft.step : 0;
  const step: MatchQuestionStep = !answers.stage
    ? 0
    : !answers.style
      ? Math.min(requestedStep, 1) as MatchQuestionStep
      : requestedStep;
  const journeyId = cleanText(value.draft.journeyId, MAX_JOURNEY_ID_LENGTH);
  return {
    kind: "question",
    draft: {
      step,
      answers,
      ...(journeyId ? { journeyId } : {}),
    },
  };
}

function normalizeScreen(value: unknown): MatchScreenSnapshot | null {
  if (!isRecord(value)) return null;
  if (value.kind === "idle") return { kind: "idle" };
  if (value.kind === "question") return normalizeQuestionScreen(value);
  if (value.kind === "result") {
    const profile = normalizeProfile(value.profile);
    return { kind: "result", ...(profile ? { profile } : {}) };
  }
  return null;
}

function normalizeSettledAt(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function normalizeOutcome(value: unknown): MatchJourneyOutcome | null {
  return value === "complete" || value === "cancel" || value === "pause" ? value : null;
}

function normalizeJourney(value: unknown): SettledMatchJourney | null {
  if (!isRecord(value) || !isRecord(value.destination)) return null;
  const journeyId = cleanText(value.journeyId, MAX_JOURNEY_ID_LENGTH);
  const outcome = normalizeOutcome(value.outcome);
  const settledAt = normalizeSettledAt(value.settledAt);
  const route = normalizeRoute(value.destination.route);
  if (!journeyId || !outcome || settledAt === null || !route) return null;

  const screen = value.destination.screen === undefined ? null : normalizeScreen(value.destination.screen);
  if (value.destination.screen !== undefined && !screen) return null;
  return {
    journeyId,
    outcome,
    settledAt,
    destination: {
      route,
      ...(screen ? { screen } : {}),
    },
  };
}

function parseLifecycle(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (value.length > MAX_SERIALIZED_LIFECYCLE_LENGTH) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function normalizeCandidates(values: readonly unknown[], limit: number): MatchJourneyLifecycle {
  const candidates = values
    .map((value, order) => ({ record: normalizeJourney(value), order }))
    .filter((item): item is { record: SettledMatchJourney; order: number } => Boolean(item.record))
    .sort((left, right) => right.record.settledAt - left.record.settledAt || left.order - right.order);
  const seen = new Set<string>();
  const records: SettledMatchJourney[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.record.journeyId)) continue;
    seen.add(candidate.record.journeyId);
    records.push(candidate.record);
    if (records.length >= normalizedLimit(limit)) break;
  }
  return { version: MATCH_JOURNEY_LIFECYCLE_VERSION, records };
}

/** Restores untrusted storage without mutating it; malformed or future versions fail closed. */
export function normalizeMatchJourneyLifecycle(
  value: unknown,
  limit = DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT,
): MatchJourneyLifecycle {
  const parsed = parseLifecycle(value);
  if (
    !isRecord(parsed)
    || parsed.version !== MATCH_JOURNEY_LIFECYCLE_VERSION
    || !Array.isArray(parsed.records)
  ) {
    return { ...emptyMatchJourneyLifecycle, records: [] };
  }
  return normalizeCandidates(parsed.records, limit);
}

/** Combines session/local copies and lets the newest record for a journey win. */
export function mergeMatchJourneyLifecycles(
  values: readonly unknown[],
  limit = DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT,
): MatchJourneyLifecycle {
  const records = values.flatMap((value) => normalizeMatchJourneyLifecycle(value, MAX_MATCH_JOURNEY_LIFECYCLE_LIMIT).records);
  return normalizeCandidates(records, limit);
}

/** Adds or replaces one closed journey. `settledAt` is supplied by the caller to keep this helper pure. */
export function settleMatchJourney(
  value: unknown,
  settlement: SettleMatchJourneyInput,
  limit = DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT,
): MatchJourneyLifecycle {
  const record = normalizeJourney(settlement);
  if (!record) throw new TypeError("A settled Match journey requires a valid id, outcome, timestamp and destination route");
  const current = normalizeMatchJourneyLifecycle(value, MAX_MATCH_JOURNEY_LIFECYCLE_LIMIT);
  return normalizeCandidates([record, ...current.records], limit);
}

/** Looks up the redirect destination for an old browser-history entry. */
export function findSettledMatchJourney(value: unknown, journeyId: unknown): SettledMatchJourney | null {
  const normalizedId = cleanText(journeyId, MAX_JOURNEY_ID_LENGTH);
  if (!normalizedId) return null;
  return normalizeMatchJourneyLifecycle(value, MAX_MATCH_JOURNEY_LIFECYCLE_LIMIT).records.find((record) => record.journeyId === normalizedId) ?? null;
}

/**
 * Removes a tombstone only after its browser entries are known to be
 * unreachable. A paused draft should normally resume under a new journey id.
 */
export function forgetSettledMatchJourney(
  value: unknown,
  journeyId: unknown,
  limit = DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT,
): MatchJourneyLifecycle {
  const current = normalizeMatchJourneyLifecycle(value, MAX_MATCH_JOURNEY_LIFECYCLE_LIMIT);
  const normalizedId = cleanText(journeyId, MAX_JOURNEY_ID_LENGTH);
  if (!normalizedId || !current.records.some((record) => record.journeyId === normalizedId)) {
    return normalizeCandidates(current.records, limit);
  }
  return normalizeCandidates(current.records.filter((record) => record.journeyId !== normalizedId), limit);
}

export function serializeMatchJourneyLifecycle(
  value: unknown,
  limit = DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT,
) {
  return JSON.stringify(normalizeMatchJourneyLifecycle(value, limit));
}
