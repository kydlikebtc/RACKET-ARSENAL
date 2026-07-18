export type BrandProfile = {
  logo: string;
  officialDomain: string;
  sourcePage: string;
  assetSource: string;
  verifiedAt: string;
  accent: string;
};

export const catalogBrandProfiles = {
  Wilson: {
    logo: "/brands/wilson.svg",
    officialDomain: "wilson.com",
    sourcePage: "https://www.wilson.com/en-us",
    assetSource: "https://commons.wikimedia.org/wiki/File:Wilson-logo.svg",
    verifiedAt: "2026-07-18",
    accent: "#d71920",
  },
  Yonex: {
    logo: "/brands/yonex.svg",
    officialDomain: "yonex.com",
    sourcePage: "https://www.yonex.com/",
    assetSource: "https://www.yonex.com/static/version1783352932/frontend/Yonex/base/en_US/images/Yonex_Logo.svg",
    verifiedAt: "2026-07-18",
    accent: "#0073b9",
  },
  Babolat: {
    logo: "/brands/babolat.svg",
    officialDomain: "babolat.com",
    sourcePage: "https://www.babolat.com/us",
    assetSource: "https://www.babolat.com/on/demandware.static/Sites-babolatus-Site/-/default/dw9ba8d8d8/images/logo.svg",
    verifiedAt: "2026-07-18",
    accent: "#111e6c",
  },
  HEAD: {
    logo: "/brands/head.svg",
    officialDomain: "head.com",
    sourcePage: "https://www.head.com/en/",
    assetSource: "https://www.head.com/en/",
    verifiedAt: "2026-07-18",
    accent: "#231f20",
  },
  Tecnifibre: {
    logo: "/brands/tecnifibre.svg",
    officialDomain: "tecnifibre.com",
    sourcePage: "https://www.tecnifibre.com/",
    assetSource: "https://commons.wikimedia.org/wiki/File:Tecnifibre_logo.svg",
    verifiedAt: "2026-07-18",
    accent: "#e30613",
  },
  Dunlop: {
    logo: "/brands/dunlop.png",
    officialDomain: "dunlopsports.com",
    sourcePage: "https://dunlopsports.com/",
    assetSource: "https://commons.wikimedia.org/wiki/File:Dunlop_sport_logo.png",
    verifiedAt: "2026-07-18",
    accent: "#e5b200",
  },
  "Völkl": {
    logo: "/brands/volkl.jpg",
    officialDomain: "volkltennis.com",
    sourcePage: "https://www.volkltennis.com/",
    assetSource: "https://www.volkltennis.com/cdn/shop/files/VolklLogo.jpg?v=1614286965&width=1641",
    verifiedAt: "2026-07-18",
    accent: "#f7e600",
  },
  Prince: {
    logo: "/brands/prince.svg",
    officialDomain: "princetennis.jp",
    sourcePage: "https://princetennis.jp/",
    assetSource: "https://commons.wikimedia.org/wiki/File:Prince_Sports_logo.svg",
    verifiedAt: "2026-07-18",
    accent: "#111111",
  },
  Solinco: {
    logo: "/brands/solinco.png",
    officialDomain: "solincosports.com",
    sourcePage: "https://solincosports.com/",
    assetSource: "https://solincosports.com/wp-content/uploads/2021/02/SOL_WDMRK_PRFM_BK_RGB_XL-1200x149.png",
    verifiedAt: "2026-07-18",
    accent: "#ed1c24",
  },
  ProKennex: {
    logo: "/brands/prokennex.png",
    officialDomain: "prokennex.com",
    sourcePage: "https://prokennex.com/",
    assetSource: "https://prokennex.com/cdn/shop/files/kennexlogo-black-white.png?v=1725403466&width=573",
    verifiedAt: "2026-07-18",
    accent: "#111111",
  },
  Diadem: {
    logo: "/brands/diadem.png",
    officialDomain: "diademsports.com",
    sourcePage: "https://diademsports.com/",
    assetSource: "https://diademsports.com/cdn/shop/files/diadem_logo_300_teal.avif?v=1770758807&width=500",
    verifiedAt: "2026-07-18",
    accent: "#0098a6",
  },
} as const satisfies Record<string, BrandProfile>;

export type CatalogBrand = keyof typeof catalogBrandProfiles;

export function catalogBrandProfile(brand: string) {
  return catalogBrandProfiles[brand as CatalogBrand];
}
