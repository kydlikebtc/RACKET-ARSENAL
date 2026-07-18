import { catalogFamilies, type CatalogFamily, type CatalogModel, type RacketFamilyType } from "./catalog-data";
import { catalogModelImages } from "./catalog-model-images";

export type Stage = "入门" | "进阶" | "高阶";
export type PlayStyle = "底线相持" | "上旋进攻" | "全场控制" | "抢点快攻" | "舒适护臂";
export type ScoreKey = "control" | "power" | "spin" | "feel" | "forgiveness" | "agility";

export type RacketSpecTag = {
  key: "head" | "weight" | "pattern" | "balance" | "beam" | "length";
  label: string;
  characteristic: string;
  familyPosition: string;
  mainstream: boolean;
  known: boolean;
};

export type RacketSpecInsights = {
  specTags: RacketSpecTag[];
  traitTags: string[];
  primaryTraitTags: string[];
  traitSummary: string;
  mainstreamSpecCount: number;
  knownSpecCount: number;
  isMainstream: boolean;
  mainstreamKnown: boolean;
};

export type DeepRacket = {
  id: string;
  brand: string;
  model: string;
  series: string;
  year: string;
  accent: string;
  weight: number;
  head: number;
  pattern: string;
  balance: string;
  beam: string;
  stages: Stage[];
  styles: PlayStyle[];
  summary: string;
  verdict: string;
  scores: Record<ScoreKey, number>;
  buyUrl: string;
  buyLabel: string;
  image?: string;
  images?: string[];
  imageSourceUrl?: string;
  imageVerifiedAt?: string;
  familyId?: string;
  familyName?: string;
  familyType?: RacketFamilyType;
  generation?: string;
  releaseDate?: string;
  profileBasis?: string;
  specCoverage?: string;
  specTags: RacketSpecTag[];
  traitTags: string[];
  primaryTraitTags: string[];
  traitSummary: string;
  mainstreamSpecCount: number;
  knownSpecCount: number;
  isMainstream: boolean;
  mainstreamKnown: boolean;
  official?: {
    weight: number | null;
    head: number | null;
    pattern: string | null;
    balance: number | null;
    beam: string | null;
    length: number | null;
  };
};

export const familyTypeAccent: Record<RacketFamilyType, string> = {
  控制: "#6c6df0",
  旋转: "#ef5b45",
  力量: "#1878e8",
  全能: "#2e9b72",
  舒适: "#a96a31",
};

const scoreKeys: ScoreKey[] = ["control", "power", "spin", "agility", "forgiveness", "feel"];

const scoreLabels: Record<ScoreKey, string> = {
  control: "控制",
  power: "力量",
  spin: "旋转",
  feel: "手感",
  forgiveness: "容错",
  agility: "灵活",
};

const profileBaseScores: Record<RacketFamilyType, Record<ScoreKey, number>> = {
  控制: { control: 86, power: 68, spin: 72, feel: 85, forgiveness: 64, agility: 74 },
  旋转: { control: 73, power: 80, spin: 90, feel: 72, forgiveness: 70, agility: 83 },
  力量: { control: 69, power: 90, spin: 78, feel: 70, forgiveness: 78, agility: 78 },
  全能: { control: 79, power: 79, spin: 78, feel: 78, forgiveness: 75, agility: 79 },
  舒适: { control: 70, power: 82, spin: 72, feel: 80, forgiveness: 91, agility: 80 },
};

const familyPrimaryStyle: Record<RacketFamilyType, PlayStyle> = {
  控制: "全场控制",
  旋转: "上旋进攻",
  力量: "抢点快攻",
  全能: "底线相持",
  舒适: "舒适护臂",
};

function clampScore(value: number) {
  return Math.max(50, Math.min(97, Math.round(value)));
}

