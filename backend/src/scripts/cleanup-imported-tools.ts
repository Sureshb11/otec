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
 * One-off cleanup:
 * - Delete every tool whose description starts with "Imported from "
 *   (these are stale seed rows that are not in OTEC_Tools_Inventory CSV).
 * - Cascading: first remove order_items referencing those tools.
 *
 * Safe to re-run — both operations are idempotent (no-op on empty result).
 */
async function cleanup() {
    await AppDataSource.initialize();
    console.log('✅ DB connected');

    const importedTools: Array<{ id: string; serialNumber: string; name: string }> =
        await AppDataSource.query(
            `SELECT id, "serialNumber", name FROM tools WHERE description LIKE 'Imported from %'`,
        );
    console.log(`Found ${importedTools.length} imported tools to remove`);
    if (importedTools.length === 0) {
        await AppDataSource.destroy();
        return;
    }

    const ids = importedTools.map((t) => t.id);

    const affectedItems = await AppDataSource.query(
        `SELECT id, "orderId", "toolId" FROM order_items WHERE "toolId" = ANY($1::uuid[])`,
        [ids],
    );
    console.log(`Found ${affectedItems.length} order_items referencing these tools`);

    const itemDelete = await AppDataSource.query(
        `DELETE FROM order_items WHERE "toolId" = ANY($1::uuid[])`,
        [ids],
    );
    console.log('Deleted order_items:', itemDelete);

    const toolDelete = await AppDataSource.query(
        `DELETE FROM tools WHERE id = ANY($1::uuid[])`,
        [ids],
    );
    console.log('Deleted tools:', toolDelete);

    await AppDataSource.destroy();
    console.log('✅ Cleanup complete');
}

cleanup().catch((err) => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
});
