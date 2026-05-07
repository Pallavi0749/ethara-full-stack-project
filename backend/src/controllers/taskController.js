const Task = require('../models/Task');
const Project = require('../models/Project');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logActivity, createNotification, getPagination, getSort } = require('../utils/helpers');
const { emitToProject } = require('../config/socket');

/**
 * @desc    Get tasks (with filters)
 * @route   GET /api/tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { project, status, priority, assignee, search, sortBy = 'createdAt', sortOrder = 'desc', overdue } = req.query;

    const query = { isDeleted: false };

    if (project) {
      query.project = project;
    } else {
      // Only tasks from user's projects
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      query.project = { $in: userProjects.map((p) => p._id) };
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (search) query.$text = { $search: search };
    if (overdue === 'true') {
      query.deadline = { $lt: new Date() };
      query.status = { $ne: 'done' };
    }

    const sort = getSort(sortBy, sortOrder);

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignee', 'name email avatar')
        .populate('createdBy', 'name email')
        .populate('project', 'title color')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Task.countDocuments(query),
    ]);

    return sendPaginated(res, tasks, page, limit, total);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'title color')
      .populate('comments.user', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email')
      .populate('history.user', 'name email avatar');

    if (!task) return sendError(res, 'Task not found.', 404);
    return sendSuccess(res, task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create task
 * @route   POST /api/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, deadline, estimatedHours, assignee, project, tags } = req.body;

    // Verify project access
    const proj = await Project.findById(project);
    if (!proj) return sendError(res, 'Project not found.', 404);

    const isMember = proj.members.some((m) => m.user.toString() === req.user._id.toString());
    const isOwner = proj.owner.toString() === req.user._id.toString();
    if (!isMember && !isOwner) return sendError(res, 'Access denied to this project.', 403);

    // Get highest order for this status column
    const lastTask = await Task.findOne({ project, status: status || 'todo', isDeleted: false }).sort({ order: -1 });
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title, description, status, priority, deadline, estimatedHours,
      assignee: assignee || null,
      project, tags,
      createdBy: req.user._id,
      order,
      history: [{
        user: req.user._id,
        action: 'created',
        field: 'status',
        newValue: status || 'todo',
      }],
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'title color');

    // Notify assignee
    if (assignee && assignee !== req.user._id.toString()) {
      await createNotification({
        user: assignee,
        title: 'Task Assigned',
        message: `You have been assigned to "${title}" in ${proj.title}`,
        type: 'task_assigned',
        link: `/tasks/${task._id}`,
        relatedProject: project,
        relatedTask: task._id,
      });
    }

    await logActivity({
      user: req.user._id,
      action: 'created_task',
      entity: 'task',
      entityId: task._id,
      entityTitle: task.title,
      project,
    });

    emitToProject(project, 'task_created', task);

    return sendSuccess(res, task, 'Task created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false }).populate('project');
    if (!task) return sendError(res, 'Task not found.', 404);

    // Check access
    const proj = task.project;
    const isOwner = proj.owner.toString() === req.user._id.toString();
    const member = proj.members.find((m) => m.user.toString() === req.user._id.toString());
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();

    if (!isOwner && !member && !isAssignee) {
      return sendError(res, 'Access denied.', 403);
    }

    const historyEntry = { user: req.user._id };
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'deadline', 'estimatedHours', 'assignee', 'tags', 'order'];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== task[field]) {
        if (field === 'status') {
          historyEntry.action = 'status_changed';
          historyEntry.field = 'status';
          historyEntry.oldValue = task.status;
          historyEntry.newValue = req.body.status;

          // Notify assignee of status change
          if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
            createNotification({
              user: task.assignee,
              title: 'Task Status Updated',
              message: `"${task.title}" status changed to ${req.body.status}`,
              type: 'status_changed',
              relatedTask: task._id,
              relatedProject: proj._id,
            });
          }
        } else {
          historyEntry.action = 'updated';
          historyEntry.field = field;
          historyEntry.oldValue = task[field];
          historyEntry.newValue = req.body[field];
        }
        task[field] = req.body[field];
      }
    });

    if (historyEntry.action) task.history.push(historyEntry);

    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    await logActivity({
      user: req.user._id,
      action: historyEntry.action === 'status_changed' ? 'status_changed' : 'updated_task',
      entity: 'task',
      entityId: task._id,
      entityTitle: task.title,
      project: proj._id,
      metadata: historyEntry,
    });

    emitToProject(proj._id, 'task_updated', task);

    return sendSuccess(res, task, 'Task updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task (soft)
 * @route   DELETE /api/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false }).populate('project');
    if (!task) return sendError(res, 'Task not found.', 404);

    const proj = task.project;
    const isOwner = proj.owner.toString() === req.user._id.toString();
    const member = proj.members.find((m) => m.user.toString() === req.user._id.toString());

    if (!isOwner && (!member || member.role !== 'admin')) {
      return sendError(res, 'Only project admins can delete tasks.', 403);
    }

    task.isDeleted = true;
    await task.save();

    emitToProject(proj._id, 'task_deleted', { id: task._id });

    return sendSuccess(res, null, 'Task deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to task
 * @route   POST /api/tasks/:id/comments
 */
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) return sendError(res, 'Task not found.', 404);

    task.comments.push({ user: req.user._id, text });
    task.history.push({ user: req.user._id, action: 'commented', field: 'comments', newValue: text });
    await task.save();
    await task.populate('comments.user', 'name email avatar');

    const latestComment = task.comments[task.comments.length - 1];

    await logActivity({
      user: req.user._id,
      action: 'comment_added',
      entity: 'comment',
      entityId: task._id,
      entityTitle: task.title,
      project: task.project,
    });

    return sendSuccess(res, latestComment, 'Comment added.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk update task order (drag-drop)
 * @route   PUT /api/tasks/reorder
 */
const reorderTasks = async (req, res, next) => {
  try {
    const { tasks } = req.body; // [{ id, status, order }]
    if (!Array.isArray(tasks)) return sendError(res, 'tasks array required', 400);

    const operations = tasks.map(({ id, status, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { status, order } },
      },
    }));

    await Task.bulkWrite(operations);
    return sendSuccess(res, null, 'Tasks reordered successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate AI summary for task
 * @route   GET /api/tasks/:id/ai-summary
 */
const getTaskAISummary = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) return sendError(res, 'Task not found.', 404);

    const { generateTaskSummary } = require('../services/aiService');
    const summary = await generateTaskSummary(task);

    return sendSuccess(res, { summary }, 'AI summary generated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Parse smart task prompt
 * @route   POST /api/tasks/smart-parse
 */
const parseSmartTask = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return sendError(res, 'Prompt is required.', 400);

    const { parseTaskPrompt } = require('../services/aiService');
    const taskData = await parseTaskPrompt(prompt);

    if (!taskData) return sendError(res, 'Failed to parse task data.', 500);

    return sendSuccess(res, taskData, 'Task prompt parsed successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, addComment, reorderTasks, getTaskAISummary, parseSmartTask };

