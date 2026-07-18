import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSwapPrescription,
  prescriptionDeltaSummary,
} from "../app/prescription-engine.ts";

const flatScores = (overrides = {}) => ({
  control: 70,
  power: 70,
  spin: 70,
  feel: 70,
  forgiveness: 70,
  agility: 70,
  ...overrides,
});

function racket(id, familyId, scores, options = {}) {
  return {
    id,
    familyId,
    familyName: familyId,
    familyType: options.familyType ?? "全能",
    brand: options.brand ?? "Test",
    model: id,
    series: familyId,
    stages: options.stages ?? ["进阶"],
    styles: options.styles ?? ["上旋进攻"],
    scores,
  };
}

const baseline = racket("current", "family-current", flatScores(), {
  familyType: "全能",
  styles: ["底线相持"],
});

const catalog = [
  baseline,
  racket("familiar", "family-familiar", flatScores({ control: 73, power: 72, spin: 74, feel: 72, forgiveness: 71, agility: 73 })),
  racket("spin-boost", "family-spin", flatScores({ control: 62, power: 74, spin: 92, feel: 65, forgiveness: 68, agility: 83 }), { familyType: "旋转" }),
  racket("power-shift", "family-power", flatScores({ control: 59, power: 94, spin: 76, feel: 61, forgiveness: 72, agility: 80 }), { familyType: "力量", styles: ["抢点快攻", "上旋进攻"] }),
  racket("comfort", "family-comfort", flatScores({ control: 69, power: 72, spin: 64, feel: 88, forgiveness: 94, agility: 65 }), { familyType: "舒适", styles: ["舒适护臂"] }),
  racket("spin-sibling", "family-spin", flatScores({ control: 65, power: 72, spin: 90, feel: 67, forgiveness: 69, agility: 81 }), { familyType: "旋转" }),
];

test("builds a deterministic three-route prescription from different families", () => {
  const first = buildSwapPrescription(catalog, baseline, "进阶", "上旋进攻", "旋转");
  const second = buildSwapPrescription(catalog, baseline, "进阶", "上旋进攻", "旋转");

  assert.deepEqual(first, second);
  assert.equal(first.length, 3);
  assert.deepEqual(first.map(({ role }) => role), ["稳妥升级", "定向强化", "全新取向"]);
  assert.equal(new Set(first.map(({ racket: item }) => item.familyId)).size, 3);
});

test("never returns the current racket and supplies explainable deltas", () => {
  const results = buildSwapPrescription(catalog, baseline, "进阶", "上旋进攻", "旋转");

  assert.ok(results.every(({ racket: item }) => item.id !== baseline.id));
  for (const result of results) {
    assert.deepEqual(Object.keys(result.deltas).sort(), ["agility", "control", "feel", "forgiveness", "power", "spin"]);
    assert.ok(result.gains.length >= 1 && result.gains.length <= 2);
    assert.ok(["低", "中", "高"].includes(result.adaptation));
    assert.match(prescriptionDeltaSummary(result), /^相对当前拍：/);
  }
  assert.ok(results.some((result) => result.tradeoff), "at least one directional option should disclose its main tradeoff");
});

test("falls back to catalog medians and stays diverse without a baseline", () => {
  const withoutCurrent = catalog.filter((item) => item.id !== baseline.id);
  const results = buildSwapPrescription(withoutCurrent, undefined, "进阶", "上旋进攻", "均衡");

  assert.equal(results.length, 3);
  assert.equal(new Set(results.map(({ racket: item }) => item.familyId)).size, 3);
  assert.ok(results.every((result) => result.deltaBasis === "catalog-median"));
  assert.ok(results.every((result) => prescriptionDeltaSummary(result).startsWith("相对拍库中位：")));
});

test("honors an explicit smaller limit and empty inputs", () => {
  assert.equal(buildSwapPrescription(catalog, baseline, "进阶", "上旋进攻", "旋转", 2).length, 2);
  assert.deepEqual(buildSwapPrescription([], baseline, "进阶", "上旋进攻", "旋转"), []);
});
