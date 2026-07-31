import { Router, Request, Response } from 'express';
import { staff } from '../schema.js';
import { eq, or, sql } from 'drizzle-orm';
import { createAuthenticateRequest } from '../middleware/auth.js';

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
  router.get('/', authenticateRequest, async (req: Request, res: Response) => {
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
  router.get('/:id', authenticateRequest, async (req: Request, res: Response) => {
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

  return router;
}
