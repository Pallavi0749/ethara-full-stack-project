const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @desc    Get dashboard analytics
 * @route   GET /api/dashboard/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get user's projects
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
      isArchived: false,
    }).select('_id title color status');

    const projectIds = userProjects.map((p) => p._id);

    // Task stats
    const taskStats = await Task.aggregate([
      { $match: { project: { $in: projectIds }, isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const taskStatMap = {};
    taskStats.forEach((s) => { taskStatMap[s._id] = s.count; });

    const totalTasks = Object.values(taskStatMap).reduce((a, b) => a + b, 0);
    const completedTasks = taskStatMap['done'] || 0;
    const inProgressTasks = taskStatMap['inprogress'] || 0;
    const blockedTasks = taskStatMap['blocked'] || 0;
    const todoTasks = taskStatMap['todo'] || 0;
    const reviewTasks = taskStatMap['review'] || 0;

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      project: { $in: projectIds },
      isDeleted: false,
      status: { $ne: 'done' },
      deadline: { $lt: new Date() },
    });

    // Tasks assigned to me
    const myTasks = await Task.countDocuments({
      assignee: userId,
      isDeleted: false,
      status: { $ne: 'done' },
    });

    // Project status breakdown
    const projectStats = await Project.aggregate([
      { $match: { _id: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Weekly task completion trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyTrend = await Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          isDeleted: false,
          status: 'done',
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Priority breakdown
    const priorityStats = await Task.aggregate([
      { $match: { project: { $in: projectIds }, isDeleted: false, status: { $ne: 'done' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Recent activities
    const recentActivity = await Activity.find({ project: { $in: projectIds } })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Per-project task breakdown (for bar chart)
    const projectBreakdown = await Task.aggregate([
      { $match: { project: { $in: projectIds }, isDeleted: false } },
      {
        $group: {
          _id: { project: '$project', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    const projectBreakdownMap = {};
    projectBreakdown.forEach(({ _id, count }) => {
      const pid = _id.project.toString();
      if (!projectBreakdownMap[pid]) projectBreakdownMap[pid] = { todo: 0, inprogress: 0, done: 0, review: 0, blocked: 0 };
      projectBreakdownMap[pid][_id.status] = count;
    });

    const projectChartData = userProjects.map((p) => ({
      name: p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title,
      color: p.color,
      ...( projectBreakdownMap[p._id.toString()] || { todo: 0, inprogress: 0, done: 0 }),
    }));

    return sendSuccess(res, {
      summary: {
        totalProjects: userProjects.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        todoTasks,
        reviewTasks,
        overdueTasks,
        myTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      taskStatusBreakdown: taskStats,
      projectStatusBreakdown: projectStats,
      weeklyTrend,
      priorityStats,
      recentActivity,
      projectChartData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
