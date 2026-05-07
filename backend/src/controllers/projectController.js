const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logActivity, getPagination, getSort } = require('../utils/helpers');

/**
 * @desc    Get all projects (user's projects)
 * @route   GET /api/projects
 */
const getProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, priority, search, sortBy = 'createdAt', sortOrder = 'desc', archived } = req.query;

    const query = {
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    };

    if (archived !== 'true') query.isArchived = false;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.$text = { $search: search };

    const sort = getSort(sortBy, sortOrder);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    // Add task count to each project
    const projectIds = projects.map((p) => p._id);
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: projectIds }, isDeleted: false } },
      { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
    ]);

    const taskCountMap = {};
    taskCounts.forEach((tc) => { taskCountMap[tc._id.toString()] = tc; });

    const enriched = projects.map((p) => ({
      ...p,
      taskStats: taskCountMap[p._id.toString()] || { total: 0, done: 0 },
    }));

    return sendPaginated(res, enriched, page, limit, total);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 */
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!project) return sendError(res, 'Project not found.', 404);

    // Check access
    const isOwner = project.owner._id.toString() === req.user._id.toString();
    const isMember = project.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isOwner && !isMember) return sendError(res, 'Access denied.', 403);

    return sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create project
 * @route   POST /api/projects
 */
const createProject = async (req, res, next) => {
  try {
    const { title, description, color, priority, deadline, tags } = req.body;

    const project = await Project.create({
      title, description, color, priority, deadline, tags,
      owner: req.user._id,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await project.populate('owner', 'name email avatar');

    await logActivity({
      user: req.user._id,
      action: 'created_project',
      entity: 'project',
      entityId: project._id,
      entityTitle: project.title,
      project: project._id,
    });

    return sendSuccess(res, project, 'Project created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 */
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return sendError(res, 'Project not found.', 404);

    // Only owner or project admin can edit
    const isOwner = project.owner.toString() === req.user._id.toString();
    const member = project.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!isOwner && (!member || member.role !== 'admin')) {
      return sendError(res, 'Only project admins can update this project.', 403);
    }

    const allowedUpdates = ['title', 'description', 'color', 'priority', 'status', 'deadline', 'tags', 'isArchived'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    await logActivity({
      user: req.user._id,
      action: 'updated_project',
      entity: 'project',
      entityId: project._id,
      entityTitle: project.title,
      project: project._id,
    });

    return sendSuccess(res, project, 'Project updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return sendError(res, 'Project not found.', 404);

    if (project.owner.toString() !== req.user._id.toString()) {
      return sendError(res, 'Only the project owner can delete it.', 403);
    }

    // Soft delete all tasks
    await Task.updateMany({ project: project._id }, { isDeleted: true });

    await Project.findByIdAndDelete(req.params.id);

    return sendSuccess(res, null, 'Project deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
