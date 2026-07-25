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
  assert.match(html, /先建立你的打法档案/);
  assert.doesNotMatch(html, /你的首选/);
  assert.match(html, />处方</);
  assert.match(html, /球拍库/);
  assert.match(html, />球星</);
  assert.match(html, />决策</);
  assert.match(html, /ATP \+ WTA 前 8/);
  assert.match(html, /按场景选拍/);
  assert.match(html, /规则筛选 · 不代表销量排名/);
  assert.match(html, /新手第一支拍/);
  assert.match(html, /控制型进阶拍/);
  assert.match(html, /为什么它们入选/);
  assert.match(html, /拍库相对评估/);
  assert.match(html, /259(?:<!-- -->)? 款现行型号/);
  assert.match(html, /259(?:<!-- -->)? 份六维深度档案/);
  const { version } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(html, new RegExp(`拍库 v(?:<!-- -->)?${version.replaceAll(".", "\\.")}`));
  assert.doesNotMatch(html, /Codex is working|Your site is taking shape|codex-preview/i);
});

test("keeps racket imagery and app interactions wired", async () => {
  const [page, css, layout, catalog, tour, sessionState] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/catalog-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/tour-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/session-state.ts", import.meta.url), "utf8"),
  ]);

  const imagePaths = [...page.matchAll(/^  "[^"]+": "(\/rackets\/[^"]+)"/gm)].map((match) => match[1]);
  assert.equal(imagePaths.length, 16);
  await Promise.all(imagePaths.map((path) => access(new URL(`../public${path}`, import.meta.url))));

  assert.match(page, /function RadarChart/);
  assert.match(page, /function MiniRadar/);
  assert.match(page, /六维属性重叠对比雷达图/);
  assert.match(page, /hasCompletedMatch/);
  assert.match(page, /先建立你的打法档案/);
  assert.doesNotMatch(page, /本周首选/);
  assert.match(page, /\[0, 1, 2\]\.map/);
  assert.doesNotMatch(page, /\[0, 1, 2, 3\]\.map/);
  assert.match(page, /className="mobile-tabbar"/);
  assert.match(page, /className="compare-tray"/);
  assert.match(page, /function ProductGallery/);
  assert.match(page, /from "\.\/racket-profiles"/);
  assert.match(page, /catalogRacketId\(selectedFamily, modelIndex\)/);
  assert.match(page, /selectedFamily\.models\.map\([\s\S]*?<MiniRadar racket=\{racketProfile\}/);
  assert.match(page, /className="model-matrix__radar-button"[\s\S]*?onClick=\{\(\) => openRacket\(racketProfile\.id\)\}[\s\S]*?<MiniRadar racket=\{racketProfile\}/);
  assert.match(page, /全系参数与六维雷达/);
  assert.match(page, /\{scoreLabels\[key\]\}<\/text>/);
  assert.doesNotMatch(page, /scoreLabels\[key\]\.slice/);
  assert.match(page, /公开硬规格的导向归纳/);
  assert.match(page, /className="model-matrix__actions"[\s\S]*?href=\{model\.url\}/);
  const familyModelSource = page.slice(page.indexOf("{selectedFamily.models.map"), page.indexOf("</tbody>", page.indexOf("{selectedFamily.models.map")));
  const identityIndex = familyModelSource.indexOf('className="model-matrix__identity"');
  const dossierIndex = familyModelSource.indexOf("family-dossier-${racketProfile.id}");
  const radarIndex = familyModelSource.indexOf('className="model-matrix__radar-cell"');
  const actionsIndex = familyModelSource.indexOf('className="model-matrix__actions"');
  assert.ok(identityIndex >= 0 && dossierIndex > identityIndex && radarIndex > dossierIndex && actionsIndex > radarIndex, "the sticky identity column must expose the dossier before radar and trailing actions");
  const trailingActions = familyModelSource.slice(actionsIndex, familyModelSource.indexOf("</div>", actionsIndex));
  assert.doesNotMatch(trailingActions, /family-dossier-|\u6df1\u5ea6\u6863\u6848/);
  assert.doesNotMatch(trailingActions, /family-compare-|aria-pressed/);
  assert.match(trailingActions, /\u5b98\u7f51\u8d44\u6599/);
  assert.match(page, /function RacketSpecTags/);
  assert.match(page, /function ModelSpecValue/);
  assert.match(page, /<small>\{tag\.characteristic\}<\/small>/);
  assert.match(page, /\{tag\.known && <em>\{tag\.familyPosition\}<\/em>\}/);
  assert.match(page, /className="catalog-model-result__tags"><RacketSpecTags racket=\{racket\} compact showSpecs=\{false\}/);
  assert.match(page, /<RacketSpecTags racket=\{selected\} expanded showSummary \/>/);
  assert.match(page, /打开深度档案/);
  assert.match(page, /非实验室测量/);
  assert.doesNotMatch(page, /libraryMode|library-mode-switch/);
  assert.match(page, /className="catalog-family-grid"/);
  assert.match(page, /matchesCatalogFamilySearch/);
  assert.match(page, /matchesCatalogRacketSearch/);
  assert.match(page, /catalogGenerationOptions/);
  assert.match(page, /catalogReleaseYearOptions/);
  assert.match(page, /matchesCatalogFamilyReleaseYear/);
  assert.match(page, /generation: "全部代际"/);
  assert.match(page, /matchingCatalogRackets/);
  assert.match(page, /className="catalog-model-results"/);
  assert.match(page, /matchingCatalogRackets\.slice\(0, catalogResultLimit\)/);
  assert.match(page, /className="catalog-model-results__more/);
  assert.match(page, /const showMoreCatalogResults/);
  assert.match(page, /catalog-model-open-\$\{firstNewRacket\.id\}/);
  assert.match(page, /patch\.search\.slice\(0, armoryFilterConfig\.maxSearchLength\)/);
  assert.match(page, /setFrame\(\(safeFrame \+ direction \+ availableImages\.length\)/);
  assert.doesNotMatch(page, /className="sheet-handle"/);
  assert.match(sessionState, /paiku-session-v1/);
  assert.match(page, /className="model-matrix__scroll"/);
  assert.match(page, /className="tour-ranking-list"/);
  assert.match(page, /role="dialog"/);
  assert.match(page, /data-dialog-close/);
  assert.match(page, /setAttribute\("inert", ""\)/);
  assert.match(page, /detailReturnFamilyId/);
  assert.match(page, /formatAppRoute/);
  assert.match(page, /parseAppRoute/);
  assert.match(page, /paikuOverlayPushed/);
  assert.match(page, /paikuMatchScreen/);
  assert.match(page, /paikuMatchJourneyId/);
  assert.match(page, /paikuMatchJourneyDepth/);
  assert.match(page, /paikuMatchOrigin/);
  assert.match(page, /paikuHistoryIndex/);
  assert.match(page, /planMatchSettlement/);
  assert.match(page, /materializeMatchSettlement/);
  assert.match(page, /synthesizeOrigin/);
  assert.match(page, /stripMatchJourneyState/);
  assert.match(page, /MATCH_JOURNEY_LIFECYCLE_STORAGE_KEY/);
  assert.match(page, /findSettledMatchJourney/);
  assert.match(page, /recordSettledMatchJourney/);
  assert.match(page, /buildColdMatchHistory/);
  assert.match(page, /paikuMatchRecovery/);
  assert.match(page, /这份处方结果不在当前设备/);
  assert.match(page, /当前浏览器无法持久保存/);
  assert.match(page, /closeTopOverlayRef/);
  assert.match(page, /className="compare-spec-table"/);
  assert.match(page, /pendingCompareId/);
  assert.match(page, /replacePendingCompare/);
  assert.match(page, /undoCompareChange/);
  assert.match(page, /className="app-live-region sr-only"/);
  assert.doesNotMatch(page, /className=\{`app-toast/);
  assert.match(page, /seriesSlots/);
  assert.match(page, /serializeMatchFlow/);
  assert.match(page, /restoreMatchScreen/);
  assert.match(page, /familyTargetRacketId/);
  assert.match(page, /paikuFamilyScrollTop/);
  assert.match(page, /paikuFamilyMatrixScrollLeft/);
  assert.match(page, /paikuRacketScrollTop/);
  assert.match(page, /paikuViewScrollTop/);
  assert.match(page, /paikuFocus/);
  assert.match(page, /paikuFamilyRevealTarget/);
  assert.match(page, /paikuPendingCompareId/);
  assert.match(page, /paikuCatalogResultLimit/);
  assert.match(page, /data-focus-key/);
  assert.match(page, /dossier-header-compare-/);
  assert.match(page, /dossier-footer-compare-/);
  assert.match(page, /queueOverlayHistoryPatch/);
  assert.match(page, /role="region" aria-label="球拍规格对比表"/);
  assert.match(page, /tabIndex=\{wideModelMatrix \? 0 : -1\}/);
  assert.match(page, /compareSlotRackets\.map/);
  assert.match(page, /disabled=\{Boolean\(pendingCompareRacket\)\}/);
  assert.match(page, /className="app-shell" inert=\{!sessionReady\} aria-hidden=\{!sessionReady\}/);
  assert.match(page, /className="skip-link" href="#main-content"/);
  assert.match(page, /event\.preventDefault\(\); document\.getElementById\("main-content"\)\?\.focus\(\)/);
  assert.match(page, /<main className="app-content" id="main-content" tabIndex=\{-1\}>/);
  assert.match(page, /tourCatalogTargets/);
  assert.match(page, /formatTourRouteState/);
  assert.match(page, /parseTourRouteState/);
  assert.match(page, /const commitTourFilter/);
  assert.match(page, /copyTourLink/);
  assert.match(page, /查看深度档案/);
  assert.match(page, /role="tablist"[\s\S]*?aria-label="选择巡回赛"/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /className="match-draft-banner"/);
  assert.match(page, /进度仅保留在本页/);
  assert.match(page, /className="match-storage-warning"/);
  assert.match(page, /discover-match-profile/);
  assert.match(page, /className="curated-lists"/);
  assert.match(page, /curatedListEntries\.map/);
  assert.match(page, /data-focus-key=\{`curated-open-\$\{activeCuratedScene\.id\}-\$\{racket\.id\}`\} onClick=\{\(\) => openRacket\(racket\.id\)\}/);
  assert.match(page, /data-focus-key=\{`curated-compare-\$\{activeCuratedScene\.id\}-\$\{racket\.id\}`\} onClick=\{\(\) => requestCompare\(racket\.id\)\} aria-pressed=\{compareIds\.includes\(racket\.id\)\}/);
  assert.match(page, /aria-controls=\{`curated-criteria-\$\{activeCuratedScene\.id\}`\}/);
  assert.match(page, /planColdMissingResultRestart/);
  assert.match(page, /shouldImportCompareRoute/);
  assert.match(page, /rejectedCount/);
  assert.match(page, /kind: "import-link"/);
  assert.match(page, /Command 或 Control 加 Z/);
  assert.doesNotMatch(page, /7200/);
  assert.match(page, /SESSION_DOMAIN_STORAGE_KEYS\.match/);
  assert.match(page, /SESSION_DOMAIN_STORAGE_KEYS\.compare/);
  assert.match(page, /window\.addEventListener\("storage", handleStorage\)/);
  assert.match(page, /selectSessionDomainCopy\("compare", legacySessionSaved, legacyLocalSaved\)/);
  assert.match(page, /reconcileSharedCompare\(\);/);
  assert.match(page, /compareSlotsEqual\(compareSlots, compareUndo\.afterSlots\)/);
  assert.doesNotMatch(page, /compareUndo\?\.message === liveMessage/);
  assert.doesNotMatch(page, /localStorage\.setItem\("paiku-session-v1"/);
  assert.match(page, /shouldResumeStoredMatchDraft/);
  assert.match(page, /shouldUseMatchHistoryBack/);
  assert.match(page, /matchPriorities/);
  assert.match(page, /护臂 \/ 容错/);
  assert.match(page, /document\.title = `\$\{pageLabel\}｜拍库`/);
  assert.match(page, /id="catalog-result-summary"/);
  assert.match(page, /enterKeyHint="search"/);
  assert.match(page, /shareCurrentView/);
  assert.match(page, /compareTableScrollable \? 0 : -1/);
  assert.match(page, /compareBrowseReturnRef/);
  assert.match(page, /新标签页打开/);

  const galleryPaths = [
    "/rackets/gallery/wilson-blade-v10-02.png",
    "/rackets/gallery/yonex-ezone-98-01.jpg",
    "/rackets/gallery/babolat-pure-aero-98-gen9-01.png",
    "/rackets/gallery/head-speed-01.webp",
  ];
  await Promise.all(galleryPaths.map((path) => access(new URL(`../public${path}`, import.meta.url))));

  for (const brand of ["Wilson", "Yonex", "Babolat", "HEAD", "Tecnifibre", "Dunlop", "Völkl", "Prince", "Solinco", "ProKennex", "Diadem"]) {
    assert.match(catalog, new RegExp(`brand: "${brand}"`));
  }
  const familyIds = catalog.match(/id: "[^"]+", brand:/g) ?? [];
  const catalogModels = catalog.match(/\bspec\("/g) ?? [];
  const catalogImagePaths = [...catalog.matchAll(/^\s+image: "(\/rackets\/[^"]+)"/gm)].map((match) => match[1]);
  assert.equal(familyIds.length, 49);
  assert.equal(catalogModels.length, 259);
  assert.equal(catalogImagePaths.length, familyIds.length);
  await Promise.all(catalogImagePaths.map((path) => access(new URL(`../public${path}`, import.meta.url))));
  assert.match(catalog, /export const catalogModelCount/);
  assert.match(catalog, /releaseDate/);
  assert.doesNotMatch(catalog, /familyUrl: "https:\/\/www\.wilson\.com\/en-us\/explore\/help\/product\/stringing-instructions"/);
  assert.equal((tour.match(/tour: "(?:ATP|WTA)"/g) ?? []).length, 16);
  assert.match(tour, /export const tourRankAsOf = "2026-07-13"/);
  assert.match(tour, /head\.com\/en_US\/athletes\/tennis\/wta\/karolina-muchova/);

  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /\.mini-radar__shape/);
  assert.match(css, /\.match-draft-banner/);
  assert.match(css, /\.match-storage-warning/);
  assert.match(css, /\.skip-link/);
  assert.match(css, /\.catalog-filter-panel/);
  assert.match(css, /\.curated-list__criteria-toggle[\s\S]*?min-height:\s*44px/);
  assert.match(css, /\.catalog-workbench[\s\S]*?position:\s*sticky/);
  assert.match(css, /\.brand-logo img[\s\S]*?object-fit:\s*contain/);
  assert.match(css, /\.compare-spec-table-scroll:focus-visible[\s\S]*?var\(--accent\) 72%/);
  assert.match(css, /\.model-matrix__scroll:focus-visible[\s\S]*?var\(--family-accent\) 72%/);
  assert.match(css, /\.mini-radar svg[\s\S]*?height:\s*106px[\s\S]*?width:\s*120px/);
  assert.match(css, /\.model-matrix tbody tr[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\) 124px/);
  assert.match(css, /\.model-matrix tbody \.model-matrix__radar-cell[\s\S]*?grid-column:\s*3[\s\S]*?grid-row:\s*2 \/ 6/);
  assert.match(css, /\.model-matrix__actions[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /\.model-matrix__dossier[\s\S]*?min-height:\s*44px/);
  assert.match(css, /\.racket-spec-tag--mainstream/);
  assert.match(css, /\.racket-spec-tags__traits/);
  assert.match(css, /\.model-spec-value\.is-mainstream small[\s\S]*?var\(--family-accent\)/);
  assert.match(css, /\.model-spec-value em[\s\S]*?font-style:\s*normal/);
  assert.match(css, /\.compare-spec-table/);
  assert.match(css, /\.match-progress[\s\S]*?repeat\(3, 1fr\)/);
  assert.match(css, /\.mobile-tabbar[\s\S]*?repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.catalog-model-result__actions button[\s\S]*?min-height:\s*44px/);
  assert.match(css, /\.tour-player-card__journey button[\s\S]*?min-height:\s*44px/);
  for (const edge of ["top", "right", "bottom", "left"]) assert.match(css, new RegExp(`env\\(safe-area-inset-${edge}\\)`));
  assert.match(css, /\.app-search:focus-within/);
  assert.match(css, /\.app-search input:focus-visible/);
  assert.match(css, /\.library-toolbar\s*\{[\s\S]*?top:\s*env\(safe-area-inset-top\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-color-scheme:\s*dark/);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(layout, /og-v06\.png/);
});
