import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, css] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

const armoryMobile = css.slice(
  css.indexOf("/* === proto-a 球拍库 === */"),
  css.indexOf("/* === proto-a 筛选底部 Sheet === */"),
);
const filterSheetMobile = css.slice(
  css.indexOf("/* === proto-a 筛选底部 Sheet === */"),
  css.indexOf("/* === proto-a 球星 === */"),
);
const tourMobile = css.slice(
  css.indexOf("/* === proto-a 球星 === */"),
  css.indexOf("/* === proto-a 决策室 === */"),
);
const mobileConsistency = css.slice(css.indexOf("/* === mobile ux consistency pass === */"));

test("keeps armory search, scope, and sheet facets touchable on mobile", () => {
  assert.match(mobileConsistency, /body\s*\{[^}]*min-width:\s*0/);
  assert.match(armoryMobile, /\.armory-mheader__search\s*\{[^}]*min-height:\s*44px/);
  assert.match(armoryMobile, /\.armory-mheader__chips \.m-chip\s*\{[^}]*min-height:\s*44px/);
  assert.match(filterSheetMobile, /\.catalog-filter-panel__mgroups \.m-chip\s*\{[^}]*min-height:\s*44px/);
});

test("keeps armory level-one results focused on browsing", () => {
  assert.match(
    mobileConsistency,
    /\.armory-view \.catalog-result-summary \.library-summary__actions\s*\{[^}]*display:\s*none/,
  );
  assert.match(
    mobileConsistency,
    /\.armory-view \.catalog-model-result__actions\s*\{[^}]*display:\s*none/,
  );
  assert.match(page, /className="catalog-model-result__main"[\s\S]*?openRacket\(racket\.id\)/);
});

test("presents tour ranking and linked rackets as a compact mobile browse flow", () => {
  assert.match(tourMobile, /\.tour-view \.tour-switch button\s*\{[^}]*min-height:\s*44px/);
  assert.match(
    mobileConsistency,
    /\.tour-view \.tour-commandbar__summary,\s*\.tour-view \.tour-ranking__heading\s*\{[^}]*display:\s*none/,
  );
  assert.match(
    mobileConsistency,
    /\.tour-view \.tour-player-card__racket-peek,\s*\.tour-view \.tour-player-card--leader \.tour-player-card__racket-peek\s*\{[^}]*grid-column:\s*1\s*\/\s*-1[^}]*min-height:\s*56px[^}]*width:\s*100%/,
  );
  assert.match(
    mobileConsistency,
    /\.tour-view \.tour-player-card__racket-peek > span:last-child\s*\{[^}]*display:\s*grid/,
  );
  assert.match(
    mobileConsistency,
    /\.tour-view \.tour-player-card__mapping dl,\s*\.tour-view \.tour-player-card__journey,\s*\.tour-view \.tour-player-card__share\s*\{[^}]*display:\s*none/,
  );
  assert.match(
    mobileConsistency,
    /\.tour-view \.tour-player-card__evidence-share\.m-only\s*\{[^}]*display:\s*flex/,
  );
  assert.match(page, /className="tour-player-card__identity"/);
  assert.match(page, /className="tour-player-card__story"/);
  assert.match(page, /className="tour-player-card__racket-peek"[\s\S]*?官方关联 · 点按查看/);
  assert.match(page, /className="tour-player-card__evidence-share m-only"[\s\S]*?分享球星档案/);
});
