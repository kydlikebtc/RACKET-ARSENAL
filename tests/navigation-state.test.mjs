import assert from "node:assert/strict";
import test from "node:test";
import {
  appViewIds,
  formatArmoryRouteState,
  formatAppRoute,
  formatTourRouteState,
  normalizeArmoryFilters,
  parentAppRoute,
  parseArmoryRouteState,
  parseAppRoute,
  parseTourRouteState,
} from "../app/navigation-state.ts";

const armoryFilterConfig = {
  scopes: ["families", "models"],
  brands: ["全部", "Wilson", "HEAD", "YONEX"],
  types: ["全部", "控制", "旋转", "力量"],
  generations: ["全部代际", "V10", "第 8 代", "2026"],
  releaseYears: ["全部年份", "2026", "2025", "2024", "2023及更早", "官网未注明"],
  sorts: ["最新发行", "品牌顺序", "型号数量"],
  defaults: {
    scope: "families",
    brand: "全部",
    type: "全部",
    generation: "全部代际",
    releaseYear: "全部年份",
    search: "",
    sort: "最新发行",
  },
  maxSearchLength: 100,
};

test("round-trips every top-level app view", () => {
  assert.deepEqual(appViewIds, ["discover", "match", "armory", "tour", "compare"]);

  for (const view of appViewIds) {
    const route = { view };
    assert.equal(formatAppRoute(route), `#${view}`);
    assert.deepEqual(parseAppRoute(formatAppRoute(route)), route);
  }
});

test("round-trips a family route and safely encodes its id", () => {
  const route = { view: "armory", familyId: "Wilson/Blade V10" };
  const hash = formatAppRoute(route);

  assert.equal(hash, "#armory/family/Wilson%2FBlade%20V10");
  assert.deepEqual(parseAppRoute(hash), route);
});

test("round-trips a racket nested under its family", () => {
  const route = {
    view: "tour",
    familyId: "head-speed-2026",
    racketId: "Speed PRO 16×19/2026",
  };
  const hash = formatAppRoute(route);

  assert.equal(hash, "#tour/family/head-speed-2026/racket/Speed%20PRO%2016%C3%9719%2F2026");
  assert.deepEqual(parseAppRoute(hash), route);
});

test("round-trips a direct racket route without inventing a family", () => {
  const route = { view: "compare", racketId: "catalog-yonex-ezone-8-1" };
  const hash = formatAppRoute(route);

  assert.equal(hash, "#compare/racket/catalog-yonex-ezone-8-1");
  assert.deepEqual(parseAppRoute(hash), route);
});

test("round-trips all match steps and returns their semantic parent", () => {
  for (const step of [0, 1, 2, 3]) {
    const route = { view: "match", matchStep: step };
    assert.equal(formatAppRoute(route), `#match/step/${step}`);
    assert.deepEqual(parseAppRoute(formatAppRoute(route)), route);
  }

  assert.deepEqual(parentAppRoute({ view: "match", matchStep: 3 }), { view: "match", matchStep: 2 });
  assert.deepEqual(parentAppRoute({ view: "match", matchStep: 1 }), { view: "match", matchStep: 0 });
  assert.deepEqual(parentAppRoute({ view: "match", matchStep: 0 }), { view: "match" });
});

test("returns the correct parent for nested and direct routes", () => {
  assert.deepEqual(
    parentAppRoute({ view: "armory", familyId: "wilson-blade-v10", racketId: "blade-98" }),
    { view: "armory", familyId: "wilson-blade-v10" },
  );
  assert.deepEqual(
    parentAppRoute({ view: "tour", racketId: "ezone-98" }),
    { view: "tour" },
  );
  assert.deepEqual(
    parentAppRoute({ view: "armory", familyId: "yonex-ezone-8" }),
    { view: "armory" },
  );
  assert.deepEqual(parentAppRoute({ view: "match" }), { view: "match" });
});

test("falls back safely for empty and invalid routes", () => {
  assert.deepEqual(parseAppRoute(""), { view: "discover" });
  assert.deepEqual(parseAppRoute("#"), { view: "discover" });
  assert.deepEqual(parseAppRoute("#not-a-view"), { view: "discover" });
  assert.deepEqual(parseAppRoute("#armory/unknown/value"), { view: "armory" });
  assert.deepEqual(parseAppRoute("#armory/family"), { view: "armory" });
  assert.deepEqual(parseAppRoute("#tour/racket"), { view: "tour" });
  assert.deepEqual(parseAppRoute("#match/step/4"), { view: "match" });
  assert.deepEqual(parseAppRoute("#match/step/not-a-number"), { view: "match" });
});

test("drops malformed encoded ids without throwing", () => {
  assert.doesNotThrow(() => parseAppRoute("#armory/family/%E0%A4%A"));
  assert.deepEqual(parseAppRoute("#armory/family/%E0%A4%A"), { view: "armory" });

  assert.doesNotThrow(() => parseAppRoute("#tour/racket/%ZZ"));
  assert.deepEqual(parseAppRoute("#tour/racket/%ZZ"), { view: "tour" });
});

test("parses routes independently from Armory query state", () => {
  assert.deepEqual(
    parseAppRoute("#armory/family/wilson-blade-v10/racket/blade-98?brand=Wilson&q=Blade+98"),
    { view: "armory", familyId: "wilson-blade-v10", racketId: "blade-98" },
  );
});

