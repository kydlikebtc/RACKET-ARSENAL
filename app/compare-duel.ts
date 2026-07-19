import type { ScoreKey } from "./racket-profiles";

/**
 * 好友球拍对决的纯判定逻辑。零运行时依赖（仅类型导入），便于 node --test
 * 直接单测；胜负只基于拍库六维相对评估，措辞与免责由调用方负责。
 */
export type DuelSide = "a" | "b" | "tie";

export const duelScoreKeys: readonly ScoreKey[] = ["control", "power", "spin", "agility", "forgiveness", "feel"];

/** 六维为相对评估；绝对分差不超过 2 分时按接近处理，避免把模型噪声包装成胜负。 */
export const duelTieTolerance = 2;

export type DuelVerdicts = {
  verdicts: Record<ScoreKey, DuelSide>;
  aWins: number;
  bWins: number;
  ties: number;
};

/** 逐维比较两把球拍的六维评分：超过容差才算略高，否则按接近处理。 */
export function buildDuelVerdicts(scoresA: Record<ScoreKey, number>, scoresB: Record<ScoreKey, number>): DuelVerdicts {
  const verdicts = {} as Record<ScoreKey, DuelSide>;
  let aWins = 0;
  let bWins = 0;
  let ties = 0;
  for (const key of duelScoreKeys) {
    const a = scoresA[key];
    const b = scoresB[key];
    if (a - b > duelTieTolerance) {
      verdicts[key] = "a";
      aWins += 1;
    } else if (b - a > duelTieTolerance) {
      verdicts[key] = "b";
      bWins += 1;
    } else {
      verdicts[key] = "tie";
      ties += 1;
    }
  }
  return { verdicts, aWins, bWins, ties };
}

/** 比分摘要一行文本：领先维计数，平分维不计入任一方，全平如实说全平。 */
export function duelScoreSummary(result: DuelVerdicts, aName: string, bName: string) {
  if (result.aWins === 0 && result.bWins === 0) return `六维战报：${aName} 与 ${bName} 六维全部接近`;
  const base = `六维战报 ${aName} ${result.aWins} : ${result.bWins} ${bName}`;
  if (result.aWins === result.bWins) return `${base}，领先维数持平`;
  return result.ties > 0 ? `${base}（另有 ${result.ties} 维接近）` : base;
}
