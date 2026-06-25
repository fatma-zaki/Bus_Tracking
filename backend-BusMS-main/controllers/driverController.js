// Driver Controller
// كل دالة هنا تمثل endpoint لفلو السائق

const Booking = require('../models/BookingModel');
const Bus = require('../models/BusModel');
const Route = require('../models/Route');
const User = require('../models/userModel');
const BusLocation = require('../models/BusLocationModel');
const Attendance = require('../models/attendance.model');

exports.getDriverTrips = async (req, res) => {
  try {
    const driverId = req.user.id;
    // جلب كل الحافلات التي يقودها السائق الحالي
    const buses = await Bus.find({ assigned_driver_id: driverId });
    const busIds = buses.map(bus => bus._id);
    if (busIds.length === 0) {
      return res.status(200).json([]); // لا يوجد حافلات لهذا السائق
    }
    // جلب كل الحجوزات المرتبطة بهذه الحافلات
    const bookings = await Booking.find({ busId: { $in: busIds } })
      .populate('studentId', 'firstName lastName')
      .populate('parentId', 'firstName lastName')
      .populate('busId', 'BusNumber capacity')
      .populate('routeId', 'name start_point end_point stops estimated_time')
      .sort({ date: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get driver trips error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.startTrip = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { tripId } = req.params; // tripId هنا هو busId
    const { date } = req.body; // يجب إرسال التاريخ من الفرونت

    // تحقق أن السائق هو قائد الحافلة
    const bus = await Bus.findById(tripId);
    if (!bus || String(bus.assigned_driver_id) !== String(driverId)) {
      return res.status(403).json({ message: 'You are not assigned to this bus' });
    }

    // تحديث حالة كل الحجوزات لهذا الباص في هذا اليوم إلى started
    const result = await Booking.updateMany(
      { busId: tripId, date: new Date(date), status: { $in: ['pending', 'confirmed'] } },
      { $set: { status: 'started' } }
    );
    res.status(200).json({ message: 'Trip started', updated: result.nModified || result.modifiedCount });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.endTrip = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { tripId } = req.params; // tripId هنا هو busId
    const { date } = req.body; // يجب إرسال التاريخ من الفرونت

    // تحقق أن السائق هو قائد الحافلة
    const bus = await Bus.findById(tripId);
    if (!bus || String(bus.assigned_driver_id) !== String(driverId)) {
      return res.status(403).json({ message: 'You are not assigned to this bus' });
    }

    // تحديث حالة كل الحجوزات لهذا الباص في هذا اليوم إلى ended
    const result = await Booking.updateMany(
      { busId: tripId, date: new Date(date), status: { $in: ['started'] } },
      { $set: { status: 'ended' } }
    );
    res.status(200).json({ message: 'Trip ended', updated: result.nModified || result.modifiedCount });
  } catch (error) {
    console.error('End trip error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { busId, routeId, currentLocation, speed, heading, status, currentStop, nextStop, estimatedArrival } = req.body;

    // تحقق أن السائق هو قائد الحافلة
    const bus = await Bus.findById(busId);
    if (!bus || String(bus.assigned_driver_id) !== String(driverId)) {
      return res.status(403).json({ message: 'You are not assigned to this bus' });
    }

    // تحديث أو إنشاء موقع الحافلة
    let busLocation = await BusLocation.findOne({ busId });
    if (busLocation) {
      busLocation.currentLocation = currentLocation;
      busLocation.speed = speed;
      busLocation.heading = heading;
      busLocation.status = status;
      busLocation.currentStop = currentStop;
      busLocation.nextStop = nextStop;
      busLocation.estimatedArrival = estimatedArrival;
      busLocation.lastUpdate = new Date();
    } else {
      busLocation = new BusLocation({
        busId,
        driverId,
        routeId,
        currentLocation,
        speed,
        heading,
        status,
        currentStop,
        nextStop,
        estimatedArrival
      });
    }
    await busLocation.save();
    res.status(200).json(busLocation);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { tripId, studentId } = req.params; // tripId هنا هو busId
    const { date, status } = req.body; // status: present | absent

    // تحقق أن السائق هو قائد الحافلة
    const bus = await Bus.findById(tripId);
    if (!bus || String(bus.assigned_driver_id) !== String(driverId)) {
      return res.status(403).json({ message: 'You are not assigned to this bus' });
    }

    // تسجيل أو تحديث الحضور
    let attendance = await Attendance.findOne({ personId: studentId, date: new Date(date) });
    if (attendance) {
      attendance.status = status;
    } else {
      attendance = new Attendance({
        personId: studentId,
        personType: 'student',
        date: new Date(date),
        status
      });
    }
    await attendance.save();
    res.status(200).json({ message: 'Attendance updated', attendance });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 