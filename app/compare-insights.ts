import { beamAverage, normalizedPattern, patternRanks, type DeepRacket } from "./racket-profiles";

/**
 * 「差异翻译」的确定性判定口径：六项官网公开硬规格的显著差异阈值。
 * 低于阈值的维度不生成句子；阈值本身是「源码即规格」的一部分。
 */
export const compareDiffThresholds = {
  weight: 10, // g
  head: 3, // in²
  pattern: 1, // patternRanks 序差
  balance: 5, // mm
  beam: 2, // mm（均厚）
  length: 0.2, // in
} as const;

export type CompareDiffKey = keyof typeof compareDiffThresholds;

/** 显著度并列时的固定 tie-break 顺序。 */
export const compareDiffOrder: readonly CompareDiffKey[] = ["weight", "head", "pattern", "balance", "beam", "length"];

export const compareDiffLabels: Record<CompareDiffKey, string> = {
  weight: "裸拍重量",
  head: "拍面",
  pattern: "线床",
  balance: "平衡点",
  beam: "框厚",
  length: "长度",
};

export type CompareDiffInsight = {
  key: CompareDiffKey;
  /** 差值 / 阈值，即显著度；输出按其降序排列。 */
  ratio: number;
  /** 原单位差值（线床为 patternRanks 序差）。 */
  diff: number;
  sentence: string;
  /** [句子的主语球拍, 被比较球拍]。 */
  racketIds: [string, string];
};

export type CompareDiffOutcome = {
  status: "not-enough-rackets" | "no-comparable-specs" | "no-significant-diff" | "ok";
  insights: CompareDiffInsight[];
  /** 因官网未公开（或线床无法映射序数）而未参与解读的维度。 */
  excluded: CompareDiffKey[];
  excludedLabels: string[];
  /** 显著度第一的维度，供对比表规格行高亮。 */
  highlightKey: CompareDiffKey | null;
};

function formatDiffValue(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(Number(rounded.toFixed(2)));
}

function specCharacteristic(racket: DeepRacket, key: CompareDiffKey) {
  return (racket.specTags ?? []).find((tag) => tag.key === key)?.characteristic ?? "";
}

function extractValue(racket: DeepRacket, key: CompareDiffKey): number | null {
  const official = racket.official;
  if (!official) return null;
  if (key === "beam") return beamAverage(official.beam);
  if (key === "pattern") {
    const pattern = normalizedPattern(official.pattern);
    if (pattern === null) return null;
    return patternRanks[pattern] ?? null;
  }
  return official[key];
}

type ExtremePair = { high: DeepRacket; low: DeepRacket; diff: number };

/** 取该维极值对；数值并列时按槽位序取先者，保证输出确定。 */
function extremePair(rackets: readonly DeepRacket[], values: readonly number[]): ExtremePair {
  let highIndex = 0;
  let lowIndex = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] > values[highIndex]) highIndex = index;
    if (values[index] < values[lowIndex]) lowIndex = index;
  }
  return { high: rackets[highIndex], low: rackets[lowIndex], diff: values[highIndex] - values[lowIndex] };
}

function buildSentence(key: CompareDiffKey, pair: ExtremePair): { sentence: string; racketIds: [string, string] } {
  const diffText = formatDiffValue(pair.diff);
  const pairChars = (subject: DeepRacket, other: DeepRacket) => `${specCharacteristic(subject, key)} vs ${specCharacteristic(other, key)}`;
  if (key === "weight") {
    return {
      sentence: `${pair.low.model} 比 ${pair.high.model} 轻 ${diffText} g（${pairChars(pair.low, pair.high)}）：挥拍加速与连续调整相对更省力，对抗来球分量时稳定性相对略降。基于规格推断。`,
      racketIds: [pair.low.id, pair.high.id],
    };
  }
  if (key === "head") {
    return {
      sentence: `${pair.high.model} 比 ${pair.low.model} 拍面大 ${diffText} in²（${pairChars(pair.high, pair.low)}）：甜区窗口与容错相对更宽，集中反馈与指向精度相对略降。基于规格推断。`,
      racketIds: [pair.high.id, pair.low.id],
    };
  }
  if (key === "pattern") {
    return {
      sentence: `${pair.high.model}（${pair.high.official?.pattern ?? "—"}）的线床比 ${pair.low.model}（${pair.low.official?.pattern ?? "—"}）更密（${pairChars(pair.high, pair.low)}）：弹道更可预期、控球相对更稳，咬球与上旋窗口相对略窄。基于规格推断。`,
      racketIds: [pair.high.id, pair.low.id],
    };
  }
  if (key === "balance") {
    return {
      sentence: `${pair.high.model} 的平衡点比 ${pair.low.model} 更靠拍头 ${diffText} mm（${pairChars(pair.high, pair.low)}）：借力与拍头惯性相对更足，快速变线的灵活度相对略降。基于规格推断。`,
      racketIds: [pair.high.id, pair.low.id],
    };
  }
  if (key === "beam") {
    return {
      sentence: `${pair.high.model} 的框厚均值比 ${pair.low.model} 厚 ${diffText} mm（${pairChars(pair.high, pair.low)}）：回弹与借力相对更多，持球的细腻反馈相对略少。基于规格推断。`,
      racketIds: [pair.high.id, pair.low.id],
    };
  }
  return {
    sentence: `${pair.high.model} 比 ${pair.low.model} 长 ${diffText} in（${pairChars(pair.high, pair.low)}）：覆盖范围与杠杆增压相对更好，贴身操控相对略难。基于规格推断。`,
    racketIds: [pair.high.id, pair.low.id],
  };
}

/**
 * 把已装载对比球拍的官网硬规格差异翻译成白话句。纯函数：只读
 * racket.official 原始字段，任一装载球拍缺某维即跳过该维并如实披露，
 * 相同输入永远得到相同输出。
 */
export function buildCompareDiffInsights(rackets: readonly DeepRacket[]): CompareDiffOutcome {
  if (rackets.length < 2) {
    return { status: "not-enough-rackets", insights: [], excluded: [], excludedLabels: [], highlightKey: null };
  }

  const excluded: CompareDiffKey[] = [];
  const significant: CompareDiffInsight[] = [];
  let comparableCount = 0;

  for (const key of compareDiffOrder) {
    const values = rackets.map((racket) => extractValue(racket, key));
    if (values.some((value) => value === null)) {
      excluded.push(key);
      continue;
    }
    comparableCount += 1;
    const pair = extremePair(rackets, values as number[]);
    if (pair.diff < compareDiffThresholds[key]) continue;
    const { sentence, racketIds } = buildSentence(key, pair);
    significant.push({ key, ratio: pair.diff / compareDiffThresholds[key], diff: pair.diff, sentence, racketIds });
  }

  significant.sort((left, right) => right.ratio - left.ratio || compareDiffOrder.indexOf(left.key) - compareDiffOrder.indexOf(right.key));
  const insights = significant.slice(0, 3);

  const status = comparableCount === 0
    ? "no-comparable-specs"
    : insights.length === 0
      ? "no-significant-diff"
      : "ok";

  return {
    status,
    insights,
    excluded,
    excludedLabels: excluded.map((key) => compareDiffLabels[key]),
    highlightKey: insights[0]?.key ?? null,
  };
}
