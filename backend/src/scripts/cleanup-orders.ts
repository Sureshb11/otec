import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'otec_db',
    ssl: process.env.DB_HOST?.includes('neon.tech') || process.env.DB_HOST?.includes('azure.com') ? { rejectUnauthorized: false } : false,
});

/**
 * One-off cleanup: delete all existing orders (mock/test data).
 * Cascades: removes order_items first, then orders.
 */
async function cleanup() {
    await AppDataSource.initialize();
    console.log('✅ DB connected');

    const orders: Array<{ id: string; orderNumber: string; status: string }> =
        await AppDataSource.query(`SELECT id, "orderNumber", status FROM orders`);
    console.log(`Found ${orders.length} orders to remove`);
    if (orders.length === 0) {
        await AppDataSource.destroy();
        return;
    }

    const itemDelete = await AppDataSource.query(`DELETE FROM order_items`);
    console.log('Deleted order_items:', itemDelete);

    const orderDelete = await AppDataSource.query(`DELETE FROM orders`);
    console.log('Deleted orders:', orderDelete);

    await AppDataSource.destroy();
    console.log('✅ Cleanup complete');
}

cleanup().catch((err) => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
});
