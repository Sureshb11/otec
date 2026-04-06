import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import * as bcrypt from 'bcryptjs';

// Load environment variables from backend/.env
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

async function resetAdmin() {
    console.log('🔄 Resetting admin password...');
    
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected!');

        const adminEmail = 'admin@otec.com';
        const newPassword = 'admin123!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await AppDataSource.query(
            `UPDATE users SET password = $1 WHERE email = $2`,
            [hashedPassword, adminEmail]
        );

        console.log('✅ Admin password has been reset to:', newPassword);
        console.log('Please try logging in again.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await AppDataSource.destroy();
    }
}

resetAdmin();
