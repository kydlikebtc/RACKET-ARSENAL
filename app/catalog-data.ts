export type RacketFamilyType = "控制" | "旋转" | "力量" | "全能" | "舒适";

export type CatalogEditionKind = "限定配色" | "纪念款" | "联名款" | "可持续限定";

export type CatalogEdition = {
  id: string;
  name: string;
  color: string;
  swatches: string[];
  kind: CatalogEditionKind;
  releaseYear: number;
  releaseDate?: string;
  url: string;
  note?: string;
};

export type CatalogModel = {
  name: string;
  head: number | null;
  weight: number | null;
  pattern: string | null;
  balance: number | null;
  beam: string | null;
  length: number | null;
  url: string;
  releaseDate?: string;
  editions?: CatalogEdition[];
};

export type CatalogFamily = {
  id: string;
  brand: string;
  family: string;
  type: RacketFamilyType;
  generation: string;
  releaseYear: number | null;
  releaseDate?: string;
  status?: "在售" | "预告" | "现行" | "历史";
  familyUrl: string;
  summary: string;
  models: CatalogModel[];
  image?: string;
  deepRacketId?: string;
  note?: string;
};

const spec = (
  name: string,
  head: number | null,
  weight: number | null,
  pattern: string | null,
  balance: number | null,
  beam: string | number | null,
  length: number | null,
  url: string,
  releaseDate?: string,
  editions?: CatalogEdition[],
): CatalogModel => ({ name, head, weight, pattern, balance, beam: beam === null ? null : String(beam), length, url, releaseDate, editions });

const edition = (
  id: string,
  name: string,
  color: string,
  swatches: string[],
  kind: CatalogEditionKind,
  releaseYear: number,
  url: string,
  releaseDate?: string,
  note?: string,
): CatalogEdition => ({ id, name, color, swatches, kind, releaseYear, url, releaseDate, note });

export const catalogVerifiedAt = "2026-07-25";

