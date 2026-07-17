import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { catalogFamilies } from "../app/catalog-data.ts";
import { catalogRacketId } from "../app/racket-profiles.ts";

const root = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(root, "app/catalog-model-images.json");
const outputRoot = path.join(root, "public/rackets/models");
const args = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.replace(/^--/, "").split("=");
  return [key, value.length ? value.join("=") : "true"];
}));
const write = args.get("write") === "true";
const force = args.get("force") === "true";
const brandFilter = args.get("brand")?.toLowerCase();
const limit = Math.max(1, Number(args.get("limit") ?? Number.MAX_SAFE_INTEGER));
const concurrency = Math.max(1, Math.min(10, Number(args.get("concurrency") ?? 5)));
const maxImages = Math.max(1, Math.min(4, Number(args.get("max-images") ?? 3)));
const verifiedAt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());

const models = catalogFamilies
  .flatMap((family) => family.models.map((model, modelIndex) => ({
    id: catalogRacketId(family, modelIndex),
    brand: family.brand,
    family: family.family,
    model: model.name,
    sourceUrl: model.url,
  })))
  .filter((item) => !brandFilter || item.brand.toLowerCase() === brandFilter)
  .slice(0, limit);

let manifest = {};
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
  manifest = {};
}

function slug(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function decodeHtml(value) {
  return value
    .replace(/\\u002[fF]/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeImageUrl(value, pageUrl) {
  if (typeof value !== "string") return null;
  let candidate = decodeHtml(value.trim());
  if (!candidate || candidate.startsWith("data:")) return null;
  if (/\s+\d+(?:\.\d+)?[wx](?:,|$)/.test(candidate)) candidate = candidate.split(/\s+/)[0];
  candidate = candidate.replace(/^['"]|['"]$/g, "");
  try {
    const url = new URL(candidate, pageUrl);
    if (!/^https?:$/.test(url.protocol)) return null;
    if (/\.(?:svg|gif)(?:$|\?)/i.test(url.href)) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return result;
}

function pushCandidate(candidates, value, pageUrl, source) {
  if (Array.isArray(value)) {
    value.forEach((item) => pushCandidate(candidates, item, pageUrl, source));
    return;
  }
  if (value && typeof value === "object") {
    pushCandidate(candidates, value.url ?? value.contentUrl ?? value.src, pageUrl, source);
    return;
  }
  const url = normalizeImageUrl(value, pageUrl);
  if (url) candidates.push({ url, source });
}

function collectProductImages(value, candidates, pageUrl, insideProduct = false) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectProductImages(item, candidates, pageUrl, insideProduct));
    return;
  }
  if (!value || typeof value !== "object") return;
  const type = value["@type"];
  const product = insideProduct || type === "Product" || (Array.isArray(type) && type.includes("Product"));
  if (product && value.image) pushCandidate(candidates, value.image, pageUrl, "jsonld");
  Object.values(value).forEach((item) => collectProductImages(item, candidates, pageUrl, product));
}

function extractHtmlCandidates(html, pageUrl) {
  const candidates = [];
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = attributes(tag);
    const key = (attrs.property ?? attrs.name ?? "").toLowerCase();
    if (["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"].includes(key)) {
      pushCandidate(candidates, attrs.content, pageUrl, key.startsWith("og:") ? "og" : "twitter");
    }
  }
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      collectProductImages(JSON.parse(decodeHtml(match[1])), candidates, pageUrl);
    } catch {
      // Some stores emit non-standard JSON-LD; the image attributes below remain usable.
    }
  }
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const attrs = attributes(tag);
    for (const key of ["data-zoom-image", "data-src", "data-original", "data-image", "src"]) {
      pushCandidate(candidates, attrs[key], pageUrl, "img");
    }
    const srcset = attrs.srcset ?? attrs["data-srcset"];
    if (srcset) srcset.split(",").forEach((item) => pushCandidate(candidates, item.trim(), pageUrl, "srcset"));
  }
  for (const match of html.matchAll(/https?:\\?\/\\?\/[^\s"'<>]+?\.(?:jpe?g|png|webp)(?:\?[^\s"'<>]*)?/gi)) {
    pushCandidate(candidates, match[0], pageUrl, "raw");
  }
  return candidates;
}

function headCdnCandidates(item) {
  const source = new URL(item.sourceUrl);
  if (!/(?:^|\.)head\.com$/i.test(source.hostname)) return [];
  const tail = source.pathname.split("/").filter(Boolean).at(-1) ?? "";
  const match = tail.match(/^(.*)-(\d{6})$/);
  if (!match) return [];
  const [, productSlug, sku] = match;
  const candidates = [];
  for (const extension of ["jpg", "webp"]) {
    for (let view = 1; view <= 4; view += 1) {
      candidates.push({
        url: `https://cdn-mdb.head.com/CDN3/D/${sku}/${view}/768x768/${productSlug}.${extension}`,
        source: "head",
      });
    }
  }
  return candidates;
}

async function fetchResponse(url, accept = "text/html,application/xhtml+xml") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept,
        "accept-language": "en-US,en;q=0.8,ja;q=0.6",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136 Safari/537.36 PaikuCatalogVerifier/1.0",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function shopifyCandidates(pageUrl) {
  const url = new URL(pageUrl);
  if (!url.pathname.includes("/products/")) return [];
  url.pathname = `${url.pathname.replace(/\/$/, "")}.js`;
  try {
    const product = await (await fetchResponse(url, "application/json")).json();
    const candidates = [];
    pushCandidate(candidates, product.images, pageUrl, "shopify");
    pushCandidate(candidates, product.featured_image, pageUrl, "shopify");
    return candidates;
  } catch {
    return [];
  }
}

