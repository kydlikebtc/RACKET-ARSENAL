import { beamAverage, normalizedPattern, patternRanks, type DeepRacket } from "./racket-profiles";

/**
 * 「找相似的拍」的确定性相似度口径：五项官网公开硬规格的归一化距离。
 * 每维差异 = |Δ| / 固定刻度，五维取均值；刻度即「源码即规格」的一部分，
 * 调整任何一项都视为口径变更并需要同步测试。
 */
export const similarityScales = {
  head: 15, // in²：常见成人性能拍拍面跨度
  weight: 45, // g：裸拍重量跨度
  pattern: 4, // patternRanks 序数全跨度（-2 … 2）
  balance: 25, // mm：静态平衡点跨度
  beam: 7, // mm：平均框厚跨度
} as const;

export type SimilarityKey = keyof typeof similarityScales;

export const similarityKeys: readonly SimilarityKey[] = ["head", "weight", "pattern", "balance", "beam"];

export const similarityDimensionLabels: Record<SimilarityKey, string> = {
  head: "拍面",
  weight: "重量",
  pattern: "线床",
  balance: "平衡点",
  beam: "框厚",
};

/** 五维归一化差全部低于该值时，视为「五项规格几乎一致」。 */
export const NEAR_IDENTICAL_DIFF = 0.1;

export const NEAR_IDENTICAL_LABEL = "五项规格几乎一致";

type SimilaritySpecs = {
  head: number;
  weight: number;
  pattern: string;
  patternRank: number | null;
  balance: number;
  beam: number;
};

export type SimilarRacketEntry = {
  id: string;
  racket: DeepRacket;
  distance: number;
  normalizedDiffs: Record<SimilarityKey, number>;
  /** 最大差异维；五维几乎一致时为 null。 */
  maxDiffKey: SimilarityKey | null;
  maxDiffLabel: string;
  nearIdentical: boolean;
};

export type SimilarRacketsOutcome =
  | { status: "ok"; entries: SimilarRacketEntry[] }
  | { status: "missing-specs"; missing: string[] };

function formatSpecDelta(value: number) {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : String(Number(rounded.toFixed(2)));
  return rounded > 0 ? `+${text}` : text;
}

function readSimilaritySpecs(racket: DeepRacket): { specs: SimilaritySpecs | null; missing: string[] } {
  const official = racket.official;
  const head = official?.head ?? null;
  const weight = official?.weight ?? null;
  const pattern = official?.pattern ?? null;
  const balance = official?.balance ?? null;
  const beam = official ? beamAverage(official.beam) : null;
  const missing: string[] = [];
  if (head === null) missing.push(similarityDimensionLabels.head);
  if (weight === null) missing.push(similarityDimensionLabels.weight);
  if (pattern === null) missing.push(similarityDimensionLabels.pattern);
  if (balance === null) missing.push(similarityDimensionLabels.balance);
  if (beam === null) missing.push(similarityDimensionLabels.beam);
  if (missing.length > 0) return { specs: null, missing };
  const normalized = normalizedPattern(pattern);
  return {
    specs: {
      head: head as number,
      weight: weight as number,
      pattern: pattern as string,
      patternRank: normalized !== null ? patternRanks[normalized] ?? null : null,
      balance: balance as number,
      beam: beam as number,
    },
    missing,
  };
}

function patternDiff(target: SimilaritySpecs, candidate: SimilaritySpecs) {
  if (target.patternRank !== null && candidate.patternRank !== null) {
    return Math.abs(target.patternRank - candidate.patternRank) / similarityScales.pattern;
  }
  return normalizedPattern(target.pattern) === normalizedPattern(candidate.pattern) ? 0 : 1;
}

function maxDiffDescription(key: SimilarityKey, target: SimilaritySpecs, candidate: SimilaritySpecs) {
  if (key === "pattern") return `线床 ${candidate.pattern} vs ${target.pattern}`;
  const units: Record<Exclude<SimilarityKey, "pattern">, string> = { head: "in²", weight: "g", balance: "mm", beam: "mm" };
  const delta = candidate[key] - target[key];
  return `${similarityDimensionLabels[key]} ${formatSpecDelta(delta)} ${units[key]}`;
}

/**
 * 返回与目标型号规格最接近的他牌型号（每拍系最多一把），或在目标规格不全时
 * 返回缺失维度清单。纯函数：同一输入永远得到同一输出，不触 DOM/存储。
 */
export function buildSimilarRackets(target: DeepRacket, pool: readonly DeepRacket[], limit = 3): SimilarRacketsOutcome {
  const targetRead = readSimilaritySpecs(target);
  if (!targetRead.specs) return { status: "missing-specs", missing: targetRead.missing };
  const targetSpecs = targetRead.specs;

  const candidates: SimilarRacketEntry[] = [];
  for (const racket of pool) {
    if (racket.id === target.id || racket.brand === target.brand) continue;
    const candidateRead = readSimilaritySpecs(racket);
    if (!candidateRead.specs) continue;
    const specs = candidateRead.specs;
    const normalizedDiffs: Record<SimilarityKey, number> = {
      head: Math.abs(specs.head - targetSpecs.head) / similarityScales.head,
      weight: Math.abs(specs.weight - targetSpecs.weight) / similarityScales.weight,
      pattern: patternDiff(targetSpecs, specs),
      balance: Math.abs(specs.balance - targetSpecs.balance) / similarityScales.balance,
      beam: Math.abs(specs.beam - targetSpecs.beam) / similarityScales.beam,
    };
    const distance = similarityKeys.reduce((sum, key) => sum + normalizedDiffs[key], 0) / similarityKeys.length;
    const nearIdentical = similarityKeys.every((key) => normalizedDiffs[key] < NEAR_IDENTICAL_DIFF);
    let maxDiffKey: SimilarityKey = similarityKeys[0];
    for (const key of similarityKeys) if (normalizedDiffs[key] > normalizedDiffs[maxDiffKey]) maxDiffKey = key;
    candidates.push({
      id: racket.id,
      racket,
      distance,
      normalizedDiffs,
      maxDiffKey: nearIdentical ? null : maxDiffKey,
      maxDiffLabel: nearIdentical ? NEAR_IDENTICAL_LABEL : maxDiffDescription(maxDiffKey, targetSpecs, specs),
      nearIdentical,
    });
  }

  candidates.sort((left, right) => left.distance - right.distance || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));

  const usedFamilies = new Set<string>();
  const entries: SimilarRacketEntry[] = [];
  for (const candidate of candidates) {
    const familyKey = candidate.racket.familyId ?? candidate.racket.series;
    if (usedFamilies.has(familyKey)) continue;
    usedFamilies.add(familyKey);
    entries.push(candidate);
    if (entries.length >= limit) break;
  }
  return { status: "ok", entries };
}
