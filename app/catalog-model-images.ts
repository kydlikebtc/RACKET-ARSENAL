import rawCatalogModelImages from "./catalog-model-images.json";
import type { CatalogImageSourceKind } from "./catalog-image-sources";

export type CatalogModelImageRecord = {
  images: string[];
  sourceUrl: string;
  verifiedAt: string;
  sourceKind: CatalogImageSourceKind;
};

export const catalogModelImages = rawCatalogModelImages as Record<string, CatalogModelImageRecord>;
