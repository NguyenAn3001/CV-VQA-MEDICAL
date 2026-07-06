export interface MockSession {
  id: string;
  title: string;
  model: string;
  user: {
    name: string;
    initials: string;
    avatarColor: string;
  };
  messageCount: number;
  createdAt: string;     // e.g. "May 12, 2024"
  createdTime: string;   // e.g. "10:42 AM"
  lastActive: string;    // e.g. "May 12, 2024"
  lastActiveTime: string;// e.g. "11:15 AM"
  status: 'active' | 'archived';
}

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: 's1',
    title: 'Brain MRI Analysis',
    model: 'GPT-4o + Medical',
    user: { name: 'Dr. John Smith', initials: 'JS', avatarColor: 'bg-blue-100 text-blue-700' },
    messageCount: 6,
    createdAt: 'May 12, 2024',
    createdTime: '10:42 AM',
    lastActive: 'May 12, 2024',
    lastActiveTime: '11:15 AM',
    status: 'active',
  },
  {
    id: 's2',
    title: 'CT Scan - Chest',
    model: 'GPT-4o + Medical',
    user: { name: 'Jane Doe', initials: 'JD', avatarColor: 'bg-emerald-100 text-emerald-700' },
    messageCount: 4,
    createdAt: 'May 11, 2024',
    createdTime: '09:30 AM',
    lastActive: 'May 11, 2024',
    lastActiveTime: '09:45 AM',
    status: 'active',
  },
  {
    id: 's3',
    title: 'X-ray Interpretation',
    model: 'Claude 3 Opus',
    user: { name: 'Michael Lee', initials: 'ML', avatarColor: 'bg-violet-100 text-violet-700' },
    messageCount: 8,
    createdAt: 'May 10, 2024',
    createdTime: '14:20 PM',
    lastActive: 'May 10, 2024',
    lastActiveTime: '15:10 PM',
    status: 'archived',
  },
  {
    id: 's4',
    title: 'Abdominal CT Review',
    model: 'GPT-4o + Medical',
    user: { name: 'Sarah Wang', initials: 'SW', avatarColor: 'bg-amber-100 text-amber-700' },
    messageCount: 5,
    createdAt: 'May 09, 2024',
    createdTime: '16:05 PM',
    lastActive: 'May 09, 2024',
    lastActiveTime: '16:30 PM',
    status: 'active',
  },
  {
    id: 's5',
    title: 'Follow-up: Treatment Plan',
    model: 'GPT-4 Turbo',
    user: { name: 'Dr. John Smith', initials: 'JS', avatarColor: 'bg-blue-100 text-blue-700' },
    messageCount: 3,
    createdAt: 'May 08, 2024',
    createdTime: '08:15 AM',
    lastActive: 'May 08, 2024',
    lastActiveTime: '08:25 AM',
    status: 'active',
  },
];
