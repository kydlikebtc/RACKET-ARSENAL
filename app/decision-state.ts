import { deepRackets } from "./racket-profiles";

export const decisionCandidateStatuses = [
  "candidate",
  "trial",
  "eliminated",
  "final",
] as const;

export type DecisionCandidateStatus =
  (typeof decisionCandidateStatuses)[number];

export type DecisionCandidate = {
  racketId: string;
  status: DecisionCandidateStatus;
  note: string;
};

export type DecisionRoomState = {
  baselineId: string | null;
  slots: DecisionCandidate[];
};

export type TrialFeedback = {
  id?: number;
  racketId: string;
  control: number;
  power: number;
  comfort: number;
  verdict: string;
  note: string;
  createdAt?: string;
};

export class DecisionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecisionValidationError";
  }
}

const knownRacketIds = new Set(deepRackets.map((racket) => racket.id));
const statusSet = new Set<string>(decisionCandidateStatuses);
const activeStatuses = new Set<DecisionCandidateStatus>([
  "candidate",
  "trial",
  "final",
]);

const ROOM_KEYS = ["baselineId", "slots"] as const;
const SLOT_KEYS = ["racketId", "status", "note"] as const;
const FEEDBACK_KEYS = [
  "racketId",
  "control",
  "power",
  "comfort",
  "verdict",
  "note",
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function assertPlainObject(
  value: unknown,
  message: string,
): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) throw new DecisionValidationError(message);
}

function assertOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  message: string,
) {
  if (Object.keys(value).some((key) => !allowed.includes(key))) {
    throw new DecisionValidationError(message);
  }
}

function normalizedKnownRacketId(value: unknown, fieldLabel: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new DecisionValidationError(`请选择${fieldLabel}。`);
  }
  const racketId = value.trim();
  if (!knownRacketIds.has(racketId)) {
    throw new DecisionValidationError(
      `${fieldLabel}已不在当前拍库中，请重新选择。`,
    );
  }
  return racketId;
}

function normalizedOptionalNote(
  value: unknown,
  maxLength: number,
  label = "备注",
) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new DecisionValidationError(`${label}必须是文字。`);
  }
  const note = value.trim();
  if (note.length > maxLength) {
    throw new DecisionValidationError(`${label}最多 ${maxLength} 个字符。`);
  }
  return note;
}

function normalizedRating(value: unknown, label: string) {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 5) {
    throw new DecisionValidationError(`${label}评分请选择 1 到 5 分。`);
  }
  return value as number;
}

export function normalizeDecisionRoom(value: unknown): DecisionRoomState {
  assertPlainObject(value, "决策室数据格式不正确，请刷新后重试。");
  assertOnlyKeys(value, ROOM_KEYS, "决策室包含无法识别的内容，请刷新后重试。");

  let baselineId: string | null = null;
  if (value.baselineId !== undefined && value.baselineId !== null) {
    baselineId = normalizedKnownRacketId(value.baselineId, "当前用拍");
  }

  if (!Array.isArray(value.slots)) {
    throw new DecisionValidationError("候选球拍列表格式不正确，请重新选择。");
  }
  if (value.slots.length > 12) {
    throw new DecisionValidationError("决策室最多保留 12 条候选记录。");
  }

  const slots = value.slots.map((slot, index) => {
    assertPlainObject(slot, `第 ${index + 1} 个候选的数据格式不正确。`);
    assertOnlyKeys(
      slot,
      SLOT_KEYS,
      `第 ${index + 1} 个候选包含无法识别的内容。`,
    );
    const racketId = normalizedKnownRacketId(
      slot.racketId,
      `第 ${index + 1} 个候选球拍`,
    );
    if (typeof slot.status !== "string" || !statusSet.has(slot.status)) {
      throw new DecisionValidationError(
        `第 ${index + 1} 个候选的状态不正确，请重新选择。`,
      );
    }
    return {
      racketId,
      status: slot.status as DecisionCandidateStatus,
      note: normalizedOptionalNote(slot.note, 120),
    };
  });

  if (new Set(slots.map((slot) => slot.racketId)).size !== slots.length) {
    throw new DecisionValidationError("同一支球拍不能重复加入决策室。");
  }
  if (baselineId && slots.some((slot) => slot.racketId === baselineId)) {
    throw new DecisionValidationError("当前用拍无需重复加入候选列表。");
  }
  if (slots.filter((slot) => activeStatuses.has(slot.status)).length > 3) {
    throw new DecisionValidationError("决策室最多保留 3 个有效候选。");
  }
  if (slots.filter((slot) => slot.status === "final").length > 1) {
    throw new DecisionValidationError("一次决策只能选定 1 支最终球拍。");
  }

  return { baselineId, slots };
}

export function normalizeDecisionRoomRequest(value: unknown): DecisionRoomState {
  assertPlainObject(value, "请求格式不正确，请刷新后重试。");
  assertOnlyKeys(value, ["room"], "请求包含无法识别的内容，请刷新后重试。");
  if (!("room" in value)) {
    throw new DecisionValidationError("请提供要保存的决策室内容。");
  }
  return normalizeDecisionRoom(value.room);
}

export function normalizeTrialFeedback(value: unknown): TrialFeedback {
  assertPlainObject(value, "试打反馈格式不正确，请重新填写。");
  assertOnlyKeys(
    value,
    FEEDBACK_KEYS,
    "试打反馈包含无法识别的内容，请重新填写。",
  );
  const verdict =
    typeof value.verdict === "string" ? value.verdict.trim() : "";
  if (!verdict) {
    throw new DecisionValidationError("请选择本次试打结论。");
  }
  if (verdict.length > 40) {
    throw new DecisionValidationError("试打结论最多 40 个字符。");
  }

  return {
    racketId: normalizedKnownRacketId(value.racketId, "试打球拍"),
    control: normalizedRating(value.control, "控制"),
    power: normalizedRating(value.power, "力量"),
    comfort: normalizedRating(value.comfort, "舒适"),
    verdict,
    note: normalizedOptionalNote(value.note, 240, "试打备注"),
  };
}

export function normalizeTrialFeedbackRequest(value: unknown): TrialFeedback {
  assertPlainObject(value, "请求格式不正确，请刷新后重试。");
  assertOnlyKeys(
    value,
    ["feedback"],
    "请求包含无法识别的内容，请刷新后重试。",
  );
  if (!("feedback" in value)) {
    throw new DecisionValidationError("请提供要保存的试打反馈。");
  }
  return normalizeTrialFeedback(value.feedback);
}
