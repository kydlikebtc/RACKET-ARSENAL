import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CURATED_LIST_LIMIT,
  buildCuratedListEntries,
  curatedCriteriaSummary,
  curatedLists,
  matchesCuratedList,
  matchesHardCriterion,
  matchesScoreCriterion,
} from "../app/curated-lists.ts";
import { HONESTY_NOTES } from "../app/honesty-notes.ts";
import { deepRackets } from "../app/racket-profiles.ts";

test("ships exactly two launch lists whose entries are deterministic", () => {
  assert.equal(curatedLists.length, 2);
  assert.deepEqual(
    curatedLists.map((list) => list.title),
    ["新手第一支拍", "控制型进阶拍"],
  );
  const first = buildCuratedListEntries(curatedLists, deepRackets);
  const second = buildCuratedListEntries(curatedLists, deepRackets);
  assert.deepEqual(first, second);
});

test("caps every list at four entries with one model per family", () => {
  const entries = buildCuratedListEntries(curatedLists, deepRackets);
  for (const { list, rackets } of entries) {
    assert.ok(rackets.length >= 2, `${list.title} should surface candidates`);
    assert.ok(rackets.length <= CURATED_LIST_LIMIT);
    const familyKeys = rackets.map((racket) => racket.familyId ?? racket.series);
    assert.equal(new Set(familyKeys).size, familyKeys.length);
  }
});

test("every selected entry satisfies each criterion of its own list", () => {
  const entries = buildCuratedListEntries(curatedLists, deepRackets);
  for (const { list, rackets } of entries) {
    for (const racket of rackets) {
      for (const criterion of list.hardCriteria) {
        assert.ok(
          matchesHardCriterion(racket, criterion),
          `${racket.model} must satisfy ${criterion.label}`,
        );
      }
      for (const criterion of list.scoreCriteria) {
        assert.ok(
          matchesScoreCriterion(racket, criterion),
          `${racket.model} must satisfy ${criterion.label}`,
        );
      }
      assert.ok(matchesCuratedList(list, racket));
    }
  }
});

test("treats unpublished official specs as a hard-criteria failure", () => {
  const entries = buildCuratedListEntries(curatedLists, deepRackets);
  const [starter] = entries;
  const qualified = starter.rackets[0];
  const hidden = {
    ...qualified,
    id: "test-null-official",
    familyId: "test-null-family",
    official: { ...qualified.official, head: null },
  };
  assert.equal(matchesCuratedList(starter.list, hidden), false);
  const rebuilt = buildCuratedListEntries(curatedLists, [hidden]);
  assert.deepEqual(rebuilt[0].rackets, []);
  const missingBlock = { ...hidden, official: undefined };
  assert.equal(matchesCuratedList(starter.list, missingBlock), false);
});

test("keeps rendering the full criteria for a list that filters down to nothing", () => {
  const impossible = {
    id: "impossible-standard",
    title: "不可能榜单",
    tagline: "永远筛不出条目",
    hardCriteria: [
      { kind: "official-min", field: "head", value: 200, label: "官网拍面 ≥ 200 in²" },
    ],
    scoreCriteria: [
      { kind: "score-min", score: "control", value: 99, label: "控制 ≥ 99" },
    ],
  };
  const [entry] = buildCuratedListEntries([impossible], deepRackets);
  assert.deepEqual(entry.rackets, []);
  assert.equal(entry.list, impossible);
  assert.equal(curatedCriteriaSummary(impossible), "1 项硬性规格条件 + 1 项评分门槛");
});

test("summarizes launch criteria counts from the same source of truth", () => {
  for (const list of curatedLists) {
    assert.equal(
      curatedCriteriaSummary(list),
      `${list.hardCriteria.length} 项硬性规格条件 + ${list.scoreCriteria.length} 项评分门槛`,
    );
    assert.ok(list.hardCriteria.every((criterion) => criterion.label.length > 0));
    assert.ok(list.scoreCriteria.every((criterion) => criterion.label.length > 0));
  }
});

test("bans hand-picked model ids so criteria stay the single source of truth", async () => {
  const source = await readFile(new URL("../app/curated-lists.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /catalog-[a-z0-9-]+/);
  for (const list of curatedLists) {
    assert.doesNotMatch(list.id, /^catalog-/);
  }
});

test("keeps the score-threshold disclaimer wired to the shared honesty note", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /六维评分为\{HONESTY_NOTES\.relativeAssessment\}/);
  assert.equal(HONESTY_NOTES.relativeAssessment, "拍库相对评估，非实验室测量");
});
