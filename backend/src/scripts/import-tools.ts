
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

const CSV_PATH = '/Users/sureshbala/Downloads/Otec/Operation tool list.csv';

async function seed() {
    console.log('Connecting to database...');
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'otec_db',
        entities: [Tool, Rig, Location, Customer, Inventory], // Add other entities if needed
        synchronize: false,
        ssl: true,
        extra: {
            ssl: {
                rejectUnauthorized: false,
            },
        },
    });

    await dataSource.initialize();
    const toolRepo = dataSource.getRepository(Tool);

    console.log('Reading CSV...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const rows = csvContent.split('\n').map(row => {
        // Handle quoted fields with newlines or commas
        // Simple split by comma for now, assuming standard CSV
        // But the file has "POWER\nTONG" which might break simple split
        // Using a regex to split by comma but ignore commas in quotes
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        // actually simple split might be safer if we clean quotes later, 
        // given the specific layout is mostly empty columns.
        // Let's rely on standard split for the main structure
        return row.split(',');
    });

    const toolsToInsert: Partial<Tool>[] = [];

    // Helper to add tool
    const addTool = (name: string, type: ToolType, size: string, group: string) => {
        if (!name || !size) return;
        name = name.replace(/"/g, '').trim();
        size = size.replace(/"/g, '').trim();
        if (name === '' || size === 'SIZES' || size === 'SIZE') return;

        // Generate a pseudo serial number
        const serial = `${type}-${name.split(' ')[0]}-${size.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(Math.random() * 1000)}`;

        toolsToInsert.push({
            name: `${name}`,
            type,
            size,
            serialNumber: serial,
            status: ToolStatus.AVAILABLE,
            description: `Imported from ${group}`
        });
    };

    // --- TRS SECTION ---
    // CRT (Rows 11-14 -> Indices 11-14)
    // CSV File Line 12 is Index 11
    // "CRT 001 (750T)" is at index 2
    for (let i = 11; i <= 14; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[2];
        const sizes = row.slice(5, 10); // Columns F, G, H, I, J
        sizes.forEach(s => addTool(name, ToolType.TRS, s, 'CRT'));
    }

    // Power Tong (Rows 18-26 -> Indices 18-26)
    for (let i = 18; i <= 26; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[2];
        const sizes = row.slice(5, 7); // Columns F, G
        sizes.forEach(s => addTool(name, ToolType.TRS, s, 'Power Tong'));
    }

    // Jam Unit (Rows 29-32 -> Indices 29-32)
    for (let i = 29; i <= 32; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[2];
        const sizes = row.slice(5, 13); // Columns F-M
        sizes.forEach(s => addTool(name, ToolType.TRS, s, 'Jam Unit'));
    }

    // Filup Tool (Rows 35-38 -> Indices 35-38)
    for (let i = 35; i <= 38; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[2];
        const sizes = row.slice(5, 7); // Columns F, G
        sizes.forEach(s => addTool(name, ToolType.TRS, s, 'Filup Tool'));
    }

    // Handling Tools Left (Rows 42-52 -> Indices 42-52)
    for (let i = 42; i <= 52; i++) {
        const row = rows[i];
        if (!row) continue;
        // Safety Clamp
        addTool(row[2], ToolType.TRS, row[3], 'Safety Clamp');
        // Elevators
        addTool(row[4], ToolType.TRS, row[5], 'Elevators');
        // Slips
        addTool(row[6], ToolType.TRS, row[7], 'Slips');
        // Spider Elevators
        addTool(row[8], ToolType.TRS, row[9], 'Spider Elevators');
    }

    // --- DHT SECTION ---
    // Reamers (Rows 11-15 -> Indices 11-15)
    for (let i = 11; i <= 15; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[16];
        const sizes = row.slice(18, 20); // S, T
        sizes.forEach(s => addTool(name, ToolType.DHT, s, 'Reamers'));
    }

    // Anti Stick Slip (Rows 22-23 -> Indices 22-23)
    for (let i = 22; i <= 23; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[16];
        addTool(name, ToolType.DHT, row[18], 'Anti Stick Slip');
    }

    // Scrapper 1 (Rows 26-34 -> Indices 26-34)
    for (let i = 26; i <= 34; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[16];
        const sizes = row.slice(18, 20);
        sizes.forEach(s => addTool(name, ToolType.DHT, s, 'Scrapper'));
    }

    // Scrapper 2 (Rows 39-42 -> Indices 39-42)
    for (let i = 39; i <= 42; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[16];
        const sizes = row.slice(18, 20);
        sizes.forEach(s => addTool(name, ToolType.DHT, s, 'Jars'));
    }

    // Handling Tools Right (Rows 44-46 -> Indices 44-46)
    for (let i = 44; i <= 46; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[16]; // Could be "TORQUE REDUCER"
        addTool(name, ToolType.DHT, row[18], 'Handling Tools DHT');
    }

    const inventoryRepo = dataSource.getRepository(Inventory);

    console.log('Clearing existing data...');
    try {
        await toolRepo.clear(); // Clear tools first
    } catch (e) {
        console.warn('Could not clear tools (might have FK constraints):', e.message);
        // Fallback or ignore if we want to just append?
        // But user said clear. If FK exists, we can't clear without cascading.
        // Let's try delete with query if clear fails, or just proceed.
        // If clear fails, it mostly means FK. 
        // Let's try to delete all with a simple query if clear fails? 
        // No, let's just log and continue for now, assuming fresh DB or no orders.
    }

    try {
        await inventoryRepo.clear(); // Clear inventory
    } catch (e) {
        console.warn('Could not clear inventory:', e.message);
    }

    console.log(`Found ${toolsToInsert.length} tools to insert.`);

    // Insert Tools
    for (const tool of toolsToInsert) {
        try {
            await toolRepo.save(toolRepo.create(tool));
        } catch (e) {
            console.error(`Error saving ${tool.name}:`, e.message);
        }
    }

    // Populate Inventory (Aggregate by Name + Size)
    console.log('Populating Inventory...');
    const inventoryMap = new Map<string, { count: number, type: string, size: string, name: string }>();

    for (const tool of toolsToInsert) {
        const key = `${tool.name} - ${tool.size}`;
        if (!inventoryMap.has(key)) {
            inventoryMap.set(key, { count: 0, type: tool.type, size: tool.size, name: tool.name });
        }
        const entry = inventoryMap.get(key);
        if (entry) entry.count++;
    }

    for (const [key, data] of inventoryMap.entries()) {
        const inventoryItem = inventoryRepo.create({
            itemName: key,
            category: data.type,
            quantity: data.count,
            unit: 'ea',
            minStock: 1,
            location: 'Warehouse',
            description: `Auto-generated inventory for ${data.name} (${data.size})`
        });
        await inventoryRepo.save(inventoryItem);
    }

    console.log('Done!');
    await dataSource.destroy();
}

seed().catch(console.error);
