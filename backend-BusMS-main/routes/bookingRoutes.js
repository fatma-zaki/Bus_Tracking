const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require("../middlewares/authMiddleware.js");
const authorizeRoles = require("../middlewares/authorizeRoles.js");

const bookingController = require('../controllers/bookingController');

// Parent routes
router.post('/create', protect, authorizeRoles("parent", "student"), bookingController.createBooking);
router.get('/parent', protect, authorizeRoles("parent"), bookingController.getParentBookings);
router.get('/student/:studentId', protect, authorizeRoles("parent", "student"), bookingController.getStudentBookings);
router.put('/status/:bookingId', protect, authorizeRoles("parent"), bookingController.updateBookingStatus);
router.delete('/cancel/:bookingId', protect, authorizeRoles("parent"), bookingController.cancelBooking);

// Available buses
router.get('/available-buses', protect, authorizeRoles("parent"), bookingController.getAvailableBuses);

// Admin routes
router.get('/', protect, adminOnly, bookingController.getAllBookings);
router.post('/', protect, adminOnly, bookingController.createBookingAdmin);
router.put('/:bookingId', protect, adminOnly, bookingController.updateBookingAdmin);
router.delete('/:bookingId', protect, adminOnly, bookingController.deleteBookingAdmin);
// Driver route
router.get('/driver', protect, authorizeRoles('driver'), bookingController.getDriverBookings);

module.exports = router; 