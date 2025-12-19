import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, staff, sites, shifts, approvalRequests } from './schema.js';
import { eq, and, sql } from 'drizzle-orm';
import * as OTPAuth from 'otpauth';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: ['https://social-care-frontend.onrender.com', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL || '';

// Initialize Postgres pool and Drizzle ORM
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : undefined;
export const db = pool ? drizzle(pool) : undefined;

// Auth routes
app.use('/api/auth', authRoutes);

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

// Bulk create staff members with credentials
app.post('/api/staff/bulk-create', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    
    const staffMembers = [
      { name: 'Lauren Alecia', username: 'lauren', password: 'Lauren123', startDate: '2024-02-17' },
      { name: 'Melissa Blake', username: 'melissa', password: 'Melissa123', startDate: '2024-04-12' },
      { name: 'Irina Mitrovici', username: 'irina', password: 'Irina123', startDate: '2025-03-28' },
      { name: 'Evander Fisher', username: 'evander', password: 'Evander123', startDate: '2025-01-16' },
      { name: 'Narfisa Posey', username: 'narfisa', password: 'Narfisa123', startDate: '2024-09-09' },
      { name: 'Singita Zoe', username: 'singita', password: 'Singita123', startDate: '2024-04-23' },
      { name: 'Prudence Diedericks', username: 'prudence', password: 'Prudence123', startDate: '2023-02-12' }
    ];
    
    const results = [];
    
    for (const member of staffMembers) {
      try {
        // Just try to insert - if username exists, it will fail and we skip
        const hashedPassword = await bcrypt.hash(member.password, 10);
        const newStaff = await db.insert(staff).values({
          name: member.name,
          username: member.username,
          password: hashedPassword,
          role: 'Worker',
          site: 'Thamesmead Care Home',
          status: 'Active',
          standardRate: '12.50',
          rates: '£/h: 12.50 • Night: — • OT: —',
          startDate: member.startDate
        }).returning();
        results.push({ name: member.name, status: 'created', id: newStaff[0].id });
      } catch (err: any) {
        // If duplicate, skip
        if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
          results.push({ name: member.name, status: 'already exists' });
        } else {
          throw err;
        }
      }
    }
    
    res.json({ success: true, results });
  } catch (error: any) {
    console.error('Error bulk creating staff:', error);
    res.status(500).json({ error: 'Failed to bulk create staff', details: error.message });
  }
});

// Create new staff member
app.post('/api/staff', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    
    console.log('Received staff data:', JSON.stringify(req.body, null, 2));
    
    // Auto-generate username if not provided (to avoid NULL constraint issues)
    const autoUsername = req.body.username || `staff_${Date.now()}`;
    
    // Auto-generate password if not provided
    const passwordToHash = req.body.password || `temp_${Math.random().toString(36).substring(7)}`;
    
    const staffData: any = {
      name: req.body.name,
      email: req.body.email || null,
      username: autoUsername,
      password: await bcrypt.hash(passwordToHash, 10), // Always hash a password
      role: req.body.role,
      site: req.body.site,
      status: req.body.status || 'Active',
      standardRate: req.body.standardRate ? String(req.body.standardRate) : '12.50',
      enhancedRate: req.body.enhancedRate || '—',
      nightRate: req.body.nightRate || '—',
      rates: req.body.rates || '£12.50/h',
      pension: req.body.pension || '—',
      deductions: req.body.deductions || '£0.00',
      tax: req.body.tax || '—',
      weeklyHours: req.body.weeklyHours || 0,
      startDate: req.body.startDate || new Date().toISOString().split('T')[0]
    };
    
    console.log('Inserting staff into database...');
    const newStaff = await db.insert(staff).values(staffData).returning();
    console.log('Staff created successfully:', newStaff[0].id);
    res.status(201).json(newStaff[0]);
  } catch (error: any) {
    console.error('Error creating staff member:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to create staff member',
      details: error.message 
    });
  }
});

