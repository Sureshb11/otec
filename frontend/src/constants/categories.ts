// ─── Shared tool category definitions ────────────────────────────────────────
// Single source of truth used by both Dashboard (Equipment Fleet tiles) and
// Inventory (category breakdown sidebar). Keeping these here prevents the two
// pages from drifting apart — any category added to TRS_CATEGORIES /
// DHT_CATEGORIES automatically shows up on both screens.

export const TRS_CATEGORIES: string[] = [
  'CRT',
  'Torque Sub',
  'Power Tong',
  'Jam Unit',
  'HPU',
  'Filup Tool',
  'Safety Clamp',
  'Elevators',
  'Slips',
  'Spider Elevators',
];

export const DHT_CATEGORIES: string[] = [
  'Bucking',
  'Reamers',
  'Anti Stick Slip',
  'Scrapper',
  'Jars',
  'Circulating DHT',
];

// Display labels (upper-cased, abbreviated where the raw category is long).
// Falls back to the raw category string for anything not listed.
export const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  'CRT': 'CRT',
  'Torque Sub': 'TORQUE SUB',
  'Power Tong': 'POWER TONG',
  'Jam Unit': 'JAM UNIT',
  'HPU': 'HPU',
  'Filup Tool': 'FILUP TOOL',
  'Safety Clamp': 'SAFETY CLAMP',
  'Elevators': 'ELEVATORS',
  'Slips': 'SLIPS',
  'Spider Elevators': 'SPIDER ELEVATORS',
  'Bucking': 'BUCKING',
  'Reamers': 'REAMERS',
  'Anti Stick Slip': 'ANTI STICK SLIP',
  'Scrapper': 'SCRAPPER',
  'Jars': 'JARS',
  'Circulating DHT': 'CIRCULATING',
};

export const displayCategory = (cat: string): string =>
  CATEGORY_DISPLAY_MAP[cat] || cat;
