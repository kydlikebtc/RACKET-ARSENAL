import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildDuelVerdicts, duelScoreKeys, duelScoreSummary } from "../app/compare-duel.ts";
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

  const singleTie = buildDuelVerdicts({ ...scores(80), control: 77 }, { ...scores(79), control: 77 });
  assert.equal(singleTie.verdicts.control, "tie");
  assert.equal(singleTie.aWins, 5);
  assert.equal(singleTie.ties, 1);

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
    { control: 70, power: 70, spin: 90, agility: 71, forgiveness: 80, feel: 80 },
  );
  assert.equal(duelScoreSummary(withTies, "甲", "乙"), "六维战报 甲 2 : 2 乙，战平");

  const allTie = buildDuelVerdicts(scores(85), scores(85));
  assert.equal(duelScoreSummary(allTie, "甲", "乙"), "六维战报：甲 与 乙 六维全部战平");
  assert.doesNotMatch(duelScoreSummary(allTie, "甲", "乙"), /领先|胜/);
});

test("wires the duel flow through the dossier, compare view and honesty block", () => {
  assert.match(page, /发起对决/);
  assert.match(page, /对方战拍/);
  assert.match(page, /收到球拍对决/);
  assert.match(page, /选一把球拍应战/);
  assert.match(page, /已退出对决模式/);
  assert.match(page, /aria-label=\{`发起 \$\{selected\.model\} 球拍对决，复制对决链接`\}/);
  assert.match(page, /formatCompareRouteState\(\{ view: "compare" \}, \[\{ slot: 0, id: racket\.id \}\], \{ duel: true \}\)/);
  // 对决徽章只作用于评分行（rowKind === "score"），永不触碰规格行。
  assert.match(page, /row\.rowKind === "score" && row\.scoreKey && duelVerdicts/);
  assert.doesNotMatch(page, /rowKind === "spec"[^\n]*duelVerdicts/);
  assert.match(page, /compare-duel-badge">领先/);
  assert.match(page, /compare-duel-badge compare-duel-badge--tie">战平/);
  // 徽章与差异翻译共用对比页单一免责区块。
  assert.match(page, /HONESTY_NOTES\.compare\}/);
  assert.match(HONESTY_NOTES.compare, /胜负徽章/);
  assert.match(HONESTY_NOTES.compare, /非实验室测量/);
  assert.match(HONESTY_NOTES.compare, /不替代实际试打/);
});

test("keeps the duel lifecycle inside the canonical history channels", () => {
  assert.match(page, /duelStateActive\(compareSlotsRef\.current, duelOpponentRef\.current\)/);
  assert.match(page, /const duelStillActive = duelStateActive\(afterSlots, duelOpponentRef\.current\)/);
  assert.match(page, /\{ duel: duelStillActive \}/);
  // 对决态不进 PaikuHistoryState，也不写入 session-state 四域。
  assert.doesNotMatch(page, /paikuDuel/);
  assert.doesNotMatch(page, /persistCompareSnapshot\([^)]*duel/i);
});
