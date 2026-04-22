import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  keepAlive: true,
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    await client.query(`
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
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Remittances table created successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
