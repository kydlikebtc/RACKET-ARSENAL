export type CatalogImageSourceKind = "official-product" | "retailer-product";

export type CatalogImageSource = {
  sourceUrl: string;
  sourceKind: CatalogImageSourceKind;
  preferredImageUrls?: string[];
  preferredOnly?: boolean;
  imageLimit?: number;
};

const official = (sourceUrl: string, preferredImageUrls?: string[]): CatalogImageSource => ({
  sourceUrl,
  sourceKind: "official-product",
  preferredImageUrls,
});

const retailer = (sourceUrl: string, preferredImageUrls?: string[]): CatalogImageSource => ({
  sourceUrl,
  sourceKind: "retailer-product",
  preferredImageUrls,
});

const tennisWarehouseImage = (code: string) => (
  `https://img.tennis-warehouse.com/watermark/rs.php?path=${code}-1.jpg&nw=1426`
);

/**
 * Curated sources for archived models and special cosmetics.
 *
 * Family landing pages and launch articles are valuable catalog sources, but
 * their first image is usually a campaign banner rather than a racket product
 * shot. These overrides deliberately point image synchronization at a concrete
 * product page, with an explicit hero image where the retailer has archived the
 * page but removed its product JSON.
 */
export const catalogImageSources: Record<string, CatalogImageSource> = {
  "catalog-wilson-blade-v9-blade-pro-98-16x19-v9": official("https://jp.wilson.com/products/tennis-racket-blade-pro-16-x-19"),
  "catalog-wilson-blade-v9-blade-pro-98-18x20-v9": official("https://jp.wilson.com/products/tennis-racket-blade-pro-18-x-20"),
  "catalog-wilson-blade-v9-blade-98-16x19-v9": official("https://jp.wilson.com/products/tennis-racket-blade-98-16-x-19-v-9-0"),
  "catalog-wilson-blade-v9-blade-98-18x20-v9": official("https://jp.wilson.com/products/tennis-racket-blade-98-18-x-20-v-9-0"),
  "catalog-wilson-blade-v9-blade-98s-v9": official("https://jp.wilson.com/products/tennis-racket-blade-98s-v-9-0"),
  "catalog-wilson-blade-v9-blade-100-v9": official("https://jp.wilson.com/products/tennis-racket-blade-100-v-9-0"),
  "catalog-wilson-blade-v9-blade-100l-v9": retailer(
    "https://www.tennis-warehouse.com/Wilson_Blade_100L_v9/descpageRCWILSON-WB100L.html",
    [tennisWarehouseImage("WB100L")],
  ),
  "catalog-wilson-blade-v9-blade-100ul-v9": retailer(
    "https://www.tennis-warehouse.com/Wilson_Blade_100UL_v9/descpageRCWILSON-WB10UL.html",
    [tennisWarehouseImage("WB10UL")],
  ),
  "catalog-wilson-blade-v9-blade-101l-v9": official("https://wilson.co.il/product/blade-101l-v9/"),
  "catalog-wilson-blade-v9-blade-104-v9": retailer(
    "https://www.tennis-warehouse.com/Wilson_Blade_104_v9/descpageRCWILSON-WB104.html",
    [tennisWarehouseImage("WB104")],
  ),

  "catalog-yonex-vcore-7-vcore-95-7th": retailer("https://racquetguys.ca/products/yonex-vcore-95-310g-2023"),
  "catalog-yonex-vcore-7-vcore-98-7th": retailer("https://racquetguys.ca/products/yonex-vcore-98-2023"),
  "catalog-yonex-vcore-7-vcore-98l-7th": {
    ...retailer("https://racquetguys.ca/products/yonex-vcore-98l-2023"),
    imageLimit: 2,
  },
  "catalog-yonex-vcore-7-vcore-100-7th": retailer("https://racquetguys.ca/products/yonex-vcore-100-2023"),
  "catalog-yonex-vcore-7-vcore-100-plus-7th": retailer(
    "https://www.tennis-warehouse.com/Yonex_VCORE_100_2023/descpageRCYONEX-YV100P.html",
    [tennisWarehouseImage("YV100P")],
  ),
  "catalog-yonex-vcore-7-vcore-100l-7th": {
    ...retailer("https://racquetguys.ca/products/yonex-vcore-100l-2023"),
    imageLimit: 2,
  },
  "catalog-yonex-vcore-7-vcore-game-7th": official(
    "https://www.yonexmall.com/m2/goods/view.php?goodsno=6343",
    ["https://www.yonexmall.com/shop/data/goods/1703748511483i0.jpg"],
  ),
  "catalog-yonex-vcore-7-vcore-feel-7th": official(
    "https://www.yonexmall.com/m2/goods/view.php?goodsno=6344",
    ["https://www.yonexmall.com/shop/data/goods/1703749755836i0.jpg"],
  ),

  "catalog-yonex-ezone-7-ezone-98-7th": {
    ...retailer("https://racquetguys.ca/products/yonex-ezone-98-7th-gen"),
    imageLimit: 2,
  },
  "catalog-yonex-ezone-7-ezone-98l-7th": {
    ...retailer("https://racquetguys.ca/products/yonex-ezone-98l-7th-gen"),
    imageLimit: 2,
  },
  "catalog-yonex-ezone-7-ezone-98-plus-7th": retailer(
    "https://www.tennis-warehouse.com/descpage.html?pcode=EZ98PL",
    [tennisWarehouseImage("EZ98PL")],
  ),
  "catalog-yonex-ezone-7-ezone-98-tour-7th": retailer(
    "https://www.tennis-warehouse.com/descpage.html?pcode=YEZ98T",
    [tennisWarehouseImage("YEZ98T")],
  ),
  "catalog-yonex-ezone-7-ezone-100-7th": retailer(
    "https://www.tennis-warehouse.com/orderusedproduct.html?pcode=EZO10",
    [tennisWarehouseImage("EZO10")],
  ),
  "catalog-yonex-ezone-7-ezone-100-plus-7th": retailer(
    "https://www.tennis-warehouse.com/learning_center/racquet_reviews/EZ10PLreview.html",
    [tennisWarehouseImage("EZ10PL")],
  ),
  "catalog-yonex-ezone-7-ezone-100l-7th": retailer("https://racquetguys.ca/products/yonex-ezone-100l-7th-gen"),
  "catalog-yonex-ezone-7-ezone-100sl-7th": retailer(
    "https://www.tennis-warehouse.com/orderusedproduct.html?pcode=EZO270",
    [tennisWarehouseImage("EZO270")],
  ),
  "catalog-yonex-ezone-7-ezone-105-7th": retailer(
    "https://www.tennis-warehouse.com/descpage.html?pcode=EZ105",
    [tennisWarehouseImage("EZ105")],
  ),
  "catalog-yonex-ezone-7-ezone-110-7th": retailer(
    "https://www.tennis-warehouse.com/learning_center/gear_guides/light-beginner-intermediate-tennis-racquets.html",
    [tennisWarehouseImage("EZ110")],
  ),

  "catalog-babolat-pure-aero-gen8-pure-aero-98-gen8": retailer(
    "https://www.tennis-warehouse.com/Babolat_Pure_Aero_98_2023/descpageRCBAB-BARO98.html",
    [tennisWarehouseImage("BARO98")],
  ),
  "catalog-babolat-pure-aero-gen8-pure-aero-gen8": retailer(
    "https://www.tennis-warehouse.com/Babolat_Pure_Aero_2023/descpageRCBAB-BARO.html",
    [tennisWarehouseImage("BARO")],
  ),
  "catalog-babolat-pure-aero-gen8-pure-aero-plus-gen8": retailer(
    "https://www.tennis-warehouse.com/Babolat_Pure_Aero_Plus_2023/descpageRCBAB-BAROPL.html",
    [tennisWarehouseImage("BAROPL")],
  ),
  "catalog-babolat-pure-aero-gen8-pure-aero-team-gen8": retailer(
    "https://www.tennis-warehouse.com/learning_center/racquet_reviews/BAROTMreview.html",
    [tennisWarehouseImage("BAROTM")],
  ),
  "catalog-babolat-pure-aero-gen8-pure-aero-lite-gen8": retailer(
    "https://www.tennis-warehouse.com/Babolat_Pure_Aero_Lite_2023/descpageRCBAB-BAROL.html",
    [tennisWarehouseImage("BAROL")],
  ),

  "catalog-head-boom-2024-boom-team-2024": {
    sourceUrl: "https://www.head.com/en_US/product/boom-team-2024-230134",
    sourceKind: "official-product",
    preferredImageUrls: ["https://cdn-mdb.head.com/CDN3/D/230134/2/768x768/boom-team-2024.webp"],
    preferredOnly: true,
  },

  "edition-wilson-blade-98-v9-us-open-2025": official(
    "https://kr.wilson.com/collections/blade-v9-racket/products/wr178211",
    ["https://cdn.shopify.com/s/files/1/0576/0227/7429/files/WR178211U_0_Blade_98_v9_16x19_US_OPEN_2025_Navy.png?v=1753938878"],
  ),
  "edition-wilson-rf01-pro-laver-cup-2025": official("https://jp.wilson.com/products/rf-01-pro-laver-cup-2025-black"),
  "edition-wilson-rf01-laver-cup-2025": official("https://jp.wilson.com/products/tennis-racket-rf-01-laver-cup-2025-black"),

  "edition-yonex-vcore-98-7-sand-beige": retailer("https://racquetguys.ca/products/yonex-vcore-98-sand-beige"),
  "edition-yonex-vcore-98l-7-sand-beige": retailer("https://racquetguys.ca/products/yonex-vcore-98l-sand-beige"),
  "edition-yonex-vcore-100-7-sand-beige": retailer(
    "https://www.tennis-warehouse.com/orderusedproduct.html?pcode=VC10SB",
    [tennisWarehouseImage("VC10SB")],
  ),
  "edition-yonex-vcore-100l-7-sand-beige": retailer("https://racquetguys.ca/products/yonex-vcore-100l-sand-beige"),

  "edition-yonex-ezone-98-7-osaka": retailer(
    "https://www.tennis-warehouse.com/learning_center/racquet_reviews/YE98NOreview.html",
    [tennisWarehouseImage("YE98NO")],
  ),
  "edition-yonex-ezone-100-7-osaka": retailer(
    "https://www.tennis-warehouse.com/learning_center/racquet_reviews/YE100NOreview.html",
    [tennisWarehouseImage("YE100NO")],
  ),
  "edition-yonex-ezone-100l-7-osaka": retailer(
    "https://www.tennis-warehouse.com/learning_center/racquet_reviews/YE100NOreview.html",
    [tennisWarehouseImage("YE100NO")],
  ),
  "edition-yonex-ezone-100sl-7-osaka": retailer(
    "https://www.tennis-warehouse.com/learning_center/racquet_reviews/YE100NOreview.html",
    [tennisWarehouseImage("YE100NO")],
  ),
  "edition-yonex-ezone-98-7-aqua-night-black": retailer(
    "https://www.tennis-warehouse.com/learning_center/racquet_reviews/YEZO98review.html",
    [tennisWarehouseImage("YEZO98")],
  ),
  "edition-yonex-ezone-100-7-aqua-night-black": retailer(
    "https://www.tennis-warehouse.com/learning_center/racquet_reviews/EZOA10review.html",
    [tennisWarehouseImage("EZOA10")],
  ),
  "edition-yonex-ezone-100l-7-aqua-night-black": {
    ...retailer("https://racquetguys.ca/products/yonex-ezone-100l-aqua-black-night-7th-gen"),
    imageLimit: 1,
  },

  "edition-babolat-pure-drive-gen11-wimbledon-2026": retailer(
    "https://www.tennis-warehouse.com/Babolat_Pure_Drive_Wimbledon/descpageRCBAB-BPDW26.html",
    [tennisWarehouseImage("BPDW26")],
  ),
  "edition-head-speed-pro-legend": official("https://www.head.com/en/product/speed-pro-legend-2025-232066"),
  "edition-head-speed-mp-legend": official("https://www.head.com/en_US/product/speed-mp-legend-2025-232076"),
  "edition-head-boom-mp-2024-alternate": retailer("https://www.tenniswarehouse-europe.com/Head_Boom_MP_Alternate_2024_Racket/descpageRCHEAD-BOOMMA-EN.html"),
  "edition-head-boom-mpl-2024-alternate": official(
    "https://www.head.com/en/product/boom-mp-l-alternate-2024-230424",
    ["https://cdn-mdb.head.com/CDN3/D/230424/1/768x768/boom-mp-l-alternate-2024.jpg"],
  ),
  "edition-head-boom-mp-arthur-ashe-2025": official("https://www.head.com/en/product/arthur-ashe-competition-2025-231605"),
  "edition-head-boom-mp-raw-2025": official(
    "https://www.head.com/nl_NL/rs/stories/boom-raw-racquet",
    ["https://mcprod.head.com/media//wysiwyg/01_Bio_Boom_840x460_Article.jpg"],
  ),
  "edition-head-boom-mp-neon-2025": official("https://www.head.com/en/product/boom-mp-neon-2025-231625"),
  "edition-head-boom-mpl-neon-2025": official("https://www.head.com/en_FI/product/boom-mp-l-neon-2025-231655"),
};
