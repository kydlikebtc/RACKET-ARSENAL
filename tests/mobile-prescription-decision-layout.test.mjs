import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, css] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

const refinementStart = css.indexOf("/* === prescription + decision layout refinement === */");
const refinementEnd = css.indexOf("/* === prescription + decision layout refinement end === */");
const refinement = css.slice(refinementStart, refinementEnd);

test("hands prescription results directly into the decision room without a duplicate mobile CTA", () => {
  const resultList = page.indexOf('className="match-result-list"');
  const nextAction = page.indexOf('className="m-only m-match-next"');
  const tourSync = page.indexOf('className="match-sync"');
  const matchNextRules = refinement.slice(
    refinement.indexOf(".match-view .m-match-next {"),
    refinement.indexOf(".m-match-next > span {")
  );

  assert.ok(resultList < nextAction && nextAction < tourSync, "the next action belongs immediately after recommendations");
  assert.match(page, /compareIds\.length > 0 \? \(\) => goToView\("compare"\) : compareTopMatches/);
  assert.match(refinement, /\.match-view \.match-results-actions\s*{\s*display:\s*none;/);
  assert.doesNotMatch(matchNextRules, /position:\s*sticky/);
  assert.match(refinement, /\.m-match-next > button[\s\S]*?min-height:\s*44px/);
});

test("keeps a compact three-slot decision header ahead of every mobile workspace", () => {
  const visibleTitle = page.indexOf('id="compare-title"');
  const slotbar = page.indexOf('className="m-only m-decision-slotbar"');
  const workspace = page.indexOf('className="compare-app-loaded"');
  const panelTabs = page.indexOf('className="compare-panel-tabs"', workspace);
  const pendingGuidance = page.indexOf("{pendingCompareRacket && (", workspace);
  const mobileWorkflow = page.indexOf('className="m-only decision-workflow decision-workflow--mobile"');
  const viewTitleRules = refinement.slice(
    refinement.indexOf(".compare-view > .view-title {"),
    refinement.indexOf(".compare-view > .view-title > div:first-child {")
  );

  assert.ok(visibleTitle < slotbar && slotbar < workspace && workspace < mobileWorkflow, "visible title and slots must precede the workspace, with long-form progress last");
  assert.ok(workspace < panelTabs && panelTabs < pendingGuidance, "tab focus order must match its visual position before guidance and suggestions");
  assert.match(page, /compareSlotRackets\.map\(\(\{ slot, racket \}\) => racket/);
  assert.match(page, /pendingCompareRacket \? replacePendingCompare\(racket\.id\) : toggleCompare\(racket\.id\)/);
  assert.match(page, /className="m-decision-slot__remove"[\s\S]*?data-compare-remove-id=\{racket\.id\}/);
  assert.match(page, /slot === firstEmptyCompareSlot/);
  assert.match(refinement, /\.compare-view > \.m-decision-slotbar[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(refinement, /\.compare-view > \.view-title[\s\S]*?position:\s*sticky/);
  assert.doesNotMatch(viewTitleRules, /display:\s*none/);
  assert.match(refinement, /\.compare-view > \.view-title > div:first-child[\s\S]*?flex-direction:\s*column-reverse/);
  assert.match(refinement, /\.compare-view \.compare-title-actions[\s\S]*?flex-direction:\s*row/);
  assert.match(refinement, /\.m-decision-slot[\s\S]*?height:\s*76px/);
  assert.match(refinement, /\.m-decision-slot__remove[\s\S]*?height:\s*44px[\s\S]*?width:\s*44px/);
  assert.match(refinement, /\.compare-view > \.decision-workflow:not\(\.decision-workflow--mobile\)[\s\S]*?display:\s*none/);
  assert.match(refinement, /\.compare-view > \.decision-workflow--mobile[\s\S]*?display:\s*grid/);
  assert.doesNotMatch(refinement, /^\s*order\s*:/m);
  assert.match(refinement, /\.compare-view \.compare-panel-tabs\s*{[\s\S]*?position:\s*static;[\s\S]*?top:\s*auto;[\s\S]*?z-index:\s*auto;/);
  assert.match(page, /className="m-decision-slot__main"[\s\S]*?disabled=\{Boolean\(pendingCompareRacket\)\}/);
  assert.match(page, /item\.dataset\.compareRemoveId === target && !item\.disabled && item\.getClientRects\(\)\.length > 0/);
  assert.match(page, /className="text-action compare-title-actions__clear"/);
});

test("uses the radar first and limits mobile specifications to six official rows", () => {
  const radar = page.indexOf('<section className="compare-radar-card">');
  const duel = page.indexOf('<section className="compare-duel-arena"');

  assert.ok(radar !== -1 && duel !== -1 && radar < duel, "the radar should establish the comparison before the duel report");
  assert.match(page, /className=\{`compare-spec-row--\$\{row\.rowKind\}/);
  assert.match(refinement, /\.compare-spec-table tbody \.compare-spec-row--meta,[\s\S]*?\.compare-spec-row--score\s*{\s*display:\s*none;/);
  assert.match(refinement, /font-variant-numeric:\s*tabular-nums/);
  assert.match(refinement, /\.compare-view \.compare-spec-table th,[\s\S]*?\.compare-view \.compare-spec-table td[\s\S]*?min-width:\s*0/);
  assert.match(refinement, /\.compare-panel-surface > \.compare-product-grid--overview,[\s\S]*?display:\s*none/);
});

test("keeps the 320px prescription result readable", () => {
  assert.match(refinement, /@media \(max-width:\s*360px\)[\s\S]*?\.match-view \.match-result-card[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 48px 44px/);
  assert.match(refinement, /@media \(max-width:\s*360px\)[\s\S]*?\.match-result-card__rank[\s\S]*?display:\s*none/);
  assert.match(refinement, /@media \(max-width:\s*360px\)[\s\S]*?\.match-result-card__main[\s\S]*?grid-row:\s*1/);
  assert.match(refinement, /@media \(max-width:\s*360px\)[\s\S]*?\.match-result-card__add[\s\S]*?grid-row:\s*2/);
  assert.match(refinement, /@media \(max-width:\s*360px\)[\s\S]*?\.match-result-breakdown[\s\S]*?grid-row:\s*3/);
});

test("avoids competing floating and inline decision calls to action on the result screen", () => {
  assert.match(page, /const showCompareTray = decisionStorageStatus !== "loading"[\s\S]*?&& compareIds\.length > 0[\s\S]*?&& !finalDecisionRacket[\s\S]*?&& activeView !== "compare"[\s\S]*?&& !\(activeView === "match" && matchStep === 3\)/);
  assert.match(page, /!selected && !selectedFamily && showCompareTray/);
  assert.match(page, /showCompareTray \? " app-toast--with-tray" : ""/);
  assert.match(page, /finalDecisionRacket \? "✓" : String\(compareIds\.length\)/);
  assert.match(css, /\/\* 决策数量已经在 Tab 徽标中常驻[\s\S]*?\.compare-tray\s*{\s*display:\s*none;/);
  assert.match(css, /\.racket-app--with-compare-tray \.app-content\s*{\s*padding-bottom:\s*calc\(144px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /\.app-toast\.app-toast--with-tray\s*{\s*bottom:\s*calc\(92px \+ env\(safe-area-inset-bottom\)\)/);
});

test("keeps the mobile decision workflow readable on its light surface", () => {
  assert.match(css, /\.compare-view > \.decision-workflow--mobile\s*{[\s\S]*?color:\s*var\(--text\)/);
  assert.match(css, /\.compare-view \.decision-workflow__heading > small\s*{[\s\S]*?color:\s*var\(--m-text-3\)/);
  assert.match(css, /\.compare-view \.decision-workflow li\s*{[\s\S]*?background:\s*var\(--surface-soft\)[\s\S]*?color:\s*var\(--text\)/);
  assert.match(css, /\.compare-view \.decision-workflow li\.is-complete > i\s*{[\s\S]*?color:\s*var\(--accent-ink\)/);
  assert.match(css, /\.compare-view \.decision-workflow \.prescription-baseline select\s*{[\s\S]*?background:\s*var\(--surface\)[\s\S]*?color:\s*var\(--text\)/);
  assert.match(css, /\.compare-view \.decision-workflow \.prescription-baseline option,[\s\S]*?background:\s*var\(--surface\);[\s\S]*?color:\s*var\(--text\)/);
});

test("uses a compact mobile prescription header and a secondary decision action menu", () => {
  assert.match(page, /className="m-match-head__step"/);
  assert.match(page, /matchStep >= 3 \? "你的推荐" : "回答当前问题"/);
  assert.match(page, /className="m-only m-match-privacy">答案只存当前浏览器/);
  assert.match(css, /\.view-title h1\[tabindex="-1"\]:focus,[\s\S]*?outline:\s*none/);
  assert.match(css, /\.m-match-head__meta,[\s\S]*?\.m-match-progress__label[\s\S]*?display:\s*none/);
  assert.match(css, /\.m-match-head \.m-large-title[\s\S]*?font-size:\s*20px/);
  assert.match(page, /className="compare-title-actions__desktop"/);
  assert.match(page, /className="compare-title-more m-only"/);
  assert.match(css, /\.compare-view \.compare-title-actions__desktop[\s\S]*?display:\s*none/);
  assert.match(css, /\.compare-title-more > summary[\s\S]*?height:\s*44px[\s\S]*?min-width:\s*44px/);
  assert.match(css, /\.compare-title-more > div[\s\S]*?display:\s*none/);
  assert.match(css, /\.compare-title-more\[open\] > div[\s\S]*?display:\s*grid/);
});

test("expires compare undo affordances without attaching them to later messages", () => {
  assert.match(page, /liveMessage === actionableCompareUndo\.message/);
  assert.match(page, /const showToast = Boolean\(liveMessage && !toastBlockedByOverlay\)/);
  assert.match(page, /const undoToken = actionableCompareUndo\?\.token \?\? null/);
  assert.match(page, /showCompareUndo \? 6000 : 2800/);
  assert.match(page, /setCompareUndo\(\(current\) => current\?\.token === undoToken \? null : current\)/);
  assert.match(page, /if \(!showCompareUndo\) return;[\s\S]*?handleUndoShortcut/);
  assert.match(page, /app-toast\$\{showToast \? " is-visible" : ""\}/);
  assert.match(page, /\$\{showCompareUndo \? " app-toast--actionable" : ""\}/);
});

test("does not leak one saved final decision into another candidate roster", () => {
  assert.match(page, /decisionRoomMatchesRacketIds\([\s\S]*?stored\.room,[\s\S]*?compareSlotIds\(compareSlotsRef\.current\)/);
  assert.match(page, /event\.key === DECISION_STORAGE_KEY[\s\S]*?reconcileSharedDecision\(event\.newValue\)/);
  assert.match(page, /rosterChanged[\s\S]*?status: "candidate" as const/);
});

test("only announces horizontal table controls when the desktop table actually scrolls", () => {
  assert.match(page, /aria-describedby=\{compareTableScrollable \? "compare-scroll-hint" : undefined\}/);
  assert.match(page, /tabIndex=\{compareTableScrollable \? 0 : -1\}/);
});
