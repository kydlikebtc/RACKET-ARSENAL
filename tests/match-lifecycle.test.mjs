import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT,
  MATCH_JOURNEY_LIFECYCLE_STORAGE_KEY,
  findSettledMatchJourney,
  forgetSettledMatchJourney,
  mergeMatchJourneyLifecycles,
  normalizeMatchJourneyLifecycle,
  serializeMatchJourneyLifecycle,
  settleMatchJourney,
} from "../app/match-lifecycle.ts";

const oldResult = {
  kind: "result",
  profile: { stage: "进阶", style: "底线相持", priority: "均衡" },
};

const newResult = {
  kind: "result",
  profile: { stage: "高阶", style: "全场控制", priority: "控制" },
};

function lifecycle(records) {
  return { version: 1, records };
}

test("normalizes untrusted persisted lifecycle data, deduplicates and bounds it", () => {
  const source = lifecycle([
    {
      journeyId: " same ",
      outcome: "pause",
      settledAt: 20,
      destination: { route: { view: "armory", familyId: " blade " } },
    },
    {
      journeyId: "same",
      outcome: "cancel",
      settledAt: 10,
      destination: { route: { view: "discover" } },
    },
    {
      journeyId: "complete-1",
      outcome: "complete",
      settledAt: 30,
      destination: {
        route: { view: "match", matchStep: 3, familyId: "ignored-step-precedence" },
        screen: newResult,
      },
    },
    { journeyId: "bad-outcome", outcome: "unknown", settledAt: 40, destination: { route: { view: "tour" } } },
    { journeyId: "bad-route", outcome: "cancel", settledAt: 50, destination: { route: { view: "missing" } } },
  ]);
  const normalized = normalizeMatchJourneyLifecycle(source, 2);

  assert.equal(MATCH_JOURNEY_LIFECYCLE_STORAGE_KEY, "paiku-match-journey-lifecycle-v1");
  assert.deepEqual(normalized, lifecycle([
    {
      journeyId: "complete-1",
      outcome: "complete",
      settledAt: 30,
      destination: {
        route: { view: "match", familyId: "ignored-step-precedence" },
        screen: newResult,
      },
    },
    {
      journeyId: "same",
      outcome: "pause",
      settledAt: 20,
      destination: { route: { view: "armory", familyId: "blade" } },
    },
  ]));
  assert.equal(source.records[0].journeyId, " same ");
  assert.deepEqual(normalizeMatchJourneyLifecycle("not json"), lifecycle([]));
  assert.deepEqual(normalizeMatchJourneyLifecycle({ version: 99, records: source.records }), lifecycle([]));
  assert.deepEqual(normalizeMatchJourneyLifecycle("x".repeat(256 * 1024 + 1)), lifecycle([]));
});

test("settles complete, cancel and pause destinations so stale question entries resolve instead of reviving", () => {
  let store = lifecycle([]);
  store = settleMatchJourney(store, {
    journeyId: "journey-complete",
    outcome: "complete",
    settledAt: 100,
    destination: { route: { view: "match", matchStep: 3 }, screen: newResult },
  });
  store = settleMatchJourney(store, {
    journeyId: "journey-cancel",
    outcome: "cancel",
    settledAt: 110,
    destination: { route: { view: "discover" }, screen: oldResult },
  });
  store = settleMatchJourney(store, {
    journeyId: "journey-pause",
    outcome: "pause",
    settledAt: 120,
    destination: { route: { view: "armory", familyId: "blade-v9" } },
  });

  assert.deepEqual(findSettledMatchJourney(store, "journey-complete"), {
    journeyId: "journey-complete",
    outcome: "complete",
    settledAt: 100,
    destination: { route: { view: "match", matchStep: 3 }, screen: newResult },
  });
  assert.deepEqual(findSettledMatchJourney(store, "journey-cancel")?.destination, {
    route: { view: "discover" },
    screen: oldResult,
  });
  assert.deepEqual(findSettledMatchJourney(store, "journey-pause")?.destination.route, {
    view: "armory",
    familyId: "blade-v9",
  });
  assert.equal(findSettledMatchJourney(store, "still-active"), null);
});

