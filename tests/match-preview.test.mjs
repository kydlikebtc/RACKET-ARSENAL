import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { changedRankCount, diffRecommendationRanks } from "../app/match-preview.ts";
import { buildRecommendations } from "../app/page.tsx";
import { deepRackets } from "../app/racket-profiles.ts";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

const entry = (id) => ({ racket: { id } });

test("labels moves up, down, held, and newly ranked entries", () => {
  const baseline = [entry("a"), entry("b"), entry("c"), entry("d")];

  const up = diffRecommendationRanks(baseline, [entry("b"), entry("a"), entry("c"), entry("d")], 3);
  assert.deepEqual(up[0], { id: "b", previewRank: 0, baselineRank: 1, delta: 1, isNew: false });
  assert.deepEqual(up[1], { id: "a", previewRank: 1, baselineRank: 0, delta: -1, isNew: false });
  assert.deepEqual(up[2], { id: "c", previewRank: 2, baselineRank: 2, delta: 0, isNew: false });
  assert.equal(changedRankCount(up), 2);

  const fresh = diffRecommendationRanks(baseline, [entry("d"), entry("x"), entry("a")], 3);
  assert.deepEqual(fresh[0], { id: "d", previewRank: 0, baselineRank: 3, delta: 0, isNew: true });
  assert.deepEqual(fresh[1], { id: "x", previewRank: 1, baselineRank: null, delta: 0, isNew: true });
  assert.equal(fresh[2].delta, -2);
  assert.equal(changedRankCount(fresh), 3);

  const identical = diffRecommendationRanks(baseline, baseline, 3);
  assert.ok(identical.every((change) => !change.isNew && change.delta === 0));
  assert.equal(changedRankCount(identical), 0);

  assert.equal(diffRecommendationRanks(baseline, baseline, 0).length, 0);
});

test("stays consistent across every stage, style, and priority pair", () => {
  const stages = ["入门", "进阶", "高阶"];
  const styles = ["底线相持", "上旋进攻", "全场控制", "抢点快攻", "舒适护臂"];
  const priorities = ["均衡", "力量", "旋转", "控制", "手感", "灵活", "护臂"];
  for (const stage of stages) {
    for (const style of styles) {
      for (const committedPriority of priorities) {
        const baseline = buildRecommendations(deepRackets, stage, style, committedPriority);
        for (const previewPriority of priorities) {
          const preview = buildRecommendations(deepRackets, stage, style, previewPriority);
          const changes = diffRecommendationRanks(baseline, preview, 3);
          assert.equal(changes.length, 3);
          changes.forEach((change, index) => {
            assert.equal(change.previewRank, index);
            assert.equal(change.id, preview[index].racket.id);
            if (change.isNew) {
              assert.equal(change.delta, 0);
              assert.ok(change.baselineRank === null || change.baselineRank >= 3);
            } else {
              assert.equal(baseline[change.baselineRank].racket.id, change.id);
              assert.equal(change.delta, change.baselineRank - change.previewRank);
            }
          });
          if (committedPriority === previewPriority) assert.equal(changedRankCount(changes), 0);
        }
      }
    }
  }
});

test("renders the capsule group as an accessible, honest preview control", () => {
  assert.match(page, /className="match-priority-preview__capsules" role="group" aria-label="预览不同优先方向"/u);
  assert.match(page, /aria-pressed=\{displayPriority === item\} onClick=\{\(\) => previewMatchPriority\(item\)\}/u);
  assert.match(page, /预览中：\{previewPriority\} 优先（未保存）· 你的档案仍为 \{profilePriority\} 优先/u);
  assert.match(page, /`预览 \$\{nextPreview\} 优先，\$\{changedCount\} 把球拍名次变化`/u);
  assert.match(page, /预览 \$\{nextPreview\} 优先，名次没有变化/u);
  assert.match(page, /较档案榜单上升 \$\{change\.delta\} 位/u);
});

test("keeps the preview strictly in memory and off the URL", () => {
  const handler = page.slice(page.indexOf("const previewMatchPriority"), page.indexOf("const restartMatchProfile"));
  assert.ok(handler.length > 0);
  assert.doesNotMatch(handler, /persistMatchSnapshot|pushPaikuHistory|replacePaikuHistory|writeSessionDomain|location\.hash|history\.(push|replace)State/u);
  const routeReader = page.slice(page.indexOf("const readRoute"), page.indexOf("const readRoute") + 400);
  assert.match(routeReader, /setPreviewPriority\(null\)/u);
  const tabSwitch = page.slice(page.indexOf("const goToView"), page.indexOf("const goToView") + 300);
  assert.match(tabSwitch, /setPreviewPriority\(null\)/u);
  assert.match(page, /const displayPriority = previewPriority \?\? profilePriority;/u);
});
