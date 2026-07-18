import rawPurchaseLinkHealth from "./purchase-link-health.json";

export type PurchaseLinkHealthStatus = "ok" | "changed" | "broken";

export type PurchaseLinkHealthRecord = {
  url: string;
  status: PurchaseLinkHealthStatus;
  httpStatus: number | null;
  finalUrl?: string;
  checkedAt: string;
};

export const purchaseLinkHealth = rawPurchaseLinkHealth as Record<
  string,
  PurchaseLinkHealthRecord
>;
