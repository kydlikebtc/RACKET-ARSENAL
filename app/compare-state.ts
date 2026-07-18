import { formatAppRoute, parseAppRoute, type AppRoute } from "./navigation-state";

export const COMPARE_SLOT_COUNT = 3 as const;

export type CompareSlotIndex = 0 | 1 | 2;

export type CompareSlot = Readonly<{
  slot: CompareSlotIndex;
  id: string;
}>;

export type CompareSlots = ReadonlyArray<CompareSlot>;

export type CompareSlotChange = Readonly<{
  slots: CompareSlots;
  action: "added" | "removed" | "replaced" | "full" | "unchanged";
  slot: CompareSlotIndex | null;
}>;

export type CompareUndoSnapshot = Readonly<{
  before: CompareSlots;
  after: CompareSlots;
}>;

export type CompareChange = {
  ids: string[];
  action: "added" | "removed" | "full";
};

type UnknownRecord = Record<string, unknown>;

export type ParsedCompareRouteState = {
  route: AppRoute;
  slots: CompareSlots;
  hasExplicitSlots: boolean;
  rejectedSlots: ReadonlyArray<CompareSlotIndex>;
  rejectedCount: number;
  /** True only for a well-formed duel link: compare view, vs=1 exactly once, and a resolved slot-0 racket. */
  duel: boolean;
  canonicalHash: string;
  shouldReplace: boolean;
};

export type CompareNavigationSource = "initial" | "pop" | "hash";

/**
 * The compare basket is global during one app session. Shared URL slots are
 * imported on cold/direct navigation, while app-owned Back/Forward entries
 * are canonicalized to the current basket instead of rolling it back.
 */
export function shouldImportCompareRoute(
  source: CompareNavigationSource,
  appOwnedHistoryEntry: boolean,
) {
  return source !== "pop" || !appOwnedHistoryEntry;
}

const compareRouteKeys = ["r0", "r1", "r2"] as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function normalizeId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id.length > 0 ? id : null;
}

function isCompareSlotIndex(value: unknown): value is CompareSlotIndex {
  return Number.isInteger(value) && typeof value === "number" && value >= 0 && value < COMPARE_SLOT_COUNT;
}

function queryFromHash(hash: string) {
  const questionMark = hash.indexOf("?");
  return questionMark >= 0 ? hash.slice(questionMark + 1) : "";
}

function normalizedHash(hash: string) {
  return hash.startsWith("#") ? hash : `#${hash}`;
}

/**
 * Encodes the three stable compare slots so a comparison can be reopened or
 * shared. The optional duel flag appends `vs=1` after the slot keys; it is
 * only honored on the compare view so no other view can carry a duel marker.
 */
export function formatCompareRouteState(route: AppRoute, input: unknown, options?: { duel?: boolean }) {
  const baseHash = formatAppRoute(route);
  if (route.view !== "compare") return baseHash;
  const query = new URLSearchParams();
  for (const { slot, id } of normalizeCompareSlots(input)) query.set(compareRouteKeys[slot], id);
  if (options?.duel) query.set("vs", "1");
  const value = query.toString();
  return value ? `${baseHash}?${value}` : baseHash;
}

/**
 * Reads a shared comparison without trusting ids from the URL. A resolver can
 * canonicalize legacy ids and reject models that no longer exist.
 */
export function parseCompareRouteState(
  hash: string,
  resolveId?: (id: string) => string | null | undefined,
): ParsedCompareRouteState {
  const route = parseAppRoute(hash);
  const query = new URLSearchParams(queryFromHash(hash));
  const hasExplicitSlots = route.view === "compare" && compareRouteKeys.some((key) => query.has(key));
  const candidates: CompareSlot[] = [];
  const rejectedSlotSet = new Set<CompareSlotIndex>();

  if (hasExplicitSlots) {
    compareRouteKeys.forEach((key, slot) => {
      const slotIndex = slot as CompareSlotIndex;
      if (!query.has(key)) return;
      const rawId = normalizeId(query.get(key));
      if (!rawId) {
        rejectedSlotSet.add(slotIndex);
        return;
      }
      if (rawId.includes("\uFFFD") || rawId.length > 180) {
        rejectedSlotSet.add(slotIndex);
        return;
      }
      const id = normalizeId(resolveId ? resolveId(rawId) : rawId);
      if (id) {
        candidates.push({ slot: slotIndex, id });
      } else {
        rejectedSlotSet.add(slotIndex);
      }
    });
  }

  const slots = normalizeCompareSlots(candidates);
  for (const candidate of candidates) {
    if (!slots.some(({ slot, id }) => slot === candidate.slot && id === candidate.id)) {
      rejectedSlotSet.add(candidate.slot);
    }
  }
  const rejectedSlots = ([0, 1, 2] as const).filter((slot) => rejectedSlotSet.has(slot));
  const vsValues = query.getAll("vs");
  const duel = route.view === "compare"
    && vsValues.length === 1
    && vsValues[0] === "1"
    && slots.some(({ slot }) => slot === 0);
  const canonicalHash = formatCompareRouteState(route, slots, { duel });
  return {
    route,
    slots,
    hasExplicitSlots,
    rejectedSlots,
    rejectedCount: rejectedSlots.length,
    duel,
    canonicalHash,
    shouldReplace: normalizedHash(hash) !== canonicalHash,
  };
}

