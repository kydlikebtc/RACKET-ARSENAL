import rawCatalogModelImages from "./catalog-model-images.json";

export type CatalogModelImageRecord = {
  images: string[];
  sourceUrl: string;
  verifiedAt: string;
  sourceKind: "official-product";
};

export const catalogModelImages = rawCatalogModelImages as Record<string, CatalogModelImageRecord>;
