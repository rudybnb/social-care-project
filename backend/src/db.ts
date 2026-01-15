import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || '';

export const pool = DATABASE_URL ? new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Connection pool settings for long-running services like Telegram bot
    max: 10,                    // Maximum number of connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Timeout after 10 seconds when acquiring connection
    allowExitOnIdle: false      // Keep pool alive for long-running services
}) : undefined;

export const db = pool ? drizzle(pool) : undefined;