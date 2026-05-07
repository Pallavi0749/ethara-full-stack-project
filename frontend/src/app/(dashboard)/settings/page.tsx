'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppStore';
import { setUser } from '@/store/authSlice';
import { Avatar } from '@/components/shared/Avatar';
import { motion } from 'framer-motion';
import { User, Lock, Camera, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<'profile' | 'security'>('profile');
  const [profile, setProfile] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const { mutate: updateProfile, isPending: savingProfile } = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('name', profile.name);
      fd.append('bio', profile.bio);
      return authService.updateProfile(fd);
    },
    onSuccess: (res) => { dispatch(setUser(res.data)); toast.success('Profile updated!'); },
    onError: () => toast.error('Failed to update profile'),
  });

  const { mutate: changePassword, isPending: changingPw } = useMutation({
    mutationFn: () => authService.changePassword(passwords),
    onSuccess: () => { toast.success('Password changed!'); setPasswords({ currentPassword: '', newPassword: '' }); },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl animate-fade-in">
        {/* Tabs */}
        <div className="flex border-b border-white/8 mb-6">
          {(['profile', 'security'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-all ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t === 'profile' ? <span className="flex items-center gap-2"><User className="w-4 h-4" /> Profile</span> : <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Security</span>}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Avatar */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Profile Picture</h3>
              <div className="flex items-center gap-4">
                <Avatar src={user.avatar} name={user.name} size="xl" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Upload a new profile photo</p>
                  <label className="btn-secondary cursor-pointer text-xs">
                    <Camera className="w-3.5 h-3.5" /> Change Photo
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const fd = new FormData();
                        fd.append('avatar', e.target.files[0]);
                        fd.append('name', user.name);
                        authService.updateProfile(fd).then((res) => { dispatch(setUser(res.data)); toast.success('Avatar updated!'); });
                      }
                    }} />
                  </label>
                </div>
              </div>
            </div>

            {/* Profile form */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input type="email" value={user.email} disabled className="input-base opacity-50 cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
                  <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} placeholder="Tell your team a bit about yourself..." className="input-base resize-none" maxLength={200} />
                  <p className="text-xs text-muted-foreground mt-1">{profile.bio.length}/200</p>
                </div>
                <button onClick={() => updateProfile()} disabled={savingProfile} className="btn-primary">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </div>

            {/* Account info */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Account Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="text-foreground capitalize">{user.role}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Member since</span><span className="text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email verified</span><span className={user.isEmailVerified ? 'text-emerald-400' : 'text-yellow-400'}>{user.isEmailVerified ? 'Verified' : 'Pending'}</span></div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label>
                <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="input-base" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="input-base" placeholder="Min. 8 characters" />
              </div>
              <button onClick={() => changePassword()} disabled={!passwords.currentPassword || !passwords.newPassword || changingPw} className="btn-primary">
                {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
              </button>
              <p className="text-xs text-muted-foreground">Changing your password will log you out of all devices.</p>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
