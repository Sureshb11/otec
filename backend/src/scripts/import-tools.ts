import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { Tool, ToolType, ToolStatus } from '../tools/tool.entity';
import { config } from 'dotenv';
import { Rig } from '../rigs/rig.entity';
import { Location } from '../locations/location.entity';
import { Customer } from '../customers/customer.entity';
import { Inventory } from '../inventory/inventory.entity';

// Load env vars
config({ path: path.join(__dirname, '../../.env') });

// Default path can be overridden via CLI arg
const CSV_PATH =
    process.argv[2] ||
    '/Users/sureshbala/Documents/OTEC_Tools_Inventory.xlsx - Equipments_Inventory.csv';

// ─── CSV parser (handles quoted fields with commas) ────────────────────────────
function parseCsv(content: string): string[][] {
    const rows: string[][] = [];
    let cur: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < content.length; i++) {
        const c = content[i];
        if (inQuotes) {
            if (c === '"') {
                if (content[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else {
            if (c === '"') {
                inQuotes = true;
            } else if (c === ',') {
                cur.push(field);
                field = '';
            } else if (c === '\n' || c === '\r') {
                if (c === '\r' && content[i + 1] === '\n') i++;
                cur.push(field);
                rows.push(cur);
                cur = [];
                field = '';
            } else {
                field += c;
            }
        }
    }
    if (field.length > 0 || cur.length > 0) {
        cur.push(field);
        rows.push(cur);
    }
    return rows;
}

// ─── Sub-category → display category mapping ──────────────────────────────────
// Maps the second column of the CSV to the canonical UI category name.
const SUBCATEGORY_MAP: Record<string, { type: ToolType; category: string }> = {
    CRT: { type: ToolType.TRS, category: 'CRT' },
    TTS: { type: ToolType.TRS, category: 'Torque Sub' },
    TONGS: { type: ToolType.TRS, category: 'Power Tong' },
    'JAM UNIT': { type: ToolType.TRS, category: 'Jam Unit' },
    HPU: { type: ToolType.TRS, category: 'HPU' },
    'CASING FILLUP & CIRCULATING TOOL': { type: ToolType.TRS, category: 'Filup Tool' },
    'SAFETY CLAMP': { type: ToolType.TRS, category: 'Safety Clamp' },
    'HAND SLIPS': { type: ToolType.TRS, category: 'Slips' },
    ELEVATORS: { type: ToolType.TRS, category: 'Elevators' },
    SPIDER: { type: ToolType.TRS, category: 'Spider Elevators' },
    BUCKING: { type: ToolType.DHT, category: 'Bucking' },
    REAMERS: { type: ToolType.DHT, category: 'Reamers' },
    'VIBRATION REDUCTION TOOL': { type: ToolType.DHT, category: 'Anti Stick Slip' },
    'DRILLING JARS': { type: ToolType.DHT, category: 'Jars' },
    'CASING SCRAPPER': { type: ToolType.DHT, category: 'Scrapper' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clean(v: string | undefined): string {
    return (v ?? '').replace(/\s+/g, ' ').trim();
}

function parseDate(v: string | undefined): Date | null {
    const s = clean(v);
    if (!s) return null;
    // Excel serial number (e.g. 46091)
    if (/^\d{4,6}$/.test(s)) {
        const n = parseInt(s, 10);
        // Excel epoch is 1899-12-30 (accounting for the 1900 leap-year bug)
        const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
        if (!isNaN(d.getTime())) return d;
    }
    // dd/Mon/yy e.g. 11/Mar/26
    const m = s.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})$/);
    if (m) {
        const months: Record<string, number> = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };
        const month = months[m[2].toLowerCase()];
        if (month != null) {
            let year = parseInt(m[3], 10);
            if (year < 100) year += 2000;
            const d = new Date(Date.UTC(year, month, parseInt(m[1], 10)));
            if (!isNaN(d.getTime())) return d;
        }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

function parseNumber(v: string | undefined): number | null {
    const s = clean(v);
    if (!s) return null;
    const n = parseFloat(s.replace(/,/g, ''));
    return isNaN(n) ? null : n;
}

// Eighths-fraction suffixes that can appear in OTEC item codes (e.g. 38 = 3/8).
const EIGHTHS: Record<string, string> = {
    '18': '1/8', '14': '1/4', '38': '3/8', '12': '1/2',
    '58': '5/8', '34': '3/4', '78': '7/8',
};

// Try to extract a size token from a tool description.
// Prefers explicit inch marks (e.g. 13-3/8", 4 1/2", 6-1/2"); falls back to
// tonnage like 750T from the description or item code. Returns '' otherwise.
function extractSize(description: string, itemCode: string): string {
    if (description) {
        // Inch sizes with explicit " mark. Captures forms like:
        //   13-3/8"   4 1/2"   18-5/8"   7 3/4"   5"
        const inch = description.match(/(\d{1,2}(?:[-\s]\d{1,2}\/\d{1,2})?|\d{1,2}\/\d{1,2})\s*"/);
        if (inch) return inch[1].replace('-', ' ').replace(/\s+/g, ' ').trim() + '"';

        // Tonnage in description (e.g. 750T, 350T, 200T)
        const ton = description.match(/\b(\d{2,4})T\b/);
        if (ton) return ton[1] + 'T';
    }
    // Fallback: parse from item code. Examples:
    //   OTEC-CRT-0750-001  → 750T (tonnage)
    //   OTEC-CFT-0758-004  → 7 5/8" (inch + 8ths)
    //   OTEC-CFT-1034-003  → 10 3/4"
    //   OTEC-HSL-0007-001  → 7"
    //   OTEC-PT24-100K-001 → 100K (torque)
    // Tolerate stray spaces inside the code (e.g. "OTEC-CFT-1338 -001").
    const normalized = itemCode.replace(/\s+/g, '');
    const codeMatch = normalized.match(/-(\d{3,4}|C\d{3,4}|\d{1,3}K)-\d+$/);
    if (codeMatch) {
        const raw = codeMatch[1];
        // Torque suffix like 100K, 80K
        if (/K$/.test(raw)) return raw;

        // Strip optional "C" (chrome variant)
        const isChrome = raw.startsWith('C');
        const digits = isChrome ? raw.slice(1) : raw;
        const prefix = isChrome ? 'C ' : '';

        if (digits.length === 4) {
            const head = digits.slice(0, 2);
            const tail = digits.slice(2);
            if (head === '00') {
                // 0007 → 7", 0005 → 5"
                const inches = parseInt(tail, 10);
                return `${prefix}${inches}"`;
            }
            if (EIGHTHS[tail]) {
                // 0758 → 7 5/8", 1034 → 10 3/4"
                const inches = parseInt(head, 10);
                return `${prefix}${inches} ${EIGHTHS[tail]}"`;
            }
            // Tonnage: 0750 → 750T, 0450 → 450T
            return `${parseInt(digits, 10)}T`;
        }
        // 3-digit fallback (e.g. 350) → tonnage
        return `${parseInt(digits, 10)}T`;
    }
    return '';
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
    console.log('Connecting to database...');
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'otec_db',
        entities: [Tool, Rig, Location, Customer, Inventory],
        synchronize: true, // ensure new columns are created
        ssl: process.env.DB_HOST?.includes('azure.com') || process.env.DB_SSL === 'true'
            ? { rejectUnauthorized: false }
            : false,
    });

    await dataSource.initialize();
    const toolRepo = dataSource.getRepository(Tool);
    const inventoryRepo = dataSource.getRepository(Inventory);

    console.log(`Reading CSV from ${CSV_PATH} ...`);
    if (!fs.existsSync(CSV_PATH)) {
        throw new Error(`CSV not found at ${CSV_PATH}`);
    }
    const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf-8'));

    // Walk rows. Track sticky division (col 0) and sub-category (col 1).
    let currentDivision = '';
    let currentSubCat = '';
    const toolsToInsert: Partial<Tool>[] = [];

    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const division = clean(row[0]);
        const subCat = clean(row[1]);
        if (division) currentDivision = division;
        if (subCat) currentSubCat = subCat;

        const itemCode = clean(row[2]);
        if (!itemCode) continue; // skip blank/separator rows

        const lookupKey = currentSubCat.toUpperCase();
        const mapping = SUBCATEGORY_MAP[lookupKey];
        if (!mapping) {
            console.warn(`Skipping ${itemCode}: unknown sub-category "${currentSubCat}"`);
            continue;
        }

        const partNo = clean(row[3]);
        const description = clean(row[4]);
        const sn = clean(row[5]);
        const receivedDate = parseDate(row[6]);
        const poNumber = clean(row[7]);
        const invoiceNumber = clean(row[8]);
        const manufacturer = clean(row[9]);
        const hsCode = clean(row[10]);
        const netWeight = parseNumber(row[11]);
        // row[12] = Certificate Of Conformance (often duplicates SN, skip)
        const country = clean(row[13]);
        const cooNumber = clean(row[14]);
        const uom = clean(row[15]);
        const catalogue = clean(row[16]).toLowerCase() === 'yes';

        // Pick a sensible "name" — strip the size off the description if present
        const nameSource = description || `${mapping.category} ${partNo}`.trim() || itemCode;
        const size = extractSize(description, itemCode);

        toolsToInsert.push({
            name: nameSource,
            type: mapping.type,
            serialNumber: itemCode, // OTEC item code is the unique asset id
            manufacturerSn: sn || null,
            size: size || null,
            status: ToolStatus.AVAILABLE,
            description: description || null,
            category: mapping.category,
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

    console.log(`Parsed ${toolsToInsert.length} tools from CSV.`);

    // Wipe existing tool/inventory rows so re-runs are idempotent.
    // Tools referenced by order_items must be preserved (FK constraint).
    console.log('Clearing existing tools and inventory...');
    try {
        await dataSource.query(
            'DELETE FROM tool_instances WHERE "toolId" NOT IN (SELECT DISTINCT "toolId" FROM order_items WHERE "toolId" IS NOT NULL)'
        );
    } catch (e) {
        // tool_instances or order_items table may not exist
    }
    try {
        const result = await dataSource.query(
            'DELETE FROM tools WHERE id NOT IN (SELECT DISTINCT "toolId" FROM order_items WHERE "toolId" IS NOT NULL)'
        );
        console.log(`Cleared ${result[1] ?? 0} unreferenced tools (kept order-linked ones).`);
    } catch (e) {
        console.warn('Could not delete tools:', (e as Error).message);
    }
    try {
        await dataSource.query('DELETE FROM inventory');
    } catch (e) {
        console.warn('Could not delete inventory:', (e as Error).message);
    }

    // Avoid serialNumber collisions with retained order-linked tools.
    const existingSerials = new Set<string>(
        (await dataSource.query('SELECT "serialNumber" FROM tools')).map((r: any) => r.serialNumber)
    );
    const beforeFilter = toolsToInsert.length;
    for (let i = toolsToInsert.length - 1; i >= 0; i--) {
        if (existingSerials.has(toolsToInsert[i].serialNumber!)) {
            toolsToInsert.splice(i, 1);
        }
    }
    if (beforeFilter !== toolsToInsert.length) {
        console.log(
            `Skipped ${beforeFilter - toolsToInsert.length} tool(s) whose serial already exists in DB.`
        );
    }

    console.log('Inserting tools...');
    let inserted = 0;
    for (const t of toolsToInsert) {
        try {
            await toolRepo.save(toolRepo.create(t));
            inserted++;
        } catch (e) {
            console.error(`Error saving ${t.serialNumber}:`, (e as Error).message);
        }
    }
    console.log(`✓ Inserted ${inserted} tools.`);

    // Aggregate inventory rows by (category, name, size)
    console.log('Building inventory aggregates...');
    type AggKey = string;
    const agg = new Map<
        AggKey,
        {
            name: string;
            size: string;
            type: ToolType;
            category: string;
            count: number;
            uom: string;
        }
    >();

    for (const t of toolsToInsert) {
        const key = `${t.category}||${t.name}||${t.size ?? ''}`;
        const existing = agg.get(key);
        if (existing) {
            existing.count++;
        } else {
            agg.set(key, {
                name: t.name!,
                size: t.size ?? '',
                type: t.type!,
                category: t.category!,
                count: 1,
                uom: t.uom ?? 'EACH',
            });
        }
    }

    let invInserted = 0;
    for (const data of agg.values()) {
        const item = inventoryRepo.create({
            itemName: data.name,
            category: data.type, // TRS / DHT
            subCategory: data.category, // CRT, Power Tong, HPU, ...
            quantity: data.count,
            unit: data.size || data.uom,
            minStock: 1,
            location: 'Warehouse',
            description: `Imported from ${data.category}`,
        });
        try {
            await inventoryRepo.save(item);
            invInserted++;
        } catch (e) {
            console.error(`Error saving inventory ${data.name}:`, (e as Error).message);
        }
    }
    console.log(`✓ Inserted ${invInserted} inventory aggregates.`);

    await dataSource.destroy();
    console.log('Done!');
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
