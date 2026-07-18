import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { catalogFamilies, catalogModelCount } from "../app/catalog-data.ts";
import { catalogRacketId } from "../app/racket-profiles.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(projectRoot, "app", "purchase-link-health.json");
// Bootstrap state: before the first successful networked run of
// `npm run links:check -- --write`, the manifest does not exist yet and the
// guard below is skipped instead of failing the suite offline.
const manifestExists = await stat(manifestPath).then(() => true, () => false);
const skip = manifestExists
  ? false
  : "bootstrap: app/purchase-link-health.json missing — run `npm run links:check -- --write` in a networked environment";

test("purchase link health manifest guards every catalog buy link", { skip }, async () => {
  const { purchaseLinkHealth } = await import("../app/purchase-link-health.ts");
  const models = catalogFamilies.flatMap((family) => family.models.map((model, modelIndex) => ({
    id: catalogRacketId(family, modelIndex),
    brand: family.brand,
    name: model.name,
    url: model.url,
  })));

  assert.equal(models.length, catalogModelCount);
  assert.equal(Object.keys(purchaseLinkHealth).length, catalogModelCount);
  assert.deepEqual(
    Object.keys(purchaseLinkHealth).sort(),
    models.map((model) => model.id).sort(),
    "the link-health manifest must cover exactly the live catalog models",
  );

  const validStatuses = new Set(["ok", "changed", "broken"]);
  for (const model of models) {
    const record = purchaseLinkHealth[model.id];
    assert.ok(record, `${model.brand} ${model.name} is missing its link-health record`);
    assert.equal(record.url, model.url, `${model.name} health record must trace back to its catalog buy link`);
    assert.match(record.url, /^https:\/\//, `${model.name} buy link must use HTTPS`);
    assert.ok(validStatuses.has(record.status), `${model.name} has unknown link status "${record.status}"`);
    assert.ok(
      record.httpStatus === null || Number.isInteger(record.httpStatus),
      `${model.name} httpStatus must be an integer or null`,
    );
    assert.match(record.checkedAt, /^\d{4}-\d{2}-\d{2}$/, `${model.name} must record its check date`);
    const checkedAt = Date.parse(`${record.checkedAt}T00:00:00Z`);
    assert.ok(
      Number.isFinite(checkedAt) && checkedAt <= Date.now() + 86_400_000,
      `${model.name} check date cannot be in the future`,
    );
  }

  const statusByUrl = new Map();
  for (const model of models) {
    const record = purchaseLinkHealth[model.id];
    const previous = statusByUrl.get(record.url);
    if (previous) {
      assert.equal(record.status, previous, `${record.url} is shared by several models and must carry one consistent status`);
    } else {
      statusByUrl.set(record.url, record.status);
    }
  }

  const broken = models
    .filter((model) => purchaseLinkHealth[model.id].status === "broken")
    .map((model) => `${model.brand} ${model.name} → ${model.url}`);
  assert.deepEqual(broken, [], "broken buy links must be fixed in catalog-data.ts (then rerun links:check --write and images:sync)");
});
