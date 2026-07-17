import assert from "node:assert/strict";
import test from "node:test";
import { catalogFamilies } from "../app/catalog-data.ts";
import {
  catalogSearchHistoryMode,
  catalogReleaseYear,
  countCatalogReleaseYearMatches,
  matchesCatalogFamilySearch,
  matchesCatalogRacketSearch,
  matchesCatalogReleaseYearFilter,
  normalizeCatalogSearchText,
  tokenizeCatalogSearch,
} from "../app/catalog-search.ts";
import { deepRackets } from "../app/racket-profiles.ts";

test("creates history boundaries only when search starts or clears", () => {
  assert.equal(catalogSearchHistoryMode("", "W"), "push");
  assert.equal(catalogSearchHistoryMode("W", "Wilson"), "replace");
  assert.equal(catalogSearchHistoryMode("Wilson", ""), "push");
  assert.equal(catalogSearchHistoryMode("", "   "), "replace");
});

test("filters concrete models by their own release date instead of only the family year", () => {
  assert.equal(catalogReleaseYear("2026-01-09"), 2026);
  assert.equal(catalogReleaseYear("2024（本代）"), 2024);
  assert.equal(catalogReleaseYear("官网未注明"), null);
  assert.equal(matchesCatalogReleaseYearFilter("2024-03-31", "2024"), true);
  assert.equal(matchesCatalogReleaseYearFilter("2024-03-31", "官网未注明"), false);

  const phantom100 = racket("prince-phantom-graphite", "PHANTOM GRAPHITE 100");
  const vostraV9 = racket("volkl-vostra", "VÖSTRA V9 290");
  assert.equal(matchesCatalogReleaseYearFilter(phantom100.releaseDate, "2024"), true);
  assert.equal(matchesCatalogReleaseYearFilter(vostraV9.releaseDate, "2024"), true);
  assert.equal(matchesCatalogReleaseYearFilter(vostraV9.releaseDate, "官网未注明"), false);

  const phantomFamily = family("prince-phantom-graphite");
  const releaseValues = phantomFamily.models.map((model) => model.releaseDate ?? phantomFamily.releaseDate ?? phantomFamily.releaseYear);
  assert.ok(countCatalogReleaseYearMatches(releaseValues, "2024") > 0);
  assert.ok(countCatalogReleaseYearMatches(releaseValues, "2024") < phantomFamily.models.length);
});

test("keeps newly verified official specifications in the deep catalog source", () => {
  const blade = family("wilson-blade-v10").models.find((model) => model.name === "Blade Pro 100 V10");
  const blade98s = family("wilson-blade-v10").models.find((model) => model.name === "Blade 98S V10");
  const blade101Team = family("wilson-blade-v10").models.find((model) => model.name === "Blade 101 Team V10");
  const astrel105 = family("yonex-astrel").models.find((model) => model.name === "ASTREL 105");
  const astrel120 = family("yonex-astrel").models.find((model) => model.name === "ASTREL 120");
  const tempo275 = family("tecnifibre-tempo-v2").models.find((model) => model.name === "Tempo 275 V2");
  const prizm115 = family("solinco-prizm").models.find((model) => model.name === "Prizm 115");
  const qTourPro = family("prokennex-qplus-2026").models.find((model) => model.name === "Q+ Tour Pro 18×20");
  const novaElt = family("diadem-elt-current").models.find((model) => model.name === "Nova ELT");

  assert.deepEqual(blade && [blade.head, blade.weight, blade.pattern, blade.balance, blade.beam, blade.length], [100, 295, "16×20", 320, "23", 27.25]);
  assert.deepEqual(blade98s && [blade98s.head, blade98s.weight, blade98s.pattern, blade98s.balance, blade98s.beam, blade98s.length], [98, 295, "18×16", 325, "21.5–20.5", 27]);
  assert.deepEqual(blade101Team && [blade101Team.head, blade101Team.weight, blade101Team.pattern, blade101Team.balance, blade101Team.beam, blade101Team.length], [101, 275, "16×19", 330, "23", 27]);
  assert.deepEqual(astrel105 && [astrel105.head, astrel105.weight, astrel105.pattern, astrel105.balance, astrel105.beam, astrel105.length], [105, 260, "16×17", 340, "27–28.5–25", 27]);
  assert.deepEqual(astrel120 && [astrel120.head, astrel120.weight, astrel120.pattern, astrel120.balance, astrel120.beam, astrel120.length], [120, 255, "16×17", 355, "27–28.5–25", 27]);
  assert.deepEqual(tempo275 && [tempo275.head, tempo275.weight, tempo275.pattern, tempo275.length], [105, 275, "16×19", 26.57]);
  assert.deepEqual(prizm115 && [prizm115.head, prizm115.weight, prizm115.pattern, prizm115.balance, prizm115.beam, prizm115.length], [115, 260, "16×19", 350, "28–30–28", 27.5]);
  assert.deepEqual(qTourPro && [qTourPro.head, qTourPro.weight, qTourPro.pattern, qTourPro.balance, qTourPro.beam, qTourPro.length], [98, 305, "18×20", 320, "19.5", 27]);
  assert.deepEqual(novaElt && [novaElt.head, novaElt.weight, novaElt.pattern, novaElt.balance, novaElt.beam, novaElt.length], [100, null, "16×19", null, null, null]);
});

