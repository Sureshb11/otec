import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'otec_db',
    ssl: process.env.DB_HOST?.includes('azure.com') ? { rejectUnauthorized: false } : false,
});

async function seed() {
    await AppDataSource.initialize();
    console.log('Database connected!');

    // Seed Customers
    const customers = [
        { name: 'Kuwait Oil Company', email: 'ops@koc.com.kw', phone: '+965-2398-5000', address: 'Ahmadi, Kuwait', contactPerson: 'Ahmed Al-Sabah' },
        { name: 'Saudi Aramco', email: 'drilling@aramco.com', phone: '+966-13-876-0000', address: 'Dhahran, Saudi Arabia', contactPerson: 'Mohammed Al-Rashid' },
        { name: 'ADNOC Drilling', email: 'operations@adnoc.ae', phone: '+971-2-602-0000', address: 'Abu Dhabi, UAE', contactPerson: 'Khalid Al-Mazrouei' },
        { name: 'Qatar Petroleum', email: 'drill@qp.com.qa', phone: '+974-4013-2000', address: 'Doha, Qatar', contactPerson: 'Ali Hassan' },
    ];

    for (const customer of customers) {
        await AppDataSource.query(
            `INSERT INTO customers (name, email, phone, address, "contactPerson", "isActive") 
       VALUES ($1, $2, $3, $4, $5, true) 
       ON CONFLICT (email) DO NOTHING`,
            [customer.name, customer.email, customer.phone, customer.address, customer.contactPerson]
        );
    }
    console.log('✓ Customers seeded');

    // Seed Locations
    const locations = [
        { name: 'North Kuwait', country: 'Kuwait', region: 'Northern Fields' },
        { name: 'Burgan Field', country: 'Kuwait', region: 'Southern Fields' },
        { name: 'Ghawar Field', country: 'Saudi Arabia', region: 'Eastern Province' },
        { name: 'Zakum Field', country: 'UAE', region: 'Abu Dhabi Offshore' },
        { name: 'North Field', country: 'Qatar', region: 'Offshore' },
        { name: 'Rumaila Field', country: 'Iraq', region: 'Southern Iraq' },
    ];

    for (const location of locations) {
        await AppDataSource.query(
            `INSERT INTO locations (name, country, region, "isActive") 
       VALUES ($1, $2, $3, true) 
       ON CONFLICT DO NOTHING`,
            [location.name, location.country, location.region]
        );
    }
    console.log('✓ Locations seeded');

    // Get location IDs for rigs
    const locationRows = await AppDataSource.query(`SELECT id, name FROM locations`);
    const locationMap = new Map(locationRows.map((l: any) => [l.name, l.id]));

    // Get customer IDs for rigs
    const customerRows = await AppDataSource.query(`SELECT id, name FROM customers`);
    const customerMap = new Map(customerRows.map((c: any) => [c.name, c.id]));

    // Seed Rigs
    const rigs = [
        { name: 'Rig 101', type: 'TRS', status: 'active', locationName: 'North Kuwait', customerName: 'Kuwait Oil Company' },
        { name: 'Rig 102', type: 'DHT', status: 'active', locationName: 'North Kuwait', customerName: 'Kuwait Oil Company' },
        { name: 'Rig 201', type: 'TRS', status: 'active', locationName: 'Burgan Field', customerName: 'Kuwait Oil Company' },
        { name: 'Rig 301', type: 'DHT', status: 'maintenance', locationName: 'Ghawar Field', customerName: 'Saudi Aramco' },
        { name: 'Rig 401', type: 'TRS', status: 'active', locationName: 'Zakum Field', customerName: 'ADNOC Drilling' },
        { name: 'Rig 501', type: 'DHT', status: 'inactive', locationName: 'North Field', customerName: 'Qatar Petroleum' },
    ];

    for (const rig of rigs) {
        await AppDataSource.query(
            `INSERT INTO rigs (name, type, status, "locationId", "customerId") 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT DO NOTHING`,
            [rig.name, rig.type, rig.status, locationMap.get(rig.locationName), customerMap.get(rig.customerName)]
        );
    }
    console.log('✓ Rigs seeded');

    // Seed Tools
    const tools = [
        { name: 'TRS-500', type: 'TRS', serialNumber: 'TRS-2024-001', size: '7 3/4"', status: 'available' },
        { name: 'TRS-500', type: 'TRS', serialNumber: 'TRS-2024-002', size: '7 3/4"', status: 'onsite' },
        { name: 'TRS-500', type: 'TRS', serialNumber: 'TRS-2024-003', size: '6 1/8"', status: 'available' },
        { name: 'TRS-750', type: 'TRS', serialNumber: 'TRS-2024-004', size: '9 1/2"', status: 'available' },
        { name: 'DHT-350', type: 'DHT', serialNumber: 'DHT-2024-001', size: '6 3/4"', status: 'available' },
        { name: 'DHT-350', type: 'DHT', serialNumber: 'DHT-2024-002', size: '6 3/4"', status: 'onsite' },
        { name: 'DHT-500', type: 'DHT', serialNumber: 'DHT-2024-003', size: '8 1/2"', status: 'maintenance' },
        { name: 'DHT-750', type: 'DHT', serialNumber: 'DHT-2024-004', size: '9 7/8"', status: 'available' },
    ];

    for (const tool of tools) {
        await AppDataSource.query(
            `INSERT INTO tools (name, type, "serialNumber", size, status) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT ("serialNumber") DO NOTHING`,
            [tool.name, tool.type, tool.serialNumber, tool.size, tool.status]
        );
    }
    console.log('✓ Tools seeded');

    // Seed Inventory
    const inventory = [
        { itemName: 'Drill Bit 8.5"', category: 'Drill Bits', quantity: 45, unit: 'pcs', minStock: 10 },
        { itemName: 'Drill Bit 12.25"', category: 'Drill Bits', quantity: 23, unit: 'pcs', minStock: 10 },
        { itemName: 'Mud Motor 6.75"', category: 'Motors', quantity: 12, unit: 'pcs', minStock: 5 },
        { itemName: 'Mud Motor 9.5"', category: 'Motors', quantity: 8, unit: 'pcs', minStock: 5 },
        { itemName: 'Stabilizer 8"', category: 'Stabilizers', quantity: 30, unit: 'pcs', minStock: 15 },
        { itemName: 'Stabilizer 12"', category: 'Stabilizers', quantity: 18, unit: 'pcs', minStock: 10 },
        { itemName: 'MWD Sensor', category: 'Electronics', quantity: 6, unit: 'pcs', minStock: 3 },
        { itemName: 'Battery Pack', category: 'Electronics', quantity: 50, unit: 'pcs', minStock: 20 },
        { itemName: 'O-Ring Kit', category: 'Consumables', quantity: 200, unit: 'kits', minStock: 50 },
        { itemName: 'Lubricant', category: 'Consumables', quantity: 100, unit: 'liters', minStock: 30 },
    ];

    for (const item of inventory) {
        await AppDataSource.query(
            `INSERT INTO inventory ("itemName", category, quantity, unit, "minStock") 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT DO NOTHING`,
            [item.itemName, item.category, item.quantity, item.unit, item.minStock]
        );
    }
    console.log('✓ Inventory seeded');

    await AppDataSource.destroy();
    console.log('\n✅ Seed completed successfully!');
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
