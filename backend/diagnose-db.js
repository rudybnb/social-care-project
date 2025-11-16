import pkg from 'pg';
const { Pool } = pkg;

// Use the production DATABASE_URL from Render environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://social_care_db_user:bwJcUNpMJAaKfJRdKBpLuVXbzEQqhqBt@dpg-ct0k1qe8ii6s73b1kqp0-a.oregon-postgres.render.com/social_care_db';

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function diagnoseDatabaseIssue() {
  console.log('🔍 Diagnosing database issue...\n');
  
  try {
    // Test connection
    console.log('1. Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // List all tables
    console.log('2. Listing all tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('📋 Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');
    
    // Check if staff table exists
    const staffTableExists = tablesResult.rows.some(row => row.table_name === 'staff');
    
    if (staffTableExists) {
      console.log('3. Checking staff table structure...');
      const staffColumnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'staff'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Staff table columns:');
      staffColumnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
      console.log('');
      
      // Try to select from staff table
      console.log('4. Attempting to query staff table...');
      try {
        const staffResult = await pool.query('SELECT * FROM staff LIMIT 5');
        console.log(`✅ Query successful! Found ${staffResult.rows.length} staff members`);
        if (staffResult.rows.length > 0) {
          console.log('Sample data:', JSON.stringify(staffResult.rows[0], null, 2));
        }
      } catch (queryError) {
        console.error('❌ Query failed:', queryError.message);
        console.error('Full error:', queryError);
      }
    } else {
      console.log('❌ Staff table does not exist!');
      console.log('Need to run initial database setup/migration');
    }
    
    console.log('\n5. Checking shifts table...');
    const shiftsTableExists = tablesResult.rows.some(row => row.table_name === 'shifts');
    
    if (shiftsTableExists) {
      const shiftsColumnsResult = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'shifts'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Shifts table columns:');
      shiftsColumnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
      
      const shiftsResult = await pool.query('SELECT COUNT(*) FROM shifts');
      console.log(`\n✅ Shifts table has ${shiftsResult.rows[0].count} records`);
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

diagnoseDatabaseIssue().catch(console.error);

