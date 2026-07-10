import { format } from 'date-fns';

export function formatTimestamp(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

export function formatTimestampFull(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd HH:mm:ss');
}
