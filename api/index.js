let app;

try {
  const express = require("express");
  const dotenv = require("dotenv");
  const cors = require("cors");
  const path = require("path");

  dotenv.config({ path: path.join(__dirname, "../backend-BusMS-main/.env") });

  const connectDB = require("../backend-BusMS-main/config/db");
  connectDB();

  app = express();

  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use('/api/users', require('../backend-BusMS-main/routes/userRoutes'));
  app.use('/api/trackingRoutes', require('../backend-BusMS-main/routes/trackingRoutes'));
  app.use('/api/routes', require('../backend-BusMS-main/routes/routeRoutes'));
  app.use('/api/buses', require('../backend-BusMS-main/routes/bus.routes'));
  app.use('/api/attendances', require('../backend-BusMS-main/routes/attendance.routes'));
  app.use('/api/notifications', require('../backend-BusMS-main/routes/notificationsRoutes'));
  app.use('/api/notification', require('../backend-BusMS-main/routes/notificationsRoutes'));
  app.use('/api/dashboard', require('../backend-BusMS-main/routes/dashboardRoutes'));
  app.use('/api/bookings', require('../backend-BusMS-main/routes/bookingRoutes'));
  app.use('/api/bus-locations', require('../backend-BusMS-main/routes/busLocationRoutes'));
  app.use('/api/driver', require('../backend-BusMS-main/routes/driver'));
  app.use('/api/trips', require('../backend-BusMS-main/routes/tripRoutes'));
  app.use('/api/assignments', require('../backend-BusMS-main/routes/assignmentRoutes'));
  app.use('/api/chats', require('../backend-BusMS-main/routes/chatRoutes'));
  app.use('/api/uploads', require('../backend-BusMS-main/routes/uploadsRoutes'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
  });

} catch (error) {
  const express = require("express");
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      stack: error.stack
    });
  });
}

module.exports = app;