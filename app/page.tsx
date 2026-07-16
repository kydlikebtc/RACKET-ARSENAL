"use client";

import { useMemo, useState, type CSSProperties } from "react";

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

function RacketArt({ racket, compact = false }: { racket: Racket; compact?: boolean }) {
  return (
    <div
      className={`racket-art${compact ? " racket-art--compact" : ""}`}
      style={{ "--racket-accent": racket.accent } as CSSProperties}
      aria-hidden="true"
    >
      <div className="racket-art__halo" />
      <div className="racket-art__head"><div className="racket-art__strings" /></div>
      <div className="racket-art__throat" />
      <div className="racket-art__handle" />
      <span className="racket-art__code">{racket.id.slice(-5).toUpperCase()}</span>
    </div>
  );
}

function ScoreBars({ racket, condensed = false }: { racket: Racket; condensed?: boolean }) {
  const entries = Object.entries(racket.scores) as [ScoreKey, number][];
  return (
    <div className={`score-bars${condensed ? " score-bars--condensed" : ""}`}>
      {entries.map(([key, value]) => (
        <div className="score-row" key={key}>
          <span>{scoreLabels[key]}</span>
          <div className="score-track"><i style={{ width: `${value}%` }} /></div>
          <b>{value}</b>
        </div>
      ))}
    </div>
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

export default function Home() {
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
          <RacketArt racket={rackets[0]} />
          <div className="dossier-title">
            <p>{rackets[0].brand} / {rackets[0].series}</p>
            <h2>{rackets[0].model}</h2>
          </div>
          <div className="spec-strip">
            <div><b>{rackets[0].weight}</b><span>g / 裸拍</span></div>
            <div><b>{rackets[0].head}</b><span>in² / 拍面</span></div>
            <div><b>{rackets[0].pattern}</b><span>线床</span></div>
          </div>
          <ScoreBars racket={rackets[0]} condensed />
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
            {filteredRackets.map((racket, index) => {
              const isCompared = compareIds.includes(racket.id);
              const compareFull = compareIds.length >= 3 && !isCompared;
              return (
                <article className="racket-card" key={racket.id} style={{ "--racket-accent": racket.accent } as CSSProperties}>
                  <div className="card-index">AR–{String(rackets.indexOf(racket) + 1).padStart(3, "0")} <span>{racket.year}</span></div>
                  <RacketArt racket={racket} compact />
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
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead><tr><th>对比维度</th>{compared.map((racket) => <th key={racket.id}><span>{racket.brand}</span>{racket.model}<button onClick={() => toggleCompare(racket.id)} aria-label={`移除 ${racket.model}`}>×</button></th>)}</tr></thead>
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
              <RacketArt racket={selected} />
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
              <ScoreBars racket={selected} />
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
