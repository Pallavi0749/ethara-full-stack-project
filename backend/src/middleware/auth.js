const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookie
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return sendError(res, 'User no longer exists.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired. Please refresh your session.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token. Please log in again.', 401);
    }
    return sendError(res, 'Authentication failed.', 401);
  }
};

/**
 * Require admin role (global admin)
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return sendError(res, 'Admin access required.', 403);
};

/**
 * Require project-level admin role
 * Must be used after protect middleware
 * Requires req.project to be set (by project middleware)
 */
const requireProjectAdmin = (req, res, next) => {
  if (!req.project) return sendError(res, 'Project context required.', 400);

  const isOwner = req.project.owner.toString() === req.user._id.toString();
  if (isOwner) return next();

  const member = req.project.members.find(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (member && member.role === 'admin') return next();

  return sendError(res, 'Project admin access required.', 403);
};

/**
 * Require project membership (admin or member)
 */
const requireProjectMember = (req, res, next) => {
  if (!req.project) return sendError(res, 'Project context required.', 400);

  const isOwner = req.project.owner.toString() === req.user._id.toString();
  if (isOwner) return next();

  const isMember = req.project.members.some(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (isMember) return next();

  return sendError(res, 'You are not a member of this project.', 403);
};

module.exports = { protect, requireAdmin, requireProjectAdmin, requireProjectMember };
