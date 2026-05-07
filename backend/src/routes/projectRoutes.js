const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { validate, createProjectSchema, updateProjectSchema } = require('../validators');

router.use(protect);

router.get('/', getProjects);
router.post('/', validate(createProjectSchema), createProject);
router.get('/:id', getProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
