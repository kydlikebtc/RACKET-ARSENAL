import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { HONESTY_NOTES } from "../app/honesty-notes.ts";

const [page, css, honesty] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/honesty-notes.ts", import.meta.url), "utf8"),
]);

test("renders the breakdown as an accessible disclosure per result card", () => {
  assert.match(page, /className="match-result-breakdown__trigger" aria-expanded=\{expanded\} aria-controls=\{`match-breakdown-\$\{racket\.id\}`\}/u);
  assert.match(page, /aria-label=\{`查看 \$\{racket\.model\} 的匹配指数拆解`\}/u);
  assert.match(page, /id=\{`match-breakdown-\$\{racket\.id\}`\} role="region"/u);
  assert.match(page, /为什么是它/u);
  assert.match(css, /\.match-result-breakdown__trigger \{[^}]*min-height: 44px/u);
});

test("keeps the breakdown copy honest and sourced from the shared constants", () => {
  assert.match(page, /\{HONESTY_NOTES\.matchIndex\}/u);
  assert.match(page, /\{HONESTY_NOTES\.scoreScale\}/u);
  assert.equal(HONESTY_NOTES.matchIndex, "匹配指数为拍库相对评估，非实验室测量。");
  assert.match(honesty, /非实验室测量/u);
  assert.match(page, /阶段未命中 \+0（该拍标注：/u);
  assert.match(page, /打法未命中 \+0（该拍标注：/u);
  assert.match(page, /合计 \{breakdown\.raw\.toFixed\(1\)\} ≈ 卡面 \{Math\.round\(match\)\}/u);
  assert.match(page, /原始 \$\{breakdown\.raw\.toFixed\(1\)\}，封顶 99/u);
});

test("collapses the breakdown again when the profile is redone", () => {
  const restart = page.slice(page.indexOf("const restartMatchProfile"), page.indexOf("const restartMatchProfile") + 400);
  assert.match(restart, /setBreakdownOpenIds\(\[\]\)/u);
  assert.match(page, /const \[breakdownOpenIds, setBreakdownOpenIds\] = useState<readonly string\[\]>\(\[\]\)/u);
});
