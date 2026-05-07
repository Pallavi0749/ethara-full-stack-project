'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, Clock, AlertCircle, User, CheckSquare } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import TaskModal from '@/components/tasks/TaskModal';
import { SkeletonTable } from '@/components/shared/SkeletonLoaders';
import { EmptyTasks } from '@/components/shared/EmptyStates';
import { formatDate, getPriorityColor, getStatusColor, getStatusLabel, isOverdue, cn } from '@/lib/utils';
import type { Task } from '@/types';

export default function TasksPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState('');

  const params: Record<string, string | undefined> = { limit: '50', sortBy: 'deadline', sortOrder: 'asc' };
  if (statusFilter) params.status = statusFilter;
  if (priorityFilter) params.priority = priorityFilter;
  if (overdueOnly) params.overdue = 'true';
  if (search) params.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks', params],
    queryFn: () => taskService.getAll(params),
  });

  const tasks: Task[] = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-36">
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input-base w-36">
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all', overdueOnly ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground')}
          >
            <AlertCircle className="w-4 h-4" />
            Overdue
          </button>
        </div>

        {/* Task count summary */}
        <div className="flex items-center gap-2 text-sm">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Task list */}
        {isLoading ? (
          <SkeletonTable rows={8} />
        ) : tasks.length === 0 ? (
          <div className="glass-card">
            <EmptyTasks />
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Task</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Project</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Priority</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Assignee</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {tasks.map((task, i) => {
                      const overdue = isOverdue(task.deadline, task.status);
                      const proj = typeof task.project === 'object' ? task.project : null;
                      return (
                        <motion.tr
                          key={task._id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => { setSelectedTask(task); setTaskModalOpen(true); }}
                          className={cn('hover:bg-white/5 cursor-pointer transition-colors', overdue && 'bg-red-500/3')}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`priority-dot ${task.priority}`} />
                              <span className="text-sm text-foreground font-medium line-clamp-1 max-w-xs">{task.title}</span>
                              {overdue && <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {proj && (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <div className="w-2 h-2 rounded-full" style={{ background: proj.color }} />
                                {proj.title}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`status-badge text-xs capitalize ${getStatusColor(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`status-badge text-xs capitalize ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {task.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar src={task.assignee.avatar} name={task.assignee.name} size="xs" />
                                <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('text-xs', overdue ? 'text-red-400' : 'text-muted-foreground')}>
                              {formatDate(task.deadline)}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <TaskModal
        task={selectedTask}
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setSelectedTask(null); }}
        projectId={typeof selectedTask?.project === 'object' ? selectedTask.project._id : selectedTask?.project || ''}
        members={[]}
      />
    </DashboardLayout>
  );
}
