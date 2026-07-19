"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  catalogBrands,
  catalogFamilies,
  catalogModelCount,
  catalogTypes,
  catalogVerifiedAt,
  type CatalogFamily,
} from "./catalog-data";
import { catalogBrandProfile } from "./brand-data";
import { appVersion } from "./app-version";
import { buildCuratedListEntries, curatedCriteriaSummary, curatedLists } from "./curated-lists";
import { HONESTY_NOTES } from "./honesty-notes";
import { normalizeRecentRackets, recordRecentRacket, removeRecentRacket } from "./recent-rackets";
import {
  catalogRacketId,
  deepRackets,
  familyTypeAccent,
  formatNumberSpec,
  officialBalance,
  officialBeam,
  officialHead,
  officialLength,
  officialPattern,
  officialWeight,
  legacyCatalogRacketId,
  type DeepRacket,
  type PlayStyle,
  type ScoreKey,
  type Stage,
} from "./racket-profiles";
import { tourPlayers, tourRankAsOf, tourSources, type Tour, type TourPlayer } from "./tour-data";
import { buildSimilarRackets } from "./similar-rackets";
import { buildCompareDiffInsights, compareDiffLabels } from "./compare-insights";
import { buildDuelVerdicts, duelScoreSummary } from "./compare-duel";
import { tourCatalogTargets, tourRacketTargetId } from "./tour-links";
import { catalogReleaseYear as parseCatalogReleaseYear, catalogSearchHistoryMode, matchesCatalogFamilySearch, matchesCatalogRacketSearch, matchesCatalogReleaseYearFilter } from "./catalog-search";
import {
  LEGACY_SESSION_STORAGE_KEY,
  SESSION_DOMAIN_STORAGE_KEYS,
  parseSessionDomain,
  selectSessionDomainCopy,
  serializeSessionDomain,
  sessionValueSignature,
} from "./session-state";
import {
  answerMatchDraft,
  assignMatchDraftJourney,
  backMatchStep,
  beginMatchDraft,
  cancelMatchDraft,
  emptyMatchFlow,
  matchPriorities,
  restoreMatchFlow,
  restoreMatchScreen,
  serializeMatchFlow,
  shouldResumeStoredMatchDraft,
  shouldUseMatchHistoryBack,
  snapshotMatchScreen,
  type MatchPriority,
  type MatchQuestionStep,
  type MatchScreenSnapshot,
} from "./match-flow";
import {
  addCompareId,
  applyCompareUndo,
  compareSlotIds,
  compareSlotsEqual,
  formatCompareRouteState,
  normalizeCompareSlots,
  parseCompareRouteState,
  removeCompareId,
  replaceCompareId,
  shouldImportCompareRoute,
  type CompareSlots,
} from "./compare-state";
import {
  formatAppRoute,
  formatArmoryRouteState,
  formatTourRouteState,
  normalizeArmoryFilters,
  parentAppRoute,
  parseAppRoute,
  parseArmoryRouteState,
  parseTourRouteState,
  type AppRoute,
  type AppView,
  type ArmoryFilterState,
} from "./navigation-state";
import {
  bridgeSkipDelta,
  buildColdMatchHistory,
  historyIndexFromState,
  materializeMatchSettlement,
  nextHistoryIndex,
  planColdMissingResultRestart,
  planMatchSettlement,
  stripMatchJourneyState,
  withHistoryIndex,
  type MatchHistoryBridgeMarker,
  type MatchHistoryOrigin,
  type MatchSettlementPlan,
} from "./match-history";
import {
  MATCH_JOURNEY_LIFECYCLE_STORAGE_KEY,
  emptyMatchJourneyLifecycle,
  findSettledMatchJourney,
  mergeMatchJourneyLifecycles,
  serializeMatchJourneyLifecycle,
  settleMatchJourney as recordSettledMatchJourney,
  type MatchJourneyLifecycle,
} from "./match-lifecycle";
import {
  buildSwapPrescription,
  prescriptionDeltaSummary,
  type PrescriptionResult,
} from "./prescription-engine";
import {
  normalizeDecisionRoom,
  type DecisionCandidateStatus,
  type DecisionRoomState,
  type TrialFeedback,
} from "./decision-state";
import {
  DECISION_STORAGE_KEY,
  parseStoredDecision,
  serializeStoredDecision,
} from "./decision-storage";
import { changedRankCount, diffRecommendationRanks } from "./match-preview";
import { buildTourPlayerSync } from "./tour-sync";
import { purchaseLinkHealth } from "./purchase-link-health";

type Racket = DeepRacket;
type ComparePanel = "overview" | "specs" | "trial";
const comparePanelOrder: readonly ComparePanel[] = ["overview", "specs", "trial"];

function moveHorizontalTab<T extends string>(
  event: ReactKeyboardEvent<HTMLDivElement>,
  values: readonly T[],
  current: T,
  onSelect: (value: T) => void,
) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || values.length === 0) return;
  event.preventDefault();
  const currentIndex = Math.max(0, values.indexOf(current));
  const nextIndex = event.key === "Home"
    ? 0
    : event.key === "End"
      ? values.length - 1
      : event.key === "ArrowLeft"
        ? (currentIndex - 1 + values.length) % values.length
        : (currentIndex + 1) % values.length;
  onSelect(values[nextIndex]);
  const tabs = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  tabs[nextIndex]?.focus();
}

function moveRating(
  event: ReactKeyboardEvent<HTMLButtonElement>,
  current: number,
  onSelect: (value: number) => void,
) {
  const values = [1, 2, 3, 4, 5] as const;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const currentIndex = Math.max(0, values.indexOf(current as (typeof values)[number]));
  const nextIndex = event.key === "Home"
    ? 0
    : event.key === "End"
      ? values.length - 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? (currentIndex - 1 + values.length) % values.length
        : (currentIndex + 1) % values.length;
  const nextValue = values[nextIndex];
  onSelect(nextValue);
  const group = event.currentTarget.closest<HTMLElement>('[role="radiogroup"]');
  const radios = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
  radios?.[nextIndex]?.focus();
}

const scoreLabels: Record<ScoreKey, string> = {
  control: "控制",
  power: "力量",
  spin: "旋转",
  feel: "手感",
  forgiveness: "容错",
  agility: "灵活",
};

const styleOptions = ["全部", "底线相持", "上旋进攻", "全场控制", "抢点快攻", "舒适护臂"] as const;
const catalogReleaseYearOptions = ["全部年份", "2026", "2025", "2024", "2023及更早", "官网未注明"] as const;
type CatalogReleaseYear = (typeof catalogReleaseYearOptions)[number];
const catalogGenerationOptions = ["全部代际", ...Array.from(new Set(catalogFamilies.map((family) => family.generation))).sort((left, right) => left.localeCompare(right, "zh-CN", { numeric: true }))] as const;
type CatalogGeneration = (typeof catalogGenerationOptions)[number];
const catalogSortOptions = ["最新发行", "品牌顺序", "型号数量"] as const;
type CatalogSort = (typeof catalogSortOptions)[number];
const catalogScopeOptions = ["families", "models"] as const;
type CatalogScope = (typeof catalogScopeOptions)[number];
const armoryFilterConfig = {
  scopes: catalogScopeOptions,
  brands: ["全部", ...catalogBrands],
  types: catalogTypes,
  generations: catalogGenerationOptions,
  releaseYears: catalogReleaseYearOptions,
  sorts: catalogSortOptions,
  defaults: {
    scope: "families",
    brand: "全部",
    type: "全部",
    generation: "全部代际",
    releaseYear: "全部年份",
    search: "",
    sort: "最新发行",
  },
  maxSearchLength: 100,
} as const;

function matchesCatalogFamilyReleaseYear(family: CatalogFamily, releaseYear: CatalogReleaseYear) {
  return matchesCatalogReleaseYearFilter(family.releaseDate ?? family.releaseYear, releaseYear);
}

const racketImages: Record<string, string> = {
  "wilson-pro-staff-97-v14": "/rackets/wilson-pro-staff-97-v14.webp",
  "wilson-blade-98-v9": "/rackets/wilson-blade-98-v9.webp",
  "wilson-clash-100-v3": "/rackets/wilson-clash-100-v3.jpg",
  "yonex-ezone-98": "/rackets/yonex-ezone-98.webp",
  "yonex-vcore-98": "/rackets/yonex-vcore-98.webp",
  "yonex-percept-97": "/rackets/yonex-percept-97.webp",
  "babolat-pure-aero-98": "/rackets/babolat-pure-aero-98.png",
  "babolat-pure-drive-98": "/rackets/babolat-pure-drive-98.png",
  "babolat-pure-strike-98": "/rackets/babolat-pure-strike-98.png",
  "head-speed-mp-2026": "/rackets/head-speed-mp-2026.jpg",
  "head-gravity-mp-2025": "/rackets/head-gravity-mp-2025.jpg",
  "head-radical-mp-2025": "/rackets/head-radical-mp-2025.jpg",
  "head-boom-mp-2024": "/rackets/head-boom-mp-2024.png",
  "tecnifibre-tfight-305s": "/rackets/tecnifibre-tfight-305s.webp",
  "dunlop-cx-200": "/rackets/dunlop-cx-200.webp",
  "volkl-vostra-v1-mp": "/rackets/volkl-vostra-v1-mp.webp",
};

const radarKeys: ScoreKey[] = ["control", "power", "spin", "agility", "forgiveness", "feel"];
const radarSeries = ["var(--acid)", "var(--copper)", "var(--sky)"];
const radarDash = ["none", "10 5", "2 5"];
const compareBaselineIds = ["catalog-wilson-blade-v10-blade-100-v10", "catalog-yonex-ezone-8-ezone-100", "catalog-babolat-pure-aero-gen9-pure-aero-gen9"];
const deepRacketById = new Map(deepRackets.map((racket) => [racket.id, racket]));
const curatedListEntries = buildCuratedListEntries(curatedLists, deepRackets);
const tourPlayerById = new Map(tourPlayers.map((player) => [player.id, player]));
const resolveTourPlayerRouteFilter = (playerId: string) => tourPlayerById.get(playerId)?.tour ?? null;
const catalogFamilyById = new Map(catalogFamilies.map((family) => [family.id, family]));
for (const family of catalogFamilies) {
  family.models.forEach((_, modelIndex) => {
    const profile = deepRacketById.get(catalogRacketId(family, modelIndex));
    if (profile) deepRacketById.set(legacyCatalogRacketId(family, modelIndex), profile);
  });
}

function RacketPhoto({
  racket,
  variant = "compact",
}: {
  racket: Racket;
  variant?: "hero" | "compact" | "detail" | "thumb";
}) {
  const image = racket.image ?? racketImages[racket.id];
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageAvailable = Boolean(image && failedImage !== image);

  return (
    <div
      className={`racket-photo racket-photo--${variant}`}
      style={{ "--racket-accent": racket.accent } as CSSProperties}
    >
      {imageAvailable ? (
        <img
          src={image as string}
          alt={`${racket.brand} ${racket.model} 官网商品图`}
          loading={variant === "hero" ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailedImage(image as string)}
        />
      ) : <div className="racket-photo__fallback" role="img" aria-label={`${racket.brand} ${racket.model} 图片暂不可用`}><b>{racket.brand}</b><small>{racket.familyName ?? racket.series}</small></div>}
      {variant !== "thumb" && <span>PRODUCT / {racket.year}</span>}
    </div>
  );
}

function BrandLogo({ brand }: { brand: string }) {
  const profile = catalogBrandProfile(brand);
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`brand-logo${failed || !profile ? " brand-logo--fallback" : ""}`}
      data-brand={brand}
      style={{ "--brand-accent": profile?.accent ?? "var(--accent)" } as CSSProperties}
    >
      {profile && !failed
        ? <img src={profile.logo} alt="" aria-hidden="true" loading="lazy" decoding="async" onError={() => setFailed(true)} />
        : <span>{brand}</span>}
    </span>
  );
}

function purchaseLinkStatusLabel(racketId: string) {
  const record = purchaseLinkHealth[racketId];
  if (!record) return "购买链接待核验";
  return record.status === "ok" ? "购买链接已核验" : record.status === "changed" ? "购买页已跳转" : "购买链接暂不可用";
}

function PurchaseLinkBadge({ racketId, compact = false }: { racketId: string; compact?: boolean }) {
  const record = purchaseLinkHealth[racketId];
  if (!record) return <span className="purchase-link-badge purchase-link-badge--unknown">购买链接待核验</span>;
  const label = purchaseLinkStatusLabel(racketId);
  return (
    <span className={`purchase-link-badge purchase-link-badge--${record.status}${compact ? " purchase-link-badge--compact" : ""}`}>
      <i aria-hidden="true" />
      <span>{label}</span>
      {!compact && <small>{record.checkedAt}</small>}
    </span>
  );
}

function radarPoint(index: number, value: number, radius = 104) {
  const angle = ((index * 60) - 90) * (Math.PI / 180);
  const distance = radius * (value / 100);
  return [180 + (Math.cos(angle) * distance), 155 + (Math.sin(angle) * distance)];
}

function RadarChart({ chartRackets, compact = false, seriesSlots }: { chartRackets: Racket[]; compact?: boolean; seriesSlots?: number[] }) {
  const gridLevels = [20, 40, 60, 80, 100];
  const summary = chartRackets
    .map((racket) => `${racket.brand} ${racket.model}：${radarKeys.map((key) => `${scoreLabels[key]} ${racket.scores[key]}`).join("，")}`)
    .join("；");

  return (
    <figure className={`radar-chart${compact ? " radar-chart--compact" : ""}`}>
      <svg viewBox="0 0 360 314" role="img">
        <title>{chartRackets.length > 1 ? "球拍六维属性重叠对比雷达图" : `${chartRackets[0].model} 六维属性雷达图`}</title>
        <desc>{summary}。各维度满分 100 分，用于拍库内部横向比较。</desc>

        <g className="radar-chart__structure" aria-hidden="true">
          {gridLevels.map((level) => (
            <polygon
              key={level}
              points={radarKeys.map((_, index) => radarPoint(index, level).join(",")).join(" ")}
              className={level === 100 ? "radar-chart__grid radar-chart__grid--outer" : "radar-chart__grid"}
            />
          ))}
          {radarKeys.map((key, index) => {
            const [x, y] = radarPoint(index, 100);
            return <line key={key} x1="180" y1="155" x2={x} y2={y} className="radar-chart__axis" />;
          })}
        </g>

        {chartRackets.map((racket, seriesIndex) => {
          const seriesSlot = seriesSlots?.[seriesIndex] ?? seriesIndex;
          return (
          <g
            className="radar-chart__series"
            key={racket.id}
            style={{ "--series-color": radarSeries[seriesSlot % radarSeries.length] } as CSSProperties}
          >
            <polygon
              points={radarKeys.map((key, index) => radarPoint(index, racket.scores[key]).join(",")).join(" ")}
              className="radar-chart__shape"
              strokeDasharray={radarDash[seriesSlot % radarDash.length]}
            />
            {radarKeys.map((key, index) => {
              const [x, y] = radarPoint(index, racket.scores[key]);
              return <circle key={key} cx={x} cy={y} r={seriesIndex === 0 ? 3.5 : 3} className="radar-chart__point" />;
            })}
          </g>
          );
        })}

        <g className="radar-chart__labels" aria-hidden="true">
          {radarKeys.map((key, index) => {
            const [x, y] = radarPoint(index, 100, 132);
            const textAnchor = Math.abs(x - 180) < 10 ? "middle" : x > 180 ? "start" : "end";
            const singleValue = chartRackets.length === 1 && !compact ? chartRackets[0].scores[key] : null;
            return (
              <text key={key} x={x} y={y} textAnchor={textAnchor} className="radar-chart__label">
                <tspan x={x}>{scoreLabels[key]}</tspan>
                {singleValue !== null && <tspan x={x} dy="15" className="radar-chart__label-value">{singleValue}</tspan>}
              </text>
            );
          })}
        </g>
      </svg>

      {chartRackets.length > 1 && (
        <figcaption className="radar-legend" aria-label="雷达图图例">
          {chartRackets.map((racket, index) => {
            const seriesSlot = seriesSlots?.[index] ?? index;
            return (
            <span key={racket.id} style={{ "--series-color": radarSeries[seriesSlot % radarSeries.length] } as CSSProperties}>
              <i style={{ borderTopStyle: seriesSlot === 0 ? "solid" : seriesSlot === 1 ? "dashed" : "dotted" }} />
              <b>{racket.brand}</b> {racket.model}
            </span>
            );
          })}
        </figcaption>
      )}
      <p className="radar-chart__note">{HONESTY_NOTES.scoreScale}</p>
    </figure>
  );
}

function miniRadarPoint(index: number, value: number, radius = 32) {
  const angle = ((index * 60) - 90) * (Math.PI / 180);
  const distance = radius * (value / 100);
  return [60 + (Math.cos(angle) * distance), 52 + (Math.sin(angle) * distance)];
}

function MiniRadar({ racket }: { racket: Racket }) {
  const summary = radarKeys.map((key) => `${scoreLabels[key]} ${racket.scores[key]}`).join("，");

  return (
    <figure className="mini-radar" style={{ "--mini-radar": racket.accent } as CSSProperties}>
      <svg viewBox="0 0 120 106" role="img">
        <title>{racket.model} 六维雷达</title>
        <desc>{summary}。拍库相对评估，满分 100，非实验室测量。</desc>
        <g className="mini-radar__structure" aria-hidden="true">
          {[50, 100].map((level) => <polygon key={level} points={radarKeys.map((_, index) => miniRadarPoint(index, level).join(",")).join(" ")} />)}
          {radarKeys.map((key, index) => {
            const [x, y] = miniRadarPoint(index, 100);
            return <line key={key} x1="60" y1="52" x2={x} y2={y} />;
          })}
        </g>
        <polygon className="mini-radar__shape" points={radarKeys.map((key, index) => miniRadarPoint(index, racket.scores[key]).join(",")).join(" ")} />
        <g className="mini-radar__labels" aria-hidden="true">
          {radarKeys.map((key, index) => {
            const [x, y] = miniRadarPoint(index, 100, 44);
            return <text key={key} x={x} y={y + 3} textAnchor="middle">{scoreLabels[key]}</text>;
          })}
        </g>
      </svg>
    </figure>
  );
}

const specDimensionLabels = {
  head: "拍面",
  weight: "重量",
  pattern: "线床",
  balance: "静态平衡",
  beam: "框厚",
  length: "长度",
} as const;

function modelMatrixOverview(racket: Racket) {
  const coverage = racket.knownSpecCount < 6
    ? `已公开 ${racket.knownSpecCount}/6 项`
    : `${racket.mainstreamSpecCount}/6 项常见规格`;
  const distinctive = racket.primaryTraitTags.find((trait) => !trait.startsWith("主流") && trait !== "参数待补");
  const note = distinctive ?? (racket.knownSpecCount < 6 ? "参数待补" : racket.isMainstream ? "主流组合" : "已逐项标注");
  return `${coverage} · ${note}`;
}

function ModelSpecValue({ racket, dimension }: { racket: Racket; dimension: keyof typeof specDimensionLabels }) {
  const tag = racket.specTags.find((item) => item.key === dimension);
  if (!tag) return <span>—</span>;

  return (
    <div className={`model-spec-value${tag.mainstream ? " is-mainstream" : tag.known ? " is-trait" : " is-unknown"}`} aria-label={`${specDimensionLabels[dimension]}：${tag.label}；特点：${tag.characteristic}${tag.known ? `；${tag.familyPosition}` : ""}`}>
      <span>{tag.label}</span>
      <small>{tag.characteristic}</small>
      {tag.known && <em>{tag.familyPosition}</em>}
    </div>
  );
}

function RacketSpecTags({
  racket,
  compact = false,
  expanded = false,
  showSpecs = true,
  showSummary = false,
}: {
  racket: Racket;
  compact?: boolean;
  expanded?: boolean;
  showSpecs?: boolean;
  showSummary?: boolean;
}) {
  const visibleTraits = expanded ? racket.traitTags : racket.primaryTraitTags;
  const remainingTraits = Math.max(0, racket.traitTags.length - visibleTraits.length);

  return (
    <div className={`racket-spec-tags${compact ? " racket-spec-tags--compact" : ""}`}>
      {showSpecs && (
        <div className="racket-spec-tags__specs" aria-label={`${racket.model} 公开规格标签`}>
          {racket.specTags.map((tag) => (
            <span key={tag.key} className={`racket-spec-tag${tag.mainstream ? " racket-spec-tag--mainstream" : ""}${tag.known ? "" : " racket-spec-tag--unknown"}`}>
              <small>{specDimensionLabels[tag.key]}</small>
              <b>{tag.label}</b>
              <span>{tag.characteristic}</span>
              {tag.known && <em>{tag.familyPosition}</em>}
            </span>
          ))}
        </div>
      )}
      <div className="racket-spec-tags__traits" aria-label={`${racket.model} 规格特点`}>
        {visibleTraits.map((trait) => <span key={trait} className={trait.startsWith("主流") ? "is-mainstream" : trait === "参数待补" ? "is-unknown" : undefined}>{trait}</span>)}
        {!expanded && remainingTraits > 0 && <span className="racket-spec-tags__more" aria-label={`另有 ${remainingTraits} 个特点`}>+{remainingTraits}</span>}
      </div>
      {showSummary && <p>{racket.traitSummary}</p>}
    </div>
  );
}

const priorityScoreKeyMap: Record<string, ScoreKey> = {
  力量: "power",
  旋转: "spin",
  控制: "control",
  手感: "feel",
  灵活: "agility",
  护臂: "forgiveness",
};

export type RecommendationBreakdown = {
  base: 10;
  stageHit: boolean;
  stagePoints: 0 | 22;
  styleHit: boolean;
  stylePoints: 0 | 28;
  priorityMode: "均衡" | "单项";
  priorityPoints: number;
  raw: number;
  total: number;
  capped: boolean;
};

/**
 * Itemizes the exact terms recommendationScore sums so the match result cards
 * can show an honest "why this racket" breakdown. The arithmetic must stay
 * aligned with recommendationScore's historical behaviour, so the score now
 * derives from this breakdown instead of duplicating the formula.
 */
export function recommendationBreakdown(racket: Racket, stage: Stage, style: PlayStyle, priority: string): RecommendationBreakdown {
  const values = Object.values(racket.scores);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const floor = Math.min(...values);
  const stageHit = racket.stages.includes(stage);
  const styleHit = racket.styles.includes(style);
  const stagePoints = stageHit ? 22 : 0;
  const stylePoints = styleHit ? 28 : 0;
  const priorityMode = priority === "均衡" ? "均衡" : "单项";
  const priorityPoints = priorityMode === "均衡"
    ? (average * 0.18) + (floor * 0.06)
    : (racket.scores[priorityScoreKeyMap[priority]] * 0.2) + (average * 0.04);
  const raw = 10 + stagePoints + stylePoints + priorityPoints;
  return {
    base: 10,
    stageHit,
    stagePoints,
    styleHit,
    stylePoints,
    priorityMode,
    priorityPoints,
    raw,
    total: Math.min(99, raw),
    capped: raw > 99,
  };
}

export function recommendationScore(racket: Racket, stage: Stage, style: PlayStyle, priority: string) {
  return recommendationBreakdown(racket, stage, style, priority).total;
}

export function buildRecommendations(rackets: Racket[], stage: Stage, style: PlayStyle, priority: string, limit = 4) {
  const ranked = rackets
    .map((racket) => ({ racket, match: recommendationScore(racket, stage, style, priority) }))
    .sort((a, b) => b.match - a.match || a.racket.model.localeCompare(b.racket.model, "en"));
  const varied: typeof ranked = [];
  const usedFamilies = new Set<string>();
  for (const item of ranked) {
    if (usedFamilies.has(item.racket.familyId ?? item.racket.series)) continue;
    varied.push(item);
    usedFamilies.add(item.racket.familyId ?? item.racket.series);
    if (varied.length === limit) break;
  }
  return varied;
}

function recommendationReason(racket: Racket, stage: Stage, style: PlayStyle, priority: string) {
  const reasons = [
    racket.stages.includes(stage) ? `适合${stage}` : racket.stages[0],
    racket.styles.includes(style) ? style : racket.styles[0],
  ];
  if (priority === "均衡") reasons.push("六维均衡");
  else {
    const label = priority === "护臂" ? "护臂（容错）" : priority;
    reasons.push(`${label} ${racket.scores[priorityScoreKeyMap[priority]]}`);
  }
  return reasons.join(" · ");
}

const appTabs: { id: AppView; label: string; icon: string }[] = [
  { id: "discover", label: "发现", icon: "◉" },
  { id: "match", label: "处方", icon: "◇" },
  { id: "armory", label: "球拍库", icon: "▦" },
  { id: "tour", label: "球星", icon: "★" },
  { id: "compare", label: "决策", icon: "⇄" },
];

const tabIconShapes: Record<AppView, React.ReactNode> = {
  discover: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </>
  ),
  match: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="8.5" y="8" width="7" height="1.8" rx="0.9" fill="currentColor" />
      <rect x="8.5" y="12" width="7" height="1.8" rx="0.9" fill="currentColor" />
    </>
  ),
  armory: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" fill="currentColor" />
      <rect x="13" y="4" width="7" height="7" rx="2" fill="currentColor" />
      <rect x="4" y="13" width="7" height="7" rx="2" fill="currentColor" />
      <rect x="13" y="13" width="7" height="7" rx="2" fill="currentColor" />
    </>
  ),
  tour: (
    <polygon points="12,3.5 14.6,8.9 20.5,9.7 16.2,13.9 17.2,19.8 12,17 6.8,19.8 7.8,13.9 3.5,9.7 9.4,8.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  ),
  compare: (
    <>
      <circle cx="9" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </>
  ),
};

function TabIcon({ view }: { view: AppView }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {tabIconShapes[view]}
    </svg>
  );
}

const decisionStatusLabels: Record<DecisionCandidateStatus, string> = {
  candidate: "候选",
  trial: "试打中",
  eliminated: "已淘汰",
  final: "最终选择",
};

type TrialFeedbackDraft = {
  control: number;
  power: number;
  comfort: number;
  verdict: "保留候选" | "继续观察" | "淘汰" | "最终选择";
  note: string;
};

const emptyTrialFeedbackDraft: TrialFeedbackDraft = {
  control: 3,
  power: 3,
  comfort: 3,
  verdict: "保留候选",
  note: "",
};

const trialMetricLabels: Record<"control" | "power" | "comfort", string> = {
  control: "控制",
  power: "出球",
  comfort: "舒适",
};

const trialVerdicts: TrialFeedbackDraft["verdict"][] = ["保留候选", "继续观察", "淘汰", "最终选择"];

type PaikuHistoryState = {
  paiku?: true;
  paikuHistoryIndex?: number;
  paikuHistoryBridge?: MatchHistoryBridgeMarker;
  paikuOverlayPushed?: boolean;
  paikuMatchPushed?: boolean;
  paikuMatchScreen?: MatchScreenSnapshot;
  paikuMatchJourneyId?: string;
  paikuMatchJourneyDepth?: number;
  paikuMatchOrigin?: MatchHistoryOrigin;
  paikuCancelledMatchJourney?: boolean;
  paikuMatchRecovery?: "missing-result";
  paikuPendingCompareId?: string;
  paikuCompareBrowseReturn?: boolean;
  paikuFamilyTargetId?: string;
  paikuFamilyScrollTop?: number;
  paikuFamilyMatrixScrollLeft?: number;
  paikuFamilyRevealTarget?: boolean;
  paikuRacketScrollTop?: number;
  paikuCatalogResultLimit?: number;
  paikuViewScrollTop?: number;
  paikuFocus?: FocusIdentity;
};

type PendingMatchSettlement = {
  intent: "pause" | "cancel" | "complete";
  plan: MatchSettlementPlan;
  synthesizeOrigin: boolean;
};

type CompareUndo = {
  token: number;
  kind: "add" | "remove" | "replace" | "clear" | "load-recommended" | "import-link";
  beforeSlots: CompareSlots;
  afterSlots: CompareSlots;
  message: string;
  originElement: HTMLElement | null;
  originFocus: FocusIdentity | null;
};

type FocusIdentity = {
  id?: string;
  key?: string;
  ariaLabel?: string;
  text?: string;
};

function captureFocusIdentity(element: HTMLElement | null): FocusIdentity | null {
  if (!element || element === document.body || element === document.documentElement) return null;
  const elementText = element.textContent?.trim() ?? "";
  return {
    ...(element.id ? { id: element.id } : {}),
    ...(element.dataset.focusKey ? { key: element.dataset.focusKey } : {}),
    ...(element.getAttribute("aria-label") ? { ariaLabel: element.getAttribute("aria-label") as string } : {}),
    ...(elementText && elementText.length <= 160 ? { text: elementText } : {}),
  };
}

function canRestoreFocus(element: HTMLElement | null): element is HTMLElement {
  if (!element?.isConnected || element.closest("[inert], [aria-hidden='true']")) return false;
  if ("disabled" in element && (element as HTMLButtonElement).disabled) return false;
  if (element.hidden || element.getClientRects().length === 0) return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function resolveFocusIdentity(identity: FocusIdentity | null) {
  if (!identity) return null;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("button, a, input, select, [tabindex]")).filter(canRestoreFocus);
  const idTarget = identity.id ? document.getElementById(identity.id) as HTMLElement | null : null;
  return (canRestoreFocus(idTarget) ? idTarget : null)
    ?? candidates.find((element) => identity.key && element.dataset.focusKey === identity.key)
    ?? candidates.find((element) => identity.ariaLabel && element.getAttribute("aria-label") === identity.ariaLabel)
    ?? candidates.find((element) => identity.text && element.textContent?.trim() === identity.text)
    ?? null;
}

