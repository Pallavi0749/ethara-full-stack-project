'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FolderOpen, CheckSquare, Users, Bell, Search, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      )}
      {action && action}
    </motion.div>
  );
}

export function EmptyProjects({ onCreateProject }: { onCreateProject?: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen className="w-7 h-7" />}
      title="No projects yet"
      description="Create your first project to start organizing tasks and collaborating with your team."
      action={
        onCreateProject && (
          <button className="btn-primary" onClick={onCreateProject}>
            Create Project
          </button>
        )
      }
    />
  );
}

export function EmptyTasks({ onCreateTask }: { onCreateTask?: () => void }) {
  return (
    <EmptyState
      icon={<CheckSquare className="w-7 h-7" />}
      title="No tasks here"
      description="Add tasks to this column or create a new task to get started."
      action={
        onCreateTask && (
          <button className="btn-secondary" onClick={onCreateTask}>
            + Add Task
          </button>
        )
      }
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={<Bell className="w-6 h-6" />}
      title="All caught up!"
      description="No notifications right now. We'll let you know when something happens."
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<Search className="w-6 h-6" />}
      title={`No results for "${query}"`}
      description="Try adjusting your search or filters to find what you're looking for."
    />
  );
}
