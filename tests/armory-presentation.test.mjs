import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, css, navigation] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/navigation-state.ts", import.meta.url), "utf8"),
]);

test("uses one brand entry point instead of duplicate brand selectors", () => {
  assert.equal((page.match(/aria-label="选择球拍品牌"/gu) ?? []).length, 1);
  assert.match(page, /className="brand-index__grid" role="group"/);
  assert.doesNotMatch(page, /className="brand-scroller"|按品牌筛选拍系/);
  assert.match(page, /selectCatalogBrand\(item\.brand, true\)/);
});

test("keeps family and model browsing explicit and shareable", () => {
  assert.match(page, /const catalogScopeOptions = \["families", "models"\]/);
  assert.match(page, /aria-label="选择浏览层级"/);
  assert.match(page, /commitArmoryFilters\(\{ scope: "families" \}\)/);
  assert.match(page, /commitArmoryFilters\(\{ scope: "models" \}\)/);
  assert.match(navigation, /scope: "scope"/);
  assert.match(navigation, /normalized\.scope !== config\.defaults\.scope/);
  assert.match(page, /catalogScope === "models" && matchingCatalogRackets\.length > 0/);
  assert.match(page, /catalogScope === "families" && filteredFamilies\.length > 0/);
});

test("presents one stable search, filter, and sort control bar", () => {
  assert.match(page, /className="catalog-controlbar"/);
  assert.match(page, /aria-expanded=\{catalogFiltersOpen\} aria-controls="catalog-filter-panel"/);
  assert.match(page, /id="catalog-filter-panel" role="region" aria-label="筛选球拍库"/);
  assert.match(page, /className="catalog-sort" htmlFor="catalog-sort"/);
  assert.doesNotMatch(page, /!catalogSearch\.trim\(\) && <label className="catalog-sort"/);
  assert.match(page, /catalogGenerationsForBrand\.map/);
  assert.match(page, /className="catalog-active-filters"/);
  assert.doesNotMatch(page, /className="catalog-filter-axis"|catalog-generation-scroller/);
});

test("keeps model cards scannable while preserving deep dossier and comparison flows", () => {
  assert.match(page, /className="catalog-model-result__facts"/);
  assert.match(page, /<RacketSpecTags racket=\{racket\} compact showSpecs=\{false\} \/>/);
  assert.match(page, /打开深度档案/);
  assert.match(page, /catalog-model-compare-/);
  assert.match(page, /查看所属拍系/);
  assert.match(page, /matchingCatalogRackets\.slice\(0, catalogResultLimit\)/);
});

test("keeps the workspace compact, touchable, and responsive", () => {
  assert.match(css, /\.catalog-workbench[\s\S]*?position:\s*sticky;[\s\S]*?safe-area-inset-top/);
  assert.match(css, /\.catalog-filter-trigger[\s\S]*?min-height:\s*48px/);
  assert.match(css, /\.library-scope-switch button[\s\S]*?min-height:\s*42px/);
  assert.match(css, /\.brand-logo img[\s\S]*?object-fit:\s*contain/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.brand-index__grid[\s\S]*?overflow-x:\s*auto/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.catalog-controlbar[\s\S]*?grid-template-columns:\s*88px minmax\(0, 1fr\)/);
});
