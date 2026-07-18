import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { catalogBrandProfiles } from "../app/brand-data.ts";
import { catalogBrands } from "../app/catalog-data.ts";

test("covers every catalog brand with one local logo asset", async () => {
  const profileBrands = Object.keys(catalogBrandProfiles);
  assert.deepEqual([...profileBrands].sort(), [...catalogBrands].sort());
  assert.equal(profileBrands.length, 11);

  const logoPaths = profileBrands.map((brand) => catalogBrandProfiles[brand].logo);
  assert.equal(new Set(logoPaths).size, logoPaths.length);
  assert.ok(logoPaths.every((path) => path.startsWith("/brands/") && !path.includes("..")));

  for (const brand of profileBrands) {
    const profile = catalogBrandProfiles[brand];
    const file = new URL(`../public${profile.logo}`, import.meta.url);
    const info = await stat(file);
    assert.ok(info.isFile() && info.size > 100, `${brand} logo must be a non-empty local file`);
    assert.ok(info.size < 250_000, `${brand} logo should stay lightweight`);
  }
});

test("keeps logo provenance explicit and tied to each official brand domain", () => {
  for (const [brand, profile] of Object.entries(catalogBrandProfiles)) {
    assert.equal(new URL(profile.sourcePage).hostname.replace(/^www\./u, ""), profile.officialDomain, brand);
    assert.equal(new URL(profile.assetSource).protocol, "https:", brand);
    assert.match(profile.verifiedAt, /^\d{4}-\d{2}-\d{2}$/u, brand);
    assert.match(profile.accent, /^#[0-9a-f]{6}$/iu, brand);
  }
});

test("ships inert SVG marks without scripts or remote runtime dependencies", async () => {
  const svgProfiles = Object.entries(catalogBrandProfiles).filter(([, profile]) => profile.logo.endsWith(".svg"));
  assert.ok(svgProfiles.length >= 6);

  for (const [brand, profile] of svgProfiles) {
    const source = await readFile(new URL(`../public${profile.logo}`, import.meta.url), "utf8");
    assert.match(source, /<svg\b/iu, brand);
    assert.match(source, /(?:viewBox|\bwidth)=/u, brand);
    assert.doesNotMatch(source, /<script\b|<foreignObject\b|(?:xlink:)?href=["']https?:/iu, brand);
  }
});

test("Brand Index renders real marks with a full-name fallback", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /function BrandLogo/);
  assert.match(page, /<BrandLogo brand=\{item\.brand\} \/>/);
  assert.match(page, /profile\.logo/);
  assert.match(page, /brand-logo--fallback/);
  assert.doesNotMatch(page, /item\.brand\.slice\(0, 2\)|family\.brand\.slice\(0, 2\)/);
});
