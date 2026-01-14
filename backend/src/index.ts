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
import { calculatePayForPeriod } from './services/payrollAuditService.js';
import { sendDailyPayrollReport } from './services/emailService.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: ['https://social-care-frontend.onrender.com', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Audit Payroll Route
app.get('/api/admin/audit-payroll', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required (YYYY-MM-DD)' });
    }

    console.log(`Auditing payroll from ${startDate} to ${endDate}...`);
    const result = await calculatePayForPeriod(startDate, endDate);

    // Handle email request
    if (req.query.email === 'true') {
      const emailTo = 'laurenalecia@eclesia.co.uk';

      let totalCost = 0; let totalHours = 0; let staffCount = 0; let breakdownText = "";
      result.staffSummary.forEach(s => {
        if (s.totalHours > 0) {
          staffCount++;
          totalCost += s.totalPay;
          totalHours += s.totalHours;
          breakdownText += `${s.staffName.padEnd(20)} | ${s.totalHours.toFixed(1).padStart(5)}h | £${s.totalPay.toFixed(2).padStart(8)}\n`;
        }
      });

      const reportData = {
        date: `${startDate} to ${endDate}`,
        staffCount,
        totalHours,
        totalCost: totalCost.toFixed(2),
        breakdownText
      };

      await sendDailyPayrollReport(emailTo, reportData);
      console.log(`Manual audit email sent to ${emailTo}`);
      return res.json({ ...result, emailSent: true, emailTo });
    }

    // Return full report as text if requested, else JSON
    if (req.query.format === 'text') {
      res.setHeader('Content-Type', 'text/plain');
      return res.send(result.fullReport);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error auditing payroll:', error);
    res.status(500).json({ error: 'Failed to audit payroll', details: error.message });
  }
});

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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
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

// Get shifts for specific staff member
app.get('/api/staff/:id/shifts', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const id = req.params.id as string;
    const staffShifts = await db.select().from(shifts).where(eq(shifts.staffId, id));
    res.json(staffShifts);
  } catch (error) {
    console.error('Error fetching staff shifts:', error);
    res.status(500).json({ error: 'Failed to fetch staff shifts' });
  }
});

// Create new shift
app.post('/api/shifts', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });

    // Calculate week deadline for the shift
    const { getWeekDeadline } = await import('./jobs/autoAcceptShifts.js');
    const shiftDate = new Date(req.body.date);
    const weekDeadline = getWeekDeadline(shiftDate);

    // Add week deadline to shift data
    const shiftData = {
      ...req.body,
      weekDeadline: weekDeadline
    };

    const newShift = await db.insert(shifts).values(shiftData).returning();
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
    const id = req.params.id as string;
    if (!id) return res.status(400).json({ error: 'ID is required' });

    // Check if trying to change staff_status on a locked shift
    if (req.body.staff_status || req.body.staffStatus) {
      const existingShift = await db.select().from(shifts).where(eq(shifts.id, id));
      if (existingShift.length > 0 && existingShift[0].responseLocked) {
        return res.status(403).json({
          error: 'This shift is locked. Contact admin to change your response.',
          locked: true
        });
      }
    }

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
    const id = req.params.id as string;
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
    const siteId = req.params.siteId as string;
    const date = req.params.date as string;
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
    const staffId = req.params.staffId as string;

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

