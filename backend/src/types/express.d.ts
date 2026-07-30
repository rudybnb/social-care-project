import { SafeAuthUser } from '../services/authSanitizer.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: SafeAuthUser;
      authSession?: {
        id: string;
        staffId: string;
        expiresAt: Date;
        revokedAt: Date | null;
      };
    }
  }
}

export {};
