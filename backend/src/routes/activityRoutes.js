const express = require('express');
const router = express.Router();
const { getProjectActivity } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:projectId', getProjectActivity);

module.exports = router;
