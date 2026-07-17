import assert from "node:assert/strict";
import test from "node:test";
import {
  addCompareId,
  applyCompareUndo,
  canUndoCompareChange,
  compareSlotIds,
  compareSlotsEqual,
  createCompareUndo,
  formatCompareRouteState,
  normalizeCompareSlots,
  parseCompareRouteState,
  removeCompareId,
  replaceCompareId,
  shouldImportCompareRoute,
  toggleCompareId,
} from "../app/compare-state.ts";

test("imports shared slots without letting app Back or Forward roll back the global basket", () => {
  assert.equal(shouldImportCompareRoute("initial", true), true);
  assert.equal(shouldImportCompareRoute("hash", true), true);
  assert.equal(shouldImportCompareRoute("pop", false), true);
  assert.equal(shouldImportCompareRoute("pop", true), false);
});

test("round-trips shareable compare slots without packing empty positions", () => {
  const hash = formatCompareRouteState(
    { view: "compare", racketId: "catalog-racket" },
    [{ slot: 0, id: "a" }, { slot: 2, id: "c" }],
  );
  assert.equal(hash, "#compare/racket/catalog-racket?r0=a&r2=c");
  assert.deepEqual(parseCompareRouteState(hash), {
    route: { view: "compare", racketId: "catalog-racket" },
    slots: [{ slot: 0, id: "a" }, { slot: 2, id: "c" }],
    hasExplicitSlots: true,
    rejectedSlots: [],
    rejectedCount: 0,
    canonicalHash: hash,
    shouldReplace: false,
  });
});

test("sanitizes invalid, duplicate and legacy compare ids into one canonical link", () => {
  const parsed = parseCompareRouteState(
    "#compare?r0=legacy&r1=missing&r2=legacy&junk=drop",
    (id) => id === "legacy" ? "canonical" : null,
  );
  assert.deepEqual(parsed.slots, [{ slot: 0, id: "canonical" }]);
  assert.equal(parsed.hasExplicitSlots, true);
  assert.deepEqual(parsed.rejectedSlots, [1, 2]);
  assert.equal(parsed.rejectedCount, 2);
  assert.equal(parsed.canonicalHash, "#compare?r0=canonical");
  assert.equal(parsed.shouldReplace, true);

  const explicitEmpty = parseCompareRouteState("#compare?r0=");
  assert.equal(explicitEmpty.hasExplicitSlots, true);
  assert.deepEqual(explicitEmpty.slots, []);
  assert.deepEqual(explicitEmpty.rejectedSlots, [0]);
  assert.equal(explicitEmpty.rejectedCount, 1);
  assert.equal(explicitEmpty.canonicalHash, "#compare");

  const otherView = parseCompareRouteState("#tour?r0=a");
  assert.equal(otherView.hasExplicitSlots, false);
  assert.deepEqual(otherView.rejectedSlots, []);
  assert.equal(otherView.rejectedCount, 0);
  assert.equal(otherView.canonicalHash, "#tour");
  assert.equal(otherView.shouldReplace, true);
});

test("reports malformed and resolver-rejected slots while preserving valid slots", () => {
  const parsed = parseCompareRouteState(
    "#compare?r0=valid&r1=%E0%A4%A&r2=missing",
    (id) => id === "valid" ? "canonical-valid" : null,
  );

  assert.deepEqual(parsed.slots, [{ slot: 0, id: "canonical-valid" }]);
  assert.deepEqual(parsed.rejectedSlots, [1, 2]);
  assert.equal(parsed.rejectedCount, 2);
  assert.equal(parsed.canonicalHash, "#compare?r0=canonical-valid");
});

test("reports every non-empty slot when all explicit compare ids are invalid", () => {
  const overlong = "x".repeat(181);
  const parsed = parseCompareRouteState(
    `#compare?r0=%E0%A4%A&r1=${overlong}&r2=missing`,
    () => null,
  );

  assert.deepEqual(parsed.slots, []);
  assert.deepEqual(parsed.rejectedSlots, [0, 1, 2]);
  assert.equal(parsed.rejectedCount, 3);
  assert.equal(parsed.canonicalHash, "#compare");
});

test("reports a slot discarded after different ids resolve to one canonical id", () => {
  const parsed = parseCompareRouteState(
    "#compare?r0=legacy-a&r1=legacy-b&r2=unique",
    (id) => id === "unique" ? id : "canonical",
  );

  assert.deepEqual(parsed.slots, [
    { slot: 0, id: "canonical" },
    { slot: 2, id: "unique" },
  ]);
  assert.deepEqual(parsed.rejectedSlots, [1]);
  assert.equal(parsed.rejectedCount, 1);
  assert.equal(parsed.canonicalHash, "#compare?r0=canonical&r2=unique");
});

