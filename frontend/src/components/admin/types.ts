export type UserRole = 'admin' | 'user';

export interface MockUser {
  id: string;
  initials: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  joinedDate: string;
}

export type AdminNavItem =
  | 'dashboard'
  | 'users'
  | 'sessions'
  | 'analytics'
  | 'models'
  | 'settings';
