'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import toast from 'react-hot-toast';
import type { ProjectMember, Task } from '@/types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  defaultStatus?: Task['status'];
  members: ProjectMember[];
}

export default function CreateTaskModal({ open, onClose, projectId, defaultStatus = 'todo', members }: CreateTaskModalProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<{
    title: string;
    description: string;
    status: Task['status'];
    priority: string;
    deadline: string;
    estimatedHours: string;
    assignee: string;
    tags: string;
  }>({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'medium',
    deadline: '',
    estimatedHours: '',
    assignee: '',
    tags: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: create, isPending } = useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task created!');
      onClose();
      setForm({ title: '', description: '', status: defaultStatus, priority: 'medium', deadline: '', estimatedHours: '', assignee: '', tags: '' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to create task');
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title || form.title.length < 3) errs.title = 'Title must be at least 3 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    create({
      title: form.title,
      description: form.description,
      status: form.status as Task['status'],
      priority: form.priority,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
      assignee: form.assignee || null,
      project: projectId,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="glass-card w-full max-w-lg p-6 shadow-2xl shadow-black/50"
              initial={{ scale: 0.93, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-foreground">Create Task</h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Implement login page" className={`input-base ${errors.title ? 'border-red-500/50' : ''}`} autoFocus />
                  {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Task details..." rows={3} className="input-base resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Task['status'] })} className="input-base">
                      <option value="todo">To Do</option>
                      <option value="inprogress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="done">Done</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-base">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Assignee</label>
                    <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} className="input-base">
                      <option value="">Unassigned</option>
                      {members.map((m) => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Est. Hours</label>
                    <input type="number" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} min="0" max="999" placeholder="0" className="input-base" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Deadline</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input-base" min={new Date().toISOString().split('T')[0]} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Tags <span className="text-muted-foreground font-normal">(comma separated)</span></label>
                  <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="bug, frontend, urgent" className="input-base" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isPending} className="btn-primary flex-1">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
