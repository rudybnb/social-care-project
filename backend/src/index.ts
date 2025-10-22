import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, staff, sites, shifts } from './schema.js';
import { eq } from 'drizzle-orm';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL || '';

// Initialize Postgres pool and Drizzle ORM
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : undefined;
export const db = pool ? drizzle(pool) : undefined;

// Health check for Render
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
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

// ==================== STAFF ROUTES ====================

// Get all staff
app.get('/api/staff', async (_req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const allStaff = await db.select().from(staff);
    res.json(allStaff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Get staff by ID
app.get('/api/staff/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const staffMember = await db.select().from(staff).where(eq(staff.id, id));
    if (staffMember.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json(staffMember[0]);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
});

// Create new staff member
app.post('/api/staff', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const newStaff = await db.insert(staff).values(req.body).returning();
    res.status(201).json(newStaff[0]);
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// Update staff member
app.put('/api/staff/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const updated = await db.update(staff)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// Delete staff member
app.delete('/api/staff/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const deleted = await db.delete(staff).where(eq(staff.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// ==================== SITES ROUTES ====================

// Get all sites
app.get('/api/sites', async (_req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const allSites = await db.select().from(sites);
    res.json(allSites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Get site by ID
app.get('/api/sites/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const site = await db.select().from(sites).where(eq(sites.id, id));
    if (site.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json(site[0]);
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({ error: 'Failed to fetch site' });
  }
});

// Create new site
app.post('/api/sites', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const newSite = await db.insert(sites).values(req.body).returning();
    res.status(201).json(newSite[0]);
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

// Update site
app.put('/api/sites/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const updated = await db.update(sites)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(sites.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// Delete site
app.delete('/api/sites/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const deleted = await db.delete(sites).where(eq(sites.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

// ==================== SHIFTS ROUTES ====================

// Get all shifts
app.get('/api/shifts', async (_req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const allShifts = await db.select().from(shifts);
    res.json(allShifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

// Get shift by ID
app.get('/api/shifts/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const shift = await db.select().from(shifts).where(eq(shifts.id, id));
    if (shift.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json(shift[0]);
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({ error: 'Failed to fetch shift' });
  }
});

// Create new shift
app.post('/api/shifts', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const newShift = await db.insert(shifts).values(req.body).returning();
    res.status(201).json(newShift[0]);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

// Update shift
app.put('/api/shifts/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const updated = await db.update(shifts)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(shifts.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ error: 'Failed to update shift' });
  }
});

// Delete shift
app.delete('/api/shifts/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const deleted = await db.delete(shifts).where(eq(shifts.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

// ==================== AUTH ROUTES (Legacy) ====================

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, role } = req.body || {};
  if (!email || !role) {
    return res.status(400).json({ error: 'email and role required' });
  }
  const user = { id: 'u_demo', email, role, name: 'Demo User' };
  return res.json({ user, token: 'demo-token' });
});

app.get('/api/auth/me', async (_req: Request, res: Response) => {
  res.json({ user: { id: 'u_demo', email: 'demo@example.com', role: 'admin', name: 'Demo User' } });
});

// Legacy routes
app.use('/api/attendance', (_req: Request, res: Response) => res.json({ message: 'attendance API placeholder' }));
app.use('/api/rooms', (_req: Request, res: Response) => res.json({ message: 'rooms API placeholder' }));
app.use('/api/queries', (_req: Request, res: Response) => res.json({ message: 'queries API placeholder' }));

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