// Lookup staff by phone (last 4 digits)
app.post('/api/staff/lookup', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { phoneDigits, siteId } = req.body;

    if (!phoneDigits || phoneDigits.length !== 4) {
      return res.status(400).json({ error: 'Please provide exactly 4 digits' });
    }

    console.log(`[Lookup] Searching for staff with phone ending in ${phoneDigits} at site ${siteId || 'any'}`);

    // Fetch all staff (since phone is not indexed/normalized well, we filter in memory - optimizing this is a future task)
    // Ideally we should have a `phoneLast4` column or proper search.
    const allStaff = await db.select().from(staff);

    // Find matching staff
    const matchingStaff = allStaff.find(s =>
      s.phone && s.phone.endsWith(phoneDigits)
    );

    if (!matchingStaff) {
      console.log(`[Lookup] No staff found for ${phoneDigits}`);
      return res.status(404).json({ error: 'No staff member found with these digits.' });
    }

    // Return the staff member
    console.log(`[Lookup] Found staff: ${matchingStaff.name} (${matchingStaff.id})`);

    // Safety: don't return password or sensitive fields
    const { password, ...safeStaff } = matchingStaff;
    res.json(safeStaff);

  } catch (error) {
    console.error('[Lookup] Error:', error);
    res.status(500).json({ error: 'Failed to lookup staff' });
  }
});

// Clock in to a shift
app.post('/api/shifts/:shiftId/clock-in', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const shiftId = req.params.shiftId as string;
    const { qrCode, staffId } = req.body;

    console.log(`[ClockIn] Attempting clock-in. Shift: ${shiftId}, Staff: ${staffId}, QR: ${qrCode}`);

    if (!shiftId || !qrCode || !staffId) {
      return res.status(400).json({ error: 'Shift ID, QR code, and staff ID required' });
    }

    // Get the shift
    const shiftResult = await db.select().from(shifts).where(eq(shifts.id, shiftId));
    if (shiftResult.length === 0) {
      console.log(`[ClockIn] Shift ${shiftId} not found`);
      return res.status(404).json({ error: 'Shift not found' });
    }
    const shift = shiftResult[0];

    // Verify staff is assigned to this shift
    if (shift.staffId !== staffId) {
      console.log(`[ClockIn] Staff mismatch. Expected ${shift.staffId}, got ${staffId}`);
      return res.status(403).json({ error: 'You are not assigned to this shift' });
    }

    // Verify site exists
    const siteResult = await db.select().from(sites).where(eq(sites.id, shift.siteId));
    if (siteResult.length === 0) {
      console.log(`[ClockIn] Site ${shift.siteId} not found`);
      return res.status(404).json({ error: 'Site not found' });
    }

    // QR Code Validation
    // The user confirmed they still want this check.
    // QR Code Validation
    // FIX: Site IDs already start with SITE_, so we shouldn't double prefix if present
    const expectedQR = shift.siteId.startsWith('SITE_') ? shift.siteId : `SITE_${shift.siteId}`;

    if (qrCode !== expectedQR) {
      console.log(`[ClockIn] Invalid QR. Expected ${expectedQR}, got ${qrCode}`);
      return res.status(400).json({ error: 'Invalid QR code. Please ensure you are scanning the correct site code.' });
    }

    // Auto-Clock-Out Logic: If already clocked into another site/shift, close it first.
    try {
      const activeShifts = await db.select().from(shifts).where(
        and(
          eq(shifts.staffId, staffId),
          eq(shifts.clockedIn, true),
          eq(shifts.clockedOut, false),
          sql`${shifts.id} != ${shiftId}`
        )
      );

      for (const activeShift of activeShifts) {
        console.log(`[ClockIn] Auto-clocking out previous shift ${activeShift.id} at ${activeShift.siteName}`);
        await db.update(shifts)
          .set({
            clockedOut: true,
            clockOutTime: new Date(),
            notes: (activeShift.notes || '') + ' [Auto-closed for site transition]',
            updatedAt: new Date()
          })
          .where(eq(shifts.id, activeShift.id));
      }
    } catch (autoErr) {
      console.error('[ClockIn] Error during auto-clock-out:', autoErr);
      // Continue anyway, we don't want to block the new clock-in
    }

    // VALIDATION: Shift must be ACCEPTED before clock-in
    if (shift.staffStatus !== 'accepted') {
      console.log(`[ClockIn] BLOCKED - Shift status is ${shift.staffStatus}, not accepted`);
      const statusMessage = shift.staffStatus === 'pending'
        ? 'You must accept this shift before you can clock in. Please accept the shift in your app first.'
        : 'This shift has been declined. Please contact your manager.';
      return res.status(403).json({
        error: statusMessage,
        staffStatus: shift.staffStatus,
        shiftId: shiftId
      });
    }

    // Check if already clocked in but not out (re-clocking in?)
    if (shift.clockedIn && !shift.clockedOut) {
      console.log(`[ClockIn] Already clocked in at ${shift.clockInTime}`);
      return res.status(200).json({ message: 'Already clocked in', shift });
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

    console.log(`[ClockIn] Success for shift ${shiftId}`);
    res.json({ message: 'Clocked in successfully', shift: updated[0] });
  } catch (error) {
    console.error('[ClockIn] Critical Error:', error);
    res.status(500).json({ error: 'Failed to clock in due to server error' });
  }
});

