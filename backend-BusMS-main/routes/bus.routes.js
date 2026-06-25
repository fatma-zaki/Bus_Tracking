const express = require('express');
const router = express.Router();
const {protect} = require("../middlewares/authMiddleware.js");
const authorizeRoles = require("../middlewares/authorizeRoles.js")

const busController = require('../controllers/bus_controller');
router.post('/create', protect, authorizeRoles("admin", "manager"), busController.createBus);
router.get('/all', busController.getAllBuses);
router.get('/:id', protect, authorizeRoles("admin", "manager"), busController.getBusById);
router.put('/update/:id', protect, authorizeRoles("admin", "manager"), busController.updateBus);
router.delete('/delete/:id', protect, authorizeRoles("admin", "manager"), busController.deleteBus);
module.exports = router;