export const catalogFamilies: CatalogFamily[] = [
  {
    id: "wilson-blade-v10", brand: "Wilson", family: "Blade", type: "控制", generation: "V10", releaseYear: 2026,
    familyUrl: "https://www.wilson.com/en-gb/blog/tennis/unveiling-wilson-blade-v10",
    summary: "现代控制拍家族，覆盖 98 到 104 拍面与 16×19 / 18×20 两类线床。",
    image: "/rackets/gallery/wilson-blade-v10-02.png",
    models: [
      spec("Blade Pro 98 16×19 V10", 98, 305, "16×19", 325, 21.5, 27, "https://jp.wilson.com/products/tennis-racket-blade-98-pro-16x19-v10-frm"),
      spec("Blade Pro 98 18×20 V10", 98, 305, "18×20", 325, 21.5, 27, "https://jp.wilson.com/products/tennis-racket-blade-98-pro-18x20-v10-frm"),
      spec("Blade 98 16×19 V10", 98, 305, "16×19", 320, "21.5–20.5", 27, "https://jp.wilson.com/products/tennis-racket-blade-98-16x19-v10-frm"),
      spec("Blade 98 18×20 V10", 98, 305, "18×20", 320, "21.5–20.5", 27, "https://jp.wilson.com/products/tennis-racket-blade-98-18x20-v10-frm"),
      spec("Blade 98S V10", 98, 295, "18×16", 325, "21.5–20.5", 27, "https://jp.wilson.com/products/tennis-racket-blade-98s-v10-frm"),
      spec("Blade Pro 100 V10", 100, 295, "16×20", 320, 23, 27.25, "https://jp.wilson.com/products/tennis-racket-blade-100-pro-v10-frm"),
      spec("Blade 100 V10", 100, 300, "16×19", 320, 22, 27, "https://jp.wilson.com/products/tennis-racket-blade-100-v10-frm"),
      spec("Blade 100L V10", 100, 285, "16×19", 330, 22, 27, "https://jp.wilson.com/products/tennis-racket-blade-100l-v10-frm"),
      spec("Blade 100UL V10", 100, 265, "16×19", 335, 22, 27, "https://jp.wilson.com/products/tennis-racket-blade-100ul-v10-frm"),
      spec("Blade 101 Team V10", 101, 275, "16×19", 330, 23, 27, "https://jp.wilson.com/products/tennis-racket-blade-101-team-v10-rkt"),
      spec("Blade 104 V10", 104, 290, "16×19", 320, 22, 27.5, "https://jp.wilson.com/products/tennis-racket-blade-104-v10-frm"),
    ],
  },
  {
    id: "wilson-blade-v9", brand: "Wilson", family: "Blade", type: "控制", generation: "V9 · 上一代", releaseYear: 2024,
    status: "历史",
    familyUrl: "https://jp.wilson.com/pages/tennis-rackets-blade-v9",
    summary: "2024 年第九代 Blade，以 StableFeel、墨绿涂装和薄框反馈构成 V10 之前的主流控制基准。",
    image: "/rackets/wilson-blade-98-v9.webp",
    models: [
      spec("Blade Pro 98 16×19 V9", 98, 305, "16×19", 325, 21.5, 27, "https://jp.wilson.com/pages/tennis-rackets-blade-v9"),
      spec("Blade Pro 98 18×20 V9", 98, 305, "18×20", 325, 21.5, 27, "https://jp.wilson.com/pages/tennis-rackets-blade-v9"),
      spec("Blade 98 16×19 V9", 98, 305, "16×19", 320, 21, 27, "https://jp.wilson.com/pages/tennis-rackets-blade-v9", undefined, [
        edition(
          "edition-wilson-blade-98-v9-us-open-2025",
          "US Open 2025 Edition",
          "NYC 夜色渐变",
          ["#15182d", "#6554c0", "#ef476f"],
          "限定配色",
          2025,
          "https://mas.wilson.com/products/wilson-blade-98-us-open-2025-16x19-v9",
          undefined,
          "规格与标准 Blade 98 16×19 V9 相同，采用纽约城市灵感涂装。",
        ),
      ]),
      spec("Blade 98 18×20 V9", 98, 305, "18×20", 320, 21, 27, "https://jp.wilson.com/pages/tennis-rackets-blade-v9"),
      spec("Blade 98S V9", 98, 295, "18×16", 325, 21, 27, "https://jp.wilson.com/pages/tennis-rackets-blade-v9"),
      spec("Blade 100 V9", 100, 300, "16×19", 320, 22, 27, "https://jp.wilson.com/pages/tennis-rackets-blade-v9"),
      spec("Blade 100L V9", 100, 285, "16×19", 330, 22, 27, "https://jp.wilson.com/pages/tennis-rackets-blade-v9"),
      spec("Blade 100UL V9", 100, 265, "16×19", 335, 22, 27, "https://jp.wilson.com/pages/tennis-rackets-blade-v9"),
      spec("Blade 101L V9", 101, 274, "16×20", 330, 23, 27, "https://jp.wilson.com/pages/tennis-rackets-blade-v9"),
      spec("Blade 104 V9", 104, 290, "16×19", 320, 22, 27.5, "https://jp.wilson.com/pages/tennis-rackets-blade-v9"),
    ],
    note: "历史代按品牌官方 V9 系列页建档；外部仍可购买的限定配色单独挂在基础型号下，不重复计算六维评分。",
  },
  {
    id: "wilson-pro-staff-classic", brand: "Wilson", family: "Pro Staff", type: "控制", generation: "Classic", releaseYear: 2026,
    familyUrl: "https://www.wilson.com/en-us/tennis/tennis-rackets/performance-rackets/pro-staff",
    summary: "经典薄框与头轻设定，优先服务完整挥拍、单点精确与网前反馈。",
    image: "/rackets/catalog/wilson-pro-staff-classic-2026.jpg", deepRacketId: "wilson-pro-staff-97-v14",
    models: [
      spec("Pro Staff 97 Classic", 97, 315, "16×19", 310, 21.5, 27, "https://jp.wilson.com/products/tennis-racket-pro-staff-97-classic"),
      spec("Pro Staff 97L Classic", 97, 290, "16×19", 325, 23, 27, "https://jp.wilson.com/products/tennis-racket-pro-staff-97l-classic"),
      spec("Pro Staff X Classic", 100, 315, "16×19", 310, 21.5, 27, "https://jp.wilson.com/products/tennis-racket-pro-staff-x-classic"),
      spec("Pro Staff Team Classic", 100, 280, "16×19", 325, 23.5, 27, "https://www.wilson.com/fr-fr/product/pro-staff-team-classic-wr20160"),
    ],
    note: "Pro Staff X 为日本市场现行款；不同地区的在售子型号会略有差异。",
  },
  {
    id: "wilson-ultra-v5", brand: "Wilson", family: "Ultra", type: "力量", generation: "V5", releaseYear: 2025,
    familyUrl: "https://www.wilson.com/en-us/blog/tennis/unveiling-wilson-ultra-swing-with-power",
    summary: "以免费力量和快速回弹为核心，从 99 Pro 延伸到 111 大拍面。",
    image: "/rackets/catalog/wilson-ultra-v5.jpg",
    models: [
      spec("Ultra 99 Pro V5", 99, 305, "16×18", 325, "22–24–21", 27, "https://jp.wilson.com/products/tennis-racket-ultra-99-pro-v5"),
      spec("Ultra 100 V5", 100, 300, "16×19", 320, "24–26.5–24.5", 27, "https://jp.wilson.com/products/tennis-racket-ultra-100-v5"),
      spec("Ultra 100L V5", 100, 280, "16×19", 325, "24–26.5–24.5", 27, "https://jp.wilson.com/products/tennis-racket-ultra-100l-v5"),
      spec("Ultra 100UL V5", 100, 260, "16×19", 330, "24–26.5–24.5", 27, "https://au.wilson.com/products/ultra-100ul-v5-tennis-racket"),
      spec("Ultra 111 V5", 111, 270, "16×18", 320, "26–26.75–25", 27.25, "https://jp.wilson.com/products/tennis-racket-ultra-111-v5"),
    ],
  },
  {
    id: "wilson-clash-v3", brand: "Wilson", family: "Clash", type: "舒适", generation: "V3", releaseYear: 2025,
    familyUrl: "https://jp.wilson.com/pages/tennis-rackets-clash-v-3",
    summary: "柔韧框体与大甜区，兼顾手臂友好、轻松深度和日常比赛稳定性。",
    image: "/rackets/wilson-clash-100-v3.jpg", deepRacketId: "wilson-clash-100-v3",
    models: [
      spec("Clash 100 Pro V3", 100, 305, "16×20", 310, 24, 27, "https://jp.wilson.com/products/tennis-racket-clash-100-pro-v-3-0"),
      spec("Clash 100 V3", 100, 295, "16×19", 310, 24, 27, "https://jp.wilson.com/products/tennis-racket-clash-100-v-3-0"),
      spec("Clash 100L V3", 100, 280, "16×19", 315, 24, 27, "https://jp.wilson.com/products/tennis-racket-clash-100-l-v-3-0"),
      spec("Clash 100UL V3", 100, 265, "16×19", 330, 24, 27, "https://jp.wilson.com/products/tennis-racket-clash-100-ul-v-3-0"),
      spec("Clash 108 V3", 108, 280, "16×19", 335, 24, 27.25, "https://jp.wilson.com/products/tennis-racket-clash-108-v-3-0"),
    ],
  },
  {
    id: "wilson-rf01", brand: "Wilson", family: "RF", type: "全能", generation: "RF 01", releaseYear: 2024,
    familyUrl: "https://www.wilson.com/en-us/tennis/tennis-rackets/performance-rackets/rf",
    summary: "费德勒参与开发的快速全场框架，以 98 拍面覆盖 265–320g 重量带。",
    image: "/rackets/catalog/wilson-rf01.jpg",
    models: [
      spec("RF 01 Pro", 98, 320, "16×19", 315, "23.2–24–22", 27, "https://jp.wilson.com/products/tennis-racket-rf-01-pro", undefined, [
        edition(
          "edition-wilson-rf01-pro-laver-cup-2025",
          "Laver Cup 2025",
          "旧金山反向渐变",
          ["#050505", "#5f6368", "#c49a5a"],
          "纪念款",
          2025,
          "https://jp.wilson.com/collections/tennis-laver-cup-2025",
          "2025-09-12",
          "纪念 2025 旧金山拉沃尔杯，使用与标准 RF 01 Pro 相同的零售规格。",
        ),
      ]),
      spec("RF 01", 98, 300, "16×19", 315, "23.2–24–22", 27, "https://jp.wilson.com/products/tennis-racket-rf-01", undefined, [
        edition(
          "edition-wilson-rf01-laver-cup-2025",
          "Laver Cup 2025",
          "旧金山反向渐变",
          ["#050505", "#5f6368", "#c49a5a"],
          "纪念款",
          2025,
          "https://jp.wilson.com/products/tennis-racket-rf-01-laver-cup-2025-black",
          "2025-09-12",
          "拍框刻有 SAN FRANCISCO 字样的拉沃尔杯限定设计。",
        ),
      ]),
      spec("RF 01 Future", 98, 280, "16×19", 320, "23.2–24–22", 27, "https://jp.wilson.com/products/tennis-racket-rf-01-future"),
      spec("RF 01 Future Lite", 98, 265, "16×19", 320, "23.2–24–22", 27, "https://jp.wilson.com/products/tennis-racket-rf-01-future-lite"),
    ],
  },
  {
    id: "wilson-shift-v1", brand: "Wilson", family: "Shift", type: "旋转", generation: "V1", releaseYear: 2023, releaseDate: "2023-07-31",
    familyUrl: "https://jp.wilson.com/pages/tennis-rackets-shift-2023",
    summary: "利用横向弯曲提升旋转窗口，同时保留直接而稳定的击球反馈。",
    image: "/rackets/catalog/wilson-shift-v1.jpg",
    models: [
      spec("Shift 99 Pro V1", 99, 315, "18×20", 315, 23, 27, "https://jp.wilson.com/products/tennis-racket-shift-99-pro-v-1-0"),
      spec("Shift 99 V1", 99, 300, "16×20", 315, 23, 27, "https://jp.wilson.com/products/tennis-racket-shift-99-v-1-0"),
      spec("Shift 99L V1", 99, 285, "16×20", 320, 23, 27, "https://jp.wilson.com/products/tennis-racket-shift-99-l-v-1-0"),
    ],
  },
  {
    id: "yonex-muse-gen1", brand: "Yonex", family: "MUSE", type: "全能", generation: "首代", releaseYear: 2026,
    familyUrl: "https://us.yonex.com/blogs/tennis/new-tennis-racquet-series-muse-form-follows-fun",
    summary: "新一代轻快全能线，使用 16×18 线床与薄喉设计扩大击球趣味和容错。",
    image: "/rackets/catalog/yonex-muse.jpg",
    models: [
      spec("MUSE 98", 98, 305, "16×18", 315, "24–24–18", 27, "https://www.yonex.com/tennis/racquets/muse-98"),
      spec("MUSE 100", 100, 295, "16×18", 320, "24.5–24.5–18", 27, "https://www.yonex.com/tennis/racquets/muse-100"),
      spec("MUSE 100L", 100, 280, "16×18", 325, "24.5–24.5–18", 27, "https://www.yonex.com/tennis/racquets/muse-100l"),
      spec("MUSE 100SL", 100, 265, "16×18", 330, "24.5–24.5–18", 27, "https://www.yonex.com/tennis/racquets/muse-100sl"),
      spec("MUSE 107", 107, 280, "16×18", 335, "25–25–18", 27, "https://www.yonex.com/tennis/racquets/muse-107"),
    ],
  },
  {
    id: "yonex-vcore-8", brand: "Yonex", family: "VCORE", type: "旋转", generation: "第 8 代", releaseYear: 2026, releaseDate: "2026-01-09",
    familyUrl: "https://www.yonex.com/vcore",
    summary: "高拍头速度和旋转导向框型，从 95 精准拍面覆盖到 100D 与加长版。",
    image: "/rackets/yonex-vcore-98.webp", deepRacketId: "yonex-vcore-98",
    models: [
      spec("VCORE 95", 95, 310, "16×20", 310, 22, 27, "https://www.yonex.com/tennis/racquets/08vc95"),
      spec("VCORE 98", 98, 305, "16×19", 315, "23–23.5–22", 27, "https://www.yonex.com/tennis/racquets/08vc98"),
      spec("VCORE 98+", 98, 305, "16×19", null, null, 27.5, "https://www.yonex.com/tennis/racquets/08vc98p"),
      spec("VCORE 98 TOUR", 98, 315, "16×19", null, null, 27, "https://www.yonex.com/tennis/racquets/08vc98tr"),
      spec("VCORE 98L", 98, 285, "16×19", 325, "23–23.5–22", 27, "https://www.yonex.com/tennis/racquets/08vc98l"),
      spec("VCORE 100", 100, 300, "16×19", 320, "24–26–23", 27, "https://www.yonex.com/tennis/racquets/08vc100"),
      spec("VCORE 100+", 100, 300, "16×19", null, null, 27.5, "https://www.yonex.com/tennis/racquets/08vc100p"),
      spec("VCORE 100D", 100, 305, "18×19", null, null, 27, "https://www.yonex.com/tennis/racquets/08vc100d"),
      spec("VCORE 100L", 100, 280, "16×19", 330, "24–26–23", 27, "https://www.yonex.com/tennis/racquets/08vc100l"),
    ],
  },
  {
    id: "yonex-vcore-7", brand: "Yonex", family: "VCORE", type: "旋转", generation: "第 7 代 · 上一代", releaseYear: 2023, releaseDate: "2023-01-13",
    status: "历史",
    familyUrl: "https://www.yonex.com/news/tennis/the-7th-generation-vcore-the-art-of-spin/",
    summary: "第七代 VCORE 以 Scarlet 为首发涂装，后追加 Sand Beige，将高弹道旋转与更宽拍头甜区带入 2023–2025 周期。",
    image: "/rackets/models/yonex/catalog-yonex-vcore-7-vcore-95-7th-1.webp",
    models: [
      spec("VCORE 95 7th", 95, 310, "16×20", 310, 22, 27, "https://www.yonex.com/news/tennis/the-7th-generation-vcore-the-art-of-spin/"),
      spec("VCORE 98 7th", 98, 305, "16×19", 315, "23–23–21", 27, "https://www.yonex.com/news/tennis/the-7th-generation-vcore-the-art-of-spin/", undefined, [
        edition("edition-yonex-vcore-98-7-sand-beige", "Sand Beige", "砂岩米色", ["#d3c4a5", "#6f776b", "#a44935"], "限定配色", 2024, "https://www.yonex.com/news/vcore-sand-beige-put-your-spin-on-it/", "2024-08-23"),
      ]),
      spec("VCORE 98L 7th", 98, 285, "16×19", 325, "23–23–21", 27, "https://www.yonex.com/news/tennis/the-7th-generation-vcore-the-art-of-spin/", undefined, [
        edition("edition-yonex-vcore-98l-7-sand-beige", "Sand Beige", "砂岩米色", ["#d3c4a5", "#6f776b", "#a44935"], "限定配色", 2024, "https://www.yonex.com/news/vcore-sand-beige-put-your-spin-on-it/", "2024-08-23"),
      ]),
      spec("VCORE 100 7th", 100, 300, "16×19", 320, "25.3–25.3–22", 27, "https://www.yonex.com/news/tennis/the-7th-generation-vcore-the-art-of-spin/", undefined, [
        edition("edition-yonex-vcore-100-7-sand-beige", "Sand Beige", "砂岩米色", ["#d3c4a5", "#6f776b", "#a44935"], "限定配色", 2024, "https://www.yonex.com/news/vcore-sand-beige-put-your-spin-on-it/", "2024-08-23"),
      ]),
      spec("VCORE 100+ 7th", 100, 300, "16×19", null, "25.3–25.3–22", 27.5, "https://www.yonex.com/news/tennis/the-7th-generation-vcore-the-art-of-spin/"),
      spec("VCORE 100L 7th", 100, 280, "16×19", 330, "25.3–25.3–22", 27, "https://www.yonex.com/news/tennis/the-7th-generation-vcore-the-art-of-spin/", undefined, [
        edition("edition-yonex-vcore-100l-7-sand-beige", "Sand Beige", "砂岩米色", ["#d3c4a5", "#6f776b", "#a44935"], "限定配色", 2024, "https://www.yonex.com/news/vcore-sand-beige-put-your-spin-on-it/", "2024-08-23"),
      ]),
      spec("VCORE GAME 7th", 100, 265, "16×18", 335, "24–26–22", 27, "https://www.yonex.com/news/tennis/the-7th-generation-vcore-the-art-of-spin/"),
      spec("VCORE FEEL 7th", 100, 250, "16×18", 345, "24–26–22", 27, "https://www.yonex.com/news/tennis/the-7th-generation-vcore-the-art-of-spin/"),
    ],
    note: "首发 Scarlet 与后续 Sand Beige 属同一代同规格配色；拍库保留一次六维档案，并在型号内展开全部已核验配色。",
  },
  {
    id: "yonex-percept", brand: "Yonex", family: "PERCEPT", type: "控制", generation: "首代", releaseYear: 2023,
    familyUrl: "https://www.yonex.com/tennis/racquets?series=percept",
    summary: "薄框控制家族，以 97 / 100 拍面与多种线床密度服务高阶落点管理。",
    image: "/rackets/yonex-percept-97.webp", deepRacketId: "yonex-percept-97",
    models: [
      spec("PERCEPT 97", 97, 310, "16×19", 310, 21, 27, "https://www.yonex.com/tennis/racquets/percept-97"),
      spec("PERCEPT 97D", 97, 320, "18×20", 310, 21, 27, "https://www.yonex.com/tennis/racquets/percept-97d"),
      spec("PERCEPT 97H", 97, 330, "16×19", 310, 21, 27, "https://www.yonex.com/tennis/racquets/percept-97h"),
      spec("PERCEPT 97L", 97, 290, "16×19", 325, 21, 27, "https://www.yonex.com/tennis/racquets/percept-97l"),
      spec("PERCEPT 100", 100, 300, "16×19", 320, 23, 27, "https://www.yonex.com/tennis/racquets/percept-100"),
      spec("PERCEPT 100D", 100, 305, "18×19", 315, 23, 27, "https://www.yonex.com/tennis/racquets/percept-100d"),
      spec("PERCEPT 100L", 100, 280, "16×19", 335, 23, 27, "https://www.yonex.com/tennis/racquets/percept-100l"),
      spec("PERCEPT GAME", 100, 270, "16×19", 335, "23–24–23", 27, "https://www.yonex.com/tennis/racquets/percept-game"),
    ],
  },
  {
    id: "yonex-ezone-8", brand: "Yonex", family: "EZONE", type: "力量", generation: "第 8 代", releaseYear: 2025,
    familyUrl: "https://www.yonex.com/ezone",
    summary: "等距方形拍框扩大甜区，兼顾直接力量、舒适回弹与多重量段选择。",
    image: "/rackets/yonex-ezone-98.webp", deepRacketId: "yonex-ezone-98",
    models: [
      spec("EZONE 98", 98, 305, "16×19", 315, "23.8–24.5–19.5", 27, "https://www.yonex.com/tennis/racquets/ez98"),
      spec("EZONE 98+", 98, 305, "16×19", null, null, 27.5, "https://www.yonex.com/tennis/racquets/ez98p"),
      spec("EZONE 98 TOUR", 98, 315, "16×19", null, null, 27, "https://www.yonex.com/tennis/racquets/ez98tr"),
      spec("EZONE 98L", 98, 285, "16×19", null, null, 27, "https://www.yonex.com/tennis/racquets/ez98l"),
      spec("EZONE 100", 100, 300, "16×19", 320, "24.5–26.5–23", 27, "https://www.yonex.com/tennis/racquets/ez100"),
      spec("EZONE 100+", 100, 300, "16×19", null, null, 27.5, "https://us.yonex.com/products/ezone-100p"),
      spec("EZONE 100L", 100, 285, "16×19", null, null, 27, "https://www.yonex.com/tennis/racquets/ez100l"),
      spec("EZONE 100SL", 100, 270, "16×19", null, null, 27, "https://www.yonex.com/tennis/racquets/ez100sl"),
      spec("EZONE 105", 105, 275, "16×19", null, null, 27, "https://www.yonex.com/tennis/racquets/ez105"),
      spec("EZONE 110", 110, 255, "16×18", null, null, 27.25, "https://www.yonex.com/tennis/racquets/ez110"),
      spec("EZONE 115", 115, 245, "16×17", null, null, 27.5, "https://www.yonex.com/tennis/racquets/ez115"),
    ],
  },
  {
    id: "yonex-ezone-7", brand: "Yonex", family: "EZONE", type: "力量", generation: "第 7 代 · 上一代", releaseYear: 2022, releaseDate: "2022-01-15",
    status: "历史",
    familyUrl: "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/",
    summary: "第七代 EZONE 的 Sky Blue 是 2022–2024 主力力量框；期间追加 Osaka 联名与 Aqua Night Black 两组重要配色。",
    image: "/rackets/models/yonex/catalog-yonex-ezone-7-ezone-98-7th-1.webp",
    models: [
      spec("EZONE 98 7th", 98, 305, "16×19", 315, "23.5–24.5–19.5", 27, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/", undefined, [
        edition("edition-yonex-ezone-98-7-osaka", "OSAKA EZONE", "金紫龙纹", ["#29143f", "#8f65a3", "#d7ad56"], "联名款", 2022, "https://www.yonex.com/news/osaka-ezone-an-osaka-sister-original/", "2022-08-25", "Naomi 与 Mari Osaka 共同设计的龙与彼岸花主题。"),
        edition("edition-yonex-ezone-98-7-aqua-night-black", "Aqua Night Black", "夜海黑", ["#090f16", "#147d83", "#6a4c93"], "限定配色", 2024, "https://www.yonex.com/news/tennis/ezone-aqua-night-black-new-design-inspired-by-the-night-sea/", "2024-01-01"),
      ]),
      spec("EZONE 98L 7th", 98, 285, "16×19", 330, "23.5–24.5–19.5", 27, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/"),
      spec("EZONE 98+ 7th", 98, 305, "16×19", null, "23.5–24.5–19.5", 27.5, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/"),
      spec("EZONE 98 TOUR 7th", 98, 315, "16×19", null, "23.5–24.5–19.5", 27, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/"),
      spec("EZONE 100 7th", 100, 300, "16×19", 320, "23.8–26.5–22.5", 27, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/", undefined, [
        edition("edition-yonex-ezone-100-7-osaka", "OSAKA EZONE", "金紫龙纹", ["#29143f", "#8f65a3", "#d7ad56"], "联名款", 2022, "https://www.yonex.com/news/osaka-ezone-an-osaka-sister-original/", "2022-08-25"),
        edition("edition-yonex-ezone-100-7-aqua-night-black", "Aqua Night Black", "夜海黑", ["#090f16", "#147d83", "#6a4c93"], "限定配色", 2024, "https://www.yonex.com/news/tennis/ezone-aqua-night-black-new-design-inspired-by-the-night-sea/", "2024-01-01"),
      ]),
      spec("EZONE 100+ 7th", 100, 300, "16×19", null, "23.8–26.5–22.5", 27.5, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/"),
      spec("EZONE 100L 7th", 100, 285, "16×19", 325, "23.8–26.5–22.5", 27, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/", undefined, [
        edition("edition-yonex-ezone-100l-7-osaka", "OSAKA EZONE", "金紫龙纹", ["#29143f", "#8f65a3", "#d7ad56"], "联名款", 2022, "https://www.yonex.com/news/osaka-ezone-an-osaka-sister-original/", "2022-08-25"),
        edition("edition-yonex-ezone-100l-7-aqua-night-black", "Aqua Night Black", "夜海黑", ["#090f16", "#147d83", "#6a4c93"], "限定配色", 2024, "https://www.yonex.com/news/tennis/ezone-aqua-night-black-new-design-inspired-by-the-night-sea/", "2024-01-01"),
      ]),
      spec("EZONE 100SL 7th", 100, 270, "16×18", 330, "23.8–26.5–22.5", 27, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/", undefined, [
        edition("edition-yonex-ezone-100sl-7-osaka", "OSAKA EZONE", "金紫龙纹", ["#29143f", "#8f65a3", "#d7ad56"], "联名款", 2022, "https://www.yonex.com/news/osaka-ezone-an-osaka-sister-original/", "2022-08-25"),
      ]),
      spec("EZONE 105 7th", 105, 275, "16×19", 330, "24–26.5–23.5", 27, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/"),
      spec("EZONE 110 7th", 110, 255, "16×18", 335, "26–29–24", 27.25, "https://www.yonex.com/news/tennis/the-7th-generation-ezone-the-easy-one/"),
    ],
    note: "Osaka 联名覆盖 98 / 100 / 100L / 100SL；Aqua Night Black 官方确认覆盖 98 / 100 / 100L。其余型号保留 Sky Blue 首发配色。",
  },
  {
    id: "yonex-astrel", brand: "Yonex", family: "ASTREL", type: "舒适", generation: "现行代", releaseYear: null,
    familyUrl: "https://www.yonex.com/tennis/racquets?series=astrel",
    summary: "以减震、轻松深度和大拍面容错为核心，面向休闲与舒适优先球员。",
    image: "/rackets/catalog/yonex-astrel.png",
    models: [
      spec("ASTREL 100", 100, 280, "16×18", 325, "25.5–27.5–24", 27, "https://www.yonex.com/tennis/racquets/03ast100"),
      spec("ASTREL 105", 105, 260, "16×17", 340, "27–28.5–25", 27, "https://us.yonex.com/products/astrel-105"),
      spec("ASTREL 120", 120, 255, "16×17", 355, "27–28.5–25", 27, "https://us.yonex.com/products/astrel-120"),
    ],
    note: "官网当前未明确标注这一代首发年，未知参数保持为空。",
  },
  {
    id: "babolat-pure-aero-gen9", brand: "Babolat", family: "Pure Aero", type: "旋转", generation: "Gen9", releaseYear: 2026,
    familyUrl: "https://www.babolat.com/us/pure-aero-2026.html",
    summary: "以空气动力学框型和开放线床强化拍头速度、上旋高度与底线压迫。",
    image: "/rackets/babolat-pure-aero-98.png", deepRacketId: "babolat-pure-aero-98",
    models: [
      spec("Pure Aero 98 Gen9", 98, 305, "16×20", 315, "21–23–22", 27, "https://www.babolat.com/us/pure-aero-98-gen9-unstrung/101567.html"),
      spec("Pure Aero Gen9", 100, 300, "16×19", 321, "23–26–23", 27, "https://www.babolat.com/us/pure-aero-gen9-unstrung/101569.html"),
      spec("Pure Aero Plus Gen9", 100, 300, "16×19", 320, "23–26–23", 27.5, "https://www.babolat.com/us/pure-aero-gen9-unstrung/101570.html"),
      spec("Pure Aero Team Gen9", 100, 285, "16×19", null, "23–26–23", 27, "https://www.babolat.com/us/pure-aero-team-gen9-unstrung/101571.html"),
      spec("Pure Aero Lite Gen9", 100, 270, "16×19", 330, "23–26–23", 27, "https://www.babolat.com/us/pure-aero-lite-gen9-unstrung/101572.html"),
      spec("Pure Aero S Lite Gen9", 100, 255, "16×19", null, "23–26–23", 27, "https://www.babolat.com/us/pure-aero-s-lite-gen9-unstrung/101573.html"),
    ],
  },
  {
    id: "babolat-pure-aero-gen8", brand: "Babolat", family: "Pure Aero", type: "旋转", generation: "Gen8 · 上一代", releaseYear: 2022, releaseDate: "2022-08-25",
    status: "历史",
    familyUrl: "https://www.babolat.com/us/news-articles-blog-pure-aero-2022/pure-aero-2022.html?section=news",
    summary: "第八代 Pure Aero 以分片黄黑涂装、NF²-Tech 与打法分型建立 2022–2025 的现代旋转基准。",
    image: "/rackets/models/babolat/catalog-babolat-pure-aero-gen8-pure-aero-98-gen8-1.webp",
    models: [
      spec("Pure Aero 98 Gen8", 98, 305, "16×20", 315, "21–23–22", 27, "https://www.babolat.com/us/news-articles-blog-pure-aero-98/pure-aero-98.html"),
      spec("Pure Aero Gen8", 100, 300, "16×19", 320, "23–26–23", 27, "https://www.babolat.com/us/news-articles-blog-pure-aero-2022/pure-aero-2022.html?section=news"),
      spec("Pure Aero Plus Gen8", 100, 300, "16×19", 320, "23–26–23", 27.5, "https://www.babolat.com/us/news-articles-blog-pure-aero-2022/pure-aero-2022.html?section=news"),
      spec("Pure Aero Team Gen8", 100, 285, "16×19", 320, "23–26–23", 27, "https://www.babolat.com/us/news-articles-blog-pure-aero-2022/pure-aero-2022.html?section=news"),
      spec("Pure Aero Lite Gen8", 100, 270, "16×19", 330, "23–26–23", 27, "https://www.babolat.com/us/news-articles-blog-pure-aero-2022/pure-aero-2022.html?section=news"),
    ],
    note: "Babolat 官方将其称为第八代，并确认五款成人型号；历史页保留为规格与发行来源。",
  },
  {
    id: "babolat-pure-drive-gen11", brand: "Babolat", family: "Pure Drive", type: "力量", generation: "Gen11", releaseYear: 2025,
    familyUrl: "https://www.babolat.com/us/tennis/collections/pure-drive.html",
    summary: "直接爆发力家族，覆盖 98 精准拍面、100 主力框与 107 高容错版本。",
    image: "/rackets/babolat-pure-drive-98.png", deepRacketId: "babolat-pure-drive-98",
    models: [
      spec("Pure Drive 98 Gen11", 98, 305, "16×20", 325, "21–23–22", 27, "https://www.babolat.com/us/pure-drive-98-gen11-unstrung/101551.html"),
      spec("Pure Drive Gen11", 100, 300, "16×19", 320, "23–26–23", 27, "https://www.babolat.com/us/pure-drive-gen11-unstrung/100-101552.html", undefined, [
        edition(
          "edition-babolat-pure-drive-gen11-wimbledon-2026",
          "Wimbledon 2026",
          "温网白 / 黑",
          ["#f4f1e8", "#101116", "#4b286d"],
          "纪念款",
          2026,
          "https://www.babolat.com/fr/pure-drive-wimbledon-2026-non-cordee/101566.html",
          undefined,
          "以 Gen11 标准规格为基础的温网 2026 官方限定设计。",
        ),
      ]),
      spec("Pure Drive Plus Gen11", 100, 300, "16×19", 320, "23–26–23", 27.5, "https://www.babolat.com/us/pure-drive-gen11-unstrung/3324922165683.html"),
      spec("Pure Drive Team Gen11", 100, 285, "16×19", 320, "23–26–23", 27, "https://www.babolat.com/us/pure-drive-team-gen11-unstrung/100-101554.html"),
      spec("Pure Drive Lite Gen11", 100, 270, "16×19", 330, "23–26–23", 27, "https://www.babolat.com/us/pure-drive-lite-gen11-unstrung/101555.html"),
      spec("Pure Drive S Lite Gen11", 100, 255, "16×19", 330, "23–26–23", 27, "https://www.babolat.com/us/pure-drive-s-lite-gen11-unstrung/100-101556.html"),
      spec("Pure Drive 107 Gen11", 107, 285, "16×19", 320, "23–26–23", 27.2, "https://www.babolat.com/us/pure-drive-107-gen11-unstrung/3324922166147.html"),
    ],
  },
  {
    id: "babolat-pure-strike-gen4", brand: "Babolat", family: "Pure Strike", type: "控制", generation: "Gen4", releaseYear: 2024,
    familyUrl: "https://www.babolat.com/us/tennis/collections/pure-strike.html",
    summary: "攻击型控制拍，提供 97 / 98 / 100 拍面和多种线床密度来管理弹道。",
    image: "/rackets/babolat-pure-strike-98.png", deepRacketId: "babolat-pure-strike-98",
    models: [
      spec("Pure Strike 97 Gen4", 97, 310, "16×20", 310, "21–22–21", 27, "https://www.babolat.com/gb/pure-strike-97-gen4-unstrung/3018-101574.html"),
      spec("Pure Strike 100 16×20 Gen4", 100, 305, "16×20", 310, "21–23–21", 27, "https://www.babolat.com/gb/pure-strike-100-16-20-gen4-unstrung/3018-101576.html"),
      spec("Pure Strike 98 16×19 Gen4", 98, 305, "16×19", 320, "21–23–21", 27, "https://www.babolat.com/gb/pure-strike-16-19-gen4-unstrung/3018-101577.html"),
      spec("Pure Strike 98 18×20 Gen4", 98, 305, "18×20", 320, "21–23–21", 27, "https://www.babolat.com/gb/pure-strike-18-20-gen4-unstrung/3018-101578.html"),
      spec("Pure Strike 100 Gen4", 100, 300, "16×19", null, "21–23–21", 27, "https://www.babolat.com/gb/pure-strike-100-gen4-unstrung/3018-101579.html"),
      spec("Pure Strike Team Gen4", 100, 285, "16×19", 325, "21–23–21", 27, "https://www.babolat.com/gb/pure-strike-team-gen4-unstrung/3018-101580.html"),
    ],
  },
  {
    id: "head-speed-2026", brand: "HEAD", family: "Speed", type: "全能", generation: "2026", releaseYear: 2026,
    familyUrl: "https://www.head.com/en_US/sports/tennis/speed-racquets",
    summary: "HEAD 的全能竞赛主线，在速度、力量和控制之间覆盖从 Pro 到 Team 的完整重量带。",
    image: "/rackets/head-speed-mp-2026.jpg", deepRacketId: "head-speed-mp-2026",
    models: [
      spec("Speed Pro", 100, 310, "18×20", null, null, 27, "https://www.head.com/en_US/product/speed-pro-2026-232006", undefined, [
        edition("edition-head-speed-pro-legend", "Speed Pro Legend", "曜石黑 / 金", ["#090909", "#3d3d3d", "#c6a35d"], "纪念款", 2026, "https://www.head.com/en/sports/tennis/speed-legend", undefined, "Novak Djokovic 官方标志与黑金细节的 Legend 设计。"),
      ]),
      spec("Speed Tour", 97, 305, "16×19", null, null, 27, "https://www.head.com/en_US/product/speed-tour-2026-232016"),
      spec("Speed MP", 100, 300, "16×19", 320, 23, 27, "https://www.head.com/en_US/product/speed-mp-2026-232026", undefined, [
        edition("edition-head-speed-mp-legend", "Speed MP Legend", "曜石黑 / 金", ["#090909", "#3d3d3d", "#c6a35d"], "纪念款", 2026, "https://www.head.com/en/sports/tennis/speed-legend", undefined, "Novak Djokovic 官方标志与黑金细节的 Legend 设计。"),
      ]),
      spec("Speed MP L", 100, 285, "16×19", null, null, 27, "https://www.head.com/en_US/product/speed-mp-l-2026-232036"),
      spec("Speed MP UL", 100, 265, "16×19", null, null, 27, "https://www.head.com/en_US/product/speed-mp-ul-2026-232046"),
      spec("Speed Team", 105, 270, "16×19", null, null, 27, "https://www.head.com/en_US/product/speed-team-2026-232056"),
    ],
  },
  {
    id: "head-gravity-2025", brand: "HEAD", family: "Gravity", type: "控制", generation: "2025", releaseYear: 2025,
    familyUrl: "https://www.head.com/en_US/sports/tennis/gravity-racquets",
    summary: "标志性圆头甜区与持球感，覆盖密线 Pro、98 Tour 和易用 MP / Team。",
    image: "/rackets/head-gravity-mp-2025.jpg", deepRacketId: "head-gravity-mp-2025",
    models: [
      spec("Gravity Pro", 100, 315, "18×20", null, null, 27, "https://www.head.com/en_US/product/gravity-pro-2025-231105"),
      spec("Gravity Tour", 98, 305, "16×19", null, null, 27, "https://www.head.com/en_US/product/gravity-tour-2025-231115"),
      spec("Gravity MP", 100, 295, "16×20", null, null, 27, "https://www.head.com/en_US/product/gravity-mp-2025-231125"),
      spec("Gravity MP L", 100, 280, "16×20", null, null, 27, "https://www.head.com/en_US/product/gravity-mp-l-2025-231135"),
      spec("Gravity Team", 104, 270, "16×20", 325, null, 27, "https://www.head.com/en_US/product/gravity-team-2025-231145"),
    ],
  },
  {
    id: "head-radical-2025", brand: "HEAD", family: "Radical", type: "全能", generation: "2025", releaseYear: 2025,
    familyUrl: "https://www.head.com/en_US/sports/tennis/radical-racquets",
    summary: "快速、直接的全场框架，以 98 拍面 Pro / MP 和 102 Team 覆盖不同阶段。",
    image: "/rackets/head-radical-mp-2025.jpg", deepRacketId: "head-radical-mp-2025",
    models: [
      spec("Radical Pro", 98, 315, "16×19", null, null, 27, "https://www.head.com/en_US/product/radical-pro-2025-231005"),
      spec("Radical MP", 98, 300, "16×19", null, null, 27, "https://www.head.com/en_US/product/radical-mp-2025-231015"),
      spec("Radical Team", 102, 280, "16×19", null, null, 27, "https://www.head.com/en_US/product/radical-team-2025-231025"),
    ],
  },
  {
    id: "head-boom-2026", brand: "HEAD", family: "Boom", type: "力量", generation: "2026", releaseYear: 2026,
    familyUrl: "https://www.head.com/en_US/sports/tennis/boom-racquets/",
    summary: "面向轻松力量与友好甜区的现代框体，从 98 Pro 到 107 Team。",
    image: "/rackets/catalog/head-boom-2026.webp",
    models: [
      spec("Boom Pro", 98, 310, "16×19", null, null, 27, "https://www.head.com/en_US/product/boom-pro-2026-232206"),
      spec("Boom MP", 100, 295, "16×19", null, null, 27, "https://www.head.com/en_US/product/boom-mp-2026-232216"),
      spec("Boom MP L", 100, 275, "16×19", null, null, 27, "https://www.head.com/en_US/product/boom-mp-l-2026-232226"),
      spec("Boom MP UL", 100, 255, "16×19", null, null, 27, "https://www.head.com/en_US/product/boom-mp-ul-2026-232236"),
      spec("Boom Team", 107, 260, "16×19", 340, 26, 27, "https://www.head.com/en_US/product/boom-team-2026-232246"),
    ],
  },
  {
    id: "head-boom-2024", brand: "HEAD", family: "Boom", type: "力量", generation: "2024 · 上一代", releaseYear: 2024,
    status: "历史",
    familyUrl: "https://www.head.com/en_US/product/boom-mp-2024-230114",
    summary: "Auxetic 2.0 时代的 Boom 主力代，在标准薄荷绿之外衍生 Alternate、Arthur Ashe、RAW 与 Neon 等收藏版本。",
    image: "/rackets/models/head/catalog-head-boom-2024-boom-pro-2024-1.webp",
    models: [
      spec("Boom Pro 2024", 98, 310, "16×19", 310, 22, 27, "https://www.head.com/en_US/product/boom-pro-2024-230104"),
      spec("Boom MP 2024", 100, 295, "16×19", 315, 24, 27, "https://www.head.com/en_US/product/boom-mp-2024-230114", undefined, [
        edition("edition-head-boom-mp-2024-alternate", "Boom MP Alternate", "黑 / 珊瑚", ["#111319", "#e45c6a", "#8bd0c1"], "限定配色", 2024, "https://www.head.com/en_GB/shop-tennis/racquets/tour/boom"),
        edition("edition-head-boom-mp-arthur-ashe-2025", "Arthur Ashe Competition 2025", "复古银 / 黑", ["#d8d5cb", "#232323", "#f2a33a"], "纪念款", 2025, "https://www.head.com/es_ES/product/arthur-ashe-competition-2025-231605", "2025-06-19", "纪念 Arthur Ashe 1975 年草地大满贯冠军 50 周年，以 Boom MP 框体为基础。"),
        edition("edition-head-boom-mp-raw-2025", "Boom RAW", "原碳黑", ["#171717", "#4d514e", "#8d927f"], "可持续限定", 2025, "https://www.head.com/nl_NL/rs/stories/boom-raw-racquet", "2025-04-22", "使用 Toray 生物循环碳纤维的限量实验版本，官方说明击球定位与标准 Boom 相同。"),
        edition("edition-head-boom-mp-neon-2025", "Boom MP Neon", "纽约霓虹", ["#0c1117", "#00d8b8", "#ef2f86"], "限定配色", 2025, "https://www.head.com/en/product/boom-mp-neon-2025-231625", "2025-08-07", "纽约城市霓虹主题，规格与 Boom MP 2024 一致。"),
      ]),
      spec("Boom MP L 2024", 100, 270, "16×19", 325, 24, 27, "https://www.head.com/en_US/product/boom-mp-l-2024-230124", undefined, [
        edition("edition-head-boom-mpl-2024-alternate", "Boom MP L Alternate", "黑 / 珊瑚", ["#111319", "#e45c6a", "#8bd0c1"], "限定配色", 2024, "https://www.head.com/en_GB/shop-tennis/racquets/tour/boom"),
        edition("edition-head-boom-mpl-neon-2025", "Boom MP L Neon", "纽约霓虹", ["#0c1117", "#00d8b8", "#ef2f86"], "限定配色", 2025, "https://www.head.com/en_FI/product/boom-mp-l-neon-2025-231655", "2025-08-07"),
      ]),
      spec("Boom Team 2024", 102, 275, "16×19", 330, 25, 27, "https://www.head.com/en_US/product/boom-team-2024-230134"),
      spec("Boom Team L 2024", 107, 260, "16×19", 340, 26, 27.4, "https://www.head.com/en_US/product/boom-team-l-2024-230144"),
    ],
    note: "限定版若仅改变涂装或材料来源，归入基础型号的版本库，不重复生成六维档案；Arthur Ashe Competition 的官方说明明确基于 Boom MP 框体。",
  },
  {
    id: "head-extreme-2026", brand: "HEAD", family: "Extreme", type: "旋转", generation: "2026", releaseYear: 2026, status: "预告",
    familyUrl: "https://www.head.com/en_US/sports/tennis/extreme-racquets",
    summary: "旋转导向家族，2026 代覆盖 Pro、MP、多款轻量版和加长 MP XL。",
    image: "/rackets/catalog/head-extreme-2026.webp",
    models: [
      spec("Extreme Pro", 98, 305, "16×19", null, null, 27, "https://www.head.com/en_US/product/extreme-pro-2026-233306"),
      spec("Extreme MP", 100, 300, "16×19", null, null, 27, "https://www.head.com/en_US/product/extreme-mp-2026-233316"),
      spec("Extreme MP L", 100, 280, "16×19", null, null, 27, "https://www.head.com/en_US/product/extreme-mp-l-2026-233326"),
      spec("Extreme MP UL", 100, 260, "16×19", null, null, 27, "https://www.head.com/en_US/product/extreme-mp-ul-2026-233336"),
      spec("Extreme Team", 105, 265, "16×19", null, null, 27, "https://www.head.com/en_US/product/extreme-team-2026-233346"),
      spec("Extreme MP XL", 100, 300, "16×19", null, null, null, "https://www.head.com/en_US/product/extreme-mp-xl-2026-233376"),
    ],
    note: "核验时官网多数型号标记 Coming soon；已公开字段照录，未公开值不补猜。",
  },
  {
    id: "head-prestige-a2", brand: "HEAD", family: "Prestige", type: "控制", generation: "Auxetic 2.0", releaseYear: 2023,
    familyUrl: "https://www.head.com/en/sports/tennis/prestige-racquets",
    summary: "HEAD 经典薄框控制线，提供 95–99 拍面与不同线床密度的专业化选择。",
    image: "/rackets/catalog/head-prestige-auxetic-2.webp",
    models: [
      spec("Prestige Pro", 98, 320, "18×20", null, null, 27, "https://www.head.com/en_US/product/prestige-pro-2023-236103"),
      spec("Prestige Tour", 95, 315, "16×19", null, null, 27, "https://www.head.com/en_US/product/prestige-tour-2023-236113"),
      spec("Prestige MP", 99, 310, "18×19", null, null, 27, "https://www.head.com/en_GB/product/prestige-mp-2023-236123"),
      spec("Prestige MP L", 99, 300, "16×19", null, null, 27, "https://www.head.com/en_US/product/prestige-mp-l-2023-236133"),
    ],
  },
  {
    id: "head-instinct-2025", brand: "HEAD", family: "Instinct", type: "力量", generation: "2025", releaseYear: 2025,
    familyUrl: "https://www.head.com/en_US/shop-tennis/racquets/tour/instinct",
    summary: "更宽框体和 100 拍面带来直接回弹，是 HEAD 性能线中偏易打的力量选项。",
    image: "/rackets/catalog/head-instinct-2025.webp",
    models: [spec("Instinct MP", 100, 300, "16×19", 320, "23–26–23", 27, "https://www.head.com/en_US/product/instinct-mp-2025-232005")],
  },
  {
    id: "tecnifibre-tfight-2025", brand: "Tecnifibre", family: "T-Fight", type: "全能", generation: "2025", releaseYear: 2025,
    familyUrl: "https://www.tecnifibre.com/en/collections/raquettes-t-fight",
    summary: "现代竞赛全能线，以 98 / 100 拍面和 255–315g 重量带覆盖进阶到高阶。",
    image: "/rackets/tecnifibre-tfight-305s.webp", deepRacketId: "tecnifibre-tfight-305s",
    models: [
      spec("T-Fight 315S", 98, 315, "16×19", 310, "22.5–23–22.5", 27, "https://www.tecnifibre.com/en/products/t-fight-315s"),
      spec("T-Fight 305S", 98, 305, "18×19", 315, "22.5–23–22.5", 27, "https://www.tecnifibre.com/en/collections/raquettes-t-fight/products/t-fight-305s"),
      spec("T-Fight 300S", 98, 300, "16×19", 320, "22.5–23–22.5", 27, "https://www.tecnifibre.com/en/collections/raquettes-t-fight/products/t-fight-300s"),
      spec("T-Fight 300", 100, 300, "16×19", 320, "23–23.5–23", 27, "https://www.tecnifibre.com/en/collections/raquettes-t-fight/products/t-fight-300"),
      spec("T-Fight 285", 100, 285, "16×19", 320, "23–23.5–23", 27, "https://www.tecnifibre.com/en/collections/raquettes-t-fight/products/t-fight-285"),
      spec("T-Fight 270", 100, 270, "16×19", 325, "23–23.5–23", 27, "https://www.tecnifibre.com/en/collections/raquettes-t-fight/products/t-fight-270"),
      spec("T-Fight 255", 100, 255, "16×19", null, null, 27, "https://www.tecnifibre.com/en/collections/raquettes-t-fight/products/t-fight-255"),
    ],
    note: "T-Fight 300S 官网商品名与 B2B 参数曾出现 300g / 298g 冲突，主展示采用型号命名的 300g。",
  },
  {
    id: "tecnifibre-tf40-v3", brand: "Tecnifibre", family: "TF-40", type: "控制", generation: "V3", releaseYear: null,
    familyUrl: "https://www.tecnifibre.com/en/collections/tf-40",
    summary: "98 拍面的纯控制家族，以 16×19 / 18×20 和 290–315g 组合细分挥拍需求。",
    image: "/rackets/catalog/tecnifibre-tf40-v3.jpg",
    models: [
      spec("TF-40 290 16M V3", 98, 290, "16×19", null, 21.7, 27, "https://www.tecnifibre.com/en/collections/tf-40/products/tf-40-290-16m-v3"),
      spec("TF-40 305 16M V3", 98, 305, "16×19", 325, 21.7, 27, "https://www.tecnifibre.com/en/collections/tennis/products/tf-40-305-16m-v3"),
      spec("TF-40 305 18M V3", 98, 305, "18×20", 325, 21.7, 27, "https://www.tecnifibre.com/en/collections/tf-40/products/tf-40-305-18m-v3"),
      spec("TF-40 315 16M V3", 98, 315, "16×19", 310, 21.7, 27, "https://www.tecnifibre.com/en/collections/tf-40/products/tf-40-315-16m-v3"),
      spec("TF-40 315 18M V3", 98, 315, "18×20", 310, 21.7, 27, "https://www.tecnifibre.com/en/collections/tf-40/products/tf-40-315-18m-v3"),
    ],
    note: "官网未在当前家族页明确首发年，因此只显示现行 V3。",
  },
  {
    id: "tecnifibre-fire", brand: "Tecnifibre", family: "FIRE", type: "力量", generation: "现行代", releaseYear: 2026,
    familyUrl: "https://www.tecnifibre.com/en/collections/raquettes-de-tennis-fire",
    summary: "宽框力量线，从 305S 竞赛框延伸到 110 OS，强调回弹与轻松深度。",
    image: "/rackets/catalog/tecnifibre-fire.jpg",
    models: [
      spec("FIRE 305S", 98, 305, "16×19", 315, null, 26.97, "https://www.tecnifibre.com/en-uee/products/fire-305s"),
      spec("FIRE 300", 100, 300, "16×19", 320, "24.5–25–24.5", 26.97, "https://www.tecnifibre.com/en/products/fire-300"),
      spec("FIRE 285", 100, 285, "16×19", 325, "24.5–25–24.5", 26.97, "https://www.tecnifibre.com/en/collections/raquettes-de-tennis/products/fire-285"),
      spec("FIRE 270", 100, 270, "16×19", null, "24.5–25–24.5", 26.97, "https://www.tecnifibre.com/en-uee/products/fire-270"),
      spec("FIRE 260 OS", 110, 260, "16×19", 330, "24.5–25–24.5", 26.97, "https://www.tecnifibre.com/en/collections/raquettes-de-tennis/products/fire-260-os"),
      spec("FIRE 255", 100, 255, "16×19", 330, "24.5–25–24.5", 26.97, "https://www.tecnifibre.com/en-uee/collections/tennisschlager/products/fire-255"),
    ],
    note: "305S 两个官网页面的框厚数据互相冲突，因此该字段保留为空。",
  },
  {
    id: "tecnifibre-tempo-v2", brand: "Tecnifibre", family: "Tempo", type: "舒适", generation: "V2", releaseYear: null,
    familyUrl: "https://www.tecnifibre.com/en/collections/raquettes-tempo",
    summary: "轻量、易挥的成人系列，覆盖 255–285g，适合动作发展和灵活优先的打法。",
    image: "/rackets/catalog/tecnifibre-tempo-v2.jpg",
    models: [
      spec("Tempo 285 V2", 100, 285, "16×19", 320, null, 26.97, "https://tecnifibre.com/en/p/14TEM2852.html"),
      spec("Tempo 275 V2", 105, 275, "16×19", null, null, 26.57, "https://www.tecnifibre.com/es-ue/products/tempo-275-v2"),
      spec("Tempo 270 V2", 100, 270, "16×19", 330, null, 26.57, "https://www.tecnifibre.com/en-uee/products/tempo-270-v2"),
      spec("Tempo 265 V2", 102, 265, "16×19", null, null, 26.57, "https://www.tecnifibre.com/en/products/tempo-265-v2"),
      spec("Tempo 255 V2", 100, 255, "16×19", null, null, 26.57, "https://www.tecnifibre.com/en/products/tempo-255-v2"),
    ],
  },
  {
    id: "dunlop-cx-2024", brand: "Dunlop", family: "CX", type: "控制", generation: "2024", releaseYear: 2024,
    familyUrl: "https://us.dunlopsports.com/dunlop/tennis/rackets/cx-series",
    summary: "薄框控制主线，从 95 Tour 到 100 CX 400，兼顾经典手感和不同容错需求。",
    image: "/rackets/dunlop-cx-200.webp", deepRacketId: "dunlop-cx-200",
    models: [
      spec("CX 200 Tour 18×20", 95, 315, "18×20", 310, 20.5, 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/cx-series/cx-200-tour-%2818x20%29-tennis-racket/CX200T1820-24.html"),
      spec("CX 200 Tour 16×19", 95, 310, "16×19", 310, 20.5, 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/cx-series/cx-200-tour-tennis-racket/CX200T1619-24.html"),
      spec("CX 200", 98, 305, "16×19", 315, 21.5, 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/cx-series/cx-200-tennis-racket/CX200-24.html"),
      spec("CX 200 LS", 98, 290, "16×19", 325, 21.5, 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/cx-series/cx-200-ls-tennis-racket/CX200LS-24.html"),
      spec("CX 200 OS", 105, null, "16×19", 325, 21.5, 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/cx-series/cx-200-os-tennis-racket/CX200OS-24.html"),
      spec("CX 400 Tour", 100, 300, "16×19", 320, 23, 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/cx-series/cx-400-tour-tennis-racket/CX400T-24.html"),
      spec("CX 400", 100, 285, "16×19", 330, 24, 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/cx-series/cx-400-tennis-racket/CX400-24.html"),
    ],
    note: "CX 200 OS 美英官网曾出现 290g / 295g 冲突，因此重量保留为空。",
  },
  {
    id: "dunlop-sx-2025", brand: "Dunlop", family: "SX", type: "旋转", generation: "2025", releaseYear: 2025,
    familyUrl: "https://us.dunlopsports.com/dunlop/tennis/rackets/sx-series",
    summary: "旋转导向框型，以 98 Tour、100 标准和轻量版本覆盖高拍头速度打法。",
    image: "/rackets/catalog/dunlop-sx-2025.jpg",
    models: [
      spec("SX 300 Tour", 98, 305, "16×19", 315, "23–26–23", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/sx-series/sx-300-tour-tennis-racket/10361521.html"),
      spec("SX 300", 100, 300, "16×19", 320, "23–26–23", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/sx-series/sx-300-tennis-racket/10361525.html"),
      spec("SX 300 LS", 100, 285, "16×19", 325, "23–26–23", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/sx-series/sx-300-ls-tennis-racket/SX300LS-25.html"),
      spec("SX 300 Lite", 100, 270, "16×18", 330, "23–26–23", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/sx-series/sx-300-lite-tennis-racket/10361534.html"),
    ],
  },
  {
    id: "dunlop-fx-2026", brand: "Dunlop", family: "FX", type: "力量", generation: "2026", releaseYear: 2026,
    familyUrl: "https://us.dunlopsports.com/dunlop/tennis/rackets/fx-series",
    summary: "力量与速度主线，从 98 Tour 到 255g Super Lite，覆盖完整成人重量带。",
    image: "/rackets/catalog/dunlop-fx-2026.jpg",
    models: [
      spec("FX 500 Tour", 98, 305, "16×19", 315, "21–23–21", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/fx-series/fx-500-tour/10369894.html"),
      spec("FX 500", 100, 300, "16×19", 320, "23–26–23", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/fx-series/fx-500/10369898.html"),
      spec("FX 500 LS", 100, 285, "16×19", 325, "23–26–23", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/fx-series/fx-500-ls/10369903.html"),
      spec("FX 500 Lite", 100, 270, "16×18", 330, "23–26–23", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/fx-series/fx-500-lite/10369906.html"),
      spec("FX 500 Super Lite", 100, 255, "16×18", 330, "23–26–23", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/fx-series/fx-500-super-lite/10369911.html"),
    ],
  },
  {
    id: "dunlop-lx", brand: "Dunlop", family: "LX", type: "舒适", generation: "现行代", releaseYear: 2024,
    familyUrl: "https://us.dunlopsports.com/dunlop/tennis/rackets/lx-series",
    summary: "110–115 大拍面与头重设定，主打最省力的击球深度和最大甜区。",
    image: "/rackets/catalog/dunlop-lx.jpg",
    models: [
      spec("LX 800 Tour Ltd", 110, 285, "16×18", 325, "26–27–26", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/lx-series/lx-800-tour-ltd-edition-tennis-racket/10376256.html"),
      spec("LX 800", 110, 255, "16×18", 355, "26–27–26", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/lx-series/lx-800-tennis-racket/10357701.html"),
      spec("LX 1000", 115, 255, "16×18", 360, "27–28–27", 27, "https://us.dunlopsports.com/dunlop/tennis/rackets/lx-series/lx-1000-tennis-racket/10357706.html"),
    ],
  },
  {
    id: "volkl-vostra", brand: "Völkl", family: "VÖSTRA", type: "全能", generation: "现行代", releaseYear: null,
    familyUrl: "https://www.volkltennis.com/collections/vostra",
    summary: "Völkl 现行主线，以数字分级覆盖 98–115 拍面、255–320g 和多种打法方向。",
    image: "/rackets/volkl-vostra-v1-mp.webp", deepRacketId: "volkl-vostra-v1-mp",
    models: [
      spec("VÖSTRA 1 Power Arm", 115, 255, "16×17", 355, "27–29", 27.8, "https://www.volkltennis.com/products/vostra-1-power-arm"),
      spec("VÖSTRA V1 Pro", 99.5, 305, "16×19", 325, "23–20–23", 27, "https://www.volkltennis.com/products/vostra-v1-pro"),
      spec("VÖSTRA V1 MP", 102, 285, "16×19", 325, "25–22–28", 27, "https://www.volkltennis.com/products/vostra-v1-mp"),
      spec("VÖSTRA V1 OS", 110, 285, "16×19", 325, "26–23–29", 27.6, "https://www.volkltennis.com/products/v-cell-v1-os-copy"),
      spec("VÖSTRA V2", 115, 265, "16×19", 345, 28, 27.6, "https://www.volkltennis.com/products/vostra-v2"),
      spec("VÖSTRA V3", 110, 270, "16×19", 340, "26–28", 27.8, "https://www.volkltennis.com/products/vostra-v3"),
      spec("VÖSTRA V4", 105, 275, "16×19", 325, 25, 27.6, "https://www.volkltennis.com/products/vostra-v4"),
      spec("VÖSTRA V5", 100, 260, "16×18", 330, "22–24–22", 27, "https://www.volkltennis.com/products/vostra-v5"),
      spec("VÖSTRA V6", 100, 275, "16×19", 330, "24–26–23", 27, "https://www.volkltennis.com/products/vostra-v6-available-december-20th"),
      spec("VÖSTRA V7", 100, 300, "16×19", 320, "24–26–23", 27, "https://www.volkltennis.com/products/vostra-v7"),
      spec("VÖSTRA V8 285", 100, 285, "16×18", 325, "22–24–22", 27, "https://www.volkltennis.com/products/vostra-v8-285g"),
      spec("VÖSTRA V8 300", 100, 300, "16×18", 320, "22–24–22", 27, "https://www.volkltennis.com/products/vostra-v8-300g"),
      spec("VÖSTRA V8 315", 100, 315, "16×18", 315, "22–24–22", 27, "https://www.volkltennis.com/products/vostra-v8-315g"),
      spec("VÖSTRA V9 290", 100, 290, "16×19", 325, "21–23–21", 27, "https://www.volkltennis.com/products/vostra-9-290g-available-3-31-2024", "2024-03-31"),
      spec("VÖSTRA V9 305", 100, 305, "16×19", 325, "21–23–21", 27, "https://www.volkltennis.com/products/vostra-9"),
      spec("VÖSTRA V10 300", 98, 300, "16×19", 325, "20.5–22.5–20.5", 27, "https://www.volkltennis.com/products/vostra-v10-300g"),
      spec("VÖSTRA V10 320", 98, 320, "16×19", 315, "20.5–22.5–20.5", 27, "https://www.volkltennis.com/products/vostra-v10-300g-available-8-1-copy"),
    ],
    note: "VÖSTRA 官网多数型号未明确发行年；V3 拍面按商品文案和公制换算记为 110in²。",
  },
  {
    id: "volkl-classic-2025", brand: "Völkl", family: "Classic", type: "控制", generation: "2025 / 现行", releaseYear: 2025,
    familyUrl: "https://www.volkltennis.com/collections/classic",
    summary: "经典低刚性与高静重路线，包含 C10、V1、V8 Pro 以及仍在售的 PB 10 Mid。",
    image: "/rackets/catalog/volkl-classic-2025.jpg",
    models: [
      spec("C10 Pro 2025", 98, 330, "16×19", 310, 20, 27, "https://www.volkltennis.com/products/c10-pro-2025"),
      spec("C10 EVO 2025", 98, 310, "16×19", 325, 20, 27, "https://www.volkltennis.com/products/c10-evo-2025"),
      spec("V1 Classic 2025", 102, 285, "16×19", null, "25–22–28", 27, "https://www.volkltennis.com/products/v1-classic-2025"),
      spec("V1 EVO 2025", 102, 305, "16×19", 325, "25–22–28", 27, "https://www.volkltennis.com/products/v1-evo-2025-available-10-15"),
      spec("V8 Pro 2025", 100, 305, "18×20", 315, "22–24–22", 27, "https://www.volkltennis.com/products/v8-pro-2025-available-10-15"),
      spec("PB 10 Mid", 93, 330, "16×19", 310, 19, 27, "https://www.volkltennis.com/products/pb10"),
    ],
    note: "V1 Classic 2025 官网正文和规格表的平衡点冲突，因此该值保持为空。",
  },
  {
    id: "prince-phantom-graphite", brand: "Prince", family: "PHANTOM GRAPHITE", type: "控制", generation: "2026 / 现行", releaseYear: 2026,
    familyUrl: "https://princetennis.jp/product-category/tennis/tennis-racket/tennis-racket-phantom-graphite-2025",
    summary: "Prince 经典石墨控制家族，当前代跨 93、97、100 和 107 拍面。",
    image: "/rackets/catalog/prince-phantom-graphite.jpg",
    models: [
      spec("PHANTOM GRAPHITE 93", 93, 315, "16×19", 305, "22.5–21.5–18.5", 27, "https://princetennis.jp/product/7tj284", "2026-07"),
      spec("PHANTOM GRAPHITE 100XS 300", 100, 300, "16×18", 320, "23–21–19", 27, "https://princetennis.jp/product/7tj249", "2026-02"),
      spec("PHANTOM GRAPHITE 100XS 285", 100, 285, "16×18", 325, "23–21–19", 27, "https://princetennis.jp/product/7tj250", "2026-02"),
      spec("PHANTOM GRAPHITE 97 315", 97, 315, "16×19", 305, "22.5–21.5–18.5", 27, "https://princetennis.jp/product/7tj247", "2025-07"),
      spec("PHANTOM GRAPHITE 97 300", 97, 300, "16×19", 320, "22.5–21.5–18.5", 27, "https://princetennis.jp/product/7tj248", "2025-07"),
      spec("PHANTOM GRAPHITE 100", 100, 310, "16×18", 310, "21.5–20–17.5", 27, "https://princetennis.jp/product/7tj226", "2024-07"),
      spec("PHANTOM GRAPHITE 107", 107, 305, "16×19", 310, "21.5–20–17.5", 27, "https://princetennis.jp/product/7tj225", "2024-07"),
    ],
  },
  {
    id: "prince-tour-2026", brand: "Prince", family: "TOUR", type: "全能", generation: "2026", releaseYear: 2025,
    familyUrl: "https://princetennis.jp/product-category/tennis/tennis-racket/tennis-racket-tour-2026",
    summary: "Prince 全场竞赛线，从 95 / 98 到 100，并提供传统孔和 O3 大孔版本。",
    image: "/rackets/catalog/prince-tour-2026.jpg",
    models: [
      spec("TOUR 95", 95, 310, "16×19", 310, "22–22–20", 27, "https://princetennis.jp/product/7tj256", "2025-11"),
      spec("TOUR 98", 98, 305, "16×19", 315, "23.5–23.5–21", 27, "https://princetennis.jp/product/7tj257", "2025-11"),
      spec("TOUR 100 305", 100, 305, "16×19", 313, "22–23–20", 27, "https://princetennis.jp/product/7tj251", "2025-09"),
      spec("TOUR 100 290", 100, 290, "16×19", 325, "22–23–20", 27, "https://princetennis.jp/product/7tj252", "2025-09"),
      spec("TOUR O3 100 305", 100, 305, "16×19", 310, "22–23–20", 27, "https://princetennis.jp/product/7tj254", "2025-09"),
      spec("TOUR O3 100 290", 100, 290, "16×19", 325, "22–23–20", 27, "https://princetennis.jp/product/7tj255", "2025-09"),
      spec("TOUR 100 L", 100, 270, "16×18", 342, "22–23–20", 27, "https://princetennis.jp/product/7tj253", "2025-09"),
    ],
  },
  {
    id: "prince-phantom-2025", brand: "Prince", family: "PHANTOM", type: "控制", generation: "2025", releaseYear: 2024,
    familyUrl: "https://princetennis.jp/product-category/tennis/tennis-racket/tennis-racket-phantom-2025",
    summary: "超薄框 100 拍面控制线，传统线孔与 O3 大孔两种手感路线并行。",
    image: "/rackets/catalog/prince-phantom-2025.jpg",
    models: [
      spec("PHANTOM 100", 100, 305, "16×18", 315, "20–22–20", 27, "https://princetennis.jp/product/7tj232", "2024-09"),
      spec("PHANTOM O3 100", 100, 310, "16×18", 310, "20–20–16.5", 27, "https://princetennis.jp/product/7tj231", "2024-09"),
    ],
  },
  {
    id: "prince-beast-2024", brand: "Prince", family: "BEAST", type: "力量", generation: "2024", releaseYear: 2023,
    familyUrl: "https://princetennis.jp/product-category/tennis/tennis-racket/tennis-racket-beast-2024",
    summary: "高回弹力量家族，98 / 100 / 104 拍面并提供 O3 与 DB 不同框体版本。",
    image: "/rackets/catalog/prince-beast-2024.jpg",
    models: [
      spec("BEAST 98", 98, 305, "16×19", 320, "25–24–22", 27, "https://princetennis.jp/product/7tj227", "2024-05"),
      spec("BEAST 100 300", 100, 300, "16×19", 320, "24–26–23", 27, "https://princetennis.jp/product/7tj201", "2023-09"),
      spec("BEAST 100 280", 100, 280, "16×19", 330, "24–26–23", 27, "https://princetennis.jp/product/7tj202", "2023-09"),
      spec("BEAST O3 100 300", 100, 300, "16×19", 320, "23.5–25–22", 27, "https://princetennis.jp/product/7tj205", "2023-09"),
      spec("BEAST O3 100 280", 100, 280, "16×19", 330, "23.5–25–22", 27, "https://princetennis.jp/product/7tj206", "2023-09"),
      spec("BEAST DB 100 300", 100, 300, "16×19", 320, "24–26–23", 27, "https://princetennis.jp/product/7tj203", "2023-09"),
      spec("BEAST DB 100 280", 100, 280, "16×19", 330, "24–26–23", 27, "https://princetennis.jp/product/7tj204", "2023-09"),
      spec("BEAST O3 104", 104, 280, "16×19", 335, "23.5–25–23", 27, "https://princetennis.jp/product/7tj228", "2024-05"),
    ],
  },
  {
    id: "prince-x", brand: "Prince", family: "X", type: "舒适", generation: "2024 / 现行", releaseYear: 2024,
    familyUrl: "https://princetennis.jp/product-category/tennis/tennis-racket/tennis-racket-x-2024",
    summary: "非对称扭转设计的左右手专用线，从 98 Tour 延伸到 115 超大拍面。",
    image: "/rackets/catalog/prince-x.jpg",
    models: [
      spec("X 98 TOUR", 98, 305, "16×19", 320, "25–24–23", 27, "https://princetennis.jp/product/7tj218", "2024-02"),
      spec("X 100 TOUR", 100, 300, "16×18", 320, "24.5–24.5–20", 27, "https://princetennis.jp/product/7tj216", "2024-02"),
      spec("X 100", 100, 290, "16×18", 325, "24.5–24.5–20", 27, "https://princetennis.jp/product/7tj180", "2022-09"),
      spec("X 105 290", 105, 290, "16×19", 310, "27–25–22", 27, "https://princetennis.jp/product/7tj182", "2022-09"),
      spec("X 105 270", 105, 270, "16×19", 338, "27–25–22", 27, "https://princetennis.jp/product/7tj184", "2022-09"),
      spec("X 105 255", 105, 255, "16×19", 352, "27–25–22", 27, "https://princetennis.jp/product/7tj186", "2022-09"),
      spec("X 115", 115, 236, "16×19", 365, "30–27.5–24", 27.25, "https://princetennis.jp/product/7tj145", "2021-04"),
    ],
    note: "同一规格的左手/右手版合并展示；购买时仍需选择正确手别。",
  },
  {
    id: "prince-emblem", brand: "Prince", family: "EMBLEM", type: "舒适", generation: "2025 / 现行", releaseYear: 2024,
    familyUrl: "https://princetennis.jp/product-category/tennis/tennis-racket/tennis-racket-emblem-2025",
    summary: "110 / 120 超大拍面与轻量头重设定，优先提供容错和省力深度。",
    image: "/rackets/catalog/prince-emblem.jpg",
    models: [
      spec("EMBLEM 110", 110, 255, "16×18", 350, "26–28–26", 27, "https://princetennis.jp/product/7tj233", "2024-07"),
      spec("EMBLEM 120", 120, 247, "16×19", 365, "30–27.5–26", 27.25, "https://princetennis.jp/product/7tj234", "2024-07"),
    ],
  },
  {
    id: "solinco-prizm", brand: "Solinco", family: "Prizm", type: "舒适", generation: "首代", releaseYear: 2026, releaseDate: "2026-04-13", status: "现行",
    familyUrl: "https://solincosports.com/introducing-the-prizm-115/",
    summary: "115 大拍面、加长框体与宽拍框组成的省力型产品，定位于更大甜区和轻松深度。",
    image: "/rackets/models/solinco/catalog-solinco-prizm-prizm-115-1.webp",
    models: [
      spec("Prizm 115", 115, 260, "16×19", 350, "28–30–28", 27.5, "https://solincosports.com/equipment/prizm-115/"),
    ],
  },
  {
    id: "solinco-whiteout-v2", brand: "Solinco", family: "Whiteout", type: "控制", generation: "V2", releaseYear: 2025, releaseDate: "2025-01-10", status: "现行",
    familyUrl: "https://solincosports.com/the-all-new-whiteout-v2/",
    summary: "98 拍面的控制拍系，以 290 / 305g、标准与加长框、开放与密线床细分挥拍需求。",
    image: "/rackets/models/solinco/catalog-solinco-whiteout-v2-whiteout-v2-305-1.webp",
    models: [
      spec("Whiteout V2 305", 98, 305, "16×19", 320, 21.7, 27, "https://solincosports.com/equipment/whiteout-305-v2/"),
      spec("Whiteout V2 290", 98, 290, "16×19", 325, 21.7, 27, "https://solincosports.com/equipment/whiteout-290-v2/"),
      spec("Whiteout V2 305 XTD", 98, 305, "16×19", 320, 21.7, 27.5, "https://solincosports.com/equipment/whiteout-v2-305-xtd/"),
      spec("Whiteout V2 305 18×20", 98, 305, "18×20", 325, 21.7, 27, "https://solincosports.com/equipment/whiteout-v2-18x20/", "2025-11-19"),
      spec("Whiteout V2 305 XTD 18×20", 98, 305, "18×20", 325, 21.7, 27.5, "https://solincosports.com/equipment/whiteout-v2-18x20-xtd/", "2025-11-19"),
    ],
    note: "18×20 两款在 2025 年 11 月后加入本代；官网未披露的刚度和挥重不作推算。",
  },
  {
    id: "solinco-blackout-v2", brand: "Solinco", family: "Blackout", type: "旋转", generation: "V2", releaseYear: 2025, releaseDate: "2025-09-22", status: "现行",
    familyUrl: "https://solincosports.com/the-all-new-blackout-v2-your-power-amplified/",
    summary: "开放线床与较宽框体服务快速拍头和强上旋，同时覆盖标准、加长和 110 大拍面版本。",
    image: "/rackets/models/solinco/catalog-solinco-blackout-v2-blackout-v2-300-1.webp",
    models: [
      spec("Blackout V2 300", 100, 300, "16×19", 315, "23.5–26–23", 27, "https://solincosports.com/equipment/blackout-v2-300/"),
      spec("Blackout V2 285", 100, 285, "16×19", 330, "23.5–26–23", 27, "https://solincosports.com/equipment/blackout-v2-285/"),
      spec("Blackout V2 300 XTD", 100, 300, "16×19", 315, "23.5–26–23", 27.5, "https://solincosports.com/equipment/blackout-v2-300-xtd/"),
      spec("Blackout V2 110", 110, 268, "16×19", 340, "23.5–26–23", 27.5, "https://solincosports.com/equipment/blackout-v2-110/", "2026-05-05"),
    ],
    note: "官网未说明重量和平衡的穿线状态；未在品牌装备页确认的商店变体不纳入。",
  },
  {
    id: "prokennex-qplus-2026", brand: "ProKennex", family: "Q+", type: "舒适", generation: "2026", releaseYear: 2026, status: "现行",
    familyUrl: "https://prokennex.com/pages/2026-q-series",
    summary: "Kinetic 舒适技术覆盖 98–119 拍面，从薄框 Tour 到大拍面 Q+30 形成完整成人梯度。",
    image: "/rackets/models/prokennex/catalog-prokennex-qplus-2026-q-plus-30-1.webp",
    models: [
      spec("Q+ 30", 119, 265, "16×19", 345, 28, 27.5, "https://prokennex.com/products/q-31"),
      spec("Q+ 20", 110, 285, "16×19", 330, 24, 27.25, "https://prokennex.com/products/q-21"),
      spec("Q+ 15", 105, 285, "16×19", 335, 26, 27.5, "https://prokennex.com/products/q-16"),
      spec("Q+ 5", 100, 300, "16×20", 320, 22, 27, "https://prokennex.com/products/q-6"),
      spec("Q+ 5 Pro", 100, 310, "16×20", 310, 22, 27, "https://prokennex.com/products/q-5-pro"),
      spec("Q+ Tour 16×19", 98, 305, "16×19", 315, 19.5, 27, "https://prokennex.com/products/q-tour-1"),
      spec("Q+ Tour Pro 18×20", 98, 305, "18×20", 320, 19.5, 27, "https://prokennex.com/products/q-tour-pro"),
    ],
    note: "重量、平衡和拍框参数按官网未穿线规格记录。",
  },
  {
    id: "prokennex-black-ace-current", brand: "ProKennex", family: "Black Ace", type: "舒适", generation: "Ace Station 当前代", releaseYear: null, status: "现行",
    familyUrl: "https://prokennex.com/pages/ace-station-information",
    summary: "以 Kinetic 舒适反馈为核心的控制向拍系，覆盖 97 / 100 / 105 拍面和 285–315g 重量带。",
    image: "/rackets/models/prokennex/catalog-prokennex-black-ace-current-black-ace-285-1.webp",
    models: [
      spec("Black Ace 285", 100, 285, "16×19", 325, 21, 27, "https://prokennex.com/products/ace-station-black-ace"),
      spec("Black Ace 300", 100, 300, "16×19", 320, 21, 27, "https://prokennex.com/products/ace-station-black-ace"),
      spec("Black Ace 315", 100, 315, "16×19", 310, 21, 27, "https://prokennex.com/products/ace-station-black-ace"),
      spec("Black Ace Pro 97", 97, 305, "16×19", 320, 19.5, 27, "https://prokennex.com/products/ace-station-black-ace-pro"),
      spec("Black Ace 105", 105, 300, "16×19", 320, 23.5, 27.25, "https://prokennex.com/products/ace-station-black-ace-105"),
    ],
    note: "官网未为 Ace Station 当前代标注发行年；同商品页的 285 / 300 / 315g 作为独立规格展示。",
  },
  {
    id: "prokennex-ki-current", brand: "ProKennex", family: "Ki", type: "舒适", generation: "当前 SpiralTech / Kinetic 代", releaseYear: null, status: "现行",
    familyUrl: "https://prokennex.com/collections/ki-series",
    summary: "舒适与省力取向的 Kinetic 拍系，从 100 到 105 拍面覆盖标准和加长框体。",
    image: "/rackets/models/prokennex/catalog-prokennex-ki-current-ki-15-260-1.webp",
    models: [
      spec("Ki 15 260", 105, 260, "16×19", 340, 25, 27.5, "https://prokennex.com/products/ki-15"),
      spec("Ki 15 300", 105, 300, "16×19", 320, 25, 27.5, "https://prokennex.com/products/ki-15"),
      spec("Ki 10", 100, 305, "16×19", 320, 24, 27, "https://prokennex.com/products/ki-10"),
      spec("Ki 5", 100, 295, "16×20", 325, 22, 27, "https://prokennex.com/products/ki-5"),
    ],
    note: "官网未为当前 SpiralTech / Kinetic 代标注发行年；同商品页的重量规格分别建档。",
  },
  {
    id: "diadem-axis-current", brand: "Diadem", family: "Axis", type: "全能", generation: "现行代", releaseYear: 2025, status: "现行",
    familyUrl: "https://diademsports.com/collections/tennis-rackets",
    summary: "围绕现代上旋与全场覆盖设计，提供 98 控制拍面、100 标准框和轻量 Team。",
    image: "/rackets/models/diadem/catalog-diadem-axis-current-axis-98-1.webp",
    models: [
      spec("Axis 98", 98, 305, "16×20", 315, "21.5–23.5–22", 27, "https://diademsports.com/products/axis-98"),
      spec("Axis 100", 100, 300, "16×19", 330, "23–26–23", 27, "https://diademsports.com/products/axis-100"),
      spec("Axis Team", 100, 280, "16×19", 330, "23–26–23", 27, "https://diademsports.com/products/axis-team"),
    ],
  },
  {
    id: "diadem-dream-current", brand: "Diadem", family: "Dream", type: "舒适", generation: "现行代", releaseYear: 2024, releaseDate: "2024-08-23", status: "现行",
    familyUrl: "https://diademsports.com/blogs/diademblog/diadem-sports-unveils-the-dream-105-and-dream-110-where-innovation-meets-comfort",
    summary: "105 / 110 大拍面与适中重量优先提供甜区、舒适和轻松深度。",
    image: "/rackets/models/diadem/catalog-diadem-dream-current-dream-105-1.webp",
    models: [
      spec("Dream 105", 105, 285, "16×19", 330, 23.5, 27, "https://diademsports.com/products/dream"),
      spec("Dream 110", 110, 270, "16×19", 330, 23.5, 27, "https://diademsports.com/products/dream"),
    ],
  },
  {
    id: "diadem-nova-v3", brand: "Diadem", family: "Nova", type: "力量", generation: "V3", releaseYear: 2024, releaseDate: "2024-02-05", status: "现行",
    familyUrl: "https://diademsports.com/blogs/diademblog/h1-elevating-the-game-unveiling-the-nova-v3-racket-line-a-game-changer-from-diadem-sports-h1",
    summary: "100 拍面的力量拍系，以 270–315g、标准与加长框覆盖从易挥到稳定的不同需求。",
    image: "/rackets/models/diadem/catalog-diadem-nova-v3-nova-v3-plus-1.webp",
    models: [
      spec("Nova V3 Plus", 100, 305, "16×19", 335, 23.5, 27.5, "https://diademsports.com/products/nova-v3-plus"),
      spec("Nova V3 Tour", 100, 315, "16×19", 305, 23.5, 27, "https://diademsports.com/products/nova-v3-tour"),
      spec("Nova V3 Team", 100, 285, "16×19", 325, 23.5, 27, "https://diademsports.com/products/nova-v3-team"),
      spec("Nova V3 100", 100, 300, "16×19", 320, 23.5, 27, "https://diademsports.com/products/nova-v3"),
      spec("Nova V3 Lite", 100, 270, "16×19", 330, 23.5, 27, "https://diademsports.com/products/nova-v3-lite"),
    ],
    note: "Nova 105 FS 当前库存变体与官网公开规格存在冲突，因此不纳入。",
  },
  {
    id: "diadem-elt-current", brand: "Diadem", family: "ELT", type: "力量", generation: "现行代", releaseYear: 2025, status: "现行",
    familyUrl: "https://diademsports.com/collections/tennis-rackets",
    summary: "轻量成人力量线，Nova 与 Elevate 两种框体路线均以 100 拍面和开放线床降低挥拍门槛。",
    image: "/rackets/models/diadem/catalog-diadem-elt-current-nova-elt-1.webp",
    models: [
      spec("Nova ELT", 100, null, "16×19", null, null, null, "https://diademsports.com/products/nova-elt"),
      spec("Elevate ELT", 100, null, "16×19", null, null, null, "https://diademsports.com/products/elevate-elt"),
    ],
    note: "官网仅以盎司和 points HL 披露重量与平衡，无法无歧义写入克和毫米字段；其余未公开值保持为空。",
  },
  {
    id: "diadem-elevate-v4", brand: "Diadem", family: "Elevate", type: "控制", generation: "V4", releaseYear: 2026, status: "现行",
    familyUrl: "https://diademsports.com/collections/tennis-rackets",
    summary: "98 拍面的薄框控制线，16×20 线床与 290 / 305 / 315g 梯度覆盖不同挥拍负荷。",
    image: "/rackets/models/diadem/catalog-diadem-elevate-v4-elevate-v4-98-1.webp",
    models: [
      spec("Elevate V4 98", 98, 305, "16×20", 320, 21.5, 27, "https://diademsports.com/products/elevate-v4-98"),
      spec("Elevate V4 Tour 98", 98, 315, "16×20", 315, 21.5, 27, "https://diademsports.com/products/elevate-v4-tour-98"),
      spec("Elevate V4 Team 98", 98, 290, "16×20", 335, 21.5, 27, "https://diademsports.com/products/elevate-v4-team-98"),
    ],
  },
  {
    id: "diadem-elevate-v3", brand: "Diadem", family: "Elevate", type: "控制", generation: "V3 · 在售旧代", releaseYear: 2023, status: "在售",
    familyUrl: "https://diademsports.com/collections/tennis-rackets",
    summary: "官网仍可购买的 V3 控制线，98 拍面、16×20 线床与三档重量覆盖不同挥拍负荷。",
    image: "/rackets/models/diadem/catalog-diadem-elevate-v3-elevate-v3-98-1.webp",
    models: [
      spec("Elevate V3 98", 98, 305, "16×20", 320, 21.5, 27, "https://diademsports.com/products/diadem-elevate-v3"),
      spec("Elevate V3 Tour 98", 98, 315, "16×20", 315, 21.5, 27, "https://diademsports.com/products/diadem-elevate-tour-v3"),
      spec("Elevate V3 Lite 98", 98, 290, "16×20", 335, 21.5, 27, "https://diademsports.com/products/diadem-elevate-lite-v3"),
    ],
    note: "这是官网仍有购买入口的上一代现售产品；不与 V4 混作同一代。",
  },
];

export const catalogBrands = Array.from(new Set(catalogFamilies.map((family) => family.brand)));
export const catalogTypes: ("全部" | RacketFamilyType)[] = ["全部", "控制", "旋转", "力量", "全能", "舒适"];
export const catalogModelCount = catalogFamilies.reduce((total, family) => total + family.models.length, 0);
export const catalogEditionCount = catalogFamilies.reduce(
  (total, family) => total + family.models.reduce((modelTotal, model) => modelTotal + (model.editions?.length ?? 0), 0),
  0,
);
export const catalogHistoricalFamilyCount = catalogFamilies.filter((family) => family.status === "历史").length;
export const catalogVisualVersionCount = catalogModelCount + catalogEditionCount;
