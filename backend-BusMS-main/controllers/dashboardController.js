const User = require('../models/userModel');
const Bus = require('../models/BusModel');
const Route = require('../models/Route');
const Attendance = require('../models/attendance.model');
const dayjs = require('dayjs');

exports.getTrends = async (req, res) => {
  try {
    const days = 7;
    const labels = [];
    const attendance = [];
    const students = [];
    const buses = [];
    const routes = [];
    const parents = [];
    const drivers = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').startOf('day');
      labels.push(date.format('YYYY-MM-DD'));

      // احصائيات الحضور
      const att = await Attendance.find({ date: { $gte: date.toDate(), $lt: date.add(1, 'day').toDate() } });
      const presentCount = att.filter(a => a.status === 'present').length;
      const totalCount = att.length;
      let attRate = 0;
      if (totalCount > 0) {
        attRate = Math.round((presentCount / totalCount) * 100);
      }
      attendance.push(attRate);

      // الطلاب
      const studentCount = await User.countDocuments({ role: 'student', createdAt: { $lte: date.endOf('day').toDate() } });
      students.push(studentCount);

      // أولياء الأمور
      const parentCount = await User.countDocuments({ role: 'parent', createdAt: { $lte: date.endOf('day').toDate() } });
      parents.push(parentCount);

      // السائقين
      const driverCount = await User.countDocuments({ role: 'driver', createdAt: { $lte: date.endOf('day').toDate() } });
      drivers.push(driverCount);

      // الحافلات
      const busCount = await Bus.countDocuments({ createdAt: { $lte: date.endOf('day').toDate() } });
      buses.push(busCount);

      // الطرق
      const routeCount = await Route.countDocuments({ createdAt: { $lte: date.endOf('day').toDate() } });
      routes.push(routeCount);
    }

    res.json({ labels, attendance, students, buses, routes, parents, drivers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    // Buses
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });
    // Students
    const totalStudents = await User.countDocuments({ role: 'student' });
    // Parents
    const totalParents = await User.countDocuments({ role: 'parent' });
    // Drivers
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    // Routes
    const totalRoutes = await Route.countDocuments();
    // Bookings
    const Booking = require('../models/BookingModel');
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    // Attendance
    const Attendance = require('../models/attendance.model');
    const today = dayjs().startOf('day');
    const tomorrow = dayjs(today).add(1, 'day');
    const presentToday = await Attendance.countDocuments({ date: { $gte: today.toDate(), $lt: tomorrow.toDate() }, status: 'present' });
    const absencesToday = await Attendance.countDocuments({ date: { $gte: today.toDate(), $lt: tomorrow.toDate() }, status: 'absent' });
    // Attendance Rate
    let attendanceRate = 0;
    const totalToday = presentToday + absencesToday;
    if (totalToday > 0) {
      attendanceRate = Math.round((presentToday / totalToday) * 100);
    }
    // On-time percentage (placeholder, needs logic if available)
    const onTimePercentage = null;
    // Total children (for parents, can be calculated per parent in frontend)
    // Return all stats
    res.json({
      totalBuses,
      activeBuses,
      totalStudents,
      presentToday,
      totalRoutes,
      onTimePercentage,
      totalParents,
      absencesToday,
      attendanceRate,
      totalDrivers,
      totalBookings,
      pendingBookings,
      confirmedBookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// API: Get map data (buses & routes) filtered by role and userId
exports.getMapData = async (req, res) => {
  try {
    const { role, userId } = req.query;
    let buses = [];
    let routes = [];

    if (role === 'admin' || role === 'manager' || role === 'employee') {
      // Admin/manager/employee: كل الباصات وكل المسارات المرتبطة بها فقط
      buses = await require('../models/BusModel').find({});
      // جلب فقط المسارات المرتبطة بالباصات
      const routeIds = buses.map(b => b.route_id).filter(Boolean);
      console.log('routeIds to fetch:', routeIds);
      routes = await require('../models/Route').find({ _id: { $in: routeIds } });
      console.log('routes found:', routes.length, routes.map(r => r._id));
    } else if (role === 'driver') {
      buses = await require('../models/BusModel').find({ assigned_driver_id: userId });
      const routeIds = buses.map(b => b.route_id).filter(Boolean);
      console.log('routeIds to fetch:', routeIds);
      routes = await require('../models/Route').find({ _id: { $in: routeIds } });
      console.log('routes found:', routes.length, routes.map(r => r._id));
    } else if (role === 'parent') {
      const parent = await require('../models/userModel').findById(userId).populate('children');
      const childIds = parent.children.map(child => child._id);
      const bookings = await require('../models/BookingModel').find({ studentId: { $in: childIds } });
      const busIds = bookings.map(b => b.busId);
      const routeIds = bookings.map(b => b.routeId);
      buses = await require('../models/BusModel').find({ _id: { $in: busIds } });
      console.log('routeIds to fetch:', routeIds);
      routes = await require('../models/Route').find({ _id: { $in: routeIds } });
      console.log('routes found:', routes.length, routes.map(r => r._id));
    } else if (role === 'student') {
      const booking = await require('../models/BookingModel').findOne({ studentId: userId }).sort({ date: -1 });
      if (booking) {
        buses = await require('../models/BusModel').find({ _id: booking.busId });
        console.log('routeIds to fetch:', [booking.routeId]);
        routes = await require('../models/Route').find({ _id: booking.routeId });
        console.log('routes found:', routes.length, routes.map(r => r._id));
      }
    }

    // جلب مواقع الباصات من BusLocation
    const BusLocation = require('../models/BusLocationModel');
    const busIds = buses.map(b => b._id);
    const locations = await BusLocation.find({ busId: { $in: busIds }, status: 'active' });
    // أعد تشكيل الباصات بحيث كل باص فيه currentLocation وroute_id
    const busesWithLocation = buses.map(bus => {
      const loc = locations.find(l => String(l.busId) === String(bus._id));
      if (!bus.route_id || !loc || !loc.currentLocation || loc.currentLocation.latitude == null || loc.currentLocation.longitude == null) return null;
      return {
        _id: String(bus._id),
        BusNumber: bus.BusNumber,
        capacity: bus.capacity,
        status: bus.status,
        assigned_driver_id: bus.assigned_driver_id,
        route_id: String(bus.route_id), // <-- تحويل route_id إلى String
        currentLocation: {
          lat: loc.currentLocation.latitude,
          lng: loc.currentLocation.longitude
        },
        speed: loc.speed,
        heading: loc.heading,
        lastUpdate: loc.lastUpdate,
        driver: loc.driverId,
        currentStop: loc.currentStop,
        nextStop: loc.nextStop,
        estimatedArrival: loc.estimatedArrival
      };
    }).filter(Boolean);

    // تحويل _id في المسارات إلى String
    const routesWithStringId = Array.isArray(routes) ? routes.map(route => ({
      ...route.toObject(),
      _id: String(route._id)
    })) : [];
    console.log('routes to send to frontend:', routesWithStringId.map(r => r._id));

    res.json({ buses: busesWithLocation, routes: routesWithStringId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 