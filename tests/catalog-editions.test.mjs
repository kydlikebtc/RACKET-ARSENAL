import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogEditionCount,
  catalogFamilies,
  catalogHistoricalFamilyCount,
  catalogModelCount,
  catalogVisualVersionCount,
} from "../app/catalog-data.ts";
import { matchesCatalogFamilySearch, matchesCatalogRacketSearch } from "../app/catalog-search.ts";
import { deepRackets } from "../app/racket-profiles.ts";

const editions = catalogFamilies.flatMap((family) => family.models.flatMap((model) => (
  (model.editions ?? []).map((edition) => ({ family, model, edition }))
)));

test("keeps performance models, historical generations, and visual editions as distinct layers", () => {
  assert.equal(catalogFamilies.length, 54);
  assert.equal(catalogModelCount, 297);
  assert.equal(catalogHistoricalFamilyCount, 5);
  assert.equal(catalogEditionCount, 23);
  assert.equal(catalogVisualVersionCount, 320);
  assert.equal(deepRackets.length, catalogModelCount);

  const historical = catalogFamilies.filter((family) => family.status === "历史");
  assert.deepEqual(
    historical.map((family) => family.id),
    ["wilson-blade-v9", "yonex-vcore-7", "yonex-ezone-7", "babolat-pure-aero-gen8", "head-boom-2024"],
  );
  historical.forEach((family) => {
    assert.ok(family.releaseYear);
    assert.ok(family.models.length > 0);
    assert.match(family.familyUrl, /^https:\/\//);
  });
});

test("gives every edition a stable identity, visible palette, release year, and source", () => {
  assert.equal(editions.length, catalogEditionCount);
  assert.equal(new Set(editions.map(({ edition }) => edition.id)).size, editions.length);

  for (const { edition } of editions) {
    assert.match(edition.id, /^edition-[a-z0-9-]+$/);
    assert.ok(edition.name.trim().length > 2);
    assert.ok(edition.color.trim().length > 1);
    assert.ok(edition.releaseYear >= 2022 && edition.releaseYear <= 2026);
    assert.ok(edition.swatches.length >= 2);
    edition.swatches.forEach((color) => assert.match(color, /^#[0-9a-f]{6}$/i));
    assert.match(edition.url, /^https:\/\//);
  }
});

test("finds commemorative editions and colorways from both family and model search", () => {
  const ezoneFamily = catalogFamilies.find((family) => family.id === "yonex-ezone-7");
  const boomFamily = catalogFamilies.find((family) => family.id === "head-boom-2024");
  const ezone98 = deepRackets.find((racket) => racket.familyId === "yonex-ezone-7" && racket.model === "EZONE 98 7th");
  const pureDrive = deepRackets.find((racket) => racket.familyId === "babolat-pure-drive-gen11" && racket.model === "Pure Drive Gen11");

  assert.ok(ezoneFamily && boomFamily && ezone98 && pureDrive);
  assert.equal(matchesCatalogFamilySearch(ezoneFamily, "Osaka 联名"), true);
  assert.equal(matchesCatalogFamilySearch(ezoneFamily, "Aqua Night Black"), true);
  assert.equal(matchesCatalogFamilySearch(boomFamily, "Arthur Ashe 纪念款"), true);
  assert.equal(matchesCatalogRacketSearch(ezone98, "Sand Beige"), false);
  assert.equal(matchesCatalogRacketSearch(ezone98, "Osaka 金紫龙纹"), true);
  assert.equal(matchesCatalogRacketSearch(pureDrive, "Wimbledon 2026"), true);
});

test("maps editions into the base model dossier without duplicating radar profiles", () => {
  const modelEditionCount = deepRackets.reduce((total, racket) => total + (racket.editions?.length ?? 0), 0);
  assert.equal(modelEditionCount, catalogEditionCount);
  assert.equal(deepRackets.length, catalogModelCount);

  const boomMp = deepRackets.find((racket) => racket.familyId === "head-boom-2024" && racket.model === "Boom MP 2024");
  assert.ok(boomMp);
  assert.deepEqual(
    boomMp.editions?.map((edition) => edition.name),
    ["Boom MP Alternate", "Arthur Ashe Competition 2025", "Boom RAW", "Boom MP Neon"],
  );
  assert.ok(boomMp.editions?.find((edition) => edition.name === "Arthur Ashe Competition 2025")?.image);
  assert.ok(boomMp.editions?.find((edition) => edition.name === "Boom RAW")?.image);
});
