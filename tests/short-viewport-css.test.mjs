import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const shortLandscapeStart = css.indexOf(
  "@media (min-width: 761px) and (max-width: 930px) and (max-height: 480px) and (orientation: landscape)",
);
const mobileStart = css.indexOf("@media (max-width: 760px)", shortLandscapeStart);
const shortLandscapeRules = css.slice(shortLandscapeStart, mobileStart);

test("short landscape navigation keeps all five destinations reachable", () => {
  assert.notEqual(shortLandscapeStart, -1, "missing the short-landscape breakpoint");
  assert.notEqual(mobileStart, -1, "short-landscape rules must precede the mobile fallback");
  assert.match(shortLandscapeRules, /\.desktop-sidebar\s*{[\s\S]*?overflow-y:\s*auto;/);
  assert.match(shortLandscapeRules, /overscroll-behavior:\s*contain;/);
  assert.match(
    shortLandscapeRules,
    /\.desktop-sidebar nav button\s*{[\s\S]*?min-height:\s*44px;/,
  );
});

test("short landscape navigation removes the status-card collision and preserves safe areas", () => {
  assert.match(shortLandscapeRules, /\.sidebar-status\s*{\s*display:\s*none;\s*}/);
  assert.match(shortLandscapeRules, /env\(safe-area-inset-top\)/);
  assert.match(shortLandscapeRules, /env\(safe-area-inset-bottom\)/);
  assert.match(shortLandscapeRules, /env\(safe-area-inset-left\)/);
});
