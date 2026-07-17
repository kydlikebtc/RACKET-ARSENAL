export const appViewIds = ["discover", "match", "armory", "tour", "compare"] as const;

export type AppView = (typeof appViewIds)[number];

export type MatchRouteStep = 0 | 1 | 2 | 3;

export type AppRoute = {
  view: AppView;
  familyId?: string;
  racketId?: string;
  matchStep?: MatchRouteStep;
};

export type ArmoryFilterState = {
  brand: string;
  type: string;
  generation: string;
  releaseYear: string;
  search: string;
  sort: string;
};

export type ArmoryFilterConfig = {
  brands: readonly string[];
  types: readonly string[];
  generations: readonly string[];
  releaseYears: readonly string[];
  sorts: readonly string[];
  defaults: ArmoryFilterState;
  maxSearchLength?: number;
};

export type ParsedArmoryRouteState = {
  route: AppRoute;
  filters: ArmoryFilterState;
  canonicalHash: string;
  shouldReplace: boolean;
};

export const tourRouteFilters = ["ATP", "WTA"] as const;
export type TourRouteFilter = (typeof tourRouteFilters)[number];

export type ParsedTourRouteState = {
  route: AppRoute;
  tour: TourRouteFilter;
  canonicalHash: string;
  shouldReplace: boolean;
};

const armoryFilterQueryKeys = {
  brand: "brand",
  type: "type",
  generation: "gen",
  releaseYear: "year",
  search: "q",
  sort: "sort",
} as const;

