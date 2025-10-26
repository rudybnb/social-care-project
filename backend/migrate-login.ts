import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = neon(connectionString);
const db = drizzle(client);

async function migrate() {
  try {
    console.log('Adding username and password columns to staff table...');
    
    // Add username and password columns if they don't exist
    await db.execute(sql`
      ALTER TABLE staff 
      ADD COLUMN IF NOT EXISTS username TEXT,
      ADD COLUMN IF NOT EXISTS password TEXT
    `);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

