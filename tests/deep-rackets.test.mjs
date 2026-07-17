import assert from "node:assert/strict";
import test from "node:test";
import { catalogFamilies, catalogModelCount } from "../app/catalog-data.ts";
import { catalogModelImages } from "../app/catalog-model-images.ts";
import {
  buildDeepRackets,
  buildRacketSpecInsights,
  deepRackets,
  formatNumberSpec,
  officialHead,
  officialWeight,
} from "../app/racket-profiles.ts";

const scoreKeys = ["agility", "control", "feel", "forgiveness", "power", "spin"];
const allowedStages = new Set(["入门", "进阶", "高阶"]);
const allowedStyles = new Set(["底线相持", "上旋进攻", "全场控制", "抢点快攻", "舒适护臂"]);

function findProfile(familyId, model) {
  const profile = deepRackets.find((item) => item.familyId === familyId && item.model === model);
  assert.ok(profile, `missing profile for ${familyId} / ${model}`);
  return profile;
}

test("creates one deterministic deep dossier for every catalog model", () => {
  const sourceModels = catalogFamilies.flatMap((family) => family.models.map((model) => ({ family, model })));
  assert.equal(catalogModelCount, 259);
  assert.equal(sourceModels.length, catalogModelCount);
  assert.equal(deepRackets.length, catalogModelCount);
  assert.deepEqual(buildDeepRackets(), deepRackets);
  assert.equal(new Set(deepRackets.map((racket) => racket.id)).size, catalogModelCount);

  deepRackets.forEach((racket, index) => {
    const { family, model } = sourceModels[index];
    assert.equal(racket.familyId, family.id);
    assert.equal(racket.familyName, family.family);
    assert.equal(racket.familyType, family.type);
    assert.equal(racket.generation, family.generation);
    assert.equal(racket.model, model.name);
    assert.equal(racket.buyUrl, model.url);
    assert.match(racket.buyUrl, /^https:\/\//);
    assert.deepEqual(racket.official, {
      weight: model.weight,
      head: model.head,
      pattern: model.pattern,
      balance: model.balance,
      beam: model.beam,
      length: model.length,
    });
    const modelGallery = catalogModelImages[racket.id];
    assert.ok(modelGallery, `${racket.brand} ${racket.model} is missing its model gallery`);
    assert.equal(racket.image, modelGallery.images[0]);
    assert.deepEqual(racket.images, modelGallery.images);
    assert.ok(racket.summary.length > 10);
    assert.ok(racket.verdict.length > 10);
    assert.match(racket.profileBasis, /官网公开硬规格 \d\/6 项/);
    assert.match(racket.specCoverage, /^[0-6]\/6 · (完整|部分|基础)$/);
    assert.deepEqual({
      specTags: racket.specTags,
      traitTags: racket.traitTags,
      primaryTraitTags: racket.primaryTraitTags,
      traitSummary: racket.traitSummary,
      mainstreamSpecCount: racket.mainstreamSpecCount,
      knownSpecCount: racket.knownSpecCount,
      isMainstream: racket.isMainstream,
      mainstreamKnown: racket.mainstreamKnown,
    }, buildRacketSpecInsights(family, model));
    assert.equal(racket.specTags.length, 6);
    assert.ok(racket.traitTags.length > 0);
    assert.ok(racket.primaryTraitTags.length > 0 && racket.primaryTraitTags.length <= 3);
    assert.ok(racket.traitSummary.length > 12);
    assert.ok(racket.stages.length > 0 && racket.stages.every((stage) => allowedStages.has(stage)));
    assert.ok(racket.styles.length === 2 && racket.styles.every((style) => allowedStyles.has(style)));
    assert.deepEqual(Object.keys(racket.scores).sort(), scoreKeys);
    Object.values(racket.scores).forEach((score) => {
      assert.ok(Number.isInteger(score));
      assert.ok(score >= 50 && score <= 97);
    });
  });
});

test("preserves unknown official specs instead of presenting zeroes", () => {
  const astrel = findProfile("yonex-astrel", "ASTREL 105");
  assert.equal(astrel.official.weight, 260);
  assert.equal(astrel.official.length, 27);
  assert.equal(officialWeight(astrel), 260);
  assert.equal(formatNumberSpec(officialWeight(astrel), "g"), "260 g");
  assert.equal(astrel.releaseDate, "官网未注明");

  const tempo = findProfile("tecnifibre-tempo-v2", "Tempo 275 V2");
  assert.equal(tempo.official.head, 105);
  assert.equal(officialHead(tempo), 105);
  assert.equal(formatNumberSpec(officialHead(tempo), "in²"), "105 in²");
  assert.equal(tempo.official.balance, null);
  assert.equal(tempo.official.beam, null);
});

test("keeps key specification relationships directionally coherent", () => {
  const bladeOpen = findProfile("wilson-blade-v10", "Blade 98 16×19 V10");
  const bladeDense = findProfile("wilson-blade-v10", "Blade 98 18×20 V10");
  assert.ok(bladeDense.scores.control >= bladeOpen.scores.control);
  assert.ok(bladeDense.scores.spin <= bladeOpen.scores.spin);

  const bladeStandard = findProfile("wilson-blade-v10", "Blade 100 V10");
  const bladeUltraLight = findProfile("wilson-blade-v10", "Blade 100UL V10");
  assert.ok(bladeUltraLight.scores.agility > bladeStandard.scores.agility);
  assert.ok(bladeUltraLight.scores.forgiveness >= bladeStandard.scores.forgiveness);

  const ultra100 = findProfile("wilson-ultra-v5", "Ultra 100 V5");
  const ultra111 = findProfile("wilson-ultra-v5", "Ultra 111 V5");
  assert.ok(ultra111.scores.forgiveness > ultra100.scores.forgiveness);
});
