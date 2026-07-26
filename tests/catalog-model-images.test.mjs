import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { catalogEditionCount, catalogFamilies, catalogModelCount } from "../app/catalog-data.ts";
import { catalogImageSources } from "../app/catalog-image-sources.ts";
import { catalogModelImages } from "../app/catalog-model-images.ts";
import { catalogRacketId, deepRackets } from "../app/racket-profiles.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const modelImageRoot = path.join(publicRoot, "rackets", "models");
const officialDomains = new Map([
  ["Wilson", ["wilson.com", "wilson.co.il"]],
  ["Yonex", ["yonex.com", "yonexmall.com", "yonex.com.hr"]],
  ["Babolat", ["babolat.com"]],
  ["HEAD", ["head.com"]],
  ["Tecnifibre", ["tecnifibre.com"]],
  ["Dunlop", ["dunlopsports.com"]],
  ["Völkl", ["volkltennis.com"]],
  ["Prince", ["princetennis.jp"]],
  ["Solinco", ["solincosports.com"]],
  ["ProKennex", ["prokennex.com"]],
  ["Diadem", ["diademsports.com"]],
]);
const retailerDomains = ["racquetguys.ca", "racquetguys.com", "tennis-warehouse.com", "tenniswarehouse-europe.com"];

function hostMatches(sourceHost, domains) {
  return domains.some((domain) => sourceHost === domain || sourceHost.endsWith(`.${domain}`));
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  }));
  return nested.flat();
}

