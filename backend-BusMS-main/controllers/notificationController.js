// controllers/notificationController.js

const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/pushNotifications');
const { io } = require('../server');

// Attempt to import User model if it exists
let User;
try {
  User = require('../models/userModel');
} catch (err) {
  console.warn('User model not found. Some functionalities may be limited.');
}

// Helper function to create a notification
const createNotification = async (userId, type, message, event) => {
  try {
    const notification = new Notification({ userId, type, message, event });
    await notification.save();
    if (io) io.to(`user-${userId}`).emit('notification', notification);
    return notification;
  } catch (err) {
    throw new Error(err.message);
  }
};

// Send notification to all users
const sendNotificationToAllUsers = async (type, message) => {
  try {
    const users = await Notification.distinct('userId');
    users.forEach(async (userId) => {
      await createNotification(userId, type, message, 'scheduleChange');
    });
    console.log(`Notification sent to all users: ${message}`);
  } catch (err) {
    console.error('Error sending notifications to all users:', err.message);
  }
};

// Handle bus arrival notification
const handleBusArrival = async (req, res) => {
  const { userId, busId, token } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const message = `Bus ${busId} has arrived at your station.`;
    await createNotification(userId, 'Bus Arrived', message, 'arrival');
    await sendPushNotification(token, 'Bus Arrived!', message);
    res.json({ message: 'Bus arrival notification sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handle bus delay notification
const handleBusDelay = async (req, res) => {
  const { userId, busId, delayMinutes, token } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const message = `Bus ${busId} is delayed by ${delayMinutes} minutes.`;
    await createNotification(userId, 'Bus Delayed', message, 'delay');
    await sendPushNotification(token, 'Bus Delayed!', message);
    res.json({ message: 'Bus delay notification sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handle bus cancellation notification
const handleBusCancellation = async (req, res) => {
  const { userId, busId, token } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const message = `Bus ${busId} has been cancelled.`;
    await createNotification(userId, 'Trip Cancelled', message, 'cancellation');
    await sendPushNotification(token, 'Bus Cancelled!', message);
    res.json({ message: 'Bus cancellation notification sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all notifications for a specific user
const getUserNotifications = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  const { notificationId } = req.params;

  if (!mongoose.isValidObjectId(notificationId)) {
    return res.status(400).json({ error: 'Invalid notificationId format' });
  }

  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: 'Read', readAt: new Date() },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handle schedule change notification
const handleScheduleChange = async (req, res) => {
  const { newSchedule, token } = req.body;

  try {
    const message = 'Bus schedule has been updated. Please check the new schedule.';
    await sendNotificationToAllUsers('Schedule Change', message);

    if (token) {
      await sendPushNotification(token, 'Schedule Update', message);
    }

    res.json({ message: 'Schedule change notification sent to all users.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a specific notification
const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;

  if (!mongoose.isValidObjectId(notificationId)) {
    return res.status(400).json({ error: 'Invalid notificationId format' });
  }

  try {
    await Notification.findByIdAndDelete(notificationId);
    res.json({ message: 'Notification deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get unread notifications for a specific user
const getUnreadNotifications = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const notifications = await Notification.find({ userId, status: 'Unread' }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send notification to a specific user group
const sendNotificationToGroup = async (req, res) => {
  const { group, message, type } = req.body;

  if (!User) {
    return res.status(500).json({ error: 'User model not available.' });
  }

  try {
    const users = await User.find({ role: group });
    users.forEach(async (user) => {
      await createNotification(user._id, type, message, 'groupMessage');
    });

    res.json({ message: `Notification sent to ${group} group.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send a custom notification to a user
const sendCustomNotification = async (req, res) => {
  const { userId, type, message } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    await createNotification(userId, type, message, 'custom');
    res.json({ message: 'Custom notification sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  handleBusArrival,
  handleBusDelay,
  handleBusCancellation,
  handleScheduleChange,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  getUnreadNotifications,
  sendNotificationToGroup,
  sendCustomNotification,
  createNotification
};