function scoreCandidate(candidate, item) {
  const weights = { head: 170, shopify: 150, jsonld: 140, og: 125, twitter: 110, img: 65, srcset: 55, raw: 30 };
  let score = weights[candidate.source] ?? 0;
  const lower = decodeURIComponent(candidate.url).toLowerCase();
  const pageTail = new URL(item.sourceUrl).pathname.split("/").filter(Boolean).at(-1) ?? "";
  const tokens = `${item.model} ${item.family} ${pageTail}`.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];
  const ignored = new Set(["tennis", "racket", "racquet", "frame", "unstrung", "gen", "the", "and"]);
  for (const token of new Set(tokens.filter((value) => !ignored.has(value)))) {
    if (lower.includes(token)) score += token.length >= 5 ? 10 : 5;
  }
  if (/media\/catalog\/product|cdn-mdb\.head\.com|product|products/.test(lower)) score += 35;
  if (/zoom|large|original|1200|1600|2000/.test(lower)) score += 15;
  if (/logo|icon|sprite|flag|payment|avatar|favicon|placeholder|swatch|badge|newsletter|storefront/.test(lower)) score -= 240;
  if (/banner|blog|article|lookbook|lifestyle|player|team/.test(lower)) score -= 45;
  return score;
}

async function collectCandidates(item) {
  const htmlResponse = await fetchResponse(item.sourceUrl);
  const html = await htmlResponse.text();
  const pageUrl = htmlResponse.url || item.sourceUrl;
  const candidates = [...headCdnCandidates(item), ...await shopifyCandidates(pageUrl), ...extractHtmlCandidates(html, pageUrl)];
  const unique = new Map();
  for (const candidate of candidates) {
    const key = candidate.url.replace(/([?&])(?:width|height|w|h|quality|q)=\d+/gi, "$1").replace(/[?&]$/, "");
    const current = unique.get(key);
    if (!current || scoreCandidate(candidate, item) > scoreCandidate(current, item)) unique.set(key, candidate);
  }
  return [...unique.values()].sort((left, right) => scoreCandidate(right, item) - scoreCandidate(left, item));
}

async function downloadImage(candidate, item, imageIndex) {
  const response = await fetchResponse(candidate.url, "image/avif,image/webp,image/apng,image/*,*/*;q=0.8");
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) throw new Error(`not image (${contentType || "unknown"})`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 24 * 1024 * 1024) throw new Error("image exceeds 24 MiB");
  const sourceMetadata = await sharp(buffer, { failOn: "error" }).metadata();
  if (Math.max(sourceMetadata.width ?? 0, sourceMetadata.height ?? 0) < 700) throw new Error("image is too small");
  const encoded = await sharp(buffer, { failOn: "error" })
    .rotate()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4, smartSubsample: true })
    .toBuffer();
  const brandDirectory = slug(item.brand);
  const filename = `${item.id}-${imageIndex + 1}.webp`;
  const absolutePath = path.join(outputRoot, brandDirectory, filename);
  if (write) {
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, encoded);
  }
  return {
    path: `/rackets/models/${brandDirectory}/${filename}`,
    hash: createHash("sha256").update(encoded).digest("hex").slice(0, 16),
    bytes: encoded.length,
  };
}

async function syncModel(item) {
  if (!force && manifest[item.id]?.images?.length) return { id: item.id, status: "skipped", images: manifest[item.id].images };
  try {
    const candidates = await collectCandidates(item);
    const images = [];
    const hashes = new Set();
    for (const candidate of candidates.slice(0, 18)) {
      if (images.length >= maxImages) break;
      try {
        const image = await downloadImage(candidate, item, images.length);
        if (hashes.has(image.hash)) continue;
        hashes.add(image.hash);
        images.push(image);
      } catch {
        // Try the next official-page image candidate.
      }
    }
    if (!images.length) throw new Error(`no valid product image among ${candidates.length} candidates`);
    const record = {
      images: images.map((image) => image.path),
      sourceUrl: item.sourceUrl,
      verifiedAt,
      sourceKind: "official-product",
    };
    if (write) manifest[item.id] = record;
    return { id: item.id, status: "synced", images: record.images, bytes: images.reduce((sum, image) => sum + image.bytes, 0) };
  } catch (error) {
    return { id: item.id, status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}

async function runPool(items) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await syncModel(items[index]);
      process.stdout.write(`${JSON.stringify(results[index])}\n`);
    }
  }));
  return results;
}

const results = await runPool(models);
if (write) {
  const sortedManifest = Object.fromEntries(Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right)));
  await writeFile(manifestPath, `${JSON.stringify(sortedManifest, null, 2)}\n`);
}
const counts = results.reduce((summary, result) => ({ ...summary, [result.status]: (summary[result.status] ?? 0) + 1 }), {});
process.stdout.write(`${JSON.stringify({ write, requested: models.length, manifest: Object.keys(manifest).length, counts })}\n`);
if (counts.failed) process.exitCode = 2;
