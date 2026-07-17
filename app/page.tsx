"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  catalogBrands,
  catalogFamilies,
  catalogModelCount,
  catalogTypes,
  catalogVerifiedAt,
  type CatalogFamily,
  type RacketFamilyType,
} from "./catalog-data";
import { tourPlayers, tourRankAsOf, tourSources, type Tour, type TourPlayer } from "./tour-data";

type Stage = "入门" | "进阶" | "高阶";
type PlayStyle = "底线相持" | "上旋进攻" | "全场控制" | "抢点快攻" | "舒适护臂";
type ScoreKey = "control" | "power" | "spin" | "feel" | "forgiveness" | "agility";

type Racket = {
  id: string;
  brand: string;
  model: string;
  series: string;
  year: string;
  accent: string;
  weight: number;
  head: number;
  pattern: string;
  balance: string;
  beam: string;
  stages: Stage[];
  styles: PlayStyle[];
  summary: string;
  verdict: string;
  scores: Record<ScoreKey, number>;
  buyUrl: string;
  buyLabel: string;
};

const scoreLabels: Record<ScoreKey, string> = {
  control: "控制",
  power: "力量",
  spin: "旋转",
  feel: "手感",
  forgiveness: "容错",
  agility: "灵活",
};

const rackets: Racket[] = [
  {
    id: "wilson-pro-staff-97-v14",
    brand: "Wilson",
    model: "Pro Staff 97 V14",
    series: "精准系",
    year: "2023",
    accent: "#b87855",
    weight: 315,
    head: 97,
    pattern: "16 × 19",
    balance: "310 mm",
    beam: "21.5 mm",
    stages: ["高阶"],
    styles: ["全场控制", "抢点快攻"],
    summary: "小拍面与高静重，给完整挥拍最直接的落点反馈。",
    verdict: "适合技术成熟、主动制造拍头速度，并重视切削、网前与单反稳定性的球员。",
    scores: { control: 96, power: 72, spin: 76, feel: 94, forgiveness: 54, agility: 66 },
    buyUrl: "https://sg.wilson.com/products/pro-staff-97-v14-sesion-soiree-rg26",
    buyLabel: "Wilson 官网",
  },
  {
    id: "wilson-blade-98-v9",
    brand: "Wilson",
    model: "Blade 98 16×19 V9",
    series: "手感系",
    year: "2024",
    accent: "#55a978",
    weight: 305,
    head: 98,
    pattern: "16 × 19",
    balance: "320 mm",
    beam: "20.6 mm",
    stages: ["进阶", "高阶"],
    styles: ["底线相持", "全场控制"],
    summary: "柔和持球感与均衡控制，是现代控制拍的通用答案。",
    verdict: "适合挥拍完整、希望从底线组织到网前终结都保持清晰手感的球员。",
    scores: { control: 91, power: 74, spin: 81, feel: 93, forgiveness: 68, agility: 78 },
    buyUrl: "https://www.wilson.com/en-us/product/blade-98-16x19-v9-frm-wr14980",
    buyLabel: "Wilson 官网",
  },
  {
    id: "wilson-clash-100-v3",
    brand: "Wilson",
    model: "Clash 100 V3",
    series: "舒适系",
    year: "2025",
    accent: "#f05d4f",
    weight: 295,
    head: 100,
    pattern: "16 × 19",
    balance: "310 mm",
    beam: "24 mm",
    stages: ["入门", "进阶"],
    styles: ["底线相持", "舒适护臂"],
    summary: "柔韧框体与友好甜区，降低长时间击球的负担。",
    verdict: "适合正在建立动作、需要舒适度，或希望兼顾旋转与防守容错的球员。",
    scores: { control: 76, power: 81, spin: 80, feel: 84, forgiveness: 92, agility: 86 },
    buyUrl: "https://sg.wilson.com/products/wilson-clash-v3-100-performance-tennis-racket-unstrung-wr172811u",
    buyLabel: "Wilson 官网",
  },
  {
    id: "yonex-ezone-98",
    brand: "Yonex",
    model: "EZONE 98",
    series: "力量系",
    year: "8th Gen",
    accent: "#4c88ff",
    weight: 305,
    head: 98,
    pattern: "16 × 19",
    balance: "315 mm",
    beam: "23.8–24.5 mm",
    stages: ["进阶", "高阶"],
    styles: ["底线相持", "抢点快攻"],
    summary: "紧凑拍面配合宽甜区，力量输出直接而不失指向性。",
    verdict: "适合喜欢借力、抢上升点，并希望在 98 拍面上保留一定容错的球员。",
    scores: { control: 84, power: 91, spin: 82, feel: 84, forgiveness: 78, agility: 82 },
    buyUrl: "https://www.yonex.com/ezone",
    buyLabel: "Yonex 官网",
  },
  {
    id: "yonex-vcore-98",
    brand: "Yonex",
    model: "VCORE 98",
    series: "旋转系",
    year: "2026",
    accent: "#ef3f44",
    weight: 305,
    head: 98,
    pattern: "16 × 19",
    balance: "315 mm",
    beam: "23–21 mm",
    stages: ["进阶", "高阶"],
    styles: ["上旋进攻", "底线相持"],
    summary: "更快的拍头通过与开放线床，主打高弧线重上旋。",
    verdict: "适合用强烈上旋把对手推离底线，并依靠正拍持续施压的进攻型球员。",
    scores: { control: 82, power: 85, spin: 96, feel: 82, forgiveness: 75, agility: 86 },
    buyUrl: "https://www.yonex.com/vcore",
    buyLabel: "Yonex 官网",
  },
  {
    id: "yonex-percept-97",
    brand: "Yonex",
    model: "PERCEPT 97",
    series: "控制系",
    year: "2023",
    accent: "#76cfa4",
    weight: 310,
    head: 97,
    pattern: "16 × 19",
    balance: "310 mm",
    beam: "21 mm",
    stages: ["高阶"],
    styles: ["全场控制", "抢点快攻"],
    summary: "薄框、头轻与清晰形变，强调主动发力下的落点控制。",
    verdict: "适合脚步到位、挥拍速度充足，并希望精确控制线路与深度的高阶球员。",
    scores: { control: 95, power: 70, spin: 80, feel: 95, forgiveness: 61, agility: 80 },
    buyUrl: "https://us.yonex.com/products/percept-97",
    buyLabel: "Yonex 官网",
  },
  {
    id: "babolat-pure-aero-98",
    brand: "Babolat",
    model: "Pure Aero 98 Gen9",
    series: "旋转系",
    year: "Gen9",
    accent: "#f4df25",
    weight: 305,
    head: 98,
    pattern: "16 × 20",
    balance: "315 mm",
    beam: "21–23 mm",
    stages: ["进阶", "高阶"],
    styles: ["上旋进攻", "抢点快攻"],
    summary: "高旋转基因加密线床，把进攻弧线收进更精确的窗口。",
    verdict: "适合拍头速度快、喜欢重上旋，但又不想牺牲抢攻落点的进阶球员。",
    scores: { control: 87, power: 86, spin: 97, feel: 78, forgiveness: 67, agility: 84 },
    buyUrl: "https://www.babolat.com/us/pure-aero-98-gen9-unstrung/101567.html?dwvar_101567_COLOR_DESCRIPTION_ERP=100",
    buyLabel: "Babolat 官网",
  },
  {
    id: "babolat-pure-drive-98",
    brand: "Babolat",
    model: "Pure Drive 98 Gen11",
    series: "爆发系",
    year: "Gen11",
    accent: "#3d7fff",
    weight: 305,
    head: 98,
    pattern: "16 × 20",
    balance: "325 mm",
    beam: "21–23 mm",
    stages: ["进阶", "高阶"],
    styles: ["抢点快攻", "底线相持"],
    summary: "集中式力量输出，适合提早击球与连续压迫。",
    verdict: "适合喜欢站在底线内、用短准备抢点，把速度和深度直接转成制胜分的球员。",
    scores: { control: 84, power: 95, spin: 84, feel: 76, forgiveness: 69, agility: 79 },
    buyUrl: "https://www.babolat.com/us/pure-drive-98-gen11-unstrung/100-101551.html",
    buyLabel: "Babolat 官网",
  },
  {
    id: "babolat-pure-strike-98",
    brand: "Babolat",
    model: "Pure Strike 98 16×19",
    series: "攻击系",
    year: "Gen4",
    accent: "#ff624a",
    weight: 305,
    head: 98,
    pattern: "16 × 19",
    balance: "320 mm",
    beam: "21–23 mm",
    stages: ["进阶", "高阶"],
    styles: ["全场控制", "抢点快攻"],
    summary: "刚柔平衡的攻击型控制拍，长挥拍下线路稳定。",
    verdict: "适合主动发力、持续改变方向，并用平击或前冲球主导回合的球员。",
    scores: { control: 91, power: 83, spin: 82, feel: 86, forgiveness: 65, agility: 78 },
    buyUrl: "https://www.babolat.com/us/pure-strike-16-19-gen4-unstrung/101577.html",
    buyLabel: "Babolat 官网",
  },
  {
    id: "head-speed-mp-2026",
    brand: "HEAD",
    model: "Speed MP 2026",
    series: "全能系",
    year: "2026",
    accent: "#d9e5ef",
    weight: 300,
    head: 100,
    pattern: "16 × 19",
    balance: "320 mm",
    beam: "23 mm",
    stages: ["进阶", "高阶"],
    styles: ["底线相持", "全场控制"],
    summary: "100 拍面的全能模板，速度、控制和甜区相对均衡。",
    verdict: "适合还不想被单一风格定义、希望底线与网前都能从容切换的进阶球员。",
    scores: { control: 87, power: 86, spin: 85, feel: 86, forgiveness: 83, agility: 85 },
    buyUrl: "https://www.head.com/en_US/product/speed-mp-2026-232026",
    buyLabel: "HEAD 官网",
  },
  {
    id: "head-gravity-mp-2025",
    brand: "HEAD",
    model: "Gravity MP 2025",
    series: "甜区系",
    year: "2025",
    accent: "#4f7cff",
    weight: 295,
    head: 100,
    pattern: "16 × 20",
    balance: "325 mm",
    beam: "22 mm",
    stages: ["进阶", "高阶"],
    styles: ["底线相持", "全场控制"],
    summary: "延伸到拍头的宽甜区，兼顾持球感与防守容错。",
    verdict: "适合双反底线球员，尤其是依赖大范围覆盖、借助甜区稳定回深的打法。",
    scores: { control: 89, power: 78, spin: 82, feel: 92, forgiveness: 88, agility: 78 },
    buyUrl: "https://www.head.com/en_US/product/gravity-mp-2025-231125",
    buyLabel: "HEAD 官网",
  },
  {
    id: "head-radical-mp-2025",
    brand: "HEAD",
    model: "Radical MP 2025",
    series: "全场系",
    year: "2025",
    accent: "#ff5c28",
    weight: 300,
    head: 98,
    pattern: "16 × 19",
    balance: "320 mm",
    beam: "20–23 mm",
    stages: ["进阶", "高阶"],
    styles: ["全场控制", "抢点快攻"],
    summary: "快速、直接的全场框架，攻守切换很少拖泥带水。",
    verdict: "适合脚步积极、善于改变节奏，并频繁从底线向前压迫的全场型球员。",
    scores: { control: 90, power: 82, spin: 83, feel: 86, forgiveness: 70, agility: 88 },
    buyUrl: "https://www.head.com/en_US/product/radical-mp-2025-231015",
    buyLabel: "HEAD 官网",
  },
  {
    id: "head-boom-mp-2024",
    brand: "HEAD",
    model: "Boom MP 2024",
    series: "易打系",
    year: "2024",
    accent: "#62d4bc",
    weight: 295,
    head: 100,
    pattern: "16 × 19",
    balance: "315 mm",
    beam: "24 mm",
    stages: ["入门", "进阶"],
    styles: ["底线相持", "舒适护臂"],
    summary: "轻快拍头与轻松深度，让动作成长阶段更容易打出质量。",
    verdict: "适合从入门向进阶过渡、需要省力深度，又不想使用超大拍面的球员。",
    scores: { control: 77, power: 90, spin: 84, feel: 82, forgiveness: 89, agility: 91 },
    buyUrl: "https://www.head.com/en_US/shop-tennis/racquets/",
    buyLabel: "HEAD 官网",
  },
  {
    id: "tecnifibre-tfight-305s",
    brand: "Tecnifibre",
    model: "T-FIGHT 305S",
    series: "竞赛系",
    year: "2025",
    accent: "#f2f2f0",
    weight: 305,
    head: 98,
    pattern: "18 × 19",
    balance: "325 mm",
    beam: "22.5 mm",
    stages: ["高阶"],
    styles: ["抢点快攻", "全场控制"],
    summary: "18×19 线床提供更密集的指向性，适合现代快节奏攻防。",
    verdict: "适合击球点稳定、喜欢借对手来球提速，并用平直线路压缩反应时间的球员。",
    scores: { control: 94, power: 84, spin: 79, feel: 88, forgiveness: 62, agility: 80 },
    buyUrl: "https://www.tecnifibre.com/en/collections/raquettes-t-fight/products/t-fight-305s",
    buyLabel: "Tecnifibre 官网",
  },
  {
    id: "dunlop-cx-200",
    brand: "Dunlop",
    model: "CX 200",
    series: "经典系",
    year: "2024",
    accent: "#d93d35",
    weight: 305,
    head: 98,
    pattern: "16 × 19",
    balance: "315 mm",
    beam: "21.5 mm",
    stages: ["进阶", "高阶"],
    styles: ["全场控制", "底线相持"],
    summary: "薄框、头轻与柔和反馈，保留传统控制拍的纯粹感。",
    verdict: "适合自己创造力量，重视长线稳定、切削与网前触感的传统型进阶球员。",
    scores: { control: 92, power: 75, spin: 82, feel: 92, forgiveness: 67, agility: 84 },
    buyUrl: "https://us.dunlopsports.com/dunlop/tennis/rackets/cx-series/cx-200-tennis-racket/CX200-24.html",
    buyLabel: "Dunlop 官网",
  },
  {
    id: "volkl-vostra-v1-mp",
    brand: "Völkl",
    model: "VÖSTRA V1 MP",
    series: "护臂系",
    year: "2024",
    accent: "#dfff33",
    weight: 285,
    head: 102,
    pattern: "16 × 19",
    balance: "325 mm",
    beam: "25–28 mm",
    stages: ["入门", "进阶"],
    styles: ["舒适护臂", "底线相持"],
    summary: "更大拍面、轻量框体与减震结构，把舒适放在第一位。",
    verdict: "适合挥拍速度中等、容易疲劳，或希望在手臂友好前提下获得稳定深度的球员。",
    scores: { control: 74, power: 88, spin: 79, feel: 86, forgiveness: 96, agility: 92 },
    buyUrl: "https://www.volkltennis.com/products/vostra-v1-mp",
    buyLabel: "Völkl 官网",
  },
];

