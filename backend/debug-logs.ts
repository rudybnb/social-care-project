import { pool } from './src/db.js';

async function run() {
  if (!pool) return console.log('No pool');
  try {
    const res = await pool.query(`SELECT * FROM activity_logs WHERE staff_name ILIKE '%Lauren%' ORDER BY timestamp DESC LIMIT 20`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
