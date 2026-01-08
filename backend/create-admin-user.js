// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, use environment variables directly
}

const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Default admin user credentials (change these as needed)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@otec.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Admin';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'User';

async function createAdminUser() {
  const host = process.env.DB_HOST || 'otec.postgres.database.azure.com';
  const isAzure = host.includes('database.azure.com');
  
  const client = new Client({
    host: host,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'clouduser',
    password: process.env.DB_PASSWORD || 'Newnalam26',
    database: process.env.DB_DATABASE || 'otec_db',
    ssl: isAzure ? {
      rejectUnauthorized: false,
      require: true,
    } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Hash the password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    console.log('✅ Password hashed');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    let userId;

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists, updating...');
      userId = existingUser.rows[0].id;
      
      // Update user
      await client.query(
        `UPDATE users 
         SET password = $1, "firstName" = $2, "lastName" = $3, "isActive" = true
         WHERE id = $4`,
        [hashedPassword, ADMIN_FIRST_NAME, ADMIN_LAST_NAME, userId]
      );
      console.log('✅ User updated');
    } else {
      // Create new user
      const result = await client.query(
        `INSERT INTO users (email, password, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         RETURNING id`,
        [ADMIN_EMAIL, hashedPassword, ADMIN_FIRST_NAME, ADMIN_LAST_NAME]
      );
      userId = result.rows[0].id;
      console.log('✅ User created');
    }

    // Get admin role ID
    const roleResult = await client.query(
      'SELECT id FROM roles WHERE name = $1',
      ['admin']
    );

    if (roleResult.rows.length === 0) {
      throw new Error('Admin role not found. Please run the roles seed script first.');
    }

    const adminRoleId = roleResult.rows[0].id;

    // Remove existing roles for this user
    await client.query(
      'DELETE FROM user_roles WHERE "userId" = $1',
      [userId]
    );

    // Assign admin role
    await client.query(
      'INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, adminRoleId]
    );
    console.log('✅ Admin role assigned');

    // Verify
    const verifyResult = await client.query(
      `SELECT u.email, u."firstName", u."lastName", r.name as role
       FROM users u
       JOIN user_roles ur ON u.id = ur."userId"
       JOIN roles r ON ur."roleId" = r.id
       WHERE u.id = $1`,
      [userId]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 User Details:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   Name:', `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`);
    console.log('   Roles:', verifyResult.rows.map(r => r.role).join(', '));
    console.log('\n⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminUser();

