import type { PlayStyle, Stage } from "./racket-profiles";

export const matchStages = ["入门", "进阶", "高阶"] as const satisfies readonly Stage[];
export const matchStyles = ["底线相持", "上旋进攻", "全场控制", "抢点快攻", "舒适护臂"] as const satisfies readonly PlayStyle[];
export const matchPriorities = ["均衡", "力量", "旋转", "控制", "手感", "灵活", "护臂"] as const;

export type MatchPriority = (typeof matchPriorities)[number];
export type MatchQuestionStep = 0 | 1 | 2;

export type MatchProfile = {
  stage: Stage;
  style: PlayStyle;
  priority: MatchPriority;
};

export type MatchDraft = {
  step: MatchQuestionStep;
  answers: Partial<MatchProfile>;
  journeyId?: string;
};

/**
 * A committed profile remains usable everywhere while a draft is being edited.
 * The draft is promoted atomically only after the third answer is confirmed.
 */
export type MatchFlowState = {
  committed: MatchProfile | null;
  draft: MatchDraft | null;
};

export type MatchScreenSnapshot =
  | { kind: "idle" }
  | { kind: "question"; draft: MatchDraft }
  | { kind: "result"; profile?: MatchProfile };

export const emptyMatchFlow: MatchFlowState = {
  committed: null,
  draft: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStage(value: unknown): value is Stage {
  return typeof value === "string" && (matchStages as readonly string[]).includes(value);
}

function isStyle(value: unknown): value is PlayStyle {
  return typeof value === "string" && (matchStyles as readonly string[]).includes(value);
}

function isPriority(value: unknown): value is MatchPriority {
  return typeof value === "string" && (matchPriorities as readonly string[]).includes(value);
}

function sanitizeAnswers(value: unknown): Partial<MatchProfile> {
  if (!isRecord(value)) return {};
  return {
    ...(isStage(value.stage) ? { stage: value.stage } : {}),
    ...(isStyle(value.style) ? { style: value.style } : {}),
    ...(isPriority(value.priority) ? { priority: value.priority } : {}),
  };
}

function completeProfile(value: unknown): MatchProfile | null {
  const answers = sanitizeAnswers(value);
  if (!answers.stage || !answers.style || !answers.priority) return null;
  return {
    stage: answers.stage,
    style: answers.style,
    priority: answers.priority,
  };
}

function sanitizeStep(value: unknown, answers: Partial<MatchProfile>, committed: MatchProfile | null): MatchQuestionStep {
  const requested = value === 1 || value === 2 ? value : 0;
  if (committed) return requested;
  if (!answers.stage) return 0;
  if (!answers.style) return Math.min(requested, 1) as MatchQuestionStep;
  return requested;
}

function sanitizeDraft(value: unknown, committed: MatchProfile | null): MatchDraft | null {
  if (!isRecord(value)) return null;
  const answers = {
    ...(committed ?? {}),
    ...sanitizeAnswers(value.answers),
  };
  return {
    step: sanitizeStep(value.step, answers, committed),
    answers,
    ...(typeof value.journeyId === "string" && value.journeyId.trim() ? { journeyId: value.journeyId.trim().slice(0, 160) } : {}),
  };
}

export function beginMatchDraft(state: MatchFlowState, step: MatchQuestionStep = 0, journeyId?: string): MatchFlowState {
  return {
    committed: state.committed,
    draft: {
      step,
      answers: { ...(state.committed ?? {}) },
      ...(journeyId ? { journeyId } : {}),
    },
  };
}

export function assignMatchDraftJourney(state: MatchFlowState, journeyId: string): MatchFlowState {
  if (!state.draft || state.draft.journeyId === journeyId) return state;
  return {
    committed: state.committed,
    draft: {
      step: state.draft.step,
      answers: { ...state.draft.answers },
      journeyId,
    },
  };
}

export function resumeOrBeginMatch(state: MatchFlowState): MatchFlowState {
  return state.draft ? state : beginMatchDraft(state);
}

export function cancelMatchDraft(state: MatchFlowState): MatchFlowState {
  return state.draft ? { committed: state.committed, draft: null } : state;
}

/**
 * Moves one step forward. Stale or invalid events are ignored so a rapid
 * double-click cannot skip a question or commit an incomplete profile.
 */
export function answerMatchDraft(
  state: MatchFlowState,
  step: MatchQuestionStep,
  value: string,
): MatchFlowState {
  if (!state.draft || state.draft.step !== step) return state;

  const answers: Partial<MatchProfile> = { ...state.draft.answers };
  if (step === 0) {
    if (!isStage(value)) return state;
    answers.stage = value;
    return { committed: state.committed, draft: { step: 1, answers, ...(state.draft.journeyId ? { journeyId: state.draft.journeyId } : {}) } };
  }
  if (step === 1) {
    if (!isStyle(value)) return state;
    answers.style = value;
    return { committed: state.committed, draft: { step: 2, answers, ...(state.draft.journeyId ? { journeyId: state.draft.journeyId } : {}) } };
  }
  if (!isPriority(value)) return state;
  answers.priority = value;
  const profile = completeProfile(answers);
  if (!profile) {
    const firstMissingStep: MatchQuestionStep = !answers.stage ? 0 : !answers.style ? 1 : 2;
    return { committed: state.committed, draft: { step: firstMissingStep, answers, ...(state.draft.journeyId ? { journeyId: state.draft.journeyId } : {}) } };
  }
  return { committed: profile, draft: null };
}

/** Back from results opens the last question as a draft without uncommitting. */
export function backMatchStep(state: MatchFlowState): MatchFlowState {
  if (!state.draft) return state.committed ? beginMatchDraft(state, 2) : state;
  if (state.draft.step === 0) return state;
  return {
    committed: state.committed,
    draft: {
      step: (state.draft.step - 1) as MatchQuestionStep,
      answers: { ...state.draft.answers },
      ...(state.draft.journeyId ? { journeyId: state.draft.journeyId } : {}),
    },
  };
}

export function snapshotMatchScreen(state: MatchFlowState): MatchScreenSnapshot {
  if (state.draft) {
    return {
      kind: "question",
      draft: {
        step: state.draft.step,
        answers: { ...state.draft.answers },
        ...(state.draft.journeyId ? { journeyId: state.draft.journeyId } : {}),
      },
    };
  }
  return state.committed ? { kind: "result", profile: { ...state.committed } } : { kind: "idle" };
}

/**
 * Restores only the screen/draft represented by a browser history entry.
 * The latest committed profile is deliberately preserved.
 */
export function restoreMatchScreen(state: MatchFlowState, value: unknown, restoreResultProfile = false): MatchFlowState {
  if (!isRecord(value) || typeof value.kind !== "string") return state;
  if (value.kind === "question") {
    const draft = sanitizeDraft(value.draft, state.committed);
    return draft ? { committed: state.committed, draft } : state;
  }
  if (value.kind === "result") {
    const historyProfile = completeProfile(value.profile);
    const committed = restoreResultProfile && !state.committed && historyProfile ? historyProfile : state.committed;
    return committed ? { committed, draft: null } : state;
  }
  if (value.kind === "idle") return { committed: state.committed, draft: null };
  return state;
}

export function serializeMatchFlow(state: MatchFlowState) {
  return {
    version: 2 as const,
    committed: state.committed ? { ...state.committed } : null,
    draft: state.draft
      ? { step: state.draft.step, answers: { ...state.draft.answers }, ...(state.draft.journeyId ? { journeyId: state.draft.journeyId } : {}) }
      : null,
  };
}

/** A display-only result URL must never silently discard a persisted edit draft. */
export function shouldResumeStoredMatchDraft(
  state: MatchFlowState,
  requestedStep: number | undefined,
  hasExplicitResultScreen: boolean,
) {
  return requestedStep === 3 && !hasExplicitResultScreen && state.draft !== null;
}

/** Result pages always edit the last answer; only pushed question pages traverse history. */
export function shouldUseMatchHistoryBack(screen: MatchScreenSnapshot, historyEntryWasPushed: boolean) {
  return historyEntryWasPushed && screen.kind === "question";
}

/**
 * Accepts the v2 shape and safely migrates completed v1 sessions. An
 * incomplete v1 session has no trustworthy step information, so it is not
 * promoted to either a profile or a draft.
 */
export function restoreMatchFlow(value: unknown): MatchFlowState {
  if (!isRecord(value)) return emptyMatchFlow;

  if (value.version === 2) {
    const committed = completeProfile(value.committed);
    return {
      committed,
      draft: sanitizeDraft(value.draft, committed),
    };
  }

  if (value.completed === true) {
    const committed = completeProfile(value);
    return committed ? { committed, draft: null } : emptyMatchFlow;
  }

  return emptyMatchFlow;
}
