import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { catalogFamilies, catalogModelCount } from "../app/catalog-data.ts";
import { catalogModelImages } from "../app/catalog-model-images.ts";
import { catalogRacketId, deepRackets } from "../app/racket-profiles.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const modelImageRoot = path.join(publicRoot, "rackets", "models");
const officialDomains = new Map([
  ["Wilson", "wilson.com"],
  ["Yonex", "yonex.com"],
  ["Babolat", "babolat.com"],
  ["HEAD", "head.com"],
  ["Tecnifibre", "tecnifibre.com"],
  ["Dunlop", "dunlopsports.com"],
  ["Völkl", "volkltennis.com"],
  ["Prince", "princetennis.jp"],
  ["Solinco", "solincosports.com"],
  ["ProKennex", "prokennex.com"],
  ["Diadem", "diademsports.com"],
]);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  }));
  return nested.flat();
}

test("every yearbook model has a traced local official-product gallery", async () => {
  const models = catalogFamilies.flatMap((family) => family.models.map((model, modelIndex) => ({
    id: catalogRacketId(family, modelIndex),
    brand: family.brand,
    familyId: family.id,
    name: model.name,
    sourceUrl: model.url,
  })));

  assert.equal(models.length, catalogModelCount);
  assert.equal(Object.keys(catalogModelImages).length, catalogModelCount);
  assert.deepEqual(
    Object.keys(catalogModelImages).sort(),
    models.map((model) => model.id).sort(),
    "the image manifest must contain exactly the live catalog models",
  );

  const localPaths = new Set();
  const contentOwners = new Map();
  for (const model of models) {
    const record = catalogModelImages[model.id];
    assert.ok(record, `${model.brand} ${model.name} is missing its model gallery`);
    assert.equal(record.sourceKind, "official-product", `${model.name} must be traced to an official product page`);
    assert.equal(record.sourceUrl, model.sourceUrl, `${model.name} image provenance must match its catalog product link`);
    assert.match(record.sourceUrl, /^https:\/\//, `${model.name} image source must use HTTPS`);
    const officialDomain = officialDomains.get(model.brand);
    assert.ok(officialDomain, `${model.brand} needs an official image-domain rule`);
    const sourceHost = new URL(record.sourceUrl).hostname.toLowerCase();
    assert.ok(sourceHost === officialDomain || sourceHost.endsWith(`.${officialDomain}`), `${model.name} image source must be on the ${model.brand} official domain`);
    assert.match(record.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${model.name} must have a verification date`);
    const verifiedAt = Date.parse(`${record.verifiedAt}T00:00:00Z`);
    assert.ok(Number.isFinite(verifiedAt) && verifiedAt <= Date.now() + 86_400_000, `${model.name} verification date cannot be in the future`);
    assert.ok(record.images.length >= 1 && record.images.length <= 4, `${model.name} must have a compact local gallery`);

    for (const imagePath of record.images) {
      assert.match(imagePath, /^\/rackets\/models\/[a-z0-9-]+\/[a-z0-9-]+-\d+\.webp$/, `${model.name} must use a local WebP asset`);
      assert.ok(imagePath.includes(`/${model.id}-`), `${model.name} image filename must retain its stable model id`);
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

      const hash = createHash("sha256").update(await readFile(absolutePath)).digest("hex");
      const previousOwner = contentOwners.get(hash);
      if (previousOwner) {
        assert.notEqual(previousOwner.id, model.id, `${model.name} must not repeat the same image inside its own gallery`);
        assert.equal(previousOwner.brand, model.brand, `${model.name} must not share image bytes across brands`);
        assert.equal(previousOwner.familyId, model.familyId, `${model.name} must not share image bytes across racket families`);
      } else {
        contentOwners.set(hash, { id: model.id, brand: model.brand, familyId: model.familyId });
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
