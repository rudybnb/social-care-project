export interface StaffRecord {
  id: string;
  name: string;
  email?: string | null;
  username?: string | null;
  password?: string | null;
  role: string;
  site: string;
  status: string;
}

export interface SafeAuthUser {
  id: string;
  staffId: string;
  username: string | null;
  name: string;
  email: string | null;
  role: string;
  site: string;
  status: string;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'Admin';
}

export function sanitizeStaffForAuth(user: StaffRecord): SafeAuthUser {
  return {
    id: user.id,
    staffId: user.id,
    username: user.username ?? null,
    name: user.name,
    email: user.email ?? null,
    role: user.role,
    site: user.site,
    status: user.status,
  };
}
