const express = require('express');
const router = express.Router();
const {protect} = require("../middlewares/authMiddleware.js");
const authorizeRoles = require("../middlewares/authorizeRoles.js");

const busLocationController = require('../controllers/busLocationController');

// Driver routes
router.post('/update', protect, authorizeRoles("driver"), busLocationController.updateBusLocation);
router.get('/driver', protect, authorizeRoles("driver"), busLocationController.getDriverBusLocation);
router.put('/status', protect, authorizeRoles("driver"), busLocationController.setBusStatus);

// Public routes (for tracking)
router.get('/active', busLocationController.getActiveBusLocations);
router.get('/bus/:busId', busLocationController.getBusLocationById);
router.get('/route/:routeId', busLocationController.getBusLocationsByRoute);

// Parent route: get bus locations for all children
router.get('/parent', protect, authorizeRoles('parent'), busLocationController.getParentChildrenBusLocations);

module.exports = router; 