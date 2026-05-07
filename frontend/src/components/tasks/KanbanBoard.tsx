'use client';
import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, MessageSquare, Paperclip, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { Avatar } from '@/components/shared/Avatar';
import { EmptyTasks } from '@/components/shared/EmptyStates';
import {
  cn, formatDate, getPriorityColor, getStatusColor, getStatusLabel, isOverdue,
} from '@/lib/utils';
import type { Task } from '@/types';
import toast from 'react-hot-toast';

const COLUMNS: { id: Task['status']; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#94a3b8' },
  { id: 'inprogress', label: 'In Progress', color: '#60a5fa' },
  { id: 'review', label: 'In Review', color: '#a78bfa' },
  { id: 'done', label: 'Done', color: '#34d399' },
  { id: 'blocked', label: 'Blocked', color: '#f87171' },
];

interface KanbanBoardProps {
  tasks: Task[];
  projectId: string;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: Task['status']) => void;
}

function TaskCard({ task, index, onClick }: { task: Task; index: number; onClick: () => void }) {
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
        >
          <motion.div
            onClick={onClick}
            className={cn(
              'task-card mb-2',
              snapshot.isDragging && 'ring-2 ring-primary/50 shadow-xl shadow-primary/10 rotate-2',
              overdue && 'border-red-500/30 bg-red-500/5'
            )}
            layoutId={task._id}
            whileHover={{ y: -1 }}
          >
            {/* Priority dot */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`priority-dot ${task.priority}`} />
                <span className="text-xs font-medium text-foreground line-clamp-2 flex-1">{task.title}</span>
              </div>
              {overdue && <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />}
            </div>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {task.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                {task.deadline && (
                  <span className={cn('flex items-center gap-1 text-[10px]', overdue ? 'text-red-400' : '')}>
                    <Clock className="w-3 h-3" />
                    {formatDate(task.deadline)}
                  </span>
                )}
                {task.comments.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px]">
                    <MessageSquare className="w-3 h-3" />
                    {task.comments.length}
                  </span>
                )}
                {task.attachments.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px]">
                    <Paperclip className="w-3 h-3" />
                    {task.attachments.length}
                  </span>
                )}
              </div>
              {task.assignee && (
                <Avatar src={task.assignee.avatar} name={task.assignee.name} size="xs" />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanBoard({ tasks, projectId, onTaskClick, onAddTask }: KanbanBoardProps) {
  const qc = useQueryClient();

  const { mutate: reorder } = useMutation({
    mutationFn: taskService.reorder,
    onError: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.error('Failed to update task order');
    },
  });

  const getTasksByStatus = useCallback(
    (status: Task['status']) => tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order),
    [tasks]
  );

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as Task['status'];

    // Optimistically update
    qc.setQueryData(['tasks', projectId], (old: Task[] | undefined) => {
      if (!old) return old;
      return old.map((t) => (t._id === draggableId ? { ...t, status: newStatus, order: destination.index } : t));
    });

    // Recompute orders for the destination column
    const destTasks = getTasksByStatus(newStatus).filter((t) => t._id !== draggableId);
    destTasks.splice(destination.index, 0, tasks.find((t) => t._id === draggableId)!);
    const updates = destTasks.map((t, i) => ({ id: t._id, status: newStatus, order: i }));

    reorder(updates);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
        {COLUMNS.map((col) => {
          const colTasks = getTasksByStatus(col.id);
          return (
            <div key={col.id} className="kanban-column flex-shrink-0">
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-xs font-semibold text-foreground">{col.label}</span>
                  <span className="text-xs text-muted-foreground bg-white/8 rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTask(col.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Droppable */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-1 p-2 min-h-24 transition-colors duration-200',
                      snapshot.isDraggingOver && 'bg-primary/5'
                    )}
                  >
                    {colTasks.length === 0 && !snapshot.isDraggingOver ? (
                      <EmptyTasks onCreateTask={() => onAddTask(col.id)} />
                    ) : (
                      colTasks.map((task, i) => (
                        <TaskCard key={task._id} task={task} index={i} onClick={() => onTaskClick(task)} />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
