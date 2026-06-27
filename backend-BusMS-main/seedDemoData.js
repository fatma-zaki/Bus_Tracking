const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const Bus = require('./models/BusModel');
const Route = require('./models/Route');
const Trip = require('./models/Trip');
const Assignment = require('./models/Assignment');
const Booking = require('./models/BookingModel');
const BusLocation = require('./models/BusLocationModel');
const Attendance = require('./models/attendance.model');

dotenv.config();

const seedDemoData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected\n');

    // ─── 1. Find existing demo users ───
    const admin = await User.findOne({ email: 'admin@bustrack.demo' });
    const parent = await User.findOne({ email: 'parent@bustrack.demo' });
    const driver = await User.findOne({ email: 'driver@bustrack.demo' });

    if (!admin || !parent || !driver) {
      console.error('Demo users not found. Run seedDemoUsers.js first.');
      process.exit(1);
    }
    console.log('Found demo users');

    // ─── 2. Create additional drivers ───
    const driver2 = await User.findOneAndUpdate(
      { email: 'driver2@bustrack.demo' },
      {
        firstName: 'Ahmed', lastName: 'Hassan',
        email: 'driver2@bustrack.demo', password: 'Demo@1234',
        role: 'driver', phone: '0501111111', licenseNumber: 'DRV-2024-002',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const driver3 = await User.findOneAndUpdate(
      { email: 'driver3@bustrack.demo' },
      {
        firstName: 'Omar', lastName: 'Ali',
        email: 'driver3@bustrack.demo', password: 'Demo@1234',
        role: 'driver', phone: '0502222222', licenseNumber: 'DRV-2024-003',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('Drivers ready');

    // ─── 3. Create students (children of demo parent) ───
    const studentsData = [
      { firstName: 'Sara', lastName: 'Parent', email: 'sara.student@bustrack.demo' },
      { firstName: 'Ali', lastName: 'Parent', email: 'ali.student@bustrack.demo' },
      { firstName: 'Noor', lastName: 'Parent', email: 'noor.student@bustrack.demo' },
    ];

    const students = [];
    for (const s of studentsData) {
      const student = await User.findOneAndUpdate(
        { email: s.email },
        {
          ...s, password: 'Demo@1234', role: 'student',
          parentId: parent._id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      students.push(student);
    }

    await User.findByIdAndUpdate(parent._id, {
      children: students.map(s => s._id),
    });
    console.log('Students ready');

    // ─── 4. Create routes ───
    const routesData = [
      {
        name: 'Downtown - Lincoln School',
        start_point: { name: 'Downtown Station', lat: 30.0444, long: 31.2357 },
        end_point: { name: 'Lincoln School', lat: 30.0600, long: 31.2200 },
        stops: [
          { name: 'City Mall', lat: 30.0480, long: 31.2330, order: 2 },
          { name: 'Central Park', lat: 30.0520, long: 31.2280, order: 3 },
          { name: 'Library Square', lat: 30.0560, long: 31.2240, order: 4 },
        ],
        estimated_time: '35 mins',
      },
      {
        name: 'Suburb East - Academy',
        start_point: { name: 'East Gate', lat: 30.0300, long: 31.2600 },
        end_point: { name: 'International Academy', lat: 30.0550, long: 31.2400 },
        stops: [
          { name: 'Rose Garden', lat: 30.0350, long: 31.2550, order: 2 },
          { name: 'Hospital Road', lat: 30.0420, long: 31.2480, order: 3 },
          { name: 'Sports Club', lat: 30.0490, long: 31.2440, order: 4 },
        ],
        estimated_time: '40 mins',
      },
      {
        name: 'North Hills - Sunrise School',
        start_point: { name: 'North Hills Terminal', lat: 30.0700, long: 31.2100 },
        end_point: { name: 'Sunrise School', lat: 30.0500, long: 31.2350 },
        stops: [
          { name: 'Hilltop Market', lat: 30.0650, long: 31.2150, order: 2 },
          { name: 'River Bridge', lat: 30.0580, long: 31.2250, order: 3 },
        ],
        estimated_time: '25 mins',
      },
    ];

    const routes = [];
    for (const r of routesData) {
      const route = await Route.findOneAndUpdate(
        { name: r.name },
        r,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      routes.push(route);
    }
    console.log('Routes ready');

    // ─── 5. Create buses ───
    const busesData = [
      { BusNumber: 'BUS-001', capacity: 40, status: 'active', driverId: driver._id, route_id: routes[0]._id },
      { BusNumber: 'BUS-002', capacity: 35, status: 'active', driverId: driver2._id, route_id: routes[1]._id },
      { BusNumber: 'BUS-003', capacity: 30, status: 'active', driverId: driver3._id, route_id: routes[2]._id },
      { BusNumber: 'BUS-004', capacity: 45, status: 'Maintenance', driverId: driver._id, route_id: null },
    ];

    const buses = [];
    for (const b of busesData) {
      const bus = await Bus.findOneAndUpdate(
        { BusNumber: b.BusNumber },
        b,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      buses.push(bus);
    }

    await User.findByIdAndUpdate(driver._id, { busId: buses[0]._id });
    await User.findByIdAndUpdate(driver2._id, { busId: buses[1]._id });
    await User.findByIdAndUpdate(driver3._id, { busId: buses[2]._id });
    console.log('Buses ready');

    // ─── 6. Create trips ───
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);

    const tripsData = [
      { date: twoDaysAgo, routeId: routes[0]._id, busId: buses[0]._id, driverId: driver._id, status: 'ended' },
      { date: yesterday, routeId: routes[0]._id, busId: buses[0]._id, driverId: driver._id, status: 'ended' },
      { date: yesterday, routeId: routes[1]._id, busId: buses[1]._id, driverId: driver2._id, status: 'ended' },
      { date: today, routeId: routes[0]._id, busId: buses[0]._id, driverId: driver._id, status: 'started' },
      { date: today, routeId: routes[1]._id, busId: buses[1]._id, driverId: driver2._id, status: 'scheduled' },
      { date: today, routeId: routes[2]._id, busId: buses[2]._id, driverId: driver3._id, status: 'started' },
      { date: tomorrow, routeId: routes[0]._id, busId: buses[0]._id, driverId: driver._id, status: 'scheduled' },
      { date: tomorrow, routeId: routes[1]._id, busId: buses[1]._id, driverId: driver2._id, status: 'scheduled' },
      { date: tomorrow, routeId: routes[2]._id, busId: buses[2]._id, driverId: driver3._id, status: 'scheduled' },
    ];

    const trips = [];
    for (const t of tripsData) {
      const trip = await Trip.findOneAndUpdate(
        { date: t.date, busId: t.busId },
        t,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      trips.push(trip);
    }
    console.log('Trips ready');

    // ─── 7. Create assignments ───
    const assignmentsData = [
      { date: today, driverId: driver._id, busId: buses[0]._id, routeId: routes[0]._id },
      { date: today, driverId: driver2._id, busId: buses[1]._id, routeId: routes[1]._id },
      { date: today, driverId: driver3._id, busId: buses[2]._id, routeId: routes[2]._id },
      { date: tomorrow, driverId: driver._id, busId: buses[0]._id, routeId: routes[0]._id },
      { date: tomorrow, driverId: driver2._id, busId: buses[1]._id, routeId: routes[1]._id },
      { date: tomorrow, driverId: driver3._id, busId: buses[2]._id, routeId: routes[2]._id },
    ];

    for (const a of assignmentsData) {
      await Assignment.findOneAndUpdate(
        { date: a.date, driverId: a.driverId },
        a,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('Assignments ready');

    // ─── 8. Create bookings ───
    const bookingsData = [
      {
        studentId: students[0]._id, parentId: parent._id,
        busId: buses[0]._id, routeId: routes[0]._id, tripId: trips[3]._id,
        date: today, status: 'confirmed',
        pickupLocation: { name: 'City Mall', lat: 30.0480, long: 31.2330 },
        dropoffLocation: { name: 'Lincoln School', lat: 30.0600, long: 31.2200 },
      },
      {
        studentId: students[1]._id, parentId: parent._id,
        busId: buses[0]._id, routeId: routes[0]._id, tripId: trips[3]._id,
        date: today, status: 'confirmed',
        pickupLocation: { name: 'Central Park', lat: 30.0520, long: 31.2280 },
        dropoffLocation: { name: 'Lincoln School', lat: 30.0600, long: 31.2200 },
      },
      {
        studentId: students[2]._id, parentId: parent._id,
        busId: buses[1]._id, routeId: routes[1]._id, tripId: trips[4]._id,
        date: today, status: 'pending',
        pickupLocation: { name: 'Rose Garden', lat: 30.0350, long: 31.2550 },
        dropoffLocation: { name: 'International Academy', lat: 30.0550, long: 31.2400 },
      },
      {
        studentId: students[0]._id, parentId: parent._id,
        busId: buses[0]._id, routeId: routes[0]._id, tripId: trips[6]._id,
        date: tomorrow, status: 'pending',
        pickupLocation: { name: 'City Mall', lat: 30.0480, long: 31.2330 },
        dropoffLocation: { name: 'Lincoln School', lat: 30.0600, long: 31.2200 },
      },
      {
        studentId: students[0]._id, parentId: parent._id,
        busId: buses[0]._id, routeId: routes[0]._id, tripId: trips[0]._id,
        date: twoDaysAgo, status: 'completed',
        pickupLocation: { name: 'City Mall', lat: 30.0480, long: 31.2330 },
        dropoffLocation: { name: 'Lincoln School', lat: 30.0600, long: 31.2200 },
      },
      {
        studentId: students[0]._id, parentId: parent._id,
        busId: buses[0]._id, routeId: routes[0]._id, tripId: trips[1]._id,
        date: yesterday, status: 'completed',
        pickupLocation: { name: 'City Mall', lat: 30.0480, long: 31.2330 },
        dropoffLocation: { name: 'Lincoln School', lat: 30.0600, long: 31.2200 },
      },
    ];

    for (const b of bookingsData) {
      await Booking.findOneAndUpdate(
        { studentId: b.studentId, date: b.date, tripId: b.tripId },
        b,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('Bookings ready');

    // ─── 9. Create bus locations (live tracking data) ───
    const busLocationsData = [
      {
        busId: buses[0]._id, driverId: driver._id, routeId: routes[0]._id,
        currentLocation: { latitude: 30.0500, longitude: 31.2300 },
        speed: 35, heading: 90, status: 'active',
        currentStop: { name: 'Central Park', lat: 30.0520, long: 31.2280 },
        nextStop: { name: 'Library Square', lat: 30.0560, long: 31.2240 },
      },
      {
        busId: buses[1]._id, driverId: driver2._id, routeId: routes[1]._id,
        currentLocation: { latitude: 30.0350, longitude: 31.2550 },
        speed: 0, heading: 0, status: 'stopped',
        currentStop: { name: 'Rose Garden', lat: 30.0350, long: 31.2550 },
        nextStop: { name: 'Hospital Road', lat: 30.0420, long: 31.2480 },
      },
      {
        busId: buses[2]._id, driverId: driver3._id, routeId: routes[2]._id,
        currentLocation: { latitude: 30.0620, longitude: 31.2180 },
        speed: 42, heading: 180, status: 'active',
        currentStop: { name: 'Hilltop Market', lat: 30.0650, long: 31.2150 },
        nextStop: { name: 'River Bridge', lat: 30.0580, long: 31.2250 },
      },
    ];

    for (const bl of busLocationsData) {
      await BusLocation.findOneAndUpdate(
        { busId: bl.busId },
        bl,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('Bus locations ready');

    // ─── 10. Create attendance records ───
    const attendanceData = [
      { personId: students[0]._id, personType: 'student', date: twoDaysAgo, status: 'present', boardingTime: '07:15', deboardingTime: '07:50', parentId: parent._id },
      { personId: students[1]._id, personType: 'student', date: twoDaysAgo, status: 'present', boardingTime: '07:20', deboardingTime: '07:50', parentId: parent._id },
      { personId: students[2]._id, personType: 'student', date: twoDaysAgo, status: 'absent', parentId: parent._id },
      { personId: students[0]._id, personType: 'student', date: yesterday, status: 'present', boardingTime: '07:10', deboardingTime: '07:45', parentId: parent._id },
      { personId: students[1]._id, personType: 'student', date: yesterday, status: 'present', boardingTime: '07:18', deboardingTime: '07:45', parentId: parent._id },
      { personId: students[2]._id, personType: 'student', date: yesterday, status: 'present', boardingTime: '07:22', deboardingTime: '07:55', parentId: parent._id },
      { personId: students[0]._id, personType: 'student', date: today, status: 'present', boardingTime: '07:12', parentId: parent._id },
      { personId: students[1]._id, personType: 'student', date: today, status: 'present', boardingTime: '07:19', parentId: parent._id },
    ];

    for (const a of attendanceData) {
      await Attendance.findOneAndUpdate(
        { personId: a.personId, date: a.date },
        a,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('Attendance ready');

    // ─── Summary ───
    console.log('\n========== SEED COMPLETE ==========');
    console.log(`Users:        ${await User.countDocuments()} total`);
    console.log(`  - Admin:    ${await User.countDocuments({ role: 'admin' })}`);
    console.log(`  - Drivers:  ${await User.countDocuments({ role: 'driver' })}`);
    console.log(`  - Parents:  ${await User.countDocuments({ role: 'parent' })}`);
    console.log(`  - Students: ${await User.countDocuments({ role: 'student' })}`);
    console.log(`Routes:       ${await Route.countDocuments()}`);
    console.log(`Buses:        ${await Bus.countDocuments()}`);
    console.log(`Trips:        ${await Trip.countDocuments()}`);
    console.log(`Assignments:  ${await Assignment.countDocuments()}`);
    console.log(`Bookings:     ${await Booking.countDocuments()}`);
    console.log(`Bus Locations: ${await BusLocation.countDocuments()}`);
    console.log(`Attendance:   ${await Attendance.countDocuments()}`);
    console.log('===================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedDemoData();