import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deepRackets } from "../app/racket-profiles.ts";
import {
  buildCompareDiffInsights,
  compareDiffLabels,
  compareDiffOrder,
  compareDiffThresholds,
} from "../app/compare-insights.ts";
import { HONESTY_NOTES } from "../app/honesty-notes.ts";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

const specKeys = ["head", "weight", "pattern", "balance", "beam", "length"];

function fakeRacket(id, official) {
  return {
    id,
    brand: "Test",
    model: id,
    series: `${id} series`,
    official: {
      weight: official.weight ?? null,
      head: official.head ?? null,
      pattern: official.pattern ?? null,
      balance: official.balance ?? null,
      beam: official.beam ?? null,
      length: official.length ?? null,
    },
    specTags: specKeys.map((key) => ({ key, label: "", characteristic: `${key}特征`, familyPosition: "", mainstream: false, known: true })),
  };
}

const fullSpecs = { weight: 300, head: 100, pattern: "16×19", balance: 320, beam: "23", length: 27 };

test("stays silent below thresholds and speaks exactly at them", () => {
  const base = fakeRacket("base", fullSpecs);
  const nearTwin = fakeRacket("twin", { ...fullSpecs, weight: 300 + compareDiffThresholds.weight - 0.5, head: 100 + compareDiffThresholds.head - 0.5 });
  const below = buildCompareDiffInsights([base, nearTwin]);
  assert.equal(below.status, "no-significant-diff");
  assert.equal(below.insights.length, 0);
  assert.equal(below.highlightKey, null);

  const atThreshold = fakeRacket("edge", { ...fullSpecs, weight: 300 + compareDiffThresholds.weight });
  const at = buildCompareDiffInsights([base, atThreshold]);
  assert.equal(at.status, "ok");
  assert.equal(at.insights.length, 1);
  assert.equal(at.insights[0].key, "weight");
  assert.equal(at.highlightKey, "weight");
  assert.match(at.insights[0].sentence, /base 比 edge 轻 10 g/);
  assert.match(at.insights[0].sentence, /基于规格推断/);
});

test("skips null dimensions honestly instead of treating them as zero", () => {
  const base = fakeRacket("base", fullSpecs);
  const partial = fakeRacket("partial", { ...fullSpecs, weight: 340, balance: null, length: null });
  const outcome = buildCompareDiffInsights([base, partial]);
  assert.equal(outcome.status, "ok");
  assert.deepEqual(outcome.excluded, ["balance", "length"]);
  assert.deepEqual(outcome.excludedLabels, ["平衡点", "长度"]);
  for (const insight of outcome.insights) {
    assert.ok(!["balance", "length"].includes(insight.key), "null dimensions must never produce sentences");
  }

  const unrankable = fakeRacket("weird", { ...fullSpecs, pattern: "14×18" });
  const patternOutcome = buildCompareDiffInsights([base, unrankable]);
  assert.ok(patternOutcome.excluded.includes("pattern"), "unrankable pattern must be disclosed, not guessed");

  const blankA = fakeRacket("blank-a", {});
  const blankB = fakeRacket("blank-b", {});
  const blank = buildCompareDiffInsights([blankA, blankB]);
  assert.equal(blank.status, "no-comparable-specs");
  assert.equal(blank.excludedLabels.length, 6);

  assert.equal(buildCompareDiffInsights([base]).status, "not-enough-rackets");
});

