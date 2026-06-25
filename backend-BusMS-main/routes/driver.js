const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect } = require('../middlewares/authMiddleware');

// جلب رحلات السائق الحالي
router.get('/trips', protect, driverController.getDriverTrips);

// بدء الرحلة
router.post('/trip/:tripId/start', protect, driverController.startTrip);

// إنهاء الرحلة
router.post('/trip/:tripId/end', protect, driverController.endTrip);

// تحديث الموقع اللحظي
router.post('/location', protect, driverController.updateLocation);

// تأكيد حضور الطلاب
router.post('/trip/:tripId/attendance/:studentId', protect, driverController.markAttendance);

module.exports = router; 