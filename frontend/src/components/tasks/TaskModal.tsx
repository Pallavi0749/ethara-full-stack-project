'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, Calendar, Tag, MessageSquare, Send, Paperclip, Clock, History } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { Avatar } from '@/components/shared/Avatar';
import {
  cn, formatDate, formatDateTime, timeAgo, getPriorityColor, getStatusColor, getStatusLabel, isOverdue, formatFileSize,
} from '@/lib/utils';
import type { Task, ProjectMember } from '@/types';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['todo', 'inprogress', 'review', 'done', 'blocked'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  projectId: string;
  members?: ProjectMember[];
}

export default function TaskModal({ task, open, onClose, projectId, members = [] }: TaskModalProps) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history' | 'attachments'>('details');
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const { mutate: getAI, isPending: generatingAI } = useMutation({
    mutationFn: () => taskService.getAISummary(task!._id),
    onSuccess: (data) => setAiSummary(data.data.summary),
    onError: () => toast.error('Failed to generate AI summary'),
  });

  const { mutate: updateTask, isPending: updating } = useMutation({
    mutationFn: (data: Record<string, unknown>) => taskService.update(task!._id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success('Task updated');
    },
    onError: () => toast.error('Failed to update task'),
  });

  const { mutate: addComment, isPending: commenting } = useMutation({
    mutationFn: (text: string) => taskService.addComment(task!._id, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['task', task?._id] });
      setComment('');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const { mutate: uploadFile, isPending: uploadingFile } = useMutation({
    mutationFn: (file: File) => taskService.uploadAttachment(task!._id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['task', task?._id] });
      toast.success('File uploaded');
    },
    onError: () => toast.error('Upload failed'),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('File too large (max 5MB)');
      uploadFile(file);
    }
  };

  if (!task || !open) return null;
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/50"
              initial={{ scale: 0.93, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-3 p-5 border-b border-white/8">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`priority-dot ${task.priority}`} />
                    {overdue && (
                      <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Overdue</span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-foreground">{task.title}</h2>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/8 px-5">
                {(['details', 'comments', 'attachments', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-3 py-2.5 text-xs font-medium capitalize border-b-2 transition-all',
                      activeTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab} {tab === 'comments' && task.comments.length > 0 && `(${task.comments.length})`}
                    {tab === 'attachments' && task.attachments.length > 0 && `(${task.attachments.length})`}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {activeTab === 'details' && (
                  <div className="space-y-5">
                    {/* Description */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Description</label>
                      {task.description ? (
                        <p className="text-sm text-foreground whitespace-pre-wrap">{task.description}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No description</p>
                      )}
                    </div>

                    {/* AI Summary */}
                    <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Summary</span>
                        </div>
                        {!aiSummary && (
                          <button
                            onClick={() => getAI()}
                            disabled={generatingAI}
                            className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                          >
                            {generatingAI ? 'Generating...' : 'Generate'}
                          </button>
                        )}
                      </div>
                      {aiSummary ? (
                        <p className="text-xs text-foreground leading-relaxed italic">"{aiSummary}"</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">Click generate to get an AI-powered overview of this task.</p>
                      )}
                    </div>

                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Status */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Status</label>
                        <select
                          value={task.status}
                          onChange={(e) => updateTask({ status: e.target.value })}
                          className="input-base text-sm"
                          disabled={updating}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{getStatusLabel(s)}</option>
                          ))}
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Priority</label>
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask({ priority: e.target.value })}
                          className="input-base text-sm"
                          disabled={updating}
                        >
                          {PRIORITY_OPTIONS.map((p) => (
                            <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                          ))}
                        </select>
                      </div>

                      {/* Assignee */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Assignee</label>
                        <select
                          value={typeof task.assignee === 'object' ? task.assignee?._id || '' : task.assignee || ''}
                          onChange={(e) => updateTask({ assignee: e.target.value || null })}
                          className="input-base text-sm"
                          disabled={updating}
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Deadline */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Deadline</label>
                        <input
                          type="date"
                          value={task.deadline ? task.deadline.split('T')[0] : ''}
                          onChange={(e) => updateTask({ deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className={cn('input-base text-sm', overdue && 'border-red-500/50')}
                          disabled={updating}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-white/8">
                      <p>Created by <span className="text-foreground">{typeof task.createdBy === 'object' ? task.createdBy.name : 'Unknown'}</span> {timeAgo(task.createdAt)}</p>
                      <p>Last updated {timeAgo(task.updatedAt)}</p>
                      {task.estimatedHours && <p>Estimated: {task.estimatedHours}h</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Time Spent: {task.timeSpent || 0}h</span>
                        <button
                          onClick={() => updateTask({ timeSpent: (task.timeSpent || 0) + 1 })}
                          className="text-primary hover:underline ml-1"
                          disabled={updating}
                        >
                          +1h
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {task.comments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Start the conversation!</p>
                    )}
                    {task.comments.map((c) => (
                      <div key={c._id} className="flex gap-3">
                        <Avatar src={c.user.avatar} name={c.user.name} size="sm" className="flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">{c.user.name}</span>
                            <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                          </div>
                          <div className="text-sm text-foreground bg-white/5 rounded-lg px-3 py-2">{c.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs text-muted-foreground italic">Max file size: 5MB</p>
                      <label className="btn-secondary text-[10px] py-1 cursor-pointer">
                        <Plus className="w-3 h-3" /> Upload File
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                      </label>
                    </div>

                    {task.attachments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No attachments yet</p>
                    )}
                    {task.attachments.map((a) => (
                      <a key={a._id} href={`http://localhost:5000${a.url}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors">
                        <Paperclip className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{a.originalName}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(a.size)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-3">
                    {task.history.map((h, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="text-foreground capitalize">{h.action.replace(/_/g, ' ')}</span>
                          {h.field && h.field !== 'status' && <span className="text-muted-foreground"> on {h.field}</span>}
                          {h.newValue != null && <span className="text-primary"> → {String(h.newValue)}</span>}
                          <p className="text-muted-foreground mt-0.5">{timeAgo(h.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {task.history.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No history yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Comment input */}
              {activeTab === 'comments' && (
                <div className="p-4 border-t border-white/8 flex gap-3">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && comment.trim()) { e.preventDefault(); addComment(comment.trim()); } }}
                    placeholder="Add a comment..."
                    className="input-base flex-1 text-sm"
                    disabled={commenting}
                  />
                  <button
                    onClick={() => comment.trim() && addComment(comment.trim())}
                    disabled={!comment.trim() || commenting}
                    className="btn-primary px-3"
                  >
                    {commenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