// Update staff member
app.put('/api/staff/:id', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    
    // Hash password if it's being updated and is not already hashed
    const updateData = { ...req.body, updatedAt: new Date() };
    if (updateData.password && !updateData.password.startsWith('$2b$')) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const updated = await db.update(staff)
      .set(updateData)
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

// Delete all shifts for a specific date and site (Clear Day)
app.delete('/api/shifts/clear/:siteId/:date', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { siteId, date } = req.params;
    if (!siteId || !date) {
      return res.status(400).json({ error: 'Site ID and date are required' });
    }
    
    const deleted = await db.delete(shifts)
      .where(and(eq(shifts.siteId, siteId), eq(shifts.date, date)))
      .returning();
    
    res.json({ 
      message: `Cleared ${deleted.length} shift(s) for date ${date}`,
      count: deleted.length 
    });
  } catch (error) {
    console.error('Error clearing shifts:', error);
    res.status(500).json({ error: 'Failed to clear shifts' });
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
    
    // Check if user has login credentials set
    if (!user.username || !user.password) {
      return res.status(401).json({ error: 'Login not configured for this staff member' });
    }
    
    // Check password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
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

// Staff QR code login
app.post('/api/auth/staff/qr-login', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { staffId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID required' });
    }
    
    // Find staff by ID
    const staffMember = await db.select().from(staff).where(eq(staff.id, staffId));
    
    if (staffMember.length === 0) {
      return res.status(401).json({ error: 'Invalid QR code' });
    }
    
    const user = staffMember[0];
    
    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      user: userWithoutPassword, 
      token: `staff-${user.id}` // Simple token for demo
    });
  } catch (error) {
    console.error('Error during QR login:', error);
    res.status(500).json({ error: 'QR login failed' });
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
    
    // Verify site exists
    const site = await db.select().from(sites).where(eq(sites.id, shift[0].siteId));
    if (site.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Simple QR code validation: SITE_{siteId}
    const expectedQR = `SITE_${shift[0].siteId}`;
    if (qrCode !== expectedQR) {
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
    
    // Verify site exists
    const site = await db.select().from(sites).where(eq(sites.id, shift[0].siteId));
    if (site.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Simple QR code validation: SITE_{siteId}
    const expectedQR = `SITE_${shift[0].siteId}`;
    if (qrCode !== expectedQR) {
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

// Update shift status (accept/decline)
app.patch('/api/shifts/:id/status', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    const { staffStatus, declineReason } = req.body;
    
    if (!id) return res.status(400).json({ error: 'ID is required' });
    if (!staffStatus || !['accepted', 'declined', 'pending'].includes(staffStatus)) {
      return res.status(400).json({ error: 'Valid staffStatus is required (accepted, declined, or pending)' });
    }
    
    const updateData: any = { 
      staffStatus, 
      updatedAt: new Date() 
    };
    
    if (staffStatus === 'declined' && declineReason) {
      updateData.declineReason = declineReason;
    }
    
    const updated = await db.update(shifts)
      .set(updateData)
      .where(eq(shifts.id, id))
      .returning();
      
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Trigger declined shift alert if status is declined
    if (staffStatus === 'declined') {
      const { triggerDeclinedShiftAlert } = await import('./services/automationAgents.js');
      const shift = updated[0];
      
      // Get staff name
      const staffMember = await db.select().from(staff).where(eq(staff.id, shift.staffId)).limit(1);
      const staffName = staffMember.length > 0 ? staffMember[0].name : 'Unknown';
      
      // Trigger alert (non-blocking)
      triggerDeclinedShiftAlert({
        staffName,
        site: shift.siteName,
        shiftType: shift.type,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        declineReason: shift.declineReason
      }).catch(err => console.error('Failed to send declined shift alert:', err));
    }
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating shift status:', error);
    res.status(500).json({ error: 'Failed to update shift status' });
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

// Database setup endpoint (one-time use)
app.post('/api/setup', async (req: Request, res: Response) => {
  const { setupDatabase } = await import('./setup-endpoint.js');
  return setupDatabase(req, res);
});

// Add staff accounts endpoint
app.post('/api/add-staff', async (req: Request, res: Response) => {
  const { addStaffAccounts } = await import('./add-staff-endpoint.js');
  return addStaffAccounts(req, res);
});

// Fix shift staff IDs endpoint
app.post('/api/fix-shifts', async (req: Request, res: Response) => {
  const { fixShiftStaffIds } = await import('./fix-shifts-endpoint.js');
  return fixShiftStaffIds(req, res);
});

// Reset database endpoint (DANGER: Drops all tables and recreates them)
app.post('/api/reset-database', async (req: Request, res: Response) => {
  const { resetDatabase } = await import('./reset-db-endpoint.js');
  return resetDatabase(req, res);
});

// Create/verify staff table endpoint
app.post('/api/create-staff-table', async (req: Request, res: Response) => {
  const { createStaffTable } = await import('./create-staff-table-endpoint.js');
  return createStaffTable(req, res);
});

// Fix staff table schema endpoint
app.post('/api/fix-staff-schema', async (req: Request, res: Response) => {
  const { fixStaffSchema } = await import('./fix-staff-schema-endpoint.js');
  return fixStaffSchema(req, res);
});

// ==================== ADMIN ROUTES ====================

// Add staff status columns migration
app.post('/api/admin/migrate-staff-status', async (_req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    
    console.log('Running migration to add staff status columns...');
    
    // Add staff status columns
    await db.execute(sql`
      ALTER TABLE shifts 
      ADD COLUMN IF NOT EXISTS staff_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS decline_reason TEXT
    `);
    
    // Update existing shifts to 'accepted' status
    await db.execute(sql`
      UPDATE shifts 
      SET staff_status = 'accepted' 
      WHERE staff_status IS NULL OR staff_status = 'pending'
    `);
    
    console.log('Staff status migration completed successfully');
    
    res.json({ 
      success: true, 
      message: 'Staff status columns added successfully' 
    });
  } catch (error: any) {
    console.error('Error adding staff status columns:', error);
    res.status(500).json({ 
      error: 'Failed to add staff status columns',
      details: error.message 
    });
  }
});

// Add login columns migration
app.post('/api/admin/migrate-login', async (_req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    
    console.log('Running migration to add missing columns...');
    
    // Add all missing columns if they don't exist
    await db.execute(sql`
      ALTER TABLE staff 
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS username TEXT,
      ADD COLUMN IF NOT EXISTS password TEXT
    `);
    
    console.log('Migration completed successfully');
    
    res.json({ 
      success: true, 
      message: 'All missing columns added successfully' 
    });
  } catch (error: any) {
    console.error('Error adding columns:', error);
    res.status(500).json({ 
      error: 'Failed to add columns',
      details: error.message 
    });
  }
});

// Reset all data (DANGER: Deletes all shifts and staff)
app.delete('/api/admin/reset-all', async (_req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    
    // Delete all shifts
    await db.delete(shifts);
    
    // Delete all staff
    await db.delete(staff);
    
    res.json({ 
      success: true, 
      message: 'All shifts and staff deleted successfully' 
    });
  } catch (error) {
    console.error('Error resetting data:', error);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

// Annual Leave routes
import leaveRoutes from './routes/leave.js';
app.use('/api/leave', leaveRoutes);

// Legacy routes
app.use('/api/attendance', (_req: Request, res: Response) => res.json({ message: 'attendance API placeholder' }));
app.use('/api/rooms', (_req: Request, res: Response) => res.json({ message: 'rooms API placeholder' }));
app.use('/api/queries', (_req: Request, res: Response) => res.json({ message: 'queries API placeholder' }));

// Auto-run migration on startup
const runStartupMigration = async () => {
  if (!pool) {
    console.warn('⚠️  Database not configured, skipping migration');
    return;
  }
  
  try {
    console.log('🔄 Running comprehensive database migration...');
    
    // Migration 1: Add staff_status and decline_reason to shifts table
    console.log('📝 Migration 1: Ensuring shifts table has staff_status columns...');
    await pool.query(`
      ALTER TABLE shifts 
      ADD COLUMN IF NOT EXISTS staff_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS decline_reason TEXT;
    `);
    console.log('✅ Migration 1 complete');
    
    // Migration 2: Ensure staff table has all required columns
    console.log('📝 Migration 2: Ensuring staff table has all required columns...');
    await pool.query(`
      ALTER TABLE staff 
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS username TEXT,
      ADD COLUMN IF NOT EXISTS password TEXT,
      ADD COLUMN IF NOT EXISTS start_date TEXT,
      ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 0;
    `);
    console.log('✅ Migration 2 complete');
    
    // Migration 3: Add timestamps if missing
    console.log('📝 Migration 3: Ensuring timestamp columns exist...');
    await pool.query(`
      ALTER TABLE shifts 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('✅ Migration 3 complete');
    
    // Migration 4: Create annual leave tables
    console.log('📝 Migration 4: Creating annual leave tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        year INTEGER NOT NULL,
        total_entitlement INTEGER NOT NULL DEFAULT 112,
        hours_accrued INTEGER NOT NULL DEFAULT 0,
        hours_used INTEGER NOT NULL DEFAULT 0,
        hours_remaining INTEGER NOT NULL DEFAULT 112,
        carry_over_from_previous INTEGER DEFAULT 0,
        carry_over_to_next INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(staff_id, year)
      );
      
      CREATE TABLE IF NOT EXISTS leave_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_days INTEGER NOT NULL,
        total_hours INTEGER NOT NULL,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT NOW() NOT NULL,
        reviewed_at TIMESTAMP,
        reviewed_by TEXT,
        admin_notes TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Migration 4 complete');
    
    // Migration 5: Add rejection_reason column if it doesn't exist
    console.log('📝 Migration 5: Adding rejection_reason column to leave_requests...');
    await pool.query(`
      ALTER TABLE leave_requests 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);
    console.log('✅ Migration 5 complete');
    
    // Migration 6: Add leave_type column to leave_requests
    console.log('📝 Migration 6: Adding leave_type column to leave_requests...');
    await pool.query(`
      ALTER TABLE leave_requests 
      ADD COLUMN IF NOT EXISTS leave_type TEXT NOT NULL DEFAULT 'annual';
    `);
    console.log('✅ Migration 6 complete');
    
    // Migration 7: Add phone column to staff and create approval_requests table
    console.log('📝 Migration 7: Adding phone column to staff...');
    await pool.query(`
      ALTER TABLE staff 
      ADD COLUMN IF NOT EXISTS phone TEXT;
    `);
    console.log('✅ Phone column added');
    
    console.log('📝 Migration 7: Creating approval_requests table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approval_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        site_id TEXT NOT NULL,
        site_name TEXT NOT NULL,
        date TEXT NOT NULL,
        request_time TIMESTAMP NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'pending',
        approved_by TEXT,
        approved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Approval_requests table created');
    
    console.log('📝 Migration 7: Creating indexes on approval_requests...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_approval_requests_staff_site_date 
      ON approval_requests(staff_id, site_id, date);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_approval_requests_status 
      ON approval_requests(status);
    `);
    console.log('✅ Migration 7 complete');
    
    console.log('✅ All migrations completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  }
};

// ==================== APPROVAL REQUEST ROUTES ====================

// Create approval request
app.post('/api/approvals', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { staffId, staffName, siteId, siteName, date } = req.body;
    
    if (!staffId || !staffName || !siteId || !siteName || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if request already exists for this staff/site/date
    const existing = await db.select()
      .from(approvalRequests)
      .where(
        and(
          eq(approvalRequests.staffId, staffId),
          eq(approvalRequests.siteId, siteId),
          eq(approvalRequests.date, date)
        )
      );
    
    if (existing.length > 0 && existing[0].status === 'pending') {
      return res.status(400).json({ error: 'Approval request already exists' });
    }
    
    const newRequest = await db.insert(approvalRequests)
      .values({
        staffId,
        staffName,
        siteId,
        siteName,
        date,
        status: 'pending'
      })
      .returning();
    
    res.json(newRequest[0]);
  } catch (error) {
    console.error('Error creating approval request:', error);
    res.status(500).json({ error: 'Failed to create approval request' });
  }
});

// Get all approval requests
app.get('/api/approvals', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { status } = req.query;
    
    let requests;
    if (status) {
      requests = await db.select()
        .from(approvalRequests)
        .where(eq(approvalRequests.status, status as string))
        .orderBy(sql`${approvalRequests.requestTime} DESC`);
    } else {
      requests = await db.select()
        .from(approvalRequests)
        .orderBy(sql`${approvalRequests.requestTime} DESC`);
    }
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching approval requests:', error);
    res.status(500).json({ error: 'Failed to fetch approval requests' });
  }
});

// Check if staff has approved request
app.get('/api/approvals/check', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { staffId, siteId, date } = req.query;
    
    if (!staffId || !siteId || !date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const request = await db.select()
      .from(approvalRequests)
      .where(
        and(
          eq(approvalRequests.staffId, staffId as string),
          eq(approvalRequests.siteId, siteId as string),
          eq(approvalRequests.date, date as string),
          eq(approvalRequests.status, 'approved')
        )
      );
    
    if (request.length > 0) {
      res.json({ approved: true, request: request[0] });
    } else {
      res.json({ approved: false });
    }
  } catch (error) {
    console.error('Error checking approval:', error);
    res.status(500).json({ error: 'Failed to check approval' });
  }
});

// Approve request
app.post('/api/approvals/:id/approve', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    const { approvedBy } = req.body;
    
    if (!approvedBy) {
      return res.status(400).json({ error: 'approvedBy is required' });
    }
    
    // Get the approval request first
    const request = await db.select().from(approvalRequests).where(eq(approvalRequests.id, id));
    if (request.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Update approval status
    const updated = await db.update(approvalRequests)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(approvalRequests.id, id))
      .returning();
    
    // Create a shift for the approved unscheduled request
    const approvalData = request[0];
    const shiftId = `SHIFT_UNSCHEDULED_${Date.now()}`;
    
    // Get site color
    const site = await db.select().from(sites).where(eq(sites.id, approvalData.siteId));
    const siteColor = site.length > 0 ? site[0].color : '#3b82f6';
    
    // Create shift with default times (can be edited later)
    await db.insert(shifts).values({
      id: shiftId,
      staffId: approvalData.staffId,
      staffName: approvalData.staffName,
      siteId: approvalData.siteId,
      siteName: approvalData.siteName,
      siteColor,
      date: approvalData.date,
      type: 'Day',
      startTime: '09:00',
      endTime: '17:00',
      duration: 8,
      isBank: false,
      clockedIn: false,
      clockedOut: false,
      staffStatus: 'accepted',
      notes: `Approved unscheduled shift by ${approvedBy}`
    });
    
    res.json({ ...updated[0], shiftCreated: true, shiftId });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Reject request
app.post('/api/approvals/:id/reject', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { id } = req.params;
    const { rejectedBy, notes } = req.body;
    
    const updated = await db.update(approvalRequests)
      .set({
        status: 'rejected',
        approvedBy: rejectedBy,
        notes,
        updatedAt: new Date()
      })
      .where(eq(approvalRequests.id, id))
      .returning();
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

app.listen(PORT, async () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  await runStartupMigration();
  
  // Initialize automation agents (with error handling to prevent server crash)
  try {
    const { initializeAgents } = await import('./services/automationAgents.js');
    await initializeAgents();
    console.log('✅ Automation agents initialized successfully');
  } catch (error: any) {
    console.error('⚠️  Failed to initialize automation agents:', error.message);
    console.error('   Server will continue running without automation agents.');
  }
});

