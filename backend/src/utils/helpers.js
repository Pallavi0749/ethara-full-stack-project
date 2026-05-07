const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

/**
 * Log an activity entry
 */
const logActivity = async ({ user, action, entity, entityId, entityTitle, project, metadata = {} }) => {
  try {
    await Activity.create({ user, action, entity, entityId, entityTitle, project, metadata });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

/**
 * Create a notification for a user
 */
const createNotification = async ({ user, title, message, type = 'general', link = null, relatedProject = null, relatedTask = null }) => {
  try {
    await Notification.create({ user, title, message, type, link, relatedProject, relatedTask });
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

/**
 * Paginate helper
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build sort object from query string
 */
const getSort = (sortBy = 'createdAt', sortOrder = 'desc') => {
  return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
};

module.exports = { logActivity, createNotification, getPagination, getSort };