test("upserting a journey replaces its older settlement and keeps newest-first ordering", () => {
  const initial = lifecycle([
    {
      journeyId: "journey-a",
      outcome: "pause",
      settledAt: 10,
      destination: { route: { view: "tour" } },
    },
    {
      journeyId: "journey-b",
      outcome: "cancel",
      settledAt: 20,
      destination: { route: { view: "discover" } },
    },
  ]);
  const updated = settleMatchJourney(initial, {
    journeyId: "journey-a",
    outcome: "complete",
    settledAt: 30,
    destination: { route: { view: "match", matchStep: 3 }, screen: newResult },
  });

  assert.deepEqual(updated.records.map(({ journeyId, outcome }) => ({ journeyId, outcome })), [
    { journeyId: "journey-a", outcome: "complete" },
    { journeyId: "journey-b", outcome: "cancel" },
  ]);
  assert.equal(initial.records[0].outcome, "pause");
  assert.throws(() => settleMatchJourney(updated, {
    journeyId: "   ",
    outcome: "cancel",
    settledAt: 40,
    destination: { route: { view: "discover" } },
  }), /valid id/);
});

test("merges independent storage copies and lets the newest settlement win", () => {
  const sessionCopy = JSON.stringify(lifecycle([
    { journeyId: "same", outcome: "pause", settledAt: 10, destination: { route: { view: "armory" } } },
    { journeyId: "session-only", outcome: "cancel", settledAt: 30, destination: { route: { view: "compare" } } },
  ]));
  const localCopy = lifecycle([
    { journeyId: "same", outcome: "complete", settledAt: 40, destination: { route: { view: "match", matchStep: 3 } } },
    { journeyId: "local-only", outcome: "pause", settledAt: 20, destination: { route: { view: "tour" } } },
  ]);
  const merged = mergeMatchJourneyLifecycles([sessionCopy, localCopy, "malformed"], 2);

  assert.deepEqual(merged.records.map(({ journeyId, outcome }) => ({ journeyId, outcome })), [
    { journeyId: "same", outcome: "complete" },
    { journeyId: "session-only", outcome: "cancel" },
  ]);
});

test("forgets only the resumed journey and serialization round-trips canonical data", () => {
  const original = lifecycle(Array.from({ length: DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT + 5 }, (_, index) => ({
    journeyId: `journey-${index}`,
    outcome: index % 2 ? "pause" : "cancel",
    settledAt: index,
    destination: { route: { view: index % 2 ? "armory" : "discover" } },
  })));
  const canonical = normalizeMatchJourneyLifecycle(original);
  assert.equal(canonical.records.length, DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT);
  assert.equal(canonical.records[0].journeyId, `journey-${DEFAULT_MATCH_JOURNEY_LIFECYCLE_LIMIT + 4}`);

  const forgotten = forgetSettledMatchJourney(canonical, "journey-20");
  assert.equal(findSettledMatchJourney(forgotten, "journey-20"), null);
  assert.equal(findSettledMatchJourney(canonical, "journey-20")?.journeyId, "journey-20");
  assert.deepEqual(normalizeMatchJourneyLifecycle(serializeMatchJourneyLifecycle(forgotten)), forgotten);
  assert.deepEqual(forgetSettledMatchJourney(forgotten, "unknown"), forgotten);
});

test("sanitizes destination screens and returns detached lookup values", () => {
  const source = lifecycle([{
    journeyId: "screen-safety",
    outcome: "pause",
    settledAt: 1,
    destination: {
      route: { view: "match", matchStep: 2 },
      screen: {
        kind: "question",
        draft: {
          step: 2,
          answers: { stage: "入门", style: "invalid", priority: "力量", unexpected: "discard" },
          journeyId: " resumed-journey ",
        },
      },
    },
  }]);
  const found = findSettledMatchJourney(source, "screen-safety");
  assert.deepEqual(found?.destination.screen, {
    kind: "question",
    draft: {
      step: 1,
      answers: { stage: "入门", priority: "力量" },
      journeyId: "resumed-journey",
    },
  });

  found.destination.route.view = "tour";
  assert.equal(findSettledMatchJourney(source, "screen-safety")?.destination.route.view, "match");
});
