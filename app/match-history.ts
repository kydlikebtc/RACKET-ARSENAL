import type { MatchScreenSnapshot } from "./match-flow";
import { parentAppRoute, type AppRoute, type MatchRouteStep } from "./navigation-state";

export type MatchHistoryFocusIdentity = {
  id?: string;
  key?: string;
  ariaLabel?: string;
  text?: string;
};

export type MatchHistoryOrigin = {
  index: number;
  route: AppRoute;
  matchScreen?: MatchScreenSnapshot;
  viewScrollTop?: number;
  focus?: MatchHistoryFocusIdentity;
};

export type MatchHistoryBridgeMarker = {
  journeyId: string;
  afterRoute: AppRoute;
};

export type IndexedPaikuHistoryState = Record<string, unknown> & {
  paiku: true;
  paikuHistoryIndex: number;
};

type CompleteMatchSettlementRequest = {
  outcome: "complete";
  journeyId: string;
  currentIndex: number;
  origin: MatchHistoryOrigin;
  settledScreen: Extract<MatchScreenSnapshot, { kind: "result" }>;
};

type CancelMatchSettlementRequest = {
  outcome: "cancel";
  journeyId: string;
  currentIndex: number;
  origin: MatchHistoryOrigin;
};

export type MatchSettlementRequest = CompleteMatchSettlementRequest | CancelMatchSettlementRequest;

export type MatchSettlementPlan = {
  outcome: MatchSettlementRequest["outcome"];
  journeyId: string;
  currentIndex: number;
  origin: MatchHistoryOrigin;
  travelDelta: number;
  needsBridge: boolean;
  bridge?: {
    index: number;
    route: AppRoute;
    marker: MatchHistoryBridgeMarker;
  };
  destination: {
    index: number;
    route: AppRoute;
    matchScreen?: MatchScreenSnapshot;
  };
};

export type MaterializedMatchSettlement = {
  originReplacement: null | {
    action: "replace";
    index: number;
    route: AppRoute;
    state: IndexedPaikuHistoryState & { paikuHistoryBridge: MatchHistoryBridgeMarker };
  };
  destination: {
    action: "push";
    index: number;
    route: AppRoute;
    state: IndexedPaikuHistoryState;
  };
};

