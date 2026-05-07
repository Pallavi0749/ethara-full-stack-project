const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, createNotification } = require('../utils/helpers');

/**
 * @desc    Invite member to project
 * @route   POST /api/team/invite
 */
const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'member', projectId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return sendError(res, 'Project not found.', 404);

    // Only project owner/admin can invite
    const isOwner = project.owner.toString() === req.user._id.toString();
    const adminMember = project.members.find(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    if (!isOwner && !adminMember) return sendError(res, 'Only project admins can invite members.', 403);

    // Find user
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) return sendError(res, 'No user found with that email address.', 404);

    // Check already member
    const alreadyMember = project.members.some((m) => m.user.toString() === invitedUser._id.toString());
    if (alreadyMember) return sendError(res, 'User is already a member of this project.', 409);

    // Add member
    project.members.push({ user: invitedUser._id, role });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    // Notify invited user
    await createNotification({
      user: invitedUser._id,
      title: 'Project Invitation',
      message: `${req.user.name} added you to "${project.title}" as ${role}`,
      type: 'member_invited',
      link: `/projects/${project._id}`,
      relatedProject: project._id,
    });

    await logActivity({
      user: req.user._id,
      action: 'member_added',
      entity: 'member',
      entityId: invitedUser._id,
      entityTitle: invitedUser.name,
      project: project._id,
      metadata: { role },
    });

    return sendSuccess(res, project.members, 'Member invited successfully.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update member role
 * @route   PUT /api/team/role
 */
const updateMemberRole = async (req, res, next) => {
  try {
    const { memberId, role, projectId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return sendError(res, 'Project not found.', 404);

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner) return sendError(res, 'Only the project owner can change roles.', 403);

    const member = project.members.find((m) => m.user.toString() === memberId);
    if (!member) return sendError(res, 'Member not found in this project.', 404);

    member.role = role;
    await project.save();

    await logActivity({
      user: req.user._id,
      action: 'role_changed',
      entity: 'member',
      entityId: memberId,
      project: project._id,
      metadata: { newRole: role },
    });

    return sendSuccess(res, null, `Role updated to ${role} successfully.`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/team/:projectId/:memberId
 */
const removeMember = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return sendError(res, 'Project not found.', 404);

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = project.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isOwner && !isAdmin) return sendError(res, 'Only project admins can remove members.', 403);
    if (memberId === project.owner.toString()) return sendError(res, 'Cannot remove the project owner.', 400);

    project.members = project.members.filter((m) => m.user.toString() !== memberId);
    await project.save();

    await logActivity({
      user: req.user._id,
      action: 'member_removed',
      entity: 'member',
      entityId: memberId,
      project: project._id,
    });

    return sendSuccess(res, null, 'Member removed successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project members with activity
 * @route   GET /api/team/:projectId/members
 */
const getProjectMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members.user', 'name email avatar role bio lastLogin')
      .populate('owner', 'name email avatar');

    if (!project) return sendError(res, 'Project not found.', 404);

    return sendSuccess(res, { owner: project.owner, members: project.members });
  } catch (error) {
    next(error);
  }
};

module.exports = { inviteMember, updateMemberRole, removeMember, getProjectMembers };
