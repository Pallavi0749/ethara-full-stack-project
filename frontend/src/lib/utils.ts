import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(deadline: string | Date | null | undefined, status: string): boolean {
  if (!deadline || status === 'done') return false;
  const d = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  return isAfter(new Date(), d);
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    low: 'text-emerald-400 bg-emerald-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    high: 'text-orange-400 bg-orange-400/10',
    critical: 'text-red-400 bg-red-400/10',
  };
  return map[priority] || 'text-slate-400 bg-slate-400/10';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    todo: 'text-slate-400 bg-slate-400/10',
    inprogress: 'text-blue-400 bg-blue-400/10',
    review: 'text-purple-400 bg-purple-400/10',
    done: 'text-emerald-400 bg-emerald-400/10',
    blocked: 'text-red-400 bg-red-400/10',
  };
  return map[status] || 'text-slate-400 bg-slate-400/10';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    review: 'In Review',
    done: 'Done',
    blocked: 'Blocked',
  };
  return map[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return map[priority] || priority;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#84cc16',
];
