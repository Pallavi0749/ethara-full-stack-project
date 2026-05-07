'use client';
import { usePathname } from 'next/navigation';
import { Bell, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/shared/Avatar';
import { useAppSelector } from '@/hooks/useAppStore';
import { useState } from 'react';
import Link from 'next/link';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'My Tasks',
  '/team': 'Team',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export default function Navbar({ onCreateProject }: { onCreateProject?: () => void }) {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const [searchOpen, setSearchOpen] = useState(false);

  const title =
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ??
    'ProjectFlow';

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/8 bg-card/30 backdrop-blur-xl sticky top-0 z-30">
      {/* Left: Title */}
      <motion.div
        key={title}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </motion.div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Create */}
        {pathname === '/projects' && (
          <button
            onClick={onCreateProject}
            className="btn-primary text-xs px-3 py-2 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
        )}

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-card" />
        </Link>

        {/* Avatar */}
        {user && (
          <Link href="/settings">
            <Avatar src={user.avatar} name={user.name} size="sm" className="cursor-pointer hover:ring-primary transition-all" />
          </Link>
        )}
      </div>
    </header>
  );
}
