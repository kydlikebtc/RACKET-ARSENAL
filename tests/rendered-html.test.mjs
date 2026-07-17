import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the app experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /拍库｜找到和你打法同频的下一把球拍/);
  assert.match(html, /今天，想怎么赢/);
  assert.match(html, />匹配</);
  assert.match(html, /球拍库/);
  assert.match(html, />对比</);
  assert.doesNotMatch(html, /Codex is working|Your site is taking shape|codex-preview/i);
});

test("keeps racket imagery and app interactions wired", async () => {
  const [page, css, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  const imagePaths = [...page.matchAll(/^  "[^"]+": "(\/rackets\/[^"]+)"/gm)].map((match) => match[1]);
  assert.equal(imagePaths.length, 16);
  await Promise.all(imagePaths.map((path) => access(new URL(`../public${path}`, import.meta.url))));

  assert.match(page, /function RadarChart/);
  assert.match(page, /六维属性重叠对比雷达图/);
  assert.match(page, /className="mobile-tabbar"/);
  assert.match(page, /className="compare-tray"/);
  assert.match(page, /className="filter-sheet"/);
  assert.match(page, /role="dialog"/);
  assert.match(page, /aria-live="polite"/);

  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(layout, /og-app\.png/);
});
