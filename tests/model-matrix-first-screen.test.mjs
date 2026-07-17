import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps every deep-dossier entry in the sticky first column", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const mapStart = page.indexOf("{selectedFamily.models.map");
  const mapEnd = page.indexOf("</tbody>", mapStart);
  const source = page.slice(mapStart, mapEnd);
  const identityStart = source.indexOf('<th scope="row" className="model-matrix__identity">');
  const identityEnd = source.indexOf("</th>", identityStart);
  const dossier = source.indexOf("family-dossier-${racketProfile.id}");
  const radar = source.indexOf('className="model-matrix__radar-cell"');
  const actions = source.indexOf('<div className="model-matrix__actions">');

  assert.ok(identityStart >= 0 && identityEnd > identityStart);
  assert.ok(dossier > identityStart && dossier < identityEnd, "dossier control must live inside the first identity cell");
  assert.ok(dossier < radar && radar < actions, "keyboard and reading order must reach the dossier before horizontally scrolled content");
  assert.match(source.slice(identityStart, identityEnd), /data-racket-id=\{racketProfile\.id\}/, "return-focus anchor moves with the dossier control");
  assert.match(source.slice(identityStart, identityEnd), /<RacketSpecTags racket=\{racketProfile\} compact showSpecs=\{false\} \/>/);

  const actionsEnd = source.indexOf("</div>", actions);
  const actionSource = source.slice(actions, actionsEnd);
  assert.doesNotMatch(actionSource, /family-dossier-|\u6df1\u5ea6\u6863\u6848/);
  assert.match(actionSource, /family-compare-/);
  assert.match(actionSource, /\u5b98\u7f51\u8d44\u6599/);
});

test("styles the dossier as a reachable sticky primary action on desktop and mobile", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const stickyCell = css.match(/\.model-matrix tbody th \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const dossier = css.match(/\.model-matrix__dossier \{([\s\S]*?)\n\}/)?.[1] ?? "";

  assert.match(stickyCell, /position:\s*sticky/);
  assert.match(stickyCell, /left:\s*0/);
  assert.match(stickyCell, /z-index:\s*1/);
  assert.match(stickyCell, /background:\s*var\(--surface\)/);
  assert.match(dossier, /min-height:\s*44px/);
  assert.match(dossier, /width:\s*100%/);
  assert.match(css, /\.model-matrix__dossier:focus-visible/);
  assert.match(css, /\.model-matrix tbody th[\s\S]*?grid-column:\s*1 \/ -1[\s\S]*?position:\s*static/);
  assert.match(css, /\.model-matrix__actions[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});
