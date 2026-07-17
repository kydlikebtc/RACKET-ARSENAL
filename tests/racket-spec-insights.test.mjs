import assert from "node:assert/strict";
import test from "node:test";
import { catalogFamilies, catalogModelCount } from "../app/catalog-data.ts";
import { buildRacketSpecInsights, deepRackets } from "../app/racket-profiles.ts";

const specKeys = ["head", "weight", "pattern", "balance", "beam", "length"];

function findProfile(model) {
  const profile = deepRackets.find((racket) => racket.model === model);
  assert.ok(profile, `missing profile for ${model}`);
  return profile;
}

test("gives all 259 rackets one complete, null-safe specification presentation", () => {
  assert.equal(deepRackets.length, catalogModelCount);
  assert.equal(catalogModelCount, 259);

  for (const family of catalogFamilies) {
    for (const model of family.models) {
      const insights = buildRacketSpecInsights(family, model);
      const knownCount = [model.head, model.weight, model.pattern, model.balance, model.beam, model.length]
        .filter((value) => value !== null).length;

      assert.deepEqual(insights.specTags.map((tag) => tag.key), specKeys, `${model.name} must keep the six canonical specification dimensions`);
      assert.equal(insights.knownSpecCount, knownCount, `${model.name} must not convert an unknown field to zero`);
      assert.equal(insights.mainstreamSpecCount, insights.specTags.filter((tag) => tag.mainstream).length);
      assert.ok(insights.traitTags.length >= 1, `${model.name} needs at least one trait or disclosure tag`);
      assert.ok(insights.primaryTraitTags.length >= 1 && insights.primaryTraitTags.length <= 3);
      insights.primaryTraitTags.forEach((tag) => assert.ok(insights.traitTags.includes(tag)));
      assert.ok(insights.traitSummary.trim().length >= 12);
      assert.doesNotMatch(insights.traitSummary, /NaN|undefined|null/);
      assert.equal(insights.isMainstream && !insights.mainstreamKnown, false, `${model.name} cannot be mainstream until all five defining fields are known`);

      for (const tag of insights.specTags) {
        assert.ok(tag.label.trim().length > 0);
        if (!tag.known) {
          assert.equal(tag.mainstream, false);
          assert.match(tag.label, /待补$/);
        }
      }
    }
  }
});

test("distinguishes a full mainstream reference from a partial core specification", () => {
  const blade = findProfile("Blade 100 V10");
  assert.equal(blade.isMainstream, true);
  assert.equal(blade.mainstreamKnown, true);
  assert.equal(blade.mainstreamSpecCount, 6);
  assert.ok(blade.traitTags.includes("主流规格"));
  assert.ok(blade.specTags.every((tag) => tag.mainstream));

  const family = catalogFamilies[0];
  const partial = buildRacketSpecInsights(family, {
    name: "Synthetic Core Reference",
    head: 100,
    weight: 300,
    pattern: "16x19",
    balance: null,
    beam: "22",
    length: 27,
    url: "https://example.com/racket",
  });
  assert.equal(partial.mainstreamKnown, false);
  assert.equal(partial.isMainstream, false);
  assert.ok(partial.traitTags.includes("主流核心规格"));
  assert.ok(!partial.traitTags.includes("主流规格"));
});

test("summarizes distinctive heavy, oversized, open-pattern, and extended models", () => {
  const mid = findProfile("PB 10 Mid");
  for (const tag of ["小拍面精准", "重型穿透", "薄框手感", "头轻灵活"]) assert.ok(mid.traitTags.includes(tag));

  const oversized = findProfile("ASTREL 120");
  for (const tag of ["超大拍面省力", "超轻易挥", "开放旋转", "厚框弹力", "偏头重借力"]) assert.ok(oversized.traitTags.includes(tag));

  const extended = findProfile("VÖSTRA V3");
  assert.ok(extended.traitTags.includes("加长增压"));
});

test("keeps sparse and empty specifications explicit instead of inventing traits", () => {
  const nova = findProfile("Nova ELT");
  assert.equal(nova.knownSpecCount, 2);
  assert.equal(nova.isMainstream, false);
  assert.deepEqual(nova.traitTags, ["参数待补"]);
  assert.match(nova.traitSummary, /已公开 2\/6 项/);
  for (const key of ["weight", "balance", "beam", "length"]) {
    const tag = nova.specTags.find((item) => item.key === key);
    assert.equal(tag.known, false);
    assert.equal(tag.mainstream, false);
  }

  const empty = buildRacketSpecInsights(catalogFamilies[0], {
    name: "Synthetic Unknown",
    head: null,
    weight: null,
    pattern: null,
    balance: null,
    beam: null,
    length: null,
    url: "https://example.com/unknown",
  });
  assert.equal(empty.knownSpecCount, 0);
  assert.equal(empty.isMainstream, false);
  assert.deepEqual(empty.traitTags, ["参数待补"]);
  assert.ok(empty.specTags.every((tag) => !tag.known && !tag.mainstream));
  assert.match(empty.traitSummary, /已公开 0\/6 项/);
});