const brandOptions = ["全部", ...Array.from(new Set(rackets.map((racket) => racket.brand)))];
const stageOptions = ["全部", "入门", "进阶", "高阶"] as const;
const styleOptions = ["全部", "底线相持", "上旋进攻", "全场控制", "抢点快攻", "舒适护臂"] as const;

const racketImages: Record<string, string> = {
  "wilson-pro-staff-97-v14": "/rackets/wilson-pro-staff-97-v14.webp",
  "wilson-blade-98-v9": "/rackets/wilson-blade-98-v9.webp",
  "wilson-clash-100-v3": "/rackets/wilson-clash-100-v3.jpg",
  "yonex-ezone-98": "/rackets/yonex-ezone-98.webp",
  "yonex-vcore-98": "/rackets/yonex-vcore-98.webp",
  "yonex-percept-97": "/rackets/yonex-percept-97.webp",
  "babolat-pure-aero-98": "/rackets/babolat-pure-aero-98.png",
  "babolat-pure-drive-98": "/rackets/babolat-pure-drive-98.png",
  "babolat-pure-strike-98": "/rackets/babolat-pure-strike-98.png",
  "head-speed-mp-2026": "/rackets/head-speed-mp-2026.jpg",
  "head-gravity-mp-2025": "/rackets/head-gravity-mp-2025.jpg",
  "head-radical-mp-2025": "/rackets/head-radical-mp-2025.jpg",
  "head-boom-mp-2024": "/rackets/head-boom-mp-2024.png",
  "tecnifibre-tfight-305s": "/rackets/tecnifibre-tfight-305s.webp",
  "dunlop-cx-200": "/rackets/dunlop-cx-200.webp",
  "volkl-vostra-v1-mp": "/rackets/volkl-vostra-v1-mp.webp",
};

const radarKeys: ScoreKey[] = ["control", "power", "spin", "agility", "forgiveness", "feel"];
const radarSeries = ["var(--acid)", "var(--copper)", "var(--sky)"];
const radarDash = ["none", "10 5", "2 5"];

function RacketPhoto({
  racket,
  variant = "compact",
}: {
  racket: Racket;
  variant?: "hero" | "compact" | "detail" | "thumb";
}) {
  return (
    <div
      className={`racket-photo racket-photo--${variant}`}
      style={{ "--racket-accent": racket.accent } as CSSProperties}
    >
      <img
        src={racketImages[racket.id]}
        alt={`${racket.brand} ${racket.model} 球拍实物图`}
        loading={variant === "hero" ? "eager" : "lazy"}
      />
      {variant !== "thumb" && <span>PRODUCT / {racket.year}</span>}
    </div>
  );
}

function radarPoint(index: number, value: number, radius = 104) {
  const angle = ((index * 60) - 90) * (Math.PI / 180);
  const distance = radius * (value / 100);
  return [180 + (Math.cos(angle) * distance), 155 + (Math.sin(angle) * distance)];
}

function RadarChart({ chartRackets, compact = false }: { chartRackets: Racket[]; compact?: boolean }) {
  const gridLevels = [20, 40, 60, 80, 100];
  const summary = chartRackets
    .map((racket) => `${racket.brand} ${racket.model}：${radarKeys.map((key) => `${scoreLabels[key]} ${racket.scores[key]}`).join("，")}`)
    .join("；");

  return (
    <figure className={`radar-chart${compact ? " radar-chart--compact" : ""}`}>
      <svg viewBox="0 0 360 314" role="img">
        <title>{chartRackets.length > 1 ? "球拍六维属性重叠对比雷达图" : `${chartRackets[0].model} 六维属性雷达图`}</title>
        <desc>{summary}。各维度满分 100 分，用于拍库内部横向比较。</desc>

        <g className="radar-chart__structure" aria-hidden="true">
          {gridLevels.map((level) => (
            <polygon
              key={level}
              points={radarKeys.map((_, index) => radarPoint(index, level).join(",")).join(" ")}
              className={level === 100 ? "radar-chart__grid radar-chart__grid--outer" : "radar-chart__grid"}
            />
          ))}
          {radarKeys.map((key, index) => {
            const [x, y] = radarPoint(index, 100);
            return <line key={key} x1="180" y1="155" x2={x} y2={y} className="radar-chart__axis" />;
          })}
        </g>

        {chartRackets.map((racket, seriesIndex) => (
          <g
            className="radar-chart__series"
            key={racket.id}
            style={{ "--series-color": radarSeries[seriesIndex % radarSeries.length] } as CSSProperties}
          >
            <polygon
              points={radarKeys.map((key, index) => radarPoint(index, racket.scores[key]).join(",")).join(" ")}
              className="radar-chart__shape"
              strokeDasharray={radarDash[seriesIndex % radarDash.length]}
            />
            {radarKeys.map((key, index) => {
              const [x, y] = radarPoint(index, racket.scores[key]);
              return <circle key={key} cx={x} cy={y} r={seriesIndex === 0 ? 3.5 : 3} className="radar-chart__point" />;
            })}
          </g>
        ))}

        <g className="radar-chart__labels" aria-hidden="true">
          {radarKeys.map((key, index) => {
            const [x, y] = radarPoint(index, 100, 132);
            const textAnchor = Math.abs(x - 180) < 10 ? "middle" : x > 180 ? "start" : "end";
            const singleValue = chartRackets.length === 1 && !compact ? chartRackets[0].scores[key] : null;
            return (
              <text key={key} x={x} y={y} textAnchor={textAnchor} className="radar-chart__label">
                <tspan x={x}>{scoreLabels[key]}</tspan>
                {singleValue !== null && <tspan x={x} dy="15" className="radar-chart__label-value">{singleValue}</tspan>}
              </text>
            );
          })}
        </g>
      </svg>

      {chartRackets.length > 1 && (
        <figcaption className="radar-legend" aria-label="雷达图图例">
          {chartRackets.map((racket, index) => (
            <span key={racket.id} style={{ "--series-color": radarSeries[index % radarSeries.length] } as CSSProperties}>
              <i style={{ borderTopStyle: index === 0 ? "solid" : "dashed" }} />
              <b>{racket.brand}</b> {racket.model}
            </span>
          ))}
        </figcaption>
      )}
      <p className="radar-chart__note">拍库相对评分 / 满分 100</p>
    </figure>
  );
}