function persistedItems(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (!isRecord(input)) return [];

  if (Array.isArray(input.slots)) return input.slots;
  if (Array.isArray(input.compareSlots)) return input.compareSlots;
  if (Array.isArray(input.compareIds)) return input.compareIds;
  return [];
}

/**
 * Turns both the current slot payload and the legacy `string[]` payload into a
 * canonical, slot-ordered snapshot. Invalid entries and duplicate ids/slots
 * are discarded, so every result is safe to use as application state.
 */
export function normalizeCompareSlots(input: unknown): CompareSlots {
  const candidates = persistedItems(input)
    .map((item, sourceIndex) => {
      if (typeof item === "string") {
        const id = normalizeId(item);
        return id && isCompareSlotIndex(sourceIndex) ? { id, slot: sourceIndex as CompareSlotIndex, sourceIndex } : null;
      }
      if (!isRecord(item)) return null;
      const id = normalizeId(item.id);
      return id && isCompareSlotIndex(item.slot) ? { id, slot: item.slot, sourceIndex } : null;
    })
    .filter((candidate): candidate is { id: string; slot: CompareSlotIndex; sourceIndex: number } => candidate !== null)
    .sort((left, right) => left.slot - right.slot || left.sourceIndex - right.sourceIndex);

  const ids = new Set<string>();
  const slotIndexes = new Set<CompareSlotIndex>();
  const slots: CompareSlot[] = [];

  for (const candidate of candidates) {
    if (ids.has(candidate.id) || slotIndexes.has(candidate.slot)) continue;
    ids.add(candidate.id);
    slotIndexes.add(candidate.slot);
    slots.push({ slot: candidate.slot, id: candidate.id });
  }

  return slots;
}

export function compareSlotIds(input: unknown): string[] {
  return normalizeCompareSlots(input).map(({ id }) => id);
}

export function addCompareId(input: unknown, rawId: string): CompareSlotChange {
  const slots = normalizeCompareSlots(input);
  const id = normalizeId(rawId);
  if (!id) return { slots, action: "unchanged", slot: null };

  const existing = slots.find((item) => item.id === id);
  if (existing) return { slots, action: "unchanged", slot: existing.slot };
  if (slots.length >= COMPARE_SLOT_COUNT) return { slots, action: "full", slot: null };

  const occupied = new Set(slots.map((item) => item.slot));
  const slot = ([0, 1, 2] as const).find((index) => !occupied.has(index));
  if (slot === undefined) return { slots, action: "full", slot: null };

  return {
    slots: [...slots, { slot, id }].sort((left, right) => left.slot - right.slot),
    action: "added",
    slot,
  };
}

export function removeCompareId(input: unknown, rawId: string): CompareSlotChange {
  const slots = normalizeCompareSlots(input);
  const id = normalizeId(rawId);
  const removed = id ? slots.find((item) => item.id === id) : undefined;
  if (!removed) return { slots, action: "unchanged", slot: null };

  return {
    slots: slots.filter((item) => item.id !== id),
    action: "removed",
    slot: removed.slot,
  };
}

export function replaceCompareId(input: unknown, victimId: string, replacementId: string): CompareSlotChange {
  const slots = normalizeCompareSlots(input);
  const victim = normalizeId(victimId);
  const replacement = normalizeId(replacementId);
  const victimSlot = victim ? slots.find((item) => item.id === victim) : undefined;

  if (!victimSlot || !replacement || replacement === victim) {
    return { slots, action: "unchanged", slot: victimSlot?.slot ?? null };
  }
  if (slots.some((item) => item.id === replacement)) {
    return { slots, action: "unchanged", slot: victimSlot.slot };
  }

  return {
    slots: slots.map((item) => item.id === victim ? { slot: item.slot, id: replacement } : item),
    action: "replaced",
    slot: victimSlot.slot,
  };
}

export function compareSlotsEqual(left: unknown, right: unknown): boolean {
  const normalizedLeft = normalizeCompareSlots(left);
  const normalizedRight = normalizeCompareSlots(right);
  if (normalizedLeft.length !== normalizedRight.length) return false;
  return normalizedLeft.every((slot, index) => (
    slot.slot === normalizedRight[index].slot && slot.id === normalizedRight[index].id
  ));
}

export function createCompareUndo(before: unknown, after: unknown): CompareUndoSnapshot | null {
  const normalizedBefore = normalizeCompareSlots(before);
  const normalizedAfter = normalizeCompareSlots(after);
  if (compareSlotsEqual(normalizedBefore, normalizedAfter)) return null;
  return { before: normalizedBefore, after: normalizedAfter };
}

export function canUndoCompareChange(current: unknown, undo: CompareUndoSnapshot | null | undefined): boolean {
  return Boolean(
    undo
      && !compareSlotsEqual(undo.before, undo.after)
      && compareSlotsEqual(current, undo.after),
  );
}

export function applyCompareUndo(current: unknown, undo: CompareUndoSnapshot | null | undefined): CompareSlots | null {
  return canUndoCompareChange(current, undo) ? normalizeCompareSlots(undo?.before) : null;
}

/**
 * Compatibility wrapper for callers that still store a packed `string[]`.
 * New code should use the slot-based helpers above to preserve empty slots.
 */
export function toggleCompareId(current: string[], id: string, limit = 3): CompareChange {
  if (current.includes(id)) return { ids: current.filter((item) => item !== id), action: "removed" };
  if (current.length >= limit) return { ids: current, action: "full" };
  return { ids: [...current, id], action: "added" };
}
