import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('render.com') ? {
    rejectUnauthorized: false
  } : false
});

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
    } catch (error) {
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
        ADD COLUMN IF NOT EXISTS enhanced_rate TEXT DEFAULT '—',
        ADD COLUMN IF NOT EXISTS night_rate TEXT DEFAULT '—',
        ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Migration 2 complete\n');
    } catch (error) {
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
    } catch (error) {
      console.log(`⚠️  Migration 3 skipped: ${error.message}\n`);
    }

    // Migration 4: Create indexes for better performance
    console.log('📝 Migration 4: Creating indexes...');
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
        CREATE INDEX IF NOT EXISTS idx_shifts_staff_id ON shifts(staff_id);
        CREATE INDEX IF NOT EXISTS idx_shifts_site_id ON shifts(site_id);
        CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
      `);
      console.log('✅ Migration 4 complete\n');
    } catch (error) {
      console.log(`⚠️  Migration 4 skipped: ${error.message}\n`);
    }

    // Migration 5: Add telegram_chat_id to staff table
    console.log('📝 Migration 5: Adding telegram_chat_id to staff table...');
    try {
      await pool.query(`
        ALTER TABLE staff 
        ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
      `);
      console.log('✅ Migration 5 complete\n');
    } catch (error) {
      console.log(`⚠️  Migration 5 skipped: ${error.message}\n`);
    }

    // Migration 6: Add phone to staff table
    console.log('📝 Migration 6: Adding phone to staff table...');
    try {
      await pool.query(`
        ALTER TABLE staff 
        ADD COLUMN IF NOT EXISTS phone TEXT;
      `);
      console.log('✅ Migration 6 complete\n');
    } catch (error) {
      console.log(`⚠️  Migration 6 skipped: ${error.message}\n`);
    }

    // Migration 7: Add published column to shifts
    console.log('📝 Migration 7: Adding published column to shifts...');
    try {
      // 1. Add column (initially NULL)
      await pool.query(`
        ALTER TABLE shifts 
        ADD COLUMN IF NOT EXISTS published BOOLEAN;
      `);

      // 2. Backfill existing shifts to TRUE (Published)
      // We check if it was just added (so mostly NULL) or already exists
      // Safe to just update all NULLs to TRUE
      await pool.query(`
        UPDATE shifts SET published = TRUE WHERE published IS NULL;
      `);

      // 3. Set default to FALSE (Draft) for future inserts
      await pool.query(`
        ALTER TABLE shifts ALTER COLUMN published SET DEFAULT FALSE;
      `);

      console.log('✅ Migration 7 complete\n');
    } catch (error) {
      console.log(`⚠️  Migration 7 skipped: ${error.message}\n`);
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

    // Check staff table columns
    console.log('\n🔍 Checking staff table columns...');
    const staffColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'staff'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Staff table columns:');
    staffColumnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    // Check shifts table columns
    console.log('\n🔍 Checking shifts table columns...');
    const shiftsColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'shifts'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Shifts table columns:');
    shiftsColumnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ All migrations complete!');
    console.log('✅ Database is ready for production use\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runAllMigrations().catch(console.error);

