import { NextFunction, Request, Response } from 'express';
import { validateSessionToken } from '../services/sessionService.js';

const AUTH_ERROR = { error: 'Authentication required' };
type DbLike = any;

export function getBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function createAuthenticateRequest(database: DbLike) {
  return async function authenticateRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const token = getBearerToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json(AUTH_ERROR);
      }

      const authenticated = await validateSessionToken(database, token);
      if (!authenticated) {
        return res.status(401).json(AUTH_ERROR);
      }

      req.authUser = authenticated.user;
      req.authSession = authenticated.session;
      return next();
    } catch (error) {
      console.error('Authentication middleware failed:', error);
      return res.status(401).json(AUTH_ERROR);
    }
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json(AUTH_ERROR);
  }

  if (req.authUser.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  return next();
}
