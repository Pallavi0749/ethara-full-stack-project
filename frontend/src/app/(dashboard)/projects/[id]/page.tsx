'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import CalendarView from '@/components/projects/CalendarView';
import TaskModal from '@/components/tasks/TaskModal';
import CreateTaskModal from '@/components/projects/CreateTaskModal';
import { Avatar, AvatarGroup } from '@/components/shared/Avatar';
import { Skeleton } from '@/components/shared/SkeletonLoaders';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Calendar, Tag, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate, getPriorityColor, cn } from '@/lib/utils';
import { getSocket, joinProject, leaveProject } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Task } from '@/types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<Task['status']>('todo');
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');

  useEffect(() => {
    if (!id) return;
    
    joinProject(id);
    const socket = getSocket();
    
    if (socket) {
      socket.on('task_created', () => {
        qc.invalidateQueries({ queryKey: ['tasks', id] });
        toast.success('Task created by a teammate');
      });
      
      socket.on('task_updated', () => {
        qc.invalidateQueries({ queryKey: ['tasks', id] });
      });
      
      socket.on('task_deleted', () => {
        qc.invalidateQueries({ queryKey: ['tasks', id] });
      });
    }

    return () => {
      leaveProject(id);
      socket?.off('task_created');
      socket?.off('task_updated');
      socket?.off('task_deleted');
    };
  }, [id, qc]);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskService.getAll({ project: id, limit: '100' }),
    enabled: !!id,
  });

  const tasks: Task[] = tasksData?.data || [];

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleAddTask = (status: Task['status']) => {
    setDefaultStatus(status);
    setCreateTaskOpen(true);
  };

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="flex gap-4 mt-6">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-72 h-96" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <button onClick={() => router.push('/projects')} className="btn-primary">Back to Projects</button>
        </div>
      </DashboardLayout>
    );
  }

  const allMembers = [{ user: project.owner, role: 'admin' as const, joinedAt: project.createdAt }, ...project.members];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button onClick={() => router.push('/projects')} className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ background: project.color }}
                />
                <h1 className="text-xl font-bold text-foreground">{project.title}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground max-w-xl">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {project.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Due {formatDate(project.deadline)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
                </span>
                {project.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    {project.tags.slice(0, 3).map((t: string) => (
                      <span key={t} className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group max-w-xs hidden md:block">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 group-focus-within:text-indigo-300 transition-colors" />
              <input
                type="text"
                placeholder="Smart task: 'High priority bug due Friday'"
                className="input-base pl-9 py-2 text-xs w-64 bg-indigo-500/5 border-indigo-500/20 focus:border-indigo-500/50"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (!val) return;
                    
                    const target = e.currentTarget;
                    target.disabled = true;
                    const tid = toast.loading('AI is parsing your task...');
                    
                    try {
                      const res = await taskService.smartParse(val);
                      // Fill the create modal with parsed data
                      // For now, we'll just create it directly or open modal
                      const newTask = await taskService.create({
                        ...res.data,
                        project: id,
                        status: 'todo'
                      });
                      qc.invalidateQueries({ queryKey: ['tasks', id] });
                      toast.success('Task created successfully!', { id: tid });
                      target.value = '';
                    } catch (err) {
                      toast.error('Failed to parse smart task', { id: tid });
                    } finally {
                      target.disabled = false;
                    }
                  }
                }}
              />
            </div>
            <AvatarGroup users={allMembers.map((m) => m.user)} max={5} size="sm" />
            <button onClick={() => setCreateTaskOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Task
            </button>
            <Link href={`/team?project=${id}`} className="btn-secondary p-2">
              <Users className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* View Switcher & Task count summary */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-3">
            {[
              { label: 'Total', value: tasks.length, color: 'bg-white/10 text-foreground' },
              { label: 'Todo', value: tasks.filter((t) => t.status === 'todo').length, color: 'bg-slate-500/20 text-slate-400' },
              { label: 'In Progress', value: tasks.filter((t) => t.status === 'inprogress').length, color: 'bg-blue-500/20 text-blue-400' },
              { label: 'Done', value: tasks.filter((t) => t.status === 'done').length, color: 'bg-emerald-500/20 text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1.5 ${color}`}>
                <span className="text-sm font-bold">{value}</span> {label}
              </div>
            ))}
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/8">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                view === 'kanban' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                view === 'calendar' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Calendar
            </button>
          </div>
        </div>

        {/* Content View */}
        {tasksLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-72 h-80" />)}
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            projectId={id}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTask}
          />
        ) : (
          <div className="h-[calc(100vh-280px)]">
            <CalendarView tasks={tasks} onTaskClick={handleTaskClick} />
          </div>
        )}
      </div>

      <TaskModal
        task={selectedTask}
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setSelectedTask(null); }}
        projectId={id}
        members={project.members}
      />

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={id}
        defaultStatus={defaultStatus}
        members={project.members}
      />
    </DashboardLayout>
  );
}
