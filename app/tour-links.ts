export type TourCatalogTarget =
  | { kind: "family"; familyId: string }
  | { kind: "racket"; familyId: string; racketId: string };

export const tourCatalogTargets: Record<string, TourCatalogTarget> = {
  "jannik-sinner": { kind: "family", familyId: "head-speed-2026" },
  "alexander-zverev": { kind: "racket", familyId: "head-gravity-2025", racketId: "catalog-head-gravity-2025-gravity-pro" },
  "carlos-alcaraz": { kind: "racket", familyId: "babolat-pure-aero-gen9", racketId: "catalog-babolat-pure-aero-gen9-pure-aero-98-gen9" },
  "felix-auger-aliassime": { kind: "racket", familyId: "babolat-pure-aero-gen9", racketId: "catalog-babolat-pure-aero-gen9-pure-aero-98-gen9" },
  "alex-de-minaur": { kind: "family", familyId: "wilson-ultra-v5" },
  "ben-shelton": { kind: "racket", familyId: "yonex-ezone-8", racketId: "catalog-yonex-ezone-8-ezone-98" },
  "novak-djokovic": { kind: "family", familyId: "head-speed-2026" },
  "daniil-medvedev": { kind: "racket", familyId: "tecnifibre-tfight-2025", racketId: "catalog-tecnifibre-tfight-2025-t-fight-305s" },
  "aryna-sabalenka": { kind: "racket", familyId: "wilson-blade-v10", racketId: "catalog-wilson-blade-v10-blade-98-18x20-v10" },
  "elena-rybakina": { kind: "racket", familyId: "yonex-vcore-8", racketId: "catalog-yonex-vcore-8-vcore-100" },
  "jessica-pegula": { kind: "racket", familyId: "yonex-ezone-8", racketId: "catalog-yonex-ezone-8-ezone-98" },
  "coco-gauff": { kind: "racket", familyId: "head-boom-2026", racketId: "catalog-head-boom-2026-boom-mp" },
  "mirra-andreeva": { kind: "family", familyId: "wilson-blade-v10" },
  "karolina-muchova": { kind: "family", familyId: "head-speed-2026" },
  "linda-noskova": { kind: "racket", familyId: "yonex-ezone-8", racketId: "catalog-yonex-ezone-8-ezone-98" },
  "iga-swiatek": { kind: "racket", familyId: "tecnifibre-tfight-2025", racketId: "catalog-tecnifibre-tfight-2025-t-fight-300s" },
};

export function tourRacketTargetId(playerId: string) {
  const target = tourCatalogTargets[playerId];
  return target?.kind === "racket" ? target.racketId : null;
}
