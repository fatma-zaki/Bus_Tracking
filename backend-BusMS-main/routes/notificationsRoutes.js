const express = require("express");
const router = express.Router();

const {
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

} = require("../controllers/notificationController");

//  Bus Notification Routes 
router.post("/bus/arrived", handleBusArrival);
router.post("/bus/delayed", handleBusDelay);
router.post("/bus/cancelled", handleBusCancellation);
router.post("/bus/schedule-change", handleScheduleChange);

//  User Notification Routes 
router.post("/group", sendNotificationToGroup);
router.post("/custom", sendCustomNotification);
router.get("/:userId", getUserNotifications);
router.get("/:userId/unread", getUnreadNotifications);
router.put("/:notificationId/read", markAsRead);
router.delete("/:notificationId", deleteNotification);

//  API test
router.get("/", (req, res) => {
  res.send("API is running");
});

module.exports = router;
