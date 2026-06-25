// backend-BusMS/routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const Trip = require('../models/Trip');

router.post('/', protect, adminOnly, assignmentController.createAssignment);
router.get('/', protect, adminOnly, assignmentController.getAssignments);
router.get('/today', protect, assignmentController.getAssignmentForToday);

module.exports = router;
