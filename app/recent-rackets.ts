/**
 * 「最近看过」纯逻辑模块。
 *
 * 记录/移除/宽容恢复都返回新数组（不可变），持久化格式为 canonical
 * racket id 的字符串数组，随现有 catalog 域载荷落盘；任何解析失败都
 * 退化为空列表，绝不影响同载荷中的其他字段。
 */

export const MAX_RECENT_RACKETS = 12;

/** 记录一次深度档案浏览：已存在则去重置顶，超出上限丢弃最旧。 */
export function recordRecentRacket(
  input: ReadonlyArray<string>,
  id: string,
): string[] {
  return [id, ...input.filter((item) => item !== id)].slice(
    0,
    MAX_RECENT_RACKETS,
  );
}

/**
 * 宽容恢复持久化载荷：非数组等同空列表；非字符串/空串项丢弃；
 * resolveId 用于把 legacy id canonical 化并过滤失效 id（返回 null 即丢弃）；
 * 输出去重并截断到上限。
 */
export function normalizeRecentRackets(
  input: unknown,
  resolveId?: (id: string) => string | null,
): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of input) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const canonical = resolveId ? resolveId(trimmed) : trimmed;
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    normalized.push(canonical);
    if (normalized.length === MAX_RECENT_RACKETS) break;
  }
  return normalized;
}

/** 单条移除：不存在时原样返回等价的新数组。 */
export function removeRecentRacket(
  input: ReadonlyArray<string>,
  id: string,
): string[] {
  return input.filter((item) => item !== id);
}
