import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(`SELECT id, date, staff_name, site_name, start_time, end_time, clocked_in, clocked_out, clock_in_time, clock_out_time FROM shifts WHERE staff_name ILIKE '%Lauren%' ORDER BY date DESC LIMIT 5`);
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
