import type { DeepRacket, PlayStyle, Stage } from "./racket-profiles";
import type { TourPlayer } from "./tour-data";
import type { TourCatalogTarget } from "./tour-links";

export type TourSyncProfile = {
  stage: Stage;
  style: PlayStyle;
  priority: string;
};

export type TourSyncScore = (racket: DeepRacket, stage: Stage, style: PlayStyle, priority: string) => number;

export type TourPlayerSync = {
  player: TourPlayer;
  /** Rounded 0-99 sync score derived from the mapped retail racket. */
  syncScore: number;
  /** The dossier racket whose relative rating backs the score. */
  viaRacket: DeepRacket;
  /** Honest mapping tier copied straight from the player record. */
  mapping: TourPlayer["mapping"];
};

/**
 * Ranks every tour player by how closely their brand-published retail racket
 * matches the given profile. The score function is injected (page.tsx passes
 * its exported recommendationScore) to keep this module free of UI imports.
 * Family-level mappings use the best-scoring model inside the family and
 * report that model as the estimation basis. Players whose mapping cannot be
 * resolved to any dossier racket are skipped silently.
 */
export function buildTourPlayerSync(
  players: readonly TourPlayer[],
  targets: Record<string, TourCatalogTarget>,
  rackets: readonly DeepRacket[],
  profile: TourSyncProfile,
  score: TourSyncScore,
): TourPlayerSync[] {
  const racketById = new Map(rackets.map((racket) => [racket.id, racket]));
  const scored = players.flatMap((player) => {
    const target = targets[player.id];
    if (!target) return [];
    let viaRacket: DeepRacket | null = null;
    let rawScore = -Infinity;
    if (target.kind === "racket") {
      const racket = racketById.get(target.racketId);
      if (racket) {
        viaRacket = racket;
        rawScore = score(racket, profile.stage, profile.style, profile.priority);
      }
    } else {
      for (const racket of rackets) {
        if (racket.familyId !== target.familyId) continue;
        const value = score(racket, profile.stage, profile.style, profile.priority);
        if (value > rawScore || (value === rawScore && viaRacket !== null && racket.id.localeCompare(viaRacket.id, "en") < 0)) {
          viaRacket = racket;
          rawScore = value;
        }
      }
    }
    if (viaRacket === null) return [];
    return [{ player, rawScore, sync: { player, syncScore: Math.round(rawScore), viaRacket, mapping: player.mapping } }];
  });
  return scored
    .sort((a, b) => (
      b.rawScore - a.rawScore
      || a.player.tour.localeCompare(b.player.tour, "en")
      || a.player.rank - b.player.rank
    ))
    .map(({ sync }) => sync);
}
