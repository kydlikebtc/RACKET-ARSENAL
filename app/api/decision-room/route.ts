import { getD1 } from "../../../db";
import { getChatGPTUser, type ChatGPTUser } from "../../chatgpt-auth";
import {
  DecisionValidationError,
  decisionOwnerKey,
  normalizeDecisionRoomRequest,
  normalizeTrialFeedbackRequest,
  type DecisionCandidate,
  type DecisionRoomState,
  type TrialFeedback,
} from "../../decision-state";

export const dynamic = "force-dynamic";

const RECENT_FEEDBACK_LIMIT = 12;
const PRIVATE_JSON_HEADERS = {
  "Cache-Control": "private, no-store",
  "Content-Type": "application/json; charset=utf-8",
};

type CandidateRow = {
  racketId: string;
  status: DecisionCandidate["status"];
  note: string;
};

type FeedbackRow = {
  id: number;
  racketId: string;
  control: number;
  power: number;
  comfort: number;
  verdict: string;
  note: string;
  createdAt: string;
};

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(PRIVATE_JSON_HEADERS)) {
    headers.set(name, value);
  }
  return Response.json(payload, {
    ...init,
    headers,
  });
}

function anonymousResponse() {
  return jsonResponse({
    authenticated: false,
    room: null,
    feedback: [],
  });
}

function unauthorizedResponse() {
  return jsonResponse(
    {
      authenticated: false,
      error: "请先登录 ChatGPT 再保存决策室。",
    },
    { status: 401 },
  );
}

function safeDisplayName(user: ChatGPTUser) {
  return user.fullName?.trim() || "网球玩家";
}

function validationResponse(error: DecisionValidationError) {
  return jsonResponse({ error: error.message }, { status: 400 });
}

function serviceErrorResponse(action: "读取" | "保存") {
  return jsonResponse(
    { error: `暂时无法${action}决策室，请稍后再试。` },
    { status: 503 },
  );
}

async function readJson(request: Request) {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim() !== "application/json") {
    throw new DecisionValidationError("请以 JSON 格式提交决策室数据。");
  }
  try {
    return await request.json();
  } catch {
    throw new DecisionValidationError("请提交完整的决策室数据。");
  }
}

async function loadDecisionRoom(ownerKey: string) {
  const d1 = await getD1();
  const roomRow = await d1
    .prepare(
      `SELECT baseline_id AS baselineId
       FROM decision_rooms
       WHERE owner_key = ?1`,
    )
    .bind(ownerKey)
    .first<{ baselineId: string | null }>();
  const candidateRows = await d1
    .prepare(
      `SELECT racket_id AS racketId, status, note
       FROM decision_candidates
       WHERE owner_key = ?1
       ORDER BY sort_order ASC, created_at ASC`,
    )
    .bind(ownerKey)
    .all<CandidateRow>();

  return {
    baselineId: roomRow?.baselineId ?? null,
    slots: candidateRows.results,
  } satisfies DecisionRoomState;
}

async function loadRecentFeedback(ownerKey: string) {
  const d1 = await getD1();
  const rows = await d1
    .prepare(
      `SELECT id, racket_id AS racketId, control, power, comfort,
              verdict, note, created_at AS createdAt
       FROM trial_feedback
       WHERE owner_key = ?1
       ORDER BY created_at DESC, id DESC
       LIMIT ?2`,
    )
    .bind(ownerKey, RECENT_FEEDBACK_LIMIT)
    .all<FeedbackRow>();
  return rows.results satisfies TrialFeedback[];
}

async function authenticatedState(user: ChatGPTUser, ownerKey: string) {
  const [room, feedback] = await Promise.all([
    loadDecisionRoom(ownerKey),
    loadRecentFeedback(ownerKey),
  ]);
  return {
    authenticated: true as const,
    displayName: safeDisplayName(user),
    room,
    feedback,
  };
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return anonymousResponse();

  try {
    const ownerKey = await decisionOwnerKey(user.email);
    return jsonResponse(await authenticatedState(user, ownerKey));
  } catch {
    return serviceErrorResponse("读取");
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorizedResponse();

  try {
    const payload = await readJson(request);
    const room = normalizeDecisionRoomRequest(payload);
    const ownerKey = await decisionOwnerKey(user.email);
    const d1 = await getD1();
    const statements = [
      d1
        .prepare(
          `INSERT INTO decision_rooms (owner_key, baseline_id, updated_at)
           VALUES (?1, ?2, CURRENT_TIMESTAMP)
           ON CONFLICT(owner_key) DO UPDATE SET
             baseline_id = excluded.baseline_id,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(ownerKey, room.baselineId),
      d1
        .prepare("DELETE FROM decision_candidates WHERE owner_key = ?1")
        .bind(ownerKey),
      ...room.slots.map((slot, sortOrder) =>
        d1
          .prepare(
            `INSERT INTO decision_candidates
               (owner_key, racket_id, status, note, sort_order, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          )
          .bind(
            ownerKey,
            slot.racketId,
            slot.status,
            slot.note,
            sortOrder,
          ),
      ),
    ];
    await d1.batch(statements);

    return jsonResponse(await authenticatedState(user, ownerKey));
  } catch (error) {
    if (error instanceof DecisionValidationError) {
      return validationResponse(error);
    }
    return serviceErrorResponse("保存");
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return unauthorizedResponse();

  try {
    const payload = await readJson(request);
    const feedback = normalizeTrialFeedbackRequest(payload);
    const ownerKey = await decisionOwnerKey(user.email);
    const d1 = await getD1();
    const saved = await d1
      .prepare(
        `INSERT INTO trial_feedback
           (owner_key, racket_id, control, power, comfort, verdict, note, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)
         RETURNING id, racket_id AS racketId, control, power, comfort,
                   verdict, note, created_at AS createdAt`,
      )
      .bind(
        ownerKey,
        feedback.racketId,
        feedback.control,
        feedback.power,
        feedback.comfort,
        feedback.verdict,
        feedback.note,
      )
      .first<FeedbackRow>();

    if (!saved) throw new Error("试打反馈未保存。");
    return jsonResponse(
      {
        feedback: saved,
        recentFeedback: await loadRecentFeedback(ownerKey),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DecisionValidationError) {
      return validationResponse(error);
    }
    return serviceErrorResponse("保存");
  }
}
