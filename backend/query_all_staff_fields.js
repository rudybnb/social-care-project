const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT id, name, role, site, start_date, created_at FROM staff ORDER BY name ASC');
    console.log(`Found ${res.rows.length} staff members:\n`);
    console.table(res.rows);

    const missing = res.rows.filter(r => !r.start_date);
    console.log(`\nStaff with NO start_date in database (${missing.length}):`);
    console.table(missing);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
