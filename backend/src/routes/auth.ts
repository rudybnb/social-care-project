import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { createAuthenticateRequest } from '../middleware/auth.js';
import { createSession, revokeSessionById } from '../services/sessionService.js';
import { authenticateAdminCredentials } from '../services/adminAuthService.js';

const GENERIC_LOGIN_ERROR = { error: 'Invalid username or password' };
const DUMMY_BCRYPT_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8yJXNC0e92ATfyNAvjUxp5GAtp7O5u';
type DbLike = any;

export function createAuthRouter(database: DbLike): Router {
  const router: Router = Router();
  const authenticateRequest = createAuthenticateRequest(database);

  // POST /api/auth/admin/login - Phase 1A server-side admin session login
  router.post('/admin/login', async (req: Request, res: Response) => {
    try {
      const { username: rawUsername, password } = req.body || {};
      const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';

      if (!username || typeof password !== 'string' || !password) {
        await bcrypt.compare(typeof password === 'string' ? password : '', DUMMY_BCRYPT_HASH);
        return res.status(401).json(GENERIC_LOGIN_ERROR);
      }

      if (!database) {
        return res.status(500).json({ error: 'Database not configured' });
      }

      const user = await authenticateAdminCredentials(database, username, password);
      if (!user) {
        return res.status(401).json(GENERIC_LOGIN_ERROR);
      }

      const session = await createSession(database, user.staffId, {
        userAgent: req.get('user-agent') || undefined,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        token: session.token,
        expiresAt: session.expiresAt,
        user,
      });
    } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  // GET /api/auth/me - returns the authenticated session user only
  router.get('/me', authenticateRequest, async (req: Request, res: Response) => {
    return res.json({
      success: true,
      user: req.authUser,
      session: {
        expiresAt: req.authSession?.expiresAt,
      },
    });
  });

  // POST /api/auth/logout - revokes the current server-side session
  router.post('/logout', authenticateRequest, async (req: Request, res: Response) => {
    try {
      if (!req.authSession) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      await revokeSessionById(database, req.authSession.id);
      return res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Logout failed' });
    }
  });

  return router;
}

export default createAuthRouter;
