export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar: string | null;
  bio: string;
  isEmailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  user: User;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  color: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
  deadline: string | null;
  tags: string[];
  owner: User;
  members: ProjectMember[];
  isArchived: boolean;
  createdBy: User;
  coverImage: string | null;
  taskStats?: { total: number; done: number };
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
}

export interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: User;
  createdAt: string;
}

export interface HistoryEntry {
  _id: string;
  user: User;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  action: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string | null;
  estimatedHours: number | null;
  project: Project | string;
  assignee: User | null;
  createdBy: User;
  tags: string[];
  comments: Comment[];
  attachments: Attachment[];
  history: HistoryEntry[];
  order: number;
  isDeleted: boolean;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  relatedProject: string | null;
  relatedTask: string | null;
  createdAt: string;
}

export interface Activity {
  _id: string;
  user: User;
  action: string;
  entity: string;
  entityId: string;
  entityTitle: string;
  project: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  summary: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    todoTasks: number;
    reviewTasks: number;
    overdueTasks: number;
    myTasks: number;
    completionRate: number;
  };
  taskStatusBreakdown: { _id: string; count: number }[];
  projectStatusBreakdown: { _id: string; count: number }[];
  weeklyTrend: { _id: string; count: number }[];
  priorityStats: { _id: string; count: number }[];
  recentActivity: Activity[];
  projectChartData: { name: string; color: string; todo: number; inprogress: number; done: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type TaskStatus = 'todo' | 'inprogress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
