const express = require('express');
const router = express.Router();
const { inviteMember, updateMemberRole, removeMember, getProjectMembers } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const { validate, inviteMemberSchema, updateRoleSchema } = require('../validators');

router.use(protect);

router.post('/invite', validate(inviteMemberSchema), inviteMember);
router.put('/role', validate(updateRoleSchema), updateMemberRole);
router.get('/:projectId/members', getProjectMembers);
router.delete('/:projectId/:memberId', removeMember);

module.exports = router;
