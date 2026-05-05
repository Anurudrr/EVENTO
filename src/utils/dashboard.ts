import type { UserRole } from '../types/index.ts';

export const getDashboardPathForRole = (role?: UserRole | string | null) => {
  if (role === 'admin') {
    return '/dashboard/admin';
  }

  return role === 'organizer' ? '/dashboard/seller' : '/dashboard/buyer';
};
