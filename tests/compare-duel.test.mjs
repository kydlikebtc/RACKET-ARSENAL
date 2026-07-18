import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildDuelVerdicts, duelScoreKeys, duelScoreSummary, duelTieTolerance } from "../app/compare-duel.ts";
import { HONESTY_NOTES } from "../app/honesty-notes.ts";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

const scores = (value) => Object.fromEntries(duelScoreKeys.map((key) => [key, value]));

test("judges every dimension as win, loss or tie with honest counts", () => {
  const sweep = buildDuelVerdicts(scores(90), scores(70));
  assert.equal(sweep.aWins, 6);
  assert.equal(sweep.bWins, 0);
  assert.equal(sweep.ties, 0);
  for (const key of duelScoreKeys) assert.equal(sweep.verdicts[key], "a");

  const mixed = buildDuelVerdicts(
    { control: 90, power: 60, spin: 80, agility: 70, forgiveness: 75, feel: 88 },
    { control: 70, power: 85, spin: 80, agility: 90, forgiveness: 75, feel: 60 },
  );
  assert.deepEqual(mixed.verdicts, { control: "a", power: "b", spin: "tie", agility: "b", forgiveness: "tie", feel: "a" });
  assert.equal(mixed.aWins, 2);
  assert.equal(mixed.bWins, 2);
  assert.equal(mixed.ties, 2);
  assert.equal(mixed.aWins + mixed.bWins + mixed.ties, duelScoreKeys.length);

  const singleTie = buildDuelVerdicts({ ...scores(84), control: 77 }, { ...scores(79), control: 77 });
  assert.equal(singleTie.verdicts.control, "tie");
  assert.equal(singleTie.aWins, 5);
  assert.equal(singleTie.ties, 1);

  const tolerance = buildDuelVerdicts(scores(80), scores(80 + duelTieTolerance));
  assert.equal(tolerance.ties, 6, "two-point differences are too small to package as a winner");

  const allTie = buildDuelVerdicts(scores(85), scores(85));
  assert.equal(allTie.aWins, 0);
  assert.equal(allTie.bWins, 0);
  assert.equal(allTie.ties, 6);
});

test("summarizes the score line without ever inventing a winner", () => {
  const win = buildDuelVerdicts(
    { control: 90, power: 90, spin: 90, agility: 90, forgiveness: 60, feel: 60 },
    { control: 70, power: 70, spin: 70, agility: 70, forgiveness: 80, feel: 80 },
  );
  assert.equal(duelScoreSummary(win, "甲", "乙"), "六维战报 甲 4 : 2 乙");

  const withTies = buildDuelVerdicts(
    { control: 90, power: 90, spin: 70, agility: 70, forgiveness: 80, feel: 80 },
    { control: 70, power: 70, spin: 90, agility: 74, forgiveness: 80, feel: 80 },
  );
  assert.equal(duelScoreSummary(withTies, "甲", "乙"), "六维战报 甲 2 : 2 乙，领先维数持平");

  const allTie = buildDuelVerdicts(scores(85), scores(85));
  assert.equal(duelScoreSummary(allTie, "甲", "乙"), "六维战报：甲 与 乙 六维全部接近");
  assert.doesNotMatch(duelScoreSummary(allTie, "甲", "乙"), /领先|胜/);
});

test("wires the duel flow through the dossier, compare view and honesty block", () => {
  assert.match(page, /发起好友对决/);
  assert.match(page, /对方战拍/);
  assert.match(page, /收到球拍对决/);
  assert.match(page, /选一把球拍应战/);
  assert.match(page, /已退出对决模式/);
  assert.match(page, /aria-label=\{`发起 \$\{selected\.model\} 球拍对决`\}/);
  assert.match(page, /duelLinkInputRef\.current\?\.select\(\)/);
  assert.match(page, /先预览朋友看到的对决/);
  assert.match(page, /formatCompareRouteState\(\{ view: "compare" \}, \[\{ slot: 0, id: racket\.id \}\], \{ duel: true \}\)/);
  // 对决徽章只作用于评分行（rowKind === "score"），永不触碰规格行。
  assert.match(page, /row\.rowKind === "score" && row\.scoreKey && duelVerdicts/);
  assert.doesNotMatch(page, /rowKind === "spec"[^\n]*duelVerdicts/);
  assert.match(page, /compare-duel-badge--\$\{duelSide\}/);
  assert.match(page, /compare-duel-badge compare-duel-badge--tie">接近/);
  // 徽章与差异翻译共用对比页单一免责区块。
  assert.match(page, /HONESTY_NOTES\.compare\}/);
  assert.match(HONESTY_NOTES.compare, /2 分容差/);
  assert.match(HONESTY_NOTES.compare, /非实验室测量/);
  assert.match(HONESTY_NOTES.compare, /不替代实际试打/);
});

test("keeps the duel lifecycle inside the canonical history channels", () => {
  assert.match(page, /duelStateActive\(compareSlotsRef\.current, duelOpponentRef\.current\)/);
  assert.match(page, /const duelStillActive = duelStateActive\(afterSlots, duelOpponentRef\.current\)/);
  assert.match(page, /\{ duel: duelStillActive \}/);
  // 对决篮子不写入 session-state；分享面板只使用瞬时 history 标记，以支持系统返回关闭弹层。
  assert.match(page, /paikuDuelShare: true/);
  assert.match(page, /if \(duelShareRef\.current\)[\s\S]*?setDuelShare\(null\)/);
  assert.doesNotMatch(page, /persistCompareSnapshot\([^)]*duel/i);
});
