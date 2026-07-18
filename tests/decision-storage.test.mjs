import assert from "node:assert/strict";
import test from "node:test";

import {
  DECISION_STORAGE_KEY,
  emptyStoredDecision,
  parseStoredDecision,
  serializeStoredDecision,
} from "../app/decision-storage.ts";
import { deepRackets } from "../app/racket-profiles.ts";

const racketIds = deepRackets.slice(0, 5).map((racket) => racket.id);

function feedback(overrides = {}) {
  return {
    racketId: racketIds[1],
    control: 4,
    power: 5,
    comfort: 3,
    verdict: "继续试打",
    note: "下周换线复试",
    ...overrides,
  };
}

test("local decision storage uses a stable key and a versioned envelope", () => {
  assert.equal(DECISION_STORAGE_KEY, "racket-arsenal:decision-room:v1");

  const serialized = serializeStoredDecision({
    room: {
      baselineId: racketIds[0],
      slots: [
        {
          racketId: racketIds[1],
          status: "trial",
          note: "  保留旋转  ",
        },
      ],
    },
    feedback: [
      feedback({
        id: 7,
        createdAt: "2026-07-18T10:00:00+08:00",
        verdict: "  值得升级  ",
      }),
    ],
  });
  const envelope = JSON.parse(serialized);

  assert.equal(envelope.version, 1);
  assert.equal(envelope.room.slots[0].note, "保留旋转");
  assert.equal(envelope.feedback[0].verdict, "值得升级");
  assert.equal(envelope.feedback[0].createdAt, "2026-07-18T02:00:00.000Z");
  assert.deepEqual(parseStoredDecision(serialized), {
    room: envelope.room,
    feedback: envelope.feedback,
  });
});

test("missing, damaged, obsolete, or invalid-room data falls back safely", () => {
  const empty = emptyStoredDecision();

  assert.deepEqual(parseStoredDecision(null), empty);
  assert.deepEqual(parseStoredDecision(""), empty);
  assert.deepEqual(parseStoredDecision("{broken"), empty);
  assert.deepEqual(
    parseStoredDecision(
      JSON.stringify({ version: 2, room: { baselineId: null, slots: [] } }),
    ),
    empty,
  );
  assert.deepEqual(
    parseStoredDecision(
      JSON.stringify({
        version: 1,
        room: { baselineId: "missing-racket", slots: [] },
        feedback: [],
      }),
    ),
    empty,
  );
});

test("feedback is validated, sanitized, ordered by recency, and capped at twelve", () => {
  const valid = Array.from({ length: 15 }, (_, index) =>
    feedback({
      id: index + 1,
      createdAt: new Date(Date.UTC(2026, 6, index + 1)).toISOString(),
      verdict: `结论 ${index + 1}`,
    }),
  );
  const raw = JSON.stringify({
    version: 1,
    room: { baselineId: racketIds[0], slots: [] },
    feedback: [
      valid[1],
      feedback({ racketId: "unknown-racket" }),
      feedback({ control: 5.5 }),
      feedback({ verdict: "x".repeat(41) }),
      feedback({ note: "x".repeat(241) }),
      feedback({
        id: -4,
        createdAt: "not-a-date",
        verdict: "可用但无元数据",
      }),
      ...valid.slice(2).reverse(),
      valid[0],
    ],
  });

  const parsed = parseStoredDecision(raw);

  assert.equal(parsed.feedback.length, 12);
  assert.deepEqual(
    parsed.feedback.map((entry) => entry.id),
    [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4],
  );
  assert.ok(parsed.feedback.every((entry) => entry.createdAt?.endsWith("Z")));
  assert.ok(parsed.feedback.every((entry) => entry.racketId === racketIds[1]));
});

test("malformed feedback does not discard a valid room", () => {
  const parsed = parseStoredDecision(
    JSON.stringify({
      version: 1,
      room: {
        baselineId: racketIds[0],
        slots: [
          { racketId: racketIds[1], status: "candidate", note: "首选" },
        ],
      },
      feedback: "not-an-array",
    }),
  );

  assert.equal(parsed.room.baselineId, racketIds[0]);
  assert.equal(parsed.room.slots.length, 1);
  assert.deepEqual(parsed.feedback, []);
});
