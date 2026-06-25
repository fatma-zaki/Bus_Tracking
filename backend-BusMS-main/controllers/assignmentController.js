// backend-BusMS/controllers/assignmentController.js
const Assignment = require('../models/Assignment');
const Trip = require('../models/Trip');

exports.createAssignment = async (req, res) => {
  try {
    const { date, driverId, busId, routeId } = req.body;
    // تحقق إذا كان هناك تعيين لنفس اليوم ونفس الباص/المسار
    let assignment = await Assignment.findOne({ date, busId, routeId });
    let trip;
    if (assignment) {
      // تحديث التعيين
      assignment.driverId = driverId;
      await assignment.save();
      // تحديث الرحلة إذا وجدت
      trip = await Trip.findOne({ date, busId, routeId });
      if (trip) {
        trip.driverId = driverId;
        await trip.save();
      } else {
        trip = await Trip.create({ date, driverId, busId, routeId, status: 'scheduled' });
      }
      return res.json({ success: true, assignment, trip });
    }
    assignment = await Assignment.create({ date, driverId, busId, routeId });
    // أنشئ الرحلة الجديدة
    trip = await Trip.create({ date, driverId, busId, routeId, status: 'scheduled' });
    res.json({ success: true, assignment, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('driverId busId routeId');
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAssignmentForToday = async (req, res) => {
  try {
    const { routeId } = req.query;
    const today = new Date();
    today.setHours(0,0,0,0);
    const assignment = await Assignment.findOne({
      routeId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24*60*60*1000) }
    }).populate('driverId busId routeId');
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
