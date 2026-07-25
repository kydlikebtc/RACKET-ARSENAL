import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, css] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("keeps level-one armory and tour cards focused on browsing", () => {
  const tourCard = page.slice(
    page.indexOf("function TourPlayerCard"),
    page.indexOf("export default function RacketApp"),
  );
  const modelResults = page.slice(
    page.indexOf('className="catalog-model-results"'),
    page.indexOf("matchingCatalogRackets.length > catalogResultLimit"),
  );

  assert.match(tourCard, /className="tour-player-card__racket-peek"[\s\S]*?onClick=\{\(\) => linkedRacket \? onOpenRacket/);
  assert.doesNotMatch(tourCard, /tour-compare-|加入决策室|管理决策室/);
  assert.match(tourCard, /查看关联拍深档|浏览 \$\{linkedFamily\.family\} 全系/);

  assert.match(modelResults, /catalog-model-open-/);
  assert.match(modelResults, /catalog-model-family-/);
  assert.doesNotMatch(modelResults, /catalog-model-compare-|加入对比|管理 3\/3/);
});

test("keeps comparison contextual inside the exact racket dossier", () => {
  assert.match(page, /dossier-footer-compare-/);
  assert.match(page, /className="racket-inspector__header"[\s\S]*?<span>\{selected\.model\}<\/span>/);
  assert.match(css, /\.racket-inspector__header \.inspector-header-actions \.is-primary[\s\S]*?display:\s*none/);
  assert.match(css, /\.racket-inspector__actions[\s\S]*?safe-area-inset-bottom/);
});

test("protects narrow screens, sheets, and empty states", () => {
  assert.match(page, /document\.body\.classList\.toggle\("catalog-filter-locked", catalogFiltersOpen\)/);
  assert.match(page, /const goToView[\s\S]*?setCatalogFiltersOpen\(false\)/);
  assert.match(page, /const openRacket[\s\S]*?setCatalogFiltersOpen\(false\)/);
  assert.match(page, /const openFamily[\s\S]*?setCatalogFiltersOpen\(false\)/);
  assert.match(page, /const readRoute[\s\S]*?setCatalogFiltersOpen\(false\)/);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*?body\.catalog-filter-locked[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /\.catalog-filter-panel__mgroups[\s\S]*?overscroll-behavior:\s*contain/);
  assert.match(css, /\.app-empty[\s\S]*?min-height:\s*min\(360px, 45dvh\)/);
  assert.match(css, /@media \(max-width:\s*430px\)[\s\S]*?\.armory-mheader[\s\S]*?margin-right:\s*calc\(-12px/);
  assert.match(css, /@media \(max-width:\s*430px\)[\s\S]*?\.match-view \.match-result-card[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 48px 44px/);
});
