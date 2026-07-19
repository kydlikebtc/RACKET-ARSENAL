import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { tourPlayers } from "../app/tour-data.ts";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("keeps sixteen uniquely identified players ordered ATP and WTA rank 1 through 8", () => {
  assert.equal(tourPlayers.length, 16);

  const ids = tourPlayers.map((player) => player.id);
  assert.equal(new Set(ids).size, ids.length, "tour player ids must be unique");

  for (const tour of ["ATP", "WTA"]) {
    const players = tourPlayers.filter((player) => player.tour === tour);
    assert.equal(players.length, 8, `${tour} must contain exactly eight players`);
    assert.deepEqual(
      players.map((player) => player.rank),
      [1, 2, 3, 4, 5, 6, 7, 8],
      `${tour} records must stay ordered from rank 1 through 8`,
    );
  }
});

test("backs every player portrait with a non-empty local JPEG and Wikimedia Commons provenance", async () => {
  for (const player of tourPlayers) {
    const expectedSrc = `/players/${player.id}.jpg`;
    assert.equal(player.portrait.src, expectedSrc, `${player.id} portrait path must follow the player id`);

    const portraitFile = await stat(new URL(`../public${expectedSrc}`, import.meta.url));
    assert.ok(portraitFile.isFile(), `${player.id} portrait must be a file`);
    assert.ok(portraitFile.size > 0, `${player.id} portrait must not be empty`);

    const source = new URL(player.portrait.sourceUrl);
    assert.equal(source.protocol, "https:", `${player.id} portrait source must use HTTPS`);
    assert.equal(source.hostname, "commons.wikimedia.org", `${player.id} portrait source must be Wikimedia Commons`);
    assert.match(source.pathname, /^\/wiki\/File:/u, `${player.id} portrait source must link to a Commons file page`);
    assert.ok(player.portrait.credit.trim().length > 0, `${player.id} portrait credit must not be empty`);
    assert.ok(player.portrait.license.trim().length > 0, `${player.id} portrait license must not be empty`);
  }
});

test("keeps every player editorial profile complete with three unique traits", () => {
  for (const player of tourPlayers) {
    assert.ok(player.playStyle.trim().length > 0, `${player.id} playStyle must not be empty`);
    assert.ok(player.signature.trim().length > 0, `${player.id} signature must not be empty`);
    assert.equal(player.traits.length, 3, `${player.id} must have exactly three traits`);
    assert.equal(new Set(player.traits).size, 3, `${player.id} traits must be unique`);
    for (const trait of player.traits) {
      assert.equal(trait, trait.trim(), `${player.id} traits must not contain surrounding whitespace`);
      assert.ok(trait.length > 0, `${player.id} traits must not be empty`);
    }
  }
});

test("renders real player portraits inside an accessible ordered ranking", () => {
  const portraitComponent = page.slice(
    page.indexOf("function TourPlayerPortrait"),
    page.indexOf("function TourRacketVisual"),
  );
  assert.match(portraitComponent, /<img/u);
  assert.match(portraitComponent, /className="tour-player-portrait"/u);
  assert.match(portraitComponent, /src=\{player\.portrait\.src\}/u);
  assert.match(portraitComponent, /alt=\{decorative \? "" : `\$\{player\.nameZh\} \u4eba\u7269\u7167\u7247`\}/u);
  assert.match(portraitComponent, /onError=\{\(\) => setFailed\(true\)\}/u);
  assert.match(portraitComponent, /tour-player-portrait__fallback/u);
  assert.match(page, /<TourPlayerPortrait player=\{player\} priority=\{leader\} \/>/u);

  assert.match(page, /<ol className="tour-ranking-list">/u);
  assert.match(page, /\{visibleTourPlayers\.map\(\(player, index\) => \(/u);
  assert.match(page, /<li key=\{player\.id\} className=\{index === 0 \? "tour-ranking-list__leader" : undefined\}>/u);

  assert.match(page, /const headingId = `tour-player-title-\$\{player\.id\}`/u);
  assert.match(page, /<article id=\{`tour-player-\$\{player\.id\}`\} tabIndex=\{-1\} aria-labelledby=\{headingId\}/u);
  assert.match(page, /<h3 id=\{headingId\}>\{player\.nameZh\}<\/h3>/u);
});

test("keeps racket-image fallback, portrait attribution, and per-player sharing wired", () => {
  const racketVisual = page.slice(
    page.indexOf("function TourRacketVisual"),
    page.indexOf("function TourPlayerCard"),
  );
  assert.match(racketVisual, /const \[failedImages, setFailedImages\] = useState<string\[\]>\(\[\]\)/u);
  assert.match(racketVisual, /linkedRacket\?\.image,[\s\S]*?familyGalleries\[linkedFamily\.id\][\s\S]*?linkedFamily\?\.image/u);
  assert.match(racketVisual, /imageCandidates\.find\(\(candidate\) => !failedImages\.includes\(candidate\)\)/u);
  assert.match(racketVisual, /onError=\{\(\) => setFailedImages\(/u);
  assert.match(racketVisual, /\u62cd\u7cfb\u56fe\u7247\u6682\u4e0d\u53ef\u7528/u);

  assert.match(page, /href=\{player\.portrait\.sourceUrl\}/u);
  assert.match(page, /\u7167\u7247\uff1a\{player\.portrait\.credit\} \u00b7 \{player\.portrait\.license\} \u2197/u);

  const sharePlayer = page.slice(
    page.indexOf("const copyTourPlayerLink"),
    page.indexOf("const startDuel"),
  );
  assert.match(sharePlayer, /formatTourRouteState\(\{ view: "tour", playerId: player\.id \}, player\.tour\)/u);
  assert.match(sharePlayer, /navigator\.clipboard\.writeText\(url\.href\)/u);
  assert.match(page, /onShare=\{copyTourPlayerLink\}/u);
  assert.match(page, /onClick=\{\(\) => onShare\(player\)\}/u);
  assert.match(page, /aria-label=\{`\u590d\u5236 \$\{player\.nameZh\} \u7403\u661f\u6863\u6848\u94fe\u63a5`\}/u);
});
