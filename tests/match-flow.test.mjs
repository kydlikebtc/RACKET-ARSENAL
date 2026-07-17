import assert from "node:assert/strict";
import test from "node:test";
import {
  answerMatchDraft,
  assignMatchDraftJourney,
  backMatchStep,
  beginMatchDraft,
  cancelMatchDraft,
  emptyMatchFlow,
  restoreMatchFlow,
  restoreMatchScreen,
  serializeMatchFlow,
  shouldResumeStoredMatchDraft,
  shouldUseMatchHistoryBack,
  snapshotMatchScreen,
} from "../app/match-flow.ts";

const original = {
  stage: "进阶",
  style: "底线相持",
  priority: "均衡",
};

test("editing keeps the committed profile intact until the third answer", () => {
  const committed = { committed: original, draft: null };
  const editing = beginMatchDraft(committed);
  const afterStage = answerMatchDraft(editing, 0, "高阶");
  const afterStyle = answerMatchDraft(afterStage, 1, "全场控制");

  assert.deepEqual(afterStage.committed, original);
  assert.deepEqual(afterStyle.committed, original);
  assert.deepEqual(afterStyle.draft, {
    step: 2,
    answers: { stage: "高阶", style: "全场控制", priority: "均衡" },
  });

  const completed = answerMatchDraft(afterStyle, 2, "控制");
  assert.deepEqual(completed, {
    committed: { stage: "高阶", style: "全场控制", priority: "控制" },
    draft: null,
  });
});

test("canceling or leaving a partial edit never destroys the committed profile", () => {
  const editing = answerMatchDraft(beginMatchDraft({ committed: original, draft: null }), 0, "入门");
  assert.deepEqual(cancelMatchDraft(editing), { committed: original, draft: null });

  const restored = restoreMatchFlow(serializeMatchFlow(editing));
  assert.deepEqual(restored, editing);
});

test("a new profile cannot be committed by a stale or incomplete event", () => {
  const started = beginMatchDraft(emptyMatchFlow);
  assert.equal(answerMatchDraft(started, 1, "上旋进攻"), started);
  assert.equal(answerMatchDraft(started, 0, "不是阶段"), started);

  const afterStage = answerMatchDraft(started, 0, "进阶");
  assert.equal(answerMatchDraft(afterStage, 1, "不是打法"), afterStage);
  assert.equal(answerMatchDraft(afterStage, 2, "力量"), afterStage);
});

test("back from results creates a step-three draft without uncommitting", () => {
  const state = { committed: original, draft: null };
  const previous = backMatchStep(state);

  assert.deepEqual(previous.committed, original);
  assert.deepEqual(previous.draft, { step: 2, answers: original });
  assert.deepEqual(backMatchStep(previous).draft, { step: 1, answers: original });
});

test("browser history snapshots restore the question but preserve the latest commit", () => {
  const initialEdit = answerMatchDraft(beginMatchDraft({ committed: original, draft: null }), 0, "高阶");
  const snapshot = snapshotMatchScreen(initialEdit);
  const latest = {
    committed: { stage: "高阶", style: "抢点快攻", priority: "力量" },
    draft: null,
  };

  const restoredQuestion = restoreMatchScreen(latest, snapshot);
  assert.deepEqual(restoredQuestion.committed, latest.committed);
  assert.deepEqual(restoredQuestion.draft, {
    step: 1,
    answers: { stage: "高阶", style: "底线相持", priority: "均衡" },
  });
  assert.deepEqual(restoreMatchScreen(restoredQuestion, { kind: "result" }), latest);
});

test("a result snapshot can recover the just-submitted profile during cold hydration", () => {
  const completed = {
    committed: { stage: "高阶", style: "抢点快攻", priority: "力量" },
    draft: null,
  };
  const snapshot = snapshotMatchScreen(completed);
  assert.deepEqual(snapshot, { kind: "result", profile: completed.committed });

  const staleStorage = { committed: original, draft: null };
  assert.deepEqual(restoreMatchScreen(staleStorage, snapshot), staleStorage);
  assert.deepEqual(restoreMatchScreen(staleStorage, snapshot, true), staleStorage);
  assert.deepEqual(restoreMatchScreen({ committed: null, draft: null }, snapshot, true), completed);
});

test("storage restoration sanitizes corrupt v2 state and migrates a completed v1 profile", () => {
  const corrupt = restoreMatchFlow({
    version: 2,
    committed: { stage: "专家", style: "底线相持", priority: "均衡" },
    draft: { step: 2, answers: { stage: "入门", style: "未知", priority: "力量" } },
  });
  assert.deepEqual(corrupt, {
    committed: null,
    draft: { step: 1, answers: { stage: "入门", priority: "力量" } },
  });

  assert.deepEqual(restoreMatchFlow({ ...original, completed: true }), {
    committed: original,
    draft: null,
  });
  assert.deepEqual(restoreMatchFlow({ ...original, completed: false }), emptyMatchFlow);
});

test("a draft keeps one journey id across answers, history snapshots and storage", () => {
  const started = assignMatchDraftJourney(beginMatchDraft({ committed: original, draft: null }), "journey-stable");
  const advanced = answerMatchDraft(started, 0, "高阶");
  assert.equal(advanced.draft?.journeyId, "journey-stable");

  const restoredHistory = restoreMatchScreen({ committed: original, draft: null }, snapshotMatchScreen(advanced));
  assert.equal(restoredHistory.draft?.journeyId, "journey-stable");

  const restoredStorage = restoreMatchFlow(serializeMatchFlow(advanced));
  assert.equal(restoredStorage.draft?.journeyId, "journey-stable");
});

test("a cold result URL resumes a stored edit instead of discarding it", () => {
  const editing = answerMatchDraft(beginMatchDraft({ committed: original, draft: null }), 0, "高阶");
  assert.equal(shouldResumeStoredMatchDraft(editing, 3, false), true);
  assert.equal(shouldResumeStoredMatchDraft(editing, 3, true), false);
  assert.equal(shouldResumeStoredMatchDraft(editing, 2, false), false);
  assert.equal(shouldResumeStoredMatchDraft({ committed: original, draft: null }, 3, false), false);
});

test("the previous-step control edits a cold result instead of returning to Discover", () => {
  assert.equal(shouldUseMatchHistoryBack({ kind: "result", profile: original }, true), false);
  assert.equal(shouldUseMatchHistoryBack({ kind: "question", draft: { step: 2, answers: original } }, true), true);
  assert.equal(shouldUseMatchHistoryBack({ kind: "question", draft: { step: 2, answers: original } }, false), false);
});

test("accepts agility as a complete six-axis match priority", () => {
  const stage = answerMatchDraft(beginMatchDraft(emptyMatchFlow), 0, "进阶");
  const style = answerMatchDraft(stage, 1, "抢点快攻");
  assert.deepEqual(answerMatchDraft(style, 2, "灵活"), {
    committed: { stage: "进阶", style: "抢点快攻", priority: "灵活" },
    draft: null,
  });
});
