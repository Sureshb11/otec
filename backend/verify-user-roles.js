// Verify user roles in the database
// Run: node verify-user-roles.js

// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, use environment variables directly
}

const { Client } = require('pg');

async function verifyUserRoles() {
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
    console.log('✅ Connected to database\n');

    // Get email from command line argument or use default
    const email = process.argv[2] || 'admin@otec.com';
    console.log(`Checking roles for user: ${email}\n`);

    // Get user with roles
    const userResult = await client.query(
      `SELECT u.id, u.email, u."firstName", u."lastName", 
              r.id as role_id, r.name as role_name, r.description as role_description
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur."userId"
       LEFT JOIN roles r ON ur."roleId" = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }

    const userId = userResult.rows[0].id;
    const roles = userResult.rows
      .filter(row => row.role_name) // Filter out null roles
      .map(row => ({
        id: row.role_id,
        name: row.role_name,
        description: row.role_description,
      }));

    console.log('📋 User Details:');
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${userResult.rows[0].email}`);
    console.log(`   Name: ${userResult.rows[0].firstName} ${userResult.rows[0].lastName}`);
    console.log(`   Roles: ${roles.length > 0 ? roles.map(r => r.name).join(', ') : 'None'}`);
    
    if (roles.length === 0) {
      console.log('\n⚠️  WARNING: User has no roles assigned!');
    } else {
      console.log('\n📝 Role Details:');
      roles.forEach(role => {
        console.log(`   - ${role.name}: ${role.description || 'No description'}`);
      });
    }

    // Check if user has admin role
    const hasAdmin = roles.some(r => r.name === 'admin');
    console.log(`\n${hasAdmin ? '✅' : '❌'} Admin Role: ${hasAdmin ? 'YES' : 'NO'}`);

    if (!hasAdmin) {
      console.log('\n💡 To assign admin role, run:');
      console.log('   node create-admin-user.js');
      console.log('   OR use the SQL script: backend/assign-admin-role.sql');
    }

    // List all available roles
    const allRolesResult = await client.query('SELECT * FROM roles ORDER BY name');
    console.log('\n📋 All Available Roles:');
    allRolesResult.rows.forEach(role => {
      console.log(`   - ${role.name}: ${role.description || 'No description'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyUserRoles();

