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
  assert.match(html, />球星</);
  assert.match(html, />对比</);
  assert.match(html, /ATP \+ WTA 前 8/);
  assert.match(html, /213(?:<!-- -->)? 款现行型号/);
  assert.match(html, /213(?:<!-- -->)? 份六维深度档案/);
  assert.doesNotMatch(html, /Codex is working|Your site is taking shape|codex-preview/i);
});

test("keeps racket imagery and app interactions wired", async () => {
  const [page, css, layout, catalog, tour] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/catalog-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/tour-data.ts", import.meta.url), "utf8"),
  ]);

  const imagePaths = [...page.matchAll(/^  "[^"]+": "(\/rackets\/[^"]+)"/gm)].map((match) => match[1]);
  assert.equal(imagePaths.length, 16);
  await Promise.all(imagePaths.map((path) => access(new URL(`../public${path}`, import.meta.url))));

  assert.match(page, /function RadarChart/);
  assert.match(page, /六维属性重叠对比雷达图/);
  assert.match(page, /className="mobile-tabbar"/);
  assert.match(page, /className="compare-tray"/);
  assert.match(page, /function ProductGallery/);
  assert.match(page, /from "\.\/racket-profiles"/);
  assert.match(page, /catalogRacketId\(selectedFamily, modelIndex\)/);
  assert.match(page, />深度档案</);
  assert.match(page, /非实验室测量/);
  assert.doesNotMatch(page, /libraryMode|library-mode-switch/);
  assert.match(page, /className="catalog-family-grid"/);
  assert.match(page, /className="model-matrix__scroll"/);
  assert.match(page, /className="tour-player-grid"/);
  assert.match(page, /role="dialog"/);
  assert.match(page, /aria-live="polite"/);

  const galleryPaths = [
    "/rackets/gallery/wilson-blade-v10-02.png",
    "/rackets/gallery/yonex-ezone-98-01.jpg",
    "/rackets/gallery/babolat-pure-aero-98-gen9-01.png",
    "/rackets/gallery/head-speed-01.webp",
  ];
  await Promise.all(galleryPaths.map((path) => access(new URL(`../public${path}`, import.meta.url))));

  for (const brand of ["Wilson", "Yonex", "Babolat", "HEAD", "Tecnifibre", "Dunlop", "Völkl", "Prince"]) {
    assert.match(catalog, new RegExp(`brand: "${brand}"`));
  }
  const familyIds = catalog.match(/id: "[^"]+", brand:/g) ?? [];
  const catalogModels = catalog.match(/\bspec\("/g) ?? [];
  const catalogImagePaths = [...catalog.matchAll(/^\s+image: "(\/rackets\/[^"]+)"/gm)].map((match) => match[1]);
  assert.equal(familyIds.length, 37);
  assert.equal(catalogModels.length, 213);
  assert.equal(catalogImagePaths.length, familyIds.length);
  await Promise.all(catalogImagePaths.map((path) => access(new URL(`../public${path}`, import.meta.url))));
  assert.match(catalog, /export const catalogModelCount/);
  assert.match(catalog, /releaseDate/);
  assert.equal((tour.match(/tour: "(?:ATP|WTA)"/g) ?? []).length, 16);
  assert.match(tour, /export const tourRankAsOf = "2026-07-13"/);

  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(layout, /og-app\.png/);
});
