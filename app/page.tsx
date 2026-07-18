"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  catalogBrands,
  catalogFamilies,
  catalogModelCount,
  catalogTypes,
  catalogVerifiedAt,
  type CatalogFamily,
} from "./catalog-data";
import { catalogBrandProfile } from "./brand-data";
import { buildCuratedListEntries, curatedCriteriaSummary, curatedLists } from "./curated-lists";
import { HONESTY_NOTES } from "./honesty-notes";
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

type Racket = DeepRacket;

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
      <p className="radar-chart__note">拍库相对评估 / 满分 100 / 非实验室测量</p>
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

export function recommendationScore(racket: Racket, stage: Stage, style: PlayStyle, priority: string) {
  const values = Object.values(racket.scores);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const floor = Math.min(...values);
  let score = 10;
  if (racket.stages.includes(stage)) score += 22;
  if (racket.styles.includes(style)) score += 28;
  const keyMap: Record<string, ScoreKey> = {
    力量: "power",
    旋转: "spin",
    控制: "control",
    手感: "feel",
    灵活: "agility",
    护臂: "forgiveness",
  };
  if (priority === "均衡") {
    score += (average * 0.18) + (floor * 0.06);
  } else {
    score += (racket.scores[keyMap[priority]] * 0.2) + (average * 0.04);
  }
  return Math.min(99, score);
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
    const keyMap: Record<string, ScoreKey> = { 力量: "power", 旋转: "spin", 控制: "control", 手感: "feel", 灵活: "agility", 护臂: "forgiveness" };
    const label = priority === "护臂" ? "护臂（容错）" : priority;
    reasons.push(`${label} ${racket.scores[keyMap[priority]]}`);
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

function TourRacketVisual({ player }: { player: TourPlayer }) {
  const target = tourCatalogTargets[player.id];
  const linkedRacket = target?.kind === "racket" ? deepRacketById.get(target.racketId) : undefined;
  const linkedFamily = target ? catalogFamilyById.get(target.familyId) : undefined;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const familyImage = linkedFamily
    ? familyGalleries[linkedFamily.id]?.[0] ?? linkedFamily.image
    : undefined;
  const image = linkedRacket?.image
    ?? familyImage
    ?? (player.racketImageId ? racketImages[player.racketImageId] : undefined);
  const imageLabel = linkedRacket
    ? `${linkedRacket.brand} ${linkedRacket.model} 官网零售映射图，具体比赛拍外观可能不同`
    : linkedFamily
      ? `${linkedFamily.brand} ${linkedFamily.family} ${linkedFamily.generation} 当前拍库参考图，不等同 ${player.marketedFamily} 或具体比赛拍`
      : `${player.brand} ${player.marketedFamily} 拍系代表图，具体比赛拍外观可能不同`;
  return image && failedImage !== image
    ? <img src={image} alt={`${player.nameZh} · ${imageLabel}`} loading="lazy" decoding="async" onError={() => setFailedImage(image)} />
    : <span role="img" aria-label={`${player.brand} ${player.marketedFamily} 拍系图片暂不可用`}><b>{player.brand}</b><small>{player.marketedFamily}</small></span>;
}

function TourPlayerCard({
  player,
  leader = false,
  onOpenFamily,
  onOpenRacket,
  onToggleCompare,
  compared,
  compareFull,
}: {
  player: TourPlayer;
  leader?: boolean;
  onOpenFamily: (id: string) => void;
  onOpenRacket: (id: string) => void;
  onToggleCompare: (id: string) => void;
  compared: boolean;
  compareFull: boolean;
}) {
  const target = tourCatalogTargets[player.id];
  const linkedFamily = target ? catalogFamilyById.get(target.familyId) : undefined;
  const linkedRacket = target?.kind === "racket" ? deepRacketById.get(target.racketId) : undefined;

  return (
    <article className={`tour-player-card${leader ? " tour-player-card--leader" : ""}`}>
      <div className="tour-player-card__rank"><span>{player.tour}</span><b>#{player.rank}</b></div>
      <div className="tour-player-card__visual"><TourRacketVisual player={player} /></div>
      <div className="tour-player-card__body">
        <div className="tour-player-card__country"><span>{player.countryCode}</span><span>{player.brand}</span></div>
        <h2>{player.nameZh}</h2><p className="tour-player-card__latin">{player.name}</p>
        <div className="tour-player-card__racket"><small>品牌官方关联拍系 / 零售映射</small><strong>{player.marketedModel ?? player.marketedFamily}</strong><span>{player.mapping}</span></div>
        <p className="tour-player-card__note">{player.note}</p>
        <div className="tour-player-card__journey">
          {linkedRacket ? (
            <button data-focus-key={`tour-racket-${player.id}-${linkedRacket.id}`} onClick={() => onOpenRacket(linkedRacket.id)}>查看深度档案</button>
          ) : linkedFamily ? (
            <button data-focus-key={`tour-family-${player.id}-${linkedFamily.id}`} onClick={() => onOpenFamily(linkedFamily.id)}>{player.mapping === "当前拍系参考" ? `进入参考拍系：${linkedFamily.family}` : `进入 ${linkedFamily.family} 拍系`}</button>
          ) : null}
          {linkedRacket && (
            <button
              data-focus-key={`tour-compare-${player.id}-${linkedRacket.id}`}
              onClick={() => onToggleCompare(linkedRacket.id)}
              aria-pressed={compared}
              aria-label={compareFull && !compared ? `管理已满的球拍对比，当前无法加入 ${linkedRacket.model}` : `${compared ? "移出" : "加入"} ${linkedRacket.model} 对比`}
            >
              {compared ? "✓ 已加入对比" : compareFull ? "管理对比 3/3" : "+ 加入对比"}
            </button>
          )}
        </div>
        <div className="tour-player-card__sources">
          <a href={player.profileUrl} target="_blank" rel="noreferrer" aria-label={`${player.nameZh} 品牌官方关联来源，新标签页打开`}>品牌官方关联来源 <span aria-hidden="true">↗</span></a>
          <a href={player.gearUrl} target="_blank" rel="noreferrer" aria-label={`${player.nameZh} 零售映射来源，新标签页打开`}>零售映射来源 <span aria-hidden="true">↗</span></a>
        </div>
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
  const [matchFlow, setMatchFlow] = useState(emptyMatchFlow);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionPersistence, setSessionPersistence] = useState<"unknown" | "available" | "memory-only">("unknown");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [familyTargetRacketId, setFamilyTargetRacketId] = useState<string | null>(null);
  const [detailReturnFamilyId, setDetailReturnFamilyId] = useState<string | null>(null);
  const [compareSlots, setCompareSlots] = useState<CompareSlots>([]);
  const [compareUndo, setCompareUndo] = useState<CompareUndo | null>(null);
  const [pendingCompareId, setPendingCompareId] = useState<string | null>(null);
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
  const catalogResultLimitRef = useRef(24);
  const familyScrollTopRef = useRef(0);
  const familyMatrixScrollLeftRef = useRef(0);
  const racketScrollTopRef = useRef(0);
  const familyReturnRacketRef = useRef<string | null>(null);
  const familyTargetNeedsRevealRef = useRef(false);
  const matchFlowRef = useRef(matchFlow);
  const compareSlotsRef = useRef(compareSlots);
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
  const prescriptionBaseline = prescriptionBaselineId ? deepRacketById.get(prescriptionBaselineId) ?? null : null;
  const generalRecommendations = useMemo(() => (
    buildRecommendations(deepRackets, profileStage, profileStyle, profilePriority)
  ), [profileStage, profileStyle, profilePriority]);
  const prescriptionResults = useMemo(() => (
    buildSwapPrescription(deepRackets, prescriptionBaseline, profileStage, profileStyle, profilePriority, 3)
  ), [prescriptionBaseline, profileStage, profileStyle, profilePriority]);
  const prescriptionResultById = useMemo(
    () => new Map(prescriptionResults.map((result) => [result.racket.id, result])),
    [prescriptionResults],
  );
  const recommendations = prescriptionBaseline
    ? prescriptionResults.map(({ racket, match }) => ({ racket, match }))
    : generalRecommendations;

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
  const compareIds = useMemo(() => compareSlotIds(compareSlots), [compareSlots]);
  const compared = compareIds.map((id) => deepRackets.find((racket) => racket.id === id)).filter(Boolean) as Racket[];
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
  const visibleTourPlayers = tourPlayers.filter((player) => player.tour === tourFilter);
  const tourLeader = visibleTourPlayers[0];
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

  const formatCurrentRoute = useCallback((route: AppRoute, filters: ArmoryFilterState = armoryFiltersRef.current) => {
    if (route.view === "armory") return formatArmoryRouteState(route, filters, armoryFilterConfig);
    if (route.view === "tour") return formatTourRouteState(route, tourFilterRef.current);
    if (route.view === "compare") return formatCompareRouteState(route, compareSlotsRef.current);
    return formatAppRoute(route);
  }, []);

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
  }, [activeView, compareSlots]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    let suppressHashTimer = 0;
    const readRoute = (source: "initial" | "pop" | "hash" = "initial") => {
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
      const tourRouteState = parseTourRouteState(window.location.hash);
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
      let familyId = parsedRoute.familyId && catalogFamilyById.has(parsedRoute.familyId) ? parsedRoute.familyId : undefined;
      let racket = parsedRoute.racketId ? deepRacketById.get(parsedRoute.racketId) : undefined;
      if (parsedRoute.racketId && !racket) setLiveMessage("该球拍链接已失效，已返回当前栏目");
      else if (parsedRoute.familyId && !familyId) setLiveMessage("该拍系链接已变更，已返回当前栏目");
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
            : { view: parsedRoute.view };
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
      suppressHashRouteRef.current = true;
      if (suppressHashTimer) window.clearTimeout(suppressHashTimer);
      readRoute("pop");
      suppressHashTimer = window.setTimeout(() => {
        suppressHashRouteRef.current = false;
      }, 0);
    };
    const onHashChange = () => {
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
  }, [applyArmoryFiltersToState, applyTourFilterToState, formatCurrentRoute, materializePendingMatchSettlement, pushPaikuHistory, replacePaikuHistory]);

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
      const savedTourFilter: Tour = (storedTour ?? saved?.tourFilter) === "WTA" ? "WTA" : "ATP";
      applyTourFilterToState(route.view === "tour" ? parseTourRouteState(window.location.hash).tour : savedTourFilter);
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
    } catch {
      // A browser history or storage restriction falls back to the server-rendered defaults.
    }
    setSessionReady(true);
  }, [applyArmoryFiltersToState, applyTourFilterToState, formatCurrentRoute, pushPaikuHistory, replacePaikuHistory]);
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
    });
    const frame = window.requestAnimationFrame(() => setSessionPersistence(saved ? "available" : "memory-only"));
    return () => window.cancelAnimationFrame(frame);
  }, [sessionReady, catalogScope, catalogBrand, catalogType, catalogGeneration, catalogReleaseYear, catalogSearch, catalogSort, writeSessionDomain]);

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
    const dialog = selected ? racketDialogRef.current : selectedFamily ? familyDialogRef.current : null;
    document.body.classList.toggle("app-locked", Boolean(dialog));
    if (!dialog) return;

    const background = document.querySelectorAll<HTMLElement>(".skip-link, .desktop-sidebar, .app-content, .mobile-tabbar, .compare-tray");
    background.forEach((element) => element.setAttribute("inert", ""));
    const focusFrame = window.requestAnimationFrame(() => {
      if (selectedFamily) {
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
  }, [selected, selectedFamily, detailReturnFamilyId, replacePaikuHistory]);

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

  const goToView = (view: AppView, scrollMode: "top" | "restore" = "top") => {
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
      pushPaikuHistory({
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
      }, "", formatCurrentRoute(nextRoute));
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

  useEffect(() => {
    closeTopOverlayRef.current = selected ? closeDetail : selectedFamily ? closeFamily : () => undefined;
  });

  const commitCompareSlots = (nextSlots: CompareSlots, kind: CompareUndo["kind"], message: string) => {
    const beforeSlots = normalizeCompareSlots(compareSlots);
    const afterSlots = normalizeCompareSlots(nextSlots);
    const token = ++compareUndoTokenRef.current;
    const originElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originFocus = captureFocusIdentity(originElement);
    compareSlotsRef.current = afterSlots;
    setCompareSlots(afterSlots);
    const saved = persistCompareSnapshot(afterSlots);
    setSessionPersistence(saved ? "available" : "memory-only");
    const announcedMessage = saved
      ? message
      : `${message}；当前浏览器无法持久保存，关闭页面后可能丢失`;
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
        ? formatCompareRouteState(route, afterSlots)
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

  const copyTourLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLiveMessage(`已复制 ${tourFilterRef.current} 榜单链接`);
    } catch {
      setLiveMessage("浏览器未允许复制，请直接复制地址栏链接");
    }
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

  const openTrialFeedback = (racketId: string) => {
    setFeedbackRacketId(racketId);
    setTrialFeedbackDraft(emptyTrialFeedbackDraft);
    window.requestAnimationFrame(() => document.getElementById("trial-feedback-title")?.focus({ preventScroll: true }));
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
    setFeedbackRacketId(null);
    setTrialFeedbackDraft(emptyTrialFeedbackDraft);
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
    if (activeViewRef.current === "tour") {
      const route = parseAppRoute(window.location.hash);
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

  const restartMatchProfile = () => {
    const recoveringMissingResult = matchRouteNotice === "missing-result";
    setMatchRouteNotice(null);
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

  const comparisonRows: { label: string; value: (racket: Racket) => React.ReactNode }[] = [
    { label: "定位 Type", value: (racket) => racket.familyType ?? "—" },
    { label: "代际", value: (racket) => racket.generation ?? "—" },
    { label: "发行", value: (racket) => racket.releaseDate ?? racket.year },
    { label: "规格特点", value: (racket) => <RacketSpecTags racket={racket} compact showSpecs={false} /> },
    { label: "适合阶段", value: (racket) => racket.stages.join(" · ") },
    { label: "打法风格", value: (racket) => racket.styles.join(" · ") },
    { label: "裸拍重量", value: (racket) => formatNumberSpec(officialWeight(racket), "g") },
    { label: "拍面", value: (racket) => formatNumberSpec(officialHead(racket), "in²") },
    { label: "线床", value: (racket) => officialPattern(racket) ?? "—" },
    { label: "平衡点", value: officialBalance },
    { label: "框厚", value: officialBeam },
    { label: "长度", value: officialLength },
    ...radarKeys.map((key) => ({ label: scoreLabels[key], value: (racket: Racket) => <b>{racket.scores[key]}</b> })),
  ];
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

            <section className="curated-lists" aria-labelledby="curated-lists-title">
              <div className="section-bar"><div><p>拍库严选</p><h2 id="curated-lists-title">按公开规格自动筛出的严选榜单</h2></div></div>
              <div className="curated-lists__grid">
                {curatedListEntries.map(({ list, rackets }) => {
                  const criteriaOpen = Boolean(openCuratedCriteria[list.id]);
                  return (
                    <article key={list.id} className="curated-list" aria-labelledby={`curated-title-${list.id}`}>
                      <header className="curated-list__header">
                        <h3 id={`curated-title-${list.id}`}>{list.title}</h3>
                        <p>{list.tagline}</p>
                      </header>
                      <button
                        className="curated-list__criteria-toggle"
                        aria-expanded={criteriaOpen}
                        aria-controls={`curated-criteria-${list.id}`}
                        data-focus-key={`curated-criteria-${list.id}`}
                        onClick={() => setOpenCuratedCriteria((current) => ({ ...current, [list.id]: !current[list.id] }))}
                      >
                        <b>入选标准</b>
                        <small>{curatedCriteriaSummary(list)}</small>
                        <span aria-hidden="true">{criteriaOpen ? "−" : "+"}</span>
                      </button>
                      <div id={`curated-criteria-${list.id}`} className="curated-list__criteria" hidden={!criteriaOpen}>
                        <div>
                          <h4>硬性规格条件</h4>
                          <ul>{list.hardCriteria.map((criterion) => <li key={criterion.label}>{criterion.label}</li>)}</ul>
                        </div>
                        <div>
                          <h4>评分门槛</h4>
                          <ul>{list.scoreCriteria.map((criterion) => <li key={criterion.label}>{criterion.label}</li>)}</ul>
                          <p className="curated-list__note">六维评分为{HONESTY_NOTES.relativeAssessment}</p>
                        </div>
                      </div>
                      {rackets.length > 0 ? (
                        <ul className="curated-list__entries">
                          {rackets.map((racket) => (
                            <li key={racket.id} className="curated-entry">
                              <div className="curated-entry__identity">
                                <span>{racket.brand} · {racket.generation ?? racket.year}</span>
                                <b>{racket.model}</b>
                                <small>{formatNumberSpec(officialHead(racket), "in²")} · {formatNumberSpec(officialWeight(racket), "g")} · {officialPattern(racket) ?? HONESTY_NOTES.unpublished}</small>
                              </div>
                              <div className="curated-entry__actions">
                                <button className="app-button app-button--soft" data-focus-key={`curated-open-${list.id}-${racket.id}`} onClick={() => openRacket(racket.id)}>查看档案</button>
                                <button className="app-button app-button--glass" data-focus-key={`curated-compare-${list.id}-${racket.id}`} onClick={() => requestCompare(racket.id)} aria-pressed={compareIds.includes(racket.id)}>{compareIds.includes(racket.id) ? "✓ 已加入对比" : compareIds.length >= 3 ? "管理对比 3/3" : "+ 加入对比"}</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="curated-list__empty">当前拍库暂无满足全部标准的型号</p>
                      )}
                    </article>
                  );
                })}
              </div>
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
                  <p>优先方向：{profilePriority}。{prescriptionBaseline ? "每个候选都会说明相对当前球拍的收益、取舍与适应成本。" : "选择你当前使用的球拍，可查看更具体的迁移差异。"}</p>
                  <button onClick={restartMatchProfile}>修改答案</button>
                </div>
                <div className="match-result-list">
                  {recommendations.slice(0, 3).map(({ racket, match }, index) => (
                    <article key={racket.id} className="match-result-card">
                      <span className="match-result-card__rank">{index + 1}</span>
                      <button className="match-result-card__main" data-focus-key={`match-result-open-${racket.id}`} onClick={() => openRacket(racket.id)}>
                        <RacketPhoto racket={racket} variant="thumb" />
                        <span className="match-result-card__copy">
                          <small>{prescriptionResultById.get(racket.id)?.role ?? racket.brand}</small>
                          <strong>{racket.model}</strong>
                          <span>{prescriptionResultById.get(racket.id)?.gains.join("；") ?? recommendationReason(racket, profileStage, profileStyle, profilePriority)}</span>
                          {prescriptionBaseline && prescriptionResultById.get(racket.id) && <em>{prescriptionDeltaSummary(prescriptionResultById.get(racket.id) as PrescriptionResult)} · 适应成本 {prescriptionResultById.get(racket.id)?.adaptation}</em>}
                        </span>
                      </button>
                      <div className="match-result-card__score"><b>{Math.round(match)}</b><small>指数</small></div>
                      <button className="match-result-card__add" data-focus-key={`match-result-compare-${racket.id}`} onClick={() => requestCompare(racket.id)} aria-pressed={compareIds.includes(racket.id)} aria-label={!compareIds.includes(racket.id) && compareIds.length >= 3 ? `决策室已有三把候选，管理后再加入 ${racket.model}` : `${compareIds.includes(racket.id) ? "移出" : "加入"} ${racket.model} 决策室`}>{compareIds.includes(racket.id) ? "✓" : compareIds.length >= 3 ? "⇄" : "+"}</button>
                    </article>
                  ))}
                </div>
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
            />
            <section className="armory-overview" aria-label="拍库覆盖与数据说明">
              <div className="armory-overview__copy"><span>年鉴 × 六维深档</span><p>从拍系看产品定位，或直接浏览全部型号。每款都有六维雷达、官方规格、参数特点和同系差异。</p></div>
              <dl>
                <div><dt>品牌</dt><dd>{catalogBrands.length}</dd></div>
                <div><dt>拍系</dt><dd>{catalogFamilies.length}</dd></div>
                <div><dt>型号</dt><dd>{deepRackets.length}</dd></div>
              </dl>
              <small>核验于 {catalogVerifiedAt} · 排除儿童拍、握把尺寸与纯配色重复 SKU</small>
            </section>

            <section className="brand-index" aria-labelledby="brand-index-title">
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
                <div className="catalog-filter-panel" id="catalog-filter-panel" role="region" aria-label="筛选球拍库">
                  <div className="catalog-filter-panel__header"><div><span>精确筛选</span><b>{catalogBrand === "全部" ? "全部品牌" : catalogBrand}</b></div><button onClick={() => setCatalogFiltersOpen(false)} aria-label="收起筛选面板">完成</button></div>
                  <div className="catalog-filter-panel__grid">
                    <fieldset><legend>球拍类型</legend><div className="catalog-type-options">{catalogTypes.map((item) => <button key={item} type="button" aria-pressed={catalogType === item} onClick={() => commitArmoryFilters({ type: item })}>{item === "全部" ? "全部" : `${item}型`}</button>)}</div></fieldset>
                    <label><span>产品代际</span><select value={catalogGeneration} onChange={(event) => commitArmoryFilters({ generation: event.target.value as CatalogGeneration })}>{catalogGenerationsForBrand.map((item) => <option key={item}>{item}</option>)}</select><small>{catalogBrand === "全部" ? "选择品牌后仅显示该品牌代际" : `${catalogBrand} 的现行拍系代际`}</small></label>
                    <label><span>发行时间</span><select value={catalogReleaseYear} onChange={(event) => commitArmoryFilters({ releaseYear: event.target.value as CatalogReleaseYear })}>{catalogReleaseYearOptions.map((item) => <option key={item}>{item}</option>)}</select><small>{catalogScope === "families" ? "按拍系公开发行时间" : "按具体型号发行时间"}</small></label>
                  </div>
                  {catalogActiveFilterCount > 0 && <button className="catalog-filter-panel__clear" onClick={clearCatalogFacets}>清除全部筛选</button>}
                </div>
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
            <ViewTitle id="tour-title" eyebrow={`排名快照 · ${tourRankAsOf}`} title="巡回赛拍房" />
            <section className="tour-data-note">
              <div><span aria-hidden="true">◎</span><p><b>官网公开用拍</b><small>赞助家族或零售型号映射</small></p></div>
              <p>职业球员常用定制底板、加重和平衡方案；页面中的零售型号不代表其比赛拍实测参数。</p>
              <div><button onClick={copyTourLink} aria-label={`复制 ${tourFilter} 世界前 8 用拍榜单链接`}>复制 {tourFilter} 榜单</button><a href={tourSources.ATP} target="_blank" rel="noreferrer" aria-label="ATP 排名来源，新标签页打开">ATP 排名源 ↗</a><a href={tourSources.WTA} target="_blank" rel="noreferrer" aria-label="WTA 排名来源，新标签页打开">WTA 排名源 ↗</a></div>
            </section>
            <div className="tour-switch" role="group" aria-label="选择巡回赛">
              {(["ATP", "WTA"] as Tour[]).map((tour) => <button key={tour} data-focus-key={`tour-filter-${tour}`} aria-pressed={tourFilter === tour} onClick={() => commitTourFilter(tour)}><b>{tour}</b><span>世界前 8</span></button>)}
            </div>
            {tourLeader ? (
              <>
                <TourPlayerCard
                  player={tourLeader}
                  leader
                  onOpenFamily={openFamily}
                  onOpenRacket={openRacket}
                  onToggleCompare={requestCompare}
                  compared={Boolean(tourRacketTargetId(tourLeader.id) && compareIds.includes(tourRacketTargetId(tourLeader.id) as string))}
                  compareFull={compareIds.length >= 3}
                />
                <div className="section-bar"><div><p>{tourFilter} ranking</p><h2>第 2–8 位的公开用拍</h2></div><span className="tour-updated">截至 {tourRankAsOf}</span></div>
                <div className="tour-player-grid">
                  {visibleTourPlayers.slice(1).map((player) => <TourPlayerCard key={player.id} player={player} onOpenFamily={openFamily} onOpenRacket={openRacket} onToggleCompare={requestCompare} compared={Boolean(tourRacketTargetId(player.id) && compareIds.includes(tourRacketTargetId(player.id) as string))} compareFull={compareIds.length >= 3} />)}
                </div>
              </>
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
                {compared.length === 1 && <div className="compare-guidance"><span>还差一把</span><p role="status">加入第二把后，六维轮廓与规格差异才会形成真正的重叠对比。</p><button onClick={browseForCompare}>去拍库添加</button></div>}
                {availableCompareSuggestions.length > 0 && compared.length < 3 && (
                  <section className="compare-continue" aria-labelledby="compare-continue-title">
                    <div><small>{hasCompletedMatch ? "按你的打法" : "典型取向"}</small><h2 id="compare-continue-title">快速补齐候选</h2></div>
                    <div className="compare-suggestions">
                      {availableCompareSuggestions.map((racket) => <button key={racket.id} onClick={() => toggleCompare(racket.id)} aria-label={`加入 ${racket.model} 决策室`}><RacketPhoto racket={racket} variant="thumb" /><span><b>{racket.model}</b><small>+ 候选</small></span></button>)}
                    </div>
                  </section>
                )}
                <div className="compare-product-grid">
                  {compareSlotRackets.map(({ slot, racket }) => {
                    if (racket) {
                      const candidate = decisionCandidates[racket.id] ?? { status: "candidate" as const, note: "" };
                      return (
                        <article key={racket.id} className={`decision-candidate decision-candidate--${candidate.status}`} data-compare-slot={slot}>
                          <span className="decision-candidate__status">{decisionStatusLabels[candidate.status]}</span>
                          <button className={`compare-product-grid__remove${pendingCompareRacket ? " is-replace" : ""}`} data-compare-remove-id={racket.id} onClick={() => pendingCompareRacket ? replacePendingCompare(racket.id) : toggleCompare(racket.id)} aria-label={pendingCompareRacket ? `用 ${pendingCompareRacket.model} 替换 ${racket.model}` : `从决策室移除 ${racket.model}`}>{pendingCompareRacket ? "⇄" : "×"}</button>
                          <button className="compare-product-grid__main" data-focus-key={`compare-slot-${slot}-${racket.id}`} disabled={Boolean(pendingCompareRacket)} onClick={() => openRacket(racket.id)} aria-label={pendingCompareRacket ? `请先选择是否用 ${pendingCompareRacket.model} 替换 ${racket.model}` : `查看 ${racket.model} 深度档案`} title={pendingCompareRacket ? "请先完成或取消本次替换" : undefined}><RacketPhoto racket={racket} variant="thumb" /><span>{racket.brand}</span><h3>{racket.model}</h3></button>
                          <div className="decision-candidate__tools">
                            <label><span>决策状态</span><select value={candidate.status} disabled={Boolean(pendingCompareRacket)} onChange={(event) => updateDecisionCandidateStatus(racket.id, event.target.value as DecisionCandidateStatus)} aria-label={`${racket.model} 的决策状态`}>{Object.entries(decisionStatusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label>
                            <button type="button" onClick={() => openTrialFeedback(racket.id)} disabled={Boolean(pendingCompareRacket)}>记录试打</button>
                          </div>
                          <label className="decision-candidate__note"><span>一句话判断</span><textarea value={candidate.note} maxLength={120} rows={2} placeholder="例如：发球更省力，但反手需要适应" onChange={(event) => updateDecisionCandidateNote(racket.id, event.target.value)} aria-label={`${racket.model} 的决策备注`} /></label>
                        </article>
                      );
                    }
                    return slot === firstEmptyCompareSlot
                      ? <button key={slot} className="compare-add-slot" onClick={browseForCompare} aria-label="从球拍库添加下一个决策候选"><span>＋</span><b>候选 {slot + 1} · 添加</b></button>
                      : <div key={slot} className="compare-add-slot compare-add-slot--queued" role="note" aria-label={`候选位 ${slot + 1}，将在前一空位加入后开放`}><span>·</span><b>候选 {slot + 1} · 待填</b></div>;
                  })}
                </div>

                {feedbackRacketId && deepRacketById.get(feedbackRacketId) && (
                  <form className="trial-feedback-card" onSubmit={(event) => { event.preventDefault(); submitTrialFeedback(); }}>
                    <header>
                      <div><span>Trial log</span><h2 id="trial-feedback-title" tabIndex={-1}>记录 {deepRacketById.get(feedbackRacketId)?.model} 试打</h2><p>凭实际击球感受打分，系统会把结论带回候选状态。</p></div>
                      <button type="button" onClick={() => setFeedbackRacketId(null)} aria-label="关闭试打记录">×</button>
                    </header>
                    <div className="trial-feedback-card__ratings">
                      {(["control", "power", "comfort"] as const).map((metric) => (
                        <fieldset key={metric}>
                          <legend>{trialMetricLabels[metric]} <b>{trialFeedbackDraft[metric]}/5</b></legend>
                          <div role="radiogroup" aria-label={`${trialMetricLabels[metric]}评分`}>
                            {[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" role="radio" aria-checked={trialFeedbackDraft[metric] === score} onClick={() => setTrialFeedbackDraft((current) => ({ ...current, [metric]: score }))}>{score}</button>)}
                          </div>
                        </fieldset>
                      ))}
                    </div>
                    <div className="trial-feedback-card__details">
                      <label><span>本次结论</span><select value={trialFeedbackDraft.verdict} onChange={(event) => setTrialFeedbackDraft((current) => ({ ...current, verdict: event.target.value as TrialFeedbackDraft["verdict"] }))}>{trialVerdicts.map((verdict) => <option key={verdict}>{verdict}</option>)}</select></label>
                      <label><span>场上感受</span><textarea value={trialFeedbackDraft.note} maxLength={240} rows={3} placeholder="记录底线、发球、网前或手臂负担的真实感受" onChange={(event) => setTrialFeedbackDraft((current) => ({ ...current, note: event.target.value }))} /></label>
                    </div>
                    <footer><small>试打记录仅保存在当前浏览器。</small><div><button type="button" onClick={() => setFeedbackRacketId(null)}>取消</button><button className="app-button app-button--primary" type="submit">保存试打</button></div></footer>
                  </form>
                )}

                <section className="compare-radar-card">
                  <div><p>六维轮廓</p><h2>{compared.length > 1 ? "重叠雷达图" : "单拍雷达图"}</h2><span>官网硬规格与拍系定位生成的相对评估；非实验室测量。</span></div>
                  <RadarChart chartRackets={compared} seriesSlots={compareSlots.map(({ slot }) => slot)} />
                </section>

                <p className="compare-scroll-hint" id="compare-scroll-hint">横向滑动或使用方向键，查看全部球拍参数</p>
                <div ref={compareTableScrollRef} className="compare-spec-table-scroll" role="region" aria-label="球拍规格对比表" aria-describedby="compare-scroll-hint" tabIndex={compareTableScrollable ? 0 : -1}>
                  <table className="compare-spec-table">
                    <thead><tr><th scope="col">属性</th>{compareSlotRackets.map(({ slot, racket }) => <th scope="col" className={racket ? undefined : "is-empty"} key={slot}>{racket?.model ?? `空槽 ${slot + 1}`}</th>)}</tr></thead>
                    <tbody>{comparisonRows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{compareSlotRackets.map(({ slot, racket }) => <td key={slot} className={racket ? undefined : "is-empty"}>{racket ? row.value(racket) : "—"}</td>)}</tr>)}</tbody>
                  </table>
                </div>
                <div className="compare-buy-grid" style={{ "--compare-count": 3 } as CSSProperties}>
                  {compareSlotRackets.map(({ slot, racket }) => racket
                    ? <a key={slot} href={racket.buyUrl} target="_blank" rel="noreferrer" aria-label={`前往 ${racket.brand} 官网查看 ${racket.model}，新标签页打开`}>前往 {racket.brand} 官网 <span aria-hidden="true">↗</span></a>
                    : <span className="compare-buy-grid__empty" key={slot}>空槽 {slot + 1}</span>)}
                </div>
                {currentDecisionFeedback.length > 0 && (
                  <section className="trial-feedback-history" aria-labelledby="trial-feedback-history-title">
                    <div><span>Trial history</span><h2 id="trial-feedback-history-title">最近试打记录</h2><small>用场上反馈校正参数判断</small></div>
                    <ol>{currentDecisionFeedback.slice(0, 6).map((item, index) => {
                      const racket = deepRacketById.get(item.racketId);
                      return <li key={item.id ?? `${item.racketId}-${index}`}><header><b>{racket?.model ?? "球拍"}</b><span>{item.verdict}</span></header><div><span>控制 {item.control}/5</span><span>出球 {item.power}/5</span><span>舒适 {item.comfort}/5</span></div>{item.note && <p>{item.note}</p>}<small>{item.createdAt ? new Date(`${item.createdAt.replace(" ", "T")}Z`).toLocaleDateString("zh-CN") : "刚刚记录"}</small></li>;
                    })}</ol>
                  </section>
                )}
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
            <span aria-hidden="true">{tab.icon}</span><b>{tab.label}</b>{tabBadge(tab.id) && <i aria-hidden="true">{tabBadge(tab.id)}</i>}
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
            <header className="racket-inspector__header"><button data-dialog-close onClick={closeDetail} aria-label={detailReturnFamilyId ? "返回拍系详情" : "关闭详情"}>‹</button><span>{detailReturnFamilyId ? `返回 ${selected.familyName} 拍系` : selected.brand}</span><div className="inspector-header-actions"><button onClick={() => shareCurrentView(`${selected.brand} ${selected.model} 深度档案`)} aria-label={`分享 ${selected.model} 深度档案链接`}>分享</button><button data-focus-key={`dossier-header-compare-${selected.id}`} onClick={() => requestCompare(selected.id)} aria-pressed={compareIds.includes(selected.id)} aria-label={`${compareIds.includes(selected.id) ? "移出" : compareIds.length >= 3 ? "管理已满对比，当前无法加入" : "加入"} ${selected.model} 对比`}>{compareIds.includes(selected.id) ? "✓ 移出" : compareIds.length >= 3 ? "管理 3/3" : "+ 对比"}</button></div></header>
            <div className="racket-inspector__scroll" onScroll={(event) => persistRacketScroll(event.currentTarget.scrollTop)}>
              {selectedGallery.length > 0 ? <ProductGallery key={selected.id} images={selectedGallery} alt={`${selected.brand} ${selected.model}`} accent={selected.accent} /> : <RacketPhoto racket={selected} variant="detail" />}
              {selected.images?.length
                ? <p className="inspector-image-note">图片来自该型号官网商品页{selected.imageVerifiedAt ? ` · 核验 ${selected.imageVerifiedAt}` : ""}；{selected.images.length > 1 ? "可左右切换查看官方角度。" : "当前官网仅提供这一商品角度。"}</p>
                : selected.familyId && <p className="inspector-image-note">图片为 {selected.familyName} 拍系的官网代表图；具体子型号外观与细节请以官网页面为准。</p>}
              <div className="racket-inspector__title"><p>{selected.series} · {selected.generation ?? selected.year}</p><h2 id="inspector-title">{selected.model}</h2><strong>发行 {selected.releaseDate ?? selected.year}</strong><span>{selected.stages.join(" · ")} / {selected.styles.join(" · ")}</span></div>
              <RacketSpecTags racket={selected} expanded showSummary />
              <p className="racket-inspector__summary">{selected.summary}</p>
              <p className="racket-inspector__verdict">{selected.verdict}</p>
              {selected.familyId && <button className="racket-inspector__family-path" data-focus-key={`dossier-family-${selected.id}`} onClick={() => openFamily(selected.familyId as string, selected.id)}>查看 {selected.familyName} 拍系全部型号 <span aria-hidden="true">›</span></button>}
              <dl className="inspector-specs">
                <div><dt>裸拍重量</dt><dd>{formatNumberSpec(officialWeight(selected), "g")}</dd></div><div><dt>拍面</dt><dd>{formatNumberSpec(officialHead(selected), "in²")}</dd></div><div><dt>线床</dt><dd>{officialPattern(selected) ?? "—"}</dd></div><div><dt>平衡点</dt><dd>{officialBalance(selected)}</dd></div><div><dt>框厚</dt><dd>{officialBeam(selected)}</dd></div><div><dt>长度</dt><dd>{officialLength(selected)}</dd></div><div><dt>阶段</dt><dd>{selected.stages.join(" / ")}</dd></div><div><dt>打法</dt><dd>{selected.styles.join(" / ")}</dd></div><div><dt>资料完整度</dt><dd>{selected.specCoverage ?? "—"}</dd></div>
              </dl>
              <section className="inspector-radar"><div><p>六维属性</p><span>官网规格 × 拍系定位</span></div><RadarChart chartRackets={[selected]} /></section>
              <p className="inspector-note">{selected.profileBasis} 参数标签为公开硬规格的导向归纳，静态平衡不等于挥重。六维评分非实验室测量；穿线、磅数与个人动作都会改变最终手感，不替代实际试打。</p>
            </div>
            <footer className="racket-inspector__actions"><button className="app-button app-button--soft" data-focus-key={`dossier-footer-compare-${selected.id}`} onClick={compareIds.includes(selected.id) ? activeView === "compare" ? closeDetail : () => goToView("compare") : () => requestCompare(selected.id)}>{compareIds.includes(selected.id) ? activeView === "compare" ? "返回球拍对比" : `查看对比 ${compareIds.length}/3` : compareIds.length >= 3 ? "管理对比 3/3" : "+ 加入对比"}</button><a className="app-button app-button--primary" href={selected.buyUrl} target="_blank" rel="noreferrer" aria-label={`前往 ${selected.buyLabel} 查看 ${selected.model}，新标签页打开`}>前往 {selected.buyLabel} <span aria-hidden="true">↗</span></a></footer>
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
