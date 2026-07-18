import {
  normalizeDecisionRoom,
  normalizeTrialFeedback,
  type DecisionRoomState,
  type TrialFeedback,
} from "./decision-state";

export const DECISION_STORAGE_KEY = "racket-arsenal:decision-room:v1";

const DECISION_STORAGE_VERSION = 1;
const RECENT_FEEDBACK_LIMIT = 12;

export type StoredDecisionState = {
  room: DecisionRoomState;
  feedback: TrialFeedback[];
};

type StoredDecisionEnvelope = StoredDecisionState & {
  version: typeof DECISION_STORAGE_VERSION;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function emptyStoredDecision(): StoredDecisionState {
  return {
    room: { baselineId: null, slots: [] },
    feedback: [],
  };
}

function normalizeStoredFeedback(value: unknown): TrialFeedback | null {
  if (!isRecord(value)) return null;

  try {
    const feedback = normalizeTrialFeedback({
      racketId: value.racketId,
      control: value.control,
      power: value.power,
      comfort: value.comfort,
      verdict: value.verdict,
      note: value.note,
    });

    const id =
      Number.isSafeInteger(value.id) && (value.id as number) > 0
        ? (value.id as number)
        : undefined;
    const createdAt =
      typeof value.createdAt === "string" &&
      value.createdAt.trim() !== "" &&
      Number.isFinite(Date.parse(value.createdAt))
        ? new Date(value.createdAt).toISOString()
        : undefined;

    return {
      ...feedback,
      ...(id === undefined ? {} : { id }),
      ...(createdAt === undefined ? {} : { createdAt }),
    };
  } catch {
    return null;
  }
}

function normalizeStoredFeedbackList(value: unknown): TrialFeedback[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => ({
      feedback: normalizeStoredFeedback(entry),
      index,
    }))
    .filter(
      (entry): entry is { feedback: TrialFeedback; index: number } =>
        entry.feedback !== null,
    )
    .sort((left, right) => {
      const leftTime = left.feedback.createdAt
        ? Date.parse(left.feedback.createdAt)
        : Number.NEGATIVE_INFINITY;
      const rightTime = right.feedback.createdAt
        ? Date.parse(right.feedback.createdAt)
        : Number.NEGATIVE_INFINITY;
      return rightTime - leftTime || left.index - right.index;
    })
    .slice(0, RECENT_FEEDBACK_LIMIT)
    .map(({ feedback }) => feedback);
}

export function parseStoredDecision(raw: string | null): StoredDecisionState {
  if (!raw) return emptyStoredDecision();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.version !== DECISION_STORAGE_VERSION ||
      !("room" in parsed)
    ) {
      return emptyStoredDecision();
    }

    return {
      room: normalizeDecisionRoom(parsed.room),
      feedback: normalizeStoredFeedbackList(parsed.feedback),
    };
  } catch {
    return emptyStoredDecision();
  }
}

export function serializeStoredDecision({
  room,
  feedback,
}: StoredDecisionState): string {
  const envelope: StoredDecisionEnvelope = {
    version: DECISION_STORAGE_VERSION,
    room: normalizeDecisionRoom(room),
    feedback: normalizeStoredFeedbackList(feedback),
  };

  return JSON.stringify(envelope);
}