test("uses the extreme pair for three rackets with deterministic slot-order tie-breaks", () => {
  const light = fakeRacket("light", { ...fullSpecs, weight: 285 });
  const mid = fakeRacket("mid", { ...fullSpecs, weight: 300 });
  const heavy = fakeRacket("heavy", { ...fullSpecs, weight: 315 });
  const outcome = buildCompareDiffInsights([mid, heavy, light]);
  const weightInsight = outcome.insights.find((insight) => insight.key === "weight");
  assert.ok(weightInsight);
  assert.deepEqual(weightInsight.racketIds, ["light", "heavy"], "must name the extreme pair, not adjacent slots");
  assert.equal(weightInsight.diff, 30);

  const tieHigh = fakeRacket("tie-high-b", { ...fullSpecs, weight: 315 });
  const tieOutcome = buildCompareDiffInsights([heavy, tieHigh, light]);
  const tieInsight = tieOutcome.insights.find((insight) => insight.key === "weight");
  assert.deepEqual(tieInsight.racketIds, ["light", "heavy"], "equal extremes must resolve to the earlier slot");

  const equalRatioA = fakeRacket("ratio-a", fullSpecs);
  const equalRatioB = fakeRacket("ratio-b", { ...fullSpecs, weight: 300 + compareDiffThresholds.weight * 2, head: 100 + compareDiffThresholds.head * 2 });
  const equalRatios = buildCompareDiffInsights([equalRatioA, equalRatioB]);
  assert.deepEqual(equalRatios.insights.map((insight) => insight.key).slice(0, 2), ["weight", "head"], "ratio ties must follow the fixed dimension order");
});

test("caps output at three sentences sorted by descending significance", () => {
  const base = fakeRacket("base", fullSpecs);
  const wild = fakeRacket("wild", { weight: 260, head: 110, pattern: "18×20", balance: 340, beam: "27", length: 27.5 });
  const outcome = buildCompareDiffInsights([base, wild]);
  assert.equal(outcome.status, "ok");
  assert.equal(outcome.insights.length, 3);
  for (let index = 1; index < outcome.insights.length; index += 1) {
    assert.ok(outcome.insights[index - 1].ratio >= outcome.insights[index].ratio);
  }
  assert.equal(outcome.highlightKey, outcome.insights[0].key);
});

test("survives every catalog pairing without dishonest or broken sentences", () => {
  const started = Date.now();
  for (let left = 0; left < deepRackets.length; left += 1) {
    for (let right = left + 1; right < deepRackets.length; right += 1) {
      const outcome = buildCompareDiffInsights([deepRackets[left], deepRackets[right]]);
      assert.ok(outcome.insights.length <= 3);
      for (const insight of outcome.insights) {
        assert.doesNotMatch(insight.sentence, /NaN|undefined|null/);
        assert.ok(insight.ratio >= 1, "published sentences must clear their thresholds");
        assert.ok(compareDiffOrder.includes(insight.key));
        assert.ok(insight.racketIds.includes(deepRackets[left].id) || insight.racketIds.includes(deepRackets[right].id));
      }
      for (const label of outcome.excludedLabels) {
        assert.ok(Object.values(compareDiffLabels).includes(label));
      }
    }
  }
  assert.ok(Date.now() - started < 10000, "full pairwise sweep must stay fast");

  const sampleA = deepRackets[3];
  const sampleB = deepRackets[97];
  assert.deepEqual(buildCompareDiffInsights([sampleA, sampleB]), buildCompareDiffInsights([sampleA, sampleB]));
});

test("compare view renders the insight block, honest wording, and spec-only highlight", () => {
  assert.match(page, /最值得注意的差异/);
  assert.match(page, /6 - compareInsights\.excludedLabels\.length/);
  assert.match(page, /compare-insights__list/);
  assert.match(page, /当前候选没有足够的共同公开规格，无法生成可靠解读/);
  assert.match(page, /已公开且可比较的 \{6 - compareInsights\.excludedLabels\.length\} 项规格未达到显著差异阈值/);
  assert.match(page, /三拍对比按每个维度中差距最大的两把生成解读/);
  assert.match(page, /未参与解读/);
  assert.match(page, /compare-max-diff-badge">差异最大/);
  assert.match(page, /HONESTY_NOTES\.compare\}/);
  assert.match(HONESTY_NOTES.compare, /非实验室测量/);
  assert.match(HONESTY_NOTES.compare, /不替代实际试打/);
  // 互斥约束：白话解读高亮只作用于规格行（rowKind === "spec"），永不触碰评分行。
  assert.match(page, /row\.rowKind === "spec" && compareInsights\.highlightKey === row\.key/);
  assert.doesNotMatch(page, /rowKind === "score"[^\n]*compareInsights/);
});
