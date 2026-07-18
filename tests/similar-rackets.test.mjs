import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deepRackets, beamAverage, normalizedPattern, patternRanks } from "../app/racket-profiles.ts";
import {
  NEAR_IDENTICAL_DIFF,
  NEAR_IDENTICAL_LABEL,
  buildSimilarRackets,
  similarityKeys,
  similarityScales,
} from "../app/similar-rackets.ts";
import { HONESTY_NOTES } from "../app/honesty-notes.ts";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

const deepRacketIds = new Set(deepRackets.map((racket) => racket.id));

function hasFullSpecs(racket) {
  const official = racket.official;
  return Boolean(official)
    && official.head !== null
    && official.weight !== null
    && official.pattern !== null
    && official.balance !== null
    && beamAverage(official.beam) !== null;
}

test("keeps every similar-racket list capped at three cross-brand entries", () => {
  for (const target of deepRackets) {
    const outcome = buildSimilarRackets(target, deepRackets);
    if (outcome.status !== "ok") continue;
    assert.ok(outcome.entries.length <= 3, `${target.model} must return at most 3 entries`);
    for (const entry of outcome.entries) {
      assert.notEqual(entry.racket.brand, target.brand, `${target.model} must only surface other brands`);
      assert.notEqual(entry.id, target.id);
    }
  }
});

test("only surfaces catalog rackets and never repeats one family", () => {
  for (const target of deepRackets) {
    const outcome = buildSimilarRackets(target, deepRackets);
    if (outcome.status !== "ok") continue;
    const familyKeys = outcome.entries.map((entry) => entry.racket.familyId ?? entry.racket.series);
    assert.equal(new Set(familyKeys).size, familyKeys.length, `${target.model} must dedupe by family`);
    for (const entry of outcome.entries) {
      assert.ok(deepRacketIds.has(entry.id), `${entry.id} must exist in deepRackets`);
    }
  }
});

test("silently excludes candidates missing any of the five official specs", () => {
  for (const target of deepRackets) {
    const outcome = buildSimilarRackets(target, deepRackets);
    if (outcome.status !== "ok") continue;
    for (const entry of outcome.entries) {
      assert.ok(hasFullSpecs(entry.racket), `${entry.racket.model} may not rank with incomplete specs`);
    }
  }
});

test("returns an honest missing-spec outcome instead of guessing", () => {
  const incompleteTargets = deepRackets.filter((racket) => !hasFullSpecs(racket));
  assert.ok(incompleteTargets.length > 0, "catalog is expected to contain incomplete official specs");
  for (const target of incompleteTargets) {
    const outcome = buildSimilarRackets(target, deepRackets);
    assert.equal(outcome.status, "missing-specs", `${target.model} must not rank on missing specs`);
    assert.ok(outcome.missing.length > 0);
    for (const label of outcome.missing) {
      assert.ok(["拍面", "重量", "线床", "平衡点", "框厚"].includes(label));
    }
  }
  const completeTargets = deepRackets.filter((racket) => hasFullSpecs(racket));
  assert.ok(completeTargets.length > 0);
  for (const target of completeTargets) {
    assert.equal(buildSimilarRackets(target, deepRackets).status, "ok");
  }
});

test("is deterministic and sorted by non-decreasing normalized distance", () => {
  for (const target of deepRackets) {
    const first = buildSimilarRackets(target, deepRackets);
    const second = buildSimilarRackets(target, deepRackets);
    assert.deepEqual(
      JSON.parse(JSON.stringify(first, (key, value) => (key === "racket" ? value.id : value))),
      JSON.parse(JSON.stringify(second, (key, value) => (key === "racket" ? value.id : value))),
      `${target.model} must be deterministic`,
    );
    if (first.status !== "ok") continue;
    for (let index = 1; index < first.entries.length; index += 1) {
      assert.ok(first.entries[index - 1].distance <= first.entries[index].distance, `${target.model} entries must be sorted by distance`);
    }
  }
});

test("recomputes every normalized diff and confirms the flagged max dimension", () => {
  const patternDiffOf = (target, candidate) => {
    const targetPattern = normalizedPattern(target.official.pattern);
    const candidatePattern = normalizedPattern(candidate.official.pattern);
    const targetRank = patternRanks[targetPattern];
    const candidateRank = patternRanks[candidatePattern];
    if (targetRank !== undefined && candidateRank !== undefined) {
      return Math.abs(targetRank - candidateRank) / similarityScales.pattern;
    }
    return targetPattern === candidatePattern ? 0 : 1;
  };
  let checked = 0;
  for (const target of deepRackets) {
    const outcome = buildSimilarRackets(target, deepRackets);
    if (outcome.status !== "ok") continue;
    for (const entry of outcome.entries) {
      const expected = {
        head: Math.abs(entry.racket.official.head - target.official.head) / similarityScales.head,
        weight: Math.abs(entry.racket.official.weight - target.official.weight) / similarityScales.weight,
        pattern: patternDiffOf(target, entry.racket),
        balance: Math.abs(entry.racket.official.balance - target.official.balance) / similarityScales.balance,
        beam: Math.abs(beamAverage(entry.racket.official.beam) - beamAverage(target.official.beam)) / similarityScales.beam,
      };
      for (const key of similarityKeys) {
        assert.ok(Math.abs(expected[key] - entry.normalizedDiffs[key]) < 1e-9, `${target.model} → ${entry.racket.model} ${key} diff drifted`);
      }
      const meanDistance = similarityKeys.reduce((sum, key) => sum + expected[key], 0) / similarityKeys.length;
      assert.ok(Math.abs(meanDistance - entry.distance) < 1e-9);
      const maxValue = Math.max(...similarityKeys.map((key) => expected[key]));
      if (similarityKeys.every((key) => expected[key] < NEAR_IDENTICAL_DIFF)) {
        assert.equal(entry.nearIdentical, true);
        assert.equal(entry.maxDiffKey, null);
        assert.equal(entry.maxDiffLabel, NEAR_IDENTICAL_LABEL);
      } else {
        assert.equal(entry.nearIdentical, false);
        assert.ok(Math.abs(expected[entry.maxDiffKey] - maxValue) < 1e-9, `${target.model} → ${entry.racket.model} flagged ${entry.maxDiffKey} is not the max diff`);
        assert.ok(entry.maxDiffLabel.length > 0);
        assert.doesNotMatch(entry.maxDiffLabel, /NaN|undefined|null/);
      }
      checked += 1;
    }
  }
  assert.ok(checked > 100, "expected plenty of fully-specced pairs to verify");
});

test("dossier view mounts the similar-rackets block with honest wording and focus keys", () => {
  assert.match(page, /找相似的拍/);
  assert.match(page, /similar-rackets__empty/);
  assert.match(page, /无法进行规格相似度排序/);
  assert.match(page, /data-focus-key=\{`similar-open-\$\{entry\.id\}`\}/);
  assert.match(page, /data-focus-key=\{`similar-compare-\$\{entry\.id\}`\}/);
  assert.match(page, /openRacket\(entry\.id\)/);
  assert.match(page, /requestCompare\(entry\.id\)/);
  assert.match(page, /HONESTY_NOTES\.similarRackets\}/);
  assert.match(page, /HONESTY_NOTES\.similarRacketsCoverage\}/);
  assert.match(HONESTY_NOTES.similarRackets, /规格相似不等于手感等价/);
  assert.match(HONESTY_NOTES.similarRackets, /不替代实际试打/);
  assert.match(HONESTY_NOTES.similarRacketsCoverage, /官网规格不全的型号未参与排序/);
});