// Clock out from a shift
app.post('/api/shifts/:shiftId/clock-out', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const shiftId = req.params.shiftId as string;
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

    // Simple QR code validation: Match Site ID (handling SITE_ prefix)
    const expectedQR = shift[0].siteId.startsWith('SITE_') ? shift[0].siteId : `SITE_${shift[0].siteId}`;

    if (qrCode !== expectedQR) {
      return res.status(400).json({ error: 'Invalid QR code for this site' });
    }

    // Calculate actual duration from clock-in to clock-out
    const now = new Date();
    const clockInTime = shift[0].clockInTime ? new Date(shift[0].clockInTime) : null;
    let actualDuration = shift[0].duration || 0; // Default to existing

    if (clockInTime) {
      const diffMs = now.getTime() - clockInTime.getTime();
      actualDuration = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
    }

    // Calculate actual end time
    const actualEndTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Update shift with clock-out time and actual duration
    const updated = await db.update(shifts)
      .set({
        clockedOut: true,
        clockOutTime: now,
        endTime: actualEndTime,
        duration: actualDuration,
        updatedAt: now
      })
      .where(eq(shifts.id, shiftId))
      .returning();

    console.log(`[ClockOut] ${shift[0].staffName} clocked out. Duration: ${actualDuration} hours`);

    res.json({ message: 'Clocked out successfully', shift: updated[0] });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

// Unscheduled/Ad-hoc clock-in (creates approval request, records scan time)
app.post('/api/shifts/unscheduled-clock-in', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const { qrCode, staffId } = req.body;

    if (!qrCode || !staffId) {
      return res.status(400).json({ error: 'QR code and staff ID required' });
    }

    // Extract siteId from QR
    // FIX: If QR is SITE_003, and ID is SITE_003, we should just use the QR as ID?
    // Or if ID is 003, we strip. 
    // Logic: Try exact match first, then try stripping SITE_

    let siteId = qrCode;
    // Verify site exists (Try exact match first - e.g. SITE_003)
    let siteResult = await db.select().from(sites).where(eq(sites.id, siteId));

    if (siteResult.length === 0 && qrCode.startsWith('SITE_')) {
      // Fallback: Try stripping SITE_ prefix (e.g. if ID is just 003)
      siteId = qrCode.replace('SITE_', '');
      siteResult = await db.select().from(sites).where(eq(sites.id, siteId));
    }

    if (siteResult.length === 0) {
      return res.status(400).json({ error: 'Invalid site QR code' });
    }

    const site = siteResult[0];

    // Get staff details
    const staffResult = await db.select().from(staff).where(eq(staff.id, staffId));
    if (staffResult.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    const staffMember = staffResult[0];

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Check if there's already a pending or approved request for today
    const existingRequest = await db.select()
      .from(approvalRequests)
      .where(
        and(
          eq(approvalRequests.staffId, staffId),
          eq(approvalRequests.siteId, siteId),
          eq(approvalRequests.date, dateStr)
        )
      );

    if (existingRequest.length > 0) {
      const existing = existingRequest[0];
      if (existing.status === 'approved') {
        // Already approved - check if shift exists
        const approvedShift = await db.select().from(shifts).where(
          and(
            eq(shifts.staffId, staffId),
            eq(shifts.siteId, siteId),
            eq(shifts.date, dateStr)
          )
        );
        if (approvedShift.length > 0) {
          return res.json({
            message: 'Your request was already approved. You may clock in to your shift.',
            status: 'approved',
            shift: approvedShift[0]
          });
        }
      } else if (existing.status === 'pending') {
        return res.json({
          message: 'Your request is pending admin approval. Your scan time has been recorded.',
          status: 'pending',
          requestId: existing.id,
          scanTime: existing.requestTime
        });
      } else if (existing.status === 'rejected') {
        return res.status(403).json({
          error: 'Your request for today was rejected. Please contact your manager.',
          status: 'rejected'
        });
      }
    }

    // Create a new approval request (records the scan time)
    console.log(`[UnscheduledClockIn] Creating approval request for ${staffMember.name} at ${site.name}`);

    const newRequest = await db.insert(approvalRequests).values({
      staffId: staffId,
      staffName: staffMember.name,
      siteId: site.id,
      siteName: site.name,
      date: dateStr,
      requestTime: now,
      status: 'pending',
      notes: `Scan time recorded: ${now.toISOString()}`,
      createdAt: now,
      updatedAt: now
    }).returning();

    console.log(`[UnscheduledClockIn] Approval request created: ${newRequest[0].id}`);

    res.json({
      message: 'Your arrival has been recorded and is pending admin approval.',
      status: 'pending',
      requestId: newRequest[0].id,
      scanTime: now.toISOString(),
      siteName: site.name
    });
  } catch (error) {
    console.error('Error in unscheduled clock-in:', error);
    res.status(500).json({ error: 'Failed to process unscheduled clock-in' });
  }
});

