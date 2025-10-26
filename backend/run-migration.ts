import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const runMigration = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('🔄 Running staff status migration...');
  
  try {
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate-staff-status.sql'),
      'utf-8'
    );

    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added staff_status column (default: pending)');
    console.log('   - Added decline_reason column');
    
    // Verify the migration
    const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'shifts' 
      AND column_name IN ('staff_status', 'decline_reason')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 Verified columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'NULL'})`);
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }

  await pool.end();
  console.log('\n✨ Database connection closed.');
  process.exit(0);
};

runMigration();

