import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users } from './schema';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL || '';

// Initialize Postgres pool and Drizzle ORM (no connection on start if URL missing)
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : undefined;
export const db = pool ? drizzle(pool) : undefined;

// Health check for Render
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection if available
    if (db && pool) {
      await pool.query('SELECT 1');
    }
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: db ? 'connected' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Placeholder auth routes
app.post('/api/auth/login', async (req: Request, res: Response) => {
  // TODO: Integrate Replit Auth. For now, accept role passed in body.
  const { email, role } = req.body || {};
  if (!email || !role) {
    return res.status(400).json({ error: 'email and role required' });
  }
  // Fake user record
  const user = { id: 'u_demo', email, role, name: 'Demo User' };
  return res.json({ user, token: 'demo-token' });
});

app.get('/api/auth/me', async (_req: Request, res: Response) => {
  // TODO: Validate token (Replit Auth). Returning demo user.
  res.json({ user: { id: 'u_demo', email: 'demo@example.com', role: 'admin', name: 'Demo User' } });
});

// Route placeholders
app.use('/api/sites', (_req: Request, res: Response) => res.json({ message: 'sites API placeholder' }));
app.use('/api/shifts', (_req: Request, res: Response) => res.json({ message: 'shifts API placeholder' }));
app.use('/api/attendance', (_req: Request, res: Response) => res.json({ message: 'attendance API placeholder' }));
app.use('/api/rooms', (_req: Request, res: Response) => res.json({ message: 'rooms API placeholder' }));
app.use('/api/queries', (_req: Request, res: Response) => res.json({ message: 'queries API placeholder' }));

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});