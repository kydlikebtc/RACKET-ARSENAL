export type CatalogFamilySearchItem = {
  brand: string;
  family: string;
  generation: string;
  type: string;
  models: readonly { name: string }[];
};

export type CatalogRacketSearchItem = {
  brand: string;
  model: string;
  familyName?: string | null;
  series?: string | null;
  generation?: string | null;
  familyType?: string | null;
};

const combiningMarksPattern = /\p{M}+/gu;
const multiplicationMarksPattern = /[×✕✖]/gu;
const tokenSeparatorPattern = /[\s\p{P}\p{S}]+/gu;

function foldCatalogSearchValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(combiningMarksPattern, "")
    .replace(multiplicationMarksPattern, "x")
    .toLowerCase();
}

/** Normalizes a catalog value for accent-, case-, spacing-, and punctuation-insensitive matching. */
export function normalizeCatalogSearchText(value: string) {
  return foldCatalogSearchValue(value).replace(tokenSeparatorPattern, "");
}

/** Splits a query at whitespace, punctuation, and symbols while preserving tennis patterns such as 16×19. */
export function tokenizeCatalogSearch(query: string) {
  const tokens = foldCatalogSearchValue(query)
    .split(tokenSeparatorPattern)
    .map(normalizeCatalogSearchText)
    .filter(Boolean);

  return [...new Set(tokens)];
}

/** Requires every normalized query token to occur somewhere in the item's combined catalog fields. */
export function matchesCatalogSearchValues(values: readonly (string | null | undefined)[], query: string) {
  const tokens = tokenizeCatalogSearch(query);
  if (tokens.length === 0) return true;

  const haystack = normalizeCatalogSearchText(values.filter((value): value is string => Boolean(value)).join(" "));
  return tokens.every((token) => haystack.includes(token));
}

export function matchesCatalogFamilySearch(family: CatalogFamilySearchItem, query: string) {
  return matchesCatalogSearchValues([
    family.brand,
    family.family,
    family.generation,
    family.type,
    ...family.models.map((model) => model.name),
  ], query);
}

export function matchesCatalogRacketSearch(racket: CatalogRacketSearchItem, query: string) {
  return matchesCatalogSearchValues([
    racket.brand,
    racket.familyName,
    racket.series,
    racket.generation,
    racket.familyType,
    racket.model,
  ], query);
}

/** Creates one semantic history boundary when a search starts or is cleared. */
export function catalogSearchHistoryMode(previousQuery: string, nextQuery: string) {
  return Boolean(previousQuery.trim()) === Boolean(nextQuery.trim()) ? "replace" as const : "push" as const;
}

export function catalogReleaseYear(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})/u);
  return match ? Number(match[1]) : null;
}

export function matchesCatalogReleaseYearFilter(
  value: string | number | null | undefined,
  filter: string,
) {
  const year = catalogReleaseYear(value);
  if (filter === "全部年份") return true;
  if (filter === "官网未注明") return year === null;
  if (filter === "2023及更早") return year !== null && year <= 2023;
  return year === Number(filter);
}

export function countCatalogReleaseYearMatches(
  values: readonly (string | number | null | undefined)[],
  filter: string,
) {
  return values.filter((value) => matchesCatalogReleaseYearFilter(value, filter)).length;
}
