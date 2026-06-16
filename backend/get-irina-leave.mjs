import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("SELECT s.name, s.days_per_week, lb.total_entitlement, lb.hours_accrued, lb.hours_used FROM staff s LEFT JOIN leave_balances lb ON s.id::text = lb.staff_id WHERE s.name ILIKE '%Irina%'");
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
