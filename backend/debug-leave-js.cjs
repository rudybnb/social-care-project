const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query("SELECT id, name, username, start_date FROM staff WHERE name LIKE '%Melissa%'");
        console.log('Melissa Blake results:', JSON.stringify(res.rows, null, 2));

        const res2 = await pool.query("SELECT * FROM leave_balances WHERE staff_id = $1", [res.rows[0]?.id]);
        console.log('Leave Balance results:', JSON.stringify(res2.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
