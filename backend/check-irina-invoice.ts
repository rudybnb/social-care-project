
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Connected.');
        const res = await client.query(`SELECT id, name FROM staff WHERE name = 'Irina Mitrovici'`);
        if (res.rows.length === 0) { console.log('Staff not found'); return; }
        const irinaId = res.rows[0].id;

        const shiftsRes = await client.query(`
            SELECT date, duration, clock_in_time, clock_out_time, start_time, end_time 
            FROM shifts 
            WHERE staff_id = $1 AND date >= '2025-12-14' AND date <= '2026-01-15'
            ORDER BY date
        `, [irinaId]);

        console.log('DATE       | CLOCK IN | CLOCK OUT | DUR | SCHED START | SCHED END');
        shiftsRes.rows.forEach(r => {
            const date = r.date.toISOString().split('T')[0];
            const cin = r.clock_in_time ? new Date(r.clock_in_time).toLocaleTimeString('en-GB') : '-';
            const cout = r.clock_out_time ? new Date(r.clock_out_time).toLocaleTimeString('en-GB') : '-';
            console.log(`${date} | ${cin.padEnd(8)} | ${cout.padEnd(9)} | ${parseFloat(r.duration).toFixed(2)} | ${r.start_time} | ${r.end_time}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