test("counts release-year results at model level instead of inflating whole families", () => {
  const releaseValues = catalogFamilies.flatMap((item) => item.models.map((model) => (
    model.releaseDate ?? item.releaseDate ?? item.releaseYear
  )));
  const expected = { "2026": 78, "2025": 76, "2024": 38, "2023及更早": 29, "官网未注明": 38 };
  for (const [filter, count] of Object.entries(expected)) {
    assert.equal(countCatalogReleaseYearMatches(releaseValues, filter), count, filter);
  }
});

function family(id) {
  const result = catalogFamilies.find((item) => item.id === id);
  assert.ok(result, `missing family ${id}`);
  return result;
}

function racket(familyId, model) {
  const result = deepRackets.find((item) => item.familyId === familyId && item.model === model);
  assert.ok(result, `missing racket ${familyId} / ${model}`);
  return result;
}

test("normalizes accents and splits whitespace and punctuation into stable tokens", () => {
  assert.equal(normalizeCatalogSearchText(" Völkl / VÖSTRA "), "volklvostra");
  assert.deepEqual(
    tokenizeCatalogSearch("  Völkl / VÖSTRA—V1，16×19  "),
    ["volkl", "vostra", "v1", "16x19"],
  );
  assert.deepEqual(tokenizeCatalogSearch("Wilson、Wilson 98"), ["wilson", "98"]);
});

test("matches Wilson 98 across separate brand and model fields", () => {
  const matches = deepRackets.filter((item) => matchesCatalogRacketSearch(item, "Wilson 98"));

  assert.ok(matches.length > 0);
  assert.ok(matches.every((item) => item.brand === "Wilson"));
  assert.ok(matches.some((item) => item.model === "Blade 98 16×19 V10"));
  assert.ok(matches.some((item) => item.model === "Pro Staff 97L Classic") === false);
});

test("matches Yonex 100L across separate brand and model fields", () => {
  const matches = deepRackets.filter((item) => matchesCatalogRacketSearch(item, "Yonex 100L"));

  assert.ok(matches.some((item) => item.model === "EZONE 100L"));
  assert.ok(matches.some((item) => item.model === "VCORE 100L"));
  assert.ok(matches.every((item) => item.brand === "Yonex" && item.model.includes("100L")));
});

test("combines Chinese type, generation, family, and model tokens", () => {
  const pureAero = family("babolat-pure-aero-gen9");
  const ezone = family("yonex-ezone-8");

  assert.equal(matchesCatalogFamilySearch(pureAero, "Babolat，旋转 Gen-9 98"), true);
  assert.equal(matchesCatalogFamilySearch(ezone, "Yonex 力量 第 8 代 100-L"), true);
  assert.equal(matchesCatalogFamilySearch(pureAero, "Babolat 力量 Gen9"), false);
});

test("handles hyphens, multiplication marks, and tokens in any field", () => {
  const tfight = racket("tecnifibre-tfight-2025", "T-Fight 305S");
  const blade = racket("wilson-blade-v10", "Blade 98 16×19 V10");

  assert.equal(matchesCatalogRacketSearch(tfight, "Tecnifibre / T-Fight 305S"), true);
  assert.equal(matchesCatalogRacketSearch(blade, "控制 Blade-98 16x19"), true);
  assert.equal(matchesCatalogRacketSearch(blade, "控制 Blade 16/19"), true);
});

test("matches Völkl with or without diacritics", () => {
  const vostra = family("volkl-vostra");

  assert.equal(matchesCatalogFamilySearch(vostra, "Volkl Vostra"), true);
  assert.equal(matchesCatalogFamilySearch(vostra, "Völkl—VÖSTRA 全能"), true);
});

test("requires every token to match the same family or racket", () => {
  assert.equal(matchesCatalogFamilySearch(family("wilson-blade-v10"), "Wilson EZONE"), false);
  assert.equal(matchesCatalogRacketSearch(racket("yonex-ezone-8", "EZONE 100L"), "Yonex Blade 100L"), false);
  assert.equal(matchesCatalogFamilySearch(family("wilson-blade-v10"), "  ， / —  "), true);
});
