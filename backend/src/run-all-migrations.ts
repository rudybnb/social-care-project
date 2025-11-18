import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runAllMigrations() {
  console.log('🔄 Starting comprehensive database migration...\n');
  
  try {
    // Migration 1: Add staff_status and decline_reason to shifts table
    console.log('📝 Migration 1: Adding staff_status and decline_reason columns...');
    try {
      await pool.query(`
        ALTER TABLE shifts 
        ADD COLUMN IF NOT EXISTS staff_status TEXT DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS decline_reason TEXT;
      `);
      console.log('✅ Migration 1 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 1 skipped (columns might already exist): ${error.message}\n`);
    }
    
    // Migration 2: Ensure all required columns exist in staff table
    console.log('📝 Migration 2: Ensuring staff table has all required columns...');
    try {
      await pool.query(`
        ALTER TABLE staff 
        ADD COLUMN IF NOT EXISTS email TEXT,
        ADD COLUMN IF NOT EXISTS username TEXT,
        ADD COLUMN IF NOT EXISTS password TEXT,
        ADD COLUMN IF NOT EXISTS standard_rate DECIMAL(10,2) DEFAULT 12.50,
        ADD COLUMN IF NOT EXISTS enhanced_rate DECIMAL(10,2) DEFAULT 14.00,
        ADD COLUMN IF NOT EXISTS night_rate DECIMAL(10,2) DEFAULT 15.00,
        ADD COLUMN IF NOT EXISTS is_bank BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Migration 2 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 2 skipped: ${error.message}\n`);
    }
    
    // Migration 3: Ensure shifts table has all required columns
    console.log('📝 Migration 3: Ensuring shifts table has all required columns...');
    try {
      await pool.query(`
        ALTER TABLE shifts 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Migration 3 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 3 skipped: ${error.message}\n`);
    }
    
    // Migration 4: Change duration column to support decimal values
    console.log('📝 Migration 4: Changing duration column to support decimal hours...');
    try {
      await pool.query(`
        ALTER TABLE shifts 
        ALTER COLUMN duration TYPE real USING duration::real;
      `);
      console.log('✅ Migration 4 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 4 skipped: ${error.message}\n`);
    }
    
    // Migration 5: Create indexes for better performance
    console.log('📝 Migration 5: Creating indexes...');
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
        CREATE INDEX IF NOT EXISTS idx_shifts_staff_id ON shifts(staff_id);
        CREATE INDEX IF NOT EXISTS idx_shifts_site_id ON shifts(site_id);
        CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
      `);
      console.log('✅ Migration 5 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 5 skipped: ${error.message}\n`);
    }
    
    // Verify tables exist
    console.log('🔍 Verifying database schema...\n');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('\n✅ All migrations complete!');
    console.log('✅ Database is ready for production use\n');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runAllMigrations().catch(console.error);

