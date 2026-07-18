/**
 * Pure ranking diff for the match-result priority preview. The preview list
 * is recomputed synchronously in memory; this module only compares the
 * committed baseline ranking with the previewed ranking so the UI can badge
 * position changes without persisting anything. Zero React/DOM dependencies.
 */

export type RankedRacketEntry = { racket: { id: string } };

export type PreviewRankChange = {
  /** Canonical racket id of the previewed entry. */
  id: string;
  /** 0-based position inside the previewed visible window. */
  previewRank: number;
  /** 0-based position in the full baseline list, or null when absent. */
  baselineRank: number | null;
  /** Positive = moved up, negative = moved down, 0 = held (or brand new). */
  delta: number;
  /** True when the racket was outside the baseline visible window. */
  isNew: boolean;
};

/**
 * Compares the first `visibleCount` previewed entries against the committed
 * baseline ranking. Entries beyond the visible window never produce badges,
 * matching the result screen that only renders the top three cards.
 */
export function diffRecommendationRanks(
  baseline: readonly RankedRacketEntry[],
  preview: readonly RankedRacketEntry[],
  visibleCount = 3,
): PreviewRankChange[] {
  const safeCount = Math.max(0, Math.floor(visibleCount));
  const baselineRankById = new Map<string, number>();
  baseline.forEach((entry, index) => {
    if (!baselineRankById.has(entry.racket.id)) baselineRankById.set(entry.racket.id, index);
  });
  return preview.slice(0, safeCount).map((entry, previewRank) => {
    const baselineRank = baselineRankById.get(entry.racket.id) ?? null;
    const isNew = baselineRank === null || baselineRank >= safeCount;
    return {
      id: entry.racket.id,
      previewRank,
      baselineRank,
      delta: isNew || baselineRank === null ? 0 : baselineRank - previewRank,
      isNew,
    };
  });
}

/** Number of visible entries whose position differs from the baseline. */
export function changedRankCount(changes: readonly PreviewRankChange[]) {
  return changes.filter((change) => change.isNew || change.delta !== 0).length;
}
