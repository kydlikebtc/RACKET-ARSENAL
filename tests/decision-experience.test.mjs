import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, css, route, hosting] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/api/decision-room/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
]);

test("turns the old match and compare tabs into one guided decision loop", () => {
  assert.match(page, /id: "match", label: "处方"/);
  assert.match(page, /id: "compare", label: "决策"/);
  assert.match(page, /title="换拍处方"/);
  assert.match(page, /title="选拍决策室"/);
  assert.match(page, /function PrescriptionBaselinePicker/);
  assert.match(page, /buildSwapPrescription\(deepRackets, prescriptionBaseline/);
  assert.match(page, /className="decision-workflow"/);
  assert.match(page, /当前球拍[\s\S]*?收敛候选[\s\S]*?完成试打[\s\S]*?作出选择/);
});

test("gives every candidate an actionable status, note, and trial record", () => {
  assert.match(page, /className=\{`decision-candidate decision-candidate--\$\{candidate\.status\}`\}/);
  assert.match(page, /aria-label=\{`\$\{racket\.model\} 的决策状态`\}/);
  assert.match(page, /记录试打/);
  assert.match(page, /className="decision-candidate__note"/);
  assert.match(page, /className="trial-feedback-card"/);
  assert.match(page, /\["control", "power", "comfort"\]/);
  assert.match(page, /className="trial-feedback-history"/);
});

test("persists private decision rooms and trial feedback through the platform database", () => {
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function PUT/);
  assert.match(route, /export async function POST/);
  assert.match(route, /getChatGPTUser/);
  assert.match(route, /private, no-store/);
  assert.match(route, /await d1\.batch\(statements\)/);
  assert.match(hosting, /"d1"\s*:\s*"DB"/);
});

test("keeps the decision workflow touchable and collapses it cleanly on phones", () => {
  assert.match(css, /\.decision-workflow[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.decision-candidate__tools select[\s\S]*?min-height:\s*44px/);
  assert.match(css, /\.trial-feedback-card__ratings button[\s\S]*?min-height:\s*44px/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.decision-workflow ol[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.compare-product-grid[\s\S]*?grid-template-columns:\s*1fr/);
});