function makeMatchJourneyId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return `match-${globalThis.crypto.randomUUID()}`;
  return `match-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}


function RecommendationRow({
  racket,
  match,
  onOpen,
  onToggleCompare,
  compared,
  compareFull,
}: {
  racket: Racket;
  match: number;
  onOpen: () => void;
  onToggleCompare: () => void;
  compared: boolean;
  compareFull: boolean;
}) {
  return (
    <article className="recommendation-row">
      <button className="recommendation-row__main" data-focus-key={`recommendation-open-${racket.id}`} onClick={onOpen}>
        <RacketPhoto racket={racket} variant="thumb" />
        <span className="recommendation-row__copy">
          <small>{racket.brand} · {racket.series}</small>
          <strong>{racket.model}</strong>
          <span>{racket.styles.join(" · ")}</span>
        </span>
        <span className="recommendation-row__match"><b>{Math.round(match)}</b><small>匹配指数</small></span>
        <span className="recommendation-row__chevron" aria-hidden="true">›</span>
      </button>
      <button className="recommendation-row__compare" data-focus-key={`recommendation-compare-${racket.id}`} onClick={onToggleCompare} aria-pressed={compared} aria-label={compareFull && !compared ? `管理已满的球拍对比，当前无法加入 ${racket.model}` : `${compared ? "移出" : "加入"} ${racket.model} 对比`}>
        {compared ? "✓" : compareFull ? "⇄" : "+"}
      </button>
    </article>
  );
}

function ViewTitle({ id, eyebrow, title, action }: { id: string; eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <header className="view-title">
      <div><p>{eyebrow}</p><h1 id={id} tabIndex={-1}>{title}</h1></div>
      {action}
    </header>
  );
}

function PrescriptionBaselinePicker({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (id: string) => void;
  compact?: boolean;
}) {
  const selectedRacket = value ? deepRacketById.get(value) : null;
  return (
    <label className={`prescription-baseline${compact ? " prescription-baseline--compact" : ""}`}>
      <span><small>处方基准</small><b>{selectedRacket ? "从当前球拍开始" : "还没有当前球拍也可以"}</b></span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="选择当前使用的球拍">
        <option value="">我还没有 / 暂不确定</option>
        {catalogBrands.map((brand) => (
          <optgroup key={brand} label={brand}>
            {deepRackets.filter((racket) => racket.brand === brand).map((racket) => (
              <option key={racket.id} value={racket.id}>{racket.model}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <i aria-hidden="true">›</i>
    </label>
  );
}

const familyGalleries: Record<string, string[]> = {
  "wilson-blade-v10": [
    "/rackets/gallery/wilson-blade-v10-02.png",
    "/rackets/gallery/wilson-blade-v10-03.jpg",
    "/rackets/gallery/wilson-blade-v10-04.jpg",
  ],
  "yonex-ezone-8": [
    "/rackets/gallery/yonex-ezone-98-01.jpg",
    "/rackets/gallery/yonex-ezone-98-02.jpg",
    "/rackets/gallery/yonex-ezone-98-03.jpg",
    "/rackets/gallery/yonex-ezone-98-04.jpg",
  ],
  "babolat-pure-aero-gen9": [
    "/rackets/gallery/babolat-pure-aero-98-gen9-01.png",
    "/rackets/gallery/babolat-pure-aero-98-gen9-02.png",
    "/rackets/gallery/babolat-pure-aero-98-gen9-03.png",
    "/rackets/gallery/babolat-pure-aero-98-gen9-04.png",
  ],
  "head-speed-2026": Array.from({ length: 10 }, (_, index) => `/rackets/gallery/head-speed-${String(index + 1).padStart(2, "0")}.webp`),
};

function familyReleaseLabel(family: CatalogFamily) {
  if (family.releaseDate) return family.releaseDate;
  if (family.releaseYear) return String(family.releaseYear);
  return "官网未注明";
}

function modelReleaseLabel(family: CatalogFamily, releaseDate?: string) {
  if (releaseDate) return releaseDate;
  const inherited = familyReleaseLabel(family);
  return inherited === "官网未注明" ? inherited : `${inherited}（本代）`;
}

function ProductGallery({ images, alt, accent }: { images: string[]; alt: string; accent: string }) {
  const [frame, setFrame] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const swipeStartXRef = useRef<number | null>(null);
  const availableImages = images.filter((image) => !failedImages.includes(image));
  const safeFrame = Math.min(frame, Math.max(availableImages.length - 1, 0));
  const markFailed = (image: string) => setFailedImages((current) => current.includes(image) ? current : [...current, image]);

  if (availableImages.length === 0) {
    return (
      <div className="product-gallery product-gallery--empty" role="img" aria-label={`${alt} 官网产品图暂不可用`} style={{ "--gallery-accent": accent } as CSSProperties}>
        <span aria-hidden="true">拍</span><strong>{alt}</strong><small>官网产品图待同步</small>
      </div>
    );
  }

  const step = (direction: number) => setFrame((safeFrame + direction + availableImages.length) % availableImages.length);
  const finishSwipe = (clientX: number) => {
    const start = swipeStartXRef.current;
    swipeStartXRef.current = null;
    if (start === null || Math.abs(clientX - start) < 44) return;
    step(clientX < start ? 1 : -1);
  };

  return (
    <figure className="product-gallery" style={{ "--gallery-accent": accent } as CSSProperties}>
      <div
        className="product-gallery__stage"
        role="group"
        aria-label={`${alt} 产品图，第 ${safeFrame + 1} 张，共 ${availableImages.length} 张${availableImages.length > 1 ? "；可左右滑动或使用方向键切换" : ""}`}
        tabIndex={availableImages.length > 1 ? 0 : -1}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          step(event.key === "ArrowRight" ? 1 : -1);
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "touch" || event.pointerType === "pen") swipeStartXRef.current = event.clientX;
        }}
        onPointerUp={(event) => finishSwipe(event.clientX)}
        onPointerCancel={() => { swipeStartXRef.current = null; }}
      >
        <img src={availableImages[safeFrame]} alt={`${alt} 官方产品图，第 ${safeFrame + 1} 张`} decoding="async" onError={() => markFailed(availableImages[safeFrame])} />
        <span>{availableImages.length > 1 ? `官方多角度图集 · ${safeFrame + 1}/${availableImages.length}` : "官方产品图"}</span>
        {availableImages.length > 1 && (
          <div className="product-gallery__arrows">
            <button onClick={() => step(-1)} aria-label="上一张产品图">‹</button>
            <button onClick={() => step(1)} aria-label="下一张产品图">›</button>
          </div>
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">当前显示第 {safeFrame + 1} 张，共 {availableImages.length} 张</span>
      {availableImages.length > 1 && (
        <>
          <label className="product-gallery__scrubber">
            <span>拖动查看视角</span><output>{safeFrame + 1} / {availableImages.length}</output>
            <input type="range" min="0" max={availableImages.length - 1} step="1" value={safeFrame} onChange={(event) => setFrame(Number(event.target.value))} />
          </label>
          <div className="product-gallery__thumbs" role="group" aria-label="选择产品视角">
            {availableImages.map((image, index) => (
              <button key={image} aria-pressed={safeFrame === index} onClick={() => setFrame(index)} aria-label={`查看第 ${index + 1} 张产品图`}>
                <img src={image} alt="" loading="lazy" decoding="async" onError={() => markFailed(image)} />
              </button>
            ))}
          </div>
          <figcaption>多角度静态产品图，不等同于连续 360° 三维模型。</figcaption>
        </>
      )}
    </figure>
  );
}

function CatalogFamilyCard({ family, onOpen }: { family: CatalogFamily; onOpen: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const heads = family.models.map((model) => model.head).filter((value): value is number => value !== null);
  const weights = family.models.map((model) => model.weight).filter((value): value is number => value !== null);
  const accent = familyTypeAccent[family.type];
  const gallery = familyGalleries[family.id] ?? (family.image ? [family.image] : []);

  return (
    <article className="catalog-family-card" style={{ "--family-accent": accent } as CSSProperties}>
      <button className="catalog-family-card__main" data-focus-key={`family-open-${family.id}`} onClick={onOpen} aria-label={`查看 ${family.brand} ${family.family} ${family.generation} 的 ${family.models.length} 款深度档案`}>
        <div className="catalog-family-card__visual">
          {gallery.length > 0 && !imageFailed ? <img src={gallery[0]} alt={`${family.brand} ${family.family} ${family.generation} 官方产品图`} loading="lazy" decoding="async" onError={() => setImageFailed(true)} /> : <span className="catalog-family-card__monogram"><b>{family.brand}</b><small>{family.family}</small></span>}
          <span className="catalog-family-card__release"><i />{family.status === "预告" ? "即将上市" : "发行"} {familyReleaseLabel(family)}</span>
          {gallery.length > 1 && <span className="catalog-family-card__gallery">多角度 · {gallery.length}</span>}
        </div>
        <div className="catalog-family-card__body">
          <div className="catalog-family-card__kicker"><span>{family.brand}</span><span>{family.type}</span></div>
          <div className="catalog-family-card__title"><h3>{family.family}</h3><b>{family.generation}</b></div>
          <p>{family.summary}</p>
          <dl>
            <div><dt>型号</dt><dd>{family.models.length} 款</dd></div>
            <div><dt>拍面</dt><dd>{heads.length ? `${Math.min(...heads)}–${Math.max(...heads)}` : "—"} in²</dd></div>
            <div><dt>重量</dt><dd>{weights.length ? `${Math.min(...weights)}–${Math.max(...weights)}` : "—"} g</dd></div>
          </dl>
          <span className="catalog-family-card__open">查看全系与深度档案 <span aria-hidden="true">›</span></span>
        </div>
      </button>
    </article>
  );
}

const tourMappingMeta: Record<TourPlayer["mapping"], { label: string; detail: string; tone: string }> = {
  "型号级映射": { label: "型号级", detail: "品牌公开信息可落到具体零售型号", tone: "exact" },
  "系列级映射": { label: "系列级", detail: "品牌只公开拍系，具体子型号未知", tone: "family" },
  "基础型号等效": { label: "基础型号等效", detail: "拍库落点为公开涂装的基础零售型号", tone: "equivalent" },
  "当前拍系参考": { label: "拍系参考", detail: "仅用于浏览当前拍系，不代表比赛拍", tone: "reference" },
};

function TourPlayerPortrait({ player, priority = false, decorative = false }: { player: TourPlayer; priority?: boolean; decorative?: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = player.name.split(/\s+/u).map((part) => part[0]).slice(0, 2).join("");

  if (failed) {
    return (
      <span className="tour-player-portrait__fallback" role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `${player.nameZh} 球员照片暂不可用`} aria-hidden={decorative || undefined}>
        <small>{player.tour}</small><b>{initials}</b>
      </span>
    );
  }

  return (
    <img
      className="tour-player-portrait"
      src={player.portrait.src}
      alt={decorative ? "" : `${player.nameZh} 人物照片`}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      style={{ objectPosition: player.portrait.objectPosition ?? "50% 28%" }}
      onError={() => setFailed(true)}
    />
  );
}

function TourRacketVisual({ player }: { player: TourPlayer }) {
  const target = tourCatalogTargets[player.id];
  const linkedRacket = target?.kind === "racket" ? deepRacketById.get(target.racketId) : undefined;
  const linkedFamily = target ? catalogFamilyById.get(target.familyId) : undefined;
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const imageCandidates = Array.from(new Set([
    linkedRacket?.image,
    ...(linkedFamily ? familyGalleries[linkedFamily.id] ?? [] : []),
    linkedFamily?.image,
  ].filter((image): image is string => Boolean(image))));
  const image = imageCandidates.find((candidate) => !failedImages.includes(candidate));
  const imageLabel = linkedRacket
    ? `${linkedRacket.brand} ${linkedRacket.model} 零售参考图`
    : linkedFamily
      ? `${linkedFamily.brand} ${linkedFamily.family} ${linkedFamily.generation} 拍系参考图`
      : `${player.brand} ${player.marketedFamily} 拍系参考图`;
  return image
    ? <img src={image} alt={imageLabel} loading="lazy" decoding="async" onError={() => setFailedImages((current) => current.includes(image) ? current : [...current, image])} />
    : <span role="img" aria-label={`${player.brand} ${player.marketedFamily} 拍系图片暂不可用`}><b>{player.brand}</b><small>{player.marketedFamily}</small></span>;
}

function TourPlayerCard({
  player,
  leader = false,
  onOpenFamily,
  onOpenRacket,
  onToggleCompare,
  onShare,
  compared,
  compareFull,
  syncScore,
}: {
  player: TourPlayer;
  leader?: boolean;
  onOpenFamily: (id: string) => void;
  onOpenRacket: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onShare: (player: TourPlayer) => void;
  compared: boolean;
  compareFull: boolean;
  syncScore?: number;
}) {
  const target = tourCatalogTargets[player.id];
  const linkedFamily = target ? catalogFamilyById.get(target.familyId) : undefined;
  const linkedRacket = target?.kind === "racket" ? deepRacketById.get(target.racketId) : undefined;
  const mappingMeta = tourMappingMeta[player.mapping];
  const headingId = `tour-player-title-${player.id}`;
  const catalogLanding = linkedRacket?.model ?? (linkedFamily ? `${linkedFamily.family} ${linkedFamily.generation}` : null);

  return (
    <article id={`tour-player-${player.id}`} tabIndex={-1} aria-labelledby={headingId} className={`tour-player-card${leader ? " tour-player-card--leader" : ""}`}>
      <div className="tour-player-card__visual">
        <TourPlayerPortrait player={player} priority={leader} />
        <span className="tour-player-card__shade" aria-hidden="true" />
        <div className="tour-player-card__rank"><span>{player.tour}</span><b>#{player.rank}</b></div>
        <div className="tour-player-card__identity">
          <p><span>{player.country} · {player.countryCode}</span><span>{player.brand}</span></p>
          <h3 id={headingId}>{player.nameZh}</h3>
          <small>{player.name}</small>
          <em>{player.playStyle}</em>
        </div>
        <div className="tour-player-card__racket-peek">
          <TourRacketVisual player={player} />
          <span><small>官方关联</small><b>{player.marketedModel ?? player.marketedFamily}</b></span>
        </div>
      </div>
      <div className="tour-player-card__body">
        <div className="tour-player-card__story"><small>打法侧写 · 编辑观察</small><p>{player.signature}</p></div>
        <div className="tour-player-card__traits" aria-label={`${player.nameZh} 打法标签`}>{player.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
        {typeof syncScore === "number" && (
          <div className="tour-player-card__sync" aria-label={`${player.nameZh} 关联零售拍与你的选拍档案适配 ${syncScore} 分，满分 99`}>
            <span><small>关联零售拍 × 你的档案</small><b>基于当前阶段、打法与优先项</b></span>
            <strong>{syncScore}<small>/99</small></strong>
          </div>
        )}
        <div className="tour-player-card__mapping">
          <div><span className={`tour-mapping-badge tour-mapping-badge--${mappingMeta.tone}`}>{mappingMeta.label}</span><small>{mappingMeta.detail}</small></div>
          <dl>
            <div><dt>品牌公开关联</dt><dd>{player.marketedModel ?? player.marketedFamily}</dd></div>
            {catalogLanding && <div><dt>拍库可比较落点</dt><dd>{catalogLanding}</dd></div>}
          </dl>
        </div>
        <div className="tour-player-card__journey">
          {linkedRacket ? (
            <button data-focus-key={`tour-racket-${player.id}-${linkedRacket.id}`} onClick={() => onOpenRacket(linkedRacket.id)} aria-label={`查看 ${player.nameZh} 关联的 ${linkedRacket.model} 深度档案`}>查看关联拍深档 <span aria-hidden="true">›</span></button>
          ) : linkedFamily ? (
            <button data-focus-key={`tour-family-${player.id}-${linkedFamily.id}`} onClick={() => onOpenFamily(linkedFamily.id)} aria-label={`浏览 ${player.nameZh} 关联的 ${linkedFamily.family} 拍系`}>{player.mapping === "当前拍系参考" ? `浏览参考拍系：${linkedFamily.family}` : `浏览 ${linkedFamily.family} 全系`} <span aria-hidden="true">›</span></button>
          ) : null}
          {linkedRacket && (
            <button
              data-focus-key={`tour-compare-${player.id}-${linkedRacket.id}`}
              onClick={() => onToggleCompare(linkedRacket.id)}
              aria-pressed={compared}
              aria-label={compareFull && !compared ? `管理已满的球拍对比，当前无法加入 ${linkedRacket.model}` : `${compared ? "移出" : "加入"} ${linkedRacket.model} 对比`}
            >
              {compared ? "✓ 已在决策室" : compareFull ? "管理决策室 3/3" : "+ 加入决策室"}
            </button>
          )}
        </div>
        <details className="tour-player-card__evidence">
          <summary>映射说明与来源 <span aria-hidden="true">＋</span></summary>
          <p>{player.note}</p>
          <div className="tour-player-card__sources">
            <a href={player.profileUrl} target="_blank" rel="noreferrer" aria-label={`${player.nameZh} 品牌官方关联来源，新标签页打开`}>品牌关联 ↗</a>
            <a href={player.gearUrl} target="_blank" rel="noreferrer" aria-label={`${player.nameZh} 零售映射来源，新标签页打开`}>零售映射 ↗</a>
            <a href={player.portrait.sourceUrl} target="_blank" rel="noreferrer" aria-label={`${player.nameZh} 照片来源与许可，新标签页打开`}>照片：{player.portrait.credit} · {player.portrait.license} ↗</a>
          </div>
        </details>
        <button className="tour-player-card__share" onClick={() => onShare(player)} aria-label={`复制 ${player.nameZh} 球星档案链接`}>分享这位球员 <span aria-hidden="true">↗</span></button>
      </div>
    </article>
  );
}

export default function RacketApp() {
  const [activeView, setActiveView] = useState<AppView>("discover");
  const [catalogScope, setCatalogScope] = useState<CatalogScope>("families");
  const [catalogBrand, setCatalogBrand] = useState("全部");
  const [catalogType, setCatalogType] = useState<(typeof catalogTypes)[number]>("全部");
  const [catalogGeneration, setCatalogGeneration] = useState<CatalogGeneration>("全部代际");
  const [catalogReleaseYear, setCatalogReleaseYear] = useState<CatalogReleaseYear>("全部年份");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("最新发行");
  const [catalogResultLimit, setCatalogResultLimit] = useState(24);
  const [catalogFiltersOpen, setCatalogFiltersOpen] = useState(false);
  const [openCuratedCriteria, setOpenCuratedCriteria] = useState<Record<string, boolean>>({});
  const [activeCuratedListId, setActiveCuratedListId] = useState(curatedLists[0]?.id ?? "");
  const [matchFlow, setMatchFlow] = useState(emptyMatchFlow);
  const [breakdownOpenIds, setBreakdownOpenIds] = useState<readonly string[]>([]);
  const [previewPriority, setPreviewPriority] = useState<MatchPriority | null>(null);
  const [tourPlayerLanding, setTourPlayerLanding] = useState<{ id: string; token: number } | null>(null);
  const tourLandingTokenRef = useRef(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionPersistence, setSessionPersistence] = useState<"unknown" | "available" | "memory-only">("unknown");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recentRacketIds, setRecentRacketIds] = useState<string[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [familyTargetRacketId, setFamilyTargetRacketId] = useState<string | null>(null);
  const [detailReturnFamilyId, setDetailReturnFamilyId] = useState<string | null>(null);
  const [compareSlots, setCompareSlots] = useState<CompareSlots>([]);
  const [compareUndo, setCompareUndo] = useState<CompareUndo | null>(null);
  const [pendingCompareId, setPendingCompareId] = useState<string | null>(null);
  const [duelOpponentId, setDuelOpponentId] = useState<string | null>(null);
  const [duelShare, setDuelShare] = useState<{ racketId: string; racketName: string; url: string } | null>(null);
  const [duelShareNotice, setDuelShareNotice] = useState("");
  const [comparePanel, setComparePanel] = useState<ComparePanel>("overview");
  const [prescriptionBaselineId, setPrescriptionBaselineId] = useState("");
  const [decisionCandidates, setDecisionCandidates] = useState<Record<string, { status: DecisionCandidateStatus; note: string }>>({});
  const [savedDecisionRoom, setSavedDecisionRoom] = useState<DecisionRoomState | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<TrialFeedback[]>([]);
  const [decisionStorageStatus, setDecisionStorageStatus] = useState<"loading" | "available" | "memory-only">("loading");
  const [feedbackRacketId, setFeedbackRacketId] = useState<string | null>(null);
  const [trialFeedbackDraft, setTrialFeedbackDraft] = useState<TrialFeedbackDraft>(emptyTrialFeedbackDraft);
  const [tourFilter, setTourFilter] = useState<Tour>("ATP");
  const [matchRouteNotice, setMatchRouteNotice] = useState<"missing-result" | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [toastPaused, setToastPaused] = useState(false);
  const [wideModelMatrix, setWideModelMatrix] = useState(false);
  const [compareTableScrollable, setCompareTableScrollable] = useState(false);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const lastFocusIdentityRef = useRef<FocusIdentity | null>(null);
  const familyDialogRef = useRef<HTMLElement | null>(null);
  const racketDialogRef = useRef<HTMLElement | null>(null);
  const matchHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const catalogBrowseRef = useRef<HTMLDivElement | null>(null);
  const catalogSearchRef = useRef<HTMLInputElement | null>(null);
  const catalogSummaryRef = useRef<HTMLDivElement | null>(null);
  const compareTableScrollRef = useRef<HTMLDivElement | null>(null);
  const duelLinkInputRef = useRef<HTMLInputElement | null>(null);
  const duelShareDialogRef = useRef<HTMLElement | null>(null);
  const duelShareRef = useRef<typeof duelShare>(null);
  const duelReturnFocusRef = useRef<HTMLElement | null>(null);
  const pendingDuelFocusRef = useRef(false);
  const trialFeedbackTriggerRef = useRef<HTMLElement | null>(null);
  const catalogResultLimitRef = useRef(24);
  const familyScrollTopRef = useRef(0);
  const familyMatrixScrollLeftRef = useRef(0);
  const racketScrollTopRef = useRef(0);
  const familyReturnRacketRef = useRef<string | null>(null);
  const familyTargetNeedsRevealRef = useRef(false);
  const matchFlowRef = useRef(matchFlow);
  const compareSlotsRef = useRef(compareSlots);
  const duelOpponentRef = useRef<string | null>(null);
  const matchJourneyLifecycleRef = useRef<MatchJourneyLifecycle>(emptyMatchJourneyLifecycle);
  const viewScrollPositionsRef = useRef<Record<AppView, number>>({ discover: 0, match: 0, armory: 0, tour: 0, compare: 0 });
  const pendingPageFocusRef = useRef(false);
  const closeTopOverlayRef = useRef<() => void>(() => undefined);
  const activeViewRef = useRef<AppView>("discover");
  const routeReadyRef = useRef(false);
  const lastRouteRef = useRef<AppRoute>({ view: "discover" });
  const compareUndoTokenRef = useRef(0);
  const pendingMatchFocusRef = useRef(false);
  const pendingViewFocusRef = useRef<AppView | null>(null);
  const pendingHistoryFocusRef = useRef<FocusIdentity | null>(null);
  const undoButtonRef = useRef<HTMLButtonElement | null>(null);
  const undoCompareChangeRef = useRef<() => void>(() => undefined);
  const pendingCompareFocusRef = useRef<string | "undo" | "browse" | null>(null);
  const pendingCompareOriginRef = useRef<{ element: HTMLElement | null; identity: FocusIdentity | null } | null>(null);
  const pendingCompareReturnFocusRef = useRef<{ element: HTMLElement | null; identity: FocusIdentity | null } | null>(null);
  const compareBrowseReturnRef = useRef(false);
  const armoryFiltersRef = useRef<ArmoryFilterState>({ ...armoryFilterConfig.defaults });
  const tourFilterRef = useRef<Tour>("ATP");
  const pendingMatchSettlementRef = useRef<PendingMatchSettlement | null>(null);
  const currentHistoryIndexRef = useRef(0);
  const suppressHashRouteRef = useRef(false);
  const pendingOverlayHistoryPatchRef = useRef<{
    historyIndex: number;
    href: string;
    patch: Record<string, unknown>;
  } | null>(null);
  const overlayHistoryPersistTimerRef = useRef<number | null>(null);
  const overlayHistoryLastPersistRef = useRef(Number.NEGATIVE_INFINITY);
  const persistedMatchSignatureRef = useRef("");
  const persistedCompareSignatureRef = useRef("");
  const decisionHydratedRef = useRef(false);

  const matchScreen = snapshotMatchScreen(matchFlow);
  const matchStep = matchScreen.kind === "question" ? matchScreen.draft.step : matchScreen.kind === "result" ? 3 : 0;
  const matchStage = matchFlow.draft?.answers.stage ?? matchFlow.committed?.stage ?? "进阶";
  const matchStyle = matchFlow.draft?.answers.style ?? matchFlow.committed?.style ?? "底线相持";
  const priority = matchFlow.draft?.answers.priority ?? matchFlow.committed?.priority ?? "均衡";
  const hasCompletedMatch = Boolean(matchFlow.committed);
  const profileStage = matchFlow.committed?.stage ?? matchStage;
  const profileStyle = matchFlow.committed?.style ?? matchStyle;
  const profilePriority = matchFlow.committed?.priority ?? priority;
  // The preview is an unsaved overlay: everything on the result screen reads
  // this single display priority so cards, reasons, breakdowns and actions
  // can never disagree about which ranking is on screen.
  const displayPriority = previewPriority ?? profilePriority;
  const prescriptionBaseline = prescriptionBaselineId ? deepRacketById.get(prescriptionBaselineId) ?? null : null;
  const generalRecommendations = useMemo(() => (
    buildRecommendations(deepRackets, profileStage, profileStyle, displayPriority)
  ), [profileStage, profileStyle, displayPriority]);
  const prescriptionResults = useMemo(() => (
    buildSwapPrescription(deepRackets, prescriptionBaseline, profileStage, profileStyle, displayPriority, 3)
  ), [prescriptionBaseline, profileStage, profileStyle, displayPriority]);
  const prescriptionResultById = useMemo(
    () => new Map(prescriptionResults.map((result) => [result.racket.id, result])),
    [prescriptionResults],
  );
  const recommendations = prescriptionBaseline
    ? prescriptionResults.map(({ racket, match }) => ({ racket, match }))
    : generalRecommendations;
  const previewRankChanges = useMemo(() => {
    // 有当前拍时三张卡代表三条升级路线，不是名次；避免用升降徽章误导。
    if (prescriptionBaseline || previewPriority === null || previewPriority === profilePriority) return null;
    const committedRanking = prescriptionBaseline
      ? buildSwapPrescription(deepRackets, prescriptionBaseline, profileStage, profileStyle, profilePriority, 3)
      : buildRecommendations(deepRackets, profileStage, profileStyle, profilePriority);
    const previewRanking = prescriptionBaseline
      ? buildSwapPrescription(deepRackets, prescriptionBaseline, profileStage, profileStyle, previewPriority, 3)
      : buildRecommendations(deepRackets, profileStage, profileStyle, previewPriority);
    return diffRecommendationRanks(committedRanking, previewRanking, 3);
  }, [previewPriority, profilePriority, prescriptionBaseline, profileStage, profileStyle]);
  const tourPlayerSync = useMemo(() => (
    buildTourPlayerSync(tourPlayers, tourCatalogTargets, deepRackets, { stage: profileStage, style: profileStyle, priority: displayPriority }, recommendationScore)
  ), [profileStage, profileStyle, displayPriority]);
  const tourPlayerSyncById = useMemo(() => new Map(tourPlayerSync.map((item) => [item.player.id, item])), [tourPlayerSync]);

  const filteredFamilies = useMemo(() => {
    return catalogFamilies
      .filter((family) => {
        const matchesBrand = catalogBrand === "全部" || family.brand === catalogBrand;
        const matchesType = catalogType === "全部" || family.type === catalogType;
        const matchesGeneration = catalogGeneration === "全部代际" || family.generation === catalogGeneration;
        const matchesReleaseYear = matchesCatalogFamilyReleaseYear(family, catalogReleaseYear);
        return matchesBrand
          && matchesType
          && matchesGeneration
          && matchesReleaseYear
          && matchesCatalogFamilySearch(family, catalogSearch);
      })
      .sort((a, b) => {
        if (catalogSort === "品牌顺序") return a.brand.localeCompare(b.brand, "en") || a.family.localeCompare(b.family, "en");
        if (catalogSort === "型号数量") return b.models.length - a.models.length;
        return (b.releaseYear ?? 0) - (a.releaseYear ?? 0) || a.brand.localeCompare(b.brand, "en");
      });
  }, [catalogBrand, catalogType, catalogGeneration, catalogReleaseYear, catalogSearch, catalogSort]);

  const matchingCatalogRackets = useMemo(() => {
    return deepRackets
      .filter((racket) => {
        const matchesBrand = catalogBrand === "全部" || racket.brand === catalogBrand;
        const matchesType = catalogType === "全部" || racket.familyType === catalogType;
        const family = racket.familyId ? catalogFamilyById.get(racket.familyId) : undefined;
        const matchesGeneration = catalogGeneration === "全部代际" || family?.generation === catalogGeneration;
        const matchesReleaseYear = matchesCatalogReleaseYearFilter(racket.releaseDate, catalogReleaseYear);
        return matchesBrand
          && matchesType
          && matchesGeneration
          && matchesReleaseYear
          && matchesCatalogRacketSearch(racket, catalogSearch);
      })
      .sort((a, b) => {
        if (catalogSort === "品牌顺序") return a.brand.localeCompare(b.brand, "en") || a.model.localeCompare(b.model, "en");
        if (catalogSort === "型号数量") {
          const aCount = a.familyId ? catalogFamilyById.get(a.familyId)?.models.length ?? 0 : 0;
          const bCount = b.familyId ? catalogFamilyById.get(b.familyId)?.models.length ?? 0 : 0;
          return bCount - aCount || a.brand.localeCompare(b.brand, "en") || a.model.localeCompare(b.model, "en");
        }
        const aYear = parseCatalogReleaseYear(a.releaseDate ?? a.year) ?? 0;
        const bYear = parseCatalogReleaseYear(b.releaseDate ?? b.year) ?? 0;
        return bYear - aYear || a.brand.localeCompare(b.brand, "en") || a.model.localeCompare(b.model, "en");
      });
  }, [catalogBrand, catalogType, catalogGeneration, catalogReleaseYear, catalogSearch, catalogSort]);

  const catalogGenerationsForBrand = useMemo(() => {
    const families = catalogBrand === "全部"
      ? catalogFamilies
      : catalogFamilies.filter((family) => family.brand === catalogBrand);
    const generations = Array.from(new Set(families.map((family) => family.generation)))
      .sort((left, right) => left.localeCompare(right, "zh-CN", { numeric: true }));
    if (catalogGeneration !== "全部代际" && !generations.includes(catalogGeneration)) generations.unshift(catalogGeneration);
    return ["全部代际", ...generations];
  }, [catalogBrand, catalogGeneration]);

  const catalogBrandStats = useMemo(
    () => catalogBrands.map((item) => {
      const families = catalogFamilies.filter((family) => family.brand === item);
      return {
        brand: item,
        families: families.length,
        models: families.reduce((total, family) => total + family.models.length, 0),
        newest: Math.max(...families.map((family) => family.releaseYear ?? 0)),
      };
    }),
    [],
  );

  const selected = selectedId ? deepRackets.find((racket) => racket.id === selectedId) ?? null : null;
  const selectedFamily = selectedFamilyId ? catalogFamilies.find((family) => family.id === selectedFamilyId) ?? null : null;
  const activeCuratedList = curatedListEntries.find(({ list }) => list.id === activeCuratedListId) ?? curatedListEntries[0];
  const activeCuratedScene = activeCuratedList?.list ?? null;
  const activeCuratedRackets = activeCuratedList?.rackets ?? [];
  const activeCuratedCriteriaOpen = activeCuratedScene ? Boolean(openCuratedCriteria[activeCuratedScene.id]) : false;
  const compareIds = useMemo(() => compareSlotIds(compareSlots), [compareSlots]);
  const compared = compareIds.map((id) => deepRackets.find((racket) => racket.id === id)).filter(Boolean) as Racket[];
  const compareInsights = useMemo(() => buildCompareDiffInsights(compareIds.map((id) => deepRacketById.get(id)).filter((racket): racket is Racket => Boolean(racket))), [compareIds]);
  const duelOpponent = duelOpponentId ? deepRacketById.get(duelOpponentId) ?? null : null;
  const duelActive = Boolean(duelOpponent) && compareSlots.some(({ slot, id }) => slot === 0 && id === duelOpponentId) && compareIds.length <= 2;
  const duelChallenger = duelActive && duelOpponent ? compared.find((racket) => racket.id !== duelOpponent.id) ?? null : null;
  const duelVerdicts = duelActive && duelOpponent && duelChallenger ? buildDuelVerdicts(duelOpponent.scores, duelChallenger.scores) : null;
  const compareSlotRackets = ([0, 1, 2] as const).map((slot) => {
    const entry = compareSlots.find((item) => item.slot === slot);
    return { slot, racket: entry ? deepRacketById.get(entry.id) ?? null : null };
  });
  const firstEmptyCompareSlot = compareSlotRackets.find(({ racket }) => !racket)?.slot;
  const featured = recommendations[0];
  const catalogActiveFilterCount = [
    catalogBrand !== "全部",
    catalogType !== "全部",
    catalogGeneration !== "全部代际",
    catalogReleaseYear !== "全部年份",
  ].filter(Boolean).length;
  const visibleCatalogModelCount = filteredFamilies.reduce((total, family) => total + family.models.length, 0);
  const visibleTourPlayers = tourPlayers.filter((player) => player.tour === tourFilter).sort((left, right) => left.rank - right.rank);
  const tourLeader = visibleTourPlayers[0];
  const visibleExactMappings = visibleTourPlayers.filter((player) => player.mapping === "型号级映射").length;
  const visibleFamilyMappings = visibleTourPlayers.filter((player) => player.mapping === "系列级映射" || player.mapping === "当前拍系参考").length;
  const visibleEquivalentMappings = visibleTourPlayers.filter((player) => player.mapping === "基础型号等效").length;
  const pendingCompareRacket = pendingCompareId ? deepRacketById.get(pendingCompareId) ?? null : null;
  const actionableCompareUndo = compareUndo && compareSlotsEqual(compareSlots, compareUndo.afterSlots)
    ? compareUndo
    : null;
  const compareSuggestionRackets = hasCompletedMatch
    ? recommendations.slice(0, 3).map(({ racket }) => racket)
    : compareBaselineIds.map((id) => deepRacketById.get(id)).filter((racket): racket is Racket => Boolean(racket));
  const availableCompareSuggestions = compareSuggestionRackets
    .filter((racket) => !compareIds.includes(racket.id))
    .slice(0, Math.max(0, 3 - compared.length));
  const currentDecisionRoom = useMemo<DecisionRoomState>(() => ({
    baselineId: prescriptionBaseline?.id ?? null,
    slots: compareSlots.map(({ id }) => ({
      racketId: id,
      status: decisionCandidates[id]?.status ?? "candidate",
      note: decisionCandidates[id]?.note ?? "",
    })),
  }), [compareSlots, decisionCandidates, prescriptionBaseline]);
  const savedDecisionSlotIds = savedDecisionRoom?.slots.map((slot) => slot.racketId).filter((id) => deepRacketById.has(id)) ?? [];
  const currentDecisionFeedback = decisionFeedback.filter((item) => compareIds.includes(item.racketId));
  const finalDecisionRacket = compared.find((racket) => decisionCandidates[racket.id]?.status === "final") ?? null;

  /** 对决态是否仍成立：对方战拍必须占据 slot 0，且严格 1v1（篮内至多 2 把）。 */
  const duelStateActive = useCallback((slotsInput: unknown, opponentId: string | null) => {
    if (!opponentId) return false;
    const slots = normalizeCompareSlots(slotsInput);
    return slots.some(({ slot, id }) => slot === 0 && id === opponentId) && slots.length <= 2;
  }, []);

  const formatCurrentRoute = useCallback((route: AppRoute, filters: ArmoryFilterState = armoryFiltersRef.current) => {
    if (route.view === "armory") return formatArmoryRouteState(route, filters, armoryFilterConfig);
    if (route.view === "tour") return formatTourRouteState(route, tourFilterRef.current);
    if (route.view === "compare") return formatCompareRouteState(route, compareSlotsRef.current, { duel: duelStateActive(compareSlotsRef.current, duelOpponentRef.current) });
    return formatAppRoute(route);
  }, [duelStateActive]);

  const applyArmoryFiltersToState = useCallback((filters: ArmoryFilterState) => {
    armoryFiltersRef.current = filters;
    setCatalogScope(filters.scope as CatalogScope);
    setCatalogBrand(filters.brand);
    setCatalogType(filters.type as (typeof catalogTypes)[number]);
    setCatalogGeneration(filters.generation as CatalogGeneration);
    setCatalogReleaseYear(filters.releaseYear as CatalogReleaseYear);
    setCatalogSearch(filters.search);
    setCatalogSort(filters.sort as CatalogSort);
  }, []);

  const applyTourFilterToState = useCallback((tour: Tour) => {
    tourFilterRef.current = tour;
    setTourFilter(tour);
  }, []);

  const replacePaikuHistory = useCallback((state: Record<string, unknown> | null, title: string, url?: string | URL | null) => {
    const currentIndex = historyIndexFromState(window.history.state, currentHistoryIndexRef.current);
    const nextState = { ...(state ?? {}) };
    delete nextState.paikuHistoryIndex;
    const indexedState = withHistoryIndex(nextState, currentIndex);
    window.history.replaceState(indexedState, title, url);
    currentHistoryIndexRef.current = currentIndex;
  }, []);

  const pushPaikuHistory = useCallback((state: Record<string, unknown> | null, title: string, url?: string | URL | null) => {
    const currentIndex = historyIndexFromState(window.history.state, currentHistoryIndexRef.current);
    const nextIndex = nextHistoryIndex(currentIndex);
    const nextState = { ...(state ?? {}) };
    delete nextState.paikuHistoryIndex;
    window.history.pushState(withHistoryIndex(nextState, nextIndex), title, url);
    currentHistoryIndexRef.current = nextIndex;
  }, []);

  const flushOverlayHistoryPatch = useCallback(() => {
    if (overlayHistoryPersistTimerRef.current !== null) {
      window.clearTimeout(overlayHistoryPersistTimerRef.current);
      overlayHistoryPersistTimerRef.current = null;
    }
    const pending = pendingOverlayHistoryPatchRef.current;
    pendingOverlayHistoryPatchRef.current = null;
    if (!pending) return;
    const currentIndex = historyIndexFromState(window.history.state, currentHistoryIndexRef.current);
    if (currentIndex !== pending.historyIndex || window.location.href !== pending.href) return;
    replacePaikuHistory({
      ...((window.history.state as Record<string, unknown> | null) ?? {}),
      ...pending.patch,
    }, "", pending.href);
    overlayHistoryLastPersistRef.current = performance.now();
  }, [replacePaikuHistory]);

  const queueOverlayHistoryPatch = useCallback((patch: Record<string, unknown>) => {
    const historyIndex = historyIndexFromState(window.history.state, currentHistoryIndexRef.current);
    const href = window.location.href;
    const now = performance.now();
    const elapsed = now - overlayHistoryLastPersistRef.current;
    if (elapsed >= 140 && pendingOverlayHistoryPatchRef.current === null) {
      replacePaikuHistory({
        ...((window.history.state as Record<string, unknown> | null) ?? {}),
        ...patch,
      }, "", href);
      overlayHistoryLastPersistRef.current = now;
      return;
    }
    const pending = pendingOverlayHistoryPatchRef.current;
    pendingOverlayHistoryPatchRef.current = pending
      && pending.historyIndex === historyIndex
      && pending.href === href
      ? { ...pending, patch: { ...pending.patch, ...patch } }
      : { historyIndex, href, patch };
    if (overlayHistoryPersistTimerRef.current !== null) window.clearTimeout(overlayHistoryPersistTimerRef.current);
    overlayHistoryPersistTimerRef.current = window.setTimeout(flushOverlayHistoryPatch, Math.max(0, 140 - elapsed));
  }, [flushOverlayHistoryPatch, replacePaikuHistory]);

  useEffect(() => () => {
    if (overlayHistoryPersistTimerRef.current !== null) window.clearTimeout(overlayHistoryPersistTimerRef.current);
  }, []);

  const rememberReturnFocus = useCallback(() => {
    const element = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lastFocusRef.current = element;
    lastFocusIdentityRef.current = captureFocusIdentity(element);
  }, []);

  useEffect(() => {
    let frame = 0;
    const persistViewScroll = () => {
      frame = 0;
      if (!routeReadyRef.current) return;
      const top = Math.max(0, window.scrollY);
      viewScrollPositionsRef.current[activeViewRef.current] = top;
      const state = (window.history.state as (PaikuHistoryState & Record<string, unknown>) | null) ?? {};
      replacePaikuHistory({ ...state, paiku: true, paikuViewScrollTop: top }, "", window.location.href);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(persistViewScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [replacePaikuHistory]);

  useEffect(() => {
    const persistFocusedControl = (event: FocusEvent) => {
      if (!routeReadyRef.current || !(event.target instanceof HTMLElement)) return;
      const focus = captureFocusIdentity(event.target);
      if (!focus) return;
      replacePaikuHistory({
        ...((window.history.state as Record<string, unknown> | null) ?? {}),
        paiku: true,
        paikuFocus: focus,
      }, "", window.location.href);
    };
    document.addEventListener("focusin", persistFocusedControl);
    return () => document.removeEventListener("focusin", persistFocusedControl);
  }, [replacePaikuHistory]);

  const restoreReturnFocus = useCallback(() => {
    if (canRestoreFocus(lastFocusRef.current)) {
      lastFocusRef.current.focus({ preventScroll: true });
      return;
    }
    const identity = lastFocusIdentityRef.current;
    const target = resolveFocusIdentity(identity);
    const fallback = document.getElementById(`${activeViewRef.current}-title`) as HTMLElement | null;
    (target ?? fallback)?.focus({ preventScroll: true });
  }, []);

  const snapshotCurrentHistoryEntry = useCallback(() => {
    flushOverlayHistoryPatch();
    const element = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focus = captureFocusIdentity(element);
    const nextState: PaikuHistoryState & Record<string, unknown> = {
      ...((window.history.state as (PaikuHistoryState & Record<string, unknown>) | null) ?? {}),
      paiku: true,
      paikuViewScrollTop: window.scrollY,
    };
    if (focus) nextState.paikuFocus = focus;
    else delete nextState.paikuFocus;
    viewScrollPositionsRef.current[activeViewRef.current] = window.scrollY;
    replacePaikuHistory(nextState, "", window.location.href);
  }, [flushOverlayHistoryPatch, replacePaikuHistory]);

  const captureMatchOrigin = useCallback((): MatchHistoryOrigin => {
    const state = window.history.state as (PaikuHistoryState & Record<string, unknown>) | null;
    const route = parseAppRoute(window.location.hash);
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focus = state?.paikuFocus ?? captureFocusIdentity(focused) ?? undefined;
    return {
      index: historyIndexFromState(state, currentHistoryIndexRef.current),
      route,
      ...(state?.paikuMatchScreen ? { matchScreen: state.paikuMatchScreen } : {}),
      viewScrollTop: typeof state?.paikuViewScrollTop === "number" ? Math.max(0, state.paikuViewScrollTop) : Math.max(0, window.scrollY),
      ...(focus ? { focus } : {}),
    };
  }, []);

  const materializePendingMatchSettlement = useCallback((pending: PendingMatchSettlement, originState: unknown) => {
    let preparedOriginState = originState;
    if (pending.synthesizeOrigin) {
      const syntheticOriginState = withHistoryIndex({
        ...stripMatchJourneyState(originState),
        paikuOverlayPushed: false,
        paikuViewScrollTop: pending.plan.origin.viewScrollTop ?? 0,
        ...(pending.plan.origin.focus ? { paikuFocus: pending.plan.origin.focus } : {}),
      }, pending.plan.origin.index);
      delete syntheticOriginState.paikuFamilyTargetId;
      delete syntheticOriginState.paikuFamilyScrollTop;
      delete syntheticOriginState.paikuFamilyMatrixScrollLeft;
      delete syntheticOriginState.paikuFamilyRevealTarget;
      delete syntheticOriginState.paikuRacketScrollTop;
      window.history.replaceState(syntheticOriginState, "", formatCurrentRoute(pending.plan.origin.route));
      currentHistoryIndexRef.current = pending.plan.origin.index;
      preparedOriginState = syntheticOriginState;
    }
    const materialized = materializeMatchSettlement(pending.plan, preparedOriginState);
    if (materialized.originReplacement) {
      window.history.replaceState(materialized.originReplacement.state, "", formatCurrentRoute(materialized.originReplacement.route));
      currentHistoryIndexRef.current = materialized.originReplacement.index;
    }
    window.history.pushState(materialized.destination.state, "", formatCurrentRoute(materialized.destination.route));
    currentHistoryIndexRef.current = materialized.destination.index;
    pendingMatchSettlementRef.current = null;
    return materialized.destination.state as PaikuHistoryState & Record<string, unknown>;
  }, [formatCurrentRoute]);

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  useEffect(() => {
    matchFlowRef.current = matchFlow;
  }, [matchFlow]);

  useEffect(() => {
    compareSlotsRef.current = compareSlots;
  }, [compareSlots]);

  // 对决生命周期兜底：任何绕过 commitCompareSlots 的篮子变更（撤销、跨标签同步等）
  // 一旦破坏「对方战拍在 slot 0 且 1v1」不变量，立即退出对决并 canonical 移除 vs=1。
  /* eslint-disable react-hooks/set-state-in-effect -- The duel invariant depends on the basket state, so the exit transition must settle here together with the canonical vs=1 removal. */
  useEffect(() => {
    if (!duelOpponentId) return;
    if (duelStateActive(compareSlots, duelOpponentId)) return;
    duelOpponentRef.current = null;
    setDuelOpponentId(null);
    setLiveMessage("已退出对决模式");
    if (lastRouteRef.current.view === "compare") {
      replacePaikuHistory(window.history.state as Record<string, unknown> | null, "", formatCurrentRoute(lastRouteRef.current));
    }
  }, [compareSlots, duelOpponentId, duelStateActive, formatCurrentRoute, replacePaikuHistory]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const media = window.matchMedia("(min-width: 761px)");
    const update = () => setWideModelMatrix(media.matches);
    const frame = window.requestAnimationFrame(update);
    media.addEventListener("change", update);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const table = compareTableScrollRef.current;
    if (!table || activeView !== "compare") return;
    const update = () => setCompareTableScrollable(table.scrollWidth > table.clientWidth + 1);
    const frame = window.requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(table);
    const innerTable = table.querySelector("table");
    if (innerTable) observer.observe(innerTable);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeView, compareSlots, comparePanel]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    let suppressHashTimer = 0;
    const readRoute = (source: "initial" | "pop" | "hash" = "initial") => {
      setPreviewPriority(null);
      let entryState = window.history.state as (PaikuHistoryState & Record<string, unknown>) | null;
      const previousHistoryIndex = currentHistoryIndexRef.current;
      const hasStoredHistoryIndex = typeof entryState?.paikuHistoryIndex === "number";
      const incomingHistoryIndex = source === "hash" && !hasStoredHistoryIndex
        ? nextHistoryIndex(previousHistoryIndex)
        : historyIndexFromState(entryState, previousHistoryIndex);

      if (source === "pop" && entryState?.paikuHistoryBridge) {
        const delta = bridgeSkipDelta(previousHistoryIndex, incomingHistoryIndex);
        currentHistoryIndexRef.current = incomingHistoryIndex;
        if (delta !== 0) {
          window.history.go(delta);
          return;
        }
        const fallbackRoute = entryState.paikuHistoryBridge.afterRoute;
        const fallbackState = { ...entryState };
        delete fallbackState.paikuHistoryBridge;
        replacePaikuHistory(fallbackState, "", formatCurrentRoute(fallbackRoute));
        entryState = window.history.state as (PaikuHistoryState & Record<string, unknown>) | null;
      } else if (entryState?.paikuHistoryBridge) {
        currentHistoryIndexRef.current = incomingHistoryIndex;
        window.history.forward();
        return;
      }

      const pendingSettlement = pendingMatchSettlementRef.current;
      if (source === "pop" && pendingSettlement && incomingHistoryIndex === pendingSettlement.plan.origin.index) {
        entryState = materializePendingMatchSettlement(pendingSettlement, entryState);
      } else {
        currentHistoryIndexRef.current = incomingHistoryIndex;
      }

      const armoryRouteState = parseArmoryRouteState(window.location.hash, armoryFilterConfig);
      const tourRouteState = parseTourRouteState(window.location.hash, "ATP", resolveTourPlayerRouteFilter);
      let compareRouteState = parseCompareRouteState(
        window.location.hash,
        (id) => deepRacketById.get(id)?.id ?? null,
      );
      const parsedRoute = armoryRouteState.route;
      const previousArmoryFilters = armoryFiltersRef.current;
      const armoryFiltersChanged = parsedRoute.view === "armory" && (
        previousArmoryFilters.scope !== armoryRouteState.filters.scope
        || previousArmoryFilters.brand !== armoryRouteState.filters.brand
        || previousArmoryFilters.type !== armoryRouteState.filters.type
        || previousArmoryFilters.generation !== armoryRouteState.filters.generation
        || previousArmoryFilters.releaseYear !== armoryRouteState.filters.releaseYear
        || previousArmoryFilters.search !== armoryRouteState.filters.search
        || previousArmoryFilters.sort !== armoryRouteState.filters.sort
      );
      if (parsedRoute.view === "armory") {
        const restoredLimit = typeof entryState?.paikuCatalogResultLimit === "number"
          && Number.isInteger(entryState.paikuCatalogResultLimit)
          && entryState.paikuCatalogResultLimit >= 24
          ? Math.min(entryState.paikuCatalogResultLimit, deepRackets.length)
          : 24;
        catalogResultLimitRef.current = restoredLimit;
        setCatalogResultLimit(restoredLimit);
        applyArmoryFiltersToState(armoryRouteState.filters);
      }
      const tourFilterChanged = parsedRoute.view === "tour" && tourFilterRef.current !== tourRouteState.tour;
      if (parsedRoute.view === "tour") applyTourFilterToState(tourRouteState.tour);
      const shouldImportCompareLink = parsedRoute.view === "compare"
        && compareRouteState.hasExplicitSlots
        && shouldImportCompareRoute(source, Boolean(entryState?.paiku));
      if (parsedRoute.view === "compare" && compareRouteState.hasExplicitSlots && !shouldImportCompareLink) {
        const slots = normalizeCompareSlots(compareSlotsRef.current);
        compareRouteState = {
          ...compareRouteState,
          slots,
          rejectedSlots: [],
          rejectedCount: 0,
          canonicalHash: formatCompareRouteState(parsedRoute, slots),
        };
      }
      let compareImportMessage: string | null = null;
      if (shouldImportCompareLink && compareRouteState.rejectedCount > 0) {
        const preservedLocalCount = compareRouteState.slots.length === 0 ? compareSlotsRef.current.length : 0;
        if (preservedLocalCount > 0) {
          const slots = normalizeCompareSlots(compareSlotsRef.current);
          compareRouteState = {
            ...compareRouteState,
            slots,
            canonicalHash: formatCompareRouteState(parsedRoute, slots),
          };
          compareImportMessage = `链接中的球拍均已失效，已保留你原有的 ${preservedLocalCount} 把对比`;
        } else {
          compareImportMessage = compareRouteState.slots.length > 0
            ? `已载入 ${compareRouteState.slots.length} 把球拍；${compareRouteState.rejectedCount} 个失效型号已移除`
            : "链接中的球拍均已失效，请从球拍库重新选择";
        }
      }
      const compareSlotsBeforeImport = normalizeCompareSlots(compareSlotsRef.current);
      const compareSlotsChanged = shouldImportCompareLink
        && !compareSlotsEqual(compareSlotsBeforeImport, compareRouteState.slots);
      if (compareSlotsChanged) {
        compareSlotsRef.current = compareRouteState.slots;
        setCompareSlots(compareRouteState.slots);
        const message = compareImportMessage ?? `已从链接载入 ${compareRouteState.slots.length} 把球拍`;
        const originElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setCompareUndo({
          token: ++compareUndoTokenRef.current,
          kind: "import-link",
          beforeSlots: compareSlotsBeforeImport,
          afterSlots: compareRouteState.slots,
          message,
          originElement,
          originFocus: captureFocusIdentity(originElement),
        });
        setLiveMessage(message);
      } else if (compareImportMessage) {
        setLiveMessage(compareImportMessage);
      }
      if (parsedRoute.view === "compare" && shouldImportCompareLink) {
        if (compareRouteState.duel) {
          const opponentSlot = compareRouteState.slots.find(({ slot }) => slot === 0);
          const opponentRacket = opponentSlot ? deepRacketById.get(opponentSlot.id) : undefined;
          if (opponentRacket) {
            const entering = duelOpponentRef.current !== opponentRacket.id;
            duelOpponentRef.current = opponentRacket.id;
            setDuelOpponentId(opponentRacket.id);
            if (entering) setLiveMessage(`收到球拍对决：${opponentRacket.brand} ${opponentRacket.model}，选一把球拍应战`);
          }
        } else if (duelOpponentRef.current && !duelStateActive(compareRouteState.slots, duelOpponentRef.current)) {
          duelOpponentRef.current = null;
          setDuelOpponentId(null);
        }
      }
      let familyId = parsedRoute.familyId && catalogFamilyById.has(parsedRoute.familyId) ? parsedRoute.familyId : undefined;
      let racket = parsedRoute.racketId ? deepRacketById.get(parsedRoute.racketId) : undefined;
      if (parsedRoute.racketId && !racket) setLiveMessage("该球拍链接已失效，已返回当前栏目");
      else if (parsedRoute.familyId && !familyId) setLiveMessage("该拍系链接已变更，已返回当前栏目");
      else if (parsedRoute.view === "tour" && parsedRoute.playerId && !tourRouteState.playerId) setLiveMessage("该球星链接已失效，已返回巡回赛拍房");
      let nestedFamilyId = familyId && racket?.familyId === familyId ? familyId : undefined;
      const matchRouteStep = parsedRoute.view === "match" && !parsedRoute.familyId && !parsedRoute.racketId
        ? parsedRoute.matchStep
        : undefined;
      const resumeDraftFromResultRoute = parsedRoute.view === "match"
        && shouldResumeStoredMatchDraft(matchFlowRef.current, matchRouteStep, entryState?.paikuMatchScreen?.kind === "result");
      const effectiveMatchRouteStep = resumeDraftFromResultRoute
        ? matchFlowRef.current.draft?.step
        : matchRouteStep;
      if (resumeDraftFromResultRoute) {
        setLiveMessage(`已继续未完成的档案修改，第 ${(effectiveMatchRouteStep ?? 0) + 1}/3 步`);
      }
      let route: AppRoute = effectiveMatchRouteStep !== undefined
        ? { view: "match", matchStep: effectiveMatchRouteStep }
        : racket
          ? { view: parsedRoute.view, ...(nestedFamilyId ? { familyId: nestedFamilyId } : {}), racketId: racket.id }
          : familyId
            ? { view: parsedRoute.view, familyId }
            : { view: parsedRoute.view, ...(tourRouteState.playerId ? { playerId: tourRouteState.playerId } : {}) };
      let state = window.history.state as (PaikuHistoryState & Record<string, unknown>) | null;

      const settledJourney = state?.paikuMatchJourneyId
        ? findSettledMatchJourney(matchJourneyLifecycleRef.current, state.paikuMatchJourneyId)
        : null;
      if (settledJourney && route.view === "match") {
        const destination = settledJourney.destination;
        route = { ...destination.route };
        familyId = route.familyId && catalogFamilyById.has(route.familyId) ? route.familyId : undefined;
        racket = route.racketId ? deepRacketById.get(route.racketId) : undefined;
        if ((route.familyId && !familyId) || (route.racketId && !racket)) route = { view: route.view };
        nestedFamilyId = familyId && racket?.familyId === familyId ? familyId : undefined;
        if (destination.screen?.kind === "result") {
          const restoredFlow = restoreMatchScreen(matchFlowRef.current, destination.screen, true);
          matchFlowRef.current = restoredFlow;
          setMatchFlow(restoredFlow);
        }
        state = {
          ...(stripMatchJourneyState(state) as PaikuHistoryState & Record<string, unknown>),
          paiku: true,
          paikuOverlayPushed: Boolean(route.familyId || route.racketId),
          paikuMatchPushed: false,
          ...(destination.screen ? { paikuMatchScreen: destination.screen } : {}),
        };
        delete state.paikuFocus;
        if (!route.familyId && !route.racketId) {
          delete state.paikuFamilyTargetId;
          delete state.paikuFamilyScrollTop;
          delete state.paikuFamilyMatrixScrollLeft;
          delete state.paikuFamilyRevealTarget;
          delete state.paikuRacketScrollTop;
        }
        replacePaikuHistory(state, "", formatCurrentRoute(route));
      } else if (route.view === "match" && !route.familyId && !route.racketId && route.matchStep === undefined) {
        let restoredFlow = matchFlowRef.current;
        const baseDraftJourneyId = restoredFlow.draft?.journeyId;
        const baseDraftSettlement = baseDraftJourneyId
          ? findSettledMatchJourney(matchJourneyLifecycleRef.current, baseDraftJourneyId)
          : null;
        if (restoredFlow.draft && (
          !baseDraftJourneyId
          || (baseDraftSettlement && state?.paikuMatchJourneyId !== baseDraftJourneyId)
        )) {
          restoredFlow = assignMatchDraftJourney(restoredFlow, makeMatchJourneyId());
        }
        if (snapshotMatchScreen(restoredFlow).kind === "idle") restoredFlow = beginMatchDraft(restoredFlow, 0, state?.paikuMatchJourneyId ?? makeMatchJourneyId());
        const restoredScreen = snapshotMatchScreen(restoredFlow);
        const restoredStep = restoredScreen.kind === "result" ? 3 : restoredScreen.kind === "question" ? restoredScreen.draft.step : 0;
        route = { view: "match", matchStep: restoredStep };
        state = {
          ...(state ?? {}),
          paiku: true,
          paikuMatchPushed: false,
          paikuMatchScreen: restoredScreen,
          ...(restoredScreen.kind === "question" && restoredScreen.draft.journeyId ? { paikuMatchJourneyId: restoredScreen.draft.journeyId } : {}),
        };
        replacePaikuHistory(state, "", formatCurrentRoute(route));
        matchFlowRef.current = restoredFlow;
        setMatchFlow(restoredFlow);
      }

      if (!state?.paiku) {
        if (route.familyId || route.racketId) {
          let parentRoute = parentAppRoute(route);
          let parentMatchScreen: MatchScreenSnapshot | undefined;
          if (route.view === "match") {
            let parentMatchFlow = matchFlowRef.current;
            if (snapshotMatchScreen(parentMatchFlow).kind === "idle") parentMatchFlow = beginMatchDraft(parentMatchFlow, 0, state?.paikuMatchJourneyId ?? makeMatchJourneyId());
            parentMatchScreen = snapshotMatchScreen(parentMatchFlow);
            const parentStep = parentMatchScreen.kind === "result" ? 3 : parentMatchScreen.kind === "question" ? parentMatchScreen.draft.step : 0;
            parentRoute = { view: "match", matchStep: parentStep };
            matchFlowRef.current = parentMatchFlow;
            setMatchFlow(parentMatchFlow);
          }
          const parentJourneyId = parentMatchScreen?.kind === "question" ? parentMatchScreen.draft.journeyId : undefined;
          const parentState = { ...(state ?? {}), paiku: true as const, paikuOverlayPushed: false, paikuViewScrollTop: 0, ...(parentMatchScreen ? { paikuMatchScreen: parentMatchScreen } : {}), ...(parentJourneyId ? { paikuMatchJourneyId: parentJourneyId } : {}) };
          replacePaikuHistory(parentState, "", formatCurrentRoute(parentRoute));
          if (route.view === "match" && nestedFamilyId && racket) {
            pushPaikuHistory({ ...parentState, paikuOverlayPushed: true, paikuFamilyScrollTop: 0, paikuFamilyMatrixScrollLeft: 0, paikuFamilyTargetId: racket.id, paikuFamilyRevealTarget: true }, "", formatCurrentRoute({ view: "match", familyId: nestedFamilyId }));
          }
          pushPaikuHistory({ ...parentState, paikuOverlayPushed: true, ...(nestedFamilyId && racket ? { paikuFamilyTargetId: racket.id, paikuFamilyScrollTop: 0, paikuFamilyMatrixScrollLeft: 0, paikuRacketScrollTop: 0 } : {}) }, "", formatCurrentRoute(route));
        } else if (route.view === "match" && route.matchStep !== undefined && route.matchStep > 0) {
          const parentRoute = parentAppRoute(route);
          replacePaikuHistory({ ...(state ?? {}), paiku: true, paikuMatchPushed: false }, "", formatCurrentRoute(parentRoute));
          pushPaikuHistory({ paiku: true, paikuMatchPushed: true }, "", formatCurrentRoute(route));
        } else {
          replacePaikuHistory({ ...(state ?? {}), paiku: true, paikuOverlayPushed: false }, "", formatCurrentRoute(route));
        }
      } else if (window.location.hash !== formatCurrentRoute(route)) {
        replacePaikuHistory(state, "", formatCurrentRoute(route));
      }

      state = window.history.state as (PaikuHistoryState & Record<string, unknown>) | null;
      const historyResultProfile = state?.paikuMatchScreen?.kind === "result"
        ? state.paikuMatchScreen.profile
        : undefined;
      setMatchRouteNotice(
        route.view === "match"
        && route.matchStep === 3
        && !matchFlowRef.current.committed
        && !historyResultProfile
          ? "missing-result"
          : null,
      );

      const previousRoute = lastRouteRef.current;
      const previousView = activeViewRef.current;
      const targetViewScrollTop = typeof state?.paikuViewScrollTop === "number"
        ? Math.max(0, state.paikuViewScrollTop)
        : viewScrollPositionsRef.current[route.view];
      const nextHasOverlay = Boolean(route.familyId || route.racketId);
      if (routeReadyRef.current && previousView === route.view && nextHasOverlay && state?.paikuFocus) {
        pendingHistoryFocusRef.current = state.paikuFocus;
      }
      if (routeReadyRef.current && previousView === "armory" && route.view === "armory" && armoryFiltersChanged && state?.paikuFocus) {
        pendingHistoryFocusRef.current = state.paikuFocus;
      }
      if (routeReadyRef.current && previousView === "tour" && route.view === "tour" && tourFilterChanged && state?.paikuFocus) {
        pendingHistoryFocusRef.current = state.paikuFocus;
      }
      if (routeReadyRef.current && previousView === "compare" && route.view === "compare" && compareSlotsChanged && state?.paikuFocus) {
        pendingHistoryFocusRef.current = state.paikuFocus;
      }
      if (routeReadyRef.current && previousView !== route.view) {
        viewScrollPositionsRef.current[previousView] = window.scrollY;
        const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const focusWillUnmount = Boolean(focused?.closest(".app-content"));
        pendingHistoryFocusRef.current = state?.paikuFocus ?? null;
        if (!pendingHistoryFocusRef.current && !route.familyId && !route.racketId && (!focused || focused === document.body || focusWillUnmount)) {
          pendingViewFocusRef.current = route.view;
        } else {
          pendingViewFocusRef.current = null;
        }
      }
      if (routeReadyRef.current && (previousRoute.familyId || previousRoute.racketId) && !route.familyId && !route.racketId) {
        pendingPageFocusRef.current = !state?.paikuFocus;
        if (state?.paikuFocus) pendingHistoryFocusRef.current = state.paikuFocus;
      }
      if (
        routeReadyRef.current
        && previousRoute.view === "match"
        && route.view === "match"
        && previousRoute.matchStep !== undefined
        && route.matchStep !== undefined
        && previousRoute.matchStep !== route.matchStep
      ) {
        if (route.matchStep === 3 && state?.paikuFocus) {
          pendingHistoryFocusRef.current = state.paikuFocus;
          pendingMatchFocusRef.current = false;
        } else {
          pendingMatchFocusRef.current = true;
        }
      }
      const movingWithinFamily = previousRoute.familyId
        && route.familyId === previousRoute.familyId
        && (previousRoute.racketId || route.racketId);
      if (routeReadyRef.current && movingWithinFamily) {
        const targetRacketId = route.racketId ?? previousRoute.racketId ?? null;
        familyTargetNeedsRevealRef.current = false;
        if (!previousRoute.racketId && route.racketId) {
          familyScrollTopRef.current = familyDialogRef.current?.querySelector<HTMLElement>(".family-inspector__scroll")?.scrollTop ?? familyScrollTopRef.current;
          familyMatrixScrollLeftRef.current = familyDialogRef.current?.querySelector<HTMLElement>(".model-matrix__scroll")?.scrollLeft ?? familyMatrixScrollLeftRef.current;
        }
        familyReturnRacketRef.current = targetRacketId;
        setFamilyTargetRacketId(targetRacketId);
      } else if (!route.familyId) {
        setFamilyTargetRacketId(null);
      }
      if (familyId && state?.paikuFamilyTargetId) {
        const targetRacket = deepRacketById.get(state.paikuFamilyTargetId);
        if (targetRacket?.familyId === familyId) {
          familyReturnRacketRef.current = targetRacket.id;
          familyTargetNeedsRevealRef.current = Boolean(state.paikuFamilyRevealTarget);
          setFamilyTargetRacketId(targetRacket.id);
        }
      }
      if (familyId && typeof state?.paikuFamilyScrollTop === "number") {
        familyScrollTopRef.current = Math.max(0, state.paikuFamilyScrollTop);
      }
      if (familyId && typeof state?.paikuFamilyMatrixScrollLeft === "number") {
        familyMatrixScrollLeftRef.current = Math.max(0, state.paikuFamilyMatrixScrollLeft);
      }
      if (racket && typeof state?.paikuRacketScrollTop === "number") {
        racketScrollTopRef.current = Math.max(0, state.paikuRacketScrollTop);
      }

      activeViewRef.current = route.view;
      lastRouteRef.current = route;
      setActiveView(route.view);
      setSelectedId(racket?.id ?? null);
      setSelectedFamilyId(!racket && familyId ? familyId : null);
      setDetailReturnFamilyId(nestedFamilyId ?? null);
      if (route.view === "tour" && route.playerId) {
        if (!state?.paikuFocus) {
          setTourPlayerLanding({ id: route.playerId, token: ++tourLandingTokenRef.current });
          setLiveMessage(`已定位到 ${tourPlayerById.get(route.playerId)?.nameZh ?? "目标球星"} 的球星卡`);
        }
      } else {
        setTourPlayerLanding(null);
      }
      const pendingCandidate = route.view === "compare" && state?.paikuPendingCompareId
        ? deepRacketById.get(state.paikuPendingCompareId)
        : undefined;
      const hadPendingCandidateMarker = route.view === "compare" && Boolean(state?.paikuPendingCompareId);
      const pendingCandidateId = pendingCandidate?.id ?? null;
      const currentCompareIds = compareSlotIds(compareSlotsRef.current);
      const restoredPendingCompareId = pendingCandidateId && currentCompareIds.length === 3 && !currentCompareIds.includes(pendingCandidateId)
        ? pendingCandidateId
        : null;
      if (hadPendingCandidateMarker && !restoredPendingCompareId) {
        if (pendingCandidateId && !currentCompareIds.includes(pendingCandidateId) && currentCompareIds.length < 3) {
          const restored = addCompareId(compareSlotsRef.current, pendingCandidateId);
          if (restored?.action === "added") {
            compareSlotsRef.current = restored.slots;
            setCompareSlots(restored.slots);
            setLiveMessage(`空槽已出现，已自动加入 ${deepRacketById.get(pendingCandidateId)?.model ?? "目标球拍"}`);
          }
        }
        if (!pendingCandidateId) setLiveMessage("待换入的球拍已失效，已取消本次替换");
        const nextHistoryState = { ...(state ?? {}) };
        delete nextHistoryState.paikuPendingCompareId;
        replacePaikuHistory(nextHistoryState, "", window.location.href);
      }
      setPendingCompareId(restoredPendingCompareId);
      compareBrowseReturnRef.current = route.view === "armory" && Boolean(state?.paikuCompareBrowseReturn);
      if (route.view === "match" && route.matchStep !== undefined && state?.paikuMatchRecovery !== "missing-result") {
        const historyScreen = state?.paikuMatchScreen;
        setMatchFlow((current) => {
          const restored = historyScreen
            ? restoreMatchScreen(current, historyScreen)
            : route.matchStep === 3
              ? restoreMatchScreen(current, { kind: "result" })
              : restoreMatchScreen(current, {
                kind: "question",
                draft: {
                  step: route.matchStep as MatchQuestionStep,
                  answers: { ...(current.committed ?? {}), ...(current.draft?.answers ?? {}) },
                },
              });
          matchFlowRef.current = restored;
          return restored;
        });
      }

      if (!familyId || (familyReturnRacketRef.current && deepRacketById.get(familyReturnRacketRef.current)?.familyId !== familyId)) {
        familyReturnRacketRef.current = null;
        familyTargetNeedsRevealRef.current = false;
      }

      const changedMatchHistoryStep = previousRoute.view === "match"
        && route.view === "match"
        && previousRoute.matchStep !== route.matchStep;
      if (routeReadyRef.current && (previousView !== route.view || changedMatchHistoryStep || armoryFiltersChanged || tourFilterChanged || compareSlotsChanged)) {
        window.requestAnimationFrame(() => window.scrollTo({ top: targetViewScrollTop, behavior: "auto" }));
      }
      routeReadyRef.current = true;
    };
    const onPopState = () => {
      if (duelShareRef.current) {
        pendingDuelFocusRef.current = true;
        duelShareRef.current = null;
        setDuelShare(null);
      }
      suppressHashRouteRef.current = true;
      if (suppressHashTimer) window.clearTimeout(suppressHashTimer);
      readRoute("pop");
      suppressHashTimer = window.setTimeout(() => {
        suppressHashRouteRef.current = false;
      }, 0);
    };
    const onHashChange = () => {
      if (duelShareRef.current) {
        pendingDuelFocusRef.current = true;
        duelShareRef.current = null;
        setDuelShare(null);
      }
      if (!suppressHashRouteRef.current) readRoute("hash");
    };
    readRoute();
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      if (suppressHashTimer) window.clearTimeout(suppressHashTimer);
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [applyArmoryFiltersToState, applyTourFilterToState, duelStateActive, formatCurrentRoute, materializePendingMatchSettlement, pushPaikuHistory, replacePaikuHistory]);

  /* eslint-disable react-hooks/set-state-in-effect -- This one pre-paint transaction hydrates URL, history and local app state together so deep links never expose the wrong Tab. */
  useLayoutEffect(() => {
    const lifecycleCopies: unknown[] = [];
    for (const storageName of ["sessionStorage", "localStorage"] as const) {
      try {
        const storage = window[storageName];
        lifecycleCopies.push(storage.getItem(MATCH_JOURNEY_LIFECYCLE_STORAGE_KEY));
      } catch {
        // One storage area can be unavailable without affecting the other.
      }
    }
    matchJourneyLifecycleRef.current = mergeMatchJourneyLifecycles(lifecycleCopies, 100);

    try {
      let legacySessionSaved: null | Record<string, unknown> = null;
      let legacyLocalSaved: null | Record<string, unknown> = null;
      let storedMatch: unknown | null = null;
      let storedCompare: unknown | null = null;
      let storedTour: unknown | null = null;
      let storedCatalog: unknown | null = null;
      const readableStorages: Array<{
        name: "sessionStorage" | "localStorage";
        storage: Storage;
      }> = [];
      for (const storageName of ["sessionStorage", "localStorage"] as const) {
        try {
          const candidate = window[storageName];
          candidate.getItem(LEGACY_SESSION_STORAGE_KEY);
          readableStorages.push({ name: storageName, storage: candidate });
        } catch {
          // Try the next browser storage area before falling back to memory only.
        }
      }
      const storageReadable = readableStorages.length > 0;
      if (storageReadable) {
        const domainEntries = (Object.entries(SESSION_DOMAIN_STORAGE_KEYS) as Array<[
          keyof typeof SESSION_DOMAIN_STORAGE_KEYS,
          string,
        ]>).map(([domain, key]) => {
          let sessionCopy: unknown | null = null;
          let localCopy: unknown | null = null;
          for (const { name, storage } of readableStorages) {
            const raw = storage.getItem(key);
            const value = parseSessionDomain(raw);
            if (raw !== null && value === null) {
              try {
                storage.removeItem(key);
              } catch {
                // A corrupt record can still be ignored when removal is denied.
              }
            }
            if (name === "sessionStorage") sessionCopy = value;
            else localCopy = value;
          }
          return [domain, selectSessionDomainCopy(domain, sessionCopy, localCopy)] as const;
        });
        const domains = Object.fromEntries(domainEntries) as Record<keyof typeof SESSION_DOMAIN_STORAGE_KEYS, unknown | null>;
        storedMatch = domains.match;
        storedCompare = domains.compare;
        storedTour = domains.tour;
        storedCatalog = domains.catalog;

        // A partially migrated browser can already have one domain key while
        // the remaining values still live in the legacy snapshot. Read it as
        // a per-domain fallback; the dedicated keys always win below.
        for (const { name, storage } of readableStorages) {
          const legacyRaw = storage.getItem(LEGACY_SESSION_STORAGE_KEY);
          if (!legacyRaw) continue;
          try {
            const parsed: unknown = JSON.parse(legacyRaw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              if (name === "sessionStorage") legacySessionSaved = parsed as Record<string, unknown>;
              else legacyLocalSaved = parsed as Record<string, unknown>;
              continue;
            }
            storage.removeItem(LEGACY_SESSION_STORAGE_KEY);
          } catch {
            try {
              storage.removeItem(LEGACY_SESSION_STORAGE_KEY);
            } catch {
              // Ignore a malformed legacy snapshot when removal is denied.
            }
          }
        }
      }
      setSessionPersistence(storageReadable ? "available" : "memory-only");
      const saved = selectSessionDomainCopy("match", legacySessionSaved, legacyLocalSaved);
      const savedCompare = selectSessionDomainCopy("compare", legacySessionSaved, legacyLocalSaved);
      persistedMatchSignatureRef.current = storedMatch === null ? "" : sessionValueSignature(storedMatch);
      persistedCompareSignatureRef.current = storedCompare === null ? "" : sessionValueSignature(normalizeCompareSlots(storedCompare));
      let restoredMatch = restoreMatchFlow(storedMatch ?? saved?.match ?? saved);
      let route = parseAppRoute(window.location.hash);
      let familyId = route.familyId && catalogFamilyById.has(route.familyId) ? route.familyId : undefined;
      let racket = route.racketId ? deepRacketById.get(route.racketId) : undefined;
      let nestedFamilyId = familyId && racket?.familyId === familyId ? familyId : undefined;
      let isMatchPage = route.view === "match" && !familyId && !racket;
      let isMatchOverlay = route.view === "match" && Boolean(familyId || racket);
      let historyState = window.history.state as PaikuHistoryState | null;
      const wasColdHistoryEntry = !historyState?.paiku;
      const invalidMatchRacket = route.view === "match" && Boolean(route.racketId) && !racket;
      const invalidMatchFamily = route.view === "match" && Boolean(route.familyId) && !familyId;
      if (invalidMatchRacket || invalidMatchFamily) {
        setLiveMessage(invalidMatchRacket ? "该球拍链接已失效，已返回匹配入口" : "该拍系链接已变更，已返回匹配入口");
        route = { view: "match" };
        familyId = undefined;
        racket = undefined;
        nestedFamilyId = undefined;
        isMatchPage = true;
        isMatchOverlay = false;
      }

      const settledJourney = historyState?.paikuMatchJourneyId
        ? findSettledMatchJourney(matchJourneyLifecycleRef.current, historyState.paikuMatchJourneyId)
        : null;
      if ((isMatchPage || isMatchOverlay) && settledJourney) {
        const destination = settledJourney.destination;
        route = { ...destination.route };
        familyId = route.familyId && catalogFamilyById.has(route.familyId) ? route.familyId : undefined;
        racket = route.racketId ? deepRacketById.get(route.racketId) : undefined;
        if ((route.familyId && !familyId) || (route.racketId && !racket)) route = { view: route.view };
        nestedFamilyId = familyId && racket?.familyId === familyId ? familyId : undefined;
        isMatchPage = route.view === "match" && !familyId && !racket;
        isMatchOverlay = route.view === "match" && Boolean(familyId || racket);
        if (destination.screen?.kind === "result") {
          restoredMatch = restoreMatchScreen(restoredMatch, destination.screen, true);
        }
        historyState = {
          ...(stripMatchJourneyState(historyState) as PaikuHistoryState),
          paiku: true,
          paikuOverlayPushed: Boolean(route.familyId || route.racketId),
          paikuMatchPushed: false,
          ...(destination.screen ? { paikuMatchScreen: destination.screen } : {}),
        };
        delete historyState.paikuFocus;
        if (!route.familyId && !route.racketId) {
          delete historyState.paikuFamilyTargetId;
          delete historyState.paikuFamilyScrollTop;
          delete historyState.paikuFamilyMatrixScrollLeft;
          delete historyState.paikuFamilyRevealTarget;
          delete historyState.paikuRacketScrollTop;
        }
        replacePaikuHistory(historyState, "", formatCurrentRoute(route));
      }

      const resumingStoredDraftFromResultLink = isMatchPage
        && wasColdHistoryEntry
        && shouldResumeStoredMatchDraft(restoredMatch, route.matchStep, historyState?.paikuMatchScreen?.kind === "result");
      if ((isMatchPage || isMatchOverlay) && historyState?.paikuMatchScreen) {
        restoredMatch = restoreMatchScreen(restoredMatch, historyState.paikuMatchScreen, true);
      } else if (isMatchPage && route.matchStep !== undefined) {
        restoredMatch = resumingStoredDraftFromResultLink
          ? restoredMatch
          : route.matchStep === 3
          ? restoreMatchScreen(restoredMatch, { kind: "result" })
          : restoreMatchScreen(restoredMatch, {
            kind: "question",
            draft: {
              step: route.matchStep as MatchQuestionStep,
              answers: { ...(restoredMatch.committed ?? {}), ...(restoredMatch.draft?.answers ?? {}) },
            },
          });
      }

      if (resumingStoredDraftFromResultLink) {
        setLiveMessage(`已继续未完成的档案修改，第 ${(restoredMatch.draft?.step ?? 0) + 1}/3 步`);
      }

      const missingMatchResult = isMatchPage
        && route.matchStep === 3
        && !restoredMatch.committed
        && !resumingStoredDraftFromResultLink;
      setMatchRouteNotice(missingMatchResult ? "missing-result" : null);

      if ((isMatchPage || isMatchOverlay) && !missingMatchResult && snapshotMatchScreen(restoredMatch).kind === "idle") {
        restoredMatch = beginMatchDraft(restoredMatch, 0, historyState?.paikuMatchJourneyId ?? makeMatchJourneyId());
      } else if (restoredMatch.draft) {
        const draftJourneyId = restoredMatch.draft.journeyId;
        const settledDraftJourney = draftJourneyId
          ? findSettledMatchJourney(matchJourneyLifecycleRef.current, draftJourneyId)
          : null;
        const historyRepresentsSettledJourney = Boolean(
          settledDraftJourney
          && historyState?.paikuMatchJourneyId === draftJourneyId,
        );
        if (!draftJourneyId || (settledDraftJourney && !historyRepresentsSettledJourney)) {
          restoredMatch = assignMatchDraftJourney(restoredMatch, makeMatchJourneyId());
        }
      }
      if (isMatchPage) {
        const restoredScreen = snapshotMatchScreen(restoredMatch);
        const restoredStep = restoredScreen.kind === "result" ? 3 : restoredScreen.kind === "question" ? restoredScreen.draft.step : 0;
        const canonicalRoute: AppRoute = { view: "match", matchStep: missingMatchResult ? 3 : restoredStep };
        if (wasColdHistoryEntry) {
          const coldEntries = buildColdMatchHistory(
            missingMatchResult ? { kind: "idle" } : restoredScreen,
            historyIndexFromState(historyState, currentHistoryIndexRef.current),
            historyState ?? {},
          );
          for (const entry of coldEntries) {
            const write = entry.action === "replace" ? window.history.replaceState.bind(window.history) : window.history.pushState.bind(window.history);
            write(entry.state, "", formatAppRoute(entry.route));
            currentHistoryIndexRef.current = entry.index;
          }
          historyState = coldEntries.at(-1)?.state ?? historyState;
          if (missingMatchResult) {
            const recoveryIndex = nextHistoryIndex(historyIndexFromState(historyState, currentHistoryIndexRef.current));
            const recoveryState = withHistoryIndex({
              ...(historyState ?? {}),
              paikuMatchPushed: true,
              paikuMatchRecovery: "missing-result" as const,
            }, recoveryIndex);
            delete recoveryState.paikuMatchScreen;
            delete recoveryState.paikuMatchJourneyId;
            delete recoveryState.paikuMatchOrigin;
            window.history.pushState(recoveryState, "", formatAppRoute(canonicalRoute));
            currentHistoryIndexRef.current = recoveryIndex;
            historyState = recoveryState;
          }
        } else {
          replacePaikuHistory({
            ...(historyState ?? {}),
            paiku: true,
            paikuMatchScreen: restoredScreen,
            ...(restoredScreen.kind === "question" && restoredScreen.draft.journeyId ? { paikuMatchJourneyId: restoredScreen.draft.journeyId } : {}),
          }, "", formatAppRoute(canonicalRoute));
        }
        lastRouteRef.current = canonicalRoute;
      } else if (isMatchOverlay && !historyState?.paiku) {
        const restoredScreen = snapshotMatchScreen(restoredMatch);
        const restoredStep = restoredScreen.kind === "result" ? 3 : restoredScreen.kind === "question" ? restoredScreen.draft.step : 0;
        const parentRoute: AppRoute = { view: "match", matchStep: restoredStep };
        const parentHistoryState = {
          ...(historyState ?? {}),
          paiku: true,
          paikuOverlayPushed: false,
          paikuViewScrollTop: 0,
          paikuMatchScreen: restoredScreen,
          ...(restoredScreen.kind === "question" && restoredScreen.draft.journeyId ? { paikuMatchJourneyId: restoredScreen.draft.journeyId } : {}),
        } satisfies PaikuHistoryState;
        replacePaikuHistory(parentHistoryState, "", formatAppRoute(parentRoute));
        if (nestedFamilyId && racket) {
          pushPaikuHistory({ ...parentHistoryState, paikuOverlayPushed: true, paikuFamilyScrollTop: 0, paikuFamilyMatrixScrollLeft: 0, paikuFamilyTargetId: racket.id, paikuFamilyRevealTarget: true }, "", formatAppRoute({ view: "match", familyId: nestedFamilyId }));
        }
        pushPaikuHistory({ ...parentHistoryState, paikuOverlayPushed: true, ...(nestedFamilyId && racket ? { paikuFamilyTargetId: racket.id, paikuFamilyScrollTop: 0, paikuFamilyMatrixScrollLeft: 0, paikuRacketScrollTop: 0 } : {}) }, "", formatAppRoute(route));
        lastRouteRef.current = route;
      }

      matchFlowRef.current = restoredMatch;
      activeViewRef.current = route.view;
      setActiveView(route.view);
      setSelectedId(racket?.id ?? null);
      setSelectedFamilyId(!racket && familyId ? familyId : null);
      setDetailReturnFamilyId(nestedFamilyId ?? null);
      setMatchFlow(restoredMatch);
      const savedCompareSlots = normalizeCompareSlots(normalizeCompareSlots(storedCompare ?? savedCompare)
        .map((entry) => ({ ...entry, id: deepRacketById.get(entry.id)?.id ?? entry.id }))
        .filter(({ id }) => deepRacketById.has(id)));
      const initialCompareRouteState = parseCompareRouteState(
        window.location.hash,
        (id) => deepRacketById.get(id)?.id ?? null,
      );
      const preservingSavedCompare = route.view === "compare"
        && initialCompareRouteState.hasExplicitSlots
        && initialCompareRouteState.rejectedCount > 0
        && initialCompareRouteState.slots.length === 0
        && savedCompareSlots.length > 0;
      const restoredCompareSlots = route.view === "compare" && initialCompareRouteState.hasExplicitSlots
        ? preservingSavedCompare ? savedCompareSlots : initialCompareRouteState.slots
        : savedCompareSlots;
      const initialCompareImportChanged = route.view === "compare"
        && initialCompareRouteState.hasExplicitSlots
        && !preservingSavedCompare
        && !compareSlotsEqual(savedCompareSlots, restoredCompareSlots);
      let initialCompareImportMessage: string | null = null;
      if (route.view === "compare" && initialCompareRouteState.rejectedCount > 0) {
        initialCompareImportMessage = preservingSavedCompare
          ? `链接中的球拍均已失效，已保留你原有的 ${savedCompareSlots.length} 把对比`
          : initialCompareRouteState.slots.length > 0
            ? `已载入 ${initialCompareRouteState.slots.length} 把球拍；${initialCompareRouteState.rejectedCount} 个失效型号已移除`
            : "链接中的球拍均已失效，请从球拍库重新选择";
      } else if (initialCompareImportChanged) {
        initialCompareImportMessage = `已从链接载入 ${restoredCompareSlots.length} 把球拍`;
      }
      if (initialCompareImportMessage) {
        setLiveMessage(initialCompareImportMessage);
      }
      if (initialCompareImportChanged && initialCompareImportMessage) {
        setCompareUndo({
          token: ++compareUndoTokenRef.current,
          kind: "import-link",
          beforeSlots: savedCompareSlots,
          afterSlots: restoredCompareSlots,
          message: initialCompareImportMessage,
          originElement: null,
          originFocus: null,
        });
      }
      compareSlotsRef.current = restoredCompareSlots;
      setCompareSlots(restoredCompareSlots);
      if (route.view === "compare" && initialCompareRouteState.duel && !preservingSavedCompare) {
        const duelSlot = restoredCompareSlots.find(({ slot }) => slot === 0);
        const opponentRacket = duelSlot ? deepRacketById.get(duelSlot.id) : undefined;
        if (opponentRacket && duelStateActive(restoredCompareSlots, opponentRacket.id)) {
          duelOpponentRef.current = opponentRacket.id;
          setDuelOpponentId(opponentRacket.id);
          setLiveMessage(`收到球拍对决：${opponentRacket.brand} ${opponentRacket.model}，选一把球拍应战`);
        }
      }
      const savedTourFilter: Tour = (storedTour ?? saved?.tourFilter) === "WTA" ? "WTA" : "ATP";
      applyTourFilterToState(route.view === "tour" ? parseTourRouteState(window.location.hash, "ATP", resolveTourPlayerRouteFilter).tour : savedTourFilter);
      const savedCatalogSource = storedCatalog ?? saved?.catalog;
      const savedCatalog = savedCatalogSource && typeof savedCatalogSource === "object" && !Array.isArray(savedCatalogSource)
        ? savedCatalogSource as Record<string, unknown>
        : null;
      const savedSessionVersion = storedCatalog !== null
        ? 3
        : typeof saved?.version === "number" ? saved.version : 1;
      const savedArmoryFilters = normalizeArmoryFilters({
        scope: typeof savedCatalog?.scope === "string" ? savedCatalog.scope : undefined,
        brand: typeof savedCatalog?.brand === "string" ? savedCatalog.brand : undefined,
        type: typeof savedCatalog?.type === "string" ? savedCatalog.type : undefined,
        generation: savedSessionVersion >= 3 && typeof savedCatalog?.generation === "string" ? savedCatalog.generation : undefined,
        releaseYear: savedSessionVersion >= 3
          ? typeof savedCatalog?.releaseYear === "string" ? savedCatalog.releaseYear : undefined
          : typeof savedCatalog?.generation === "string" ? savedCatalog.generation : undefined,
        search: typeof savedCatalog?.search === "string" ? savedCatalog.search : undefined,
        sort: typeof savedCatalog?.sort === "string" ? savedCatalog.sort : undefined,
      }, armoryFilterConfig);
      const initialArmoryFilters = route.view === "armory"
        ? parseArmoryRouteState(window.location.hash, armoryFilterConfig).filters
        : savedArmoryFilters;
      applyArmoryFiltersToState(initialArmoryFilters);
      setRecentRacketIds(normalizeRecentRackets(savedCatalog?.recents, (id) => deepRacketById.get(id)?.id ?? null));
    } catch {
      // A browser history or storage restriction falls back to the server-rendered defaults.
    }
    setSessionReady(true);
  }, [applyArmoryFiltersToState, applyTourFilterToState, duelStateActive, formatCurrentRoute, pushPaikuHistory, replacePaikuHistory]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const writeSessionDomain = useCallback((key: string, value: unknown) => {
    const serialized = serializeSessionDomain(value);
    let stored = false;
    for (const storageName of ["localStorage", "sessionStorage"] as const) {
      try {
        window[storageName].setItem(key, serialized);
        stored = true;
      } catch {
        // Session storage still preserves this tab when local storage is unavailable.
      }
    }
    return stored;
  }, []);

  const persistMatchSnapshot = useCallback((nextMatchFlow: typeof matchFlow) => {
    const serialized = serializeMatchFlow(nextMatchFlow);
    const signature = sessionValueSignature(serialized);
    if (persistedMatchSignatureRef.current === signature) return true;
    const stored = writeSessionDomain(SESSION_DOMAIN_STORAGE_KEYS.match, serialized);
    if (stored) persistedMatchSignatureRef.current = signature;
    return stored;
  }, [writeSessionDomain]);

  const persistCompareSnapshot = useCallback((nextCompareSlots: CompareSlots) => {
    const normalized = normalizeCompareSlots(nextCompareSlots);
    const signature = sessionValueSignature(normalized);
    if (persistedCompareSignatureRef.current === signature) return true;
    const stored = writeSessionDomain(SESSION_DOMAIN_STORAGE_KEYS.compare, normalized);
    if (stored) persistedCompareSignatureRef.current = signature;
    return stored;
  }, [writeSessionDomain]);

  const persistMatchJourneyLifecycle = useCallback((nextLifecycle: MatchJourneyLifecycle) => {
    matchJourneyLifecycleRef.current = nextLifecycle;
    const serialized = serializeMatchJourneyLifecycle(nextLifecycle, 100);
    let stored = false;
    for (const storageName of ["sessionStorage", "localStorage"] as const) {
      try {
        window[storageName].setItem(MATCH_JOURNEY_LIFECYCLE_STORAGE_KEY, serialized);
        stored = true;
      } catch {
        // The in-memory tombstone still protects this tab's browser history.
      }
    }
    return stored;
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    const saved = persistMatchSnapshot(matchFlow);
    const frame = window.requestAnimationFrame(() => setSessionPersistence(saved ? "available" : "memory-only"));
    return () => window.cancelAnimationFrame(frame);
  }, [sessionReady, matchFlow, persistMatchSnapshot]);

  useEffect(() => {
    if (!sessionReady) return;
    const saved = persistCompareSnapshot(compareSlots);
    const frame = window.requestAnimationFrame(() => setSessionPersistence(saved ? "available" : "memory-only"));
    return () => window.cancelAnimationFrame(frame);
  }, [sessionReady, compareSlots, persistCompareSnapshot]);

  useEffect(() => {
    if (!sessionReady) return;
    const saved = writeSessionDomain(SESSION_DOMAIN_STORAGE_KEYS.tour, tourFilter);
    const frame = window.requestAnimationFrame(() => setSessionPersistence(saved ? "available" : "memory-only"));
    return () => window.cancelAnimationFrame(frame);
  }, [sessionReady, tourFilter, writeSessionDomain]);

  useEffect(() => {
    if (!sessionReady) return;
    const saved = writeSessionDomain(SESSION_DOMAIN_STORAGE_KEYS.catalog, {
      scope: catalogScope,
      brand: catalogBrand,
      type: catalogType,
      generation: catalogGeneration,
      releaseYear: catalogReleaseYear,
      search: catalogSearch,
      sort: catalogSort,
      recents: recentRacketIds,
    });
    const frame = window.requestAnimationFrame(() => setSessionPersistence(saved ? "available" : "memory-only"));
    return () => window.cancelAnimationFrame(frame);
  }, [sessionReady, catalogScope, catalogBrand, catalogType, catalogGeneration, catalogReleaseYear, catalogSearch, catalogSort, recentRacketIds, writeSessionDomain]);

  useEffect(() => {
    if (!selectedId) return;
    const canonicalId = deepRacketById.get(selectedId)?.id;
    if (!canonicalId) return;
    const frame = window.requestAnimationFrame(() => setRecentRacketIds((current) => recordRecentRacket(current, canonicalId)));
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId]);

  useEffect(() => {
    if (!sessionReady || decisionHydratedRef.current) return;
    decisionHydratedRef.current = true;
    let stored: ReturnType<typeof parseStoredDecision>;
    let status: "available" | "memory-only" = "available";
    try {
      stored = parseStoredDecision(window.localStorage.getItem(DECISION_STORAGE_KEY));
    } catch {
      stored = parseStoredDecision(null);
      status = "memory-only";
    }
    const frame = window.requestAnimationFrame(() => {
      setSavedDecisionRoom(stored.room);
      setDecisionFeedback(stored.feedback);
      setPrescriptionBaselineId((current) => current || stored.room.baselineId || "");
      setDecisionCandidates((current) => ({
        ...Object.fromEntries(stored.room.slots.map((slot) => [slot.racketId, { status: slot.status, note: slot.note }])),
        ...current,
      }));
      setDecisionStorageStatus(status);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [sessionReady]);

  useEffect(() => {
    if (!sessionReady || decisionStorageStatus === "loading") return;
    let nextStatus: "available" | "memory-only" = "available";
    let room: DecisionRoomState | null = null;
    try {
      room = normalizeDecisionRoom(currentDecisionRoom);
      window.localStorage.setItem(DECISION_STORAGE_KEY, serializeStoredDecision({ room, feedback: decisionFeedback }));
    } catch {
      nextStatus = "memory-only";
    }
    const frame = window.requestAnimationFrame(() => {
      if (room) setSavedDecisionRoom(room);
      if (decisionStorageStatus !== nextStatus) setDecisionStorageStatus(nextStatus);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [sessionReady, decisionStorageStatus, currentDecisionRoom, decisionFeedback]);

  useEffect(() => {
    if (!sessionReady) return;
    const reconcileSharedCompare = () => {
      let stored: unknown | null = null;
      try {
        stored = parseSessionDomain(window.localStorage.getItem(SESSION_DOMAIN_STORAGE_KEYS.compare));
      } catch {
        return;
      }
      if (stored === null) return;
      const externalSlots = normalizeCompareSlots(stored).filter(({ id }) => deepRacketById.has(id));
      const signature = sessionValueSignature(externalSlots);
      if (signature === persistedCompareSignatureRef.current) return;
      persistedCompareSignatureRef.current = signature;
      try {
        window.sessionStorage.setItem(SESSION_DOMAIN_STORAGE_KEYS.compare, serializeSessionDomain(externalSlots));
      } catch {
        // The synchronized in-memory basket remains usable in this tab.
      }
      compareSlotsRef.current = externalSlots;
      setCompareSlots(externalSlots);
      setCompareUndo(null);
      setPendingCompareId(null);
      setLiveMessage(externalSlots.length > 0
        ? `另一窗口已更新球拍对比，当前 ${externalSlots.length}/3`
        : "另一窗口已清空球拍对比");
      if (activeViewRef.current === "compare") {
        pendingCompareFocusRef.current = externalSlots[0]?.id ?? "browse";
        const historyState = { ...((window.history.state as Record<string, unknown> | null) ?? {}) };
        delete historyState.paikuPendingCompareId;
        replacePaikuHistory(historyState, "", formatCompareRouteState(parseAppRoute(window.location.hash), externalSlots));
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== SESSION_DOMAIN_STORAGE_KEYS.compare) return;
      reconcileSharedCompare();
    };
    window.addEventListener("storage", handleStorage);
    // Close the small hydration-to-listener race: a different window may
    // have changed the shared basket after the layout read but before this
    // passive effect subscribed to storage events.
    reconcileSharedCompare();
    return () => window.removeEventListener("storage", handleStorage);
  }, [sessionReady, replacePaikuHistory]);

  useEffect(() => {
    const dialog = duelShare ? duelShareDialogRef.current : selected ? racketDialogRef.current : selectedFamily ? familyDialogRef.current : null;
    document.body.classList.toggle("app-locked", Boolean(dialog));
    if (!dialog) {
      if (!pendingDuelFocusRef.current) return;
      const focusFrame = window.requestAnimationFrame(() => {
        const target = duelReturnFocusRef.current;
        if (target?.isConnected) target.focus({ preventScroll: true });
        pendingDuelFocusRef.current = false;
        duelReturnFocusRef.current = null;
      });
      return () => window.cancelAnimationFrame(focusFrame);
    }

    const background = document.querySelectorAll<HTMLElement>(duelShare
      ? ".skip-link, .desktop-sidebar, .app-content, .mobile-tabbar, .compare-tray, .detail-backdrop"
      : ".skip-link, .desktop-sidebar, .app-content, .mobile-tabbar, .compare-tray");
    background.forEach((element) => element.setAttribute("inert", ""));
    const focusFrame = window.requestAnimationFrame(() => {
      if (duelShare) {
        dialog.querySelector<HTMLElement>("[data-dialog-close]")?.focus();
      } else if (pendingDuelFocusRef.current) {
        const target = duelReturnFocusRef.current;
        if (target?.isConnected) target.focus({ preventScroll: true });
        pendingDuelFocusRef.current = false;
        duelReturnFocusRef.current = null;
      } else if (selectedFamily) {
        const scrollArea = dialog.querySelector<HTMLElement>(".family-inspector__scroll");
        const matrixScrollArea = dialog.querySelector<HTMLElement>(".model-matrix__scroll");
        if (scrollArea) scrollArea.scrollTop = familyScrollTopRef.current;
        if (matrixScrollArea) matrixScrollArea.scrollLeft = familyMatrixScrollLeftRef.current;
        if (familyReturnRacketRef.current) {
          const returnButton = Array.from(dialog.querySelectorAll<HTMLButtonElement>("[data-racket-id]"))
            .find((button) => button.dataset.racketId === familyReturnRacketRef.current);
          if (familyTargetNeedsRevealRef.current) {
            returnButton?.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
            familyScrollTopRef.current = scrollArea?.scrollTop ?? familyScrollTopRef.current;
            familyMatrixScrollLeftRef.current = matrixScrollArea?.scrollLeft ?? familyMatrixScrollLeftRef.current;
            familyTargetNeedsRevealRef.current = false;
            const nextHistoryState = { ...((window.history.state as Record<string, unknown> | null) ?? {}) };
            delete nextHistoryState.paikuFamilyRevealTarget;
            nextHistoryState.paikuFamilyScrollTop = familyScrollTopRef.current;
            nextHistoryState.paikuFamilyMatrixScrollLeft = familyMatrixScrollLeftRef.current;
            replacePaikuHistory(nextHistoryState, "", window.location.href);
          }
          returnButton?.focus({ preventScroll: true });
          familyReturnRacketRef.current = null;
        } else {
          dialog.querySelector<HTMLElement>("[data-dialog-close]")?.focus();
        }
      } else {
        if (selected) {
          const scrollArea = dialog.querySelector<HTMLElement>(".racket-inspector__scroll");
          if (scrollArea) scrollArea.scrollTop = racketScrollTopRef.current;
        }
        dialog.querySelector<HTMLElement>("[data-dialog-close]")?.focus();
      }
    });

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTopOverlayRef.current();
        return;
      }

      if (event.key === "Tab") {
        const dialogFocusable = Array.from(dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )).filter((element) => !element.hasAttribute("hidden"));
        const focusable = dialogFocusable;
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.classList.remove("app-locked");
      background.forEach((element) => element.removeAttribute("inert"));
      window.removeEventListener("keydown", handleKey);
    };
  }, [duelShare, selected, selectedFamily, detailReturnFamilyId, replacePaikuHistory]);

  useEffect(() => {
    if (selected || selectedFamily || !pendingPageFocusRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      pendingPageFocusRef.current = false;
      restoreReturnFocus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selected, selectedFamily, restoreReturnFocus]);

  useEffect(() => {
    if (!pendingHistoryFocusRef.current) return;
    let innerFrame = 0;
    const outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        const identity = pendingHistoryFocusRef.current;
        pendingHistoryFocusRef.current = null;
        const target = resolveFocusIdentity(identity);
        if (target) {
          target.focus({ preventScroll: true });
          return;
        }
        const stableFallback = activeView === "discover"
          ? document.querySelector<HTMLElement>("[data-focus-key='discover-match-profile']")
          : activeView === "match"
            ? matchHeadingRef.current
            : null;
        (stableFallback ?? document.getElementById(`${activeView}-title`))?.focus({ preventScroll: true });
      });
    });
    return () => {
      window.cancelAnimationFrame(outerFrame);
      if (innerFrame) window.cancelAnimationFrame(innerFrame);
    };
  }, [activeView, selected, selectedFamily, matchStep, compareSlots, tourFilter, catalogBrand, catalogType, catalogGeneration, catalogReleaseYear, catalogSearch, catalogSort]);

  useEffect(() => {
    if (!pendingCompareReturnFocusRef.current) return;
    if (activeView === "compare" && !selected && !selectedFamily) return;
    let innerFrame = 0;
    const outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        const origin = pendingCompareReturnFocusRef.current;
        pendingCompareReturnFocusRef.current = null;
        pendingHistoryFocusRef.current = null;
        const target = canRestoreFocus(origin?.element ?? null) ? origin?.element ?? null : resolveFocusIdentity(origin?.identity ?? null);
        if (target) {
          target.focus({ preventScroll: true });
          return;
        }
        const dialog = selected ? racketDialogRef.current : selectedFamily ? familyDialogRef.current : null;
        (dialog?.querySelector<HTMLElement>("[data-dialog-close]") ?? document.getElementById(`${activeView}-title`))?.focus({ preventScroll: true });
      });
    });
    return () => {
      window.cancelAnimationFrame(outerFrame);
      if (innerFrame) window.cancelAnimationFrame(innerFrame);
    };
  }, [activeView, selected, selectedFamily]);

  useEffect(() => {
    const pageLabel = selected
      ? `${selected.model} 深度档案`
      : selectedFamily
        ? `${selectedFamily.brand} ${selectedFamily.family} 拍系`
        : activeView === "match"
          ? matchRouteNotice === "missing-result"
            ? "匹配结果恢复"
            : matchStep >= 3 ? "打法匹配结果" : `打法匹配 ${matchStep + 1}/3`
          : activeView === "armory"
            ? "球拍库"
            : activeView === "tour"
              ? `${tourFilter} 球星用拍`
              : activeView === "compare"
                ? `球拍对比${compared.length > 0 ? ` ${compared.length}/3` : ""}`
                : "发现";
    document.title = `${pageLabel}｜拍库`;
  }, [activeView, selected, selectedFamily, matchRouteNotice, matchStep, tourFilter, compared.length]);

  useEffect(() => {
    if (activeView !== "armory" || selected || selectedFamily) return;
    const frame = window.requestAnimationFrame(() => {
      const scroller = document.querySelector<HTMLElement>(".armory-view .brand-index__grid");
      const selectedBrand = scroller?.querySelector<HTMLElement>('button[aria-pressed="true"]');
      if (!scroller || !selectedBrand || scroller.scrollWidth <= scroller.clientWidth) return;
      const targetLeft = selectedBrand.offsetLeft - ((scroller.clientWidth - selectedBrand.offsetWidth) / 2);
      scroller.scrollTo({ left: Math.max(0, targetLeft), behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, selected, selectedFamily, catalogBrand]);

  useEffect(() => {
    if (selected || selectedFamily || pendingViewFocusRef.current !== activeView) return;
    const frame = window.requestAnimationFrame(() => {
      pendingViewFocusRef.current = null;
      document.getElementById(`${activeView}-title`)?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, selected, selectedFamily]);

  useEffect(() => {
    if (activeView !== "match" || !pendingMatchFocusRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      pendingMatchFocusRef.current = false;
      const heading = matchHeadingRef.current;
      if (!heading) return;
      heading.focus({ preventScroll: true });
      const bounds = heading.getBoundingClientRect();
      if (bounds.top < 12 || bounds.bottom > window.innerHeight - 12) {
        heading.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "center",
        });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, matchStep]);

  useEffect(() => {
    if (activeView !== "compare" || selected || selectedFamily || !pendingCompareFocusRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      const target = pendingCompareFocusRef.current;
      pendingCompareFocusRef.current = null;
      if (target === "undo") {
        undoButtonRef.current?.focus({ preventScroll: true });
        return;
      }
      if (target === "browse") {
        document.querySelector<HTMLElement>("[data-compare-browse]")?.focus({ preventScroll: true });
        return;
      }
      const button = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-compare-remove-id]"))
        .find((item) => item.dataset.compareRemoveId === target);
      button?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, selected, selectedFamily, compareSlots, compareUndo]);

  useEffect(() => {
    if (!liveMessage || toastPaused) return;
    if (actionableCompareUndo) return;
    const timer = window.setTimeout(() => {
      setLiveMessage("");
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [liveMessage, actionableCompareUndo, toastPaused]);

  const goToView = (view: AppView, scrollMode: "top" | "restore" = "top", historyMode: "push" | "replace" = "push") => {
    setPreviewPriority(null);
    const currentRoute = parseAppRoute(window.location.hash);
    const sameView = activeView === view && !currentRoute.familyId && !currentRoute.racketId;
    if (activeView === "armory" && view !== "armory" && compareBrowseReturnRef.current) {
      const currentState = { ...((window.history.state as Record<string, unknown> | null) ?? {}) };
      delete currentState.paikuCompareBrowseReturn;
      replacePaikuHistory(currentState, "", window.location.href);
    }
    if (!sameView) snapshotCurrentHistoryEntry();
    const trigger = document.activeElement as HTMLElement | null;
    const persistentNavigation = Boolean(trigger?.closest(".desktop-sidebar, .mobile-tabbar"));
    pendingViewFocusRef.current = !sameView && !persistentNavigation ? view : null;
    if (!sameView && view === "match") {
      pendingViewFocusRef.current = null;
      pendingMatchFocusRef.current = true;
    }
    pendingHistoryFocusRef.current = null;
    if (view !== "armory") compareBrowseReturnRef.current = false;
    const currentHistoryState = window.history.state as PaikuHistoryState | null;
    let targetMatchFlow = matchFlow;
    if (view === "match" && matchScreen.kind === "idle") {
      const historyJourneyId = currentHistoryState?.paikuMatchJourneyId;
      const journeyId = historyJourneyId && !findSettledMatchJourney(matchJourneyLifecycleRef.current, historyJourneyId)
        ? historyJourneyId
        : makeMatchJourneyId();
      targetMatchFlow = beginMatchDraft(matchFlow, 0, journeyId);
    } else if (view === "match" && matchFlow.draft) {
      const existingJourneyId = matchFlow.draft.journeyId ?? currentHistoryState?.paikuMatchJourneyId;
      if (!existingJourneyId || findSettledMatchJourney(matchJourneyLifecycleRef.current, existingJourneyId)) {
        targetMatchFlow = assignMatchDraftJourney(matchFlow, makeMatchJourneyId());
      }
    }
    const targetMatchScreen = snapshotMatchScreen(targetMatchFlow);
    const targetMatchStep = targetMatchScreen.kind === "result" ? 3 : targetMatchScreen.kind === "question" ? targetMatchScreen.draft.step : 0;
    if (targetMatchFlow !== matchFlow) {
      matchFlowRef.current = targetMatchFlow;
      setMatchFlow(targetMatchFlow);
      const saved = persistMatchSnapshot(targetMatchFlow);
      setSessionPersistence(saved ? "available" : "memory-only");
      if (!saved && view === "match") {
        setLiveMessage("当前浏览器无法持久保存；本次匹配刷新后可能丢失");
      }
    }
    const matchJourneyId = view === "match" && targetMatchScreen.kind === "question"
      ? targetMatchScreen.draft.journeyId
      : undefined;
    const draftJourneyId = targetMatchScreen.kind === "question" ? targetMatchScreen.draft.journeyId : undefined;
    const continuingJourney = Boolean(
      draftJourneyId
      && currentHistoryState?.paikuMatchJourneyId === draftJourneyId
      && currentHistoryState.paikuMatchOrigin,
    );
    const matchOrigin = !sameView && matchJourneyId
      ? continuingJourney
        ? currentHistoryState?.paikuMatchOrigin
        : captureMatchOrigin()
      : undefined;
    const carriedJourneyOrigin = continuingJourney
      ? currentHistoryState?.paikuMatchOrigin
      : matchOrigin;
    const carriedJourneyDepth = draftJourneyId && carriedJourneyOrigin
      ? continuingJourney
        ? Math.max(0, currentHistoryState?.paikuMatchJourneyDepth ?? 0) + 1
        : 1
      : undefined;
    viewScrollPositionsRef.current[activeView] = window.scrollY;
    setSelectedId(null);
    setSelectedFamilyId(null);
    setFamilyTargetRacketId(null);
    setDetailReturnFamilyId(null);
    familyReturnRacketRef.current = null;
    pendingPageFocusRef.current = false;
    if (view !== "compare") setPendingCompareId(null);
    setActiveView(view);
    activeViewRef.current = view;
    const nextRoute: AppRoute = view === "match"
      ? { view, matchStep: targetMatchStep }
      : { view };
    lastRouteRef.current = nextRoute;
    const targetTop = sameView ? 0 : scrollMode === "restore" ? viewScrollPositionsRef.current[view] : 0;
    if (!sameView) {
      const nextHistoryState = {
        paiku: true,
        paikuOverlayPushed: false,
        paikuMatchPushed: false,
        paikuViewScrollTop: targetTop,
        ...(view === "armory" ? { paikuCatalogResultLimit: catalogResultLimitRef.current } : {}),
        ...(view === "match" ? { paikuMatchScreen: targetMatchScreen } : {}),
        ...(draftJourneyId && carriedJourneyOrigin ? {
          paikuMatchJourneyId: draftJourneyId,
          paikuMatchJourneyDepth: carriedJourneyDepth,
          paikuMatchOrigin: carriedJourneyOrigin,
        } : {}),
      };
      if (historyMode === "replace") replacePaikuHistory(nextHistoryState, "", formatCurrentRoute(nextRoute));
      else pushPaikuHistory(nextHistoryState, "", formatCurrentRoute(nextRoute));
    }
    const behavior = sameView && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto";
    window.requestAnimationFrame(() => window.scrollTo({ top: targetTop, behavior }));
  };

  const persistFamilyScroll = (scrollTop: number) => {
    familyScrollTopRef.current = scrollTop;
    queueOverlayHistoryPatch({
      paikuFamilyScrollTop: scrollTop,
      ...(familyTargetRacketId ? { paikuFamilyTargetId: familyTargetRacketId } : {}),
    });
  };

  const persistFamilyMatrixScroll = (scrollLeft: number) => {
    familyMatrixScrollLeftRef.current = scrollLeft;
    queueOverlayHistoryPatch({
      paikuFamilyMatrixScrollLeft: scrollLeft,
    });
  };

  const persistRacketScroll = (scrollTop: number) => {
    racketScrollTopRef.current = scrollTop;
    queueOverlayHistoryPatch({
      paikuRacketScrollTop: scrollTop,
    });
  };

  const recentRackets = useMemo(
    () => recentRacketIds.map((id) => deepRacketById.get(id)).filter((racket): racket is Racket => Boolean(racket)),
    [recentRacketIds],
  );

  const focusRecentShelfAnchor = () => {
    window.requestAnimationFrame(() => {
      const anchor = document.getElementById("recent-shelf-title") ?? document.getElementById("main-content");
      anchor?.focus();
    });
  };

  const removeRecent = (id: string) => {
    const racket = deepRacketById.get(id);
    const currentIndex = recentRacketIds.indexOf(id);
    const nextFocusId = recentRacketIds[currentIndex + 1] ?? recentRacketIds[currentIndex - 1] ?? null;
    setRecentRacketIds((current) => removeRecentRacket(current, id));
    setLiveMessage(racket ? `已从最近看过移除 ${racket.brand} ${racket.model}` : "已从最近看过移除该球拍");
    window.requestAnimationFrame(() => {
      if (nextFocusId) {
        document.querySelector<HTMLElement>(`[data-focus-key="recent-open-${nextFocusId}"]`)?.focus();
        return;
      }
      focusRecentShelfAnchor();
    });
  };

  const clearRecentRackets = () => {
    if (recentRacketIds.length === 0) return;
    setRecentRacketIds([]);
    setLiveMessage("已清空最近看过");
    focusRecentShelfAnchor();
  };

  const openRacket = (id: string) => {
    if (!deepRacketById.has(id)) return;
    snapshotCurrentHistoryEntry();
    const returnFamilyId = selectedFamilyId;
    if (returnFamilyId) {
      familyScrollTopRef.current = familyDialogRef.current?.querySelector<HTMLElement>(".family-inspector__scroll")?.scrollTop ?? 0;
      familyMatrixScrollLeftRef.current = familyDialogRef.current?.querySelector<HTMLElement>(".model-matrix__scroll")?.scrollLeft ?? 0;
      familyReturnRacketRef.current = id;
      setFamilyTargetRacketId(id);
      replacePaikuHistory({
        ...((window.history.state as Record<string, unknown> | null) ?? {}),
        paikuFamilyTargetId: id,
        paikuFamilyScrollTop: familyScrollTopRef.current,
        paikuFamilyMatrixScrollLeft: familyMatrixScrollLeftRef.current,
      }, "", window.location.href);
    } else {
      rememberReturnFocus();
      familyReturnRacketRef.current = null;
    }
    racketScrollTopRef.current = 0;
    setDetailReturnFamilyId(returnFamilyId);
    setSelectedFamilyId(null);
    setSelectedId(id);
    const route: AppRoute = { view: activeView, ...(returnFamilyId ? { familyId: returnFamilyId } : {}), racketId: id };
    const overlayMatchScreen = activeView === "match" ? snapshotMatchScreen(matchFlowRef.current) : undefined;
    const overlayHistoryState = window.history.state as PaikuHistoryState | null;
    const activeDraftJourneyId = matchFlowRef.current.draft?.journeyId;
    const overlayJourneyId = overlayMatchScreen?.kind === "question"
      ? overlayMatchScreen.draft.journeyId
      : activeDraftJourneyId && overlayHistoryState?.paikuMatchJourneyId === activeDraftJourneyId
        ? activeDraftJourneyId
        : undefined;
    const overlayJourneyDepth = typeof overlayHistoryState?.paikuMatchJourneyDepth === "number" ? overlayHistoryState.paikuMatchJourneyDepth + 1 : undefined;
    lastRouteRef.current = route;
    pushPaikuHistory({
      paiku: true,
      paikuOverlayPushed: true,
      paikuRacketScrollTop: 0,
      paikuViewScrollTop: window.scrollY,
      ...(activeView === "armory" && compareBrowseReturnRef.current ? { paikuCompareBrowseReturn: true } : {}),
      ...(overlayMatchScreen ? { paikuMatchScreen: overlayMatchScreen } : {}),
      ...(overlayJourneyId ? { paikuMatchJourneyId: overlayJourneyId } : {}),
      ...(typeof overlayJourneyDepth === "number" ? { paikuMatchJourneyDepth: overlayJourneyDepth } : {}),
      ...(overlayHistoryState?.paikuMatchOrigin ? { paikuMatchOrigin: overlayHistoryState.paikuMatchOrigin } : {}),
      ...(returnFamilyId ? { paikuFamilyTargetId: id, paikuFamilyScrollTop: familyScrollTopRef.current, paikuFamilyMatrixScrollLeft: familyMatrixScrollLeftRef.current } : {}),
    }, "", formatCurrentRoute(route));
  };

  const openFamily = (id: string, targetRacketId?: string) => {
    if (!catalogFamilyById.has(id)) return;
    snapshotCurrentHistoryEntry();
    if (!selectedId) rememberReturnFocus();
    familyReturnRacketRef.current = targetRacketId ?? null;
    familyTargetNeedsRevealRef.current = Boolean(targetRacketId);
    familyScrollTopRef.current = 0;
    familyMatrixScrollLeftRef.current = 0;
    setFamilyTargetRacketId(targetRacketId ?? null);
    setSelectedId(null);
    setDetailReturnFamilyId(null);
    setSelectedFamilyId(id);
    const route: AppRoute = { view: activeView, familyId: id };
    const overlayMatchScreen = activeView === "match" ? snapshotMatchScreen(matchFlowRef.current) : undefined;
    const overlayHistoryState = window.history.state as PaikuHistoryState | null;
    const activeDraftJourneyId = matchFlowRef.current.draft?.journeyId;
    const overlayJourneyId = overlayMatchScreen?.kind === "question"
      ? overlayMatchScreen.draft.journeyId
      : activeDraftJourneyId && overlayHistoryState?.paikuMatchJourneyId === activeDraftJourneyId
        ? activeDraftJourneyId
        : undefined;
    const overlayJourneyDepth = typeof overlayHistoryState?.paikuMatchJourneyDepth === "number" ? overlayHistoryState.paikuMatchJourneyDepth + 1 : undefined;
    lastRouteRef.current = route;
    pushPaikuHistory({
      paiku: true,
      paikuOverlayPushed: true,
      paikuFamilyScrollTop: 0,
      paikuFamilyMatrixScrollLeft: 0,
      paikuViewScrollTop: window.scrollY,
      ...(activeView === "armory" && compareBrowseReturnRef.current ? { paikuCompareBrowseReturn: true } : {}),
      ...(overlayMatchScreen ? { paikuMatchScreen: overlayMatchScreen } : {}),
      ...(overlayJourneyId ? { paikuMatchJourneyId: overlayJourneyId } : {}),
      ...(typeof overlayJourneyDepth === "number" ? { paikuMatchJourneyDepth: overlayJourneyDepth } : {}),
      ...(overlayHistoryState?.paikuMatchOrigin ? { paikuMatchOrigin: overlayHistoryState.paikuMatchOrigin } : {}),
      ...(targetRacketId ? { paikuFamilyTargetId: targetRacketId, paikuFamilyRevealTarget: true } : {}),
    }, "", formatCurrentRoute(route));
  };

  const closeDetail = () => {
    flushOverlayHistoryPatch();
    const currentRoute = parseAppRoute(window.location.hash);
    const parentRoute = parentAppRoute(currentRoute);
    const state = window.history.state as PaikuHistoryState | null;
    pendingPageFocusRef.current = !parentRoute.familyId;
    if (state?.paikuOverlayPushed) {
      window.history.back();
      return;
    }
    replacePaikuHistory({
      ...((state as Record<string, unknown> | null) ?? {}),
      paiku: true,
      paikuOverlayPushed: Boolean(parentRoute.familyId),
      ...(parentRoute.familyId ? {
        paikuFamilyTargetId: currentRoute.racketId,
        paikuFamilyScrollTop: familyScrollTopRef.current,
        paikuFamilyMatrixScrollLeft: familyMatrixScrollLeftRef.current,
      } : {}),
    }, "", formatCurrentRoute(parentRoute));
    lastRouteRef.current = parentRoute;
    setSelectedId(null);
    setSelectedFamilyId(parentRoute.familyId ?? null);
    setDetailReturnFamilyId(null);
  };

  const closeFamily = () => {
    flushOverlayHistoryPatch();
    const parentRoute: AppRoute = { view: activeView };
    const state = window.history.state as PaikuHistoryState | null;
    familyReturnRacketRef.current = null;
    setFamilyTargetRacketId(null);
    pendingPageFocusRef.current = true;
    if (state?.paikuOverlayPushed) {
      window.history.back();
      return;
    }
    const nextState: PaikuHistoryState & Record<string, unknown> = { ...((state as Record<string, unknown> | null) ?? {}), paiku: true, paikuOverlayPushed: false };
    delete nextState.paikuFamilyTargetId;
    delete nextState.paikuFamilyScrollTop;
    delete nextState.paikuFamilyMatrixScrollLeft;
    delete nextState.paikuFamilyRevealTarget;
    replacePaikuHistory(nextState, "", formatCurrentRoute(parentRoute));
    lastRouteRef.current = parentRoute;
    setSelectedFamilyId(null);
  };

  const dismissDuelShare = () => {
    pendingDuelFocusRef.current = true;
    if ((window.history.state as Record<string, unknown> | null)?.paikuDuelShare) {
      window.history.back();
      return;
    }
    duelShareRef.current = null;
    setDuelShare(null);
  };

  useEffect(() => {
    closeTopOverlayRef.current = duelShare ? dismissDuelShare : selected ? closeDetail : selectedFamily ? closeFamily : () => undefined;
  });

  const commitCompareSlots = (nextSlots: CompareSlots, kind: CompareUndo["kind"], message: string) => {
    const beforeSlots = normalizeCompareSlots(compareSlots);
    const afterSlots = normalizeCompareSlots(nextSlots);
    const token = ++compareUndoTokenRef.current;
    const originElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originFocus = captureFocusIdentity(originElement);
    compareSlotsRef.current = afterSlots;
    setCompareSlots(afterSlots);
    if (feedbackRacketId && !afterSlots.some(({ id }) => id === feedbackRacketId)) {
      trialFeedbackTriggerRef.current = null;
      setFeedbackRacketId(null);
      setTrialFeedbackDraft(emptyTrialFeedbackDraft);
    }
    const duelWasActive = duelStateActive(beforeSlots, duelOpponentRef.current);
    const duelStillActive = duelStateActive(afterSlots, duelOpponentRef.current);
    let duelExitNote = "";
    if (duelWasActive && !duelStillActive) {
      duelOpponentRef.current = null;
      setDuelOpponentId(null);
      duelExitNote = afterSlots.length > 2 ? "；对决仅限 1v1，已退出对决模式" : "；已退出对决模式";
    } else if (!duelStillActive && duelOpponentRef.current) {
      duelOpponentRef.current = null;
      setDuelOpponentId(null);
    }
    const saved = persistCompareSnapshot(afterSlots);
    setSessionPersistence(saved ? "available" : "memory-only");
    const announcedMessage = saved
      ? `${message}${duelExitNote}`
      : `${message}${duelExitNote}；当前浏览器无法持久保存，关闭页面后可能丢失`;
    setPendingCompareId(null);
    setCompareUndo({ token, kind, beforeSlots, afterSlots, message: announcedMessage, originElement, originFocus });
    setLiveMessage(announcedMessage);
    if (kind === "replace") pendingCompareOriginRef.current = null;
    const nextHistoryState = { ...((window.history.state as Record<string, unknown> | null) ?? {}) };
    const hadPendingCompare = Boolean(nextHistoryState.paikuPendingCompareId);
    if (hadPendingCompare) {
      delete nextHistoryState.paikuPendingCompareId;
    }
    if (activeViewRef.current === "compare" || hadPendingCompare) {
      const route = parseAppRoute(window.location.hash);
      const url = route.view === "compare"
        ? formatCompareRouteState(route, afterSlots, { duel: duelStillActive })
        : window.location.href;
      replacePaikuHistory(nextHistoryState, "", url);
    }
  };

  const toggleCompare = (id: string) => {
    const racket = deepRacketById.get(id);
    const change = compareIds.includes(id) ? removeCompareId(compareSlots, id) : addCompareId(compareSlots, id);
    if (change.action === "removed") {
      if (activeView === "compare") {
        const nextSlot = change.slots.find(({ slot }) => change.slot !== null && slot >= change.slot)
          ?? change.slots.at(-1);
        pendingCompareFocusRef.current = nextSlot?.id ?? "undo";
      }
      commitCompareSlots(change.slots, "remove", `${racket?.model ?? "球拍"} 已移出对比`);
      return;
    }
    if (change.action === "full") {
      setCompareUndo(null);
      setLiveMessage("最多同时对比三把球拍，请先移除一把");
      return;
    }
    if (change.action === "added") {
      const shouldReturnToCompare = activeView === "armory" && compareBrowseReturnRef.current;
      if (activeView === "compare" || shouldReturnToCompare) pendingCompareFocusRef.current = id;
      commitCompareSlots(change.slots, "add", `${racket?.model ?? "球拍"} 已加入对比，当前 ${change.slots.length}/3`);
      if (shouldReturnToCompare) {
        compareBrowseReturnRef.current = false;
        goToView("compare");
        pendingViewFocusRef.current = null;
      }
    }
  };

  const requestCompare = (id: string) => {
    if (!compareIds.includes(id) && compareIds.length >= 3) {
      const originElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      pendingCompareOriginRef.current = { element: originElement, identity: captureFocusIdentity(originElement) };
      setCompareUndo(null);
      setPendingCompareId(id);
      setLiveMessage(`对比已满，请选择一把换成 ${deepRacketById.get(id)?.model ?? "目标球拍"}`);
      goToView("compare");
      replacePaikuHistory({ ...(window.history.state ?? {}), paikuPendingCompareId: id }, "", window.location.href);
      return;
    }
    toggleCompare(id);
  };

  const replacePendingCompare = (victimId: string) => {
    if (!pendingCompareRacket) return;
    const victim = deepRacketById.get(victimId);
    const change = replaceCompareId(compareSlots, victimId, pendingCompareRacket.id);
    if (change.action !== "replaced") return;
    pendingCompareFocusRef.current = pendingCompareRacket.id;
    commitCompareSlots(change.slots, "replace", `已用 ${pendingCompareRacket.model} 替换 ${victim?.model ?? "原球拍"}`);
  };

  const cancelPendingCompare = () => {
    const historyState = { ...((window.history.state as Record<string, unknown> | null) ?? {}) };
    delete historyState.paikuPendingCompareId;
    replacePaikuHistory(historyState, "", window.location.href);
    setPendingCompareId(null);
    setCompareUndo(null);
    setLiveMessage("已取消本次替换");
    pendingCompareReturnFocusRef.current = pendingCompareOriginRef.current;
    pendingCompareOriginRef.current = null;
    pendingViewFocusRef.current = null;
    window.history.back();
  };

  const clearComparison = () => {
    if (compareIds.length === 0) return;
    pendingCompareFocusRef.current = "undo";
    commitCompareSlots([], "clear", `已清空 ${compareIds.length} 把决策候选`);
  };

  const changePrescriptionBaseline = (id: string) => {
    const normalizedId = id && deepRacketById.has(id) ? id : "";
    setPrescriptionBaselineId(normalizedId);
    if (normalizedId && compareIds.includes(normalizedId)) {
      const change = removeCompareId(compareSlots, normalizedId);
      commitCompareSlots(change.slots, "remove", "当前球拍已设为处方基准，并从候选中移出");
      return;
    }
    setLiveMessage(normalizedId
      ? `已用 ${deepRacketById.get(normalizedId)?.model ?? "当前球拍"} 作为换拍基准`
      : "已切换为无当前球拍的通用处方");
  };

  const undoCompareChange = () => {
    if (!compareUndo) return;
    const restored = applyCompareUndo(compareSlots, { before: compareUndo.beforeSlots, after: compareUndo.afterSlots });
    if (!restored) {
      setCompareUndo(null);
      return;
    }
    const safeRestored = restored.filter(({ id }) => deepRacketById.has(id));
    compareSlotsRef.current = safeRestored;
    setCompareSlots(safeRestored);
    const saved = persistCompareSnapshot(safeRestored);
    setSessionPersistence(saved ? "available" : "memory-only");
    const beforeBySlot = new Map(compareUndo.beforeSlots.map((entry) => [entry.slot, entry.id]));
    const afterBySlot = new Map(compareUndo.afterSlots.map((entry) => [entry.slot, entry.id]));
    const changedSlot = ([0, 1, 2] as const).find((slot) => beforeBySlot.get(slot) !== afterBySlot.get(slot));
    const exactRestored = changedSlot === undefined ? undefined : safeRestored.find((entry) => entry.slot === changedSlot);
    const nearestRestored = changedSlot === undefined
      ? safeRestored[0]
      : [...safeRestored].sort((a, b) => Math.abs(a.slot - changedSlot) - Math.abs(b.slot - changedSlot))[0];
    const onCompareBase = activeView === "compare" && !selected && !selectedFamily;
    if (onCompareBase) {
      pendingCompareFocusRef.current = exactRestored?.id ?? nearestRestored?.id ?? "browse";
    } else {
      pendingCompareFocusRef.current = null;
    }
    setPendingCompareId(null);
    setLiveMessage(saved
      ? "已撤销上一项对比操作"
      : "已撤销上一项对比操作；当前浏览器无法持久保存，关闭页面后可能丢失");
    setCompareUndo(null);
    if (activeViewRef.current === "compare") {
      const historyState = { ...((window.history.state as Record<string, unknown> | null) ?? {}) };
      delete historyState.paikuPendingCompareId;
      replacePaikuHistory(historyState, "", formatCompareRouteState(parseAppRoute(window.location.hash), safeRestored));
    }
    const originElement = compareUndo.originElement;
    const originFocus = compareUndo.originFocus;
    if (onCompareBase) return;
    window.requestAnimationFrame(() => {
      const origin = canRestoreFocus(originElement) ? originElement : resolveFocusIdentity(originFocus);
      if (origin) {
        origin.focus({ preventScroll: true });
        return;
      }
      if (selected || selectedFamily) {
        const dialog = selected ? racketDialogRef.current : familyDialogRef.current;
        dialog?.querySelector<HTMLElement>("[data-dialog-close]")?.focus({ preventScroll: true });
        return;
      }
      if (activeView !== "compare") document.getElementById(`${activeView}-title`)?.focus({ preventScroll: true });
    });
  };
  useEffect(() => {
    undoCompareChangeRef.current = undoCompareChange;
  });

  useEffect(() => {
    if (!actionableCompareUndo) return;
    const handleUndoShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== "z") return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable)) return;
      event.preventDefault();
      undoCompareChangeRef.current();
    };
    window.addEventListener("keydown", handleUndoShortcut);
    return () => window.removeEventListener("keydown", handleUndoShortcut);
  }, [actionableCompareUndo]);

  const commitArmoryFilters = (patch: Partial<ArmoryFilterState>, historyMode: "push" | "replace" = "push") => {
    const next = normalizeArmoryFilters({ ...armoryFiltersRef.current, ...patch }, armoryFilterConfig);
    if (typeof patch.search === "string") {
      next.search = patch.search.includes("\uFFFD") ? "" : patch.search.slice(0, armoryFilterConfig.maxSearchLength);
    }
    const current = armoryFiltersRef.current;
    const changed = current.scope !== next.scope
      || current.brand !== next.brand
      || current.type !== next.type
      || current.generation !== next.generation
      || current.releaseYear !== next.releaseYear
      || current.search !== next.search
      || current.sort !== next.sort;
    if (!changed) return next;

    catalogResultLimitRef.current = 24;
    setCatalogResultLimit(24);
    if (activeViewRef.current === "armory" && historyMode === "push") snapshotCurrentHistoryEntry();
    applyArmoryFiltersToState(next);

    if (activeViewRef.current === "armory") {
      const route = parseAppRoute(window.location.hash);
      const hash = formatCurrentRoute(route, next);
      if (window.location.hash !== hash) {
        const state = {
          ...((window.history.state as Record<string, unknown> | null) ?? {}),
          paiku: true,
          paikuViewScrollTop: window.scrollY,
          paikuCatalogResultLimit: 24,
          paikuFocus: captureFocusIdentity(document.activeElement instanceof HTMLElement ? document.activeElement : null) ?? undefined,
        };
        if (historyMode === "push") pushPaikuHistory(state, "", hash);
        else replacePaikuHistory(state, "", hash);
        lastRouteRef.current = route;
      }
    }
    return next;
  };

  const clearCatalogFilters = (focusSearch = false) => {
    commitArmoryFilters({ ...armoryFilterConfig.defaults, scope: armoryFiltersRef.current.scope });
    if (focusSearch) {
      window.requestAnimationFrame(() => catalogSearchRef.current?.focus({ preventScroll: true }));
    }
  };

  const clearCatalogSearch = () => {
    commitArmoryFilters({ search: "" });
    window.requestAnimationFrame(() => catalogSearchRef.current?.focus({ preventScroll: true }));
  };

  const submitCatalogSearch = () => {
    if (!catalogSearch.trim()) return;
    catalogSearchRef.current?.blur();
    window.requestAnimationFrame(() => {
      catalogSummaryRef.current?.focus({ preventScroll: true });
      catalogSummaryRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
    });
  };

  const updateCatalogSearch = (search: string) => {
    commitArmoryFilters({ search }, catalogSearchHistoryMode(catalogSearch, search));
  };

  const clearCatalogFacets = () => {
    commitArmoryFilters({ brand: "全部", type: "全部", generation: "全部代际", releaseYear: "全部年份" });
    window.requestAnimationFrame(() => catalogSummaryRef.current?.focus({ preventScroll: true }));
  };

  const copyArmoryLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLiveMessage("已复制当前拍库视图链接");
    } catch {
      setLiveMessage("浏览器未允许复制，请直接复制地址栏链接");
    }
  };

  useEffect(() => {
    if (!tourPlayerLanding) return;
    const frame = window.requestAnimationFrame(() => {
      const card = document.getElementById(`tour-player-${tourPlayerLanding.id}`);
      if (!card) return;
      card.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      card.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tourPlayerLanding]);

  const openTourPlayer = (playerId: string) => {
    const player = tourPlayerById.get(playerId);
    if (!player) return;
    snapshotCurrentHistoryEntry();
    setPreviewPriority(null);
    viewScrollPositionsRef.current[activeViewRef.current] = window.scrollY;
    pendingViewFocusRef.current = null;
    pendingHistoryFocusRef.current = null;
    pendingPageFocusRef.current = false;
    setSelectedId(null);
    setSelectedFamilyId(null);
    setFamilyTargetRacketId(null);
    setDetailReturnFamilyId(null);
    familyReturnRacketRef.current = null;
    applyTourFilterToState(player.tour);
    setActiveView("tour");
    activeViewRef.current = "tour";
    const route: AppRoute = { view: "tour", playerId: player.id };
    lastRouteRef.current = route;
    pushPaikuHistory({ paiku: true, paikuOverlayPushed: false, paikuMatchPushed: false, paikuViewScrollTop: 0 }, "", formatCurrentRoute(route));
    setTourPlayerLanding({ id: player.id, token: ++tourLandingTokenRef.current });
    setLiveMessage(`已定位到 ${player.nameZh} 的球星卡`);
  };

  const copyTourLink = async () => {
    const url = new URL(window.location.href);
    url.hash = formatTourRouteState({ view: "tour" }, tourFilterRef.current);
    try {
      await navigator.clipboard.writeText(url.href);
      setLiveMessage(`已复制 ${tourFilterRef.current} 榜单链接`);
    } catch {
      setLiveMessage("浏览器未允许复制，请直接复制地址栏链接");
    }
  };

  const copyTourPlayerLink = async (player: TourPlayer) => {
    const url = new URL(window.location.href);
    url.hash = formatTourRouteState({ view: "tour", playerId: player.id }, player.tour);
    try {
      await navigator.clipboard.writeText(url.href);
      setLiveMessage(`已复制 ${player.nameZh} 的球星档案链接`);
    } catch {
      setLiveMessage("浏览器未允许复制，请直接复制地址栏链接");
    }
  };

  const startDuel = (id: string) => {
    const racket = deepRacketById.get(id);
    if (!racket) return;
    duelReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pendingDuelFocusRef.current = false;
    const url = new URL(window.location.href);
    url.hash = formatCompareRouteState({ view: "compare" }, [{ slot: 0, id: racket.id }], { duel: true });
    const shareState = { racketId: racket.id, racketName: racket.model, url: url.href };
    setDuelShareNotice("");
    duelShareRef.current = shareState;
    pushPaikuHistory({ ...((window.history.state as Record<string, unknown> | null) ?? {}), paikuDuelShare: true }, "", window.location.href);
    setDuelShare(shareState);
  };

  const copyDuelLink = async () => {
    if (!duelShare) return;
    try {
      await navigator.clipboard.writeText(duelShare.url);
      setDuelShareNotice("链接已复制，可以直接发给朋友应战。");
      setLiveMessage("已复制对决链接，发给朋友选拍应战");
    } catch {
      duelLinkInputRef.current?.focus();
      duelLinkInputRef.current?.select();
      setDuelShareNotice("浏览器未允许自动复制，链接已为你选中。");
      setLiveMessage("链接已选中，请手动复制");
    }
  };

  const shareDuelLink = async () => {
    if (!duelShare || typeof navigator.share !== "function") {
      await copyDuelLink();
      return;
    }
    try {
      await navigator.share({ title: `${duelShare.racketName} 球拍对决`, text: `我用 ${duelShare.racketName} 守擂，选一把球拍来应战。`, url: duelShare.url });
      setDuelShareNotice("系统分享已打开；分享完成后可以回到这里继续。");
      setLiveMessage("对决邀请已打开系统分享");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyDuelLink();
    }
  };

  const previewDuel = () => {
    if (!duelShare) return;
    const racket = deepRacketById.get(duelShare.racketId);
    if (!racket) return;
    const slots: CompareSlots = [{ slot: 0, id: racket.id }];
    duelOpponentRef.current = racket.id;
    setDuelOpponentId(racket.id);
    setComparePanel("overview");
    commitCompareSlots(slots, "load-recommended", `已用 ${racket.model} 建立好友对决`);
    pendingDuelFocusRef.current = false;
    duelReturnFocusRef.current = null;
    duelShareRef.current = null;
    const historyState = { ...((window.history.state as Record<string, unknown> | null) ?? {}) };
    delete historyState.paikuDuelShare;
    replacePaikuHistory(historyState, "", window.location.href);
    setDuelShare(null);
    goToView("compare", "top", "replace");
  };

  const startPairCompare = (baseId: string, candidateId: string) => {
    const base = deepRacketById.get(baseId);
    const candidate = deepRacketById.get(candidateId);
    if (!base || !candidate) return;
    const slots = addCompareId(addCompareId([], base.id).slots, candidate.id).slots;
    duelOpponentRef.current = null;
    setDuelOpponentId(null);
    setComparePanel("overview");
    commitCompareSlots(slots, "load-recommended", `已建立 ${base.model} 与 ${candidate.model} 的双拍对比`);
    goToView("compare");
  };

  const jumpDossierSection = (section: "overview" | "specs" | "radar" | "similar") => {
    const target = racketDialogRef.current?.querySelector<HTMLElement>(`#dossier-${section}`);
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    target.focus({ preventScroll: true });
  };

  const copyCompareLink = async () => {
    const url = new URL(window.location.href);
    url.hash = formatCompareRouteState({ view: "compare" }, compareSlotsRef.current);
    try {
      await navigator.clipboard.writeText(url.href);
      setLiveMessage(`已复制 ${compareIds.length} 把候选球拍的决策链接`);
    } catch {
      setLiveMessage("浏览器未允许复制，请直接复制地址栏链接");
    }
  };

  const updateDecisionCandidateStatus = (racketId: string, status: DecisionCandidateStatus) => {
    if (!compareIds.includes(racketId)) return;
    setDecisionCandidates((current) => {
      const next = { ...current };
      if (status === "final") {
        for (const id of compareIds) {
          if (id !== racketId && next[id]?.status === "final") next[id] = { ...next[id], status: "candidate" };
        }
      }
      next[racketId] = { status, note: next[racketId]?.note ?? "" };
      return next;
    });
    setLiveMessage(`${deepRacketById.get(racketId)?.model ?? "候选球拍"} 已标记为${decisionStatusLabels[status]}`);
  };

  const updateDecisionCandidateNote = (racketId: string, note: string) => {
    if (!compareIds.includes(racketId)) return;
    setDecisionCandidates((current) => ({
      ...current,
      [racketId]: {
        status: current[racketId]?.status ?? "candidate",
        note: note.slice(0, 120),
      },
    }));
  };

  const loadSavedDecision = () => {
    if (!savedDecisionRoom) return;
    const ids = savedDecisionRoom.slots
      .filter((slot) => slot.status !== "eliminated" && deepRacketById.has(slot.racketId))
      .slice(0, 3)
      .map((slot) => slot.racketId);
    const slots = ids.reduce<CompareSlots>((current, id) => addCompareId(current, id).slots, []);
    setPrescriptionBaselineId(savedDecisionRoom.baselineId ?? "");
    setDecisionCandidates(Object.fromEntries(savedDecisionRoom.slots.map((slot) => [slot.racketId, { status: slot.status, note: slot.note }])));
    commitCompareSlots(slots, "load-recommended", `已载入 ${ids.length} 把本机保存的决策候选`);
  };

  const saveDecisionRoom = () => {
    try {
      const room = normalizeDecisionRoom(currentDecisionRoom);
      window.localStorage.setItem(DECISION_STORAGE_KEY, serializeStoredDecision({ room, feedback: decisionFeedback }));
      setSavedDecisionRoom(room);
      setDecisionStorageStatus("available");
      setLiveMessage("当前决策室已保存到本机");
    } catch {
      setDecisionStorageStatus("memory-only");
      setLiveMessage("当前浏览器无法持久保存，本页仍可继续使用决策室");
    }
  };

  const closeTrialFeedback = () => {
    const trigger = trialFeedbackTriggerRef.current;
    setFeedbackRacketId(null);
    setTrialFeedbackDraft(emptyTrialFeedbackDraft);
    window.requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      trialFeedbackTriggerRef.current = null;
    });
  };

  const openTrialFeedback = (racketId: string) => {
    trialFeedbackTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setFeedbackRacketId(racketId);
    setTrialFeedbackDraft(emptyTrialFeedbackDraft);
    window.requestAnimationFrame(() => {
      const form = document.querySelector<HTMLElement>(".trial-feedback-card");
      form?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      document.getElementById("trial-feedback-title")?.focus({ preventScroll: true });
    });
  };

  const submitTrialFeedback = () => {
    if (!feedbackRacketId) return;
    const status: DecisionCandidateStatus = trialFeedbackDraft.verdict === "最终选择"
      ? "final"
      : trialFeedbackDraft.verdict === "淘汰"
        ? "eliminated"
        : "trial";
    const nextRoom = normalizeDecisionRoom({
      ...currentDecisionRoom,
      slots: currentDecisionRoom.slots.map((slot) => ({
        ...slot,
        status: slot.racketId === feedbackRacketId
          ? status
          : status === "final" && slot.status === "final"
            ? "candidate"
            : slot.status,
      })),
    });
    const feedback: TrialFeedback = {
      id: Date.now(),
      racketId: feedbackRacketId,
      ...trialFeedbackDraft,
      createdAt: new Date().toISOString(),
    };
    const nextFeedback = [feedback, ...decisionFeedback].slice(0, 12);
    setDecisionFeedback(nextFeedback);
    setDecisionCandidates(Object.fromEntries(nextRoom.slots.map((slot) => [slot.racketId, { status: slot.status, note: slot.note }])));
    setSavedDecisionRoom(nextRoom);
    try {
      window.localStorage.setItem(DECISION_STORAGE_KEY, serializeStoredDecision({ room: nextRoom, feedback: nextFeedback }));
      setDecisionStorageStatus("available");
      setLiveMessage("试打反馈与候选状态已保存到本机");
    } catch {
      setDecisionStorageStatus("memory-only");
      setLiveMessage("试打反馈已保留在本页，当前浏览器无法持久保存");
    }
    closeTrialFeedback();
  };

  const shareCurrentView = async (label: string) => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: label, url: window.location.href });
        setLiveMessage(`已打开 ${label} 分享面板`);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLiveMessage(`已复制 ${label} 链接`);
    } catch {
      setLiveMessage("浏览器未允许分享，请直接复制地址栏链接");
    }
  };

  const showMoreCatalogResults = () => {
    const firstNewRacket = matchingCatalogRackets[catalogResultLimit];
    if (!firstNewRacket) return;
    const nextLimit = Math.min(catalogResultLimit + 24, matchingCatalogRackets.length);
    catalogResultLimitRef.current = nextLimit;
    setCatalogResultLimit(nextLimit);
    replacePaikuHistory({
      ...((window.history.state as Record<string, unknown> | null) ?? {}),
      paiku: true,
      paikuCatalogResultLimit: nextLimit,
    }, "", window.location.href);
    setLiveMessage(`已显示 ${nextLimit} / ${matchingCatalogRackets.length} 个型号`);
    window.requestAnimationFrame(() => {
      const focusKey = `catalog-model-open-${firstNewRacket.id}`;
      const firstNewResult = Array.from(document.querySelectorAll<HTMLElement>("[data-focus-key]"))
        .find((element) => element.dataset.focusKey === focusKey);
      firstNewResult?.focus({ preventScroll: true });
    });
  };

  const commitTourFilter = (nextTour: Tour) => {
    if (nextTour === tourFilterRef.current) return;
    if (activeViewRef.current === "tour") snapshotCurrentHistoryEntry();
    applyTourFilterToState(nextTour);
    setTourPlayerLanding(null);
    if (activeViewRef.current === "tour") {
      const parsedTourRoute = parseAppRoute(window.location.hash);
      const route: AppRoute = {
        view: parsedTourRoute.view,
        ...(parsedTourRoute.familyId ? { familyId: parsedTourRoute.familyId } : {}),
        ...(parsedTourRoute.racketId ? { racketId: parsedTourRoute.racketId } : {}),
      };
      const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      pushPaikuHistory({
        ...((window.history.state as Record<string, unknown> | null) ?? {}),
        paiku: true,
        paikuViewScrollTop: window.scrollY,
        paikuFocus: captureFocusIdentity(focused) ?? undefined,
      }, "", formatCurrentRoute(route));
      lastRouteRef.current = route;
    }
    setLiveMessage(`已切换到 ${nextTour} 世界前 8 用拍`);
  };

  const browseForCompare = () => {
    commitArmoryFilters({ ...armoryFilterConfig.defaults, scope: "models" });
    setCompareUndo(null);
    setLiveMessage("已进入完整拍库，选择一款即可加入对比");
    compareBrowseReturnRef.current = true;
    goToView("armory");
    replacePaikuHistory({ ...((window.history.state as Record<string, unknown> | null) ?? {}), paikuCompareBrowseReturn: true }, "", window.location.href);
    pendingViewFocusRef.current = null;
    window.requestAnimationFrame(() => {
      catalogBrowseRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      catalogSearchRef.current?.focus({ preventScroll: true });
    });
  };

  const browseFullCatalog = () => {
    commitArmoryFilters({ ...armoryFilterConfig.defaults, scope: "families" });
    goToView("armory");
  };

  const settleMatchJourney = (
    intent: PendingMatchSettlement["intent"],
    journeyId: string,
    settledScreen?: MatchScreenSnapshot,
  ) => {
    const currentState = window.history.state as (PaikuHistoryState & Record<string, unknown>) | null;
    const currentIndex = historyIndexFromState(currentState, currentHistoryIndexRef.current);
    const legacyDepth = Math.max(0, currentState?.paikuMatchJourneyDepth ?? 0);
    const fallbackProfile = intent === "complete" ? matchFlow.committed : settledScreen?.kind === "result" ? settledScreen.profile : undefined;
    const fallbackResult: MatchScreenSnapshot | undefined = fallbackProfile ? { kind: "result", profile: { ...fallbackProfile } } : undefined;
    const fallbackOrigin: MatchHistoryOrigin = {
      index: Math.max(0, currentIndex - legacyDepth),
      route: fallbackResult ? { view: "match", matchStep: 3 } : { view: "discover" },
      ...(fallbackResult ? { matchScreen: fallbackResult } : {}),
      viewScrollTop: 0,
    };
    const hasStoredOrigin = Boolean(currentState?.paikuMatchOrigin && currentState.paikuMatchOrigin.index <= currentIndex);
    const origin = hasStoredOrigin ? currentState?.paikuMatchOrigin as MatchHistoryOrigin : fallbackOrigin;
    const plan = intent === "complete" && settledScreen?.kind === "result"
      ? planMatchSettlement({ outcome: "complete", journeyId, currentIndex, origin, settledScreen })
      : planMatchSettlement({ outcome: "cancel", journeyId, currentIndex, origin });
    const previousSettlementOrder = matchJourneyLifecycleRef.current.records[0]?.settledAt ?? 0;
    const lifecycleStored = persistMatchJourneyLifecycle(recordSettledMatchJourney(matchJourneyLifecycleRef.current, {
      journeyId,
      outcome: intent,
      settledAt: previousSettlementOrder < Number.MAX_SAFE_INTEGER ? previousSettlementOrder + 1 : previousSettlementOrder,
      destination: {
        route: plan.destination.route,
        ...(plan.destination.matchScreen ? { screen: plan.destination.matchScreen } : {}),
      },
    }, 100));
    if (!lifecycleStored) {
      setSessionPersistence("memory-only");
      setLiveMessage((current) => current
        ? `${current}；当前浏览器无法保存导航状态`
        : "当前浏览器无法保存导航状态；刷新后请从匹配入口重新进入");
    }
    const pending: PendingMatchSettlement = { intent, plan, synthesizeOrigin: !hasStoredOrigin };
    pendingMatchSettlementRef.current = pending;
    if (plan.travelDelta !== 0) {
      window.history.go(plan.travelDelta);
      return;
    }
    materializePendingMatchSettlement(pending, currentState);
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  };

  const toggleMatchBreakdown = (id: string) => {
    setBreakdownOpenIds((current) => current.includes(id) ? [] : [id]);
  };

  // Instant preview only mutates in-memory state: no snapshot persistence, no
  // history entries, no hash changes. Leaving the screen restores the
  // committed profile ranking automatically.
  const previewMatchPriority = (item: MatchPriority) => {
    const nextPreview = item === profilePriority ? null : item;
    if (nextPreview === previewPriority) return;
    setPreviewPriority(nextPreview);
    if (nextPreview === null) return;
    if (prescriptionBaseline) {
      setLiveMessage(`预览 ${nextPreview} 优先，三条升级路线已重新计算`);
      return;
    }
    const committedRanking = prescriptionBaseline
      ? buildSwapPrescription(deepRackets, prescriptionBaseline, profileStage, profileStyle, profilePriority, 3)
      : buildRecommendations(deepRackets, profileStage, profileStyle, profilePriority);
    const previewRanking = prescriptionBaseline
      ? buildSwapPrescription(deepRackets, prescriptionBaseline, profileStage, profileStyle, nextPreview, 3)
      : buildRecommendations(deepRackets, profileStage, profileStyle, nextPreview);
    const changedCount = changedRankCount(diffRecommendationRanks(committedRanking, previewRanking, 3));
    setLiveMessage(changedCount > 0 ? `预览 ${nextPreview} 优先，${changedCount} 把球拍名次变化` : `预览 ${nextPreview} 优先，名次没有变化`);
  };

  const restartMatchProfile = () => {
    const recoveringMissingResult = matchRouteNotice === "missing-result";
    setMatchRouteNotice(null);
    setBreakdownOpenIds([]);
    setPreviewPriority(null);
    const currentRoute = parseAppRoute(window.location.hash);
    const alreadyAtStart = activeView === "match" && currentRoute.matchStep === 0 && !currentRoute.familyId && !currentRoute.racketId;
    if (!alreadyAtStart && !recoveringMissingResult) snapshotCurrentHistoryEntry();
    let currentHistoryState = window.history.state as PaikuHistoryState | null;
    const reusingSyntheticRecoveryEntry = Boolean(
      recoveringMissingResult
      && currentHistoryState?.paikuMatchRecovery === "missing-result"
      && currentHistoryState.paikuMatchPushed,
    );
    if (recoveringMissingResult && !reusingSyntheticRecoveryEntry) {
      const discoveryState = stripMatchJourneyState(currentHistoryState) as PaikuHistoryState & Record<string, unknown>;
      discoveryState.paiku = true;
      discoveryState.paikuOverlayPushed = false;
      discoveryState.paikuViewScrollTop = 0;
      delete discoveryState.paikuMatchRecovery;
      delete discoveryState.paikuFamilyTargetId;
      delete discoveryState.paikuFamilyScrollTop;
      delete discoveryState.paikuFamilyMatrixScrollLeft;
      delete discoveryState.paikuFamilyRevealTarget;
      delete discoveryState.paikuRacketScrollTop;
      replacePaikuHistory(discoveryState, "", formatAppRoute({ view: "discover" }));
      currentHistoryState = window.history.state as PaikuHistoryState | null;
    }
    const journeyDepth = alreadyAtStart ? Math.max(1, currentHistoryState?.paikuMatchJourneyDepth ?? 1) : 1;
    const fallbackOrigin: MatchHistoryOrigin = {
      index: Math.max(0, historyIndexFromState(currentHistoryState, currentHistoryIndexRef.current) - journeyDepth),
      route: matchFlow.committed ? { view: "match", matchStep: 3 } : { view: "discover" },
      ...(matchFlow.committed ? { matchScreen: { kind: "result", profile: { ...matchFlow.committed } } as MatchScreenSnapshot } : {}),
      viewScrollTop: 0,
    };
    const coldRecoveryRestart = reusingSyntheticRecoveryEntry
      ? planColdMissingResultRestart(historyIndexFromState(currentHistoryState, currentHistoryIndexRef.current))
      : null;
    const matchOrigin = coldRecoveryRestart
      ? coldRecoveryRestart.origin
      : recoveringMissingResult
        ? { index: historyIndexFromState(currentHistoryState, currentHistoryIndexRef.current), route: { view: "discover" } as AppRoute, viewScrollTop: 0 }
      : alreadyAtStart
        ? currentHistoryState?.paikuMatchOrigin ?? fallbackOrigin
        : captureMatchOrigin();
    const journeyId = makeMatchJourneyId();
    const nextFlow = beginMatchDraft(matchFlow, 0, journeyId);
    const nextScreen = snapshotMatchScreen(nextFlow);
    matchFlowRef.current = nextFlow;
    setMatchFlow(nextFlow);
    const saved = persistMatchSnapshot(nextFlow);
    setSessionPersistence(saved ? "available" : "memory-only");
    if (!saved) {
      setLiveMessage("当前浏览器无法持久保存；本次匹配刷新后可能丢失");
    }
    viewScrollPositionsRef.current[activeView] = window.scrollY;
    setSelectedId(null);
    setSelectedFamilyId(null);
    setFamilyTargetRacketId(null);
    setDetailReturnFamilyId(null);
    familyReturnRacketRef.current = null;
    pendingPageFocusRef.current = false;
    pendingViewFocusRef.current = null;
    setActiveView("match");
    activeViewRef.current = "match";
    const route: AppRoute = { view: "match", matchStep: 0 };
    lastRouteRef.current = route;
    const historyState = { paiku: true as const, paikuMatchPushed: false, paikuMatchScreen: nextScreen, paikuMatchJourneyId: journeyId, paikuMatchJourneyDepth: journeyDepth, paikuMatchOrigin: matchOrigin, paikuViewScrollTop: 0 };
    if (alreadyAtStart || coldRecoveryRestart?.action === "replace") replacePaikuHistory(historyState, "", formatAppRoute(route));
    else pushPaikuHistory(historyState, "", formatAppRoute(route));
    pendingMatchFocusRef.current = true;
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  };

  const openMatchProfile = () => {
    if (matchFlow.draft) {
      goToView("match");
      pendingViewFocusRef.current = null;
      pendingMatchFocusRef.current = true;
      return;
    }
    restartMatchProfile();
  };

  const exitMatchRecovery = () => {
    const state = window.history.state as PaikuHistoryState | null;
    if (state?.paikuMatchRecovery === "missing-result" && state.paikuMatchPushed) {
      window.history.back();
      return;
    }
    const discoveryState = stripMatchJourneyState(state) as PaikuHistoryState & Record<string, unknown>;
    discoveryState.paiku = true;
    discoveryState.paikuOverlayPushed = false;
    discoveryState.paikuViewScrollTop = 0;
    replacePaikuHistory(discoveryState, "", formatAppRoute({ view: "discover" }));
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
  };

  const cancelMatchEdit = () => {
    const nextFlow = cancelMatchDraft(matchFlow);
    const nextScreen = snapshotMatchScreen(nextFlow);
    if (nextScreen.kind !== "result") return;
    const currentHistoryState = window.history.state as PaikuHistoryState | null;
    const journeyId = matchFlow.draft?.journeyId ?? currentHistoryState?.paikuMatchJourneyId ?? makeMatchJourneyId();
    matchFlowRef.current = nextFlow;
    setMatchFlow(nextFlow);
    const saved = persistMatchSnapshot(nextFlow);
    setSessionPersistence(saved ? "available" : "memory-only");
    setLiveMessage(saved
      ? "已取消修改，原打法档案保持不变"
      : "已取消修改并保留原档案；当前浏览器无法持久保存，刷新后可能丢失");
    settleMatchJourney("cancel", journeyId, nextScreen);
  };

  const cancelCurrentMatch = () => {
    if (matchFlow.committed) {
      cancelMatchEdit();
      return;
    }
    const currentHistoryState = window.history.state as PaikuHistoryState | null;
    const journeyId = matchFlow.draft?.journeyId ?? currentHistoryState?.paikuMatchJourneyId ?? makeMatchJourneyId();
    const saved = persistMatchSnapshot(matchFlow);
    setSessionPersistence(saved ? "available" : "memory-only");
    setLiveMessage(saved
      ? "已保存当前进度，可以随时继续匹配"
      : "当前浏览器无法持久保存；进度仅保留在本页，刷新后可能丢失");
    settleMatchJourney("pause", journeyId, snapshotMatchScreen(matchFlow));
  };

  const chooseMatchOption = (step: number, value: string) => {
    if (step < 0 || step > 2) return;
    const nextFlow = answerMatchDraft(matchFlow, step as MatchQuestionStep, value);
    if (nextFlow === matchFlow) return;
    const nextScreen = snapshotMatchScreen(nextFlow);
    const nextStep = nextScreen.kind === "result" ? 3 : nextScreen.kind === "question" ? nextScreen.draft.step : 0;
    const currentHistoryState = window.history.state as PaikuHistoryState | null;
    const journeyId = matchFlow.draft?.journeyId ?? currentHistoryState?.paikuMatchJourneyId ?? makeMatchJourneyId();
    matchFlowRef.current = nextFlow;
    setMatchFlow(nextFlow);
    const saved = persistMatchSnapshot(nextFlow);
    setSessionPersistence(saved ? "available" : "memory-only");
    const route: AppRoute = { view: "match", matchStep: nextStep };
    if (nextScreen.kind === "result") {
      setLiveMessage(saved ? "新打法档案已生成" : "结果已生成，但当前浏览器无法保存；刷新后可能丢失");
      settleMatchJourney("complete", journeyId, nextScreen);
      return;
    }
    if (!saved) setLiveMessage("当前浏览器无法持久保存；本次匹配刷新后可能丢失");
    lastRouteRef.current = route;
    snapshotCurrentHistoryEntry();
    pushPaikuHistory({ paiku: true, paikuMatchPushed: true, paikuMatchScreen: nextScreen, paikuMatchJourneyId: journeyId, paikuMatchJourneyDepth: Math.max(0, currentHistoryState?.paikuMatchJourneyDepth ?? 0) + 1, paikuMatchOrigin: currentHistoryState?.paikuMatchOrigin, paikuViewScrollTop: window.scrollY }, "", formatAppRoute(route));
    pendingMatchFocusRef.current = true;
  };

  const goToPreviousMatchStep = () => {
    if (matchStep <= 0) return;
    setPreviewPriority(null);
    const state = window.history.state as PaikuHistoryState | null;
    if (shouldUseMatchHistoryBack(matchScreen, Boolean(state?.paikuMatchPushed))) {
      pendingMatchFocusRef.current = true;
      window.history.back();
      return;
    }
    let previousFlow = backMatchStep(matchFlow);
    if (previousFlow.draft && !previousFlow.draft.journeyId) {
      previousFlow = assignMatchDraftJourney(previousFlow, state?.paikuMatchJourneyId ?? makeMatchJourneyId());
    }
    const previousScreen = snapshotMatchScreen(previousFlow);
    if (previousScreen.kind !== "question") return;
    const previousStep = previousScreen.draft.step;
    const route: AppRoute = { view: "match", matchStep: previousStep };
    const journeyId = previousScreen.draft.journeyId ?? state?.paikuMatchJourneyId ?? makeMatchJourneyId();
    replacePaikuHistory({ ...((state as Record<string, unknown> | null) ?? {}), paiku: true, paikuMatchPushed: false, paikuMatchScreen: previousScreen, paikuMatchJourneyId: journeyId }, "", formatAppRoute(route));
    lastRouteRef.current = route;
    matchFlowRef.current = previousFlow;
    setMatchFlow(previousFlow);
    const saved = persistMatchSnapshot(previousFlow);
    setSessionPersistence(saved ? "available" : "memory-only");
    if (!saved) {
      setLiveMessage("已返回上一步；当前浏览器无法持久保存，刷新后可能丢失");
    }
    pendingMatchFocusRef.current = true;
  };

  const selectCatalogBrand = (brand: string, jumpToBrowse = false) => {
    const keepsGeneration = catalogGeneration === "全部代际"
      || catalogFamilies.some((family) => (brand === "全部" || family.brand === brand) && family.generation === catalogGeneration);
    commitArmoryFilters({ brand, generation: keepsGeneration ? catalogGeneration : "全部代际" });
    setLiveMessage(brand === "全部" ? "已显示全部品牌" : `已切换到 ${brand} 拍库`);
    if (!jumpToBrowse) return;
    window.requestAnimationFrame(() => {
      catalogBrowseRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      catalogSummaryRef.current?.focus({ preventScroll: true });
    });
  };

  const compareTopMatches = () => {
    const ids = recommendations.slice(0, 2).map(({ racket }) => racket.id);
    const slots = ids.reduce<CompareSlots>((current, id) => addCompareId(current, id).slots, []);
    commitCompareSlots(slots, "load-recommended", "已把处方前两名放入决策室");
    goToView("compare");
  };

  const comparisonRows: { key: string; rowKind: "meta" | "spec" | "score"; scoreKey?: ScoreKey; label: string; value: (racket: Racket) => React.ReactNode }[] = [
    { key: "type", rowKind: "meta", label: "定位 Type", value: (racket) => racket.familyType ?? "—" },
    { key: "generation", rowKind: "meta", label: "代际", value: (racket) => racket.generation ?? "—" },
    { key: "release", rowKind: "meta", label: "发行", value: (racket) => racket.releaseDate ?? racket.year },
    { key: "traits", rowKind: "meta", label: "规格特点", value: (racket) => <RacketSpecTags racket={racket} compact showSpecs={false} /> },
    { key: "stages", rowKind: "meta", label: "适合阶段", value: (racket) => racket.stages.join(" · ") },
    { key: "styles", rowKind: "meta", label: "打法风格", value: (racket) => racket.styles.join(" · ") },
    { key: "weight", rowKind: "spec", label: "裸拍重量", value: (racket) => formatNumberSpec(officialWeight(racket), "g") },
    { key: "head", rowKind: "spec", label: "拍面", value: (racket) => formatNumberSpec(officialHead(racket), "in²") },
    { key: "pattern", rowKind: "spec", label: "线床", value: (racket) => officialPattern(racket) ?? "—" },
    { key: "balance", rowKind: "spec", label: "平衡点", value: officialBalance },
    { key: "beam", rowKind: "spec", label: "框厚", value: officialBeam },
    { key: "length", rowKind: "spec", label: "长度", value: officialLength },
    ...radarKeys.map((key) => ({ key: `score-${key}`, rowKind: "score" as const, scoreKey: key, label: scoreLabels[key], value: (racket: Racket) => <b>{racket.scores[key]}</b> })),
  ];
  const similarRackets = useMemo(() => selected ? buildSimilarRackets(selected, deepRackets) : null, [selected]);
  const selectedGallery = selected
    ? selected.images?.length
      ? selected.images
      : familyGalleries[selected.familyId ?? ""] ?? (selected.image ? [selected.image] : [])
    : [];
  const tabBadge = (view: AppView) => view === "compare" && compareIds.length > 0
    ? String(compareIds.length)
    : view === "match" && matchFlow.draft
      ? `${matchFlow.draft.step + 1}/3`
      : null;
  const tabAriaLabel = (tab: (typeof appTabs)[number]) => tab.id === "compare" && compareIds.length > 0
    ? `决策室，已有 ${compareIds.length} 把候选`
    : tab.id === "match" && matchFlow.draft
      ? `换拍处方，有未完成草稿，第 ${matchFlow.draft.step + 1}/3 步`
      : tab.label;

  return (
    <div className={`racket-app${compareIds.length > 0 && activeView !== "compare" ? " racket-app--with-compare-tray" : ""}`} aria-busy={!sessionReady}>
      {!sessionReady && <div className="app-boot" role="status"><span aria-hidden="true">拍</span><p>正在装载球拍库与个人档案…</p></div>}
      <div className="app-shell" inert={!sessionReady} aria-hidden={!sessionReady}>
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById("main-content")?.focus(); }}>跳到主要内容</a>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">已进入{appTabs.find((tab) => tab.id === activeView)?.label ?? "发现"}页面</span>
      <aside className="desktop-sidebar" aria-label="应用导航">
        <button className="app-brand" onClick={() => goToView("discover")} aria-label="拍库首页">
          <span>拍</span><span><b>拍库</b><small>Racket Lab</small></span>
        </button>
        <nav>
          {appTabs.map((tab) => (
            <button key={tab.id} aria-current={activeView === tab.id ? "page" : undefined} aria-label={tabAriaLabel(tab)} onClick={() => goToView(tab.id, "restore")}>
              <span aria-hidden="true">{tab.icon}</span><b>{tab.label}</b>
              {tabBadge(tab.id) && <i aria-hidden="true">{tabBadge(tab.id)}</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span>当前拍库 · {catalogVerifiedAt}</span>
          <strong>{catalogModelCount} 款现行型号</strong>
          <p>{catalogFamilies.length} 个拍系 · {deepRackets.length} 份六维深度档案 · {catalogBrands.length} 个品牌。</p>
          <span className="sidebar-version">拍库 v{appVersion}</span>
        </div>
      </aside>

      <main className="app-content" id="main-content" tabIndex={-1}>
        {activeView === "discover" && (
          <section className="app-view discover-view" aria-labelledby="discover-title">
            <ViewTitle
              id="discover-title"
              eyebrow={hasCompletedMatch ? `${profileStage} · ${profileStyle} · ${profilePriority}优先` : "为你的打法准备"}
              title="今天，想怎么赢？"
              action={<button className="profile-button" data-focus-key="discover-match-profile" onClick={openMatchProfile} aria-label={matchFlow.draft ? "继续未完成的换拍处方" : hasCompletedMatch ? "调整我的换拍处方" : "开始建立换拍处方"}><span aria-hidden="true">◇</span><b>{matchFlow.draft ? "继续处方" : hasCompletedMatch ? "调整处方" : "生成处方"}</b></button>}
            />

            {matchFlow.draft && (
              <div className="match-draft-banner" role="status">
                <span>匹配草稿 · 第 {matchFlow.draft.step + 1}/3 步</span>
                <p>{hasCompletedMatch
                  ? sessionPersistence === "memory-only"
                    ? "修改进度仅保留在本页；当前推荐仍基于原打法档案。"
                    : "修改尚未完成；当前推荐仍基于已保存的打法档案。"
                  : sessionPersistence === "memory-only"
                    ? "进度仅保留在本页；刷新或关闭页面后会丢失。"
                    : "进度已保存在本机，可以从上次的问题继续。"}</p>
                <button data-focus-key="discover-match-draft" onClick={openMatchProfile}>继续换拍处方 <span aria-hidden="true">›</span></button>
              </div>
            )}

            {hasCompletedMatch ? (
              <>
                <section className="featured-racket" style={{ "--racket-accent": featured.racket.accent } as CSSProperties}>
                  <div className="featured-racket__copy">
                    <div className="match-badge"><span>你的首选</span><b>{Math.round(featured.match)} 匹配指数</b></div>
                    <p>{featured.racket.brand} · {featured.racket.series}</p>
                    <h2>{featured.racket.model}</h2>
                    <p className="featured-racket__summary">{featured.racket.verdict}</p>
                    <div className="featured-racket__tags"><span>{profileStage}</span><span>{profileStyle}</span><span>{profilePriority}优先</span></div>
                    <div className="featured-racket__actions">
                      <button className="app-button app-button--primary" data-focus-key={`featured-open-${featured.racket.id}`} onClick={() => openRacket(featured.racket.id)}>查看球拍</button>
                      <button className="app-button app-button--glass" data-focus-key={`featured-compare-${featured.racket.id}`} onClick={() => requestCompare(featured.racket.id)} aria-pressed={compareIds.includes(featured.racket.id)}>{compareIds.includes(featured.racket.id) ? "✓ 已加入对比" : compareIds.length >= 3 ? "管理对比 3/3" : "+ 加入对比"}</button>
                    </div>
                  </div>
                  <RacketPhoto racket={featured.racket} variant="hero" />
                  <div className="featured-racket__radar"><RadarChart chartRackets={[featured.racket]} compact /></div>
                </section>

                <div className="section-bar"><div><p>为你推荐</p><h2>不同拍系的三个候选</h2></div><button onClick={browseFullCatalog}>查看全部 <span aria-hidden="true">›</span></button></div>
                <div className="recommendation-list">
                  {recommendations.slice(1).map(({ racket, match }) => (
                    <RecommendationRow
                      key={racket.id}
                      racket={racket}
                      match={match}
                      onOpen={() => openRacket(racket.id)}
                      onToggleCompare={() => requestCompare(racket.id)}
                      compared={compareIds.includes(racket.id)}
                      compareFull={compareIds.length >= 3}
                    />
                  ))}
                </div>
              </>
            ) : (
              <section className="match-onboarding">
                <div className="match-onboarding__copy">
                  <span>3 步 · 约 30 秒</span>
                  <h2>先建立你的打法档案</h2>
                  <p>告诉我们阶段、常用赢分方式和优先方向，再从 {catalogModelCount} 款球拍里生成真实的候选清单。</p>
                  <div><button className="app-button app-button--primary" data-focus-key="discover-match-start" onClick={openMatchProfile}>{matchFlow.draft ? "继续处方" : "开始换拍处方"} <span aria-hidden="true">→</span></button><button className="app-button app-button--soft" onClick={browseFullCatalog}>先浏览拍库</button></div>
                </div>
                <ol className="match-onboarding__steps"><li><b>01</b><span>打球阶段</span></li><li><b>02</b><span>打法风格</span></li><li><b>03</b><span>属性优先</span></li></ol>
              </section>
            )}

            <section className="insight-card">
              <div><span aria-hidden="true">◎</span><p>选拍提示</p></div>
              <h2>参数只是起点，动作与目标才决定答案。</h2>
              <p>先锁定阶段和打法，再用控制、力量、旋转、手感、容错与灵活六个维度确认取舍。</p>
              <button data-focus-key="discover-match-insight" onClick={openMatchProfile}>{matchFlow.draft ? "继续未完成处方" : hasCompletedMatch ? "调整换拍处方" : "开始 3 步换拍处方"} <span aria-hidden="true">→</span></button>
            </section>

            {recentRackets.length > 0 && (
              <section className="recent-shelf" aria-labelledby="recent-shelf-title">
                <div className="recent-shelf__header">
                  <div>
                    <p>继续上次浏览</p>
                    <h2 id="recent-shelf-title" tabIndex={-1}>最近看过</h2>
                    <small>{sessionPersistence === "memory-only" ? "仅保留在本页，刷新或关闭页面后会丢失" : "仅保存在本机"} · {recentRackets.length}/12</small>
                  </div>
                  <button className="recent-shelf__clear" data-focus-key="recent-clear" onClick={clearRecentRackets} aria-label="清空最近看过">清空</button>
                </div>
                <ul className="recent-shelf__track" aria-label="最近浏览球拍，可横向滑动">
                  {recentRackets.map((racket) => (
                    <li key={racket.id} className="recent-shelf__item">
                      <button className="recent-shelf__open" data-focus-key={`recent-open-${racket.id}`} onClick={() => openRacket(racket.id)}>
                        <RacketPhoto racket={racket} variant="thumb" />
                        <span>{racket.brand}</span>
                        <b>{racket.model}</b>
                        <small>继续看档案 <span aria-hidden="true">›</span></small>
                      </button>
                      <button className="recent-shelf__remove" data-focus-key={`recent-remove-${racket.id}`} aria-label={`从最近看过移除 ${racket.brand} ${racket.model}`} onClick={() => removeRecent(racket.id)}>×</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="curated-lists" aria-labelledby="curated-lists-title">
              <div className="section-bar"><div><p>按场景选拍</p><h2 id="curated-lists-title">先选目标，再看符合条件的球拍</h2></div><span>规则筛选 · 不代表销量排名</span></div>
              <div
                className="curated-lists__tabs"
                role="tablist"
                aria-label="选择选拍场景"
                onKeyDown={(event) => moveHorizontalTab(event, curatedListEntries.map((entry) => entry.list.id), activeCuratedScene?.id ?? curatedListEntries[0].list.id, setActiveCuratedListId)}
              >
                {curatedListEntries.map(({ list, rackets }) => (
                  <button id={`curated-tab-${list.id}`} key={list.id} role="tab" tabIndex={activeCuratedScene?.id === list.id ? 0 : -1} aria-selected={activeCuratedScene?.id === list.id} aria-controls="curated-panel-active" onClick={() => setActiveCuratedListId(list.id)}>
                    <span>{list.title}</span><small>{rackets.length} 把符合</small>
                  </button>
                ))}
              </div>
              {activeCuratedScene && (
                  <article id="curated-panel-active" role="tabpanel" className="curated-list" aria-labelledby={`curated-tab-${activeCuratedScene.id}`}>
                    <header className="curated-list__header">
                      <div><span>SCENE 0{curatedListEntries.findIndex((entry) => entry.list.id === activeCuratedScene.id) + 1}</span><h3 id={`curated-title-${activeCuratedScene.id}`}>{activeCuratedScene.title}</h3></div>
                      <p>{activeCuratedScene.tagline}</p>
                    </header>
                    <button
                      className="curated-list__criteria-toggle"
                      aria-expanded={activeCuratedCriteriaOpen}
                      aria-controls={`curated-criteria-${activeCuratedScene.id}`}
                      data-focus-key={`curated-criteria-${activeCuratedScene.id}`}
                      onClick={() => setOpenCuratedCriteria((current) => ({ ...current, [activeCuratedScene.id]: !current[activeCuratedScene.id] }))}
                    >
                      <b>为什么它们入选</b>
                      <small>{curatedCriteriaSummary(activeCuratedScene)}</small>
                      <span aria-hidden="true">{activeCuratedCriteriaOpen ? "收起" : "查看"}</span>
                    </button>
                    <div id={`curated-criteria-${activeCuratedScene.id}`} className="curated-list__criteria" hidden={!activeCuratedCriteriaOpen}>
                      <div><h4>硬性规格条件</h4><ul>{activeCuratedScene.hardCriteria.map((criterion) => <li key={criterion.label}>{criterion.label}</li>)}</ul></div>
                      <div><h4>评分门槛</h4><ul>{activeCuratedScene.scoreCriteria.map((criterion) => <li key={criterion.label}>{criterion.label}</li>)}</ul><p className="curated-list__note">六维评分为{HONESTY_NOTES.relativeAssessment}</p></div>
                    </div>
                    {activeCuratedRackets.length > 0 ? (
                      <ul className="curated-list__entries">
                        {activeCuratedRackets.map((racket) => (
                          <li key={racket.id} className="curated-entry">
                            <button className="curated-entry__main" data-focus-key={`curated-open-${activeCuratedScene.id}-${racket.id}`} onClick={() => openRacket(racket.id)}>
                              <RacketPhoto racket={racket} variant="thumb" />
                              <span className="curated-entry__identity">
                                <span>{racket.brand} · {racket.generation ?? racket.year}</span>
                                <b>{racket.model}</b>
                                <small>{formatNumberSpec(officialHead(racket), "in²")} · {formatNumberSpec(officialWeight(racket), "g")} · {officialPattern(racket) ?? HONESTY_NOTES.unpublished}</small>
                                <span className="curated-entry__scores">{activeCuratedScene.scoreCriteria.map((criterion) => <em key={criterion.score}>{scoreLabels[criterion.score]} {racket.scores[criterion.score]}</em>)}</span>
                              </span>
                            </button>
                            <button className="curated-entry__compare" data-focus-key={`curated-compare-${activeCuratedScene.id}-${racket.id}`} onClick={() => requestCompare(racket.id)} aria-pressed={compareIds.includes(racket.id)} aria-label={compareIds.includes(racket.id) ? `移出 ${racket.model} 决策室` : compareIds.length >= 3 ? `管理已满对比，并用 ${racket.model} 替换候选` : `加入 ${racket.model} 决策室`}>{compareIds.includes(racket.id) ? "✓" : compareIds.length >= 3 ? "⇄" : "+"}</button>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="curated-list__empty">当前拍库暂无满足全部标准的型号，可前往球拍库放宽筛选。</p>}
                  </article>
              )}
            </section>

            <div className="discover-shortcuts">
              <button onClick={browseFullCatalog}>
                <span>统一球拍库</span><b>{catalogModelCount} 款深度档案</b><small>按品牌、类型与代际浏览，每款都可看雷达与完整规格</small><i aria-hidden="true">›</i>
              </button>
              <button onClick={() => goToView("tour")}>
                <span>Tour Locker</span><b>ATP + WTA 前 8</b><small>看明星球员的官网公开用拍</small><i aria-hidden="true">›</i>
              </button>
            </div>

          </section>
        )}

        {activeView === "match" && (
          <section className="app-view match-view" aria-labelledby="match-title">
            <ViewTitle
              id="match-title"
              eyebrow="从当前球拍出发 · 三步收敛"
              title="换拍处方"
              action={!matchRouteNotice && (matchStep > 0 || matchFlow.draft) ? (
                <div className="match-title-actions">
                  {matchStep > 0 && <button className="round-action" onClick={goToPreviousMatchStep} aria-label="返回上一步">‹</button>}
                  {matchFlow.draft && <button className="round-action" onClick={cancelCurrentMatch} aria-label={matchFlow.committed ? "取消修改并保留原档案" : sessionPersistence === "memory-only" ? "暂停并退出匹配，进度仅保留在本页" : "保存进度并退出匹配"} title={matchFlow.committed ? "取消修改" : sessionPersistence === "memory-only" ? "暂停并退出" : "保存并退出"}>×</button>}
                </div>
              ) : undefined}
            />
            <div
              className="match-progress"
              role={matchRouteNotice ? "status" : "progressbar"}
              aria-label={matchRouteNotice ? "换拍处方不可用" : matchStep >= 3 ? "换拍处方完成" : `换拍处方进度 ${matchStep + 1} / 3`}
              aria-valuemin={matchRouteNotice ? undefined : 1}
              aria-valuemax={matchRouteNotice ? undefined : 3}
              aria-valuenow={matchRouteNotice ? undefined : Math.min(matchStep + 1, 3)}
            >
              {[0, 1, 2].map((step) => <i key={step} className={!matchRouteNotice && matchStep >= step ? "is-active" : ""} />)}
            </div>

            {!matchRouteNotice && (
              <PrescriptionBaselinePicker value={prescriptionBaselineId} onChange={changePrescriptionBaseline} compact={matchStep < 3} />
            )}

            {sessionPersistence === "memory-only" && !matchRouteNotice && (
              <p className="match-storage-warning" role="status">当前浏览器不允许持久保存；刷新或关闭页面后，本次进度可能丢失。</p>
            )}

            {matchRouteNotice === "missing-result" ? (
              <section className="match-recovery" role="status">
                <span aria-hidden="true">◇</span>
                <p>这是一条仅包含结果位置的链接</p>
                <h2 ref={matchHeadingRef} tabIndex={-1}>这份处方结果不在当前设备</h2>
                <p>打法答案不会写进分享链接。你可以选择当前球拍，再用 3 个问题重新生成换拍处方。</p>
                <div><button className="app-button app-button--primary" onClick={restartMatchProfile}>重新生成处方</button><button className="app-button app-button--soft" onClick={exitMatchRecovery}>返回发现</button></div>
              </section>
            ) : matchStep < 3 ? (
              <section className="match-question">
                <p>步骤 {matchStep + 1} / 3</p>
                <h2 ref={matchHeadingRef} tabIndex={-1}>{matchStep === 0 ? "你现在处于哪个阶段？" : matchStep === 1 ? "哪种打法最像你？" : "最想优先获得什么？"}</h2>
                <p className="match-question__hint">
                  {matchStep === 0 ? "按当前稳定水平选择，不用把它当成水平考试。" : matchStep === 1 ? "选择你最常用来赢分的方式。" : "每把球拍都有取舍，先确定这一阶段最重要的能力。"}
                </p>
                <div className={`match-options match-options--${matchStep}`} role="group" aria-label={matchStep === 0 ? "选择打球阶段" : matchStep === 1 ? "选择打法风格" : "选择优先属性"}>
                  {(matchStep === 0 ? ["入门", "进阶", "高阶"] : matchStep === 1 ? styleOptions.slice(1) : matchPriorities).map((item) => {
                    const current = matchStep === 0
                      ? matchFlow.draft?.answers.stage === item
                      : matchStep === 1
                        ? matchFlow.draft?.answers.style === item
                        : matchFlow.draft?.answers.priority === item;
                    return <button key={item} aria-pressed={current} onClick={() => chooseMatchOption(matchStep, item)}><span>{item === "护臂" ? "护臂 / 容错" : item}</span><i aria-hidden="true">{current ? "✓" : "›"}</i></button>;
                  })}
                </div>
              </section>
            ) : (
              <section className="match-results-app">
                <div className="match-result-hero">
                  <span>{prescriptionBaseline ? `从 ${prescriptionBaseline.model} 出发` : "换拍处方已生成"}</span>
                  <h2 ref={matchHeadingRef} tabIndex={-1}>{profileStage} · {profileStyle}</h2>
                  <p>优先方向：{displayPriority}。{prescriptionBaseline ? "每个候选都会说明相对当前球拍的收益、取舍与适应成本。" : "选择你当前使用的球拍，可查看更具体的迁移差异。"}</p>
                  <button onClick={restartMatchProfile}>修改答案</button>
                </div>
                <section className="match-priority-preview" aria-labelledby="match-priority-preview-title">
                  <div className="match-priority-preview__head">
                    <div><span>即时试算</span><h3 id="match-priority-preview-title">换个优先方向，看看候选怎么变</h3></div>
                    <span className="match-priority-preview__saved"><i aria-hidden="true" />档案：{profilePriority}优先</span>
                  </div>
                  <div className="match-priority-preview__capsules" role="group" aria-label="预览不同优先方向">
                    {matchPriorities.map((item) => (
                      <button key={item} type="button" aria-pressed={displayPriority === item} onClick={() => previewMatchPriority(item)} aria-label={`${item === profilePriority ? "档案已保存，" : ""}预览${item}优先`}><span>{item === "护臂" ? "护臂 / 容错" : item}</span>{item === profilePriority && <i aria-hidden="true" />}</button>
                    ))}
                  </div>
                  {previewPriority !== null && previewPriority !== profilePriority && (
                    <div className="match-priority-preview__status" role="status"><span>仅预览</span><p>正在按 {previewPriority} 优先试算；你的档案仍是 {profilePriority} 优先。</p><button onClick={() => previewMatchPriority(profilePriority)}>恢复档案结果</button></div>
                  )}
                </section>
                <div className="match-result-list">
                  {recommendations.slice(0, 3).map(({ racket, match }, index) => (
                    <article key={racket.id} className="match-result-card">
                      <span className="match-result-card__rank" aria-label={prescriptionBaseline ? `升级路线 ${index + 1}` : `推荐第 ${index + 1} 名`}>{prescriptionBaseline ? String.fromCharCode(65 + index) : index + 1}</span>
                      <button className="match-result-card__main" data-focus-key={`match-result-open-${racket.id}`} onClick={() => openRacket(racket.id)}>
                        <RacketPhoto racket={racket} variant="thumb" />
                        <span className="match-result-card__copy">
                          <small>{prescriptionResultById.get(racket.id)?.role ?? racket.brand}</small>
                          <strong>{racket.model}</strong>
                          {(() => {
                            const change = previewRankChanges?.find((entry) => entry.id === racket.id);
                            if (!change || (!change.isNew && change.delta === 0)) return null;
                            const badge = change.isNew ? "新上榜" : change.delta > 0 ? `↑${change.delta}` : `↓${Math.abs(change.delta)}`;
                            const spoken = change.isNew ? "较档案榜单新进前三" : change.delta > 0 ? `较档案榜单上升 ${change.delta} 位` : `较档案榜单下降 ${Math.abs(change.delta)} 位`;
                            return <span className={`match-result-card__rank-change${change.isNew ? " is-new" : change.delta > 0 ? " is-up" : " is-down"}`} role="img" aria-label={spoken}>{badge}</span>;
                          })()}
                          <span>{prescriptionResultById.get(racket.id)?.gains.join("；") ?? recommendationReason(racket, profileStage, profileStyle, displayPriority)}</span>
                          {prescriptionBaseline && prescriptionResultById.get(racket.id) && <em>{prescriptionDeltaSummary(prescriptionResultById.get(racket.id) as PrescriptionResult)} · 适应成本 {prescriptionResultById.get(racket.id)?.adaptation}</em>}
                        </span>
                      </button>
                      <div className="match-result-card__score"><b>{Math.round(match)}</b><small>{prescriptionBaseline ? "适配 / 99" : "匹配 / 99"}</small></div>
                      <button className="match-result-card__add" data-focus-key={`match-result-compare-${racket.id}`} onClick={() => requestCompare(racket.id)} aria-pressed={compareIds.includes(racket.id)} aria-label={compareIds.includes(racket.id) ? `移出 ${racket.model} 决策室` : compareIds.length >= 3 ? `管理已满对比，并用 ${racket.model} 替换候选` : `加入 ${racket.model} 决策室`}>{compareIds.includes(racket.id) ? "✓" : compareIds.length >= 3 ? "⇄" : "+"}</button>
                      {(() => {
                        const breakdown = prescriptionBaseline ? null : recommendationBreakdown(racket, profileStage, profileStyle, displayPriority);
                        const swapResult = prescriptionResultById.get(racket.id);
                        const expanded = breakdownOpenIds.includes(racket.id);
                        return (
                          <div className="match-result-breakdown">
                            <button type="button" className="match-result-breakdown__trigger" aria-expanded={expanded} aria-controls={`match-breakdown-${racket.id}`} aria-label={`查看 ${racket.model} 的${prescriptionBaseline ? "换拍理由" : "匹配指数拆解"}`} onClick={() => toggleMatchBreakdown(racket.id)}>
                              <span>{prescriptionBaseline ? "为什么值得换" : "为什么是它"}</span><i aria-hidden="true">{expanded ? "收起" : "展开"}</i>
                            </button>
                            <div id={`match-breakdown-${racket.id}`} role="region" aria-label={`${racket.model} 匹配指数拆解`} className="match-result-breakdown__panel" hidden={!expanded}>
                              {swapResult ? (
                                <>
                                  <div className="match-result-breakdown__chips">{swapResult.gains.map((gain) => <span key={gain}>收益 · {gain}</span>)}{swapResult.tradeoff && <span className="is-tradeoff">取舍 · {swapResult.tradeoff}</span>}<span>适应成本 · {swapResult.adaptation}</span></div>
                                  <p className="match-result-breakdown__total">{prescriptionDeltaSummary(swapResult)}</p>
                                  <p className="match-result-breakdown__note">这是相对当前拍的升级路线，不代表绝对排名。{HONESTY_NOTES.matchIndex}</p>
                                </>
                              ) : breakdown ? (
                                <>
                                  <div className="match-result-breakdown__chips"><span className={breakdown.stageHit ? "" : "is-miss"}>{breakdown.stageHit ? `阶段匹配 +${breakdown.stagePoints}` : "阶段未命中 +0"}</span><span className={breakdown.styleHit ? "" : "is-miss"}>{breakdown.styleHit ? `打法匹配 +${breakdown.stylePoints}` : "打法未命中 +0"}</span><span>{displayPriority}加权 +{breakdown.priorityPoints.toFixed(1)}</span></div>
                                  <details className="match-result-breakdown__formula"><summary>查看计算方式</summary><ul><li>基础分 +{breakdown.base}</li><li>{breakdown.stageHit ? `阶段命中 +${breakdown.stagePoints}（适合${profileStage}）` : `阶段未命中 +0（该拍标注：${racket.stages.join("、")}）`}</li><li>{breakdown.styleHit ? `打法命中 +${breakdown.stylePoints}（匹配${profileStyle}）` : `打法未命中 +0（该拍标注：${racket.styles.join("、")}）`}</li><li>{breakdown.priorityMode === "均衡" ? `六维均衡加权 +${breakdown.priorityPoints.toFixed(1)}（六维均值×0.18 + 最低维×0.06）` : `${displayPriority}加权 +${breakdown.priorityPoints.toFixed(1)}（${displayPriority} ${racket.scores[priorityScoreKeyMap[displayPriority]]}×0.2 + 六维均值×0.04）`}</li></ul></details>
                                  <p className="match-result-breakdown__total">合计 {breakdown.raw.toFixed(1)} ≈ 卡面 {Math.round(match)}{breakdown.capped ? `（原始 ${breakdown.raw.toFixed(1)}，封顶 99）` : ""}</p>
                                  <p className="match-result-breakdown__note">{HONESTY_NOTES.matchIndex}</p>
                                </>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()}
                    </article>
                  ))}
                </div>
                <section className="match-sync" aria-labelledby="match-sync-title">
                  <div className="match-sync__head">
                    <div><p>Tour Sync</p><h3 id="match-sync-title">球星关联拍适配</h3></div>
                    <span>按{displayPriority}优先计算</span>
                  </div>
                  <ul className="match-sync__list">
                    {tourPlayerSync.slice(0, 4).map((item) => (
                      <li key={item.player.id}>
                        <button type="button" data-focus-key={`tour-sync-open-${item.player.id}`} onClick={() => openTourPlayer(item.player.id)} aria-label={`${item.player.nameZh}，${item.player.tour} 第 ${item.player.rank} 位，关联零售拍适配 ${item.syncScore} 分，${item.mapping}，打开球星卡`}>
                          <RacketPhoto racket={item.viaRacket} variant="thumb" />
                          <span className="match-sync__who">
                            <small>{item.player.tour} #{item.player.rank} · {item.player.countryCode}</small>
                            <strong>{item.player.nameZh}</strong>
                            <span>{item.viaRacket.model}</span>
                            <em>{tourCatalogTargets[item.player.id]?.kind === "family" ? `系内适配型号估算 · ${item.mapping}` : `零售型号映射 · ${item.mapping}`}</em>
                          </span>
                          <span className="match-sync__score"><b>{item.syncScore}</b><small>/ 99 适配</small><i aria-hidden="true">›</i></span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="match-sync__foot"><p className="match-sync__note">{HONESTY_NOTES.tourSync}</p><button type="button" className="match-sync__all" data-focus-key="tour-sync-all" onClick={() => goToView("tour")}>查看全部 {tourPlayers.length} 位球星 <span aria-hidden="true">›</span></button></div>
                </section>
                <div className="match-results-actions"><button className="app-button app-button--primary" onClick={compareIds.length > 0 ? () => goToView("compare") : compareTopMatches}>{compareIds.length > 0 ? `进入决策室 ${compareIds.length}/3` : "把前两名放入决策室"}</button><button className="app-button app-button--soft" onClick={browseFullCatalog}>浏览完整拍库</button></div>
              </section>
            )}
          </section>
        )}

        {activeView === "armory" && (
          <section className="app-view armory-view" aria-labelledby="armory-title">
            <ViewTitle
              id="armory-title"
              eyebrow="Racket Library · 2026"
              title="球拍库"
              action={<span className="m-only armory-title-count">{catalogFamilies.length} 拍系 · {catalogModelCount} 型号</span>}
            />
            <div className="armory-mheader m-only">
              <label className="armory-mheader__search" htmlFor="catalog-search-m">
                <span className="sr-only">搜索品牌、拍系、代际或具体型号</span>
                <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5.4" fill="none" stroke="currentColor" strokeWidth="1.7" /><rect x="11" y="10.4" width="4.6" height="1.7" rx="0.85" transform="rotate(45 11 10.4)" fill="currentColor" /></svg>
                <input id="catalog-search-m" type="search" inputMode="search" enterKeyHint="search" autoComplete="off" spellCheck={false} aria-describedby="catalog-result-summary" value={catalogSearch} onChange={(event) => updateCatalogSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); submitCatalogSearch(); } else if (event.key === "Escape" && catalogSearch) { event.preventDefault(); clearCatalogSearch(); } }} placeholder={`搜索 ${catalogModelCount} 款型号 · 支持 16x19`} />
                {catalogSearch ? <button type="button" onClick={clearCatalogSearch} aria-label="清除搜索">✕</button> : null}
              </label>
              <div className="armory-mheader__chips m-hscroll">
                <button type="button" className={`m-chip armory-mheader__filter${catalogActiveFilterCount > 0 ? " m-chip--active" : ""}`} aria-expanded={catalogFiltersOpen} aria-controls="catalog-filter-panel" onClick={() => setCatalogFiltersOpen(true)}>
                  <svg viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="2" width="10" height="1.6" rx="0.8" fill="currentColor" /><rect x="3" y="5.2" width="6" height="1.6" rx="0.8" fill="currentColor" /><rect x="4.6" y="8.4" width="2.8" height="1.6" rx="0.8" fill="currentColor" /></svg>
                  筛选{catalogActiveFilterCount > 0 && ` · ${catalogActiveFilterCount}`}
                </button>
                <button type="button" className={`m-chip${catalogScope === "families" ? " m-chip--active" : ""}`} aria-pressed={catalogScope === "families"} onClick={() => commitArmoryFilters({ scope: "families" })}>按拍系 {filteredFamilies.length}</button>
                <button type="button" className={`m-chip${catalogScope === "models" ? " m-chip--active" : ""}`} aria-pressed={catalogScope === "models"} onClick={() => commitArmoryFilters({ scope: "models" })}>全部型号 {matchingCatalogRackets.length}</button>
              </div>
            </div>
            <section className="armory-overview" aria-label="拍库覆盖与数据说明">
              <div className="armory-overview__copy"><span>年鉴 × 六维深档</span><p>从拍系看产品定位，或直接浏览全部型号。每款都有六维雷达、官方规格、参数特点和同系差异。</p></div>
              <dl>
                <div><dt>品牌</dt><dd>{catalogBrands.length}</dd></div>
                <div><dt>拍系</dt><dd>{catalogFamilies.length}</dd></div>
                <div><dt>型号</dt><dd>{deepRackets.length}</dd></div>
              </dl>
              <small>核验于 {catalogVerifiedAt} · 排除儿童拍、握把尺寸与纯配色重复 SKU</small>
            </section>

            <section className={`brand-index${catalogSearch.trim() ? " brand-index--m-searching" : ""}`} aria-labelledby="brand-index-title">
              <div className="section-bar"><div><p>Brand Index</p><h2 id="brand-index-title">选择品牌</h2></div><span className="brand-index__current">{catalogBrand === "全部" ? "正在浏览全部品牌" : `当前 · ${catalogBrand}`}</span></div>
              <div className="brand-index__grid" role="group" aria-label="选择球拍品牌">
                <button className="brand-index__all" aria-pressed={catalogBrand === "全部"} onClick={() => selectCatalogBrand("全部", true)}>
                  <span className="brand-logo brand-logo--all" aria-hidden="true"><i /><i /><i /></span><b>全部品牌</b><small>{catalogFamilies.length} 拍系 · {catalogModelCount} 型号</small><em>ALL</em>
                </button>
                {catalogBrandStats.map((item) => (
                  <button key={item.brand} aria-pressed={catalogBrand === item.brand} onClick={() => selectCatalogBrand(item.brand, true)} style={{ "--brand-accent": catalogBrandProfile(item.brand)?.accent ?? "var(--accent)" } as CSSProperties}>
                    <BrandLogo brand={item.brand} /><b>{item.brand}</b><small>{item.families} 拍系 · {item.models} 型号</small><em>{item.newest || "未注明"}</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="catalog-workbench" ref={catalogBrowseRef} aria-label="球拍库浏览控制台">
              <div className="catalog-controlbar">
                <div className="library-scope-switch" role="group" aria-label="选择浏览层级">
                  <button aria-pressed={catalogScope === "families"} onClick={() => commitArmoryFilters({ scope: "families" })}><b>按拍系</b><span>{filteredFamilies.length}</span></button>
                  <button aria-pressed={catalogScope === "models"} onClick={() => commitArmoryFilters({ scope: "models" })}><b>全部型号</b><span>{matchingCatalogRackets.length}</span></button>
                </div>
                <label className="app-search" htmlFor="catalog-search"><span className="sr-only">搜索品牌、拍系、代际或具体型号</span><span aria-hidden="true">⌕</span><input ref={catalogSearchRef} id="catalog-search" type="search" inputMode="search" enterKeyHint="search" autoComplete="off" spellCheck={false} aria-describedby="catalog-result-summary" value={catalogSearch} onChange={(event) => updateCatalogSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); submitCatalogSearch(); } else if (event.key === "Escape" && catalogSearch) { event.preventDefault(); clearCatalogSearch(); } }} placeholder={catalogScope === "families" ? "搜索品牌或拍系，例如 Blade" : "搜索具体型号，例如 Yonex 100L"} /><button onClick={clearCatalogSearch} aria-label="清除搜索" hidden={!catalogSearch}>×</button></label>
                <button className="catalog-filter-trigger" aria-expanded={catalogFiltersOpen} aria-controls="catalog-filter-panel" onClick={() => setCatalogFiltersOpen((open) => !open)}><span aria-hidden="true">≡</span><b>筛选</b>{catalogActiveFilterCount > 0 && <i>{catalogActiveFilterCount}</i>}</button>
                <label className="catalog-sort" htmlFor="catalog-sort"><span className="sr-only">拍库排序</span><select id="catalog-sort" value={catalogSort} onChange={(event) => commitArmoryFilters({ sort: event.target.value as CatalogSort })}>{catalogSortOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              </div>
              {catalogFiltersOpen && (
                <>
                  <button type="button" className="catalog-filter-overlay m-only" aria-label="关闭筛选面板" onClick={() => setCatalogFiltersOpen(false)} />
                  <div className="catalog-filter-panel" id="catalog-filter-panel" role="region" aria-label="筛选球拍库">
                    <span className="catalog-filter-panel__handle m-only" aria-hidden="true" />
                    <div className="catalog-filter-panel__header"><div><span>精确筛选</span><b>{catalogBrand === "全部" ? "全部品牌" : catalogBrand}</b></div><button onClick={() => setCatalogFiltersOpen(false)} aria-label="收起筛选面板">完成</button></div>
                    <div className="catalog-filter-panel__grid">
                      <fieldset><legend>球拍类型</legend><div className="catalog-type-options">{catalogTypes.map((item) => <button key={item} type="button" aria-pressed={catalogType === item} onClick={() => commitArmoryFilters({ type: item })}>{item === "全部" ? "全部" : `${item}型`}</button>)}</div></fieldset>
                      <label><span>产品代际</span><select value={catalogGeneration} onChange={(event) => commitArmoryFilters({ generation: event.target.value as CatalogGeneration })}>{catalogGenerationsForBrand.map((item) => <option key={item}>{item}</option>)}</select><small>{catalogBrand === "全部" ? "选择品牌后仅显示该品牌代际" : `${catalogBrand} 的现行拍系代际`}</small></label>
                      <label><span>发行时间</span><select value={catalogReleaseYear} onChange={(event) => commitArmoryFilters({ releaseYear: event.target.value as CatalogReleaseYear })}>{catalogReleaseYearOptions.map((item) => <option key={item}>{item}</option>)}</select><small>{catalogScope === "families" ? "按拍系公开发行时间" : "按具体型号发行时间"}</small></label>
                    </div>
                    <div className="catalog-filter-panel__mgroups m-only">
                      <p>品牌</p>
                      <div>{armoryFilterConfig.brands.map((brand) => <button type="button" key={brand} className={`m-chip${catalogBrand === brand ? " m-chip--active" : ""}`} aria-pressed={catalogBrand === brand} onClick={() => selectCatalogBrand(brand)}>{brand === "全部" ? "全部品牌" : brand}</button>)}</div>
                      <p>拍系类型</p>
                      <div>{catalogTypes.map((item) => <button type="button" key={item} className={`m-chip${catalogType === item ? " m-chip--active" : ""}`} aria-pressed={catalogType === item} onClick={() => commitArmoryFilters({ type: item })}>{item === "全部" ? "全部" : `${item}型`}</button>)}</div>
                      {catalogBrand !== "全部" && (
                        <>
                          <p>产品代际 <small>· {catalogBrand} 现行拍系</small></p>
                          <div>{catalogGenerationsForBrand.map((item) => <button type="button" key={item} className={`m-chip${catalogGeneration === item ? " m-chip--active" : ""}`} aria-pressed={catalogGeneration === item} onClick={() => commitArmoryFilters({ generation: item })}>{item}</button>)}</div>
                        </>
                      )}
                      <p>发布年份 <small>· 按拍系当代</small></p>
                      <div>{catalogReleaseYearOptions.map((item) => <button type="button" key={item} className={`m-chip${catalogReleaseYear === item ? " m-chip--active" : ""}`} aria-pressed={catalogReleaseYear === item} onClick={() => commitArmoryFilters({ releaseYear: item })}>{item}</button>)}</div>
                      <p>排序</p>
                      <div>{catalogSortOptions.map((item) => <button type="button" key={item} className={`m-chip${catalogSort === item ? " m-chip--active" : ""}`} aria-pressed={catalogSort === item} onClick={() => commitArmoryFilters({ sort: item })}>{item}</button>)}</div>
                    </div>
                    {catalogActiveFilterCount > 0 && <button className="catalog-filter-panel__clear" onClick={clearCatalogFacets}>清除全部筛选</button>}
                  </div>
                </>
              )}
              {catalogActiveFilterCount > 0 && (
                <div className="catalog-active-filters" aria-label="当前已启用筛选">
                  <span>已选</span>
                  {catalogBrand !== "全部" && <button onClick={() => selectCatalogBrand("全部")} aria-label={`移除品牌筛选 ${catalogBrand}`}>{catalogBrand}<i aria-hidden="true">×</i></button>}
                  {catalogType !== "全部" && <button onClick={() => commitArmoryFilters({ type: "全部" })} aria-label={`移除类型筛选 ${catalogType}型`}>{catalogType}型<i aria-hidden="true">×</i></button>}
                  {catalogGeneration !== "全部代际" && <button onClick={() => commitArmoryFilters({ generation: "全部代际" })} aria-label={`移除代际筛选 ${catalogGeneration}`}>{catalogGeneration}<i aria-hidden="true">×</i></button>}
                  {catalogReleaseYear !== "全部年份" && <button onClick={() => commitArmoryFilters({ releaseYear: "全部年份" })} aria-label={`移除发行筛选 ${catalogReleaseYear}`}>{catalogReleaseYear}<i aria-hidden="true">×</i></button>}
                  <button className="catalog-active-filters__clear" onClick={clearCatalogFacets}>全部清除</button>
                </div>
              )}
              <div id="catalog-result-summary" ref={catalogSummaryRef} className="library-summary catalog-result-summary" aria-live="polite" tabIndex={-1}><p>{catalogScope === "models" ? <><b>{matchingCatalogRackets.length}</b> 个具体型号 · 可直接打开深档或加入对比{catalogSearch.trim() && ` · 搜索“${catalogSearch.trim()}”`}</> : <><b>{filteredFamilies.length}</b> 个拍系 · {visibleCatalogModelCount} 份型号深档{catalogSearch.trim() && ` · 搜索“${catalogSearch.trim()}”`}{catalogReleaseYear !== "全部年份" && "（按拍系发行时间）"}</>}</p><div className="library-summary__actions"><button onClick={copyArmoryLink}>复制当前视图</button>{(catalogActiveFilterCount > 0 || catalogSearch) && <button onClick={() => clearCatalogFilters(true)}>全部清除</button>}</div></div>
            </section>

            {catalogScope === "models" && matchingCatalogRackets.length > 0 ? (
              <div className="catalog-model-results" id="catalog-model-results" role="region" aria-label="具体型号浏览结果">
                {matchingCatalogRackets.slice(0, catalogResultLimit).map((racket) => (
                  <article className="catalog-model-result" key={racket.id}>
                    <button className="catalog-model-result__main" data-focus-key={`catalog-model-open-${racket.id}`} onClick={() => openRacket(racket.id)} aria-label={`查看 ${racket.model} 深度档案`}>
                      <RacketPhoto racket={racket} variant="thumb" />
                      <span><small>{racket.brand} · {racket.familyName} · {racket.generation}</small><strong>{racket.model}</strong><em>{racket.stages.join(" · ")} / {racket.styles.join(" · ")}</em><i>打开深度档案 <span aria-hidden="true">›</span></i></span>
                      <MiniRadar racket={racket} />
                    </button>
                    <dl className="catalog-model-result__facts">
                      <div><dt>拍面</dt><dd>{formatNumberSpec(officialHead(racket), "in²")}</dd></div>
                      <div><dt>重量</dt><dd>{formatNumberSpec(officialWeight(racket), "g")}</dd></div>
                      <div><dt>线床</dt><dd>{officialPattern(racket) ?? "—"}</dd></div>
                    </dl>
                    <div className="catalog-model-result__tags"><RacketSpecTags racket={racket} compact showSpecs={false} /></div>
                    <div className="catalog-model-result__actions"><button data-focus-key={`catalog-model-compare-${racket.id}`} onClick={() => requestCompare(racket.id)} aria-pressed={compareIds.includes(racket.id)} aria-label={!compareIds.includes(racket.id) && compareIds.length >= 3 ? `管理已满的球拍对比，当前无法加入 ${racket.model}` : `${compareIds.includes(racket.id) ? "移出" : "加入"} ${racket.model} 对比`}>{compareIds.includes(racket.id) ? "✓ 已对比" : compareIds.length >= 3 ? "管理 3/3" : "+ 加入对比"}</button>{racket.familyId && <button data-focus-key={`catalog-model-family-${racket.id}`} onClick={() => openFamily(racket.familyId as string, racket.id)} aria-label={`打开 ${racket.familyName} 拍系并定位 ${racket.model}`}>查看所属拍系 <span aria-hidden="true">›</span></button>}</div>
                  </article>
                ))}
                {matchingCatalogRackets.length > catalogResultLimit && (
                  <button
                    className="catalog-model-results__more app-button app-button--soft"
                    onClick={showMoreCatalogResults}
                    aria-controls="catalog-model-results"
                    aria-label={`继续显示型号，当前已显示 ${catalogResultLimit} 个，共 ${matchingCatalogRackets.length} 个`}
                  >
                    继续显示 {Math.min(24, matchingCatalogRackets.length - catalogResultLimit)} 个 <span aria-hidden="true">↓</span>
                  </button>
                )}
              </div>
            ) : catalogScope === "families" && filteredFamilies.length > 0 ? (
              <div className="catalog-family-grid">
                {filteredFamilies.map((family) => <CatalogFamilyCard key={family.id} family={family} onOpen={() => openFamily(family.id)} />)}
              </div>
            ) : (
              <div className="app-empty"><span aria-hidden="true">⌕</span><h2>{catalogScope === "models" ? "没有找到对应型号" : "没有符合条件的拍系"}</h2><p>{catalogSearch.trim() ? `当前“${catalogSearch.trim()}”与筛选条件没有交集，可以减少关键词或清除筛选。` : "当前品牌、类型、代际与发行年份组合没有结果，可以清除条件查看完整拍库。"}</p><button className="app-button app-button--primary" onClick={catalogSearch.trim() && catalogActiveFilterCount > 0 ? clearCatalogFacets : catalogSearch.trim() ? clearCatalogSearch : () => clearCatalogFilters(true)}>{catalogSearch.trim() && catalogActiveFilterCount > 0 ? "清除筛选条件" : catalogSearch.trim() ? "清除搜索" : "清除筛选"}</button></div>
            )}
          </section>
        )}

        {activeView === "tour" && (
          <section className="app-view tour-view" aria-labelledby="tour-title">
            <ViewTitle id="tour-title" eyebrow={`排名快照 · ${tourRankAsOf}`} title="球星拍房" />
            <section className="tour-intro" aria-labelledby="tour-intro-title">
              <div className="tour-intro__copy">
                <p>Player stories · Racket routes</p>
                <h2 id="tour-intro-title">先认识球员，<br />再读懂手里的那把拍。</h2>
                <span>真实人物照片、打法侧写与品牌公开用拍映射，串成一条可继续比较的选拍路径。</span>
              </div>
              <dl className="tour-intro__stats">
                <div><dt>球星</dt><dd>16</dd><small>ATP + WTA 前 8</small></div>
                <div><dt>真实照片</dt><dd>16</dd><small>本地化 · 来源可追溯</small></div>
                <div><dt>深档落点</dt><dd>100%</dd><small>每位都可进入拍库</small></div>
              </dl>
              <p className="tour-intro__honesty"><span aria-hidden="true">◎</span><b>职业比赛拍 ≠ 零售规格</b><small>这里展示品牌公开关联与拍库落点，不把涂装或零售参数冒充比赛拍实测。</small></p>
            </section>

            <div className="tour-commandbar">
              <div
                className="tour-switch"
                role="tablist"
                aria-label="选择巡回赛"
                onKeyDown={(event) => moveHorizontalTab(event, ["ATP", "WTA"] as const, tourFilter, commitTourFilter)}
              >
                {(["ATP", "WTA"] as Tour[]).map((tour) => (
                  <button
                    key={tour}
                    id={`tour-tab-${tour}`}
                    role="tab"
                    data-focus-key={`tour-filter-${tour}`}
                    aria-selected={tourFilter === tour}
                    aria-controls="tour-ranking-panel"
                    tabIndex={tourFilter === tour ? 0 : -1}
                    onClick={() => commitTourFilter(tour)}
                  >
                    <b>{tour}</b><span>世界前 8</span>
                  </button>
                ))}
              </div>
              <div className="tour-commandbar__summary">
                <span><b>{tourFilter} Top 8</b><small>{visibleExactMappings} 个型号级 · {visibleFamilyMappings} 个拍系级/参考{visibleEquivalentMappings > 0 && ` · ${visibleEquivalentMappings} 个基础等效`}</small></span>
                <div><button onClick={copyTourLink} aria-label={`复制 ${tourFilter} 世界前 8 用拍榜单链接`}>复制榜单</button><a href={tourSources[tourFilter]} target="_blank" rel="noreferrer" aria-label={`${tourFilter} 排名来源，新标签页打开`}>排名源 ↗</a></div>
              </div>
            </div>

            {tourLeader ? (
              <section id="tour-ranking-panel" className="tour-ranking" role="tabpanel" aria-labelledby={`tour-tab-${tourFilter}`}>
                <div className="tour-rank-nav">
                  <p><span>快速定位</span><small>点击头像跳到球员档案</small></p>
                  <div>
                    {visibleTourPlayers.map((player) => (
                      <button key={player.id} onClick={() => openTourPlayer(player.id)} aria-label={`定位到 ${player.tour} 第 ${player.rank} 位 ${player.nameZh}`}>
                        <span><TourPlayerPortrait player={player} decorative /></span>
                        <b>#{player.rank}</b><small>{player.nameZh.replace(/·.*/u, "")}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="section-bar tour-ranking__heading"><div><p>{tourFilter} ranking</p><h2>{tourFilter} 世界前 8 · 球员与关联拍</h2></div><span className="tour-updated">截至 {tourRankAsOf}</span></div>
                <ol className="tour-ranking-list">
                  {visibleTourPlayers.map((player, index) => (
                    <li key={player.id} className={index === 0 ? "tour-ranking-list__leader" : undefined}>
                      <TourPlayerCard
                        player={player}
                        leader={index === 0}
                        onOpenFamily={openFamily}
                        onOpenRacket={openRacket}
                        onToggleCompare={requestCompare}
                        onShare={copyTourPlayerLink}
                        syncScore={tourPlayerSyncById.get(player.id)?.syncScore}
                        compared={Boolean(tourRacketTargetId(player.id) && compareIds.includes(tourRacketTargetId(player.id) as string))}
                        compareFull={compareIds.length >= 3}
                      />
                    </li>
                  ))}
                </ol>
                <details className="tour-method">
                  <summary>数据口径、映射等级与照片来源 <span aria-hidden="true">＋</span></summary>
                  <div>
                    <p>排名为 {tourRankAsOf} 快照。球员照片来自 Wikimedia Commons，并在每张卡内保留作者与许可；打法侧写为拍库编辑观察，不是球员或巡回赛官方评级。</p>
                    <ul>
                      {Object.entries(tourMappingMeta).map(([mapping, meta]) => <li key={mapping}><span className={`tour-mapping-badge tour-mapping-badge--${meta.tone}`}>{meta.label}</span><b>{mapping}</b><small>{meta.detail}</small></li>)}
                    </ul>
                  </div>
                </details>
              </section>
            ) : (
              <div className="app-empty" role="status"><span aria-hidden="true">★</span><h2>{tourFilter} 榜单正在更新</h2><p>本组数据暂不可用，请稍后再试或切换另一巡回赛。</p></div>
            )}
          </section>
        )}

        {activeView === "compare" && (
          <section className="app-view compare-view" aria-labelledby="compare-title">
            <ViewTitle
              id="compare-title"
              eyebrow={finalDecisionRacket ? `最终选择 · ${finalDecisionRacket.model}` : compared.length > 0 ? `${compared.length}/3 个候选` : "从处方到试打结论"}
              title="选拍决策室"
              action={(
                <div className="compare-title-actions">
                  <button className="text-action" onClick={saveDecisionRoom}>{decisionStorageStatus === "loading" ? "正在读取…" : "保存到本机"}</button>
                  {compared.length > 0 && <button className="text-action" onClick={copyCompareLink} aria-label={`复制当前 ${compared.length} 把候选球拍的决策链接`}>分享</button>}
                  {compared.length > 0 && <button className="text-action" onClick={clearComparison} aria-label={`清空当前 ${compared.length} 把决策候选`}>清空</button>}
                </div>
              )}
            />
            <section className="decision-workflow" aria-labelledby="decision-workflow-title">
              <div className="decision-workflow__heading"><div><span>Decision loop</span><h2 id="decision-workflow-title">把参数变成可执行的换拍决定</h2></div><small>{decisionStorageStatus === "loading" ? "正在读取本机记录" : decisionStorageStatus === "available" ? "当前浏览器自动保存" : "仅在本页临时保留"}</small></div>
              <ol>
                <li className={prescriptionBaseline ? "is-complete" : ""}><i>{prescriptionBaseline ? "✓" : "1"}</i><span><b>当前球拍</b><small>{prescriptionBaseline?.model ?? "可跳过"}</small></span></li>
                <li className={compared.length >= 2 ? "is-complete" : ""}><i>{compared.length >= 2 ? "✓" : "2"}</i><span><b>收敛候选</b><small>{compared.length}/3 把</small></span></li>
                <li className={currentDecisionFeedback.length > 0 ? "is-complete" : ""}><i>{currentDecisionFeedback.length > 0 ? "✓" : "3"}</i><span><b>完成试打</b><small>{currentDecisionFeedback.length} 条反馈</small></span></li>
                <li className={finalDecisionRacket ? "is-complete" : ""}><i>{finalDecisionRacket ? "✓" : "4"}</i><span><b>作出选择</b><small>{finalDecisionRacket?.model ?? "等待结论"}</small></span></li>
              </ol>
              <PrescriptionBaselinePicker value={prescriptionBaselineId} onChange={changePrescriptionBaseline} compact />
              {savedDecisionRoom && savedDecisionSlotIds.length > 0 && compareIds.length === 0 && <button className="decision-workflow__restore" onClick={loadSavedDecision}>载入上次保存的 {savedDecisionSlotIds.length} 把候选 <span aria-hidden="true">›</span></button>}
            </section>
            {compared.length === 0 ? (
              <div className="compare-empty-app">
                <div className="compare-empty-app__icon" aria-hidden="true">⇄</div>
                <h2>先建立 2–3 把决策候选</h2>
                <p>从换拍处方或完整拍库加入候选，再用重叠雷达、试打状态与备注逐步收敛。</p>
                <button className="app-button app-button--primary" data-compare-browse onClick={browseForCompare}>去球拍库选择</button>
                <small className="compare-suggestions__label">{hasCompletedMatch ? "按你的换拍处方快速开始" : "也可以先用三种典型取向体验决策流程"}</small>
                <div className="compare-suggestions">
                  {compareSuggestionRackets.map((racket) => <button key={racket.id} onClick={() => toggleCompare(racket.id)} aria-label={`加入 ${racket.model} 决策室`}><RacketPhoto racket={racket} variant="thumb" /><span><b>{racket.model}</b><small>+ 候选</small></span></button>)}
                </div>
              </div>
            ) : (
              <div className="compare-app-loaded">
                {pendingCompareRacket && (
                  <div className="compare-guidance compare-guidance--replace">
                    <span>待换入</span>
                    <p role="status" aria-live="polite">选择下方一把球拍，将它原位换成 <b>{pendingCompareRacket.model}</b>。</p>
                    <button onClick={cancelPendingCompare}>取消换入并返回</button>
                  </div>
                )}
                {compared.length === 1 && (duelActive && duelOpponent
                  ? <div className="compare-guidance compare-guidance--duel"><span>应战</span><p role="status">收到球拍对决：对方选择了 <b>{duelOpponent.model}</b>。选一把球拍应战，六维逐维分出高下。</p><button onClick={browseForCompare}>去拍库选拍应战</button></div>
                  : <div className="compare-guidance"><span>还差一把</span><p role="status">加入第二把后，六维轮廓与规格差异才会形成真正的重叠对比。</p><button onClick={browseForCompare}>去拍库添加</button></div>)}
                {availableCompareSuggestions.length > 0 && compared.length < 3 && (
                  <section className="compare-continue" aria-labelledby="compare-continue-title">
                    <div><small>{hasCompletedMatch ? "按你的打法" : "典型取向"}</small><h2 id="compare-continue-title">快速补齐候选</h2></div>
                    <div className="compare-suggestions">
                      {availableCompareSuggestions.map((racket) => <button key={racket.id} onClick={() => toggleCompare(racket.id)} aria-label={`加入 ${racket.model} 决策室`}><RacketPhoto racket={racket} variant="thumb" /><span><b>{racket.model}</b><small>+ 候选</small></span></button>)}
                    </div>
                  </section>
                )}
                <div
                  className="compare-panel-tabs"
                  role="tablist"
                  aria-label="切换决策室内容"
                  onKeyDown={(event) => moveHorizontalTab(event, comparePanelOrder, comparePanel, setComparePanel)}
                >
                  {([
                    ["overview", "概览", compared.length >= 2 ? "雷达与结论" : "候选轮廓"],
                    ["specs", "规格", "完整参数"],
                    ["trial", "试打", currentDecisionFeedback.length > 0 ? `${currentDecisionFeedback.length} 条记录` : "状态与备注"],
                  ] as const).map(([panel, label, hint]) => <button id={`compare-tab-${panel}`} key={panel} role="tab" tabIndex={comparePanel === panel ? 0 : -1} aria-selected={comparePanel === panel} aria-controls="compare-panel-active" onClick={() => setComparePanel(panel)}><b>{label}</b><small>{hint}</small></button>)}
                </div>
                <div id="compare-panel-active" role="tabpanel" aria-labelledby={`compare-tab-${comparePanel}`} className="compare-panel-surface">
                <div className={`compare-product-grid compare-product-grid--${comparePanel}`}>
                  {compareSlotRackets.map(({ slot, racket }) => {
                    if (racket) {
                      const candidate = decisionCandidates[racket.id] ?? { status: "candidate" as const, note: "" };
                      return (
                        <article key={racket.id} className={`decision-candidate decision-candidate--${candidate.status}`} data-compare-slot={slot}>
                          <span className="decision-candidate__status">{decisionStatusLabels[candidate.status]}</span>
                          {duelActive && slot === 0 && racket.id === duelOpponentId && <span className="compare-duel-opponent">对方战拍</span>}
                          <button className={`compare-product-grid__remove${pendingCompareRacket ? " is-replace" : ""}`} data-compare-remove-id={racket.id} onClick={() => pendingCompareRacket ? replacePendingCompare(racket.id) : toggleCompare(racket.id)} aria-label={pendingCompareRacket ? `用 ${pendingCompareRacket.model} 替换 ${racket.model}` : `从决策室移除 ${racket.model}`}>{pendingCompareRacket ? "⇄" : "×"}</button>
                          <button className="compare-product-grid__main" data-focus-key={`compare-slot-${slot}-${racket.id}`} disabled={Boolean(pendingCompareRacket)} onClick={() => openRacket(racket.id)} aria-label={pendingCompareRacket ? `请先选择是否用 ${pendingCompareRacket.model} 替换 ${racket.model}` : `${duelActive && slot === 0 && racket.id === duelOpponentId ? "对方战拍，" : ""}查看 ${racket.model} 深度档案`} title={pendingCompareRacket ? "请先完成或取消本次替换" : undefined}><RacketPhoto racket={racket} variant="thumb" /><span>{racket.brand}</span><h3>{racket.model}</h3></button>
                          {comparePanel === "trial" ? (
                            <>
                              <div className="decision-candidate__tools">
                                <label><span>决策状态</span><select value={candidate.status} disabled={Boolean(pendingCompareRacket)} onChange={(event) => updateDecisionCandidateStatus(racket.id, event.target.value as DecisionCandidateStatus)} aria-label={`${racket.model} 的决策状态`}>{Object.entries(decisionStatusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label>
                                <button type="button" onClick={() => openTrialFeedback(racket.id)} disabled={Boolean(pendingCompareRacket)}>记录试打</button>
                              </div>
                              <label className="decision-candidate__note"><span>一句话判断</span><textarea value={candidate.note} maxLength={120} rows={2} placeholder="例如：发球更省力，但反手需要适应" onChange={(event) => updateDecisionCandidateNote(racket.id, event.target.value)} aria-label={`${racket.model} 的决策备注`} /></label>
                            </>
                          ) : (
                            <div className="decision-candidate__quick-specs"><span>{formatNumberSpec(officialWeight(racket), "g")}</span><span>{formatNumberSpec(officialHead(racket), "in²")}</span><span>{officialPattern(racket) ?? "—"}</span></div>
                          )}
                        </article>
                      );
                    }
                    return slot === firstEmptyCompareSlot
                      ? <button key={slot} className="compare-add-slot" onClick={browseForCompare} aria-label="从球拍库添加下一个决策候选"><span>＋</span><b>候选 {slot + 1} · 添加</b></button>
                      : <div key={slot} className="compare-add-slot compare-add-slot--queued" role="note" aria-label={`候选位 ${slot + 1}，将在前一空位加入后开放`}><span>·</span><b>候选 {slot + 1} · 待填</b></div>;
                  })}
                </div>

                {comparePanel === "trial" && feedbackRacketId && deepRacketById.get(feedbackRacketId) && (
                  <form className="trial-feedback-card" onSubmit={(event) => { event.preventDefault(); submitTrialFeedback(); }}>
                    <header>
                      <div><span>Trial log</span><h2 id="trial-feedback-title" tabIndex={-1}>记录 {deepRacketById.get(feedbackRacketId)?.model} 试打</h2><p>凭实际击球感受打分，系统会把结论带回候选状态。</p></div>
                      <button type="button" onClick={closeTrialFeedback} aria-label="关闭试打记录">×</button>
                    </header>
                    <div className="trial-feedback-card__ratings">
                      {(["control", "power", "comfort"] as const).map((metric) => (
                        <fieldset key={metric}>
                          <legend>{trialMetricLabels[metric]} <b>{trialFeedbackDraft[metric]}/5</b></legend>
                          <div role="radiogroup" aria-label={`${trialMetricLabels[metric]}评分`}>
                            {[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" role="radio" tabIndex={trialFeedbackDraft[metric] === score ? 0 : -1} aria-checked={trialFeedbackDraft[metric] === score} onKeyDown={(event) => moveRating(event, trialFeedbackDraft[metric], (value) => setTrialFeedbackDraft((current) => ({ ...current, [metric]: value })))} onClick={() => setTrialFeedbackDraft((current) => ({ ...current, [metric]: score }))}>{score}</button>)}
                          </div>
                        </fieldset>
                      ))}
                    </div>
                    <div className="trial-feedback-card__details">
                      <label><span>本次结论</span><select value={trialFeedbackDraft.verdict} onChange={(event) => setTrialFeedbackDraft((current) => ({ ...current, verdict: event.target.value as TrialFeedbackDraft["verdict"] }))}>{trialVerdicts.map((verdict) => <option key={verdict}>{verdict}</option>)}</select></label>
                      <label><span>场上感受</span><textarea value={trialFeedbackDraft.note} maxLength={240} rows={3} placeholder="记录底线、发球、网前或手臂负担的真实感受" onChange={(event) => setTrialFeedbackDraft((current) => ({ ...current, note: event.target.value }))} /></label>
                    </div>
                    <footer><small>试打记录仅保存在当前浏览器。</small><div><button type="button" onClick={closeTrialFeedback}>取消</button><button className="app-button app-button--primary" type="submit">保存试打</button></div></footer>
                  </form>
                )}

                {comparePanel === "overview" && (
                  <>
                    {duelVerdicts && duelOpponent && duelChallenger && (
                      <section className="compare-duel-arena" aria-labelledby="compare-duel-arena-title">
                        <div className="compare-duel-arena__title"><span>好友对决</span><h2 id="compare-duel-arena-title">六维战报</h2><small>微小分差按接近处理，不代表实际胜负</small></div>
                        <div className="compare-duel-arena__players">
                          <div><RacketPhoto racket={duelOpponent} variant="thumb" /><span>守擂</span><b>{duelOpponent.model}</b><strong>{duelVerdicts.aWins}</strong></div>
                          <i>VS</i>
                          <div><RacketPhoto racket={duelChallenger} variant="thumb" /><span>应战</span><b>{duelChallenger.model}</b><strong>{duelVerdicts.bWins}</strong></div>
                        </div>
                        <p className="compare-duel-scoreline">{duelScoreSummary(duelVerdicts, duelOpponent.model, duelChallenger.model)}</p>
                      </section>
                    )}
                    <section className="compare-radar-card">
                      <div><p>六维轮廓</p><h2>{compared.length > 1 ? "重叠雷达图" : "单拍雷达图"}</h2><span>先看轮廓取舍，再到“规格”核对硬参数。</span></div>
                      <RadarChart chartRackets={compared} seriesSlots={compareSlots.map(({ slot }) => slot)} />
                    </section>

                    {compared.length >= 2 && (
                      <section className="compare-insights" aria-labelledby="compare-insights-title">
                        <div className="compare-insights__head"><div><p>白话解读</p><h2 id="compare-insights-title">最值得注意的差异</h2></div><span>{6 - compareInsights.excludedLabels.length}/6 项规格可比较</span></div>
                        {compareInsights.status === "no-comparable-specs"
                          ? <p className="compare-insights__empty">当前候选没有足够的共同公开规格，无法生成可靠解读。</p>
                          : compareInsights.status === "no-significant-diff"
                            ? <p className="compare-insights__empty">已公开且可比较的 {6 - compareInsights.excludedLabels.length} 项规格未达到显著差异阈值。</p>
                            : <ul className="compare-insights__list">{compareInsights.insights.map((insight, index) => <li key={insight.key}><span><b>0{index + 1}</b><strong>{compareDiffLabels[insight.key]}</strong></span><p>{insight.sentence.replace("基于规格推断。", "")}</p></li>)}</ul>}
                        {compared.length === 3 && <p className="compare-insights__scope">三拍对比按每个维度中差距最大的两把生成解读。</p>}
                        {compareInsights.excludedLabels.length > 0 && <p className="compare-insights__excluded">未参与解读：{compareInsights.excludedLabels.join("、")}（官网未公开或无法归一）。</p>}
                        <p className="compare-insights__basis">{HONESTY_NOTES.specInference} · 进入“规格”可查看原始数值</p>
                      </section>
                    )}
                    {compared.length >= 2 && <p className="compare-honesty-note">{HONESTY_NOTES.compare}</p>}
                  </>
                )}

                {comparePanel === "specs" && (
                  <>
                    <p className="compare-scroll-hint" id="compare-scroll-hint">横向滑动或使用方向键，查看全部球拍参数</p>
                    <div ref={compareTableScrollRef} className="compare-spec-table-scroll" role="region" aria-label="球拍规格对比表" aria-describedby="compare-scroll-hint" tabIndex={compareTableScrollable ? 0 : -1}>
                      <table className="compare-spec-table">
                        <thead><tr><th scope="col">属性</th>{compareSlotRackets.map(({ slot, racket }) => <th scope="col" className={racket ? undefined : "is-empty"} key={slot}>{racket?.model ?? `空槽 ${slot + 1}`}</th>)}</tr></thead>
                        <tbody>{comparisonRows.map((row) => {
                          const isMaxDiffRow = row.rowKind === "spec" && compareInsights.highlightKey === row.key;
                          const rowVerdict = row.rowKind === "score" && row.scoreKey && duelVerdicts ? duelVerdicts.verdicts[row.scoreKey] : null;
                          return <tr key={row.key} className={isMaxDiffRow ? "is-max-diff" : undefined}><th scope="row">{row.label}{isMaxDiffRow && <i className="compare-max-diff-badge">差异最大</i>}</th>{compareSlotRackets.map(({ slot, racket }) => {
                            const duelSide = rowVerdict && racket ? racket.id === duelOpponent?.id ? "a" : racket.id === duelChallenger?.id ? "b" : null : null;
                            const duelBadge = duelSide && rowVerdict === "tie"
                              ? <i className="compare-duel-badge compare-duel-badge--tie">接近</i>
                              : duelSide && rowVerdict === duelSide
                                ? <i className={`compare-duel-badge compare-duel-badge--${duelSide}`}>{duelSide === "a" ? "守擂略高" : "应战略高"}</i>
                                : null;
                            return <td key={slot} className={racket ? undefined : "is-empty"}>{racket ? row.value(racket) : "—"}{duelBadge}</td>;
                          })}</tr>;
                        })}</tbody>
                      </table>
                    </div>
                    <div className="compare-buy-grid" style={{ "--compare-count": 3 } as CSSProperties}>
                      {compareSlotRackets.map(({ slot, racket }) => racket
                        ? <a key={slot} href={racket.buyUrl} target="_blank" rel="noreferrer" aria-label={`前往 ${racket.brand} 官网查看 ${racket.model}，${purchaseLinkStatusLabel(racket.id)}，新标签页打开`}><span>前往 {racket.brand} 官网 <i aria-hidden="true">↗</i></span><PurchaseLinkBadge racketId={racket.id} compact /></a>
                        : <span className="compare-buy-grid__empty" key={slot}>空槽 {slot + 1}</span>)}
                    </div>
                    {compared.length >= 2 && <p className="compare-honesty-note">{HONESTY_NOTES.compare}</p>}
                  </>
                )}

                {comparePanel === "trial" && currentDecisionFeedback.length > 0 && (
                  <section className="trial-feedback-history" aria-labelledby="trial-feedback-history-title">
                    <div><span>Trial history</span><h2 id="trial-feedback-history-title">最近试打记录</h2><small>用场上反馈校正参数判断</small></div>
                    <ol>{currentDecisionFeedback.slice(0, 6).map((item, index) => {
                      const racket = deepRacketById.get(item.racketId);
                      return <li key={item.id ?? `${item.racketId}-${index}`}><header><b>{racket?.model ?? "球拍"}</b><span>{item.verdict}</span></header><div><span>控制 {item.control}/5</span><span>出球 {item.power}/5</span><span>舒适 {item.comfort}/5</span></div>{item.note && <p>{item.note}</p>}<small>{item.createdAt ? new Date(`${item.createdAt.replace(" ", "T")}Z`).toLocaleDateString("zh-CN") : "刚刚记录"}</small></li>;
                    })}</ol>
                  </section>
                )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {!selected && !selectedFamily && activeView !== "compare" && compareIds.length > 0 && (
        <button className="compare-tray" onClick={() => goToView("compare")} aria-label={`打开选拍决策室，当前 ${compared.length}/3 把候选`}>
          <span className="compare-tray__photos">{compareSlotRackets.map(({ slot, racket }) => racket ? <RacketPhoto key={slot} racket={racket} variant="thumb" /> : <i key={slot}>+</i>)}</span>
          <span><b>决策 {compared.length}/3</b><small>比较差异并记录试打</small></span>
          <strong>继续 <span aria-hidden="true">›</span></strong>
        </button>
      )}

      <nav className="mobile-tabbar" aria-label="应用导航">
        {appTabs.map((tab) => (
          <button key={tab.id} aria-current={activeView === tab.id ? "page" : undefined} aria-label={tabAriaLabel(tab)} onClick={() => goToView(tab.id, "restore")}>
            <span aria-hidden="true"><TabIcon view={tab.id} /></span><b>{tab.label}</b>{tabBadge(tab.id) && <i aria-hidden="true">{tabBadge(tab.id)}</i>}
          </button>
        ))}
      </nav>

      {selectedFamily && (
        <div className="detail-backdrop" role="presentation" onPointerDown={closeFamily}>
          <section ref={familyDialogRef} className="family-inspector" role="dialog" aria-modal="true" aria-labelledby="family-inspector-title" onPointerDown={(event) => event.stopPropagation()} style={{ "--family-accent": familyTypeAccent[selectedFamily.type] } as CSSProperties}>
            <header className="family-inspector__header">
              <button data-dialog-close onClick={closeFamily} aria-label="关闭拍系详情">‹</button>
              <span>{selectedFamily.brand} · {selectedFamily.family}</span>
              <div className="inspector-header-actions"><button onClick={() => shareCurrentView(`${selectedFamily.brand} ${selectedFamily.family} 拍系`)} aria-label={`分享 ${selectedFamily.brand} ${selectedFamily.family} 拍系深链`}>分享</button><a href={selectedFamily.familyUrl} target="_blank" rel="noreferrer" aria-label={`前往 ${selectedFamily.brand} ${selectedFamily.family} 官网，新标签页打开`}>官网 ↗</a></div>
            </header>
            <div className="family-inspector__scroll" onScroll={(event) => persistFamilyScroll(event.currentTarget.scrollTop)}>
              <ProductGallery
                key={selectedFamily.id}
                images={familyGalleries[selectedFamily.id] ?? (selectedFamily.image ? [selectedFamily.image] : [])}
                alt={`${selectedFamily.brand} ${selectedFamily.family} ${selectedFamily.generation}`}
                accent={familyTypeAccent[selectedFamily.type]}
              />
              <header className="family-inspector__title">
                <div><span>{selectedFamily.type}型</span><span>{selectedFamily.status === "预告" ? "即将上市" : "现行拍系"}</span></div>
                <p>{selectedFamily.brand} · {selectedFamily.generation}</p>
                <h2 id="family-inspector-title">{selectedFamily.family}</h2>
                <strong>发行 {familyReleaseLabel(selectedFamily)}</strong>
                <p>{selectedFamily.summary}</p>
              </header>
              <dl className="family-inspector__overview">
                <div><dt>当前型号</dt><dd>{selectedFamily.models.length} 款</dd></div>
                <div><dt>定位 Type</dt><dd>{selectedFamily.type}</dd></div>
                <div><dt>代际</dt><dd>{selectedFamily.generation}</dd></div>
                <div><dt>数据核验</dt><dd>{catalogVerifiedAt}</dd></div>
              </dl>
              <section className="model-matrix" aria-labelledby="model-matrix-title">
                <div className="model-matrix__heading"><div><p>Variant matrix</p><h3 id="model-matrix-title">全系参数与六维雷达</h3></div><span>每项 = 官网数值 · 参数特点 · 本系中位差</span></div>
                <p className="model-matrix__scroll-hint" id={`model-matrix-scroll-hint-${selectedFamily.id}`}>{wideModelMatrix ? "深度档案固定在左侧；横向滑动或使用方向键查看完整规格" : "每张卡片顶部均可直接进入深度档案"}</p>
                <div className="model-matrix__scroll" role="region" aria-label={`${selectedFamily.brand} ${selectedFamily.family} 全系参数与六维雷达`} aria-describedby={`model-matrix-scroll-hint-${selectedFamily.id}`} tabIndex={wideModelMatrix ? 0 : -1} onScroll={(event) => persistFamilyMatrixScroll(event.currentTarget.scrollLeft)}>
                  <table>
                    <thead><tr><th scope="col">型号 / 档案</th><th scope="col">六维雷达</th><th scope="col">发行</th><th scope="col">拍面</th><th scope="col">重量</th><th scope="col">线床</th><th scope="col">平衡点</th><th scope="col">框厚</th><th scope="col">长度</th><th scope="col">对比 / 官网</th></tr></thead>
                    <tbody>
                      {selectedFamily.models.map((model, modelIndex) => {
                        const racketProfile = deepRacketById.get(catalogRacketId(selectedFamily, modelIndex)) as Racket;
                        return (
                          <tr key={`${selectedFamily.id}-${model.name}`} className={familyTargetRacketId === racketProfile.id ? "is-targeted" : undefined}>
                            <th scope="row" className="model-matrix__identity">
                              <button className="model-matrix__dossier" data-racket-id={racketProfile.id} data-focus-key={`family-dossier-${racketProfile.id}`} onClick={() => openRacket(racketProfile.id)} aria-label={`打开 ${model.name} 深度档案`}>
                                <strong>{model.name}</strong><span>查看深度档案 <span aria-hidden="true">›</span></span>
                              </button>
                              <p className="model-matrix__overview">{modelMatrixOverview(racketProfile)}</p>
                            </th>
                            <td className="model-matrix__radar-cell" data-label="六维雷达"><button className="model-matrix__radar-button" data-focus-key={`family-radar-${racketProfile.id}`} onClick={() => openRacket(racketProfile.id)} aria-label={`打开 ${model.name} 完整六维雷达`}><MiniRadar racket={racketProfile} /></button></td>
                            <td data-label="发行">{modelReleaseLabel(selectedFamily, model.releaseDate)}</td>
                            <td data-label="拍面"><ModelSpecValue racket={racketProfile} dimension="head" /></td>
                            <td data-label="重量"><ModelSpecValue racket={racketProfile} dimension="weight" /></td>
                            <td data-label="线床"><ModelSpecValue racket={racketProfile} dimension="pattern" /></td>
                            <td data-label="平衡点"><ModelSpecValue racket={racketProfile} dimension="balance" /></td>
                            <td data-label="框厚"><ModelSpecValue racket={racketProfile} dimension="beam" /></td>
                            <td data-label="长度"><ModelSpecValue racket={racketProfile} dimension="length" /></td>
                            <td data-label="操作">
                              <div className="model-matrix__actions">
                                <button data-focus-key={`family-compare-${racketProfile.id}`} onClick={() => requestCompare(racketProfile.id)} aria-pressed={compareIds.includes(racketProfile.id)} aria-label={!compareIds.includes(racketProfile.id) && compareIds.length >= 3 ? `管理已满的球拍对比，当前无法加入 ${model.name}` : `${compareIds.includes(racketProfile.id) ? "移出" : "加入"} ${model.name} 对比`}>{compareIds.includes(racketProfile.id) ? "✓ 已对比" : compareIds.length >= 3 ? "管理 3/3" : "+ 对比"}</button>
                                <a href={model.url} target="_blank" rel="noreferrer" aria-label={`前往官网查看 ${model.name}，新标签页打开`}>官网资料 ↗</a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              {selectedFamily.note && <p className="family-inspector__note"><b>数据说明</b>{selectedFamily.note}</p>}
              <p className="family-inspector__source">规格与发行信息来自品牌官网；参数特点是基于公开硬规格的导向归纳，静态平衡不等于挥重，也不替代实际试打。表内六维雷达为拍库相对评估；不同国家/地区在售款可能不同。</p>
            </div>
            <footer className="family-inspector__actions"><span><b>{selectedFamily.models.length} 款</b><small>官网现行成人型号</small></span>{compareIds.length > 0 && <button className="app-button app-button--soft" onClick={() => goToView("compare")}>查看对比 {compareIds.length}/3</button>}<a className="app-button app-button--primary" href={selectedFamily.familyUrl} target="_blank" rel="noreferrer" aria-label={`打开 ${selectedFamily.brand} ${selectedFamily.family} 官网，新标签页打开`}>打开 {selectedFamily.brand} 官网 <span aria-hidden="true">↗</span></a></footer>
          </section>
        </div>
      )}

      {selected && (
        <div className="detail-backdrop" role="presentation" onPointerDown={closeDetail}>
          <section ref={racketDialogRef} className="racket-inspector" role="dialog" aria-modal="true" aria-labelledby="inspector-title" onPointerDown={(event) => event.stopPropagation()} style={{ "--racket-accent": selected.accent } as CSSProperties}>
            <header className="racket-inspector__header"><button data-dialog-close onClick={closeDetail} aria-label={detailReturnFamilyId ? "返回拍系详情" : "关闭详情"}>‹</button><span>{detailReturnFamilyId ? `返回 ${selected.familyName} 拍系` : selected.brand}</span><div className="inspector-header-actions"><button onClick={() => shareCurrentView(`${selected.brand} ${selected.model} 深度档案`)} aria-label={`分享 ${selected.model} 深度档案链接`}>分享</button><button className="is-primary" data-focus-key={`dossier-header-compare-${selected.id}`} onClick={() => requestCompare(selected.id)} aria-pressed={compareIds.includes(selected.id)} aria-label={`${compareIds.includes(selected.id) ? "移出" : compareIds.length >= 3 ? "管理已满对比，当前无法加入" : "加入"} ${selected.model} 对比`}>{compareIds.includes(selected.id) ? "✓ 已对比" : compareIds.length >= 3 ? "管理 3/3" : "+ 对比"}</button></div></header>
            <div className="racket-inspector__scroll" onScroll={(event) => persistRacketScroll(event.currentTarget.scrollTop)}>
              <nav className="dossier-nav" aria-label="深度档案章节">
                <button onClick={() => jumpDossierSection("overview")}>概览</button><button onClick={() => jumpDossierSection("specs")}>规格</button><button onClick={() => jumpDossierSection("radar")}>六维</button><button onClick={() => jumpDossierSection("similar")}>相似拍</button>
              </nav>
              {selectedGallery.length > 0 ? <ProductGallery key={selected.id} images={selectedGallery} alt={`${selected.brand} ${selected.model}`} accent={selected.accent} /> : <RacketPhoto racket={selected} variant="detail" />}
              {selected.images?.length
                ? <p className="inspector-image-note">图片来自该型号官网商品页{selected.imageVerifiedAt ? ` · 核验 ${selected.imageVerifiedAt}` : ""}；{selected.images.length > 1 ? "可左右切换查看官方角度。" : "当前官网仅提供这一商品角度。"}</p>
                : selected.familyId && <p className="inspector-image-note">图片为 {selected.familyName} 拍系的官网代表图；具体子型号外观与细节请以官网页面为准。</p>}
              <div className="racket-inspector__title" id="dossier-overview" tabIndex={-1}><p>{selected.series} · {selected.generation ?? selected.year}</p><h2 id="inspector-title">{selected.model}</h2><strong>发行 {selected.releaseDate ?? selected.year}</strong><span>{selected.stages.join(" · ")} / {selected.styles.join(" · ")}</span></div>
              <RacketSpecTags racket={selected} expanded showSummary />
              <p className="racket-inspector__summary">{selected.summary}</p>
              <p className="racket-inspector__verdict">{selected.verdict}</p>
              {selected.familyId && <button className="racket-inspector__family-path" data-focus-key={`dossier-family-${selected.id}`} onClick={() => openFamily(selected.familyId as string, selected.id)}>查看 {selected.familyName} 拍系全部型号 <span aria-hidden="true">›</span></button>}
              <section className="dossier-decision-strip" aria-label="从这把球拍开始决策"><div><span>和朋友比一把</span><b>用 {selected.model} 守擂</b><small>生成链接，朋友打开后直接选拍应战</small></div><button data-focus-key={`dossier-duel-${selected.id}`} onClick={() => startDuel(selected.id)} aria-label={`发起 ${selected.model} 球拍对决`}>发起好友对决 <span aria-hidden="true">↗</span></button><PurchaseLinkBadge racketId={selected.id} /></section>
              <dl className="inspector-specs" id="dossier-specs" tabIndex={-1} aria-label={`${selected.model} 完整规格`}>
                <div><dt>裸拍重量</dt><dd>{formatNumberSpec(officialWeight(selected), "g")}</dd></div><div><dt>拍面</dt><dd>{formatNumberSpec(officialHead(selected), "in²")}</dd></div><div><dt>线床</dt><dd>{officialPattern(selected) ?? "—"}</dd></div><div><dt>平衡点</dt><dd>{officialBalance(selected)}</dd></div><div><dt>框厚</dt><dd>{officialBeam(selected)}</dd></div><div><dt>长度</dt><dd>{officialLength(selected)}</dd></div><div><dt>阶段</dt><dd>{selected.stages.join(" / ")}</dd></div><div><dt>打法</dt><dd>{selected.styles.join(" / ")}</dd></div><div><dt>资料完整度</dt><dd>{selected.specCoverage ?? "—"}</dd></div>
              </dl>
              <section className="inspector-radar" id="dossier-radar" tabIndex={-1} aria-label={`${selected.model} 六维属性`}><div><p>六维属性</p><span>官网规格 × 拍系定位</span></div><RadarChart chartRackets={[selected]} /></section>
              {similarRackets && (
                <section className="similar-rackets" id="dossier-similar" tabIndex={-1} aria-labelledby="similar-rackets-title">
                  <div className="similar-rackets__head"><div><p>跨品牌近似</p><h3 id="similar-rackets-title">找相似的拍</h3></div><span>按 5 项官网规格排序</span></div>
                  {similarRackets.status === "missing-specs"
                    ? <p className="similar-rackets__empty">该型号官网未公开{similarRackets.missing.join("、")}，无法进行规格相似度排序。</p>
                    : similarRackets.entries.length === 0
                      ? <p className="similar-rackets__empty">暂无官网规格齐全的他牌型号可参与相似度排序。</p>
                      : (
                        <ul className="similar-rackets__list">
                          {similarRackets.entries.map((entry, index) => (
                            <li key={entry.id}>
                              <RacketPhoto racket={entry.racket} variant="thumb" />
                              <div className="similar-rackets__info">
                                <span>{index === 0 ? "最接近" : `第 ${index + 1} 接近`} · {entry.racket.brand}</span>
                                <b>{entry.racket.model}</b>
                                <small>{formatNumberSpec(officialWeight(entry.racket), "g")} · {formatNumberSpec(officialHead(entry.racket), "in²")} · {officialPattern(entry.racket) ?? "—"}</small>
                                <em className="similar-rackets__diff">{entry.nearIdentical ? entry.maxDiffLabel : `最大差异 ${entry.maxDiffLabel}`}</em>
                              </div>
                              <div className="similar-rackets__actions">
                                <button data-focus-key={`similar-open-${entry.id}`} onClick={() => openRacket(entry.id)} aria-label={`打开 ${entry.racket.model} 深度档案`}>查看档案</button>
                                <button className="is-primary" data-focus-key={`similar-compare-${entry.id}`} onClick={() => startPairCompare(selected.id, entry.id)} aria-label={`将 ${selected.model} 与 ${entry.racket.model} 放入决策室对比`}>与当前拍对比</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                  <p className="similar-rackets__note">{HONESTY_NOTES.similarRacketsCoverage}{HONESTY_NOTES.similarRackets}</p>
                </section>
              )}
              <p className="inspector-note">{selected.profileBasis} 参数标签为公开硬规格的导向归纳，静态平衡不等于挥重。六维评分非实验室测量；穿线、磅数与个人动作都会改变最终手感，不替代实际试打。</p>
            </div>
            <footer className="racket-inspector__actions"><button className="app-button app-button--soft" data-focus-key={`dossier-footer-compare-${selected.id}`} onClick={compareIds.includes(selected.id) ? activeView === "compare" ? closeDetail : () => goToView("compare") : () => requestCompare(selected.id)}>{compareIds.includes(selected.id) ? activeView === "compare" ? "返回球拍对比" : `查看对比 ${compareIds.length}/3` : compareIds.length >= 3 ? "管理对比 3/3" : "+ 加入对比"}</button><a className="app-button app-button--primary" href={selected.buyUrl} target="_blank" rel="noreferrer" aria-label={`前往 ${selected.buyLabel} 查看 ${selected.model}，${purchaseLinkStatusLabel(selected.id)}，新标签页打开`}><span>前往 {selected.buyLabel} <i aria-hidden="true">↗</i></span><PurchaseLinkBadge racketId={selected.id} compact /></a></footer>
          </section>
        </div>
      )}

      {duelShare && (
        <div className="duel-share-backdrop" role="presentation" onPointerDown={dismissDuelShare}>
          <section ref={duelShareDialogRef} className="duel-share-sheet" role="dialog" aria-modal="true" aria-labelledby="duel-share-title" onPointerDown={(event) => event.stopPropagation()}>
            <button data-dialog-close className="duel-share-sheet__close" onClick={dismissDuelShare} aria-label="关闭好友对决分享">×</button>
            <span className="duel-share-sheet__eyebrow">FRIEND DUEL</span>
            <h2 id="duel-share-title">用 {duelShare.racketName} 守擂</h2>
            <p>朋友打开链接后，会先看到你的战拍，再从 259 款拍库中选一把应战。</p>
            <div className="duel-share-sheet__versus"><span><small>你的战拍</small><b>{duelShare.racketName}</b></span><i>VS</i><span><small>朋友选择</small><b>等待应战</b></span></div>
            <label><span>挑战链接</span><input ref={duelLinkInputRef} value={duelShare.url} readOnly onFocus={(event) => event.currentTarget.select()} /></label>
            <div className="duel-share-sheet__actions"><button className="app-button app-button--primary" onClick={shareDuelLink}>分享给朋友</button><button className="app-button app-button--soft" onClick={copyDuelLink}>复制链接</button></div>
            {duelShareNotice && <p className="duel-share-sheet__notice" role="status" aria-live="polite">{duelShareNotice}</p>}
            <button className="duel-share-sheet__preview" onClick={previewDuel}>先预览朋友看到的对决 <span aria-hidden="true">›</span></button>
            <small>六维战报采用 2 分容差；这是拍库相对评估，不代表实际胜负。</small>
          </section>
        </div>
      )}

      <div className={`app-toast${liveMessage ? " is-visible" : ""}${actionableCompareUndo ? " app-toast--actionable" : ""}${compareIds.length > 0 && activeView !== "compare" ? " app-toast--with-tray" : ""}`} onMouseEnter={() => setToastPaused(true)} onMouseLeave={() => setToastPaused(false)} onFocusCapture={() => setToastPaused(true)} onBlurCapture={() => setToastPaused(false)}>
        <span role="status" aria-live="polite" aria-atomic="true">{liveMessage}</span>
        {actionableCompareUndo && !selected && !selectedFamily && <button ref={undoButtonRef} onClick={undoCompareChange} aria-label="撤销上一项对比操作，亦可按 Command 或 Control 加 Z" title="撤销（⌘/Ctrl + Z）">撤销</button>}
      </div>
      </div>
    </div>
  );
}
