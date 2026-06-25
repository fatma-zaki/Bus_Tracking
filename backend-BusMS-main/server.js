const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");

const userRoutes = require('./routes/userRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const busRoutes = require('./routes/bus.routes');
const notification = require('./routes/notificationsRoutes')
const routeRoutes = require('./routes/routeRoutes');
const attendanceRoutes = require("./routes/attendance.routes");
const dashboardRoutes = require('./routes/dashboardRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const busLocationRoutes = require('./routes/busLocationRoutes');
const driverRoutes = require('./routes/driver');
const tripRoutes = require('./routes/tripRoutes');
const chatRoutes = require('./routes/chatRoutes');
const uploadsRoutes = require('./routes/uploadsRoutes');


dotenv.config();
connectDB();
const app = express();
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:3001']
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));


// users Route
app.use('/api/users', userRoutes);
// tracking Routes
app.use('/api/trackingRoutes',trackingRoutes)
// Route Route
app.use('/api/routes', routeRoutes);
// busRoutes
app.use('/api/buses', busRoutes);
// attendance Routes
app.use("/api/attendances", attendanceRoutes);
// Notification Routes
app.use("/api/notifications", notification);
app.use("/api/notification", notification); // Keep old route for backward compatibility
app.use('/api/dashboard', dashboardRoutes);
// Booking Routes
app.use('/api/bookings', bookingRoutes);
// Bus Location Routes
app.use('/api/bus-locations', busLocationRoutes);
// Driver Routes
app.use('/api/driver', driverRoutes);
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/chats', chatRoutes);
app.use('/api/uploads', uploadsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// إعداد socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "*", // يمكنك تخصيص الدومين هنا
    methods: ["GET", "POST" , "PATCH" , "DELETE"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  // Listen for user to join their notification room
  socket.on('joinUserRoom', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined room user-${userId}`);
    }
  });
  // انضمام المستخدم لغرفة الباص
  socket.on('join-bus', (busId) => {
    if (busId) {
      socket.join(`bus-${busId}`);
      console.log(`User joined bus room bus-${busId}`);
    }
  });
  // بث الرسائل الفورية
  socket.on('bus-message', (msg) => {
    if (msg && msg.busId) {
      io.to(`bus-${msg.busId}`).emit('bus-message', msg);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Export io for use in controllers
module.exports.io = io;