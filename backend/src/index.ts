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

// ==================== AUTH ROUTES ====================

// Staff login (username/password)
app.post('/api/auth/staff/login', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Find staff by username
    const staffMember = await db.select().from(staff).where(eq(staff.username, username));
    
    if (staffMember.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = staffMember[0];
    
    // Check password (in production, use bcrypt for hashing)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      user: userWithoutPassword, 
      token: `staff-${user.id}` // Simple token for demo
    });
  } catch (error) {
    console.error('Error during staff login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Legacy admin login (email/role)
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

// ==================== CLOCK-IN/OUT ROUTES ====================

// Get staff shifts (for staff mobile app)
app.get('/api/staff/:staffId/shifts', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { staffId } = req.params;
    
    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID required' });
    }
    
    // Get all shifts for this staff member
    const staffShifts = await db.select().from(shifts).where(eq(shifts.staffId, staffId));
    res.json(staffShifts);
  } catch (error) {
    console.error('Error fetching staff shifts:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

// Clock in to a shift
app.post('/api/shifts/:shiftId/clock-in', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { shiftId } = req.params;
    const { qrCode, staffId } = req.body;
    
    if (!shiftId || !qrCode || !staffId) {
      return res.status(400).json({ error: 'Shift ID, QR code, and staff ID required' });
    }
    
    // Get the shift
    const shift = await db.select().from(shifts).where(eq(shifts.id, shiftId));
    if (shift.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Verify staff is assigned to this shift
    if (shift[0].staffId !== staffId) {
      return res.status(403).json({ error: 'You are not assigned to this shift' });
    }
    
    // Verify QR code matches the site
    const site = await db.select().from(sites).where(eq(sites.id, shift[0].siteId));
    if (site.length === 0 || site[0].qrCode !== qrCode) {
      return res.status(400).json({ error: 'Invalid QR code for this site' });
    }
    
    // Update shift with clock-in time
    const updated = await db.update(shifts)
      .set({ 
        clockedIn: true, 
        clockInTime: new Date(),
        updatedAt: new Date()
      })
      .where(eq(shifts.id, shiftId))
      .returning();
    
    res.json({ message: 'Clocked in successfully', shift: updated[0] });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

// Clock out from a shift
app.post('/api/shifts/:shiftId/clock-out', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { shiftId } = req.params;
    const { qrCode, staffId } = req.body;
    
    if (!shiftId || !qrCode || !staffId) {
      return res.status(400).json({ error: 'Shift ID, QR code, and staff ID required' });
    }
    
    // Get the shift
    const shift = await db.select().from(shifts).where(eq(shifts.id, shiftId));
    if (shift.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Verify staff is assigned to this shift
    if (shift[0].staffId !== staffId) {
      return res.status(403).json({ error: 'You are not assigned to this shift' });
    }
    
    // Verify they clocked in first
    if (!shift[0].clockedIn) {
      return res.status(400).json({ error: 'You must clock in before clocking out' });
    }
    
    // Verify QR code matches the site
    const site = await db.select().from(sites).where(eq(sites.id, shift[0].siteId));
    if (site.length === 0 || site[0].qrCode !== qrCode) {
      return res.status(400).json({ error: 'Invalid QR code for this site' });
    }
    
    // Update shift with clock-out time
    const updated = await db.update(shifts)
      .set({ 
        clockedOut: true, 
        clockOutTime: new Date(),
        updatedAt: new Date()
      })
      .where(eq(shifts.id, shiftId))
      .returning();
    
    res.json({ message: 'Clocked out successfully', shift: updated[0] });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

// Generate QR code for a site
app.post('/api/sites/:siteId/generate-qr', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { siteId } = req.params;
    
    if (!siteId) {
      return res.status(400).json({ error: 'Site ID required' });
    }
    
    // Generate a unique QR code (in production, use a proper QR code library)
    const qrCode = `QR-${siteId}-${Date.now()}`;
    
    // Update site with QR code
    const updated = await db.update(sites)
      .set({ 
        qrCode, 
        qrGenerated: true,
        updatedAt: new Date()
      })
      .where(eq(sites.id, siteId))
      .returning();
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    res.json({ message: 'QR code generated successfully', site: updated[0] });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Legacy routes
app.use('/api/attendance', (_req: Request, res: Response) => res.json({ message: 'attendance API placeholder' }));
app.use('/api/rooms', (_req: Request, res: Response) => res.json({ message: 'rooms API placeholder' }));
app.use('/api/queries', (_req: Request, res: Response) => res.json({ message: 'queries API placeholder' }));

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

