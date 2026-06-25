const Booking = require('../models/BookingModel');
const Bus = require('../models/BusModel');
const Route = require('../models/Route');
const User = require('../models/userModel');
const BusLocation = require('../models/BusLocationModel');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      studentId,
      tripId,
      busId: busIdRaw,
      routeId: routeIdRaw,
      date: dateRaw,
      pickupLocation,
      dropoffLocation,
      notes
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;
    let actualStudentId, parentId;

    // تحديد studentId و parentId حسب دور المستخدم
    if (userRole === 'student') {
      // الطالب يحجز لنفسه
      actualStudentId = userId;
      // نحتاج للعثور على parentId للطالب
      const student = await User.findById(userId);
      if (!student || !student.parentId) {
        return res.status(400).json({ message: 'Student must have a parent' });
      }
      parentId = student.parentId;
    } else if (userRole === 'parent') {
      // الوالد يحجز لأطفاله
      parentId = userId;
      actualStudentId = studentId;
      
      // التحقق من أن الطالب هو طفل للوالد
      const parent = await User.findById(parentId).populate('children');
      if (!parent.children.some(child => child._id.toString() === actualStudentId)) {
        return res.status(403).json({ message: 'Student is not your child' });
      }
    } else {
      return res.status(403).json({ message: 'Only students and parents can create bookings' });
    }

    let busId = busIdRaw, routeId = routeIdRaw, date = dateRaw;
    // إذا تم إرسال tripId، اجلب بيانات الرحلة
    if (tripId) {
      const trip = await require('../models/Trip').findById(tripId);
      if (!trip) {
        return res.status(400).json({ message: 'Trip not found' });
      }
      busId = trip.busId;
      routeId = trip.routeId;
      date = trip.date;
    }

    // Check if bus exists and is active
    const bus = await Bus.findById(busId);
    if (!bus || bus.status !== 'active') {
      return res.status(400).json({ message: 'Bus not available' });
    }

    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(400).json({ message: 'Route not found' });
    }

    // Check if booking already exists for this student on this trip/date
    const existingBooking = await Booking.findOne({
      studentId: actualStudentId,
      ...(tripId ? { tripId } : { date: new Date(date) }),
      status: { $in: ['pending', 'confirmed'] }
    });
    if (existingBooking) {
      return res.status(400).json({ message: 'Booking already exists for this trip/date' });
    }

    // Check bus capacity for the date/trip
    const bookingsForTrip = await Booking.countDocuments({
      busId,
      ...(tripId ? { tripId } : { date: new Date(date) }),
      status: { $in: ['pending', 'confirmed'] }
    });
    if (bookingsForTrip >= bus.capacity) {
      return res.status(400).json({ message: 'Bus is full for this trip/date' });
    }

    const booking = new Booking({
      studentId: actualStudentId,
      parentId,
      busId,
      routeId,
      tripId: tripId || undefined,
      date: new Date(date),
      pickupLocation,
      dropoffLocation,
      notes
    });

    await booking.save();

    // Populate references for response
    await booking.populate([
      { path: 'studentId', select: 'firstName lastName' },
      { path: 'busId', select: 'BusNumber capacity' },
      { path: 'routeId', select: 'name start_point end_point' },
      { path: 'tripId' }
    ]);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get bookings for a parent
