import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { catalogFamilies, catalogModelCount } from "../app/catalog-data.ts";
import {
  buildProfileScores,
  catalogRacketId,
  deepRackets,
  legacyCatalogRacketId,
} from "../app/racket-profiles.ts";

const radarKeys = ["control", "power", "spin", "agility", "forgiveness", "feel"];

test("every yearbook model has one complete six-axis radar profile", () => {
  assert.equal(catalogModelCount, 259);
  assert.equal(deepRackets.length, catalogModelCount);

  const profiles = new Map(deepRackets.map((racket) => [racket.id, racket]));
  assert.equal(profiles.size, catalogModelCount);
  for (const family of catalogFamilies) {
    family.models.forEach((model, modelIndex) => {
      const id = catalogRacketId(family, modelIndex);
      const profile = profiles.get(id);
      assert.ok(profile, `${family.brand} ${model.name} is missing its deep profile`);
      assert.equal(profile.model, model.name);
      assert.deepEqual(Object.keys(profile.scores).sort(), [...radarKeys].sort(), `${profile.model} must have exactly six radar axes`);
      assert.deepEqual(profile.scores, buildProfileScores(family, model), `${profile.model} must use its canonical generated radar data`);
      for (const key of radarKeys) {
        assert.ok(Number.isFinite(profile.scores[key]), `${profile.model} ${key} must be numeric`);
        assert.ok(Number.isInteger(profile.scores[key]), `${profile.model} ${key} must be an integer`);
        assert.ok(profile.scores[key] >= 0 && profile.scores[key] <= 100, `${profile.model} ${key} must stay within 0–100`);
      }
      assert.match(model.url, /^https:\/\//, `${profile.model} must have an external official or purchase URL`);
      assert.doesNotMatch(model.url, /\/help\/product\/stringing-instructions/i, `${profile.model} must link to racket information, not generic stringing help`);
      assert.notEqual(model.url, family.familyUrl, `${profile.model} must link to its model page rather than reuse the family landing page`);
      assert.doesNotMatch(model.url, /^https:\/\/b2b\./i, `${profile.model} must use a consumer-facing product page`);
    });
  }
});

test("yearbook result, family model row, and deep dossier resolve the same radar object", () => {
  const familyMatrixProfiles = new Map(deepRackets.map((racket) => [racket.id, racket]));

  for (const family of catalogFamilies) {
    family.models.forEach((model, modelIndex) => {
      const id = catalogRacketId(family, modelIndex);
      // These mirror the three lookup paths used by the Armory UI: the flat
      // model-result list, the family model matrix, and the deep dossier.
      const yearbookResult = deepRackets.find((racket) => racket.familyId === family.id && racket.model === model.name);
      const familyModelRow = familyMatrixProfiles.get(id);
      const deepDossier = deepRackets.find((racket) => racket.id === id);

      assert.ok(yearbookResult, `yearbook result is missing ${family.brand} ${model.name}`);
      assert.ok(familyModelRow, `family model row is missing ${family.brand} ${model.name}`);
      assert.ok(deepDossier, `deep dossier is missing ${family.brand} ${model.name}`);
      assert.strictEqual(yearbookResult, familyModelRow, `${model.name} must not fork its yearbook radar profile`);
      assert.strictEqual(familyModelRow, deepDossier, `${model.name} must not fork its dossier radar profile`);
      assert.strictEqual(yearbookResult.scores, deepDossier.scores, `${model.name} surfaces must share one scores object`);
    });
  }
});

test("all three Armory surfaces render radar from the canonical racket profile", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /const radarKeys: ScoreKey\[\] = \["control", "power", "spin", "agility", "forgiveness", "feel"\]/, "UI radar axes must stay aligned with the six canonical score fields");
  assert.match(page, /matchingCatalogRackets(?:\.slice\([^)]*\))?\.map\(\(racket\)[\s\S]*?<MiniRadar racket=\{racket\}/, "yearbook model results must render their canonical profile, including batched result rendering");
  assert.match(page, /deepRacketById\.get\(catalogRacketId\(selectedFamily, modelIndex\)\)[\s\S]*?<MiniRadar racket=\{racketProfile\}/, "family model rows must resolve and render the canonical profile");
  assert.match(page, /const selected = selectedId \? deepRackets\.find\(\(racket\) => racket\.id === selectedId\)[\s\S]*?<RadarChart chartRackets=\{\[selected\]\}/, "deep dossiers must render the selected canonical profile");
});

test("catalog dossier ids remain stable when a family inserts another model", () => {
  const family = catalogFamilies[0];
  const originalIds = family.models.map((_, index) => catalogRacketId(family, index));
  assert.equal(new Set(originalIds).size, family.models.length);
  originalIds.forEach((id, index) => assert.notEqual(id, legacyCatalogRacketId(family, index)));

  const inserted = {
    ...family,
    models: [{ ...family.models[0], name: "Future Inserted Model" }, ...family.models],
  };
  family.models.forEach((_, index) => {
    assert.equal(catalogRacketId(inserted, index + 1), originalIds[index]);
  });
});
