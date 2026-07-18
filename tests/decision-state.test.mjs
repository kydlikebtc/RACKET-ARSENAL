import assert from "node:assert/strict";
import test from "node:test";

import {
  DecisionValidationError,
  normalizeDecisionRoom,
  normalizeDecisionRoomRequest,
  normalizeTrialFeedback,
  normalizeTrialFeedbackRequest,
} from "../app/decision-state.ts";
import { deepRackets } from "../app/racket-profiles.ts";

const racketIds = deepRackets.slice(0, 7).map((racket) => racket.id);

function expectValidationError(callback, messagePattern) {
  assert.throws(callback, (error) => {
    assert.ok(error instanceof DecisionValidationError);
    assert.match(error.message, messagePattern);
    return true;
  });
}

test("decision room normalizes a baseline, three active candidates, and history", () => {
  const room = normalizeDecisionRoom({
    baselineId: `  ${racketIds[0]}  `,
    slots: [
      { racketId: racketIds[1], status: "candidate", note: "  保留旋转  " },
      { racketId: racketIds[2], status: "trial", note: "" },
      { racketId: racketIds[3], status: "final", note: "当前首选" },
      { racketId: racketIds[4], status: "eliminated", note: "挥重过高" },
    ],
  });

  assert.equal(room.baselineId, racketIds[0]);
  assert.equal(room.slots.length, 4);
  assert.equal(room.slots[0].note, "保留旋转");
  assert.deepEqual(
    room.slots.map((slot) => slot.status),
    ["candidate", "trial", "final", "eliminated"],
  );
});

test("decision room enforces known rackets, uniqueness, and at most three active candidates", () => {
  expectValidationError(
    () =>
      normalizeDecisionRoom({
        baselineId: null,
        slots: racketIds.slice(0, 4).map((racketId) => ({
          racketId,
          status: "candidate",
          note: "",
        })),
      }),
    /3 个有效候选/,
  );
  expectValidationError(
    () =>
      normalizeDecisionRoom({
        baselineId: "missing-racket",
        slots: [],
      }),
    /不在当前拍库/,
  );
  expectValidationError(
    () =>
      normalizeDecisionRoom({
        baselineId: null,
        slots: [
          { racketId: racketIds[0], status: "candidate", note: "" },
          { racketId: racketIds[0], status: "eliminated", note: "" },
        ],
      }),
    /不能重复/,
  );
  expectValidationError(
    () =>
      normalizeDecisionRoom({
        baselineId: racketIds[0],
        slots: [{ racketId: racketIds[0], status: "candidate", note: "" }],
      }),
    /无需重复加入/,
  );
});

test("decision payload validation rejects unknown fields and multiple final choices", () => {
  expectValidationError(
    () =>
      normalizeDecisionRoomRequest({
        room: { baselineId: null, slots: [] },
        ownerKey: "must-not-be-client-controlled",
      }),
    /无法识别/,
  );
  expectValidationError(
    () =>
      normalizeDecisionRoom({
        baselineId: null,
        slots: [
          { racketId: racketIds[0], status: "final", note: "" },
          { racketId: racketIds[1], status: "final", note: "" },
        ],
      }),
    /1 支最终球拍/,
  );
});

test("trial feedback accepts only known rackets and integer 1-5 ratings", () => {
  const feedback = normalizeTrialFeedbackRequest({
    feedback: {
      racketId: racketIds[0],
      control: 5,
      power: 4,
      comfort: 3,
      verdict: "  值得升级  ",
      note: "  继续试打一周  ",
    },
  });
  assert.deepEqual(feedback, {
    racketId: racketIds[0],
    control: 5,
    power: 4,
    comfort: 3,
    verdict: "值得升级",
    note: "继续试打一周",
  });

  for (const badRating of [0, 6, 3.5, "5", null]) {
    expectValidationError(
      () =>
        normalizeTrialFeedback({
          racketId: racketIds[0],
          control: badRating,
          power: 4,
          comfort: 4,
          verdict: "继续试打",
        }),
      /1 到 5 分/,
    );
  }
  expectValidationError(
    () =>
      normalizeTrialFeedback({
        racketId: "not-in-catalog",
        control: 3,
        power: 3,
        comfort: 3,
        verdict: "不适合",
      }),
    /不在当前拍库/,
  );
  expectValidationError(
    () =>
      normalizeTrialFeedback({
        racketId: racketIds[0],
        control: 3,
        power: 3,
        comfort: 3,
        verdict: "继续试打",
        ownerKey: "client-must-not-control-this",
      }),
    /无法识别/,
  );
  expectValidationError(
    () =>
      normalizeTrialFeedback({
        racketId: racketIds[0],
        control: 3,
        power: 3,
        comfort: 3,
        verdict: " ",
      }),
    /试打结论/,
  );
});
