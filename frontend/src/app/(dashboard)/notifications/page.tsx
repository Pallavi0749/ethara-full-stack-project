'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { EmptyNotifications } from '@/components/shared/EmptyStates';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  task_assigned: '📋', task_updated: '✏️', comment_added: '💬',
  member_invited: '👋', deadline_reminder: '⏰', status_changed: '🔄',
  project_created: '🚀', general: '🔔',
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll({ limit: 50 }),
    refetchInterval: 30000,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: () => notificationService.markAsRead(undefined, true),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read'); },
  });

  const { mutate: deleteNotif } = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: Notification[] = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <DashboardLayout>
      <div className="max-w-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">{unreadCount} unread</span>}
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markRead()} className="btn-secondary text-xs py-2 px-3">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="glass-card divide-y divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-white/10 rounded animate-pulse w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card"><EmptyNotifications /></div>
        ) : (
          <div className="glass-card overflow-hidden divide-y divide-white/5">
            <AnimatePresence>
              {notifications.map((n, i) => (
                <motion.div key={n._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-start gap-3 p-4 hover:bg-white/3 transition-colors ${!n.isRead ? 'bg-primary/3' : ''}`}>
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                    {TYPE_ICONS[n.type] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {n.link && (
                      <Link href={n.link} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <button onClick={() => deleteNotif(n._id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary ml-1" />}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