exports.getParentBookings = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { status, date } = req.query;

    let query = { parentId };

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(query)
      .populate('studentId', 'firstName lastName')
      .populate('busId', 'BusNumber capacity')
      .populate('routeId', 'name start_point end_point')
      .sort({ date: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get parent bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get bookings for a student
exports.getStudentBookings = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'student') {
      // الطالب لا يمكنه جلب إلا حجوزاته فقط
      if (userId !== studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (userRole === 'parent') {
      // Verify parent owns this student
      const parent = await User.findById(userId).populate('children');
      if (!parent.children.some(child => child._id.toString() === studentId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find({ studentId })
      .populate('busId', 'BusNumber capacity')
      .populate('routeId', 'name start_point end_point')
      .populate('tripId', 'busId routeId')
      .sort({ date: -1 });

    // إضافة busId من tripId إذا لم يكن موجودًا في الحجز
    const enrichedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();
      if (!bookingObj.busId && bookingObj.tripId && bookingObj.tripId.busId) {
        bookingObj.busId = bookingObj.tripId.busId;
      }
      if (!bookingObj.routeId && bookingObj.tripId && bookingObj.tripId.routeId) {
        bookingObj.routeId = bookingObj.tripId.routeId;
      }
      return bookingObj;
    });

    res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error('Get student bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const parentId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.parentId.toString() !== parentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = status;
    await booking.save();

    await booking.populate([
      { path: 'studentId', select: 'firstName lastName' },
      { path: 'busId', select: 'BusNumber capacity' },
      { path: 'routeId', select: 'name start_point end_point' }
    ]);

    res.status(200).json(booking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const parentId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.parentId.toString() !== parentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get available buses for a route and date
exports.getAvailableBuses = async (req, res) => {
  try {
    const { routeId, date } = req.query;

    if (!routeId || !date) {
      return res.status(400).json({ message: 'Route ID and date are required' });
    }

    // Get all active buses assigned to this route
    const buses = await Bus.find({
      route_id: routeId,
      status: 'active'
    }).populate('assigned_driver_id', 'firstName lastName');

    // Get bookings for the date to check capacity
    const bookingsForDate = await Booking.find({
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] }
    });

    // Calculate available capacity for each bus
    const availableBuses = buses.map(bus => {
      const busBookings = bookingsForDate.filter(
        booking => booking.busId.toString() === bus._id.toString()
      );
      const availableSeats = bus.capacity - busBookings.length;
      
      return {
        ...bus.toObject(),
        availableSeats,
        isAvailable: availableSeats > 0
      };
    });

    res.status(200).json(availableBuses);
  } catch (error) {
    console.error('Get available buses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

// Admin: Get all bookings (with optional filters)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, date, busId, routeId, studentId, parentId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    if (busId) query.busId = busId;
    if (routeId) query.routeId = routeId;
    if (studentId) query.studentId = studentId;
    if (parentId) query.parentId = parentId;
    const bookings = await Booking.find(query)
      .populate('studentId', 'firstName lastName')
      .populate('busId', 'BusNumber capacity')
      .populate('routeId', 'name start_point end_point')
      .populate('parentId', 'firstName lastName email')
      .sort({ date: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Admin get all bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Create booking for any student
exports.createBookingAdmin = async (req, res) => {
  try {
    const {
      studentId,
      parentId,
      busId,
      routeId,
      date,
      pickupLocation,
      dropoffLocation,
      notes
    } = req.body;
    // Validate required fields
    if (!studentId || !parentId || !busId || !routeId || !date || !pickupLocation || !dropoffLocation) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Check if bus exists and is active
    const bus = await Bus.findById(busId);
    if (!bus || bus.status !== 'active') {
      return res.status(400).json({ message: 'Bus not available' });
    }
    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(400).json({ message: 'Route not found' });
    }
    // Check if booking already exists for this student on this date
    const existingBooking = await Booking.findOne({
      studentId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] }
    });
    if (existingBooking) {
      return res.status(400).json({ message: 'Booking already exists for this date' });
    }
    // Check bus capacity for the date
    const bookingsForDate = await Booking.countDocuments({
      busId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] }
    });
    if (bookingsForDate >= bus.capacity) {
      return res.status(400).json({ message: 'Bus is full for this date' });
    }
    const booking = new Booking({
      studentId,
      parentId,
      busId,
      routeId,
      date: new Date(date),
      pickupLocation,
      dropoffLocation,
      notes
    });
    await booking.save();
    await booking.populate([
      { path: 'studentId', select: 'firstName lastName' },
      { path: 'busId', select: 'BusNumber capacity' },
      { path: 'routeId', select: 'name start_point end_point' },
      { path: 'parentId', select: 'firstName lastName email' }
    ]);
    res.status(201).json(booking);
  } catch (error) {
    console.error('Admin create booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Update booking
exports.updateBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updates = req.body;
    const booking = await Booking.findByIdAndUpdate(bookingId, updates, { new: true, runValidators: true })
      .populate('studentId', 'firstName lastName')
      .populate('busId', 'BusNumber capacity')
      .populate('routeId', 'name start_point end_point')
      .populate('parentId', 'firstName lastName email');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error('Admin update booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Delete booking
exports.deleteBookingAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Admin delete booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Driver: Get bookings for their assigned bus(es) for today
exports.getDriverBookings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    // Find buses assigned to this driver
    const buses = await Bus.find({ assigned_driver_id: driverId });
    const busIds = buses.map(bus => bus._id);
    // Find bookings for these buses today
    const bookings = await Booking.find({
      busId: { $in: busIds },
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('studentId', 'firstName lastName')
      .populate('busId', 'BusNumber capacity')
      .populate('routeId', 'name start_point end_point')
      .populate('parentId', 'firstName lastName email');
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Driver get bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 