test("normalizes legacy and slot persistence into unique fixed slots", () => {
  assert.deepEqual(normalizeCompareSlots(["a", "b", "a", "ignored"]), [
    { slot: 0, id: "a" },
    { slot: 1, id: "b" },
  ]);

  assert.deepEqual(normalizeCompareSlots({
    version: 1,
    slots: [
      { slot: 2, id: "c" },
      { slot: 0, id: "a" },
      { slot: 0, id: "collision" },
      { slot: 1, id: "c" },
      { slot: 1, id: "  b  " },
      { slot: 3, id: "outside" },
      { slot: 2, id: "" },
    ],
  }), [
    { slot: 0, id: "a" },
    { slot: 1, id: "c" },
  ]);

  assert.deepEqual(normalizeCompareSlots({ compareIds: ["a", "b"] }), [
    { slot: 0, id: "a" },
    { slot: 1, id: "b" },
  ]);
  assert.deepEqual(normalizeCompareSlots(null), []);
});

test("add uses the smallest empty slot and never duplicates an id", () => {
  const existing = [{ slot: 0, id: "a" }, { slot: 2, id: "c" }];
  const added = addCompareId(existing, "b");
  assert.deepEqual(added, {
    slots: [
      { slot: 0, id: "a" },
      { slot: 1, id: "b" },
      { slot: 2, id: "c" },
    ],
    action: "added",
    slot: 1,
  });
  assert.deepEqual(existing, [{ slot: 0, id: "a" }, { slot: 2, id: "c" }]);

  assert.deepEqual(addCompareId(added.slots, "b"), {
    slots: added.slots,
    action: "unchanged",
    slot: 1,
  });
  assert.equal(addCompareId(added.slots, "d").action, "full");
});

test("remove leaves other rackets in their original slots", () => {
  const current = [
    { slot: 0, id: "a" },
    { slot: 1, id: "b" },
    { slot: 2, id: "c" },
  ];
  assert.deepEqual(removeCompareId(current, "b"), {
    slots: [{ slot: 0, id: "a" }, { slot: 2, id: "c" }],
    action: "removed",
    slot: 1,
  });
  assert.deepEqual(removeCompareId(current, "missing"), {
    slots: current,
    action: "unchanged",
    slot: null,
  });
});

test("replace inherits the victim slot and rejects duplicate replacements", () => {
  const current = [{ slot: 0, id: "a" }, { slot: 2, id: "c" }];
  assert.deepEqual(replaceCompareId(current, "a", "d"), {
    slots: [{ slot: 0, id: "d" }, { slot: 2, id: "c" }],
    action: "replaced",
    slot: 0,
  });
  assert.deepEqual(replaceCompareId(current, "a", "c"), {
    slots: current,
    action: "unchanged",
    slot: 0,
  });
  assert.equal(replaceCompareId(current, "missing", "d").action, "unchanged");
});

test("slot equality and undo only restore the exact expected after-state", () => {
  const before = [{ slot: 0, id: "a" }, { slot: 2, id: "c" }];
  const after = replaceCompareId(before, "a", "d").slots;
  const undo = createCompareUndo(before, after);

  assert.ok(undo);
  assert.equal(compareSlotsEqual(after, [{ slot: 2, id: "c" }, { slot: 0, id: "d" }]), true);
  assert.equal(compareSlotsEqual(after, [{ slot: 0, id: "d" }, { slot: 1, id: "c" }]), false);
  assert.equal(canUndoCompareChange(after, undo), true);
  assert.deepEqual(applyCompareUndo(after, undo), before);

  const diverged = addCompareId(after, "x").slots;
  assert.equal(canUndoCompareChange(diverged, undo), false);
  assert.equal(applyCompareUndo(diverged, undo), null);
  assert.equal(createCompareUndo(before, [...before].reverse()), null);
});

test("extracts ids in visual slot order", () => {
  assert.deepEqual(compareSlotIds([{ slot: 2, id: "c" }, { slot: 0, id: "a" }]), ["a", "c"]);
});

test("legacy toggle wrapper keeps packed-array behavior", () => {
  const first = toggleCompareId([], "a");
  assert.deepEqual(first, { ids: ["a"], action: "added" });

  const second = toggleCompareId(first.ids, "b");
  const third = toggleCompareId(second.ids, "c");
  assert.deepEqual(third.ids, ["a", "b", "c"]);

  const full = toggleCompareId(third.ids, "d");
  assert.equal(full.action, "full");
  assert.equal(full.ids, third.ids);

  const removed = toggleCompareId(third.ids, "b");
  assert.deepEqual(removed, { ids: ["a", "c"], action: "removed" });

  const readded = toggleCompareId(removed.ids, "b");
  assert.deepEqual(readded, { ids: ["a", "c", "b"], action: "added" });
});