test("every yearbook model and every available edition image has traced local provenance", async () => {
  const models = catalogFamilies.flatMap((family) => family.models.map((model, modelIndex) => ({
    id: catalogRacketId(family, modelIndex),
    brand: family.brand,
    familyId: family.id,
    name: model.name,
    sourceUrl: catalogImageSources[catalogRacketId(family, modelIndex)]?.sourceUrl ?? model.url,
    sourceKind: catalogImageSources[catalogRacketId(family, modelIndex)]?.sourceKind ?? "official-product",
  })));
  const editions = catalogFamilies.flatMap((family) => family.models.flatMap((model) => (
    (model.editions ?? []).map((edition) => ({
      id: edition.id,
      brand: family.brand,
      familyId: family.id,
      name: `${model.name} / ${edition.name}`,
      sourceUrl: catalogImageSources[edition.id]?.sourceUrl ?? edition.url,
      sourceKind: catalogImageSources[edition.id]?.sourceKind ?? "official-product",
    }))
  )));

  assert.equal(models.length, catalogModelCount);
  assert.equal(editions.length, catalogEditionCount);
  models.forEach((model) => assert.ok(catalogModelImages[model.id], `${model.name} is missing its required model gallery`));
  const tracedAssets = [...models, ...editions.filter((edition) => catalogModelImages[edition.id])];
  assert.deepEqual(
    Object.keys(catalogModelImages).sort(),
    tracedAssets.map((item) => item.id).sort(),
    "the image manifest must contain only live models and successfully synchronized editions",
  );

  const localPaths = new Set();
  const contentOwners = new Map();
  for (const item of tracedAssets) {
    const record = catalogModelImages[item.id];
    assert.ok(record, `${item.brand} ${item.name} is missing its image record`);
    assert.equal(record.sourceKind, item.sourceKind, `${item.name} must retain its curated provenance type`);
    assert.equal(record.sourceUrl, item.sourceUrl, `${item.name} image provenance must match its catalog source link`);
    assert.match(record.sourceUrl, /^https:\/\//, `${item.name} image source must use HTTPS`);
    const sourceHost = new URL(record.sourceUrl).hostname.toLowerCase();
    if (record.sourceKind === "official-product") {
      const domains = officialDomains.get(item.brand);
      assert.ok(domains, `${item.brand} needs an official image-domain rule`);
      assert.ok(hostMatches(sourceHost, domains), `${item.name} image source must be on a ${item.brand} official domain`);
    } else {
      assert.ok(hostMatches(sourceHost, retailerDomains), `${item.name} retailer source is not on the reviewed allowlist`);
    }
    assert.match(record.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${item.name} must have a verification date`);
    const verifiedAt = Date.parse(`${record.verifiedAt}T00:00:00Z`);
    assert.ok(Number.isFinite(verifiedAt) && verifiedAt <= Date.now() + 86_400_000, `${item.name} verification date cannot be in the future`);
    assert.ok(record.images.length >= 1 && record.images.length <= 4, `${item.name} must have a compact local gallery`);

    for (const imagePath of record.images) {
      assert.match(imagePath, /^\/rackets\/models\/[a-z0-9-]+\/[a-z0-9-]+-\d+\.webp$/, `${item.name} must use a local WebP asset`);
      assert.ok(imagePath.includes(`/${item.id}-`), `${item.name} image filename must retain its stable id`);
      assert.ok(!localPaths.has(imagePath), `${imagePath} must not be assigned to two model records`);
      localPaths.add(imagePath);

      const absolutePath = path.join(publicRoot, imagePath.slice(1));
      assert.ok(absolutePath.startsWith(`${modelImageRoot}${path.sep}`), `${imagePath} must stay inside the model image directory`);
      const file = await stat(absolutePath);
      assert.ok(file.size >= 4_000, `${imagePath} is unexpectedly small`);
      assert.ok(file.size <= 2 * 1024 * 1024, `${imagePath} is too large for the app gallery`);
      const metadata = await sharp(absolutePath, { failOn: "error" }).metadata();
      assert.equal(metadata.format, "webp", `${imagePath} must decode as WebP`);
      assert.ok(Math.max(metadata.width ?? 0, metadata.height ?? 0) >= 700, `${imagePath} must retain product-detail resolution`);
      assert.ok(Math.max(metadata.width ?? 0, metadata.height ?? 0) <= 1200, `${imagePath} must stay within the delivery size budget`);
      const aspectRatio = (metadata.width ?? 1) / (metadata.height ?? 1);
      assert.ok(aspectRatio <= 2.15, `${imagePath} must not use a horizontal campaign-banner crop`);

      const hash = createHash("sha256").update(await readFile(absolutePath)).digest("hex");
      const previousOwner = contentOwners.get(hash);
      if (previousOwner) {
        assert.notEqual(previousOwner.id, item.id, `${item.name} must not repeat the same image inside its own gallery`);
        assert.equal(previousOwner.brand, item.brand, `${item.name} must not share image bytes across brands`);
        assert.equal(previousOwner.familyId, item.familyId, `${item.name} must not share image bytes across racket families`);
      } else {
        contentOwners.set(hash, { id: item.id, brand: item.brand, familyId: item.familyId });
      }
    }
  }

  const actualPaths = new Set((await listFiles(modelImageRoot)).map((absolutePath) => (
    `/${path.relative(publicRoot, absolutePath).split(path.sep).join("/")}`
  )));
  assert.deepEqual([...actualPaths].sort(), [...localPaths].sort(), "the local model image directory must not contain orphan files");
});

test("deep dossiers consume their model gallery instead of the family representative image", () => {
  assert.equal(deepRackets.length, catalogModelCount);
  for (const racket of deepRackets) {
    const record = catalogModelImages[racket.id];
    assert.ok(record, `${racket.brand} ${racket.model} is missing its manifest record`);
    assert.deepEqual(racket.images, record.images, `${racket.model} dossier must expose every model-specific image`);
    assert.equal(racket.image, record.images[0], `${racket.model} dossier must use its own primary image`);
    assert.equal(racket.imageSourceUrl, record.sourceUrl, `${racket.model} dossier must preserve image provenance`);
    assert.equal(racket.imageVerifiedAt, record.verifiedAt, `${racket.model} dossier must expose its verification date`);
  }
});
