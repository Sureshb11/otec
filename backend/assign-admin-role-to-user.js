// Assign admin role to a specific user
// Usage: node assign-admin-role-to-user.js admin@otec.com

// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, use environment variables directly
}

const { Client } = require('pg');

async function assignAdminRole() {
  const email = process.argv[2] || 'admin@otec.com';
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
    console.log(`\n📧 Assigning admin role to: ${email}\n`);

    // Get user
    const userResult = await client.query(
      'SELECT id, email, "firstName", "lastName" FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.error(`❌ User with email ${email} not found!`);
      console.log('\n💡 Creating user first...');
      
      // Create user if doesn't exist
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const createResult = await client.query(
        `INSERT INTO users (email, password, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         RETURNING id`,
        [email, hashedPassword, 'Admin', 'User']
      );
      const userId = createResult.rows[0].id;
      console.log('✅ User created');
      
      // Get admin role
      const roleResult = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        ['admin']
      );

      if (roleResult.rows.length === 0) {
        throw new Error('Admin role not found. Please run the roles seed script first.');
      }

      const adminRoleId = roleResult.rows[0].id;

      // Assign admin role
      await client.query(
        'INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, adminRoleId]
      );
      console.log('✅ Admin role assigned');
      
    } else {
      const userId = userResult.rows[0].id;
      console.log(`✅ User found: ${userResult.rows[0].firstName} ${userResult.rows[0].lastName}`);

      // Get admin role
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
      console.log('✅ Existing roles removed');

      // Assign admin role
      await client.query(
        'INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, adminRoleId]
      );
      console.log('✅ Admin role assigned');
    }

    // Verify
    const verifyResult = await client.query(
      `SELECT u.email, u."firstName", u."lastName", r.name as role
       FROM users u
       JOIN user_roles ur ON u.id = ur."userId"
       JOIN roles r ON ur."roleId" = r.id
       WHERE u.email = $1`,
      [email]
    );

    console.log('\n✅ Success!');
    console.log('\n📋 User Details:');
    console.log('   Email:', verifyResult.rows[0].email);
    console.log('   Name:', `${verifyResult.rows[0].firstName} ${verifyResult.rows[0].lastName}`);
    console.log('   Roles:', verifyResult.rows.map(r => r.role).join(', '));
    console.log('\n💡 Next steps:');
    console.log('   1. Log out of the application');
    console.log('   2. Log back in with your credentials');
    console.log('   3. You should now have access to the Users page');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

assignAdminRole();

