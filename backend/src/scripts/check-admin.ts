import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

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

async function checkAdmin() {
    console.log('🔍 Checking database connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_DATABASE);

    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected!');

        const adminEmail = 'admin@otec.com';
        const users = await AppDataSource.query(
            `SELECT id, email, "firstName", "lastName", "isActive" FROM users WHERE email = $1`,
            [adminEmail]
        );

        if (users.length > 0) {
            console.log('✅ Admin user found:');
            console.table(users);
            
            // Check roles
            const roles = await AppDataSource.query(
                `SELECT r.name FROM roles r 
                 JOIN user_roles ur ON ur."roleId" = r.id 
                 WHERE ur."userId" = $1`,
                [users[0].id]
            );
            console.log('Roles:', roles.map(r => r.name).join(', '));
        } else {
            console.log('❌ Admin user NOT found!');
            
            // List all users to see what's there
            const allUsers = await AppDataSource.query(`SELECT email FROM users LIMIT 10`);
            if (allUsers.length > 0) {
                console.log('Other users in database:');
                console.table(allUsers);
            } else {
                console.log('The users table is empty.');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await AppDataSource.destroy();
    }
}

checkAdmin();