// Update shift status (accept/decline)
app.patch('/api/shifts/:id/status', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const id = req.params.id as string;
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
    const siteId = req.params.siteId as string;

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

// Auto-accept migration endpoint
app.post('/api/migrate-auto-accept', async (req: Request, res: Response) => {
  const { migrateAutoAccept } = await import('./migrate-auto-accept.js');
  return migrateAutoAccept(req, res);
});

// Manual clock-out endpoint
app.post('/api/manual-clockout', async (req: Request, res: Response) => {
  const { manualClockOut } = await import('./manual-clockout.js');
  return manualClockOut(req, res);
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
    // Migration 4 complete (Leave tables)
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
      CREATE TABLE IF NOT EXISTS approval_requests(
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
    const status = req.query.status as string;

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
    const staffId = req.query.staffId as string;
    const siteId = req.query.siteId as string;
    const date = req.query.date as string;

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
    const id = req.params.id as string;
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

    // Use the original scan/request time as clock-in time
    const scanTime = new Date(approvalData.requestTime);
    const hour = scanTime.getHours();
    const shiftType = (hour >= 20 || hour < 8) ? 'Night' : 'Day';
    const startTime = `${String(hour).padStart(2, '0')}:${String(scanTime.getMinutes()).padStart(2, '0')}`;

    // Create shift with worker already clocked in at their original scan time
    await db.insert(shifts).values({
      id: shiftId,
      staffId: approvalData.staffId,
      staffName: approvalData.staffName,
      siteId: approvalData.siteId,
      siteName: approvalData.siteName,
      siteColor,
      date: approvalData.date,
      type: shiftType,
      startTime: startTime,
      endTime: '17:00', // Default end, will be updated on clock-out
      duration: 8,
      isBank: false,
      clockedIn: true,
      clockInTime: scanTime, // Use original scan time!
      clockedOut: false,
      staffStatus: 'accepted',
      notes: `Approved unscheduled shift by ${approvedBy}. Clocked in at scan time: ${scanTime.toISOString()}`
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
    const id = req.params.id as string;
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

// Migration: Convert existing UNSCHED_ shifts to approval records
app.post('/api/admin/migrate-unsched-shifts', async (_req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });

    console.log('[Migration] Starting UNSCHED_ shifts migration...');

    // Find all UNSCHED_ shifts
    const unschedShifts = await db.select().from(shifts).where(
      sql`${shifts.id} LIKE 'UNSCHED_%'`
    );

    console.log(`[Migration] Found ${unschedShifts.length} UNSCHED_ shifts to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const shift of unschedShifts) {
      // Check if approval record already exists for this shift
      const existing = await db.select().from(approvalRequests).where(
        and(
          eq(approvalRequests.staffId, shift.staffId),
          eq(approvalRequests.siteId, shift.siteId),
          eq(approvalRequests.date, shift.date)
        )
      );

      if (existing.length > 0) {
        console.log(`[Migration] Skipping ${shift.id} - approval record already exists`);
        skipped++;
        continue;
      }

      // Create approval record with status=approved (since shift exists)
      await db.insert(approvalRequests).values({
        staffId: shift.staffId,
        staffName: shift.staffName,
        siteId: shift.siteId,
        siteName: shift.siteName,
        date: shift.date,
        requestTime: shift.clockInTime || shift.createdAt || new Date(),
        status: 'approved',
        approvedBy: 'System Migration',
        approvedAt: shift.createdAt || new Date(),
        notes: `Migrated from UNSCHED_ shift ${shift.id}`,
        createdAt: shift.createdAt || new Date(),
        updatedAt: new Date()
      });

      migrated++;
      console.log(`[Migration] Migrated ${shift.id} for ${shift.staffName}`);
    }

    console.log(`[Migration] Complete. Migrated: ${migrated}, Skipped: ${skipped}`);

    res.json({
      success: true,
      message: `Migration complete. ${migrated} shifts migrated, ${skipped} skipped (already had records).`,
      migrated,
      skipped,
      total: unschedShifts.length
    });
  } catch (error) {
    console.error('[Migration] Error:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});

// Admin: Recalculate durations for completed shifts
app.post('/api/admin/recalculate-durations', async (_req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });

    console.log('[RecalcDurations] Starting duration recalculation...');

    // Get all shifts (simpler query first to avoid boolean issues)
    const allShifts = await db.select().from(shifts);
    console.log(`[RecalcDurations] Found ${allShifts.length} total shifts`);

    // Filter to completed shifts
    const completedShifts = allShifts.filter(s =>
      s.clockedIn === true && s.clockedOut === true && s.clockInTime && s.clockOutTime
    );
    console.log(`[RecalcDurations] ${completedShifts.length} are completed with clock times`);

    let fixed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const shift of completedShifts) {
      try {
        const clockIn = new Date(shift.clockInTime!);
        const clockOut = new Date(shift.clockOutTime!);

        // Validate dates
        if (isNaN(clockIn.getTime()) || isNaN(clockOut.getTime())) {
          console.log(`[RecalcDurations] Invalid date for ${shift.id}`);
          skipped++;
          continue;
        }

        const diffMs = clockOut.getTime() - clockIn.getTime();
        const actualDuration = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

        // Only update if duration is different by more than 0.1 hours
        const currentDuration = shift.duration ?? 0;
        if (Math.abs(actualDuration - currentDuration) > 0.1) {
          await db.update(shifts)
            .set({
              duration: actualDuration,
              updatedAt: new Date()
            })
            .where(eq(shifts.id, shift.id));

          console.log(`[RecalcDurations] Fixed ${shift.id}: ${currentDuration}h → ${actualDuration}h`);
          fixed++;
        } else {
          skipped++;
        }
      } catch (shiftError: any) {
        console.error(`[RecalcDurations] Error processing ${shift.id}:`, shiftError);
        errors.push(`${shift.id}: ${shiftError.message}`);
      }
    }

    console.log(`[RecalcDurations] Complete. Fixed: ${fixed}, Skipped: ${skipped}, Errors: ${errors.length}`);

    res.json({
      success: true,
      message: `Duration recalculation complete. ${fixed} shifts fixed, ${skipped} already correct.`,
      fixed,
      skipped,
      total: completedShifts.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('[RecalcDurations] Error:', error);
    res.status(500).json({ error: 'Recalculation failed', details: error.message });
  }
});

// Admin: Fix a single shift's duration
app.post('/api/admin/fix-shift-duration/:shiftId', async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not configured' });
    const shiftId = req.params.shiftId as string;

    console.log(`[FixShift] Fixing duration for ${shiftId}`);

    // Get the shift
    const shiftResult = await db.select().from(shifts).where(eq(shifts.id, shiftId));
    if (shiftResult.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    const shift = shiftResult[0];

    if (!shift.clockInTime || !shift.clockOutTime) {
      return res.status(400).json({ error: 'Shift missing clock times' });
    }

    const clockIn = new Date(shift.clockInTime);
    const clockOut = new Date(shift.clockOutTime);
    const diffMs = clockOut.getTime() - clockIn.getTime();
    const actualDuration = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    console.log(`[FixShift] Calculated duration: ${actualDuration}h (was ${shift.duration}h)`);

    // First try: Update just the notes field (should work if any update works)
    let testUpdate;
    try {
      testUpdate = await db.update(shifts)
        .set({ notes: `Test update at ${new Date().toISOString()}` })
        .where(eq(shifts.id, shiftId))
        .returning({ id: shifts.id });
      console.log('[FixShift] Test notes update succeeded:', testUpdate);
    } catch (testErr: any) {
      console.error('[FixShift] Test notes update FAILED:', testErr.message);
      return res.status(500).json({
        error: 'Even simple update failed',
        details: testErr.message,
        hypothesis: 'Database connection or permissions issue'
      });
    }

    // Second try: Update duration with rounded integer
    const roundedDuration = Math.round(actualDuration);
    try {
      const durationUpdate = await db.update(shifts)
        .set({ duration: roundedDuration })
        .where(eq(shifts.id, shiftId))
        .returning({ id: shifts.id, duration: shifts.duration });
      console.log('[FixShift] Integer duration update succeeded:', durationUpdate);

      // Verify
      const verify = await db.select({ duration: shifts.duration }).from(shifts).where(eq(shifts.id, shiftId));

      return res.json({
        success: true,
        shiftId,
        oldDuration: shift.duration,
        newDuration: roundedDuration,
        note: 'Rounded to integer due to float issues',
        verification: verify
      });
    } catch (durationErr: any) {
      console.error('[FixShift] Duration update FAILED:', durationErr.message);
      return res.status(500).json({
        error: 'Duration update failed but notes update worked',
        details: durationErr.message,
        hypothesis: 'Issue with duration float type',
        testUpdateWorked: testUpdate
      });
    }
  } catch (error: any) {
    console.error('[FixShift] Error:', error);
    res.status(500).json({ error: 'Fix failed', details: error.message });
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

  // Initialize auto-accept job scheduler
  try {
    const { autoAcceptPendingShifts, lockExpiredShifts, setWeekDeadlines } = await import('./jobs/autoAcceptShifts.js');

    // Set deadlines for existing shifts on startup
    await setWeekDeadlines();

    // Run auto-accept and lock jobs immediately on startup
    await autoAcceptPendingShifts();
    await lockExpiredShifts();

    // Schedule jobs to run every minute
    setInterval(async () => {
      await autoAcceptPendingShifts();
      await lockExpiredShifts();
    }, 60000); // Run every 60 seconds

    console.log('✅ Auto-accept job scheduler initialized');
  } catch (error: any) {
    console.error('⚠️  Failed to initialize auto-accept scheduler:', error.message);
  }

  // Initialize auto clock-out job for past shifts
  try {
    const { startAutoClockOutJob } = await import('./jobs/autoClockOutPastShifts.js');
    startAutoClockOutJob();
    console.log('✅ Auto clock-out job scheduler initialized');
  } catch (error: any) {
    console.error('⚠️  Failed to initialize auto clock-out scheduler:', error.message);
  }


});

