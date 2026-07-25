import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [page, css] = await Promise.all([
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

const mobilePassStart = css.indexOf("/* === mobile ux consistency pass === */");
const mobilePass = css.slice(mobilePassStart);

test("presents the prescription baseline as a full-row mobile racket selector", () => {
  assert.match(page, /className="prescription-baseline__summary"/);
  assert.match(page, /className="prescription-baseline__thumb"/);
  assert.match(page, /className="prescription-baseline__model"/);
  assert.match(page, /作为迁移差异基准/);
  assert.match(page, /aria-label="选择当前使用的球拍"/);
  assert.match(mobilePass, /\.match-view \.prescription-baseline\s*{[\s\S]*?min-height:\s*72px/);
  assert.match(mobilePass, /\.match-view \.prescription-baseline select\s*{[\s\S]*?inset:\s*0;[\s\S]*?opacity:\s*0;[\s\S]*?position:\s*absolute/);
  assert.match(mobilePass, /\.match-view \.prescription-baseline:focus-within\s*{[\s\S]*?border-color:\s*var\(--m-accent\)/);
});

test("uses a compact result status card without repeating the baseline as a chip", () => {
  assert.match(page, /className="match-result-hero__eyebrow">当前处方/);
  assert.match(page, /className="match-result-hero__title"[\s\S]*?\{profileStage\} · \{profileStyle\}/);
  assert.match(page, /className="match-result-hero__summary"[\s\S]*?优先方向 · \{displayPriority\}/);
  assert.match(page, /基于 \$\{prescriptionBaseline\.model\} 计算迁移差异/);
  assert.match(page, /className="match-result-hero__edit"[\s\S]*?aria-label="修改处方答案">修改<\/button>/);
  assert.doesNotMatch(page, /<span>\{prescriptionBaseline \? `从 \$\{prescriptionBaseline\.model\} 出发`/);
  assert.match(mobilePass, /\.match-view \.match-result-hero__title\s*{[\s\S]*?font-size:\s*21px/);
  assert.match(mobilePass, /\.match-view \.match-result-hero__title:focus,[\s\S]*?outline:\s*none/);
  assert.match(mobilePass, /\.match-view \.match-result-hero \.match-result-hero__edit\s*{[\s\S]*?min-height:\s*44px;[\s\S]*?position:\s*absolute/);
});
