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
} from "./catalog-data";
import {
  catalogRacketId,
  deepRackets,
  familyTypeAccent,
  formatNumberSpec,
  officialBalance,
  officialBeam,
  officialHead,
  officialLength,
  officialPattern,
  officialWeight,
  type DeepRacket,
  type PlayStyle,
  type ScoreKey,
  type Stage,
} from "./racket-profiles";
import { tourPlayers, tourRankAsOf, tourSources, type Tour, type TourPlayer } from "./tour-data";

type Racket = DeepRacket;

const scoreLabels: Record<ScoreKey, string> = {
  control: "控制",
  power: "力量",
  spin: "旋转",
  feel: "手感",
  forgiveness: "容错",
  agility: "灵活",
};

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
  const image = racket.image ?? racketImages[racket.id];

  return (
    <div
      className={`racket-photo racket-photo--${variant}`}
      style={{ "--racket-accent": racket.accent } as CSSProperties}
    >
      {image ? (
        <img
          src={image}
          alt={racket.familyId ? `${racket.brand} ${racket.familyName} 拍系官方代表图` : `${racket.brand} ${racket.model} 球拍实物图`}
          loading={variant === "hero" ? "eager" : "lazy"}
        />
      ) : <span aria-hidden="true">拍</span>}
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
      <p className="radar-chart__note">拍库相对评估 / 满分 100 / 非实验室测量</p>
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

type AppView = "discover" | "match" | "armory" | "tour" | "compare";

const appTabs: { id: AppView; label: string; icon: string }[] = [
  { id: "discover", label: "发现", icon: "◉" },
  { id: "match", label: "匹配", icon: "◇" },
  { id: "armory", label: "球拍库", icon: "▦" },
  { id: "tour", label: "球星", icon: "★" },
  { id: "compare", label: "对比", icon: "⇄" },
];

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

function familyReleaseLabel(family: CatalogFamily) {
  if (family.releaseDate) return family.releaseDate;
  if (family.releaseYear) return String(family.releaseYear);
  return "官网未注明";
}

function modelReleaseLabel(family: CatalogFamily, releaseDate?: string) {
  if (releaseDate) return releaseDate;
  const inherited = familyReleaseLabel(family);
  return inherited === "官网未注明" ? inherited : `${inherited}（本代）`;
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
        <button className="catalog-family-card__open" onClick={onOpen}>查看 {family.models.length} 款深度档案 <span aria-hidden="true">›</span></button>
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
  const [liveMessage, setLiveMessage] = useState("");
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const recommendations = useMemo(
    () => deepRackets
      .map((racket) => ({ racket, match: recommendationScore(racket, matchStage, matchStyle, priority) }))
      .sort((a, b) => b.match - a.match)
      .slice(0, 4),
    [matchStage, matchStyle, priority],
  );

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

  const selected = selectedId ? deepRackets.find((racket) => racket.id === selectedId) ?? null : null;
  const selectedFamily = selectedFamilyId ? catalogFamilies.find((family) => family.id === selectedFamilyId) ?? null : null;
  const compared = compareIds.map((id) => deepRackets.find((racket) => racket.id === id)).filter(Boolean) as Racket[];
  const featured = recommendations[0];
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
    document.body.classList.toggle("app-locked", Boolean(selected || selectedFamily));
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selected) {
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
  }, [selected, selectedFamily]);

  useEffect(() => {
    if (!liveMessage) return;
    const timer = window.setTimeout(() => setLiveMessage(""), 2800);
    return () => window.clearTimeout(timer);
  }, [liveMessage]);

  const goToView = (view: AppView) => {
    setSelectedId(null);
    setSelectedFamilyId(null);
    setActiveView(view);
    window.history.pushState({}, "", `#${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openRacket = (id: string) => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setSelectedFamilyId(null);
    setSelectedId(id);
  };

  const openFamily = (id: string) => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setSelectedId(null);
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
      const racket = deepRackets.find((item) => item.id === id);
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
    { label: "裸拍重量", value: (racket) => formatNumberSpec(officialWeight(racket), "g") },
    { label: "拍面", value: (racket) => formatNumberSpec(officialHead(racket), "in²") },
    { label: "线床", value: (racket) => officialPattern(racket) ?? "—" },
    { label: "平衡点", value: officialBalance },
    { label: "框厚", value: officialBeam },
    { label: "长度", value: officialLength },
    ...radarKeys.map((key) => ({ label: scoreLabels[key], value: (racket: Racket) => <b>{racket.scores[key]}</b> })),
  ];
  const selectedGallery = selected
    ? familyGalleries[selected.familyId ?? ""] ?? (selected.image ? [selected.image] : [])
    : [];

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
          <p>{catalogFamilies.length} 个拍系 · {deepRackets.length} 份六维深度档案 · 8 个品牌。</p>
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

            <div className="section-bar"><div><p>为你推荐</p><h2>更接近你的三把拍</h2></div><button onClick={() => goToView("armory")}>查看全部 <span aria-hidden="true">›</span></button></div>
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
              <button onClick={() => goToView("armory")}>
                <span>统一球拍库</span><b>{catalogModelCount} 款深度档案</b><small>按品牌、类型与代际浏览，每款都可看雷达与完整规格</small><i aria-hidden="true">›</i>
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
              eyebrow={`${deepRackets.length} 份深度档案 · ${catalogFamilies.length} 个拍系`}
              title="球拍库"
            />
            <div className="dossier-explainer"><span>年鉴 × 深度档案</span><p>每个型号都包含官网硬规格、发行信息、六维雷达、适合阶段与打法，并可直接加入重叠对比。</p></div>
            <section className="catalog-coverage" aria-label="拍库覆盖范围">
              <div><span>品牌</span><b>{catalogBrands.length}</b><small>主流性能品牌</small></div>
              <div><span>拍系</span><b>{catalogFamilies.length}</b><small>按当前代去重</small></div>
              <div><span>深档</span><b>{deepRackets.length}</b><small>每款型号一份</small></div>
              <p>核验于 {catalogVerifiedAt}。排除儿童拍、握把尺寸和纯配色重复 SKU；地区官网在售范围可能不同。</p>
            </section>

            <section className="brand-index" aria-labelledby="brand-index-title">
              <div className="section-bar"><div><p>Brand index</p><h2 id="brand-index-title">先从品牌进入</h2></div>{catalogBrand !== "全部" && <button onClick={() => setCatalogBrand("全部")}>查看全部 <span aria-hidden="true">›</span></button>}</div>
              <div className="brand-index__grid">
                {catalogBrandStats.map((item) => (
                  <button key={item.brand} aria-pressed={catalogBrand === item.brand} onClick={() => setCatalogBrand(item.brand)}>
                    <span>{item.brand.slice(0, 2)}</span><b>{item.brand}</b><small>{item.families} 拍系 · {item.models} 深档</small><i>{item.newest || "未注明"}</i>
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
            <div className="library-summary"><p><b>{filteredFamilies.length}</b> 个拍系 · {visibleCatalogModelCount} 份深度档案{catalogActiveFilterCount > 0 && ` · 已应用 ${catalogActiveFilterCount} 个筛选`}</p>{(catalogActiveFilterCount > 0 || catalogSearch) && <button onClick={clearCatalogFilters}>全部清除</button>}</div>
            {filteredFamilies.length > 0 ? (
              <div className="catalog-family-grid">
                {filteredFamilies.map((family) => <CatalogFamilyCard key={family.id} family={family} onOpen={() => openFamily(family.id)} />)}
              </div>
            ) : (
              <div className="app-empty"><span aria-hidden="true">⌕</span><h2>没有找到对应拍系</h2><p>试试清除类型筛选，或搜索更短的型号关键词。</p><button className="app-button app-button--primary" onClick={clearCatalogFilters}>清除筛选</button></div>
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
                <button className="app-button app-button--primary" onClick={() => goToView("armory")}>去球拍库选择</button>
                <div className="compare-suggestions">
                  {recommendations.slice(0, 3).map(({ racket }) => <button key={racket.id} onClick={() => toggleCompare(racket.id)}><RacketPhoto racket={racket} variant="thumb" /><span><b>{racket.model}</b><small>+ 加入</small></span></button>)}
                </div>
              </div>
            ) : (
              <div className="compare-app-loaded">
                <section className="compare-radar-card">
                  <div><p>六维轮廓</p><h2>重叠雷达图</h2><span>官网硬规格与拍系定位生成的相对评估；非实验室测量。</span></div>
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
                  {compared.length < 3 && <button className="compare-add-slot" onClick={() => goToView("armory")}><span>＋</span><b>再加一把</b></button>}
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
                    <thead><tr><th>型号</th><th>发行</th><th>拍面</th><th>重量</th><th>线床</th><th>平衡点</th><th>框厚</th><th>长度</th><th>档案 / 官网</th></tr></thead>
                    <tbody>
                      {selectedFamily.models.map((model, modelIndex) => (
                        <tr key={`${selectedFamily.id}-${model.name}`}>
                          <th scope="row">{model.name}</th>
                          <td>{modelReleaseLabel(selectedFamily, model.releaseDate)}</td>
                          <td>{model.head === null ? "—" : `${model.head} in²`}</td>
                          <td>{model.weight === null ? "—" : `${model.weight} g`}</td>
                          <td>{model.pattern ?? "—"}</td>
                          <td>{model.balance === null ? "—" : `${model.balance} mm`}</td>
                          <td>{model.beam === null ? "—" : `${model.beam} mm`}</td>
                          <td>{model.length === null ? "—" : `${model.length} in`}</td>
                          <td>
                            <div className="model-matrix__actions">
                              <button onClick={() => openRacket(catalogRacketId(selectedFamily, modelIndex))}>深度档案</button>
                              <a href={model.url} target="_blank" rel="noreferrer" aria-label={`前往官网查看 ${model.name}`}>官网资料 ↗</a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              {selectedFamily.note && <p className="family-inspector__note"><b>数据说明</b>{selectedFamily.note}</p>}
              <p className="family-inspector__source">规格与发行信息来自品牌官网；点击任一型号的“深度档案”可查看六维雷达、打法阶段并加入对比。不同国家/地区在售款可能不同。</p>
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
              {selectedGallery.length > 0 ? <ProductGallery key={selected.id} images={selectedGallery} alt={`${selected.brand} ${selected.familyName ?? selected.model}`} accent={selected.accent} /> : <RacketPhoto racket={selected} variant="detail" />}
              {selected.familyId && <p className="inspector-image-note">图片为 {selected.familyName} 拍系的官网代表图；具体子型号外观与细节请以官网页面为准。</p>}
              <div className="racket-inspector__title"><p>{selected.series} · {selected.generation ?? selected.year}</p><h2 id="inspector-title">{selected.model}</h2><strong>发行 {selected.releaseDate ?? selected.year}</strong><span>{selected.stages.join(" · ")} / {selected.styles.join(" · ")}</span></div>
              <p className="racket-inspector__summary">{selected.summary}</p>
              <p className="racket-inspector__verdict">{selected.verdict}</p>
              <dl className="inspector-specs">
                <div><dt>裸拍重量</dt><dd>{formatNumberSpec(officialWeight(selected), "g")}</dd></div><div><dt>拍面</dt><dd>{formatNumberSpec(officialHead(selected), "in²")}</dd></div><div><dt>线床</dt><dd>{officialPattern(selected) ?? "—"}</dd></div><div><dt>平衡点</dt><dd>{officialBalance(selected)}</dd></div><div><dt>框厚</dt><dd>{officialBeam(selected)}</dd></div><div><dt>长度</dt><dd>{officialLength(selected)}</dd></div><div><dt>阶段</dt><dd>{selected.stages.join(" / ")}</dd></div><div><dt>打法</dt><dd>{selected.styles.join(" / ")}</dd></div><div><dt>资料完整度</dt><dd>{selected.specCoverage ?? "—"}</dd></div>
              </dl>
              <section className="inspector-radar"><div><p>六维属性</p><span>官网规格 × 拍系定位</span></div><RadarChart chartRackets={[selected]} /></section>
              <p className="inspector-note">{selected.profileBasis} 非实验室测量。穿线、磅数与个人动作都会改变最终手感；评分适合用于同库比较，不替代实际试打。</p>
            </div>
            <footer className="racket-inspector__actions"><button className="app-button app-button--soft" onClick={() => toggleCompare(selected.id)}>{compareIds.includes(selected.id) ? "✓ 已加入对比" : "+ 加入对比"}</button><a className="app-button app-button--primary" href={selected.buyUrl} target="_blank" rel="noreferrer">前往 {selected.buyLabel} <span aria-hidden="true">↗</span></a></footer>
          </section>
        </div>
      )}

      <div className={`app-toast${liveMessage ? " is-visible" : ""}`} aria-live="polite">{liveMessage}</div>
    </main>
  );
}
