// ── Analytics mock data ─────────────────────────────────────────

export interface DailyDataPoint {
  date: string;       // display label e.g. "May 6"
  sessions: number;
  users: number;
}

export interface ModelUsagePoint {
  name: string;
  value: number;      // percentage
  color: string;
}

export const DAILY_DATA: DailyDataPoint[] = [
  { date: 'May 6',  sessions: 180, users: 150 },
  { date: 'May 7',  sessions: 220, users: 180 },
  { date: 'May 8',  sessions: 190, users: 160 },
  { date: 'May 9',  sessions: 280, users: 210 },
  { date: 'May 10', sessions: 250, users: 195 },
  { date: 'May 11', sessions: 170, users: 140 },
  { date: 'May 12', sessions: 290, users: 220 },
];

export const MODEL_USAGE_DATA: ModelUsagePoint[] = [
  { name: 'GPT-4o + Medical', value: 65, color: '#2563EB' },
  { name: 'Claude 3 Opus',    value: 20, color: '#10B981' },
  { name: 'GPT-4 Turbo',      value: 15, color: '#F59E0B' },
];

export interface StatCardData {
  id: string;
  label: string;
  value: number;
  formatted: string;   // e.g. "1,248"
  trend: number;       // percentage
  suffix?: string;
}

export const STAT_CARDS: StatCardData[] = [
  { id: 'sessions',  label: 'Total Sessions',   value: 1248, formatted: '1,248', trend: 12.5 },
  { id: 'messages',  label: 'Total Messages',   value: 8521, formatted: '8,521', trend: 16.3 },
  { id: 'users',     label: 'Active Users',     value: 342,  formatted: '342',   trend: 8.7  },
  { id: 'images',    label: 'Images Analyzed',  value: 1102, formatted: '1,102', trend: 15.2 },
];

export const DEFAULT_DATE_RANGE = {
  from: new Date(2024, 4, 6),   // May 6, 2024
  to:   new Date(2024, 4, 12),  // May 12, 2024
};
