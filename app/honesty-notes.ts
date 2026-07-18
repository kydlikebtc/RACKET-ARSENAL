/**
 * 拍库共享的数据诚实措辞常量。
 *
 * 多个功能面（匹配拆解、对比解读、对决徽章、严选榜单、球星同频）都需要
 * 同一口径的免责说明；集中在此避免措辞漂移，测试应断言引用这些常量。
 */
export const HONESTY_NOTES = {
  /** 六维评分与匹配指数的通用免责口径。 */
  relativeAssessment: "拍库相对评估，非实验室测量",
  /** 基于官网硬规格推断生成的文案标注。 */
  specInference: "基于规格推断",
  /** 官网未公开某项规格时的占位口径。 */
  unpublished: "官网未公开",
  /** 规格相似不等于手感等价的提醒（相似平替、对决共用）。 */
  notFeelEquivalent: "规格相似不等于手感等价，不替代实际试打",
} as const;

export type HonestyNoteKey = keyof typeof HONESTY_NOTES;
