import { Pool } from 'pg';

export async function up(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding employment detail columns to staff table...');
    await client.query(`
      ALTER TABLE staff
      ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS address_line1 TEXT,
      ADD COLUMN IF NOT EXISTS address_line2 TEXT,
      ADD COLUMN IF NOT EXISTS town_city TEXT,
      ADD COLUMN IF NOT EXISTS staff_postcode TEXT,
      ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT,
      ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT,
      ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT;
    `);

    await client.query('COMMIT');
    console.log('✅ Migration 007 completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 007 failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function down(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE staff
      DROP COLUMN IF EXISTS hourly_rate,
      DROP COLUMN IF EXISTS address_line1,
      DROP COLUMN IF EXISTS address_line2,
      DROP COLUMN IF EXISTS town_city,
      DROP COLUMN IF EXISTS staff_postcode,
      DROP COLUMN IF EXISTS next_of_kin_name,
      DROP COLUMN IF EXISTS next_of_kin_relationship,
      DROP COLUMN IF EXISTS next_of_kin_phone;
    `);

    await client.query('COMMIT');
    console.log('✅ Migration 007 rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 007 rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
