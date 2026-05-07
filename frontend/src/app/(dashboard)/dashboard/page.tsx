'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services';
import { motion } from 'framer-motion';
import {
  FolderKanban, CheckSquare, Clock, AlertCircle, TrendingUp,
  Target, Users, Zap,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { SkeletonStats } from '@/components/shared/SkeletonLoaders';
import { Avatar } from '@/components/shared/Avatar';
import { timeAgo } from '@/lib/utils';
import type { DashboardStats } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  inprogress: '#60a5fa',
  review: '#a78bfa',
  done: '#34d399',
  blocked: '#f87171',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#34d399',
  medium: '#fbbf24',
  high: '#fb923c',
  critical: '#f87171',
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
  index: number;
}) {
  return (
    <motion.div
      className="stats-card hover-glow"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-emerald-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

function ActivityFeed({ activities }: { activities: DashboardStats['recentActivity'] }) {
  const actionLabels: Record<string, string> = {
    created_project: 'created project',
    updated_project: 'updated project',
    created_task: 'created task',
    updated_task: 'updated task',
    status_changed: 'changed status of',
    member_added: 'added member to',
    comment_added: 'commented on',
    assignment_added: 'was assigned',
  };

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
        )}
        {activities.map((a, i) => (
          <motion.div
            key={a._id}
            className="flex gap-3"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Avatar src={a.user?.avatar} name={a.user?.name || 'User'} size="xs" className="mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground">
                <span className="font-medium">{a.user?.name}</span>{' '}
                <span className="text-muted-foreground">{actionLabels[a.action] || a.action}</span>{' '}
                {a.entityTitle && <span className="font-medium">"{a.entityTitle}"</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(a.createdAt)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 60000,
  });

  if (isLoading || !stats) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <SkeletonStats />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card h-64 shimmer" />
            <div className="glass-card h-64 shimmer" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, taskStatusBreakdown, weeklyTrend, projectChartData, recentActivity, priorityStats } = stats;

  const pieData = taskStatusBreakdown.map((s) => ({
    name: s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] || '#6366f1',
  }));

  const trendData = (() => {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const found = weeklyTrend.find((w) => w._id === key);
      last7.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), completed: found?.count || 0 });
    }
    return last7;
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FolderKanban} label="Total Projects" value={summary.totalProjects} color="bg-violet-500/20 text-violet-400" index={0} />
          <StatCard icon={CheckSquare} label="Completed Tasks" value={summary.completedTasks} color="bg-emerald-500/20 text-emerald-400" sub={`${summary.completionRate}% done`} index={1} />
          <StatCard icon={Clock} label="In Progress" value={summary.inProgressTasks} color="bg-blue-500/20 text-blue-400" index={2} />
          <StatCard icon={AlertCircle} label="Overdue Tasks" value={summary.overdueTasks} color="bg-red-500/20 text-red-400" index={3} />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Target} label="Total Tasks" value={summary.totalTasks} color="bg-indigo-500/20 text-indigo-400" index={4} />
          <StatCard icon={TrendingUp} label="Blocked" value={summary.blockedTasks} color="bg-orange-500/20 text-orange-400" index={5} />
          <StatCard icon={Users} label="My Open Tasks" value={summary.myTasks} color="bg-pink-500/20 text-pink-400" index={6} />
          <StatCard icon={Zap} label="In Review" value={summary.reviewTasks} color="bg-purple-500/20 text-purple-400" index={7} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart — per project */}
          <motion.div
            className="glass-card p-5 lg:col-span-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Tasks by Project</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222 47% 11%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="todo" name="To Do" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="inprogress" name="In Progress" fill="#60a5fa" radius={[3, 3, 0, 0]} />
                <Bar dataKey="done" name="Done" fill="#34d399" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie Chart — task status */}
          <motion.div
            className="glass-card p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Task Status</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(222 47% 11%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs text-muted-foreground capitalize">{d.name === 'inprogress' ? 'In Progress' : d.name}</span>
                      </div>
                      <span className="text-xs font-medium text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
            )}
          </motion.div>
        </div>

        {/* Line chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            className="glass-card p-5 lg:col-span-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Completion Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222 47% 11%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <ActivityFeed activities={recentActivity} />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
