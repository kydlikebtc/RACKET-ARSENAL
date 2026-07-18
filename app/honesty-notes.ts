/**
 * Single source of truth for the data-honesty disclaimers that recur across
 * features. UI code must reference these constants instead of re-typing the
 * copy, and tests assert the constant references (or their values) so a
 * wording tweak only ever happens here.
 */
export const HONESTY_NOTES = {
  /** Radar/score legend shorthand shown next to six-axis visuals. */
  scoreScale: "拍库相对评估 / 满分 100 / 非实验室测量",
  /** Match-index breakdown footnote on the recommendation result cards. */
  matchIndex: "匹配指数为拍库相对评估，非实验室测量。",
  /** Tour player sync section disclaimer on the match result screen. */
  tourSync:
    "同频指数基于品牌官网零售映射球拍在拍库中的相对评估，非球员真实打法或比赛拍数据。",
} as const;

export type HonestyNoteKey = keyof typeof HONESTY_NOTES;