function decodeSegment(value: string | undefined) {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

export function parseAppRoute(hash: string): AppRoute {
  const routePath = hash.replace(/^#/, "").split("?", 1)[0];
  const parts = routePath.split("/").filter(Boolean);
  const view = appViewIds.includes(parts[0] as AppView) ? parts[0] as AppView : "discover";

  if (view === "match" && parts[1] === "step") {
    const step = Number(parts[2]);
    if (Number.isInteger(step) && step >= 0 && step <= 3) {
      return { view, matchStep: step as MatchRouteStep };
    }
    return { view };
  }

  if (parts[1] === "family") {
    const familyId = decodeSegment(parts[2]);
    const racketId = parts[3] === "racket" ? decodeSegment(parts[4]) : undefined;
    return { view, ...(familyId ? { familyId } : {}), ...(racketId ? { racketId } : {}) };
  }

  if (parts[1] === "racket") {
    const racketId = decodeSegment(parts[2]);
    return { view, ...(racketId ? { racketId } : {}) };
  }

  return { view };
}

export function formatAppRoute(route: AppRoute) {
  const parts: string[] = [route.view];
  if (route.view === "match" && route.matchStep !== undefined) {
    parts.push("step", String(route.matchStep));
    return `#${parts.join("/")}`;
  }
  if (route.familyId) parts.push("family", encodeURIComponent(route.familyId));
  if (route.racketId) parts.push("racket", encodeURIComponent(route.racketId));
  return `#${parts.join("/")}`;
}

export function parentAppRoute(route: AppRoute): AppRoute {
  if (route.racketId && route.familyId) return { view: route.view, familyId: route.familyId };
  if (route.view === "match" && route.matchStep !== undefined) {
    return route.matchStep > 0
      ? { view: "match", matchStep: (route.matchStep - 1) as MatchRouteStep }
      : { view: "match" };
  }
  return { view: route.view };
}

function normalizedHash(hash: string) {
  return hash.startsWith("#") ? hash : `#${hash}`;
}

function queryFromHash(hash: string) {
  const questionMark = hash.indexOf("?");
  return questionMark >= 0 ? hash.slice(questionMark + 1) : "";
}

function knownValue(value: string | null, allowed: readonly string[], fallback: string) {
  if (!value || value.includes("\uFFFD")) return fallback;
  return allowed.includes(value) ? value : fallback;
}

function cleanSearch(value: string | null, maxLength: number) {
  if (!value || value.includes("\uFFFD")) return "";
  return value.trim().replace(/\s+/gu, " ").slice(0, maxLength);
}

export function normalizeArmoryFilters(
  filters: Partial<ArmoryFilterState> | null | undefined,
  config: ArmoryFilterConfig,
): ArmoryFilterState {
  const maxSearchLength = Math.max(0, config.maxSearchLength ?? 100);
  return {
    brand: knownValue(filters?.brand ?? null, config.brands, config.defaults.brand),
    type: knownValue(filters?.type ?? null, config.types, config.defaults.type),
    generation: knownValue(filters?.generation ?? null, config.generations, config.defaults.generation),
    releaseYear: knownValue(filters?.releaseYear ?? null, config.releaseYears, config.defaults.releaseYear),
    search: cleanSearch(filters?.search ?? null, maxSearchLength),
    sort: knownValue(filters?.sort ?? null, config.sorts, config.defaults.sort),
  };
}

export function formatArmoryRouteState(
  route: AppRoute,
  filters: Partial<ArmoryFilterState> | null | undefined,
  config: ArmoryFilterConfig,
) {
  const baseHash = formatAppRoute(route);
  if (route.view !== "armory") return baseHash;

  const normalized = normalizeArmoryFilters(filters, config);
  const query = new URLSearchParams();
  if (normalized.brand !== config.defaults.brand) query.set(armoryFilterQueryKeys.brand, normalized.brand);
  if (normalized.type !== config.defaults.type) query.set(armoryFilterQueryKeys.type, normalized.type);
  if (normalized.generation !== config.defaults.generation) query.set(armoryFilterQueryKeys.generation, normalized.generation);
  if (normalized.releaseYear !== config.defaults.releaseYear) query.set(armoryFilterQueryKeys.releaseYear, normalized.releaseYear);
  if (normalized.search) query.set(armoryFilterQueryKeys.search, normalized.search);
  if (normalized.sort !== config.defaults.sort) query.set(armoryFilterQueryKeys.sort, normalized.sort);
  const value = query.toString();
  return value ? `${baseHash}?${value}` : baseHash;
}

export function parseArmoryRouteState(hash: string, config: ArmoryFilterConfig): ParsedArmoryRouteState {
  const route = parseAppRoute(hash);
  const query = new URLSearchParams(queryFromHash(hash));
  const filters = route.view === "armory"
    ? normalizeArmoryFilters({
      brand: query.get(armoryFilterQueryKeys.brand) ?? undefined,
      type: query.get(armoryFilterQueryKeys.type) ?? undefined,
      generation: query.get(armoryFilterQueryKeys.generation) ?? undefined,
      releaseYear: query.get(armoryFilterQueryKeys.releaseYear) ?? undefined,
      search: query.get(armoryFilterQueryKeys.search) ?? undefined,
      sort: query.get(armoryFilterQueryKeys.sort) ?? undefined,
    }, config)
    : normalizeArmoryFilters(null, config);
  const canonicalHash = formatArmoryRouteState(route, filters, config);

  return {
    route,
    filters,
    canonicalHash,
    shouldReplace: normalizedHash(hash) !== canonicalHash,
  };
}

export function formatTourRouteState(
  route: AppRoute,
  tour: TourRouteFilter,
  defaultTour: TourRouteFilter = "ATP",
) {
  const baseHash = formatAppRoute(route);
  if (route.view !== "tour" || tour === defaultTour) return baseHash;
  const query = new URLSearchParams({ tour });
  return `${baseHash}?${query.toString()}`;
}

export function parseTourRouteState(
  hash: string,
  defaultTour: TourRouteFilter = "ATP",
): ParsedTourRouteState {
  const route = parseAppRoute(hash);
  const requested = new URLSearchParams(queryFromHash(hash)).get("tour");
  const tour = route.view === "tour" && tourRouteFilters.includes(requested as TourRouteFilter)
    ? requested as TourRouteFilter
    : defaultTour;
  const canonicalHash = formatTourRouteState(route, tour, defaultTour);
  return {
    route,
    tour,
    canonicalHash,
    shouldReplace: normalizedHash(hash) !== canonicalHash,
  };
}
