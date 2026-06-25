const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/trends', dashboardController.getTrends);
router.get('/stats', dashboardController.getStats);
router.get('/map-data', dashboardController.getMapData);

module.exports = router; 