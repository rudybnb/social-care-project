
import { pool } from './src/db.js';

async function createAuditTable() {
    if (!pool) {
        console.error('Database configuration missing.');
        return;
    }

    const client = await pool.connect();
    try {
        console.log('Creating activity_logs table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                action TEXT NOT NULL,
                staff_id TEXT,
                staff_name TEXT,
                details TEXT,
                status TEXT NOT NULL,
                metadata JSONB
            );
        `);

        console.log('✅ Table activity_logs created (or already exists).');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

createAuditTable();
