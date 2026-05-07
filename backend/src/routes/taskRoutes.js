const express = require('express');
const router = express.Router();
const {
  getTasks, getTask, createTask, updateTask, deleteTask, addComment, reorderTasks,
  getTaskAISummary, parseSmartTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, createTaskSchema, updateTaskSchema, commentSchema } = require('../validators');

router.use(protect);

router.get('/', getTasks);
router.post('/', validate(createTaskSchema), createTask);
router.post('/smart-parse', parseSmartTask);
router.put('/reorder', reorderTasks);
router.get('/:id', getTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', validate(commentSchema), addComment);
router.get('/:id/ai-summary', getTaskAISummary);
router.post('/:id/attachments', upload.single('attachment'), async (req, res, next) => {
  try {
    const Task = require('../models/Task');
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/attachments/${req.file.filename}`,
      uploadedBy: req.user._id,
    };

    task.attachments.push(attachment);
    task.history.push({ user: req.user._id, action: 'attachment_added', field: 'attachments', newValue: req.file.originalname });
    await task.save();

    res.status(201).json({ success: true, message: 'Attachment uploaded.', data: attachment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
