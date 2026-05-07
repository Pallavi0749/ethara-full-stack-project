const { z } = require('zod');
const { sendError } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 400, errors);
  }
  req.body = result.data;
  next();
};

// Auth validators
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain a number'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Project validators
const createProjectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional().default(''),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .default('#6366f1'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  deadline: z.string().datetime().optional().nullable(),
  tags: z.array(z.string().max(30)).optional().default([]),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'archived']).optional(),
});

// Task validators
const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional().default(''),
  status: z.enum(['todo', 'inprogress', 'review', 'done', 'blocked']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  deadline: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().min(0).max(999).optional().nullable(),
  assignee: z.string().optional().nullable(),
  project: z.string().min(1, 'Project ID required'),
  tags: z.array(z.string().max(30)).optional().default([]),
});

const updateTaskSchema = createTaskSchema.partial().omit({ project: true });

const commentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(2000),
});

// Team validators
const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'member']).optional().default('member'),
  projectId: z.string().min(1, 'Project ID required'),
});

const updateRoleSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(['admin', 'member']),
  projectId: z.string().min(1),
});

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  commentSchema,
  inviteMemberSchema,
  updateRoleSchema,
};
