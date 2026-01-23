
import { pool } from '../db.js';

export async function initAuditLog() {
    if (!pool) return;
    try {
        const client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                action TEXT NOT NULL,
                staff_id TEXT,
                staff_name TEXT,
                site_name TEXT,
                details TEXT,
                status TEXT NOT NULL,
                metadata JSONB
            );
        `);
        client.release();
        console.log('✅ Audit Log (activity_logs) initialized');
    } catch (error) {
        console.error('❌ Failed to init Audit Log:', error);
    }
}

export async function logActivity(
    action: string,
    status: 'SUCCESS' | 'FAILURE' | 'WARNING',
    staffId: string | null,
    staffName: string | null,
    siteName: string | null,
    details: string,
    metadata: any = {}
) {
    if (!pool) return;
    try {
        await pool.query(
            `INSERT INTO activity_logs (action, status, staff_id, staff_name, site_name, details, metadata) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [action, status, staffId, staffName, siteName, details, JSON.stringify(metadata)]
        );
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
}