function recommendationScore(racket: Racket, stage: Stage, style: PlayStyle, priority: string) {
  let score = 34;
  if (racket.stages.includes(stage)) score += 25;
  if (racket.styles.includes(style)) score += 27;
  const keyMap: Record<string, ScoreKey> = {
    力量: "power",
    旋转: "spin",
    控制: "control",
    手感: "feel",
    护臂: "forgiveness",
  };
  if (priority === "均衡") {
    const values = Object.values(racket.scores);
    score += values.reduce((sum, value) => sum + value, 0) / values.length / 7;
  } else {
    score += racket.scores[keyMap[priority]] / 7;
  }
  return Math.min(98, Math.round(score));
}

// Kept as a reference for the original editorial layout while the app shell evolves.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyHome() {
  const [brand, setBrand] = useState("全部");
  const [stageFilter, setStageFilter] = useState<(typeof stageOptions)[number]>("全部");
  const [styleFilter, setStyleFilter] = useState<(typeof styleOptions)[number]>("全部");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("推荐排序");
  const [matchStage, setMatchStage] = useState<Stage>("进阶");
  const [matchStyle, setMatchStyle] = useState<PlayStyle>("底线相持");
  const [priority, setPriority] = useState("均衡");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const recommendations = useMemo(
    () => rackets
      .map((racket) => ({ racket, match: recommendationScore(racket, matchStage, matchStyle, priority) }))
      .sort((a, b) => b.match - a.match)
      .slice(0, 3),
    [matchStage, matchStyle, priority],
  );

  const filteredRackets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = rackets.filter((racket) => {
      const matchesBrand = brand === "全部" || racket.brand === brand;
      const matchesStage = stageFilter === "全部" || racket.stages.includes(stageFilter as Stage);
      const matchesStyle = styleFilter === "全部" || racket.styles.includes(styleFilter as PlayStyle);
      const matchesSearch = !term || `${racket.brand} ${racket.model} ${racket.series}`.toLowerCase().includes(term);
      return matchesBrand && matchesStage && matchesStyle && matchesSearch;
    });
    return [...result].sort((a, b) => {
      if (sort === "重量从轻到重") return a.weight - b.weight;
      if (sort === "控制优先") return b.scores.control - a.scores.control;
      if (sort === "力量优先") return b.scores.power - a.scores.power;
      if (sort === "容错优先") return b.scores.forgiveness - a.scores.forgiveness;
      return rackets.indexOf(a) - rackets.indexOf(b);
    });
  }, [brand, stageFilter, styleFilter, search, sort]);

  const selected = selectedId ? rackets.find((racket) => racket.id === selectedId) ?? null : null;
  const compared = compareIds.map((id) => rackets.find((racket) => racket.id === id)).filter(Boolean) as Racket[];

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const resetFilters = () => {
    setBrand("全部");
    setStageFilter("全部");
    setStyleFilter("全部");
    setSearch("");
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="拍库首页">
          <span className="brand-mark">拍</span>
          <span><b>拍库</b><small>RACKET ARSENAL</small></span>
        </a>
        <nav aria-label="主导航">
          <a href="#matcher">打法匹配</a>
          <a href="#armory">球拍库</a>
          <a href="#compare">对比台</a>
        </nav>
        <a className="header-cta" href="#armory">浏览武器库 <span aria-hidden="true">↓</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span>VOL. 01</span> / 球拍选择系统</p>
          <h1>找到和你打法<br />同频的下一把<span>武器</span></h1>
          <p className="hero-lede">从规格走向打法：用阶段、风格与六维属性拆解球拍，让每一次选择都能说明理由。</p>
          <div className="hero-actions">
            <button className="button button--primary" onClick={() => document.getElementById("matcher")?.scrollIntoView({ behavior: "smooth" })}>开始打法匹配 <span aria-hidden="true">↘</span></button>
            <a className="button button--ghost" href="#armory">直接浏览球拍</a>
          </div>
          <dl className="hero-stats">
            <div><dt>{rackets.length}</dt><dd>款代表球拍</dd></div>
            <div><dt>{brandOptions.length - 1}</dt><dd>大品牌</dd></div>
            <div><dt>06</dt><dd>维属性档案</dd></div>
          </dl>
        </div>

        <article className="hero-dossier">
          <div className="dossier-topline"><span>FEATURED / 001</span><b>高阶 · 全场控制</b></div>
          <RacketPhoto racket={rackets[0]} variant="hero" />
          <div className="dossier-title">
            <p>{rackets[0].brand} / {rackets[0].series}</p>
            <h2>{rackets[0].model}</h2>
          </div>
          <div className="spec-strip">
            <div><b>{rackets[0].weight}</b><span>g / 裸拍</span></div>
            <div><b>{rackets[0].head}</b><span>in² / 拍面</span></div>
            <div><b>{rackets[0].pattern}</b><span>线床</span></div>
          </div>
          <RadarChart chartRackets={[rackets[0]]} compact />
          <button className="text-link" onClick={() => setSelectedId(rackets[0].id)}>打开完整档案 <span aria-hidden="true">↗</span></button>
        </article>
      </section>

      <section className="ticker" aria-label="核心能力">
        <div><span>CONTROL</span><i /> <span>POWER</span><i /> <span>SPIN</span><i /> <span>FEEL</span><i /> <span>FORGIVENESS</span><i /> <span>AGILITY</span></div>
      </section>

      <section className="matcher section-shell" id="matcher">
        <div className="section-heading">
          <div><p className="eyebrow"><span>01</span> / 打法匹配器</p><h2>先定义你，再推荐拍</h2></div>
          <p>三个选择生成即时匹配度。它不是水平考试，而是帮你看清“现在最需要什么”。</p>
        </div>

        <div className="matcher-grid">
          <div className="matcher-controls">
            <fieldset>
              <legend><b>01</b><span>你的打球阶段</span></legend>
              <div className="segmented">
                {(["入门", "进阶", "高阶"] as Stage[]).map((item) => <button key={item} aria-pressed={matchStage === item} onClick={() => setMatchStage(item)}>{item}</button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend><b>02</b><span>最接近的打法</span></legend>
              <div className="choice-grid">
                {styleOptions.slice(1).map((item) => <button key={item} aria-pressed={matchStyle === item} onClick={() => setMatchStyle(item as PlayStyle)}>{item}</button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend><b>03</b><span>最想优先获得</span></legend>
              <div className="choice-grid choice-grid--compact">
                {["均衡", "力量", "旋转", "控制", "手感", "护臂"].map((item) => <button key={item} aria-pressed={priority === item} onClick={() => setPriority(item)}>{item}</button>)}
              </div>
            </fieldset>
          </div>

          <div className="match-results" aria-live="polite">
            <div className="results-header"><p>推荐序列</p><span>{matchStage} / {matchStyle} / {priority}</span></div>
            {recommendations.map(({ racket, match }, index) => (
              <article className="match-card" key={racket.id}>
                <div className="match-rank">0{index + 1}</div>
                <div className="match-main">
                  <div><span>{racket.brand}</span><h3>{racket.model}</h3></div>
                  <p>{racket.summary}</p>
                  <div className="tag-row">{racket.styles.map((item) => <span key={item}>{item}</span>)}</div>
                </div>
                <div className="match-score"><strong>{match}<small>%</small></strong><span>匹配度</span></div>
                <button aria-label={`查看 ${racket.model} 详情`} onClick={() => setSelectedId(racket.id)}>↗</button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="armory section-shell" id="armory">
        <div className="section-heading section-heading--armory">
          <div><p className="eyebrow"><span>02</span> / 球拍武器库</p><h2>按你的方式拆解球拍</h2></div>
          <p>每款均提供品牌官网入口；外部页面的型号、库存与最终规格以品牌页面为准。</p>
        </div>

        <div className="filter-panel">
          <div className="search-field">
            <label htmlFor="racket-search">搜索型号</label>
            <div><span aria-hidden="true">⌕</span><input id="racket-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="例如：EZONE 98" /></div>
          </div>
          <div className="filter-group"><span>品牌</span><div>{brandOptions.map((item) => <button key={item} aria-pressed={brand === item} onClick={() => setBrand(item)}>{item}</button>)}</div></div>
          <div className="filter-group"><span>阶段</span><div>{stageOptions.map((item) => <button key={item} aria-pressed={stageFilter === item} onClick={() => setStageFilter(item)}>{item}</button>)}</div></div>
          <div className="filter-group"><span>风格</span><div>{styleOptions.map((item) => <button key={item} aria-pressed={styleFilter === item} onClick={() => setStyleFilter(item)}>{item}</button>)}</div></div>
        </div>

        <div className="armory-toolbar">
          <p>找到 <b>{filteredRackets.length}</b> 款球拍</p>
          <div>
            {(brand !== "全部" || stageFilter !== "全部" || styleFilter !== "全部" || search) && <button className="reset-button" onClick={resetFilters}>清除筛选</button>}
            <label htmlFor="sort">排序</label>
            <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option>推荐排序</option><option>重量从轻到重</option><option>控制优先</option><option>力量优先</option><option>容错优先</option>
            </select>
          </div>
        </div>

        {filteredRackets.length > 0 ? (
          <div className="racket-grid">
            {filteredRackets.map((racket) => {
              const isCompared = compareIds.includes(racket.id);
              const compareFull = compareIds.length >= 3 && !isCompared;
              return (
                <article className="racket-card" key={racket.id} style={{ "--racket-accent": racket.accent } as CSSProperties}>
                  <div className="card-index">AR–{String(rackets.indexOf(racket) + 1).padStart(3, "0")} <span>{racket.year}</span></div>
                  <RacketPhoto racket={racket} variant="compact" />
                  <div className="card-brand">{racket.brand} / {racket.series}</div>
                  <h3>{racket.model}</h3>
                  <p>{racket.summary}</p>
                  <div className="mini-specs"><span><b>{racket.weight}</b> g</span><span><b>{racket.head}</b> in²</span><span><b>{racket.pattern}</b></span></div>
                  <div className="card-scoreline">
                    {(["control", "power", "spin"] as ScoreKey[]).map((key) => <div key={key}><span>{scoreLabels[key]}</span><i><b style={{ width: `${racket.scores[key]}%` }} /></i><strong>{racket.scores[key]}</strong></div>)}
                  </div>
                  <div className="tag-row">{racket.stages.map((item) => <span key={item}>{item}</span>)}<span>{racket.styles[0]}</span></div>
                  <div className="card-actions">
                    <button onClick={() => setSelectedId(racket.id)}>查看详情</button>
                    <a href={racket.buyUrl} target="_blank" rel="noreferrer">官网购买 <span aria-hidden="true">↗</span></a>
                  </div>
                  <button className="compare-toggle" aria-pressed={isCompared} disabled={compareFull} onClick={() => toggleCompare(racket.id)}>{isCompared ? "已加入对比" : compareFull ? "最多对比 3 款" : "+ 加入对比"}</button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state"><span>0 / {rackets.length}</span><h3>当前组合没有匹配球拍</h3><p>放宽一个阶段或打法条件，通常会看到更实用的交集。</p><button className="button button--primary" onClick={resetFilters}>重置筛选</button></div>
        )}
      </section>

      <section className="compare-section section-shell" id="compare">
        <div className="section-heading">
          <div><p className="eyebrow"><span>03</span> / 对比台</p><h2>把差异摆到同一条基线上</h2></div>
          <p>最多加入三款。属性评分用于同库相对比较，不等同于品牌实验室测量。</p>
        </div>

        {compared.length === 0 ? (
          <div className="compare-empty"><div className="compare-crosshair" aria-hidden="true">＋</div><div><h3>对比位等待装载</h3><p>从球拍卡片点击“加入对比”，规格与六维属性会自动对齐。</p></div><a href="#armory">返回球拍库 ↑</a></div>
        ) : (
          <div className="compare-loaded">
            <div className="compare-radar-panel">
              <div className="compare-radar-copy">
                <p className="eyebrow">OVERLAY / 6 AXES</p>
                <h3>六维属性重叠雷达</h3>
                <p>同一刻度上查看轮廓差异：实线、长虚线与点线分别对应三把球拍，不只依赖颜色识别。</p>
              </div>
              <RadarChart chartRackets={compared} />
            </div>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead><tr><th>对比维度</th>{compared.map((racket) => <th key={racket.id}><RacketPhoto racket={racket} variant="thumb" /><span>{racket.brand}</span>{racket.model}<button onClick={() => toggleCompare(racket.id)} aria-label={`移除 ${racket.model}`}>×</button></th>)}</tr></thead>
                <tbody>
                  <tr><th>阶段</th>{compared.map((racket) => <td key={racket.id}>{racket.stages.join(" / ")}</td>)}</tr>
                  <tr><th>适合风格</th>{compared.map((racket) => <td key={racket.id}>{racket.styles.join(" / ")}</td>)}</tr>
                  <tr><th>裸拍重量</th>{compared.map((racket) => <td key={racket.id}><b>{racket.weight}</b> g</td>)}</tr>
                  <tr><th>拍面</th>{compared.map((racket) => <td key={racket.id}><b>{racket.head}</b> in²</td>)}</tr>
                  <tr><th>线床</th>{compared.map((racket) => <td key={racket.id}>{racket.pattern}</td>)}</tr>
                  {(Object.keys(scoreLabels) as ScoreKey[]).map((key) => <tr key={key}><th>{scoreLabels[key]}</th>{compared.map((racket) => <td key={racket.id}><div className="table-score"><i><b style={{ width: `${racket.scores[key]}%` }} /></i><span>{racket.scores[key]}</span></div></td>)}</tr>)}
                  <tr><th>购买</th>{compared.map((racket) => <td key={racket.id}><a href={racket.buyUrl} target="_blank" rel="noreferrer">前往 {racket.buyLabel} ↗</a></td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-mark">拍</span><div><b>拍库</b><small>RACKET ARSENAL / 2026</small></div></div>
        <p>选拍不是找“最强”，而是找与你的动作、阶段和目标最合拍的那一把。</p>
        <div><a href="#matcher">打法匹配</a><a href="#armory">球拍库</a><a href="#top">回到顶部 ↑</a></div>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedId(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedId(null)} aria-label="关闭详情">×</button>
            <div className="detail-visual" style={{ "--racket-accent": selected.accent } as CSSProperties}>
              <div className="dossier-topline"><span>FULL DOSSIER</span><b>{selected.year}</b></div>
              <RacketPhoto racket={selected} variant="detail" />
              <span className="detail-watermark">{selected.brand}</span>
            </div>
            <div className="detail-content">
              <p className="eyebrow">{selected.brand} / {selected.series}</p>
              <h2 id="detail-title">{selected.model}</h2>
              <p className="detail-verdict">{selected.verdict}</p>
              <div className="detail-tags"><span>{selected.stages.join(" · ")}</span>{selected.styles.map((item) => <span key={item}>{item}</span>)}</div>
              <dl className="detail-specs">
                <div><dt>裸拍重量</dt><dd>{selected.weight} g</dd></div>
                <div><dt>拍面</dt><dd>{selected.head} in²</dd></div>
                <div><dt>线床</dt><dd>{selected.pattern}</dd></div>
                <div><dt>平衡点</dt><dd>{selected.balance}</dd></div>
                <div><dt>框厚</dt><dd>{selected.beam}</dd></div>
                <div><dt>阶段</dt><dd>{selected.stages.join(" / ")}</dd></div>
              </dl>
              <h3>六维属性</h3>
              <RadarChart chartRackets={[selected]} />
              <p className="score-note">属性分为拍库内部的相对定位，用于横向比较；最终手感会受到穿线、磅数与个体动作影响。</p>
              <div className="detail-actions">
                <button className="button button--ghost" onClick={() => toggleCompare(selected.id)}>{compareIds.includes(selected.id) ? "移出对比" : compareIds.length >= 3 ? "对比位已满" : "+ 加入对比"}</button>
                <a className="button button--primary" href={selected.buyUrl} target="_blank" rel="noreferrer">前往 {selected.buyLabel} <span aria-hidden="true">↗</span></a>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

type AppView = "discover" | "match" | "armory" | "tour" | "compare";

const appTabs: { id: AppView; label: string; icon: string }[] = [
  { id: "discover", label: "发现", icon: "◉" },
  { id: "match", label: "匹配", icon: "◇" },
  { id: "armory", label: "球拍库", icon: "▦" },
  { id: "tour", label: "球星", icon: "★" },
  { id: "compare", label: "对比", icon: "⇄" },
];

const coreScoreKeys: ScoreKey[] = ["control", "power", "spin"];

function AppRacketCard({
  racket,
  compared,
  onOpen,
  onToggleCompare,
}: {
  racket: Racket;
  compared: boolean;
  onOpen: () => void;
  onToggleCompare: () => void;
}) {
  return (
    <article className="app-racket-card" style={{ "--racket-accent": racket.accent } as CSSProperties}>
      <button className="app-racket-card__preview" onClick={onOpen} aria-label={`查看 ${racket.brand} ${racket.model} 详情`}>
        <RacketPhoto racket={racket} variant="compact" />
      </button>
      <div className="app-racket-card__body">
        <div className="app-racket-card__meta"><span>{racket.brand}</span><span>{racket.year}</span></div>
        <button className="app-racket-card__title" onClick={onOpen}><h3>{racket.model}</h3></button>
        <p>{racket.summary}</p>
        <div className="app-racket-card__specs" aria-label="核心规格">
          <span><b>{racket.weight}</b> g</span>
          <span><b>{racket.head}</b> in²</span>
          <span><b>{racket.pattern}</b></span>
        </div>
        <div className="app-racket-card__scores" aria-label="核心属性">
          {coreScoreKeys.map((key) => (
            <span key={key}><i style={{ height: `${racket.scores[key]}%` }} /><b>{scoreLabels[key]}</b><small>{racket.scores[key]}</small></span>
          ))}
        </div>
        <div className="app-racket-card__actions">
          <button className="app-button app-button--soft" onClick={onToggleCompare} aria-pressed={compared}>
            <span aria-hidden="true">{compared ? "✓" : "+"}</span>{compared ? "已加入对比" : "加入对比"}
          </button>
          <button className="app-button app-button--plain" onClick={onOpen}>查看详情 <span aria-hidden="true">›</span></button>
        </div>
      </div>
    </article>
  );
}

function RecommendationRow({
  racket,
  match,
  onOpen,
  onToggleCompare,
  compared,
}: {
  racket: Racket;
  match: number;
  onOpen: () => void;
  onToggleCompare: () => void;
  compared: boolean;
}) {
  return (
    <article className="recommendation-row">
      <button className="recommendation-row__main" onClick={onOpen}>
        <RacketPhoto racket={racket} variant="thumb" />
        <span className="recommendation-row__copy">
          <small>{racket.brand} · {racket.series}</small>
          <strong>{racket.model}</strong>
          <span>{racket.styles.join(" · ")}</span>
        </span>
        <span className="recommendation-row__match"><b>{match}%</b><small>匹配</small></span>
        <span className="recommendation-row__chevron" aria-hidden="true">›</span>
      </button>
      <button className="recommendation-row__compare" onClick={onToggleCompare} aria-pressed={compared} aria-label={`${compared ? "移出" : "加入"} ${racket.model} 对比`}>
        {compared ? "✓" : "+"}
      </button>
    </article>
  );
}

function ViewTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <header className="view-title">
      <div><p>{eyebrow}</p><h1>{title}</h1></div>
      {action}
    </header>
  );
}

const familyTypeAccent: Record<RacketFamilyType, string> = {
  控制: "#6c6df0",
  旋转: "#ef5b45",
  力量: "#1878e8",
  全能: "#2e9b72",
  舒适: "#a96a31",
};

const familyGalleries: Record<string, string[]> = {
  "wilson-blade-v10": [
    "/rackets/gallery/wilson-blade-v10-02.png",
    "/rackets/gallery/wilson-blade-v10-03.jpg",
    "/rackets/gallery/wilson-blade-v10-04.jpg",
  ],
  "yonex-ezone-8": [
    "/rackets/gallery/yonex-ezone-98-01.jpg",
    "/rackets/gallery/yonex-ezone-98-02.jpg",
    "/rackets/gallery/yonex-ezone-98-03.jpg",
    "/rackets/gallery/yonex-ezone-98-04.jpg",
  ],
  "babolat-pure-aero-gen9": [
    "/rackets/gallery/babolat-pure-aero-98-gen9-01.png",
    "/rackets/gallery/babolat-pure-aero-98-gen9-02.png",
    "/rackets/gallery/babolat-pure-aero-98-gen9-03.png",
    "/rackets/gallery/babolat-pure-aero-98-gen9-04.png",
  ],
  "head-speed-2026": Array.from({ length: 10 }, (_, index) => `/rackets/gallery/head-speed-${String(index + 1).padStart(2, "0")}.webp`),
};

const racketGalleries: Record<string, string[]> = {
  "yonex-ezone-98": familyGalleries["yonex-ezone-8"],
  "babolat-pure-aero-98": familyGalleries["babolat-pure-aero-gen9"],
  "head-speed-mp-2026": familyGalleries["head-speed-2026"],
};

function familyReleaseLabel(family: CatalogFamily) {
  if (family.releaseDate) return family.releaseDate;
  if (family.releaseYear) return String(family.releaseYear);
  return "官网未注明";
}

function ProductGallery({ images, alt, accent }: { images: string[]; alt: string; accent: string }) {
  const [frame, setFrame] = useState(0);
  const safeFrame = Math.min(frame, Math.max(images.length - 1, 0));

  if (images.length === 0) {
    return (
      <div className="product-gallery product-gallery--empty" style={{ "--gallery-accent": accent } as CSSProperties}>
        <span aria-hidden="true">拍</span><strong>{alt}</strong><small>官网产品图待同步</small>
      </div>
    );
  }

  const step = (direction: number) => setFrame((current) => (current + direction + images.length) % images.length);

  return (
    <figure className="product-gallery" style={{ "--gallery-accent": accent } as CSSProperties}>
      <div className="product-gallery__stage">
        <img src={images[safeFrame]} alt={`${alt} 官方产品图，第 ${safeFrame + 1} 张`} />
        <span>{images.length > 1 ? `官方多角度图集 · ${safeFrame + 1}/${images.length}` : "官方产品图"}</span>
        {images.length > 1 && (
          <div className="product-gallery__arrows">
            <button onClick={() => step(-1)} aria-label="上一张产品图">‹</button>
            <button onClick={() => step(1)} aria-label="下一张产品图">›</button>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <>
          <label className="product-gallery__scrubber">
            <span>拖动查看视角</span><output>{safeFrame + 1} / {images.length}</output>
            <input type="range" min="0" max={images.length - 1} step="1" value={safeFrame} onChange={(event) => setFrame(Number(event.target.value))} />
          </label>
          <div className="product-gallery__thumbs" aria-label="选择产品视角">
            {images.map((image, index) => (
              <button key={image} aria-pressed={safeFrame === index} onClick={() => setFrame(index)} aria-label={`查看第 ${index + 1} 张产品图`}>
                <img src={image} alt="" />
              </button>
            ))}
          </div>
          <figcaption>多角度静态产品图，不等同于连续 360° 三维模型。</figcaption>
        </>
      )}
    </figure>
  );
}

function CatalogFamilyCard({ family, onOpen }: { family: CatalogFamily; onOpen: () => void }) {
  const heads = family.models.map((model) => model.head).filter((value): value is number => value !== null);
  const weights = family.models.map((model) => model.weight).filter((value): value is number => value !== null);
  const accent = familyTypeAccent[family.type];
  const gallery = familyGalleries[family.id] ?? (family.image ? [family.image] : []);

  return (
    <article className="catalog-family-card" style={{ "--family-accent": accent } as CSSProperties}>
      <button className="catalog-family-card__visual" onClick={onOpen} aria-label={`查看 ${family.brand} ${family.family} ${family.generation} 全系参数`}>
        {gallery.length > 0 ? <img src={gallery[0]} alt={`${family.brand} ${family.family} ${family.generation} 官方产品图`} /> : <span className="catalog-family-card__monogram"><b>{family.brand.slice(0, 2)}</b><small>{family.family}</small></span>}
        <span className="catalog-family-card__release"><i />{family.status === "预告" ? "即将上市" : "发行"} {familyReleaseLabel(family)}</span>
        {gallery.length > 1 && <span className="catalog-family-card__gallery">多角度 · {gallery.length}</span>}
      </button>
      <div className="catalog-family-card__body">
        <div className="catalog-family-card__kicker"><span>{family.brand}</span><span>{family.type}</span></div>
        <button className="catalog-family-card__title" onClick={onOpen}><h3>{family.family}</h3><b>{family.generation}</b></button>
        <p>{family.summary}</p>
        <dl>
          <div><dt>型号</dt><dd>{family.models.length} 款</dd></div>
          <div><dt>拍面</dt><dd>{heads.length ? `${Math.min(...heads)}–${Math.max(...heads)}` : "—"} in²</dd></div>
          <div><dt>重量</dt><dd>{weights.length ? `${Math.min(...weights)}–${Math.max(...weights)}` : "—"} g</dd></div>
        </dl>
        <button className="catalog-family-card__open" onClick={onOpen}>查看完整参数矩阵 <span aria-hidden="true">›</span></button>
      </div>
    </article>
  );
}

function TourRacketVisual({ player }: { player: TourPlayer }) {
  const image = player.marketedFamily.includes("Blade V10")
    ? "/rackets/gallery/wilson-blade-v10-02.png"
    : player.marketedFamily.includes("Ultra V5")
      ? "/rackets/catalog/wilson-ultra-v5.jpg"
      : player.marketedFamily.includes("Boom 2026")
        ? "/rackets/catalog/head-boom-2026.webp"
    : player.racketImageId
      ? racketImages[player.racketImageId]
      : undefined;
  return image ? <img src={image} alt={`${player.nameZh} 官网公开用拍 ${player.marketedModel ?? player.marketedFamily}`} /> : <span><b>{player.brand}</b><small>{player.marketedFamily}</small></span>;
}

function TourPlayerCard({ player, leader = false }: { player: TourPlayer; leader?: boolean }) {
  return (
    <article className={`tour-player-card${leader ? " tour-player-card--leader" : ""}`}>
      <div className="tour-player-card__rank"><span>{player.tour}</span><b>#{player.rank}</b></div>
      <div className="tour-player-card__visual"><TourRacketVisual player={player} /></div>
      <div className="tour-player-card__body">
        <div className="tour-player-card__country"><span>{player.countryCode}</span><span>{player.brand}</span></div>
        <h2>{player.nameZh}</h2><p className="tour-player-card__latin">{player.name}</p>
        <div className="tour-player-card__racket"><small>官网公开用拍</small><strong>{player.marketedModel ?? player.marketedFamily}</strong><span>{player.mapping}</span></div>
        <p className="tour-player-card__note">{player.note}</p>
        <div className="tour-player-card__actions">
          <a href={player.profileUrl} target="_blank" rel="noreferrer">官方选手页 <span aria-hidden="true">↗</span></a>
          <a href={player.gearUrl} target="_blank" rel="noreferrer">查看零售拍 <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </article>
  );
}

export default function RacketApp() {
  const [activeView, setActiveView] = useState<AppView>("discover");
  const [libraryMode, setLibraryMode] = useState<"catalog" | "dossiers">("catalog");
  const [brand, setBrand] = useState("全部");
  const [stageFilter, setStageFilter] = useState<(typeof stageOptions)[number]>("全部");
  const [styleFilter, setStyleFilter] = useState<(typeof styleOptions)[number]>("全部");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("推荐排序");
  const [catalogBrand, setCatalogBrand] = useState("全部");
  const [catalogType, setCatalogType] = useState<(typeof catalogTypes)[number]>("全部");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSort, setCatalogSort] = useState("最新发行");
  const [matchStage, setMatchStage] = useState<Stage>("进阶");
  const [matchStyle, setMatchStyle] = useState<PlayStyle>("底线相持");
  const [priority, setPriority] = useState("均衡");
  const [matchStep, setMatchStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [tourFilter, setTourFilter] = useState<Tour>("ATP");
  const [filterOpen, setFilterOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const recommendations = useMemo(
    () => rackets
      .map((racket) => ({ racket, match: recommendationScore(racket, matchStage, matchStyle, priority) }))
      .sort((a, b) => b.match - a.match)
      .slice(0, 4),
    [matchStage, matchStyle, priority],
  );

  const filteredRackets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rackets
      .filter((racket) => {
        const matchesBrand = brand === "全部" || racket.brand === brand;
        const matchesStage = stageFilter === "全部" || racket.stages.includes(stageFilter as Stage);
        const matchesStyle = styleFilter === "全部" || racket.styles.includes(styleFilter as PlayStyle);
        const matchesSearch = !term || `${racket.brand} ${racket.model} ${racket.series}`.toLowerCase().includes(term);
        return matchesBrand && matchesStage && matchesStyle && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === "重量从轻到重") return a.weight - b.weight;
        if (sort === "控制优先") return b.scores.control - a.scores.control;
        if (sort === "力量优先") return b.scores.power - a.scores.power;
        if (sort === "容错优先") return b.scores.forgiveness - a.scores.forgiveness;
        return rackets.indexOf(a) - rackets.indexOf(b);
      });
  }, [brand, stageFilter, styleFilter, search, sort]);

  const filteredFamilies = useMemo(() => {
    const term = catalogSearch.trim().toLowerCase();
    return catalogFamilies
      .filter((family) => {
        const matchesBrand = catalogBrand === "全部" || family.brand === catalogBrand;
        const matchesType = catalogType === "全部" || family.type === catalogType;
        const haystack = `${family.brand} ${family.family} ${family.generation} ${family.type} ${family.models.map((model) => model.name).join(" ")}`.toLowerCase();
        return matchesBrand && matchesType && (!term || haystack.includes(term));
      })
      .sort((a, b) => {
        if (catalogSort === "品牌顺序") return a.brand.localeCompare(b.brand, "en") || a.family.localeCompare(b.family, "en");
        if (catalogSort === "型号数量") return b.models.length - a.models.length;
        return (b.releaseYear ?? 0) - (a.releaseYear ?? 0) || a.brand.localeCompare(b.brand, "en");
      });
  }, [catalogBrand, catalogType, catalogSearch, catalogSort]);

  const catalogBrandStats = useMemo(
    () => catalogBrands.map((item) => {
      const families = catalogFamilies.filter((family) => family.brand === item);
      return {
        brand: item,
        families: families.length,
        models: families.reduce((total, family) => total + family.models.length, 0),
        newest: Math.max(...families.map((family) => family.releaseYear ?? 0)),
      };
    }),
    [],
  );

  const selected = selectedId ? rackets.find((racket) => racket.id === selectedId) ?? null : null;
  const selectedFamily = selectedFamilyId ? catalogFamilies.find((family) => family.id === selectedFamilyId) ?? null : null;
  const compared = compareIds.map((id) => rackets.find((racket) => racket.id === id)).filter(Boolean) as Racket[];
  const featured = recommendations[0];
  const activeFilterCount = [brand !== "全部", stageFilter !== "全部", styleFilter !== "全部"].filter(Boolean).length;
  const catalogActiveFilterCount = [catalogBrand !== "全部", catalogType !== "全部"].filter(Boolean).length;
  const visibleCatalogModelCount = filteredFamilies.reduce((total, family) => total + family.models.length, 0);
  const visibleTourPlayers = tourPlayers.filter((player) => player.tour === tourFilter);

  useEffect(() => {
    const readView = () => {
      const hash = window.location.hash.replace("#", "") as AppView;
      if (appTabs.some((tab) => tab.id === hash)) setActiveView(hash);
    };
    readView();
    window.addEventListener("popstate", readView);
    return () => window.removeEventListener("popstate", readView);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("app-locked", Boolean(selected || selectedFamily || filterOpen));
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (filterOpen) setFilterOpen(false);
      else if (selected) {
        setSelectedId(null);
        window.requestAnimationFrame(() => lastFocusRef.current?.focus());
      } else if (selectedFamily) {
        setSelectedFamilyId(null);
        window.requestAnimationFrame(() => lastFocusRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.classList.remove("app-locked");
      window.removeEventListener("keydown", handleKey);
    };
  }, [selected, selectedFamily, filterOpen]);

  useEffect(() => {
    if (!liveMessage) return;
    const timer = window.setTimeout(() => setLiveMessage(""), 2800);
    return () => window.clearTimeout(timer);
  }, [liveMessage]);

  const goToView = (view: AppView) => {
    setSelectedId(null);
    setSelectedFamilyId(null);
    setFilterOpen(false);
    setActiveView(view);
    window.history.pushState({}, "", `#${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openRacket = (id: string) => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setFilterOpen(false);
    setSelectedId(id);
  };

  const openFamily = (id: string) => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setSelectedId(null);
    setFilterOpen(false);
    setSelectedFamilyId(id);
  };

  const closeDetail = () => {
    setSelectedId(null);
    window.requestAnimationFrame(() => lastFocusRef.current?.focus());
  };

  const closeFamily = () => {
    setSelectedFamilyId(null);
    window.requestAnimationFrame(() => lastFocusRef.current?.focus());
  };

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      const racket = rackets.find((item) => item.id === id);
      if (current.includes(id)) {
        setLiveMessage(`${racket?.model ?? "球拍"} 已移出对比`);
        return current.filter((item) => item !== id);
      }
      if (current.length >= 3) {
        setLiveMessage("最多同时对比三把球拍，请先移除一把");
        return current;
      }
      setLiveMessage(`${racket?.model ?? "球拍"} 已加入对比，当前 ${current.length + 1}/3`);
      return [...current, id];
    });
  };

  const clearFilters = () => {
    setBrand("全部");
    setStageFilter("全部");
    setStyleFilter("全部");
    setSearch("");
    setSort("推荐排序");
  };

  const clearCatalogFilters = () => {
    setCatalogBrand("全部");
    setCatalogType("全部");
    setCatalogSearch("");
    setCatalogSort("最新发行");
  };

  const chooseMatchOption = (step: number, value: string) => {
    if (step === 0) setMatchStage(value as Stage);
    if (step === 1) setMatchStyle(value as PlayStyle);
    if (step === 2) setPriority(value);
    setMatchStep(step + 1);
  };

  const comparisonRows: { label: string; value: (racket: Racket) => React.ReactNode }[] = [
    { label: "适合阶段", value: (racket) => racket.stages.join(" · ") },
    { label: "打法风格", value: (racket) => racket.styles.join(" · ") },
    { label: "裸拍重量", value: (racket) => <><b>{racket.weight}</b> g</> },
    { label: "拍面", value: (racket) => <><b>{racket.head}</b> in²</> },
    { label: "线床", value: (racket) => racket.pattern },
    ...radarKeys.map((key) => ({ label: scoreLabels[key], value: (racket: Racket) => <b>{racket.scores[key]}</b> })),
  ];

  return (
    <main className="racket-app">
      <aside className="desktop-sidebar" aria-label="应用导航">
        <button className="app-brand" onClick={() => goToView("discover")} aria-label="拍库首页">
          <span>拍</span><span><b>拍库</b><small>Racket Lab</small></span>
        </button>
        <nav>
          {appTabs.map((tab) => (
            <button key={tab.id} aria-current={activeView === tab.id ? "page" : undefined} onClick={() => goToView(tab.id)}>
              <span aria-hidden="true">{tab.icon}</span><b>{tab.label}</b>
              {tab.id === "compare" && compareIds.length > 0 && <i>{compareIds.length}</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span>当前拍库 · {catalogVerifiedAt}</span>
          <strong>{catalogModelCount} 款现行型号</strong>
          <p>{catalogFamilies.length} 个拍系 · {rackets.length} 份六维深度档案 · 8 个品牌。</p>
        </div>
      </aside>

      <div className="app-content">
        {activeView === "discover" && (
          <section className="app-view discover-view" aria-labelledby="discover-title">
            <ViewTitle eyebrow="为你的打法准备" title="今天，想怎么赢？" action={<button className="profile-button" aria-label="拍库个人档案">拍</button>} />

            <section className="featured-racket" style={{ "--racket-accent": featured.racket.accent } as CSSProperties}>
              <div className="featured-racket__copy">
                <div className="match-badge"><span>本周首选</span><b>{featured.match}% 匹配</b></div>
                <p>{featured.racket.brand} · {featured.racket.series}</p>
                <h2>{featured.racket.model}</h2>
                <p className="featured-racket__summary">{featured.racket.verdict}</p>
                <div className="featured-racket__tags"><span>{matchStage}</span><span>{matchStyle}</span><span>{priority}优先</span></div>
                <div className="featured-racket__actions">
                  <button className="app-button app-button--primary" onClick={() => openRacket(featured.racket.id)}>查看球拍</button>
                  <button className="app-button app-button--glass" onClick={() => { setMatchStep(0); goToView("match"); }}>重新匹配</button>
                </div>
              </div>
              <RacketPhoto racket={featured.racket} variant="hero" />
              <div className="featured-racket__radar"><RadarChart chartRackets={[featured.racket]} compact /></div>
            </section>

            <div className="section-bar"><div><p>为你推荐</p><h2>更接近你的三把拍</h2></div><button onClick={() => { setLibraryMode("dossiers"); goToView("armory"); }}>查看全部 <span aria-hidden="true">›</span></button></div>
            <div className="recommendation-list">
              {recommendations.slice(1).map(({ racket, match }) => (
                <RecommendationRow
                  key={racket.id}
                  racket={racket}
                  match={match}
                  onOpen={() => openRacket(racket.id)}
                  onToggleCompare={() => toggleCompare(racket.id)}
                  compared={compareIds.includes(racket.id)}
                />
              ))}
            </div>

            <section className="insight-card">
              <div><span aria-hidden="true">◎</span><p>选拍提示</p></div>
              <h2>参数只是起点，动作与目标才决定答案。</h2>
              <p>先锁定阶段和打法，再用控制、力量、旋转、手感、容错与灵活六个维度确认取舍。</p>
              <button onClick={() => { setMatchStep(0); goToView("match"); }}>开始 3 步匹配 <span aria-hidden="true">→</span></button>
            </section>

            <div className="discover-shortcuts">
              <button onClick={() => { setLibraryMode("catalog"); goToView("armory"); }}>
                <span>拍系年鉴</span><b>{catalogModelCount} 款现行型号</b><small>按品牌、类型与代际浏览完整参数</small><i aria-hidden="true">›</i>
              </button>
              <button onClick={() => goToView("tour")}>
                <span>Tour Locker</span><b>ATP + WTA 前 8</b><small>看明星球员的官网公开用拍</small><i aria-hidden="true">›</i>
              </button>
            </div>
          </section>
        )}

        {activeView === "match" && (
          <section className="app-view match-view" aria-labelledby="match-title">
            <ViewTitle eyebrow="三步找到你的方向" title="打法匹配" action={matchStep > 0 ? <button className="round-action" onClick={() => setMatchStep((step) => Math.max(0, step - 1))} aria-label="返回上一步">‹</button> : undefined} />
            <div className="match-progress" aria-label={`匹配进度 ${Math.min(matchStep + 1, 4)} / 4`}>
              {[0, 1, 2, 3].map((step) => <i key={step} className={matchStep >= step ? "is-active" : ""} />)}
            </div>

            {matchStep < 3 ? (
              <section className="match-question" aria-live="polite">
                <p>步骤 {matchStep + 1} / 3</p>
                <h2>{matchStep === 0 ? "你现在处于哪个阶段？" : matchStep === 1 ? "哪种打法最像你？" : "最想优先获得什么？"}</h2>
                <p className="match-question__hint">
                  {matchStep === 0 ? "按当前稳定水平选择，不用把它当成水平考试。" : matchStep === 1 ? "选择你最常用来赢分的方式。" : "每把球拍都有取舍，先确定这一阶段最重要的能力。"}
                </p>
                <div className={`match-options match-options--${matchStep}`}>
                  {(matchStep === 0 ? ["入门", "进阶", "高阶"] : matchStep === 1 ? styleOptions.slice(1) : ["均衡", "力量", "旋转", "控制", "手感", "护臂"]).map((item) => {
                    const current = matchStep === 0 ? matchStage === item : matchStep === 1 ? matchStyle === item : priority === item;
                    return <button key={item} aria-pressed={current} onClick={() => chooseMatchOption(matchStep, item)}><span>{item}</span><i aria-hidden="true">{current ? "✓" : "›"}</i></button>;
                  })}
                </div>
              </section>
            ) : (
              <section className="match-results-app" aria-live="polite">
                <div className="match-result-hero">
                  <span>匹配完成</span>
                  <h2>{matchStage} · {matchStyle}</h2>
                  <p>优先方向：{priority}。以下结果综合阶段、打法和六维属性排序。</p>
                  <button onClick={() => setMatchStep(0)}>修改答案</button>
                </div>
                <div className="match-result-list">
                  {recommendations.slice(0, 3).map(({ racket, match }, index) => (
                    <article key={racket.id} className="match-result-card">
                      <span className="match-result-card__rank">{index + 1}</span>
                      <RacketPhoto racket={racket} variant="thumb" />
                      <button className="match-result-card__main" onClick={() => openRacket(racket.id)}>
                        <small>{racket.brand}</small><strong>{racket.model}</strong><span>{racket.summary}</span>
                      </button>
                      <div className="match-result-card__score"><b>{match}%</b><small>匹配</small></div>
                      <button className="match-result-card__add" onClick={() => toggleCompare(racket.id)} aria-pressed={compareIds.includes(racket.id)} aria-label={`${compareIds.includes(racket.id) ? "移出" : "加入"}对比`}>{compareIds.includes(racket.id) ? "✓" : "+"}</button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}

        {activeView === "armory" && (
          <section className="app-view armory-view" aria-labelledby="armory-title">
            <ViewTitle
              eyebrow={libraryMode === "catalog" ? `${catalogModelCount} 款现行成人型号 · ${catalogFamilies.length} 个拍系` : `${rackets.length} 份六维深度档案`}
              title="球拍库"
              action={libraryMode === "dossiers" ? <button className="round-action" onClick={() => setFilterOpen(true)} aria-label="打开筛选">≡{activeFilterCount > 0 && <i>{activeFilterCount}</i>}</button> : undefined}
            />
            <div className="library-mode-switch" role="tablist" aria-label="选择拍库浏览方式">
              <button role="tab" aria-selected={libraryMode === "catalog"} onClick={() => setLibraryMode("catalog")}><b>拍系年鉴</b><small>品牌 · 类型 · 代际</small></button>
              <button role="tab" aria-selected={libraryMode === "dossiers"} onClick={() => setLibraryMode("dossiers")}><b>深度档案</b><small>雷达图 · 选拍对比</small></button>
            </div>

            {libraryMode === "catalog" ? (
              <>
                <section className="catalog-coverage" aria-label="拍库覆盖范围">
                  <div><span>品牌</span><b>{catalogBrands.length}</b><small>主流性能品牌</small></div>
                  <div><span>拍系</span><b>{catalogFamilies.length}</b><small>按当前代去重</small></div>
                  <div><span>型号</span><b>{catalogModelCount}</b><small>成人现行子型号</small></div>
                  <p>核验于 {catalogVerifiedAt}。排除儿童拍、握把尺寸和纯配色重复 SKU；地区官网在售范围可能不同。</p>
                </section>

                <section className="brand-index" aria-labelledby="brand-index-title">
                  <div className="section-bar"><div><p>Brand index</p><h2 id="brand-index-title">先从品牌进入</h2></div>{catalogBrand !== "全部" && <button onClick={() => setCatalogBrand("全部")}>查看全部 <span aria-hidden="true">›</span></button>}</div>
                  <div className="brand-index__grid">
                    {catalogBrandStats.map((item) => (
                      <button key={item.brand} aria-pressed={catalogBrand === item.brand} onClick={() => setCatalogBrand(item.brand)}>
                        <span>{item.brand.slice(0, 2)}</span><b>{item.brand}</b><small>{item.families} 拍系 · {item.models} 型号</small><i>{item.newest || "现行"}</i>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="library-toolbar catalog-toolbar">
                  <label className="app-search" htmlFor="catalog-search"><span aria-hidden="true">⌕</span><input id="catalog-search" value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="搜索品牌、拍系或具体型号" /><button onClick={() => setCatalogSearch("")} aria-label="清除搜索" hidden={!catalogSearch}>×</button></label>
                  <label className="catalog-sort" htmlFor="catalog-sort"><span className="sr-only">拍系排序</span><select id="catalog-sort" value={catalogSort} onChange={(event) => setCatalogSort(event.target.value)}><option>最新发行</option><option>品牌顺序</option><option>型号数量</option></select></label>
                </div>
                <div className="brand-scroller" aria-label="按品牌筛选拍系">
                  {["全部", ...catalogBrands].map((item) => <button key={item} aria-pressed={catalogBrand === item} onClick={() => setCatalogBrand(item)}>{item}</button>)}
                </div>
                <div className="catalog-type-scroller" aria-label="按球拍类型筛选">
                  {catalogTypes.map((item) => <button key={item} aria-pressed={catalogType === item} onClick={() => setCatalogType(item)}>{item === "全部" ? "全部类型" : `${item}型`}</button>)}
                </div>
                <div className="library-summary"><p><b>{filteredFamilies.length}</b> 个拍系 · {visibleCatalogModelCount} 款型号{catalogActiveFilterCount > 0 && ` · 已应用 ${catalogActiveFilterCount} 个筛选`}</p>{(catalogActiveFilterCount > 0 || catalogSearch) && <button onClick={clearCatalogFilters}>全部清除</button>}</div>
                {filteredFamilies.length > 0 ? (
                  <div className="catalog-family-grid">
                    {filteredFamilies.map((family) => <CatalogFamilyCard key={family.id} family={family} onOpen={() => openFamily(family.id)} />)}
                  </div>
                ) : (
                  <div className="app-empty"><span aria-hidden="true">⌕</span><h2>没有找到对应拍系</h2><p>试试清除类型筛选，或搜索更短的型号关键词。</p><button className="app-button app-button--primary" onClick={clearCatalogFilters}>清除筛选</button></div>
                )}
              </>
            ) : (
              <>
                <div className="dossier-explainer"><span>六维评分区</span><p>这里保留经过人工定位的 {rackets.length} 份深度档案，可加入重叠雷达图对比；完整在售型号请切换到“拍系年鉴”。</p></div>
                <div className="library-toolbar">
                  <label className="app-search" htmlFor="app-racket-search"><span aria-hidden="true">⌕</span><input id="app-racket-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索品牌或型号" /><button onClick={() => setSearch("")} aria-label="清除搜索" hidden={!search}>×</button></label>
                  <button className="filter-button" onClick={() => setFilterOpen(true)}>筛选{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
                </div>
                <div className="brand-scroller" aria-label="按品牌筛选">
                  {brandOptions.map((item) => <button key={item} aria-pressed={brand === item} onClick={() => setBrand(item)}>{item}</button>)}
                </div>
                <div className="library-summary"><p><b>{filteredRackets.length}</b> 款结果{activeFilterCount > 0 && ` · 已应用 ${activeFilterCount} 个筛选`}</p>{(activeFilterCount > 0 || search) && <button onClick={clearFilters}>全部清除</button>}</div>
                {filteredRackets.length > 0 ? (
                  <div className="app-racket-grid">
                    {filteredRackets.map((racket) => <AppRacketCard key={racket.id} racket={racket} compared={compareIds.includes(racket.id)} onOpen={() => openRacket(racket.id)} onToggleCompare={() => toggleCompare(racket.id)} />)}
                  </div>
                ) : (
                  <div className="app-empty"><span aria-hidden="true">⌕</span><h2>没有找到对应球拍</h2><p>试试减少一个筛选条件，或搜索更短的型号关键词。</p><button className="app-button app-button--primary" onClick={clearFilters}>清除筛选</button></div>
                )}
              </>
            )}
          </section>
        )}

        {activeView === "tour" && (
          <section className="app-view tour-view" aria-labelledby="tour-title">
            <ViewTitle eyebrow={`排名快照 · ${tourRankAsOf}`} title="巡回赛拍房" />
            <section className="tour-data-note">
              <div><span aria-hidden="true">◎</span><p><b>官网公开用拍</b><small>赞助家族或零售型号映射</small></p></div>
              <p>职业球员常用定制底板、加重和平衡方案；页面中的零售型号不代表其比赛拍实测参数。</p>
              <div><a href={tourSources.ATP} target="_blank" rel="noreferrer">ATP 排名源 ↗</a><a href={tourSources.WTA} target="_blank" rel="noreferrer">WTA 排名源 ↗</a></div>
            </section>
            <div className="tour-switch" role="tablist" aria-label="选择巡回赛">
              {(["ATP", "WTA"] as Tour[]).map((tour) => <button key={tour} role="tab" aria-selected={tourFilter === tour} onClick={() => setTourFilter(tour)}><b>{tour}</b><span>世界前 8</span></button>)}
            </div>
            <TourPlayerCard player={visibleTourPlayers[0]} leader />
            <div className="section-bar"><div><p>{tourFilter} ranking</p><h2>第 2–8 位的公开用拍</h2></div><span className="tour-updated">截至 {tourRankAsOf}</span></div>
            <div className="tour-player-grid">
              {visibleTourPlayers.slice(1).map((player) => <TourPlayerCard key={player.id} player={player} />)}
            </div>
          </section>
        )}

        {activeView === "compare" && (
          <section className="app-view compare-view" aria-labelledby="compare-title">
            <ViewTitle eyebrow="最多同时装载三把" title="球拍对比" action={compared.length > 0 ? <button className="text-action" onClick={() => setCompareIds([])}>清空</button> : undefined} />
            {compared.length === 0 ? (
              <div className="compare-empty-app">
                <div className="compare-empty-app__icon" aria-hidden="true">⇄</div>
                <h2>先加入想比较的球拍</h2>
                <p>从球拍库或推荐列表加入 2–3 把，雷达图会在同一刻度重叠显示差异。</p>
                <button className="app-button app-button--primary" onClick={() => { setLibraryMode("dossiers"); goToView("armory"); }}>去球拍库选择</button>
                <div className="compare-suggestions">
                  {recommendations.slice(0, 3).map(({ racket }) => <button key={racket.id} onClick={() => toggleCompare(racket.id)}><RacketPhoto racket={racket} variant="thumb" /><span><b>{racket.model}</b><small>+ 加入</small></span></button>)}
                </div>
              </div>
            ) : (
              <div className="compare-app-loaded">
                <section className="compare-radar-card">
                  <div><p>六维轮廓</p><h2>重叠雷达图</h2><span>实线、长虚线与点线对应不同球拍，满分 100。</span></div>
                  <RadarChart chartRackets={compared} />
                </section>

                <div className="compare-product-grid" style={{ "--compare-count": compared.length } as CSSProperties}>
                  {compared.map((racket) => (
                    <article key={racket.id}>
                      <button className="compare-product-grid__remove" onClick={() => toggleCompare(racket.id)} aria-label={`移除 ${racket.model}`}>×</button>
                      <RacketPhoto racket={racket} variant="thumb" />
                      <span>{racket.brand}</span><h3>{racket.model}</h3>
                    </article>
                  ))}
                  {compared.length < 3 && <button className="compare-add-slot" onClick={() => { setLibraryMode("dossiers"); goToView("armory"); }}><span>＋</span><b>再加一把</b></button>}
                </div>

                <section className="compare-spec-list">
                  {comparisonRows.map((row) => (
                    <div className="compare-spec-row" key={row.label}>
                      <h3>{row.label}</h3>
                      <div style={{ "--compare-count": compared.length } as CSSProperties}>{compared.map((racket) => <span key={racket.id}>{row.value(racket)}</span>)}</div>
                    </div>
                  ))}
                </section>
                <div className="compare-buy-grid" style={{ "--compare-count": compared.length } as CSSProperties}>
                  {compared.map((racket) => <a key={racket.id} href={racket.buyUrl} target="_blank" rel="noreferrer">前往 {racket.brand} 官网 <span aria-hidden="true">↗</span></a>)}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {!selected && !selectedFamily && activeView !== "compare" && compareIds.length > 0 && (
        <button className="compare-tray" onClick={() => goToView("compare")}>
          <span className="compare-tray__photos">{compared.map((racket) => <RacketPhoto key={racket.id} racket={racket} variant="thumb" />)}{Array.from({ length: 3 - compared.length }).map((_, index) => <i key={index}>+</i>)}</span>
          <span><b>对比 {compared.length}/3</b><small>查看重叠雷达图</small></span>
          <strong>继续 <span aria-hidden="true">›</span></strong>
        </button>
      )}

      <nav className="mobile-tabbar" aria-label="应用导航">
        {appTabs.map((tab) => (
          <button key={tab.id} aria-current={activeView === tab.id ? "page" : undefined} onClick={() => goToView(tab.id)}>
            <span aria-hidden="true">{tab.icon}</span><b>{tab.label}</b>{tab.id === "compare" && compareIds.length > 0 && <i>{compareIds.length}</i>}
          </button>
        ))}
      </nav>

      {filterOpen && (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setFilterOpen(false)}>
          <section className="filter-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" aria-hidden="true" />
            <header><button onClick={() => setFilterOpen(false)}>取消</button><h2 id="filter-title">筛选球拍</h2><button onClick={clearFilters}>重置</button></header>
            <div className="filter-sheet__content">
              <fieldset><legend>品牌</legend><div>{brandOptions.map((item) => <button key={item} aria-pressed={brand === item} onClick={() => setBrand(item)}>{item}</button>)}</div></fieldset>
              <fieldset><legend>打球阶段</legend><div>{stageOptions.map((item) => <button key={item} aria-pressed={stageFilter === item} onClick={() => setStageFilter(item)}>{item}</button>)}</div></fieldset>
              <fieldset><legend>打法风格</legend><div>{styleOptions.map((item) => <button key={item} aria-pressed={styleFilter === item} onClick={() => setStyleFilter(item)}>{item}</button>)}</div></fieldset>
              <label className="filter-sort" htmlFor="app-sort">排序方式<select id="app-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option>推荐排序</option><option>重量从轻到重</option><option>控制优先</option><option>力量优先</option><option>容错优先</option></select></label>
            </div>
            <button className="app-button app-button--primary filter-sheet__apply" onClick={() => setFilterOpen(false)}>显示 {filteredRackets.length} 款球拍</button>
          </section>
        </div>
      )}

      {selectedFamily && (
        <div className="detail-backdrop" role="presentation" onMouseDown={closeFamily}>
          <section className="family-inspector" role="dialog" aria-modal="true" aria-labelledby="family-inspector-title" onMouseDown={(event) => event.stopPropagation()} style={{ "--family-accent": familyTypeAccent[selectedFamily.type] } as CSSProperties}>
            <div className="sheet-handle" aria-hidden="true" />
            <header className="family-inspector__header">
              <button onClick={closeFamily} aria-label="关闭拍系详情">‹</button>
              <span>{selectedFamily.brand} · {selectedFamily.family}</span>
              <a href={selectedFamily.familyUrl} target="_blank" rel="noreferrer">官网 ↗</a>
            </header>
            <div className="family-inspector__scroll">
              <ProductGallery
                key={selectedFamily.id}
                images={familyGalleries[selectedFamily.id] ?? (selectedFamily.image ? [selectedFamily.image] : [])}
                alt={`${selectedFamily.brand} ${selectedFamily.family} ${selectedFamily.generation}`}
                accent={familyTypeAccent[selectedFamily.type]}
              />
              <header className="family-inspector__title">
                <div><span>{selectedFamily.type}型</span><span>{selectedFamily.status === "预告" ? "即将上市" : "现行拍系"}</span></div>
                <p>{selectedFamily.brand} · {selectedFamily.generation}</p>
                <h2 id="family-inspector-title">{selectedFamily.family}</h2>
                <strong>发行 {familyReleaseLabel(selectedFamily)}</strong>
                <p>{selectedFamily.summary}</p>
              </header>
              <dl className="family-inspector__overview">
                <div><dt>当前型号</dt><dd>{selectedFamily.models.length} 款</dd></div>
                <div><dt>定位 Type</dt><dd>{selectedFamily.type}</dd></div>
                <div><dt>代际</dt><dd>{selectedFamily.generation}</dd></div>
                <div><dt>数据核验</dt><dd>{catalogVerifiedAt}</dd></div>
              </dl>
              <section className="model-matrix" aria-labelledby="model-matrix-title">
                <div className="model-matrix__heading"><div><p>Variant matrix</p><h3 id="model-matrix-title">全系参数</h3></div><span>裸拍数据 · “—”代表官网未公开</span></div>
                <div className="model-matrix__scroll">
                  <table>
                    <thead><tr><th>型号</th><th>发行</th><th>拍面</th><th>重量</th><th>线床</th><th>平衡点</th><th>框厚</th><th>长度</th><th>购买</th></tr></thead>
                    <tbody>
                      {selectedFamily.models.map((model) => (
                        <tr key={`${selectedFamily.id}-${model.name}`}>
                          <th scope="row">{model.name}</th>
                          <td>{model.releaseDate ?? familyReleaseLabel(selectedFamily)}</td>
                          <td>{model.head === null ? "—" : `${model.head} in²`}</td>
                          <td>{model.weight === null ? "—" : `${model.weight} g`}</td>
                          <td>{model.pattern ?? "—"}</td>
                          <td>{model.balance === null ? "—" : `${model.balance} mm`}</td>
                          <td>{model.beam === null ? "—" : `${model.beam} mm`}</td>
                          <td>{model.length === null ? "—" : `${model.length} in`}</td>
                          <td><a href={model.url} target="_blank" rel="noreferrer" aria-label={`前往官网查看 ${model.name}`}>官网 ↗</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              {selectedFamily.note && <p className="family-inspector__note"><b>数据说明</b>{selectedFamily.note}</p>}
              <p className="family-inspector__source">规格与发行信息来自品牌官网；不同国家/地区在售款可能不同。握把尺寸、纯配色与儿童拍未重复计数。</p>
            </div>
            <footer className="family-inspector__actions"><span><b>{selectedFamily.models.length} 款</b><small>官网现行成人型号</small></span><a className="app-button app-button--primary" href={selectedFamily.familyUrl} target="_blank" rel="noreferrer">打开 {selectedFamily.brand} 官网 <span aria-hidden="true">↗</span></a></footer>
          </section>
        </div>
      )}

      {selected && (
        <div className="detail-backdrop" role="presentation" onMouseDown={closeDetail}>
          <section className="racket-inspector" role="dialog" aria-modal="true" aria-labelledby="inspector-title" onMouseDown={(event) => event.stopPropagation()} style={{ "--racket-accent": selected.accent } as CSSProperties}>
            <div className="sheet-handle" aria-hidden="true" />
            <header className="racket-inspector__header"><button onClick={closeDetail} aria-label="关闭详情">‹</button><span>{selected.brand}</span><button onClick={() => toggleCompare(selected.id)} aria-pressed={compareIds.includes(selected.id)}>{compareIds.includes(selected.id) ? "已对比" : "+ 对比"}</button></header>
            <div className="racket-inspector__scroll">
              {racketGalleries[selected.id] ? <ProductGallery key={selected.id} images={racketGalleries[selected.id]} alt={`${selected.brand} ${selected.model}`} accent={selected.accent} /> : <RacketPhoto racket={selected} variant="detail" />}
              <div className="racket-inspector__title"><p>{selected.series} · {selected.year}</p><h2 id="inspector-title">{selected.model}</h2><span>{selected.stages.join(" · ")} / {selected.styles.join(" · ")}</span></div>
              <p className="racket-inspector__verdict">{selected.verdict}</p>
              <dl className="inspector-specs">
                <div><dt>裸拍重量</dt><dd>{selected.weight} g</dd></div><div><dt>拍面</dt><dd>{selected.head} in²</dd></div><div><dt>线床</dt><dd>{selected.pattern}</dd></div><div><dt>平衡点</dt><dd>{selected.balance}</dd></div><div><dt>框厚</dt><dd>{selected.beam}</dd></div><div><dt>阶段</dt><dd>{selected.stages.join(" / ")}</dd></div>
              </dl>
              <section className="inspector-radar"><div><p>六维属性</p><span>拍库内部相对评分</span></div><RadarChart chartRackets={[selected]} /></section>
              <p className="inspector-note">穿线、磅数与个人动作都会改变最终手感；评分适合用于同库比较，不替代实际试打。</p>
            </div>
            <footer className="racket-inspector__actions"><button className="app-button app-button--soft" onClick={() => toggleCompare(selected.id)}>{compareIds.includes(selected.id) ? "✓ 已加入对比" : "+ 加入对比"}</button><a className="app-button app-button--primary" href={selected.buyUrl} target="_blank" rel="noreferrer">前往 {selected.buyLabel} <span aria-hidden="true">↗</span></a></footer>
          </section>
        </div>
      )}

      <div className={`app-toast${liveMessage ? " is-visible" : ""}`} aria-live="polite">{liveMessage}</div>
    </main>
  );
}
