import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { catalogFamilies } from "../app/catalog-data.ts";
import { catalogRacketId } from "../app/racket-profiles.ts";

const root = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(root, "app/purchase-link-health.json");
const args = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, "").split("=");
  return [key, value.length ? value.join("=") : "true"];
}));
const write = args.get("write") === "true";
const brandFilter = args.get("brand")?.toLowerCase();
const limit = Math.max(1, Number(args.get("limit") ?? Number.MAX_SAFE_INTEGER));
const concurrency = Math.max(1, Math.min(10, Number(args.get("concurrency") ?? 5)));
// Optional politeness pause between requests inside each worker, so strict
// Cloudflare rate rules (429 / retry-after) can be respected on reruns.
const requestDelay = Math.max(0, Number(args.get("delay") ?? 0));
const checkedAt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());

const models = catalogFamilies
  .flatMap((family) => family.models.map((model, modelIndex) => ({
    id: catalogRacketId(family, modelIndex),
    brand: family.brand,
    url: model.url,
  })))
  .filter((item) => !brandFilter || item.brand.toLowerCase() === brandFilter)
  .slice(0, limit);

// Several models share one official product page; fetch each unique URL once
// and broadcast the verdict to every id, so shared URLs can never disagree.
const targets = new Map();
for (const model of models) {
  const ids = targets.get(model.url) ?? [];
  targets.set(model.url, [...ids, model.id]);
}
const uniqueUrls = [...targets.keys()];

let manifest = {};
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
  manifest = {};
}

function registrableDomain(hostname) {
  return hostname.toLowerCase().split(".").slice(-2).join(".");
}

// "/" or a bare locale root such as /en, /en-US/, /ja_jp — a product link
// that lands here was silently retired by the brand site.
function isRootPath(pathname) {
  return /^\/(?:[a-z]{2}(?:[-_][a-z]{2})?\/?)?$/i.test(pathname);
}

async function fetchVerdict(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.8,ja;q=0.6",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136 Safari/537.36 PaikuCatalogVerifier/1.0",
      },
    });
    const finalUrl = response.url || url;
    await response.body?.cancel();
    return { httpStatus: response.status, finalUrl };
  } finally {
    clearTimeout(timer);
  }
}

function classify(url, outcome) {
  if (outcome.error) {
    const code = outcome.error?.cause?.code ?? outcome.error?.code ?? outcome.error?.name ?? "unknown";
    // A dead hostname is a hard failure; timeouts and resets stay unreachable.
    const status = code === "ENOTFOUND" ? "broken" : "unreachable";
    return { status, httpStatus: null, finalUrl: null, detail: String(code) };
  }
  const { httpStatus, finalUrl } = outcome;
  if (httpStatus === 404 || httpStatus === 410) {
    return { status: "broken", httpStatus, finalUrl, detail: `HTTP ${httpStatus}` };
  }
  if (httpStatus >= 200 && httpStatus < 300) {
    const origin = new URL(url);
    const landing = new URL(finalUrl);
    if (registrableDomain(landing.hostname) !== registrableDomain(origin.hostname)) {
      return { status: "changed", httpStatus, finalUrl, detail: "cross-domain redirect" };
    }
    if (isRootPath(landing.pathname) && !isRootPath(origin.pathname)) {
      return { status: "changed", httpStatus, finalUrl, detail: "redirected to site root" };
    }
    return { status: "ok", httpStatus, finalUrl, detail: null };
  }
  // 403/405/429/5xx and other blocks: anti-bot walls are not dead links.
  return { status: "unreachable", httpStatus, finalUrl, detail: `HTTP ${httpStatus}` };
}

async function attemptOnce(url) {
  try {
    return await fetchVerdict(url);
  } catch (error) {
    return { error };
  }
}

async function checkUrl(url) {
  let attempt = 1;
  let verdict = classify(url, await attemptOnce(url));
  if (verdict.status === "broken" || verdict.status === "unreachable") {
    // One backoff retry so a transient network blip cannot flag a live link.
    await delay(2_000);
    attempt = 2;
    verdict = classify(url, await attemptOnce(url));
  }
  return { ...verdict, attempt };
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

const verdicts = await runPool(uniqueUrls, async (url) => {
  const verdict = await checkUrl(url);
  if (requestDelay) await delay(requestDelay);
  for (const id of targets.get(url)) {
    process.stdout.write(`${JSON.stringify({
      id,
      url,
      status: verdict.status,
      httpStatus: verdict.httpStatus,
      finalUrl: verdict.finalUrl,
      detail: verdict.detail,
      attempt: verdict.attempt,
    })}\n`);
  }
  return { url, ...verdict };
});

const counts = { ok: 0, changed: 0, broken: 0, unreachable: 0 };
for (const verdict of verdicts) {
  const ids = targets.get(verdict.url);
  counts[verdict.status] += ids.length;
  if (verdict.status === "unreachable") continue;
  for (const id of ids) {
    const record = {
      url: verdict.url,
      status: verdict.status,
      httpStatus: verdict.httpStatus,
      ...(verdict.finalUrl && verdict.finalUrl !== verdict.url ? { finalUrl: verdict.finalUrl } : {}),
      checkedAt,
    };
    manifest = { ...manifest, [id]: record };
  }
}

if (write) {
  const sortedManifest = Object.fromEntries(Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right)));
  await writeFile(manifestPath, `${JSON.stringify(sortedManifest, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify({
  write,
  requested: models.length,
  uniqueUrls: uniqueUrls.length,
  manifest: Object.keys(manifest).length,
  counts,
})}\n`);
if (counts.broken) process.exitCode = 2;
