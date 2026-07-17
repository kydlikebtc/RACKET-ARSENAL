import assert from "node:assert/strict";
import test from "node:test";
import {
  bridgeSkipDelta,
  buildColdMatchHistory,
  historyIndexFromState,
  materializeMatchSettlement,
  nextHistoryIndex,
  normalizeHistoryIndex,
  planMatchSettlement,
  planColdMissingResultRestart,
  routeForMatchScreen,
  semanticParentAppRoute,
  stripMatchJourneyState,
  withHistoryIndex,
} from "../app/match-history.ts";

const resultScreen = {
  kind: "result",
  profile: { stage: "高阶", style: "全场控制", priority: "控制" },
};

test("normalizes app history indexes without treating stack offsets as indexes", () => {
  assert.equal(normalizeHistoryIndex(7), 7);
  assert.equal(normalizeHistoryIndex(-1, 4), 4);
  assert.equal(normalizeHistoryIndex(1.5, 4), 4);
  assert.equal(normalizeHistoryIndex("7", 4), 4);
  assert.equal(normalizeHistoryIndex(undefined, -2), 0);
  assert.equal(historyIndexFromState({ paikuHistoryIndex: 9 }), 9);
  assert.equal(historyIndexFromState({ paikuHistoryIndex: "9" }, 3), 3);
  assert.equal(historyIndexFromState(null, 3), 3);
  assert.equal(nextHistoryIndex(9), 10);
  assert.equal(nextHistoryIndex(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);

  const original = { custom: "kept" };
  const indexed = withHistoryIndex(original, 5);
  assert.deepEqual(indexed, { custom: "kept", paiku: true, paikuHistoryIndex: 5 });
  assert.deepEqual(original, { custom: "kept" });
});

test("completing from a normal origin rebases at the origin and truncates questions without a bridge", () => {
  const origin = {
    index: 2,
    route: { view: "discover" },
    viewScrollTop: 480,
    focus: { key: "start-match" },
  };
  const plan = planMatchSettlement({
    outcome: "complete",
    journeyId: " journey-1 ",
    currentIndex: 5,
    origin,
    settledScreen: resultScreen,
  });

  assert.equal(plan.travelDelta, -3);
  assert.equal(plan.needsBridge, false);
  assert.equal(plan.bridge, undefined);
  assert.deepEqual(plan.destination, {
    index: 3,
    route: { view: "match", matchStep: 3 },
    matchScreen: resultScreen,
  });

  const materialized = materializeMatchSettlement(plan, {
    paiku: true,
    paikuHistoryIndex: 2,
    paikuMatchJourneyId: "journey-1",
    paikuMatchJourneyDepth: 3,
    paikuHistoryBridge: { journeyId: "stale", afterRoute: { view: "tour" } },
    paikuOverlayPushed: true,
    paikuFamilyTargetId: "stale-family",
    custom: "preserved",
  });
  assert.equal(materialized.originReplacement, null);
  assert.equal(materialized.destination.action, "push");
  assert.deepEqual(materialized.destination.route, { view: "match", matchStep: 3 });
  assert.equal(materialized.destination.state.paikuHistoryIndex, 3);
  assert.equal(materialized.destination.state.paikuViewScrollTop, 0);
  assert.equal(materialized.destination.state.paikuMatchPushed, false);
  assert.deepEqual(materialized.destination.state.paikuMatchScreen, resultScreen);
  assert.equal(materialized.destination.state.custom, "preserved");
  assert.equal("paikuMatchJourneyId" in materialized.destination.state, false);
  assert.equal("paikuMatchJourneyDepth" in materialized.destination.state, false);
  assert.equal("paikuHistoryBridge" in materialized.destination.state, false);
  assert.equal("paikuFamilyTargetId" in materialized.destination.state, false);
});

test("cancel replaces the origin with a bridge and pushes a clean copy of the origin", () => {
  const origin = {
    index: 4,
    route: { view: "compare" },
    viewScrollTop: 320,
    focus: { key: "compare-profile" },
  };
  const plan = planMatchSettlement({
    outcome: "cancel",
    journeyId: "cancel-1",
    currentIndex: 7,
    origin,
  });

  assert.equal(plan.travelDelta, -3);
  assert.equal(plan.needsBridge, true);
  assert.deepEqual(plan.bridge, {
    index: 4,
    route: { view: "compare" },
    marker: { journeyId: "cancel-1", afterRoute: { view: "compare" } },
  });
  assert.deepEqual(plan.destination, { index: 5, route: { view: "compare" } });

  const materialized = materializeMatchSettlement(plan, {
    paiku: true,
    paikuHistoryIndex: 4,
    paikuMatchJourneyId: "cancel-1",
    paikuMatchScreen: { kind: "question", draft: { step: 2, answers: {} } },
    paikuViewScrollTop: 999,
    paikuFocus: { key: "stale" },
    custom: "origin-data",
  });
  assert.deepEqual(materialized.originReplacement?.state.paikuHistoryBridge, {
    journeyId: "cancel-1",
    afterRoute: { view: "compare" },
  });
  assert.equal(materialized.originReplacement?.state.paikuHistoryIndex, 4);
  assert.equal(materialized.destination.state.paikuHistoryIndex, 5);
  assert.equal(materialized.destination.state.paikuViewScrollTop, 320);
  assert.deepEqual(materialized.destination.state.paikuFocus, { key: "compare-profile" });
  assert.equal(materialized.destination.state.custom, "origin-data");
  assert.equal("paikuMatchJourneyId" in materialized.destination.state, false);
  assert.equal("paikuHistoryBridge" in materialized.destination.state, false);
});

test("completing while editing an old result bridges over the replaced result", () => {
  const plan = planMatchSettlement({
    outcome: "complete",
    journeyId: "edit-result",
    currentIndex: 12,
    origin: {
      index: 9,
      route: { view: "match", matchStep: 3 },
      matchScreen: {
        kind: "result",
        profile: { stage: "进阶", style: "底线相持", priority: "均衡" },
      },
    },
    settledScreen: resultScreen,
  });

  assert.equal(plan.needsBridge, true);
  assert.equal(plan.bridge?.index, 9);
  assert.deepEqual(plan.bridge?.marker.afterRoute, { view: "match", matchStep: 3 });
  assert.equal(plan.destination.index, 10);
});

test("bridge traversal follows the direction that entered the invisible entry", () => {
  assert.equal(bridgeSkipDelta(5, 4), -1);
  assert.equal(bridgeSkipDelta(3, 4), 1);
  assert.equal(bridgeSkipDelta(4, 4), 0);
  assert.equal(bridgeSkipDelta(-100, 0), 0);
});

test("cold question routes build a stable indexed semantic stack with one journey origin", () => {
  const question = {
    kind: "question",
    draft: {
      step: 2,
      answers: { stage: "进阶", style: "上旋进攻" },
      journeyId: "cold-question",
    },
  };
  const entries = buildColdMatchHistory(question, 10, { custom: "kept", paikuOverlayPushed: true });

  assert.deepEqual(entries.map(({ action, index, route }) => ({ action, index, route })), [
    { action: "replace", index: 10, route: { view: "discover" } },
    { action: "push", index: 11, route: { view: "match", matchStep: 0 } },
    { action: "push", index: 12, route: { view: "match", matchStep: 1 } },
    { action: "push", index: 13, route: { view: "match", matchStep: 2 } },
  ]);
  assert.deepEqual(entries.slice(1).map((entry) => entry.state.paikuMatchScreen.draft.step), [0, 1, 2]);
  assert.ok(entries.slice(1).every((entry) => entry.state.paikuMatchJourneyId === "cold-question"));
  assert.ok(entries.slice(1).every((entry) => entry.state.paikuMatchOrigin.index === 10));
  assert.ok(entries.every((entry) => entry.state.custom === "kept"));
  assert.ok(entries.every((entry) => entry.state.paikuOverlayPushed === false));
});

test("a cold result has root as its only semantic predecessor, never discarded questions", () => {
  const entries = buildColdMatchHistory(resultScreen, 6);
  assert.deepEqual(entries.map(({ action, index, route }) => ({ action, index, route })), [
    { action: "replace", index: 6, route: { view: "discover" } },
    { action: "push", index: 7, route: { view: "match", matchStep: 3 } },
  ]);
  assert.deepEqual(entries[0].state.paikuMatchScreen, { kind: "idle" });
  assert.deepEqual(entries[1].state.paikuMatchScreen, resultScreen);
  assert.equal("paikuMatchOrigin" in entries[1].state, false);

  const idle = buildColdMatchHistory({ kind: "idle" }, 2);
  assert.equal(idle.length, 1);
  assert.deepEqual(idle[0].route, { view: "discover" });
});

test("restarting a cold missing result reuses recovery as question zero without duplicating Discover", () => {
  const restart = planColdMissingResultRestart(7);
  assert.deepEqual(restart, {
    action: "replace",
    questionIndex: 7,
    origin: { index: 6, route: { view: "discover" }, viewScrollTop: 0 },
  });

  const settlement = planMatchSettlement({
    outcome: "complete",
    journeyId: "cold-restart",
    currentIndex: 9,
    origin: restart.origin,
    settledScreen: resultScreen,
  });
  assert.equal(settlement.travelDelta, -3);
  assert.equal(settlement.destination.index, 7);
  assert.deepEqual(settlement.destination.route, { view: "match", matchStep: 3 });
});

test("match screen routes and semantic parents distinguish a committed result from questions", () => {
  assert.deepEqual(routeForMatchScreen({ kind: "idle" }), { view: "match" });
  assert.deepEqual(routeForMatchScreen({
    kind: "question",
    draft: { step: 1, answers: { stage: "进阶" }, journeyId: "route-test" },
  }), { view: "match", matchStep: 1 });
  assert.deepEqual(routeForMatchScreen(resultScreen), { view: "match", matchStep: 3 });

  assert.deepEqual(
    semanticParentAppRoute({ view: "match", matchStep: 3 }, { view: "tour" }),
    { view: "tour" },
  );
  assert.deepEqual(semanticParentAppRoute({ view: "match", matchStep: 3 }), { view: "match" });
  assert.deepEqual(semanticParentAppRoute({ view: "match", matchStep: 2 }), { view: "match", matchStep: 1 });
  assert.deepEqual(
    semanticParentAppRoute({ view: "armory", familyId: "blade", racketId: "blade-98" }),
    { view: "armory", familyId: "blade" },
  );
});

test("settlement helpers reject missing journey ids and malformed complete screens", () => {
  assert.throws(() => planMatchSettlement({
    outcome: "cancel",
    journeyId: "   ",
    currentIndex: 1,
    origin: { index: 0, route: { view: "discover" } },
  }), /journey id/);
  assert.throws(() => planMatchSettlement({
    outcome: "complete",
    journeyId: "bad-complete",
    currentIndex: 1,
    origin: { index: 0, route: { view: "discover" } },
    settledScreen: { kind: "question", draft: { step: 0, answers: {} } },
  }), /result screen/);
});

test("stripping transaction state is immutable and preserves unrelated app state", () => {
  const source = {
    paikuHistoryIndex: 3,
    paikuMatchJourneyId: "remove",
    paikuMatchScreen: resultScreen,
    paikuMatchRecovery: "missing-result",
    paikuHistoryBridge: { journeyId: "remove", afterRoute: { view: "match" } },
    paikuCompareBrowseReturn: true,
  };
  const stripped = stripMatchJourneyState(source);
  assert.deepEqual(stripped, { paikuHistoryIndex: 3, paikuCompareBrowseReturn: true });
  assert.equal(source.paikuMatchJourneyId, "remove");
});