test("round-trips every Armory filter in a stable shareable order", () => {
  const filters = {
    scope: "models",
    brand: "Wilson",
    type: "控制",
    generation: "V10",
    releaseYear: "2025",
    search: "Blade 98",
    sort: "品牌顺序",
  };
  const hash = formatArmoryRouteState({ view: "armory" }, filters, armoryFilterConfig);

  assert.equal(
    hash,
    "#armory?scope=models&brand=Wilson&type=%E6%8E%A7%E5%88%B6&gen=V10&year=2025&q=Blade+98&sort=%E5%93%81%E7%89%8C%E9%A1%BA%E5%BA%8F",
  );
  assert.deepEqual(parseArmoryRouteState(hash, armoryFilterConfig), {
    route: { view: "armory" },
    filters,
    canonicalHash: hash,
    shouldReplace: false,
  });
});

test("preserves Armory filters on nested family and racket overlay routes", () => {
  const route = {
    view: "armory",
    familyId: "Wilson/Blade V10",
    racketId: "Blade 98 16×19 V10",
  };
  const filters = {
    scope: "families",
    brand: "Wilson",
    type: "控制",
    generation: "V10",
    releaseYear: "2026",
    search: "Blade",
    sort: "型号数量",
  };
  const hash = formatArmoryRouteState(route, filters, armoryFilterConfig);
  const parsed = parseArmoryRouteState(hash, armoryFilterConfig);

  assert.deepEqual(parsed.route, route);
  assert.deepEqual(parsed.filters, filters);
  assert.equal(parsed.canonicalHash, hash);
  assert.equal(parsed.shouldReplace, false);
});

test("omits defaults so the unfiltered Armory URL stays clean", () => {
  assert.equal(
    formatArmoryRouteState({ view: "armory" }, armoryFilterConfig.defaults, armoryFilterConfig),
    "#armory",
  );
  assert.deepEqual(parseArmoryRouteState("#armory", armoryFilterConfig), {
    route: { view: "armory" },
    filters: armoryFilterConfig.defaults,
    canonicalHash: "#armory",
    shouldReplace: false,
  });
});

test("cleans invalid, duplicate, unknown, and overlong Armory parameters once", () => {
  const dirtyHash = `#armory/family/wilson-blade-v10?brand=Unknown&brand=Wilson&type=not-a-type&gen=not-a-generation&year=2099&q=${encodeURIComponent(`  ${"x".repeat(120)}   blade  `)}&sort=unknown&debug=1`;
  const parsed = parseArmoryRouteState(dirtyHash, armoryFilterConfig);

  assert.deepEqual(parsed.route, { view: "armory", familyId: "wilson-blade-v10" });
  assert.deepEqual(parsed.filters, {
    ...armoryFilterConfig.defaults,
    search: "x".repeat(100),
  });
  assert.equal(parsed.shouldReplace, true);
  assert.equal(parsed.canonicalHash, `#armory/family/wilson-blade-v10?q=${"x".repeat(100)}`);

  const canonical = parseArmoryRouteState(parsed.canonicalHash, armoryFilterConfig);
  assert.equal(canonical.canonicalHash, parsed.canonicalHash);
  assert.equal(canonical.shouldReplace, false);
});

test("normalizes whitespace and rejects filter values outside their allowlists", () => {
  assert.deepEqual(normalizeArmoryFilters({
    scope: "models",
    brand: "HEAD",
    type: "不存在",
    generation: "2026",
    releaseYear: "2024",
    search: "  Speed\n\t MP   2024  ",
    sort: "品牌顺序",
  }, armoryFilterConfig), {
    scope: "models",
    brand: "HEAD",
    type: "全部",
    generation: "2026",
    releaseYear: "2024",
    search: "Speed MP 2024",
    sort: "品牌顺序",
  });
});

test("drops Armory query state on other tabs instead of leaking it across routes", () => {
  const parsed = parseArmoryRouteState("#tour?brand=Wilson&q=Blade", armoryFilterConfig);

  assert.deepEqual(parsed.route, { view: "tour" });
  assert.deepEqual(parsed.filters, armoryFilterConfig.defaults);
  assert.equal(parsed.canonicalHash, "#tour");
  assert.equal(parsed.shouldReplace, true);
  assert.equal(
    formatArmoryRouteState({ view: "compare", racketId: "blade-98" }, { brand: "Wilson" }, armoryFilterConfig),
    "#compare/racket/blade-98",
  );
});

test("round-trips a shareable WTA Tour filter on base and overlay routes", () => {
  assert.equal(formatTourRouteState({ view: "tour" }, "ATP"), "#tour");
  assert.equal(formatTourRouteState({ view: "tour" }, "WTA"), "#tour?tour=WTA");
  const overlay = "#tour/family/yonex-ezone-8/racket/ezone-100?tour=WTA";
  assert.deepEqual(parseTourRouteState(overlay), {
    route: { view: "tour", familyId: "yonex-ezone-8", racketId: "ezone-100" },
    tour: "WTA",
    canonicalHash: overlay,
    shouldReplace: false,
  });
});

test("canonicalizes invalid Tour query state and drops it from other tabs", () => {
  assert.deepEqual(parseTourRouteState("#tour?tour=ITF&tour=WTA&debug=1"), {
    route: { view: "tour" },
    tour: "ATP",
    canonicalHash: "#tour",
    shouldReplace: true,
  });
  assert.deepEqual(parseTourRouteState("#armory?tour=WTA"), {
    route: { view: "armory" },
    tour: "ATP",
    canonicalHash: "#armory",
    shouldReplace: true,
  });
  assert.equal(formatTourRouteState({ view: "compare" }, "WTA"), "#compare");
});
