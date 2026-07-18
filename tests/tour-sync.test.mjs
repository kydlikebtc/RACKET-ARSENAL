import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { HONESTY_NOTES } from "../app/honesty-notes.ts";
import { recommendationScore } from "../app/page.tsx";
import { deepRackets } from "../app/racket-profiles.ts";
import { tourPlayers } from "../app/tour-data.ts";
import { tourCatalogTargets } from "../app/tour-links.ts";
import { buildTourPlayerSync } from "../app/tour-sync.ts";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const profile = { stage: "进阶", style: "底线相持", priority: "均衡" };
const stages = ["入门", "进阶", "高阶"];
const styles = ["底线相持", "上旋进攻", "全场控制", "抢点快攻", "舒适护臂"];
const priorities = ["均衡", "力量", "旋转", "控制", "手感", "灵活", "护臂"];

test("scores all sixteen tour players deterministically inside 0-99", () => {
  for (const stage of stages) {
    for (const style of styles) {
      for (const priority of priorities) {
        const sync = buildTourPlayerSync(tourPlayers, tourCatalogTargets, deepRackets, { stage, style, priority }, recommendationScore);
        assert.equal(sync.length, tourPlayers.length);
        for (const item of sync) {
          assert.ok(Number.isInteger(item.syncScore));
          assert.ok(item.syncScore >= 0 && item.syncScore <= 99);
          assert.equal(item.mapping, item.player.mapping);
        }
        assert.ok(sync.every((item, index) => index === 0 || item.syncScore <= sync[index - 1].syncScore));
      }
    }
  }
  const first = buildTourPlayerSync(tourPlayers, tourCatalogTargets, deepRackets, profile, recommendationScore);
  const second = buildTourPlayerSync(tourPlayers, tourCatalogTargets, deepRackets, profile, recommendationScore);
  assert.deepEqual(first, second);
});

test("family-level mappings use the best-scoring model inside the family", () => {
  const sync = buildTourPlayerSync(tourPlayers, tourCatalogTargets, deepRackets, profile, recommendationScore);
  for (const item of sync) {
    const target = tourCatalogTargets[item.player.id];
    if (target.kind === "racket") {
      assert.equal(item.viaRacket.id, target.racketId);
      continue;
    }
    assert.equal(item.viaRacket.familyId, target.familyId);
    const familyBest = Math.max(...deepRackets
      .filter((racket) => racket.familyId === target.familyId)
      .map((racket) => recommendationScore(racket, profile.stage, profile.style, profile.priority)));
    assert.equal(item.syncScore, Math.round(familyBest));
    assert.ok(Math.abs(recommendationScore(item.viaRacket, profile.stage, profile.style, profile.priority) - familyBest) < 1e-9);
  }
});

test("breaks score ties by tour and then by ranking", () => {
  const flatScore = () => 50;
  const sync = buildTourPlayerSync(tourPlayers, tourCatalogTargets, deepRackets, profile, flatScore);
  assert.deepEqual(
    sync.map(({ player }) => `${player.tour}#${player.rank}`),
    [...tourPlayers].sort((a, b) => a.tour.localeCompare(b.tour, "en") || a.rank - b.rank).map((player) => `${player.tour}#${player.rank}`),
  );
});

test("renders the sync section honestly on the match result screen", () => {
  assert.match(page, /className="match-sync" aria-labelledby="match-sync-title"/u);
  assert.match(page, /\{HONESTY_NOTES\.tourSync\}/u);
  assert.match(HONESTY_NOTES.tourSync, /相对评估/u);
  assert.match(HONESTY_NOTES.tourSync, /非球员真实打法/u);
  assert.match(page, /系内适配型号估算 · \$\{item\.mapping\}/u);
  assert.match(page, /<RacketPhoto racket=\{item\.viaRacket\} variant="thumb" \/>/u);
  assert.match(page, /\/ 99 适配/u);
  assert.match(page, /data-focus-key=\{`tour-sync-open-\$\{item\.player\.id\}`\}/u);
  assert.match(page, /查看全部 \{tourPlayers\.length\} 位球星/u);
  assert.match(page, /priority: displayPriority \}, recommendationScore\)/u);
});

test("wires the player deep link lifecycle through the page", () => {
  assert.match(page, /id=\{`tour-player-\$\{player\.id\}`\} tabIndex=\{-1\}/u);
  assert.match(page, /该球星链接已失效，已返回巡回赛拍房/u);
  assert.match(page, /已定位到 \$\{player\.nameZh\} 的球星卡/u);
  assert.match(page, /parseTourRouteState\(window\.location\.hash, "ATP", resolveTourPlayerRouteFilter\)/u);
  const copyTour = page.slice(page.indexOf("const copyTourLink"), page.indexOf("const copyTourLink") + 400);
  assert.match(copyTour, /formatTourRouteState\(\{ view: "tour" \}, tourFilterRef\.current\)/u);
  const commitTour = page.slice(page.indexOf("const commitTourFilter"), page.indexOf("const commitTourFilter") + 900);
  assert.doesNotMatch(commitTour, /playerId:/u);
});
