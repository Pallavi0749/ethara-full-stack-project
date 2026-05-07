'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  FolderKanban, Clock, Users, CheckSquare, MoreVertical,
  Archive, Trash2, ExternalLink, Plus, Grid, List, Search,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, getPriorityColor, cn, truncate } from '@/lib/utils';
import { SkeletonCard } from '@/components/shared/SkeletonLoaders';
import { EmptyProjects } from '@/components/shared/EmptyStates';
import { AvatarGroup } from '@/components/shared/Avatar';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import toast from 'react-hot-toast';
import type { Project } from '@/types';

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const completionRate = project.taskStats
    ? project.taskStats.total > 0
      ? Math.round((project.taskStats.done / project.taskStats.total) * 100)
      : 0
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-5 hover:border-white/20 hover-glow transition-all duration-300 group flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg"
            style={{ background: `${project.color}25`, border: `1px solid ${project.color}40` }}
          >
            <FolderKanban className="w-4.5 h-4.5" style={{ color: project.color, width: 18, height: 18 }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{project.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="absolute right-0 top-8 w-44 glass-card border border-white/15 shadow-xl z-10 overflow-hidden"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Link href={`/projects/${project._id}`} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-white/5 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Project
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(project._id); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Project
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground font-medium">{completionRate}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: project.color }}
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/8">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />
            {project.taskStats?.total || 0} tasks
          </span>
          {project.deadline && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(project.deadline)}
            </span>
          )}
        </div>
        <AvatarGroup
          users={[project.owner, ...project.members.map((m) => m.user)]}
          max={3}
          size="xs"
        />
      </div>

      {/* Open button */}
      <Link
        href={`/projects/${project._id}`}
        className="mt-3 btn-secondary text-xs w-full justify-center"
      >
        Open Project
      </Link>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { search, status: statusFilter }],
    queryFn: () => projectService.getAll({ search: search || undefined, status: statusFilter || undefined } as Record<string, string>),
  });

  const { mutate: deleteProject } = useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: () => toast.error('Failed to delete project'),
  });

  const projects: Project[] = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base w-40"
          >
            <option value="">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-white/10 text-foreground' : 'text-muted-foreground')}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-white/10 text-foreground' : 'text-muted-foreground')}>
              <List className="w-4 h-4" />
            </button>
          </div>

          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {/* Projects */}
        {isLoading ? (
          <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3')}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card">
            <EmptyProjects onCreateProject={() => setCreateOpen(true)} />
          </div>
        ) : (
          <motion.div
            layout
            className={cn(viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3')}
          >
            <AnimatePresence mode="popLayout">
              {projects.map((p) => (
                <ProjectCard key={p._id} project={p} onDelete={deleteProject} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </DashboardLayout>
  );
}