function beamAverage(beam: string | null) {
  if (!beam) return null;
  const values = beam.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function normalizedPattern(pattern: string | null) {
  return pattern?.replace(/\s/g, "").toLowerCase().replace(/x/g, "×") ?? null;
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function formatDelta(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(Number(rounded.toFixed(2)));
}

function numericFamilyPosition(values: Array<number | null>, current: number | null, unit: string, prefix = "") {
  if (current === null) return "无法同系比较";
  const known = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (known.length <= 1) return "本系唯一公开";
  if (new Set(known.map((value) => value.toFixed(3))).size === 1) return "本系共用";
  const difference = current - median(known);
  if (Math.abs(difference) < 0.005) return "本系中位";
  return `本系${prefix ? `${prefix} ` : " "}${difference > 0 ? "+" : ""}${formatDelta(difference)} ${unit}`;
}

const patternRanks: Record<string, number> = {
  "16×17": -2,
  "16×18": -1,
  "18×16": -1,
  "16×19": 0,
  "16×20": 1,
  "18×19": 1,
  "18×20": 2,
};

function patternFamilyPosition(family: CatalogFamily, pattern: string | null) {
  if (!pattern) return "无法同系比较";
  const known = family.models.map((model) => normalizedPattern(model.pattern)).filter((value): value is string => Boolean(value));
  if (known.length <= 1) return "本系唯一公开";
  if (new Set(known).size === 1) return "本系共用";
  const currentRank = patternRanks[pattern];
  const ranks = known.map((value) => patternRanks[value]).filter((value): value is number => value !== undefined);
  if (currentRank === undefined || ranks.length < 2) return "本系特色线床";
  const difference = currentRank - median(ranks);
  if (difference < 0) return "本系更开放";
  if (difference > 0) return "本系更密";
  return "本系中位";
}

function headCharacteristic(head: number | null) {
  if (head === null) return "官网未公开";
  if (head <= 97) return "小拍面 · 精准";
  if (head <= 100) return "主流拍面";
  if (head <= 104) return "扩展甜区 · 均衡";
  if (head <= 109) return "大拍面 · 容错";
  return "超大拍面 · 省力";
}

function weightCharacteristic(weight: number | null) {
  if (weight === null) return "官网未公开";
  if (weight <= 270) return "超轻 · 易挥";
  if (weight <= 289) return "轻量 · 灵活";
  if (weight <= 294) return "偏轻 · 快挥";
  if (weight <= 305) return "主流重量";
  if (weight <= 319) return "加重 · 稳定";
  return "重型 · 穿透";
}

function patternCharacteristic(pattern: string | null) {
  if (!pattern) return "官网未公开";
  if (pattern === "16×19") return "主流线床";
  if (pattern === "18×20") return "密线 · 控制";
  if (["18×19", "16×20"].includes(pattern)) return "控旋 · 均衡";
  if (["16×18", "16×17", "18×16"].includes(pattern)) return "开放 · 旋转";
  return "特色线床";
}

function balanceCharacteristic(balance: number | null, length: number | null) {
  if (balance === null) return "官网未公开";
  if (length === null) return "缺长度参照";
  const midpointOffset = balance - (length * 12.7);
  if (midpointOffset <= -25) return "静态头轻 · 灵活";
  if (midpointOffset <= -16) return "静态均衡 · 易控";
  if (midpointOffset < 0) return "重心偏前 · 借力";
  return "静态头重 · 增压";
}

function beamCharacteristic(beam: string | null) {
  const average = beamAverage(beam);
  if (average === null) return "官网未公开";
  if (average <= 21.5) return "薄框 · 手感";
  if (average < 25.5) return "中框 · 均衡";
  return "厚框 · 弹力";
}

function lengthCharacteristic(length: number | null) {
  if (length === null) return "官网未公开";
  if (length < 26.95) return "短拍 · 易控";
  if (length <= 27.05) return "标准长度";
  if (length < 27.4) return "微加长 · 覆盖";
  return "加长 · 增压";
}

type TraitCandidate = {
  tag: string;
  summary: string;
};

/**
 * A single, deterministic taxonomy for every catalog model. "Mainstream" here
 * means the common adult performance-racket reference window used by this
 * armory, not a brand claim or a lab measurement.
 */
export function buildRacketSpecInsights(family: CatalogFamily, model: CatalogModel): RacketSpecInsights {
  const pattern = normalizedPattern(model.pattern);
  const averageBeam = beamAverage(model.beam);
  const mainstream = {
    head: model.head !== null && model.head >= 98 && model.head <= 100,
    weight: model.weight !== null && model.weight >= 295 && model.weight <= 305,
    pattern: pattern === "16×19",
    balance: model.balance !== null && model.balance >= 315 && model.balance <= 325,
    beam: averageBeam !== null && averageBeam >= 21.5 && averageBeam <= 25,
    length: model.length !== null && model.length >= 26.95 && model.length <= 27.05,
  };
  const specTags: RacketSpecTag[] = [
    {
      key: "head",
      label: model.head === null ? "—" : `${model.head} in²`,
      characteristic: headCharacteristic(model.head),
      familyPosition: numericFamilyPosition(family.models.map((item) => item.head), model.head, "in²"),
      mainstream: mainstream.head,
      known: model.head !== null,
    },
    {
      key: "weight",
      label: model.weight === null ? "—" : `${model.weight} g`,
      characteristic: weightCharacteristic(model.weight),
      familyPosition: numericFamilyPosition(family.models.map((item) => item.weight), model.weight, "g"),
      mainstream: mainstream.weight,
      known: model.weight !== null,
    },
    {
      key: "pattern",
      label: model.pattern ?? "—",
      characteristic: patternCharacteristic(pattern),
      familyPosition: patternFamilyPosition(family, pattern),
      mainstream: mainstream.pattern,
      known: model.pattern !== null,
    },
    {
      key: "balance",
      label: model.balance === null ? "—" : `${model.balance} mm`,
      characteristic: balanceCharacteristic(model.balance, model.length),
      familyPosition: numericFamilyPosition(family.models.map((item) => item.balance), model.balance, "mm"),
      mainstream: mainstream.balance,
      known: model.balance !== null,
    },
    {
      key: "beam",
      label: model.beam === null ? "—" : `${model.beam} mm`,
      characteristic: beamCharacteristic(model.beam),
      familyPosition: numericFamilyPosition(family.models.map((item) => beamAverage(item.beam)), averageBeam, "mm", "均厚"),
      mainstream: mainstream.beam,
      known: model.beam !== null,
    },
    {
      key: "length",
      label: model.length === null ? "—" : `${model.length} in`,
      characteristic: lengthCharacteristic(model.length),
      familyPosition: numericFamilyPosition(family.models.map((item) => item.length), model.length, "in"),
      mainstream: mainstream.length,
      known: model.length !== null,
    },
  ];
  const mainstreamSpecCount = specTags.filter((tag) => tag.mainstream).length;
  const knownSpecCount = specTags.filter((tag) => tag.known).length;
  const mainstreamKnown = model.head !== null && model.weight !== null && pattern !== null && model.length !== null && model.balance !== null;
  const isMainstream = mainstreamKnown
    && model.head! >= 99 && model.head! <= 101
    && model.weight! >= 295 && model.weight! <= 305
    && pattern === "16×19"
    && model.length! >= 26.95 && model.length! <= 27.05
    && model.balance! >= 315 && model.balance! <= 325;
  const candidates: TraitCandidate[] = [];
  const add = (tag: string, summary: string) => candidates.push({ tag, summary });

  if (model.head !== null) {
    if (model.head <= 97) add("小拍面精准", "小拍面更偏向集中反馈与精确落点。");
    else if (model.head <= 100) {
      // Covered by the mainstream badge; no duplicate trait needed.
    } else if (model.head <= 104) add("扩展甜区", "扩展拍面在保留性能取向的同时增加甜区窗口。");
    else if (model.head <= 109) add("大拍面容错", "大拍面提供更宽的击球窗口和容错。");
    else add("超大拍面省力", "超大拍面优先扩大甜区并降低借力门槛。");
  }

  if (model.weight !== null) {
    if (model.weight <= 270) add("超轻易挥", "超轻重量更容易加速与连续挥拍。");
    else if (model.weight <= 289) add("轻量灵活", "轻量设定减少启动负担，偏向灵活与快速到位。");
    else if (model.weight <= 294) add("均衡轻量", "略轻于常见基准的重量，在稳定与易挥之间折中。");
    else if (model.weight <= 305) {
      // Covered by the mainstream badge; no duplicate trait needed.
    } else if (model.weight <= 319) add("加重稳定", "加重设定更强调击球稳定和对抗感。");
    else add("重型穿透", "重型设定偏向稳定穿透，同时对挥拍完整度要求更高。");
  }

  if (pattern) {
    if (pattern === "18×20") add("密线控制", "18×20 密线床偏向稳定弹道与控制。");
    else if (pattern === "18×19") add("偏密控球", "18×19 线床偏密，更重视轨迹可预期性。");
    else if (pattern === "16×20") add("控旋均衡", "16×20 线床在控制和旋转窗口之间取平衡。");
    else if (["16×18", "16×17", "18×16", "14×18"].includes(pattern)) add("开放旋转", "开放线床更利于咬球、旋转与轻松出球。");
    else if (pattern !== "16×19") add("特色线床", "非常见线床带来更鲜明的弹道取向。");
  }

  if (model.length !== null) {
    if (model.length < 26.95) add("短拍易控", "短于常见长度的设定更偏向贴身操控。");
    else if (model.length > 27.05 && model.length < 27.4) add("微加长增压", "微加长设定增加触球范围和杠杆效应。");
    else if (model.length >= 27.4) add("加长增压", "加长设定强调杠杆增压与覆盖范围，挥拍门槛也更高。");
  }

  if (averageBeam !== null) {
    if (averageBeam <= 21.5) add("薄框手感", "薄框结构偏向持球反馈与精细手感。");
    else if (averageBeam >= 25.5) add("厚框弹力", "厚框结构更强调回弹和免费力量。");
  }

  if (model.balance !== null && model.length !== null) {
    const midpointOffset = model.balance - (model.length * 12.7);
    if (midpointOffset <= -25) add("头轻灵活", "头轻平衡更利于拍头调整和网前反应。");
    else if (midpointOffset >= -8) add("偏头重借力", "偏头重平衡优先提供拍头惯性与借力。");
  }

  const uniqueCandidates = candidates.filter((candidate, index) => candidates.findIndex((item) => item.tag === candidate.tag) === index);
  const traitTags = uniqueCandidates.map((candidate) => candidate.tag);
  const coreMainstream = mainstream.head && mainstream.weight && mainstream.pattern && mainstream.length;
  if (isMainstream) traitTags.unshift("主流规格");
  else if (coreMainstream && model.balance === null) traitTags.unshift("主流核心规格");
  if (knownSpecCount < 4) traitTags.push("参数待补");
  if (traitTags.length === 0) traitTags.push(`${family.type}型常规规格`);

  const summaryLead = isMainstream
    ? "拍面、重量、线床、长度与静态平衡均处于拍库定义的成人性能拍主流区间。"
    : knownSpecCount < 4
      ? `官网规格有限（已公开 ${knownSpecCount}/6 项），已仅按公开参数标注。`
      : mainstreamSpecCount >= 4
        ? `${mainstreamSpecCount}/6 项参数处于拍库常见区间，其余参数构成该型号的区分度。`
      : "参数组合呈现鲜明取向。";
  const summaryDetails = uniqueCandidates.slice(0, 3).map((candidate) => candidate.summary).join("");
  const traitSummary = `${summaryLead}${summaryDetails || `整体延续 ${family.family} 的${family.type}型取向。`}`;

  return {
    specTags,
    traitTags,
    primaryTraitTags: traitTags.slice(0, 3),
    traitSummary,
    mainstreamSpecCount,
    knownSpecCount,
    isMainstream,
    mainstreamKnown,
  };
}

export function buildProfileScores(family: CatalogFamily, model: CatalogModel) {
  const scores = { ...profileBaseScores[family.type] };
  const apply = (adjustments: Partial<Record<ScoreKey, number>>) => {
    for (const key of scoreKeys) scores[key] += adjustments[key] ?? 0;
  };

  if (model.weight !== null) {
    if (model.weight >= 325) apply({ control: 8, power: 4, feel: 6, forgiveness: -9, agility: -12 });
    else if (model.weight >= 315) apply({ control: 6, power: 3, feel: 4, forgiveness: -6, agility: -8 });
    else if (model.weight >= 305) apply({ control: 4, power: 2, feel: 3, forgiveness: -3, agility: -4 });
    else if (model.weight >= 295) apply({ control: 2, power: 1, feel: 2, agility: -1 });
    else if (model.weight >= 285) apply({ forgiveness: 1, agility: 3 });
    else if (model.weight >= 270) apply({ control: -3, power: -2, feel: -2, forgiveness: 4, agility: 7 });
    else apply({ control: -6, power: -3, feel: -4, forgiveness: 6, agility: 10 });
  }

  if (model.head !== null) {
    if (model.head <= 95) apply({ control: 7, power: -5, spin: -1, feel: 5, forgiveness: -10, agility: 2 });
    else if (model.head <= 98) apply({ control: 4, power: -2, feel: 3, forgiveness: -5, agility: 1 });
    else if (model.head <= 100) apply({ forgiveness: 1 });
    else if (model.head <= 104) apply({ control: -2, power: 2, spin: 1, feel: -1, forgiveness: 4, agility: -1 });
    else if (model.head <= 109) apply({ control: -5, power: 5, spin: 1, feel: -3, forgiveness: 8, agility: -3 });
    else apply({ control: -8, power: 8, spin: 2, feel: -5, forgiveness: 12, agility: -5 });
  }

  if (model.pattern) {
    const pattern = model.pattern.replace(/\s/g, "").toLowerCase();
    if (pattern === "18×20" || pattern === "18x20") apply({ control: 6, power: -3, spin: -5, feel: 3, forgiveness: -1 });
    else if (pattern === "18×19" || pattern === "18x19") apply({ control: 4, power: -1, spin: -3, feel: 2 });
    else if (pattern === "16×20" || pattern === "16x20") apply({ control: 3, power: -1, spin: -1, feel: 1 });
    else if (pattern === "16×18" || pattern === "16x18") apply({ control: -3, power: 3, spin: 5, forgiveness: 2 });
    else if (pattern === "16×17" || pattern === "16x17") apply({ control: -5, power: 5, spin: 7, forgiveness: 3 });
  }

  const averageBeam = beamAverage(model.beam);
  if (averageBeam !== null) {
    if (averageBeam <= 21.5) apply({ control: 4, power: -4, feel: 4, forgiveness: -2 });
    else if (averageBeam <= 23) apply({ control: 2, power: -1, feel: 2 });
    else if (averageBeam <= 25) apply({ control: -1, power: 2, feel: -1, forgiveness: 1 });
    else apply({ control: -3, power: 5, feel: -3, forgiveness: 3 });
  }

  if (model.length !== null) {
    if (model.length <= 26.7) apply({ control: 1, power: -3, spin: -1, agility: 5 });
    else if (model.length < 27) apply({ power: -1, agility: 2 });
    else if (model.length >= 27.4) apply({ control: -1, power: 5, spin: 2, agility: -5 });
    else if (model.length > 27.1) apply({ power: 3, spin: 1, agility: -3 });
  }

  if (model.balance !== null && model.length !== null) {
    const midpointOffset = model.balance - (model.length * 12.7);
    if (midpointOffset <= -32) apply({ control: 2, power: -1, feel: 1, agility: 4 });
    else if (midpointOffset <= -24) apply({ control: 1, agility: 2 });
    else if (midpointOffset > 0) apply({ control: -1, power: 3, agility: -5 });
    else if (midpointOffset > -8) apply({ power: 2, agility: -3 });
    else if (midpointOffset > -16) apply({ power: 1, agility: -2 });
  }

  return Object.fromEntries(scoreKeys.map((key) => [key, clampScore(scores[key])])) as Record<ScoreKey, number>;
}

function buildStages(family: CatalogFamily, model: CatalogModel): Stage[] {
  let demand = family.type === "控制" ? 1 : family.type === "舒适" ? -1 : 0;
  if (model.weight !== null) {
    if (model.weight >= 320) demand += 4;
    else if (model.weight >= 310) demand += 3;
    else if (model.weight >= 300) demand += 2;
    else if (model.weight >= 290) demand += 1;
    else if (model.weight < 275) demand -= 1;
  }
  if (model.head !== null) {
    if (model.head <= 95) demand += 3;
    else if (model.head <= 98) demand += 2;
    else if (model.head <= 100) demand += 1;
    else if (model.head <= 109) demand -= model.head >= 105 ? 1 : 0;
    else demand -= 2;
  }
  const pattern = model.pattern?.replace(/\s/g, "").toLowerCase();
  if (pattern === "18×20" || pattern === "18x20") demand += 2;
  else if (["18×19", "18x19", "16×20", "16x20"].includes(pattern ?? "")) demand += 1;
  else if (pattern === "16×18" || pattern === "16x18") demand -= 1;
  else if (pattern === "16×17" || pattern === "16x17") demand -= 2;
  const averageBeam = beamAverage(model.beam);
  if (averageBeam !== null && averageBeam <= 21.5) demand += 1;
  if (averageBeam !== null && averageBeam >= 25.5) demand -= 1;
  if (model.length !== null && model.length >= 27.4) demand += 1;

  if (demand >= 6) return ["高阶"];
  if (demand >= 3 || (model.weight !== null && model.weight >= 295 && model.head !== null && model.head <= 100 && family.type !== "舒适")) return ["进阶", "高阶"];
  return ["入门", "进阶"];
}

function buildStyles(family: CatalogFamily, scores: Record<ScoreKey, number>): PlayStyle[] {
  const primary = familyPrimaryStyle[family.type];
  const weighted: Record<Exclude<PlayStyle, "舒适护臂">, number> = {
    底线相持: (scores.control * 0.28) + (scores.forgiveness * 0.20) + (scores.power * 0.18) + (scores.spin * 0.16) + (scores.agility * 0.10) + (scores.feel * 0.08),
    上旋进攻: (scores.spin * 0.48) + (scores.agility * 0.20) + (scores.power * 0.17) + (scores.forgiveness * 0.10) + (scores.control * 0.05),
    全场控制: (scores.control * 0.38) + (scores.feel * 0.30) + (scores.agility * 0.18) + (scores.forgiveness * 0.08) + (scores.power * 0.06),
    抢点快攻: (scores.agility * 0.30) + (scores.power * 0.27) + (scores.control * 0.23) + (scores.feel * 0.12) + (scores.spin * 0.08),
  };
  const secondary = (Object.entries(weighted) as [Exclude<PlayStyle, "舒适护臂">, number][])
    .filter(([style]) => style !== primary)
    .sort((a, b) => b[1] - a[1])[0][0];
  return [primary, secondary];
}

function modelIdSlug(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[×✕]/g, "x")
    .replace(/\+/g, "-plus")
    .replace(/&/g, "-and-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function legacyCatalogRacketId(family: CatalogFamily, modelIndex: number) {
  return `catalog-${family.id}-${modelIndex + 1}`;
}

export function catalogRacketId(family: CatalogFamily, modelIndex: number) {
  const model = family.models[modelIndex];
  const slug = model ? modelIdSlug(model.name) : "";
  return `catalog-${family.id}-${slug || `model-${modelIndex + 1}`}`;
}

export function buildDeepRacket(family: CatalogFamily, model: CatalogModel, modelIndex: number): DeepRacket {
  const id = catalogRacketId(family, modelIndex);
  const modelImages = catalogModelImages[id];
  const scores = buildProfileScores(family, model);
  const stages = buildStages(family, model);
  const styles = buildStyles(family, scores);
  const strongest = [...scoreKeys].sort((a, b) => scores[b] - scores[a]).slice(0, 2);
  const releaseDate = model.releaseDate
    ?? (family.releaseDate ? `${family.releaseDate}（本代）` : family.releaseYear ? `${family.releaseYear}（本代）` : "官网未注明");
  const knownSpecs = [model.head, model.weight, model.pattern, model.balance, model.beam, model.length].filter((value) => value !== null).length;
  const completeness = knownSpecs >= 5 ? "完整" : knownSpecs >= 3 ? "部分" : "基础";
  const specInsights = buildRacketSpecInsights(family, model);
  const specSummary = [
    model.weight === null ? null : `${model.weight}g 裸拍`,
    model.head === null ? null : `${model.head}in² 拍面`,
    model.pattern === null ? null : `${model.pattern} 线床`,
  ].filter(Boolean).join("、");

  return {
    id,
    brand: family.brand,
    model: model.name,
    series: `${family.family} · ${family.type}型`,
    year: family.generation,
    accent: familyTypeAccent[family.type],
    weight: model.weight ?? 0,
    head: model.head ?? 0,
    pattern: model.pattern ?? "—",
    balance: model.balance === null ? "—" : `${model.balance} mm`,
    beam: model.beam === null ? "—" : `${model.beam} mm`,
    stages,
    styles,
    summary: `${family.family} ${family.generation} 的 ${family.type}型型号${specSummary ? `，采用 ${specSummary}` : ""}。`,
    verdict: `更适合${stages.join("至")}阶段、以${styles.join("或")}为主要赢分方式，并优先看重${strongest.map((key) => scoreLabels[key]).join("与")}的球员。`,
    scores,
    buyUrl: model.url,
    buyLabel: `${family.brand} 官网`,
    image: modelImages?.images[0] ?? family.image,
    ...(modelImages ? {
      images: [...modelImages.images],
      imageSourceUrl: modelImages.sourceUrl,
      imageVerifiedAt: modelImages.verifiedAt,
    } : {}),
    familyId: family.id,
    familyName: family.family,
    familyType: family.type,
    generation: family.generation,
    releaseDate,
    profileBasis: `根据拍系定位与品牌官网公开硬规格 ${knownSpecs}/6 项生成的拍库相对评估（资料${completeness}）；官网未公开的字段不参与加减分。`,
    specCoverage: `${knownSpecs}/6 · ${completeness}`,
    ...specInsights,
    official: {
      weight: model.weight,
      head: model.head,
      pattern: model.pattern,
      balance: model.balance,
      beam: model.beam,
      length: model.length,
    },
  };
}

export function buildDeepRackets(families: CatalogFamily[] = catalogFamilies) {
  return families.flatMap((family) => family.models.map((model, modelIndex) => buildDeepRacket(family, model, modelIndex)));
}

export const deepRackets = buildDeepRackets();

export function officialWeight(racket: DeepRacket) {
  return racket.official ? racket.official.weight : racket.weight;
}

export function officialHead(racket: DeepRacket) {
  return racket.official ? racket.official.head : racket.head;
}

export function officialPattern(racket: DeepRacket) {
  return racket.official ? racket.official.pattern : racket.pattern;
}

export function officialBalance(racket: DeepRacket) {
  if (!racket.official) return racket.balance;
  return racket.official.balance === null ? "—" : `${racket.official.balance} mm`;
}

export function officialBeam(racket: DeepRacket) {
  if (!racket.official) return racket.beam;
  return racket.official.beam === null ? "—" : `${racket.official.beam} mm`;
}

export function officialLength(racket: DeepRacket) {
  if (!racket.official) return "—";
  return racket.official.length === null ? "—" : `${racket.official.length} in`;
}

export function formatNumberSpec(value: number | null, unit: string) {
  return value === null ? "—" : `${value} ${unit}`;
}
