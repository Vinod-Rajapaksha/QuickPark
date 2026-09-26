export const SRI_LANKA_PROVINCES = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
] as const;

export type Province = (typeof SRI_LANKA_PROVINCES)[number];

export const PROVINCE_DISTRICTS: Record<Province, readonly string[]> = {
  Western: ["Colombo", "Gampaha", "Kalutara"],
  Central: ["Kandy", "Matale", "Nuwara Eliya"],
  Southern: ["Galle", "Matara", "Hambantota"],
  Northern: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  Eastern: ["Batticaloa", "Ampara", "Trincomalee"],
  "North Western": ["Kurunegala", "Puttalam"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  Uva: ["Badulla", "Monaragala"],
  Sabaragamuwa: ["Ratnapura", "Kegalle"],
};

export const isProvince = (value: string): value is Province =>
  (SRI_LANKA_PROVINCES as readonly string[]).includes(value);

export const getDistrictsForProvince = (province?: string | null): string[] =>
  province && isProvince(province) ? [...PROVINCE_DISTRICTS[province]] : [];

export const isDistrictOfProvince = (province?: string | null, district?: string | null): boolean =>
  !!province && !!district && getDistrictsForProvince(province).includes(district);
