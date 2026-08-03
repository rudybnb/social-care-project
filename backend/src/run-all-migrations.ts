import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export interface MigrationOptions {
  databaseUrl?: string;
  pool?: Pool;
  client?: PoolClient | any;
}

export async function runAllMigrations(options: MigrationOptions = {}): Promise<void> {
  const databaseUrl = options.databaseUrl || process.env.DATABASE_URL;

  if (!databaseUrl && !options.pool && !options.client) {
    console.error('❌ DATABASE_URL not set');
    throw new Error('DATABASE_URL not set');
  }

  const pool = options.pool || (options.client ? null : new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl && databaseUrl.includes('render.com') ? {
      rejectUnauthorized: false
    } : false
  }));

  const executor = options.client || pool;

  console.log('🔄 Starting database bootstrap and migration...\n');

  try {
    // 1. Base tables creation (Idempotent bootstrap for fresh databases)
    console.log('📝 Step 1: Bootstrapping base tables (staff, auth_sessions, sites, shifts, quotes, etc.)...');

    await executor.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        username TEXT,
        password TEXT,
        telegram_chat_id TEXT,
        role TEXT NOT NULL DEFAULT 'Worker',
        site TEXT NOT NULL DEFAULT 'General',
        status TEXT NOT NULL DEFAULT 'Active',
        standard_rate DECIMAL(10,2) NOT NULL DEFAULT 12.50,
        enhanced_rate TEXT DEFAULT '—',
        night_rate TEXT DEFAULT '—',
        rates TEXT NOT NULL DEFAULT '£12.50/hr',
        pension TEXT DEFAULT '—',
        deductions TEXT DEFAULT '£0.00',
        tax TEXT DEFAULT '—',
        weekly_hours INTEGER DEFAULT 0,
        days_per_week INTEGER DEFAULT 5,
        start_date TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id UUID NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        user_agent TEXT,
        ip_address TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        postcode TEXT NOT NULL,
        address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        qr_code TEXT,
        qr_generated BOOLEAN DEFAULT false,
        color TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        site_id TEXT NOT NULL,
        site_name TEXT NOT NULL,
        site_color TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration REAL NOT NULL,
        is_bank BOOLEAN DEFAULT false,
        is_24_hour BOOLEAN DEFAULT false,
        approved_24hr_by TEXT,
        notes TEXT,
        extended BOOLEAN DEFAULT false,
        extension_hours INTEGER,
        extension_reason TEXT,
        extension_approved_by TEXT,
        extension_approval_required BOOLEAN DEFAULT false,
        clocked_in BOOLEAN DEFAULT false,
        clock_in_time TIMESTAMP,
        clocked_out BOOLEAN DEFAULT false,
        clock_out_time TIMESTAMP,
        staff_status TEXT DEFAULT 'pending',
        decline_reason TEXT,
        auto_accepted BOOLEAN DEFAULT false,
        response_locked BOOLEAN DEFAULT false,
        week_deadline TIMESTAMP,
        published BOOLEAN DEFAULT false,
        is_offered_for_swap BOOLEAN DEFAULT false,
        is_swapped BOOLEAN DEFAULT false,
        original_staff_id TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        child_initials TEXT NOT NULL UNIQUE,
        quote_status TEXT DEFAULT 'Draft Quote',
        provider_name TEXT,
        placement_type TEXT,
        created_date TEXT,
        state_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS leave_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        year INTEGER NOT NULL,
        total_entitlement INTEGER NOT NULL DEFAULT 224,
        hours_accrued INTEGER NOT NULL DEFAULT 0,
        hours_used INTEGER NOT NULL DEFAULT 0,
        hours_remaining INTEGER NOT NULL DEFAULT 224,
        carry_over_from_previous INTEGER DEFAULT 0,
        carry_over_to_next INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(staff_id, year)
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_days INTEGER NOT NULL,
        total_hours INTEGER NOT NULL,
        reason TEXT,
        leave_type TEXT NOT NULL DEFAULT 'annual',
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT NOW() NOT NULL,
        reviewed_by TEXT,
        reviewed_at TIMESTAMP,
        admin_notes TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS leave_days (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL,
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        date TEXT NOT NULL,
        hours INTEGER NOT NULL DEFAULT 8,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS approval_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        site_id TEXT NOT NULL,
        site_name TEXT NOT NULL,
        date TEXT NOT NULL,
        request_time TIMESTAMP DEFAULT NOW() NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        approved_by TEXT,
        approved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS remittances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_no TEXT NOT NULL,
        payment_date TEXT NOT NULL,
        vendor_id TEXT,
        site_name TEXT,
        payee_name TEXT NOT NULL,
        payee_address TEXT,
        bank_name TEXT,
        account_number TEXT,
        sort_code TEXT,
        description TEXT NOT NULL,
        dates_covered TEXT NOT NULL,
        hours_worked TEXT NOT NULL,
        hourly_rate TEXT NOT NULL,
        payment_total TEXT NOT NULL,
        email_to TEXT,
        status TEXT NOT NULL DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS remittance_workers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        address TEXT,
        bank_name TEXT,
        account_number TEXT,
        sort_code TEXT,
        email TEXT,
        hourly_rate TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log('✅ Base tables verified / created\n');

    // 2. Incremental column additions for pre-existing databases
    console.log('📝 Step 2: Ensuring all columns exist in staff and shifts tables...');
    await executor.query(`
      ALTER TABLE staff
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT,
      ADD COLUMN IF NOT EXISTS username TEXT,
      ADD COLUMN IF NOT EXISTS password TEXT,
      ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'Worker',
      ADD COLUMN IF NOT EXISTS site TEXT NOT NULL DEFAULT 'General',
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS standard_rate DECIMAL(10,2) DEFAULT 12.50,
      ADD COLUMN IF NOT EXISTS enhanced_rate TEXT DEFAULT '—',
      ADD COLUMN IF NOT EXISTS night_rate TEXT DEFAULT '—',
      ADD COLUMN IF NOT EXISTS rates TEXT DEFAULT '£12.50/hr',
      ADD COLUMN IF NOT EXISTS pension TEXT DEFAULT '—',
      ADD COLUMN IF NOT EXISTS deductions TEXT DEFAULT '£0.00',
      ADD COLUMN IF NOT EXISTS tax TEXT DEFAULT '—',
      ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS days_per_week INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS start_date TEXT,
      ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS address_line1 TEXT,
      ADD COLUMN IF NOT EXISTS address_line2 TEXT,
      ADD COLUMN IF NOT EXISTS town_city TEXT,
      ADD COLUMN IF NOT EXISTS staff_postcode TEXT,
      ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT,
      ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT,
      ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

    await executor.query(`
      ALTER TABLE shifts
      ADD COLUMN IF NOT EXISTS is_bank BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_24_hour BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS approved_24hr_by TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS extended BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS extension_hours INTEGER,
      ADD COLUMN IF NOT EXISTS extension_reason TEXT,
      ADD COLUMN IF NOT EXISTS extension_approved_by TEXT,
      ADD COLUMN IF NOT EXISTS extension_approval_required BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS clocked_in BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS clock_in_time TIMESTAMP,
      ADD COLUMN IF NOT EXISTS clocked_out BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS clock_out_time TIMESTAMP,
      ADD COLUMN IF NOT EXISTS staff_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS decline_reason TEXT,
      ADD COLUMN IF NOT EXISTS auto_accepted BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS response_locked BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS week_deadline TIMESTAMP,
      ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_offered_for_swap BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_swapped BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS original_staff_id TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

    await executor.query(`
      ALTER TABLE shifts
      ALTER COLUMN duration TYPE real USING duration::real;
    `);

    console.log('✅ Columns verified\n');

    // 3. Foreign Keys & Indexes
    console.log('📝 Step 3: Creating indexes and foreign keys...');
    await executor.query(`
      CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
      CREATE INDEX IF NOT EXISTS idx_shifts_staff_id ON shifts(staff_id);
      CREATE INDEX IF NOT EXISTS idx_shifts_site_id ON shifts(site_id);
      CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_staff_id ON auth_sessions(staff_id);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
    `);

    // Handle potential data-type mismatch between staff.id and auth_sessions.staff_id in legacy production schemas
    await executor.query(`
      ALTER TABLE auth_sessions DROP CONSTRAINT IF EXISTS auth_sessions_staff_id_staff_id_fk;
      ALTER TABLE auth_sessions DROP CONSTRAINT IF EXISTS auth_sessions_staff_id_fkey;

      DO $$
      DECLARE
        invalid_staff_count INTEGER;
        invalid_session_count INTEGER;
      BEGIN
        -- Preflight Check 1: Verify all staff.id values are valid UUID strings if staff.id is currently text/varchar
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'staff' AND column_name = 'id' AND data_type IN ('text', 'character varying')
        ) THEN
          SELECT COUNT(*) INTO invalid_staff_count
          FROM staff
          WHERE id IS NULL OR id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

          IF invalid_staff_count > 0 THEN
            RAISE EXCEPTION 'Migration Preflight Aborted: Found % record(s) in staff table with non-UUID id values.', invalid_staff_count;
          END IF;
        END IF;

        -- Preflight Check 2: Verify all auth_sessions.staff_id values are valid UUID strings if staff_id is currently text/varchar
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'auth_sessions' AND column_name = 'staff_id' AND data_type IN ('text', 'character varying')
        ) THEN
          SELECT COUNT(*) INTO invalid_session_count
          FROM auth_sessions
          WHERE staff_id IS NULL OR staff_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

          IF invalid_session_count > 0 THEN
            RAISE EXCEPTION 'Migration Preflight Aborted: Found % record(s) in auth_sessions table with non-UUID staff_id values.', invalid_session_count;
          END IF;
        END IF;

        -- Safe type conversion after preflight passes
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'staff' AND column_name = 'id' AND data_type IN ('text', 'character varying')
        ) THEN
          ALTER TABLE staff ALTER COLUMN id TYPE UUID USING id::uuid;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'auth_sessions' AND column_name = 'staff_id' AND data_type IN ('text', 'character varying')
        ) THEN
          ALTER TABLE auth_sessions ALTER COLUMN staff_id TYPE UUID USING staff_id::uuid;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname IN ('auth_sessions_staff_id_staff_id_fk', 'auth_sessions_staff_id_fkey')
        ) THEN
          ALTER TABLE auth_sessions
          ADD CONSTRAINT auth_sessions_staff_id_staff_id_fk
          FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    console.log('✅ Foreign keys and indexes created\n');

    // 4. Strictly verify all required tables exist
    console.log('🔍 Step 4: Verifying required tables in database schema...');
    const tablesResult = await executor.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
      ORDER BY table_name;
    `);

    const existingTables = new Set(tablesResult.rows.map((row: any) => row.table_name));
    console.log('📋 Existing tables:', Array.from(existingTables).join(', '));

    const requiredTables = ['staff', 'shifts', 'auth_sessions', 'sites', 'quotes'];
    const missingTables = requiredTables.filter(table => !existingTables.has(table));

    if (missingTables.length > 0) {
      const errorMsg = `❌ Migration verification failed! Required table(s) missing: ${missingTables.join(', ')}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log('\n✅ All migrations complete!');
    console.log('✅ Database schema verified and ready for use\n');

  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('❌ Migration failed:', msg);
    throw new Error(msg);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Execute CLI entry point if run directly with node/ts-node
if (process.argv[1] && (process.argv[1].endsWith('run-all-migrations.ts') || process.argv[1].endsWith('run-all-migrations.js'))) {
  runAllMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
