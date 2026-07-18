/**
 * Single source of truth for the recurring data-honesty wording. Features must
 * reference these constants instead of scattering near-identical disclaimer
 * strings, so tests can assert one canonical copy and future wording tweaks
 * stay a one-line change.
 */
export const HONESTY_NOTES = {
  /** 档案页「找相似的拍」区块的免责声明（相对评估 + 不替代试打）。 */
  similarRackets: "按品牌官网公开的拍面、重量、线床、平衡点、框厚归一化接近度排序，属拍库相对评估；规格相似不等于手感等价，穿线、磅数与挥重差异仍会改变实际感受，不替代实际试打。",
  /** 档案页「找相似的拍」区块的覆盖率脚注（诚实排除）。 */
  similarRacketsCoverage: "官网规格不全的型号未参与排序。",
  /** 对比页（决策室）差异翻译与对决徽章共用的单一免责区块。 */
  compare: "差异翻译基于品牌官网公开硬规格的拍库相对推断；六维评分与胜负徽章为拍库相对评估（满分 100）。两者均非实验室测量，不代表两拍实际优劣，不替代实际试打。",
} as const;

export type HonestyNoteKey = keyof typeof HONESTY_NOTES;
