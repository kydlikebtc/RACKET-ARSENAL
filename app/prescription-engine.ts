import type { MatchPriority } from "./match-flow";
import type { DeepRacket, PlayStyle, ScoreKey, Stage } from "./racket-profiles";

export type PrescriptionRole = "稳妥升级" | "定向强化" | "全新取向";
export type PrescriptionAdaptation = "低" | "中" | "高";
export type PrescriptionDeltaBasis = "baseline" | "catalog-median";

export type PrescriptionResult = {
  racket: DeepRacket;
  match: number;
  role: PrescriptionRole;
  adaptation: PrescriptionAdaptation;
  deltas: Record<ScoreKey, number>;
  deltaBasis: PrescriptionDeltaBasis;
  gains: string[];
  tradeoff?: string;
};

const scoreKeys = ["control", "power", "spin", "feel", "forgiveness", "agility"] as const satisfies readonly ScoreKey[];
const prescriptionRoles = ["稳妥升级", "定向强化", "全新取向"] as const satisfies readonly PrescriptionRole[];

const scoreLabels: Record<ScoreKey, string> = {
  control: "控制",
  power: "力量",
  spin: "旋转",
  feel: "手感",
  forgiveness: "容错 / 护臂",
  agility: "灵活",
};

const priorityAxis: Exclude<Record<MatchPriority, ScoreKey | null>, never> = {
  "均衡": null,
  "力量": "power",
  "旋转": "spin",
  "控制": "control",
  "手感": "feel",
  "灵活": "agility",
  "护臂": "forgiveness",
};

const styleAxes: Record<PlayStyle, readonly [ScoreKey, ScoreKey]> = {
  "底线相持": ["control", "forgiveness"],
  "上旋进攻": ["spin", "agility"],
  "全场控制": ["control", "feel"],
  "抢点快攻": ["power", "agility"],
  "舒适护臂": ["forgiveness", "feel"],
};

type ScoreReference = Record<ScoreKey, number>;

