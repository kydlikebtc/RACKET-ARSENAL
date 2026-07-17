import assert from "node:assert/strict";
import test from "node:test";
import { catalogFamilies } from "../app/catalog-data.ts";
import { deepRackets } from "../app/racket-profiles.ts";
import { tourPlayers } from "../app/tour-data.ts";
import { tourCatalogTargets, tourRacketTargetId } from "../app/tour-links.ts";

test("links every tour player to an existing catalog family or exact retail dossier", () => {
  assert.deepEqual(Object.keys(tourCatalogTargets).sort(), tourPlayers.map((player) => player.id).sort());

  for (const player of tourPlayers) {
    const target = tourCatalogTargets[player.id];
    const family = catalogFamilies.find((item) => item.id === target.familyId);
    assert.ok(family, `missing family target for ${player.id}`);
    assert.equal(family.brand, player.brand);

    if (player.mapping === "系列级映射" || player.mapping === "当前拍系参考") {
      assert.equal(target.kind, "family");
      assert.equal(tourRacketTargetId(player.id), null);
      continue;
    }

    assert.equal(target.kind, "racket");
    const racket = deepRackets.find((item) => item.id === target.racketId);
    assert.ok(racket, `missing racket target for ${player.id}`);
    assert.equal(racket.familyId, target.familyId);
    assert.equal(racket.brand, player.brand);
    assert.equal(tourRacketTargetId(player.id), racket.id);
  }
});

test("keeps each tour snapshot complete, uniquely ranked, and source-backed", () => {
  for (const tour of ["ATP", "WTA"]) {
    const players = tourPlayers.filter((player) => player.tour === tour);
    assert.equal(players.length, 8);
    assert.deepEqual(players.map((player) => player.rank).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
    for (const player of players) {
      assert.match(player.profileUrl, /^https:\/\//);
      assert.match(player.gearUrl, /^https:\/\//);
    }
  }
});
