import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MAX_RECENT_RACKETS,
  normalizeRecentRackets,
  recordRecentRacket,
  removeRecentRacket,
} from "../app/recent-rackets.ts";

test("records a viewed racket by moving it to the front without duplicates", () => {
  assert.deepEqual(recordRecentRacket([], "a"), ["a"]);
  assert.deepEqual(recordRecentRacket(["a", "b"], "b"), ["b", "a"]);
  assert.deepEqual(recordRecentRacket(["a", "b"], "c"), ["c", "a", "b"]);
  const input = ["a", "b"];
  recordRecentRacket(input, "c");
  assert.deepEqual(input, ["a", "b"], "record must not mutate its input");
});

test("keeps at most twelve entries and drops the oldest beyond the cap", () => {
  assert.equal(MAX_RECENT_RACKETS, 12);
  const full = Array.from({ length: 12 }, (_, index) => `id-${index}`);
  const next = recordRecentRacket(full, "id-new");
  assert.equal(next.length, 12);
  assert.equal(next[0], "id-new");
  assert.ok(!next.includes("id-11"), "the oldest entry falls off");
});

test("normalizes stored payloads leniently without ever throwing", () => {
  assert.deepEqual(normalizeRecentRackets(undefined), []);
  assert.deepEqual(normalizeRecentRackets(null), []);
  assert.deepEqual(normalizeRecentRackets("not-an-array"), []);
  assert.deepEqual(normalizeRecentRackets({ recents: ["a"] }), []);
  assert.deepEqual(
    normalizeRecentRackets(["a", 3, null, "", "  ", { id: "b" }, "a", "c"]),
    ["a", "c"],
  );
  const overflow = Array.from({ length: 20 }, (_, index) => `id-${index}`);
  assert.equal(normalizeRecentRackets(overflow).length, MAX_RECENT_RACKETS);
});

test("canonicalizes legacy ids and silently drops unknown ones on restore", () => {
  const resolve = (id) =>
    ({ "legacy-a": "canonical-a", "canonical-a": "canonical-a", "known-b": "known-b" })[id] ?? null;
  assert.deepEqual(
    normalizeRecentRackets(["legacy-a", "gone-x", "known-b", "canonical-a"], resolve),
    ["canonical-a", "known-b"],
  );
});

test("removes a single entry immutably and tolerates missing ids", () => {
  assert.deepEqual(removeRecentRacket(["a", "b", "c"], "b"), ["a", "c"]);
  assert.deepEqual(removeRecentRacket(["a"], "zz"), ["a"]);
  const input = ["a", "b"];
  removeRecentRacket(input, "a");
  assert.deepEqual(input, ["a", "b"], "remove must not mutate its input");
});

test("keeps the discover shelf wired to shared app flows in page.tsx", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  // 持久化：recents 并入现有 catalog 域载荷，且写入 effect 依赖包含 recents 状态。
  assert.match(page, /recents: recentRacketIds,/);
  assert.match(page, /catalogSort, recentRacketIds, writeSessionDomain\]/);
  // 恢复：经 normalizeRecentRackets + deepRacketById canonical 化。
  assert.match(page, /normalizeRecentRackets\(savedCatalog\?\.recents, \(id\) => deepRacketById\.get\(id\)\?\.id \?\? null\)/);
  // 记录入口：唯一依赖 selectedId 的 effect。
  assert.match(page, /recordRecentRacket\(current, canonicalId\)/);
  // 货架 markup：标题、清空、移除播报与条目点击走 openRacket。
  assert.match(page, /最近看过/);
  assert.match(page, /aria-label="清空最近看过">清空<\/button>/);
  assert.match(page, /aria-label=\{`从最近看过移除 \$\{racket\.brand\} \$\{racket\.model\}`\}/);
  assert.match(page, /data-focus-key=\{`recent-open-\$\{racket\.id\}`\} onClick=\{\(\) => openRacket\(racket\.id\)\}/);
  assert.match(page, /已清空最近看过/);
  assert.match(page, /已从最近看过移除 /);
  // 数据诚实副标题：本机保存与 memory-only 双措辞。
  assert.match(page, /仅保存在本机/);
  assert.match(page, /仅保留在本页，刷新或关闭页面后会丢失/);
});

test("styles the shelf as a horizontally scrollable snap track with 44px targets", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const shelf = css.slice(
    css.indexOf("/* === recent-shelf start === */"),
    css.indexOf("/* === recent-shelf end === */"),
  );
  assert.match(shelf, /\.recent-shelf__track[\s\S]*?overflow-x:\s*auto/);
  assert.match(shelf, /scroll-snap-type:\s*inline proximity/);
  assert.match(shelf, /\.recent-shelf__remove[\s\S]*?min-height:\s*44px/);
  assert.match(shelf, /\.recent-shelf__clear[\s\S]*?min-height:\s*44px/);
});
