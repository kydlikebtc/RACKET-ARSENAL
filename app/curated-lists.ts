import type { DeepRacket, ScoreKey, Stage } from "./racket-profiles";

/**
 * 拍库严选榜单：由 criteria 单一事实源驱动。
 *
 * 每个榜单只声明「硬性规格条件 + 评分门槛」，条目由 buildCuratedListEntries
 * 对全量深度档案自动筛出——数据里禁止出现任何具体型号 id 白名单，
 * 展示文案（label）与实际筛选逻辑共用同一个 criterion 对象，永不漂移。
 */

export const CURATED_LIST_LIMIT = 4;

export type CuratedOfficialField = "head" | "weight";

export type CuratedHardCriterion =
  | Readonly<{ kind: "stage"; stage: Stage; label: string }>
  | Readonly<{
      kind: "official-min" | "official-max";
      field: CuratedOfficialField;
      value: number;
      label: string;
    }>;

export type CuratedScoreCriterion = Readonly<{
  kind: "score-min";
  score: ScoreKey;
  value: number;
  label: string;
}>;

export type CuratedList = Readonly<{
  id: string;
  title: string;
  tagline: string;
  hardCriteria: ReadonlyArray<CuratedHardCriterion>;
  scoreCriteria: ReadonlyArray<CuratedScoreCriterion>;
}>;

export type CuratedListEntry = Readonly<{
  list: CuratedList;
  rackets: ReadonlyArray<DeepRacket>;
}>;

export const curatedLists: ReadonlyArray<CuratedList> = [
  {
    id: "starter-first-racket",
    title: "新手第一支拍",
    tagline: "大拍面、轻量、容错优先，帮你在建立动作阶段稳定把球打进场。",
    hardCriteria: [
      { kind: "stage", stage: "入门", label: "适用阶段含「入门」" },
      {
        kind: "official-min",
        field: "head",
        value: 100,
        label: "官网拍面 ≥ 100 in²",
      },
      {
        kind: "official-max",
        field: "weight",
        value: 290,
        label: "官网空拍重量 ≤ 290 g",
      },
    ],
    scoreCriteria: [
      {
        kind: "score-min",
        score: "forgiveness",
        value: 80,
        label: "容错 ≥ 80",
      },
      { kind: "score-min", score: "agility", value: 78, label: "灵活 ≥ 78" },
    ],
  },
  {
    id: "control-upgrade",
    title: "控制型进阶拍",
    tagline: "小拍面、足量拍重，给动作成型后的你更精确的落点与反馈。",
    hardCriteria: [
      { kind: "stage", stage: "进阶", label: "适用阶段含「进阶」" },
      {
        kind: "official-max",
        field: "head",
        value: 98,
        label: "官网拍面 ≤ 98 in²",
      },
      {
        kind: "official-min",
        field: "weight",
        value: 300,
        label: "官网空拍重量 ≥ 300 g",
      },
    ],
    scoreCriteria: [
      { kind: "score-min", score: "control", value: 85, label: "控制 ≥ 85" },
      { kind: "score-min", score: "feel", value: 80, label: "手感 ≥ 80" },
    ],
  },
];

function officialValue(
  racket: DeepRacket,
  field: CuratedOfficialField,
): number | null {
  if (!racket.official) return null;
  const value = racket.official[field];
  return typeof value === "number" ? value : null;
}

export function matchesHardCriterion(
  racket: DeepRacket,
  criterion: CuratedHardCriterion,
): boolean {
  if (criterion.kind === "stage")
    return racket.stages.includes(criterion.stage);
  const value = officialValue(racket, criterion.field);
  // 官网未公开（null）视为不满足：硬性判定宁缺毋滥，不用派生值顶替。
  if (value === null) return false;
  return criterion.kind === "official-min"
    ? value >= criterion.value
    : value <= criterion.value;
}

export function matchesScoreCriterion(
  racket: DeepRacket,
  criterion: CuratedScoreCriterion,
): boolean {
  return racket.scores[criterion.score] >= criterion.value;
}

export function matchesCuratedList(
  list: CuratedList,
  racket: DeepRacket,
): boolean {
  return (
    list.hardCriteria.every((criterion) =>
      matchesHardCriterion(racket, criterion),
    ) &&
    list.scoreCriteria.every((criterion) =>
      matchesScoreCriterion(racket, criterion),
    )
  );
}

function totalScore(racket: DeepRacket): number {
  return Object.values(racket.scores).reduce((sum, value) => sum + value, 0);
}

export function curatedCriteriaSummary(list: CuratedList): string {
  return `${list.hardCriteria.length} 项硬性规格条件 + ${list.scoreCriteria.length} 项评分门槛`;
}

/**
 * 确定性输出：六维总分降序、同分按 model 英文序稳定排序；
 * 单榜单内按 familyId（无则回退 series）去重，每榜上限 CURATED_LIST_LIMIT。
 */
export function buildCuratedListEntries(
  lists: ReadonlyArray<CuratedList>,
  rackets: ReadonlyArray<DeepRacket>,
): CuratedListEntry[] {
  return lists.map((list) => {
    const ranked = rackets
      .filter((racket) => matchesCuratedList(list, racket))
      .slice()
      .sort(
        (a, b) =>
          totalScore(b) - totalScore(a) || a.model.localeCompare(b.model, "en"),
      );
    const usedFamilies = new Set<string>();
    const picked: DeepRacket[] = [];
    for (const racket of ranked) {
      const familyKey = racket.familyId ?? racket.series;
      if (usedFamilies.has(familyKey)) continue;
      usedFamilies.add(familyKey);
      picked.push(racket);
      if (picked.length === CURATED_LIST_LIMIT) break;
    }
    return { list, rackets: picked };
  });
}
