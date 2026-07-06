import type { MockUser } from './types';

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    initials: 'DS',
    name: 'Dr. Smith',
    username: 'dr.smith',
    email: 'dr.smith@hospital.com',
    role: 'admin',
    joinedDate: 'May 12, 2024',
  },
  {
    id: '2',
    initials: 'JD',
    name: 'Jane Doe',
    username: 'jane.doe',
    email: 'jane.doe@hospital.com',
    role: 'user',
    joinedDate: 'May 10, 2024',
  },
  {
    id: '3',
    initials: 'ML',
    name: 'Michael Lee',
    username: 'michael.lee',
    email: 'michael.lee@clinic.com',
    role: 'user',
    joinedDate: 'May 8, 2024',
  },
  {
    id: '4',
    initials: 'SW',
    name: 'Sarah Wang',
    username: 'sarah.wang',
    email: 'sarah.wang@hospital.com',
    role: 'user',
    joinedDate: 'May 5, 2024',
  },
  {
    id: '5',
    initials: 'AK',
    name: 'Alex Kim',
    username: 'alex.kim',
    email: 'alex.kim@medcenter.com',
    role: 'user',
    joinedDate: 'Apr 28, 2024',
  },
  {
    id: '6',
    initials: 'LP',
    name: 'Laura Patel',
    username: 'laura.patel',
    email: 'laura.patel@hospital.com',
    role: 'admin',
    joinedDate: 'Apr 20, 2024',
  },
  {
    id: '7',
    initials: 'TC',
    name: 'Thomas Chen',
    username: 'thomas.chen',
    email: 'thomas.chen@clinic.com',
    role: 'user',
    joinedDate: 'Apr 15, 2024',
  },
  {
    id: '8',
    initials: 'RM',
    name: 'Rachel Moore',
    username: 'rachel.moore',
    email: 'rachel.moore@hospital.com',
    role: 'user',
    joinedDate: 'Apr 10, 2024',
  },
];

export const TOTAL_USERS = 48;
export const PAGE_SIZE = 4;