export type ColdMatchHistoryEntry = {
  action: "replace" | "push";
  index: number;
  route: AppRoute;
  state: IndexedPaikuHistoryState;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneRoute(route: AppRoute): AppRoute {
  return { ...route };
}

function cloneMatchScreen(screen: MatchScreenSnapshot): MatchScreenSnapshot {
  if (screen.kind === "idle") return { kind: "idle" };
  if (screen.kind === "result") {
    return {
      kind: "result",
      ...(screen.profile ? { profile: { ...screen.profile } } : {}),
    };
  }
  return {
    kind: "question",
    draft: {
      step: screen.draft.step,
      answers: { ...screen.draft.answers },
      ...(screen.draft.journeyId ? { journeyId: screen.draft.journeyId } : {}),
    },
  };
}

function cloneOrigin(origin: MatchHistoryOrigin): MatchHistoryOrigin {
  return {
    index: normalizeHistoryIndex(origin.index),
    route: cloneRoute(origin.route),
    ...(origin.matchScreen ? { matchScreen: cloneMatchScreen(origin.matchScreen) } : {}),
    ...(typeof origin.viewScrollTop === "number" && Number.isFinite(origin.viewScrollTop)
      ? { viewScrollTop: Math.max(0, origin.viewScrollTop) }
      : {}),
    ...(origin.focus ? { focus: { ...origin.focus } } : {}),
  };
}

/** Browser-history indexes are local monotonic app indexes, never stack offsets. */
export function normalizeHistoryIndex(value: unknown, fallback = 0) {
  const safeFallback = typeof fallback === "number" && Number.isSafeInteger(fallback) && fallback >= 0 ? fallback : 0;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : safeFallback;
}

export function historyIndexFromState(value: unknown, fallback = 0) {
  return isRecord(value) ? normalizeHistoryIndex(value.paikuHistoryIndex, fallback) : normalizeHistoryIndex(undefined, fallback);
}

export function withHistoryIndex<T extends Record<string, unknown>>(state: T, index: number): T & IndexedPaikuHistoryState {
  return {
    ...state,
    paiku: true,
    paikuHistoryIndex: normalizeHistoryIndex(index),
  };
}

export function nextHistoryIndex(currentIndex: number) {
  const current = normalizeHistoryIndex(currentIndex);
  return current < Number.MAX_SAFE_INTEGER ? current + 1 : current;
}

/** Reuses the synthetic recovery entry as question 0, keeping the existing Discover root. */
export function planColdMissingResultRestart(currentIndex: number) {
  const questionIndex = normalizeHistoryIndex(currentIndex);
  return {
    action: "replace" as const,
    questionIndex,
    origin: {
      index: Math.max(0, questionIndex - 1),
      route: { view: "discover" } as AppRoute,
      viewScrollTop: 0,
    },
  };
}

export function routeForMatchScreen(screen: MatchScreenSnapshot): AppRoute {
  if (screen.kind === "idle") return { view: "match" };
  if (screen.kind === "result") return { view: "match", matchStep: 3 };
  return { view: "match", matchStep: screen.draft.step };
}

/**
 * Results are a committed transaction, so their semantic parent is the
 * screen that started the journey rather than the last discarded question.
 */
export function semanticParentAppRoute(route: AppRoute, originRoute?: AppRoute): AppRoute {
  if (route.view === "match" && route.matchStep === 3 && !route.familyId && !route.racketId) {
    return originRoute ? cloneRoute(originRoute) : { view: "match" };
  }
  return parentAppRoute(route);
}

function isMatchResultOrigin(origin: MatchHistoryOrigin) {
  return (
    (origin.route.view === "match" && origin.route.matchStep === 3 && !origin.route.familyId && !origin.route.racketId)
    || origin.matchScreen?.kind === "result"
  );
}

/**
 * Plans the only safe way to remove intermediate question entries: travel
 * back to the journey origin, then push from there so the browser truncates
 * the old forward branch. A bridge is required when the visible origin must
 * itself become the new destination (cancel, or replacing an old result).
 */
export function planMatchSettlement(request: MatchSettlementRequest): MatchSettlementPlan {
  const journeyId = request.journeyId.trim().slice(0, 160);
  if (!journeyId) throw new TypeError("A match settlement requires a journey id");
  if (request.outcome === "complete" && request.settledScreen.kind !== "result") {
    throw new TypeError("A completed match settlement requires a result screen");
  }

  const origin = cloneOrigin(request.origin);
  const currentIndex = normalizeHistoryIndex(request.currentIndex, origin.index);
  const destinationRoute: AppRoute = request.outcome === "cancel"
    ? cloneRoute(origin.route)
    : { view: "match", matchStep: 3 };
  const destinationScreen = request.outcome === "cancel"
    ? origin.matchScreen && cloneMatchScreen(origin.matchScreen)
    : cloneMatchScreen(request.settledScreen);
  const needsBridge = request.outcome === "cancel" || isMatchResultOrigin(origin);
  const destinationIndex = nextHistoryIndex(origin.index);
  const bridge = needsBridge
    ? {
      index: origin.index,
      route: cloneRoute(origin.route),
      marker: {
        journeyId,
        afterRoute: cloneRoute(destinationRoute),
      },
    }
    : undefined;

  return {
    outcome: request.outcome,
    journeyId,
    currentIndex,
    origin,
    travelDelta: origin.index - currentIndex,
    needsBridge,
    ...(bridge ? { bridge } : {}),
    destination: {
      index: destinationIndex,
      route: destinationRoute,
      ...(destinationScreen ? { matchScreen: destinationScreen } : {}),
    },
  };
}

const matchJourneyStateKeys = [
  "paikuMatchPushed",
  "paikuMatchScreen",
  "paikuMatchJourneyId",
  "paikuMatchJourneyDepth",
  "paikuMatchOrigin",
  "paikuCancelledMatchJourney",
  "paikuMatchRecovery",
  "paikuHistoryBridge",
] as const;

const overlayStateKeys = [
  "paikuFamilyTargetId",
  "paikuFamilyScrollTop",
  "paikuFamilyMatrixScrollLeft",
  "paikuFamilyRevealTarget",
  "paikuRacketScrollTop",
  "paikuPendingCompareId",
] as const;

export function stripMatchJourneyState(value: unknown) {
  const state = isRecord(value) ? { ...value } : {};
  for (const key of matchJourneyStateKeys) delete state[key];
  return state;
}

function cleanDestinationState(value: unknown, route: AppRoute) {
  const state = stripMatchJourneyState(value);
  if (!route.familyId && !route.racketId) {
    for (const key of overlayStateKeys) delete state[key];
    state.paikuOverlayPushed = false;
  }
  return state;
}

function applyOriginViewport(state: Record<string, unknown>, origin: MatchHistoryOrigin) {
  if (origin.viewScrollTop !== undefined) state.paikuViewScrollTop = origin.viewScrollTop;
  if (origin.focus) state.paikuFocus = { ...origin.focus };
  else if (origin.focus === undefined) delete state.paikuFocus;
  return state;
}

function makeDestinationState(
  plan: MatchSettlementPlan,
  originState: unknown,
): IndexedPaikuHistoryState {
  const state = cleanDestinationState(originState, plan.destination.route);
  state.paikuMatchPushed = false;
  if (plan.destination.matchScreen) {
    const screen = cloneMatchScreen(plan.destination.matchScreen);
    state.paikuMatchScreen = screen;
    if (screen.kind === "question" && screen.draft.journeyId) {
      state.paikuMatchJourneyId = screen.draft.journeyId;
    }
  }
  if (plan.outcome === "cancel") applyOriginViewport(state, plan.origin);
  else {
    state.paikuViewScrollTop = 0;
    delete state.paikuFocus;
  }
  return withHistoryIndex(state, plan.destination.index);
}

/** Materializes the replace/push operations after traversal reaches origin. */
export function materializeMatchSettlement(
  plan: MatchSettlementPlan,
  originState: unknown,
): MaterializedMatchSettlement {
  const originReplacement = plan.bridge
    ? {
      action: "replace" as const,
      index: plan.bridge.index,
      route: cloneRoute(plan.bridge.route),
      state: {
        ...withHistoryIndex(cleanDestinationState(originState, plan.bridge.route), plan.bridge.index),
        paikuHistoryBridge: {
          journeyId: plan.bridge.marker.journeyId,
          afterRoute: cloneRoute(plan.bridge.marker.afterRoute),
        },
      },
    }
    : null;

  return {
    originReplacement,
    destination: {
      action: "push",
      index: plan.destination.index,
      route: cloneRoute(plan.destination.route),
      state: makeDestinationState(plan, originState),
    },
  };
}

/**
 * A bridge is never rendered. Entering it with Back continues backward;
 * entering it with Forward continues forward to its replacement screen.
 */
export function bridgeSkipDelta(fromIndex: number, bridgeIndex: number): -1 | 0 | 1 {
  const from = normalizeHistoryIndex(fromIndex);
  const bridge = normalizeHistoryIndex(bridgeIndex);
  if (from > bridge) return -1;
  if (from < bridge) return 1;
  return 0;
}

function questionScreenAt(
  screen: Extract<MatchScreenSnapshot, { kind: "question" }>,
  step: 0 | 1 | 2,
): Extract<MatchScreenSnapshot, { kind: "question" }> {
  return {
    kind: "question",
    draft: {
      step,
      answers: { ...screen.draft.answers },
      ...(screen.draft.journeyId ? { journeyId: screen.draft.journeyId } : {}),
    },
  };
}

function coldEntryState(
  baseState: unknown,
  index: number,
  screen: MatchScreenSnapshot,
  pushed: boolean,
  origin?: MatchHistoryOrigin,
) {
  const state = cleanDestinationState(baseState, routeForMatchScreen(screen));
  state.paikuMatchPushed = pushed;
  state.paikuMatchScreen = cloneMatchScreen(screen);
  state.paikuViewScrollTop = 0;
  delete state.paikuFocus;
  if (screen.kind === "question" && screen.draft.journeyId) {
    state.paikuMatchJourneyId = screen.draft.journeyId;
    if (origin) state.paikuMatchOrigin = cloneOrigin(origin);
  }
  return withHistoryIndex(state, index);
}

/**
 * Reconstructs a small semantic stack for a direct/cold Match URL. Results
 * get only `Discover -> result`; discarded question routes are never
 * invented behind a cold result.
 */
export function buildColdMatchHistory(
  screen: MatchScreenSnapshot,
  baseIndex = 0,
  baseState: unknown = {},
): ColdMatchHistoryEntry[] {
  const firstIndex = normalizeHistoryIndex(baseIndex);
  const rootScreen: MatchScreenSnapshot = { kind: "idle" };
  const rootRoute: AppRoute = { view: "discover" };
  const origin: MatchHistoryOrigin = {
    index: firstIndex,
    route: rootRoute,
    matchScreen: rootScreen,
    viewScrollTop: 0,
  };
  const entries: ColdMatchHistoryEntry[] = [{
    action: "replace",
    index: firstIndex,
    route: rootRoute,
    state: coldEntryState(baseState, firstIndex, rootScreen, false),
  }];

  if (screen.kind === "idle") return entries;

  if (screen.kind === "result") {
    const index = nextHistoryIndex(firstIndex);
    entries.push({
      action: "push",
      index,
      route: routeForMatchScreen(screen),
      state: coldEntryState(baseState, index, screen, true),
    });
    return entries;
  }

  let index = firstIndex;
  for (let step = 0; step <= screen.draft.step; step += 1) {
    index = nextHistoryIndex(index);
    const questionScreen = questionScreenAt(screen, step as 0 | 1 | 2);
    entries.push({
      action: "push",
      index,
      route: { view: "match", matchStep: step as MatchRouteStep },
      state: coldEntryState(baseState, index, questionScreen, true, origin),
    });
  }
  return entries;
}
