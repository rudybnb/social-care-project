import { Router, Request, Response } from 'express';
import { staff } from '../schema.js';
import { eq, or, sql } from 'drizzle-orm';
import { createAuthenticateRequest, requireAdmin } from '../middleware/auth.js';
import bcrypt from 'bcrypt';

type DbLike = any;

const STAFF_SAFE_FIELDS = ['id', 'name', 'username', 'role', 'site', 'status', 'email'] as const;

const SAFE_STAFF_COLUMNS = {
  id: staff.id,
  name: staff.name,
  username: staff.username,
  role: staff.role,
  site: staff.site,
  status: staff.status,
  email: staff.email,
};

function toSafeStaff(row: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const field of STAFF_SAFE_FIELDS) {
    safe[field] = row[field];
  }
  return safe;
}

function parseSearchQuery(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 100);
}

export function createStaffRouter(database: DbLike): Router {
  const router: Router = Router();
  const authenticateRequest = createAuthenticateRequest(database);

  // GET / — list or search staff
  router.get('/', authenticateRequest, requireAdmin, async (req: Request, res: Response) => {
    try {
      if (!database) return res.status(500).json({ error: 'Database not configured' });

      const query = parseSearchQuery(req.query.q);

      if (query) {
        const pattern = `%${query}%`;
        const rows = await database
          .select(SAFE_STAFF_COLUMNS)
          .from(staff)
          .where(
            or(
              sql`${staff.name} ILIKE ${pattern}`,
              sql`${staff.username} ILIKE ${pattern}`,
              sql`${staff.role} ILIKE ${pattern}`,
              sql`${staff.site} ILIKE ${pattern}`,
              sql`${staff.status} ILIKE ${pattern}`,
              sql`${staff.email} ILIKE ${pattern}`
            )
          )
          .limit(50);

        return res.json(rows.map(toSafeStaff));
      }

      const rows = await database.select(SAFE_STAFF_COLUMNS).from(staff).limit(50);
      return res.json(rows.map(toSafeStaff));
    } catch (error) {
      console.error('Error fetching staff:', error);
      return res.status(500).json({ error: 'Failed to fetch staff' });
    }
  });

  // GET /:id — get a single staff member
  router.get('/:id', authenticateRequest, requireAdmin, async (req: Request, res: Response) => {
    try {
      if (!database) return res.status(500).json({ error: 'Database not configured' });

      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: 'ID is required' });

      const staffMember = await database.select(SAFE_STAFF_COLUMNS).from(staff).where(eq(staff.id, id));
      if (staffMember.length === 0) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      return res.json(toSafeStaff(staffMember[0]));
    } catch (error) {
      console.error('Error fetching staff member:', error);
      return res.status(500).json({ error: 'Failed to fetch staff member' });
    }
  });

  // POST / — create new staff member (Admin only)
  router.post('/', authenticateRequest, requireAdmin, async (req: Request, res: Response) => {
    try {
      if (!database) return res.status(500).json({ error: 'Database not configured' });

      const { name, username, email, role, site, status, password, startDate } = req.body || {};

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Staff name is required' });
      }

      if (!password || typeof password !== 'string' || !password.trim()) {
        return res.status(400).json({ error: 'Temporary password is required' });
      }

      const autoUsername = username && typeof username === 'string' && username.trim()
        ? username.trim()
        : `staff_${Date.now()}`;

      const hashedPassword = await bcrypt.hash(password, 10);

      const staffData: any = {
        name: name.trim(),
        username: autoUsername,
        password: hashedPassword,
        email: email && typeof email === 'string' && email.trim() ? email.trim() : null,
        role: role && typeof role === 'string' ? role.trim() : 'Care Worker',
        site: site && typeof site === 'string' ? site.trim() : 'General',
        status: status === 'Inactive' ? 'Inactive' : 'Active',
        standardRate: '12.50',
        enhancedRate: '—',
        nightRate: '—',
        rates: '£12.50/h',
        pension: '—',
        deductions: '£0.00',
        tax: '—',
        weeklyHours: 0,
        startDate: startDate && typeof startDate === 'string' && startDate.trim() ? startDate.trim() : new Date().toISOString().split('T')[0]
      };

      const inserted = await database.insert(staff).values(staffData).returning();
      const createdStaff = inserted[0];
      return res.status(201).json(toSafeStaff(createdStaff));
    } catch (error: any) {
      console.error('Error creating staff member:', error);
      return res.status(500).json({ error: 'Failed to create staff member', details: error.message });
    }
  });

  // DELETE /:id — delete staff member (Admin only)
  router.delete('/:id', authenticateRequest, requireAdmin, async (req: Request, res: Response) => {
    try {
      if (!database) return res.status(500).json({ error: 'Database not configured' });

      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: 'ID is required' });

      const deleted = await database.delete(staff).where(eq(staff.id, id)).returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      return res.json({ success: true, message: 'Staff member deleted', staff: toSafeStaff(deleted[0]) });
    } catch (error: any) {
      console.error('Error deleting staff member:', error);
      return res.status(500).json({ error: 'Failed to delete staff member', details: error.message });
    }
  });

  // PATCH /:id/status — suspend or reactivate a staff member (Admin only)
  router.patch('/:id/status', authenticateRequest, requireAdmin, async (req: Request, res: Response) => {
    try {
      if (!database) return res.status(500).json({ error: 'Database not configured' });

      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: 'ID is required' });

      const { status } = req.body || {};
      if (status !== 'Active' && status !== 'Inactive') {
        return res.status(400).json({ error: 'Status must be "Active" or "Inactive"' });
      }

      const updated = await database
        .update(staff)
        .set({ status })
        .where(sql`${staff.id}::text = ${id}`)
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      return res.json({ success: true, staff: toSafeStaff(updated[0]) });
    } catch (error: any) {
      console.error('Error updating staff status:', error);
      return res.status(500).json({ error: 'Failed to update staff status', details: error.message });
    }
  });

  return router;
}
