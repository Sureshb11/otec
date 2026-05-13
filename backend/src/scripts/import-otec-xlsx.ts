/**
 * Import OTEC inventory from the master XLSX.
 *
 * Wipes orders/order_items/tools/inventory (option A1 — full clean slate)
 * and imports two sheets:
 *   • Equipments_Inventory   → tools
 *   • CONSUMABLE INVENTORY   → inventory
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/import-otec-xlsx.ts <path-to-xlsx> [--apply]
 *
 * Without --apply, it prints what would happen (dry-run).
 * With --apply, it executes the wipe + insert against the configured DB.
 *
 * DB connection comes from env: POSTGRES_URL or DATABASE_URL preferred;
 * falls back to DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE.
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as xlsx from 'xlsx';

import { Tool, ToolType, ToolStatus } from '../tools/tool.entity';
import { Inventory } from '../inventory/inventory.entity';
import { Rig } from '../rigs/rig.entity';
import { Customer } from '../customers/customer.entity';
import { Location } from '../locations/location.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';

config({ path: path.join(__dirname, '../../.env') });

// ───── CLI args ──────────────────────────────────────────────────────────────
const XLSX_PATH = process.argv[2];
const APPLY = process.argv.includes('--apply');

if (!XLSX_PATH || XLSX_PATH.startsWith('--')) {
  console.error('Usage: ts-node import-otec-xlsx.ts <path-to-xlsx> [--apply]');
  process.exit(1);
}
if (!fs.existsSync(XLSX_PATH)) {
  console.error(`File not found: ${XLSX_PATH}`);
  process.exit(1);
}

// ───── Helpers ───────────────────────────────────────────────────────────────
function clean(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\s+/g, ' ').trim();
}

function parseDate(v: any): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return v;
  const s = clean(v);
  if (!s) return null;
  if (/^\d{4,6}$/.test(s)) {
    const n = parseInt(s, 10);
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})$/);
  if (m) {
    const months: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const mo = months[m[2].toLowerCase()];
    if (mo != null) {
      let y = parseInt(m[3], 10);
      if (y < 100) y += 2000;
      const d = new Date(Date.UTC(y, mo, parseInt(m[1], 10)));
      return isNaN(d.getTime()) ? null : d;
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(v: any): number | null {
  const s = clean(v);
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function parseInt0(v: any): number {
  const n = parseNumber(v);
  return n === null ? 0 : Math.max(0, Math.round(n));
}

function forwardFill(rows: any[][], cols: number[]): void {
  const last: Record<number, string> = {};
  for (const row of rows) {
    for (const c of cols) {
      const val = row?.[c];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        last[c] = String(val).trim();
      } else if (last[c] !== undefined) {
        row[c] = last[c];
      }
    }
  }
}

// Map the per-row TOOL value (sheet 1 col 1) to the canonical UI category.
// Anything not matched here gets passed through as-is (capitalized words).
const TOOL_CATEGORY_MAP: Record<string, { type: ToolType; category: string }> = {
  CRT: { type: ToolType.TRS, category: 'CRT' },
  'TORQUE SUB': { type: ToolType.TRS, category: 'Torque Sub' },
  TONGS: { type: ToolType.TRS, category: 'Power Tong' },
  'JAM UNIT': { type: ToolType.TRS, category: 'Jam Unit' },
  HPU: { type: ToolType.TRS, category: 'HPU' },
  'CASING FILLUP & CIRCULATING TOOL': { type: ToolType.TRS, category: 'Filup Tool' },
  'SAFETY CLAMP': { type: ToolType.TRS, category: 'Safety Clamp' },
  'HAND SLIPS': { type: ToolType.TRS, category: 'Slips' },
  ELEVATORS: { type: ToolType.TRS, category: 'Elevators' },
  SPIDER: { type: ToolType.TRS, category: 'Spider Elevators' },
  BUCKING: { type: ToolType.TRS, category: 'Bucking' },
  REAMERS: { type: ToolType.DHT, category: 'Reamers' },
  'VIBRATION REDUCTION TOOL': { type: ToolType.DHT, category: 'Anti Stick Slip' },
  'DRILLING JARS': { type: ToolType.DHT, category: 'Jars' },
  'CASING SCRAPPER': { type: ToolType.DHT, category: 'Scrapper' },
  'PBL SUB': { type: ToolType.DHT, category: 'PBL Sub' },
  'TORQUE REDUCER': { type: ToolType.DHT, category: 'Torque Reducer' },
};

function resolveToolCategory(
  topCategory: string,
  toolField: string,
): { type: ToolType; category: string } {
  const key = toolField.toUpperCase().trim();
  if (TOOL_CATEGORY_MAP[key]) return TOOL_CATEGORY_MAP[key];
  const type = topCategory.toUpperCase() === 'DHT' ? ToolType.DHT : ToolType.TRS;
  return { type, category: toolField || 'Other' };
}

// ───── Parse Equipments_Inventory ────────────────────────────────────────────
function parseToolsSheet(ws: xlsx.WorkSheet): Partial<Tool>[] {
  const rows = xlsx.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null, raw: false });
  // Header is on r2 (index 1); data starts at r3 (index 2)
  const data = rows.slice(2);
  forwardFill(data, [0, 1]);

  const tools: Partial<Tool>[] = [];
  for (const r of data) {
    const itemCode = clean(r?.[2]);
    if (!itemCode) continue;

    const topCategory = clean(r[0]);
    const toolField = clean(r[1]);
    const { type, category } = resolveToolCategory(topCategory, toolField);

    const partNo = clean(r[3]);
    const description = clean(r[4]);
    const size = clean(r[5]);
    const sn = clean(r[6]);
    const receivedDate = parseDate(r[8]);
    const poNumber = clean(r[9]);
    const invoiceNumber = clean(r[10]);
    const manufacturer = clean(r[11]);
    const hsCode = clean(r[12]);
    const netWeight = parseNumber(r[13]);
    const country = clean(r[15]);
    const cooNumber = clean(r[16]);
    const uom = clean(r[17]);
    const catalogue = clean(r[18]).toLowerCase() === 'yes';

    tools.push({
      name: description || `${category} ${partNo || itemCode}`.trim(),
      type,
      category,
      serialNumber: itemCode,
      manufacturerSn: sn || null,
      size: size || null,
      status: ToolStatus.AVAILABLE,
      description: description || null,
      partNo: partNo || null,
      manufacturer: manufacturer || null,
      country: country || null,
      hsCode: hsCode || null,
      cooNumber: cooNumber || null,
      netWeight: netWeight ?? null,
      receivedDate: receivedDate || null,
      invoiceNumber: invoiceNumber || null,
      poNumber: poNumber || null,
      uom: uom || null,
      catalogue,
    });
  }
  return tools;
}

// ───── Parse CONSUMABLE INVENTORY ────────────────────────────────────────────
function parseConsumablesSheet(ws: xlsx.WorkSheet): Partial<Inventory>[] {
  const rows = xlsx.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null, raw: false });
  const data = rows.slice(2);
  forwardFill(data, [0, 1]);

  const items: Partial<Inventory>[] = [];
  for (const r of data) {
    const description = clean(r?.[4]);
    if (!description) continue;

    const categories = clean(r[0]);
    const typeField = clean(r[1]);
    const itemCode = clean(r[2]);
    const partNo = clean(r[3]);
    const qty = parseInt0(r[5]);
    const sn = clean(r[6]);
    const poNumber = clean(r[8]);
    const invoiceNumber = clean(r[9]);
    const manufacturer = clean(r[10]);
    const hsCode = clean(r[11]);
    const country = clean(r[13]);
    const cooNumber = clean(r[14]);
    const unit = clean(r[15]) || 'pcs';

    const descParts: string[] = [];
    if (partNo) descParts.push(`Part No: ${partNo}`);
    if (itemCode) descParts.push(`Item Code: ${itemCode}`);
    if (sn) descParts.push(`SN: ${sn}`);
    if (manufacturer) descParts.push(`Mfr: ${manufacturer}`);
    if (poNumber) descParts.push(`PO: ${poNumber}`);
    if (invoiceNumber) descParts.push(`Invoice: ${invoiceNumber}`);
    if (hsCode) descParts.push(`HS Code: ${hsCode}`);
    if (country) descParts.push(`Country: ${country}`);
    if (cooNumber) descParts.push(`COO: ${cooNumber}`);

    items.push({
      itemName: description,
      category: categories || 'Uncategorised',
      subCategory: typeField || null,
      quantity: qty,
      unit,
      minStock: 0,
      location: 'Warehouse',
      description: descParts.join(' · ') || null,
    });
  }
  return items;
}

// ───── DataSource factory ────────────────────────────────────────────────────
function buildDataSource(): DataSource {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  const common = {
    type: 'postgres' as const,
    entities: [Tool, Rig, Location, Customer, Inventory, Order, OrderItem],
    synchronize: false,
    ssl: { rejectUnauthorized: false } as const,
  };
  if (url) return new DataSource({ ...common, url });
  return new DataSource({
    ...common,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'otec_db',
    ssl:
      process.env.DB_HOST?.includes('azure.com') || process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : (false as any),
  });
}

// ───── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Reading XLSX: ${XLSX_PATH}`);
  const wb = xlsx.readFile(XLSX_PATH);

  if (!wb.SheetNames.includes('Equipments_Inventory')) {
    throw new Error('Sheet "Equipments_Inventory" not found');
  }
  if (!wb.SheetNames.includes('CONSUMABLE INVENTORY')) {
    throw new Error('Sheet "CONSUMABLE INVENTORY" not found');
  }

  const tools = parseToolsSheet(wb.Sheets['Equipments_Inventory']);
  const consumables = parseConsumablesSheet(wb.Sheets['CONSUMABLE INVENTORY']);

  // De-dup: the source Excel has some rows with the same OTEC item code but
  // different sizes/PNs (12 known cases). To preserve every row, append a
  // numeric suffix to the 2nd+ occurrences so the unique constraint is happy.
  const seen = new Map<string, number>();
  const dups: string[] = [];
  for (const t of tools) {
    const base = (t.serialNumber || '').toUpperCase();
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    if (count > 1) {
      dups.push(`${base} → ${base}-DUP${count - 1}`);
      t.serialNumber = `${t.serialNumber}-DUP${count - 1}`;
    }
  }

  // Summarise
  console.log('\n──── Dry-run summary ────');
  console.log(`Parsed ${tools.length} tools from Equipments_Inventory.`);
  const byCat: Record<string, number> = {};
  for (const t of tools) {
    const k = `${t.type} / ${t.category}`;
    byCat[k] = (byCat[k] || 0) + 1;
  }
  for (const [k, v] of Object.entries(byCat).sort()) {
    console.log(`  ${k.padEnd(35, ' ')} ${v}`);
  }
  if (dups.length) {
    console.warn('\n⚠ Duplicate serial numbers in sheet (auto-suffixed to make them unique):');
    for (const d of dups) console.warn(`  ${d}`);
    console.warn("  → please clean the source sheet so future re-runs don't need suffixes.");
  }

  console.log(`\nParsed ${consumables.length} consumable items.`);
  const byCons: Record<string, number> = {};
  for (const c of consumables) {
    const k = `${c.category} / ${c.subCategory ?? '—'}`;
    byCons[k] = (byCons[k] || 0) + 1;
  }
  for (const [k, v] of Object.entries(byCons).sort()) {
    console.log(`  ${k.padEnd(35, ' ')} ${v}`);
  }

  console.log('\nFirst 3 tools to insert:');
  console.log(JSON.stringify(tools.slice(0, 3), null, 2));
  console.log('\nFirst 3 consumables to insert:');
  console.log(JSON.stringify(consumables.slice(0, 3), null, 2));

  if (!APPLY) {
    console.log('\n— Dry run only. Re-run with --apply to execute against the configured DB.');
    return;
  }

  console.log('\n──── APPLYING ────');
  const dataSource = buildDataSource();
  await dataSource.initialize();
  console.log('Connected.');

  await dataSource.transaction(async (mgr) => {
    console.log('Wiping: order_items, orders, tools, inventory ...');
    // Order matters: order_items references orders + tools; tools is referenced by order_items
    await mgr.query('DELETE FROM order_items');
    await mgr.query('DELETE FROM orders');
    await mgr.query('DELETE FROM tools');
    await mgr.query('DELETE FROM inventory');

    console.log(`Inserting ${tools.length} tools ...`);
    for (const t of tools) {
      await mgr.getRepository(Tool).save(mgr.getRepository(Tool).create(t));
    }

    console.log(`Inserting ${consumables.length} consumables ...`);
    for (const c of consumables) {
      await mgr.getRepository(Inventory).save(mgr.getRepository(Inventory).create(c));
    }
  });

  await dataSource.destroy();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
