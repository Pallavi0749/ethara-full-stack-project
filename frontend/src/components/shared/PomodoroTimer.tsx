'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      const nextMode = mode === 'work' ? 'break' : 'work';
      setMode(nextMode);
      setTimeLeft(nextMode === 'work' ? 25 * 60 : 5 * 60);
      toast.success(mode === 'work' ? 'Time for a break!' : 'Back to work!', { duration: 5000 });
      new Audio('/notification.mp3').play().catch(() => {});
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="glass-card p-4 w-64 mb-4 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{mode} session</span>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="text-4xl font-mono font-bold text-center text-foreground mb-6">
              {formatTime(timeLeft)}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button onClick={resetTimer} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleTimer}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95',
                  isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-primary text-white'
                )}
              >
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              <button
                onClick={() => {
                  const newMode = mode === 'work' ? 'break' : 'work';
                  setMode(newMode);
                  setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
                  setIsActive(false);
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
              >
                <Timer className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center glass-card shadow-lg hover:border-primary/50 transition-all',
          isActive && 'border-primary ring-2 ring-primary/20 animate-pulse'
        )}
      >
        <Timer className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
      </button>
    </div>
  );
}
