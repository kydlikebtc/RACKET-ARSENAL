import { catalogFamilies, type CatalogFamily, type CatalogModel, type RacketFamilyType } from "./catalog-data";
import { catalogModelImages } from "./catalog-model-images";

export type Stage = "入门" | "进阶" | "高阶";
export type PlayStyle = "底线相持" | "上旋进攻" | "全场控制" | "抢点快攻" | "舒适护臂";
export type ScoreKey = "control" | "power" | "spin" | "feel" | "forgiveness" | "agility";

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
