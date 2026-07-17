export type RacketFamilyType = "控制" | "旋转" | "力量" | "全能" | "舒适";

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
};

export type CatalogFamily = {
  id: string;
  brand: string;
  family: string;
  type: RacketFamilyType;
  generation: string;
  releaseYear: number | null;
  releaseDate?: string;
  status?: "在售" | "预告" | "现行";
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
): CatalogModel => ({ name, head, weight, pattern, balance, beam: beam === null ? null : String(beam), length, url, releaseDate });

export const catalogVerifiedAt = "2026-07-17";

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
      spec("Blade Pro 100 V10", 100, null, null, null, null, 27, "https://jp.wilson.com/products/tennis-racket-blade-100-pro-v10-frm"),
      spec("Blade 100 V10", 100, 300, "16×19", 320, 22, 27, "https://jp.wilson.com/products/tennis-racket-blade-100-v10-frm"),
      spec("Blade 100L V10", 100, 285, "16×19", 330, 22, 27, "https://jp.wilson.com/products/tennis-racket-blade-100l-v10-frm"),
      spec("Blade 100UL V10", 100, 265, "16×19", 335, 22, 27, "https://jp.wilson.com/products/tennis-racket-blade-100ul-v10-frm"),
      spec("Blade 104 V10", 104, 290, "16×19", 320, 22, 27.5, "https://jp.wilson.com/products/tennis-racket-blade-104-v10-frm"),
    ],
  },
  {
    id: "wilson-pro-staff-classic", brand: "Wilson", family: "Pro Staff", type: "控制", generation: "Classic", releaseYear: 2026,
    familyUrl: "https://www.wilson.com/en-us/explore/help/product/stringing-instructions",
    summary: "经典薄框与头轻设定，优先服务完整挥拍、单点精确与网前反馈。",
    image: "/rackets/catalog/wilson-pro-staff-classic-2026.jpg", deepRacketId: "wilson-pro-staff-97-v14",
    models: [
      spec("Pro Staff 97 Classic", 97, 315, "16×19", 310, 21.5, 27, "https://jp.wilson.com/products/tennis-racket-pro-staff-97-classic"),
      spec("Pro Staff 97L Classic", 97, 290, "16×19", 325, 23, 27, "https://jp.wilson.com/products/tennis-racket-pro-staff-97l-classic"),
      spec("Pro Staff X Classic", 100, 315, "16×19", 310, 21.5, 27, "https://jp.wilson.com/products/tennis-racket-pro-staff-x-classic"),
      spec("Pro Staff Team Classic", 100, 280, "16×19", 325, 23.5, 27, "https://sg.wilson.com/products/wilson-pro-staff-team-classic-pro-staff-x-classic-performance-tennis-racket-100in-16x19"),
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
      spec("Ultra 100UL V5", 100, 260, "16×19", 330, "24–26.5–24.5", 27, "https://www.wilson.com/en-us/explore/help/product/stringing-instructions"),
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
      spec("Clash 100L V3", 100, 280, "16×19", 315, 24, 27, "https://jp.wilson.com/pages/tennis-rackets-clash-v-3"),
      spec("Clash 100UL V3", 100, 265, "16×19", 330, 24, 27, "https://jp.wilson.com/products/tennis-racket-clash-100-ul-v-3-0"),
      spec("Clash 108 V3", 108, 280, "16×19", 335, 24, 27.25, "https://jp.wilson.com/products/tennis-racket-clash-108-v-3-0"),
    ],
  },
  {
    id: "wilson-rf01", brand: "Wilson", family: "RF", type: "全能", generation: "RF 01", releaseYear: 2024,
    familyUrl: "https://www.wilson.com/en-us/explore/help/product/stringing-instructions",
    summary: "费德勒参与开发的快速全场框架，以 98 拍面覆盖 265–320g 重量带。",
    image: "/rackets/catalog/wilson-rf01.jpg",
    models: [
      spec("RF 01 Pro", 98, 320, "16×19", 315, "23.2–24–22", 27, "https://jp.wilson.com/products/tennis-racket-rf-01-pro"),
      spec("RF 01", 98, 300, "16×19", 315, "23.2–24–22", 27, "https://jp.wilson.com/products/tennis-racket-rf-01"),
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
      spec("Shift 99 Pro V1", 99, 315, "18×20", 315, 23, 27, "https://jp.wilson.com/pages/tennis-rackets-shift-2023"),
      spec("Shift 99 V1", 99, 300, "16×20", 315, 23, 27, "https://jp.wilson.com/products/tennis-racket-shift-99-v-1-0"),
      spec("Shift 99L V1", 99, 285, "16×20", 320, 23, 27, "https://jp.wilson.com/pages/tennis-rackets-shift-2023"),
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
      spec("EZONE 100+", 100, 300, "16×19", null, null, 27.5, "https://www.yonex.com/tennis/racquets/ez100p"),
      spec("EZONE 100L", 100, 285, "16×19", null, null, 27, "https://www.yonex.com/tennis/racquets/ez100l"),
      spec("EZONE 100SL", 100, 270, "16×19", null, null, 27, "https://www.yonex.com/tennis/racquets/ez100sl"),
      spec("EZONE 105", 105, 275, "16×19", null, null, 27, "https://www.yonex.com/tennis/racquets/ez105"),
      spec("EZONE 110", 110, 255, "16×18", null, null, 27.25, "https://www.yonex.com/tennis/racquets/ez110"),
      spec("EZONE 115", 115, 245, "16×17", null, null, 27.5, "https://www.yonex.com/tennis/racquets/ez115"),
    ],
  },
  {
    id: "yonex-astrel", brand: "Yonex", family: "ASTREL", type: "舒适", generation: "现行代", releaseYear: null,
    familyUrl: "https://www.yonex.com/tennis/racquets?series=astrel",
    summary: "以减震、轻松深度和大拍面容错为核心，面向休闲与舒适优先球员。",
    image: "/rackets/catalog/yonex-astrel.png",
    models: [
      spec("ASTREL 100", 100, 280, "16×18", 325, "25.5–27.5–24", 27, "https://www.yonex.com/tennis/racquets/03ast100"),
      spec("ASTREL 105", 105, null, null, null, null, null, "https://www.yonex.com/tennis/racquets/03ast105"),
      spec("ASTREL 120", 120, null, null, null, null, null, "https://www.yonex.com/tennis/racquets/03ast120"),
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
      spec("Pure Aero Team Gen9", 100, 285, "16×19", null, "23–26–23", 27, "https://www.babolat.com/us/tennis/collections/pure-aero.html"),
      spec("Pure Aero Lite Gen9", 100, 270, "16×19", 330, "23–26–23", 27, "https://www.babolat.com/us/pure-aero-lite-gen9-unstrung/101572.html"),
      spec("Pure Aero S Lite Gen9", 100, 255, "16×19", null, "23–26–23", 27, "https://www.babolat.com/us/pure-aero-s-lite-gen9-unstrung/101573.html"),
    ],
  },
  {
    id: "babolat-pure-drive-gen11", brand: "Babolat", family: "Pure Drive", type: "力量", generation: "Gen11", releaseYear: 2025,
    familyUrl: "https://www.babolat.com/us/tennis/collections/pure-drive.html",
    summary: "直接爆发力家族，覆盖 98 精准拍面、100 主力框与 107 高容错版本。",
    image: "/rackets/babolat-pure-drive-98.png", deepRacketId: "babolat-pure-drive-98",
    models: [
      spec("Pure Drive 98 Gen11", 98, 305, "16×20", 325, "21–23–22", 27, "https://www.babolat.com/us/pure-drive-98-gen11-unstrung/101551.html"),
      spec("Pure Drive Gen11", 100, 300, "16×19", 320, "23–26–23", 27, "https://www.babolat.com/us/pure-drive-gen11-unstrung/100-101552.html"),
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
      spec("Pure Strike 97 Gen4", 97, 310, "16×20", 310, "21–22–21", 27, "https://www.babolat.com/us/pure-strike-97-gen4-unstrung/3018-101574.html"),
      spec("Pure Strike 100 16×20 Gen4", 100, 305, "16×20", 310, "21–23–21", 27, "https://www.babolat.com/us/pure-strike-100-16-20-gen4-unstrung/101576.html"),
      spec("Pure Strike 98 16×19 Gen4", 98, 305, "16×19", 320, "21–23–21", 27, "https://www.babolat.com/us/pure-strike-16-19-gen4-unstrung/3018-101577.html"),
      spec("Pure Strike 98 18×20 Gen4", 98, 305, "18×20", 320, "21–23–21", 27, "https://www.babolat.com/us/pure-strike-18-20-gen4-unstrung/101578.html"),
      spec("Pure Strike 100 Gen4", 100, 300, "16×19", null, "21–23–21", 27, "https://www.babolat.com/us/pure-strike-100-gen4-unstrung/3324922081235.html"),
      spec("Pure Strike Team Gen4", 100, 285, "16×19", 325, "21–23–21", 27, "https://www.babolat.com/us/pure-strike-team-gen4-unstrung/101580.html"),
    ],
  },
  {
    id: "head-speed-2026", brand: "HEAD", family: "Speed", type: "全能", generation: "2026", releaseYear: 2026,
    familyUrl: "https://www.head.com/en_US/sports/tennis/speed-racquets",
    summary: "HEAD 的全能竞赛主线，在速度、力量和控制之间覆盖从 Pro 到 Team 的完整重量带。",
    image: "/rackets/head-speed-mp-2026.jpg", deepRacketId: "head-speed-mp-2026",
    models: [
      spec("Speed Pro", 100, 310, "18×20", null, null, 27, "https://www.head.com/en_US/product/speed-pro-2026-232006"),
      spec("Speed Tour", 97, 305, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/speed-racquets"),
      spec("Speed MP", 100, 300, "16×19", 320, 23, 27, "https://www.head.com/en_US/product/speed-mp-2026-232026"),
      spec("Speed MP L", 100, 285, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/speed-racquets"),
      spec("Speed MP UL", 100, 265, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/speed-racquets"),
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
      spec("Radical Pro", 98, 315, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/radical-racquets"),
      spec("Radical MP", 98, 300, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/radical-racquets"),
      spec("Radical Team", 102, 280, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/radical-racquets"),
    ],
  },
  {
    id: "head-boom-2026", brand: "HEAD", family: "Boom", type: "力量", generation: "2026", releaseYear: 2026,
    familyUrl: "https://www.head.com/en_US/sports/tennis/boom-racquets/",
    summary: "面向轻松力量与友好甜区的现代框体，从 98 Pro 到 107 Team。",
    image: "/rackets/catalog/head-boom-2026.webp",
    models: [
      spec("Boom Pro", 98, 310, "16×19", null, null, 27, "https://www.head.com/en_US/product/boom-pro-2026-232206"),
      spec("Boom MP", 100, 295, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/boom-racquets/"),
      spec("Boom MP L", 100, 275, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/boom-racquets/"),
      spec("Boom MP UL", 100, 255, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/boom-racquets/"),
      spec("Boom Team", 107, 260, "16×19", 340, 26, 27, "https://www.head.com/en_US/product/boom-team-2026-232246"),
    ],
  },
  {
    id: "head-extreme-2026", brand: "HEAD", family: "Extreme", type: "旋转", generation: "2026", releaseYear: 2026, status: "预告",
    familyUrl: "https://www.head.com/en_US/sports/tennis/extreme-racquets",
    summary: "旋转导向家族，2026 代覆盖 Pro、MP、多款轻量版和加长 MP XL。",
    image: "/rackets/catalog/head-extreme-2026.webp",
    models: [
      spec("Extreme Pro", 98, 305, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/extreme-racquets"),
      spec("Extreme MP", 100, 300, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/extreme-racquets"),
      spec("Extreme MP L", 100, 280, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/extreme-racquets"),
      spec("Extreme MP UL", 100, 260, "16×19", null, null, 27, "https://www.head.com/en_US/sports/tennis/extreme-racquets"),
      spec("Extreme Team", 105, 265, "16×19", null, null, 27, "https://www.head.com/en_US/product/extreme-team-2026-233346"),
      spec("Extreme MP XL", 100, 300, "16×19", null, null, null, "https://www.head.com/en_US/sports/tennis/extreme-racquets"),
    ],
    note: "核验时官网多数型号标记 Coming soon；已公开字段照录，未公开值不补猜。",
  },
  {
    id: "head-prestige-a2", brand: "HEAD", family: "Prestige", type: "控制", generation: "Auxetic 2.0", releaseYear: 2023,
    familyUrl: "https://www.head.com/en/sports/tennis/prestige-racquets",
    summary: "HEAD 经典薄框控制线，提供 95–99 拍面与不同线床密度的专业化选择。",
    image: "/rackets/catalog/head-prestige-auxetic-2.webp",
    models: [
      spec("Prestige Pro", 98, 320, "18×20", null, null, 27, "https://www.head.com/en/sports/tennis/prestige-racquets"),
      spec("Prestige Tour", 95, 315, "16×19", null, null, 27, "https://www.head.com/en/sports/tennis/prestige-racquets"),
      spec("Prestige MP", 99, 310, "18×19", null, null, 27, "https://www.head.com/en/sports/tennis/prestige-racquets"),
      spec("Prestige MP L", 99, 300, "16×19", null, null, 27, "https://www.head.com/en/sports/tennis/prestige-racquets"),
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
      spec("T-Fight 305S", 98, 305, "18×19", 315, "22.5–23–22.5", 27, "https://b2b.tecnifibre.com/en/p/14FI305S5.html"),
      spec("T-Fight 300S", 98, 300, "16×19", 320, "22.5–23–22.5", 27, "https://b2b.tecnifibre.com/en/p/14FI300S5.html"),
      spec("T-Fight 300", 100, 300, "16×19", 320, "23–23.5–23", 27, "https://b2b.tecnifibre.com/en/p/14FI300X5.html"),
      spec("T-Fight 285", 100, 285, "16×19", 320, "23–23.5–23", 27, "https://b2b.tecnifibre.com/en/p/14FI285X5.html"),
      spec("T-Fight 270", 100, 270, "16×19", 325, "23–23.5–23", 27, "https://b2b.tecnifibre.com/en/p/14FI270X5.html"),
      spec("T-Fight 255", 100, 255, "16×19", null, null, 27, "https://b2b.tecnifibre.com/en/p/14FI255X5.html"),
    ],
    note: "T-Fight 300S 官网商品名与 B2B 参数曾出现 300g / 298g 冲突，主展示采用型号命名的 300g。",
  },
  {
    id: "tecnifibre-tf40-v3", brand: "Tecnifibre", family: "TF-40", type: "控制", generation: "V3", releaseYear: null,
    familyUrl: "https://www.tecnifibre.com/en/collections/tf-40",
    summary: "98 拍面的纯控制家族，以 16×19 / 18×20 和 290–315g 组合细分挥拍需求。",
    image: "/rackets/catalog/tecnifibre-tf40-v3.jpg",
    models: [
      spec("TF-40 290 16M V3", 98, 290, "16×19", null, 21.7, 27, "https://www.tecnifibre.com/en/collections/tf-40"),
      spec("TF-40 305 16M V3", 98, 305, "16×19", 325, 21.7, 27, "https://www.tecnifibre.com/en/collections/tennis/products/tf-40-305-16m-v3"),
      spec("TF-40 305 18M V3", 98, 305, "18×20", 325, 21.7, 27, "https://www.tecnifibre.com/en/collections/tf-40"),
      spec("TF-40 315 16M V3", 98, 315, "16×19", 310, 21.7, 27, "https://www.tecnifibre.com/en/collections/tf-40"),
      spec("TF-40 315 18M V3", 98, 315, "18×20", 310, 21.7, 27, "https://www.tecnifibre.com/en/collections/tf-40"),
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
      spec("FIRE 260 OS", 110, 260, "16×19", 330, "24.5–25–24.5", 26.97, "https://b2b.tecnifibre.com/en/p/14FIR2606.html"),
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
      spec("Tempo 275 V2", null, 275, "16×19", null, null, null, "https://www.tecnifibre.com/en/collections/raquettes-tempo"),
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
];

export const catalogBrands = Array.from(new Set(catalogFamilies.map((family) => family.brand)));
export const catalogTypes: ("全部" | RacketFamilyType)[] = ["全部", "控制", "旋转", "力量", "全能", "舒适"];
export const catalogModelCount = catalogFamilies.reduce((total, family) => total + family.models.length, 0);
