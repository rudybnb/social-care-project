import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../index.js';
import { staff } from '../schema.js';
import { eq, or, sql } from 'drizzle-orm';

const router: Router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Hardcoded admin credentials (fallback)
    if (username.toLowerCase() === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        user: {
          username: 'admin',
          name: 'Admin User',
          role: 'admin',
          staffId: 1
        }
      });
    }

    // Check for database connection
    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Query database for staff member by username (case-insensitive and trimmed)
    const trimmedUsername = username.trim();
    const staffMembers = await db
      .select()
      .from(staff)
      .where(
        or(
          sql`TRIM(LOWER(${staff.username})) = LOWER(${trimmedUsername})`,
          sql`TRIM(LOWER(${staff.name})) = LOWER(${trimmedUsername})`
        )
      );

    if (staffMembers.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = staffMembers[0];

    // Check if user has login credentials set
    if (!user.username || !user.password) {
      return res.status(401).json({ error: 'Login not configured for this staff member. Please contact admin.' });
    }

    // Check password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Determine role
    const role = user.role === 'Admin' || user.role === 'Site Manager' ? 'admin' : 'worker';

    // Return user info
    res.json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        role: role,
        staffId: user.id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/verify - Verify if user is logged in
router.get('/verify', async (req: Request, res: Response) => {
  // For now, just return success (no session management yet)
  res.json({ success: true });
});

export default router;