type RankedCandidate = {
  racket: DeepRacket;
  profileScore: number;
  deltas: Record<ScoreKey, number>;
  distance: number;
  roleScore: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function average(values: readonly number[]) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function median(values: readonly number[]) {
  if (!values.length) return 75;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function catalogMedianReference(rackets: readonly DeepRacket[]): ScoreReference {
  return Object.fromEntries(scoreKeys.map((key) => [key, median(rackets.map((racket) => racket.scores[key]))])) as ScoreReference;
}

function scoreReference(baseline: DeepRacket | null | undefined, rackets: readonly DeepRacket[]): ScoreReference {
  if (baseline) return { ...baseline.scores };
  return catalogMedianReference(rackets);
}

function familyKey(racket: DeepRacket) {
  return racket.familyId ?? `${racket.brand}::${racket.familyName ?? racket.series}`;
}

function stableRacketKey(racket: DeepRacket) {
  return `${racket.brand}\u0000${familyKey(racket)}\u0000${racket.model}\u0000${racket.id}`;
}

function compareText(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function profileScore(racket: DeepRacket, stage: Stage, style: PlayStyle, priority: MatchPriority) {
  const values = scoreKeys.map((key) => racket.scores[key]);
  const mean = average(values);
  const floor = Math.min(...values);
  const stageFit = racket.stages.includes(stage) ? 16 : 0;
  const styleFit = racket.styles.includes(style) ? 19 : 0;
  const axis = priorityAxis[priority];
  const priorityFit = axis === null
    ? (mean * 0.19) + (floor * 0.08)
    : (racket.scores[axis] * 0.2) + (mean * 0.06);
  return clamp(28 + stageFit + styleFit + priorityFit, 0, 99);
}

function scoreDeltas(racket: DeepRacket, reference: ScoreReference): Record<ScoreKey, number> {
  return Object.fromEntries(scoreKeys.map((key) => [key, Math.round(racket.scores[key] - reference[key])])) as Record<ScoreKey, number>;
}

function scoreDistance(deltas: Record<ScoreKey, number>) {
  return average(scoreKeys.map((key) => Math.abs(deltas[key])));
}

function desiredDelta(deltas: Record<ScoreKey, number>, priority: MatchPriority, style: PlayStyle) {
  const axis = priorityAxis[priority];
  if (axis) return deltas[axis];
  return average(styleAxes[style].map((key) => deltas[key]));
}

function negativeCost(deltas: Record<ScoreKey, number>) {
  return average(scoreKeys.map((key) => Math.max(0, -deltas[key])));
}

function roleScore(
  role: PrescriptionRole,
  racket: DeepRacket,
  baseline: DeepRacket | null | undefined,
  profile: number,
  deltas: Record<ScoreKey, number>,
  distance: number,
  style: PlayStyle,
  priority: MatchPriority,
) {
  const targetGain = desiredDelta(deltas, priority, style);
  const styleGain = average(styleAxes[style].map((key) => deltas[key]));
  const familyContinuity = baseline && familyKey(racket) === familyKey(baseline) ? 5 : 0;
  const typeChange = baseline && racket.familyType !== baseline.familyType ? 4 : 0;

  if (role === "稳妥升级") {
    return profile + 18 - (distance * 0.9) + (Math.max(0, targetGain) * 0.45) - (negativeCost(deltas) * 0.25) + familyContinuity;
  }
  if (role === "定向强化") {
    return profile + (targetGain * 1.3) + (styleGain * 0.35) - (negativeCost(deltas) * 0.18);
  }
  return profile + (distance * 0.65) + typeChange + (racket.styles.includes(style) ? 3 : 0) - (negativeCost(deltas) * 0.12);
}

function adaptationFor(distance: number): PrescriptionAdaptation {
  if (distance <= 4.5) return "低";
  if (distance <= 9.5) return "中";
  return "高";
}

function sortedDeltaEntries(deltas: Record<ScoreKey, number>, direction: "gain" | "loss") {
  return scoreKeys
    .map((key) => ({ key, delta: deltas[key] }))
    .filter(({ delta }) => direction === "gain" ? delta > 0 : delta < 0)
    .sort((left, right) => {
      const magnitude = direction === "gain" ? right.delta - left.delta : left.delta - right.delta;
      return magnitude || scoreKeys.indexOf(left.key) - scoreKeys.indexOf(right.key);
    });
}

function gainReasons(
  racket: DeepRacket,
  deltas: Record<ScoreKey, number>,
  stage: Stage,
  style: PlayStyle,
  priority: MatchPriority,
) {
  const preferred = priorityAxis[priority];
  const gains = sortedDeltaEntries(deltas, "gain");
  if (preferred) {
    gains.sort((left, right) => Number(right.key === preferred) - Number(left.key === preferred) || right.delta - left.delta);
  }
  const reasons = gains.slice(0, 2).map(({ key, delta }) => `${scoreLabels[key]} +${delta}`);
  if (!reasons.length && racket.styles.includes(style)) reasons.push(`打法匹配：${style}`);
  if (!reasons.length && racket.stages.includes(stage)) reasons.push(`阶段匹配：${stage}`);
  if (!reasons.length) reasons.push(`六维接近参考拍，过渡更可预期`);
  return reasons;
}

function tradeoffReason(deltas: Record<ScoreKey, number>) {
  const [largestLoss] = sortedDeltaEntries(deltas, "loss");
  return largestLoss ? `${scoreLabels[largestLoss.key]} ${largestLoss.delta}` : undefined;
}

function rankCandidates(
  rackets: readonly DeepRacket[],
  role: PrescriptionRole,
  baseline: DeepRacket | null | undefined,
  reference: ScoreReference,
  stage: Stage,
  style: PlayStyle,
  priority: MatchPriority,
) {
  return rackets
    .map((racket): RankedCandidate => {
      const deltas = scoreDeltas(racket, reference);
      const distance = scoreDistance(deltas);
      const profile = profileScore(racket, stage, style, priority);
      return {
        racket,
        profileScore: profile,
        deltas,
        distance,
        roleScore: roleScore(role, racket, baseline, profile, deltas, distance, style, priority),
      };
    })
    .sort((left, right) => (
      right.roleScore - left.roleScore
      || right.profileScore - left.profileScore
      || compareText(stableRacketKey(left.racket), stableRacketKey(right.racket))
    ));
}

/**
 * Produces an explainable three-route swap prescription. When no current
 * racket is supplied, score deltas use the input catalog's six-axis medians.
 */
export function buildSwapPrescription(
  rackets: DeepRacket[],
  baseline: DeepRacket | null | undefined,
  stage: Stage,
  style: PlayStyle,
  priority: MatchPriority,
  limit = 3,
): PrescriptionResult[] {
  const resultLimit = clamp(Math.floor(limit), 0, prescriptionRoles.length);
  if (!rackets.length || resultLimit === 0) return [];

  const candidates = rackets.filter((racket) => !baseline || racket.id !== baseline.id);
  if (!candidates.length) return [];
  const reference = scoreReference(baseline, candidates);
  const deltaBasis: PrescriptionDeltaBasis = baseline ? "baseline" : "catalog-median";
  const usedFamilies = new Set<string>();
  const results: PrescriptionResult[] = [];

  for (const role of prescriptionRoles.slice(0, resultLimit)) {
    const ranked = rankCandidates(candidates, role, baseline, reference, stage, style, priority);
    const selected = ranked.find(({ racket }) => !usedFamilies.has(familyKey(racket)));
    if (!selected) break;
    usedFamilies.add(familyKey(selected.racket));
    results.push({
      racket: selected.racket,
      match: Math.round(selected.profileScore),
      role,
      adaptation: adaptationFor(selected.distance),
      deltas: selected.deltas,
      deltaBasis,
      gains: gainReasons(selected.racket, selected.deltas, stage, style, priority),
      ...(tradeoffReason(selected.deltas) ? { tradeoff: tradeoffReason(selected.deltas) } : {}),
    });
  }

  return results;
}

/** A compact, UI-ready explanation of the largest positive and negative moves. */
export function prescriptionDeltaSummary(result: PrescriptionResult) {
  const [gain] = sortedDeltaEntries(result.deltas, "gain");
  const [loss] = sortedDeltaEntries(result.deltas, "loss");
  const basis = result.deltaBasis === "baseline" ? "相对当前拍" : "相对拍库中位";
  const changes = [
    gain ? `${scoreLabels[gain.key]} +${gain.delta}` : null,
    loss ? `${scoreLabels[loss.key]} ${loss.delta}` : null,
  ].filter((value): value is string => Boolean(value));
  return changes.length ? `${basis}：${changes.join(" · ")}` : `${basis}：六维基本持平`;
}
