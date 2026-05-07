'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { Task } from '@/types';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }
    // Days of month
    for (let i = 1; i <= daysCount; i++) {
      days.push({ day: i, date: new Date(year, month, i) });
    }
    return days;
  }, [currentDate]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.deadline) {
        const key = t.deadline.split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/8 flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          {monthName}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="text-xs font-medium px-2 py-1 hover:text-primary transition-colors">Today</button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 border-b border-white/8">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="p-2 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {daysInMonth.map((d, i) => {
            if (d.day === null) return <div key={`empty-${i}`} className="border-b border-r border-white/5 bg-white/[0.01]" />;
            
            const key = d.date?.toISOString().split('T')[0] || '';
            const dayTasks = tasksByDay[key] || [];
            const isToday = key === new Date().toISOString().split('T')[0];

            return (
              <div key={key} className={cn('border-b border-r border-white/5 p-1 flex flex-col gap-1 overflow-hidden', isToday && 'bg-primary/5')}>
                <span className={cn('text-[11px] font-medium p-1 w-6 h-6 flex items-center justify-center rounded-full', isToday ? 'bg-primary text-white' : 'text-muted-foreground')}>
                  {d.day}
                </span>
                <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                  {dayTasks.map((t) => (
                    <motion.div
                      key={t._id}
                      onClick={() => onTaskClick(t)}
                      className={cn(
                        'text-[10px] px-1.5 py-1 rounded border border-white/10 cursor-pointer truncate hover:ring-1 hover:ring-primary/50 transition-all',
                        t.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t.title}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
