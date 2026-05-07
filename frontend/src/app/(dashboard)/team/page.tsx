'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '@/services';
import { projectService } from '@/services/projectService';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Crown, Shield, User, Trash2, Loader2, X } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { formatDate, timeAgo } from '@/lib/utils';
import { useAppSelector } from '@/hooks/useAppStore';
import toast from 'react-hot-toast';
import type { Project } from '@/types';

function InviteModal({ projectId, open, onClose }: { projectId: string; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: '', role: 'member' });
  const { mutate: invite, isPending } = useMutation({
    mutationFn: () => teamService.invite({ email: form.email, role: form.role, projectId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team', projectId] }); toast.success('Member invited!'); onClose(); setForm({ email: '', role: 'member' }); },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to invite member'),
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div className="glass-card w-full max-w-md p-6" initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-foreground">Invite Team Member</h3>
                <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="colleague@company.com" className="input-base" autoFocus />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-base">
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={() => invite()} disabled={!form.email || isPending} className="btn-primary flex-1">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Invite</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function TeamPage() {
  const { user } = useAppSelector((state) => state.auth);
  const qc = useQueryClient();
  const [selectedProject, setSelectedProject] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  const projects: Project[] = projectsData?.data || [];

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team', selectedProject],
    queryFn: () => teamService.getMembers(selectedProject),
    enabled: !!selectedProject,
  });

  const { mutate: removeM } = useMutation({
    mutationFn: (memberId: string) => teamService.removeMember(selectedProject, memberId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team', selectedProject] }); toast.success('Member removed'); },
    onError: () => toast.error('Failed to remove member'),
  });

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      teamService.updateRole({ memberId, role, projectId: selectedProject }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team', selectedProject] }); toast.success('Role updated'); },
    onError: () => toast.error('Failed to update role'),
  });

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Project selector */}
        <div className="flex items-center gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input-base max-w-xs"
          >
            <option value="">Select a project...</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>

          {selectedProject && (
            <button onClick={() => setInviteOpen(true)} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Invite Member
            </button>
          )}
        </div>

        {!selectedProject ? (
          <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a project to manage its team members</p>
          </div>
        ) : isLoading ? (
          <div className="glass-card p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded animate-pulse w-32" />
                  <div className="h-3 bg-white/10 rounded animate-pulse w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/8 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Team Members ({teamData ? (teamData.members?.length || 0) + 1 : 0})
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {/* Owner */}
              {teamData?.owner && (
                <motion.div className="flex items-center gap-4 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Avatar src={teamData.owner.avatar} name={teamData.owner.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{teamData.owner.name}</p>
                      <Crown className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">{teamData.owner.email}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">Owner</span>
                </motion.div>
              )}

              {/* Members */}
              <AnimatePresence>
                {(teamData?.members || []).map((m: { user: { _id: string; name: string; email: string; avatar: string | null }; role: string; joinedAt: string }, i: number) => (
                  <motion.div
                    key={m.user._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors"
                  >
                    <Avatar src={m.user.avatar} name={m.user.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.user.name}</p>
                      <p className="text-xs text-muted-foreground">{m.user.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Joined {timeAgo(m.joinedAt)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={m.role}
                        onChange={(e) => changeRole({ memberId: m.user._id, role: e.target.value })}
                        className="input-base text-xs py-1.5 w-28"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>

                      {m.user._id !== user?._id && (
                        <button
                          onClick={() => removeM(m.user._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {teamData?.members?.length === 0 && (
                <div className="p-8 text-center">
                  <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No other members yet. Invite someone!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <InviteModal projectId={selectedProject} open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </DashboardLayout>
  );
}
