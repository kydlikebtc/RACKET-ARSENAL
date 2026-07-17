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
