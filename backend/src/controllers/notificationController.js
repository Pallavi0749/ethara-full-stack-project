const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { unread } = req.query;

    const query = { user: req.user._id };
    if (unread === 'true') query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    return res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification(s) as read
 * @route   PUT /api/notifications/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { ids, all } = req.body;

    if (all) {
      await Notification.updateMany({ user: req.user._id }, { isRead: true });
    } else if (ids && ids.length) {
      await Notification.updateMany(
        { _id: { $in: ids }, user: req.user._id },
        { isRead: true }
      );
    }

    return sendSuccess(res, null, 'Notifications marked as read.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    return sendSuccess(res, null, 'Notification deleted.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get activity feed for a project
 * @route   GET /api/activity/:projectId
 */
const getProjectActivity = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [activities, total] = await Promise.all([
      Activity.find({ project: req.params.projectId })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments({ project: req.params.projectId }),
    ]);

    return sendPaginated(res, activities, page, limit, total);
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification, getProjectActivity };
