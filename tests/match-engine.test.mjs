import assert from "node:assert/strict";
import test from "node:test";
import { buildRecommendations, recommendationScore } from "../app/page.tsx";
import { deepRackets } from "../app/racket-profiles.ts";

const stages = ["入门", "进阶", "高阶"];
const styles = ["底线相持", "上旋进攻", "全场控制", "抢点快攻", "舒适护臂"];
const priorities = ["均衡", "力量", "旋转", "控制", "手感", "灵活", "护臂"];

test("keeps every matching profile ranked and the shortlist family-diverse", () => {
  for (const stage of stages) {
    for (const style of styles) {
      for (const priority of priorities) {
        const scores = deepRackets.map((racket) => recommendationScore(racket, stage, style, priority));
        assert.ok(scores.every((score) => score >= 0 && score <= 99));

        const top = Math.max(...scores);
        const topTieCount = scores.filter((score) => Math.abs(score - top) < 1e-9).length;
        assert.ok(topTieCount <= 3, `${stage}/${style}/${priority} has ${topTieCount} tied leaders`);

        const recommendations = buildRecommendations(deepRackets, stage, style, priority);
        assert.equal(recommendations.length, 4);
        assert.equal(new Set(recommendations.map(({ racket }) => racket.familyId)).size, 4);
        assert.ok(recommendations.every((item, index) => index === 0 || item.match <= recommendations[index - 1].match));
      }
    }
  }
});

import { recommendationBreakdown } from "../app/page.tsx";

test("breaks every recommendation score into honest additive parts", () => {
  for (const stage of stages) {
    for (const style of styles) {
      for (const priority of priorities) {
        for (const racket of deepRackets) {
          const breakdown = recommendationBreakdown(racket, stage, style, priority);
          const score = recommendationScore(racket, stage, style, priority);
          const partsSum = breakdown.base + breakdown.stagePoints + breakdown.stylePoints + breakdown.priorityPoints;
          assert.ok(Math.abs(partsSum - breakdown.raw) < 1e-9);
          assert.ok(Math.abs(breakdown.total - score) < 1e-9);
          assert.equal(breakdown.base, 10);
          assert.ok([0, 22].includes(breakdown.stagePoints));
          assert.ok([0, 28].includes(breakdown.stylePoints));
          assert.equal(breakdown.stagePoints === 22, breakdown.stageHit);
          assert.equal(breakdown.stylePoints === 28, breakdown.styleHit);
          assert.equal(breakdown.priorityMode, priority === "均衡" ? "均衡" : "单项");
          if (breakdown.raw <= 99) {
            assert.equal(breakdown.capped, false);
            assert.ok(Math.abs(breakdown.total - breakdown.raw) < 1e-9);
          }
        }
      }
    }
  }
});

test("keeps the defensive 99-point cap for an out-of-range racket", () => {
  const impossibleRacket = {
    scores: { control: 200, power: 200, spin: 200, feel: 200, forgiveness: 200, agility: 200 },
    stages: ["入门", "进阶", "高阶"],
    styles: ["底线相持", "上旋进攻", "全场控制", "抢点快攻", "舒适护臂"],
  };
  const breakdown = recommendationBreakdown(impossibleRacket, "进阶", "底线相持", "力量");
  assert.ok(breakdown.raw > 99);
  assert.equal(breakdown.total, 99);
  assert.equal(breakdown.capped, true);
  assert.equal(recommendationScore(impossibleRacket, "进阶", "底线相持", "力量"), 99);
});
