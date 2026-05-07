'use client';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
};

// Deterministic color from name
function getAvatarColor(name: string): string {
  const colors = [
    'from-violet-500 to-indigo-500',
    'from-pink-500 to-rose-500',
    'from-orange-500 to-amber-500',
    'from-emerald-500 to-teal-500',
    'from-sky-500 to-blue-500',
    'from-purple-500 to-fuchsia-500',
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizeClass = sizeMap[size];
  const color = getAvatarColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-white/10', sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        `bg-gradient-to-br ${color} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white/10 flex-shrink-0`,
        sizeClass,
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

export function AvatarGroup({
  users,
  max = 3,
  size = 'sm',
}: {
  users: { name: string; avatar?: string | null }[];
  max?: number;
  size?: 'xs' | 'sm';
}) {
  const shown = users.slice(0, max);
  const extra = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u, i) => (
        <Avatar key={i} src={u.avatar} name={u.name} size={size} className="border-2 border-card" />
      ))}
      {extra > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-white/10 border-2 border-card text-xs text-muted-foreground font-medium',
            size === 'xs' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8'
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
