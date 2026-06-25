const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middlewares/authMiddleware.js");
const controller = require("../controllers/attendance.controller");

router.post("/", controller.createAttendance);
router.get("/parent", protect, async (req, res) => {
  if (req.user.role !== "parent") {
    return res.status(403).json({ message: "Only parents can view their children's attendance." });
  }
  // Query attendance by parentId
  const Attendance = require("../models/attendance.model");
  const attendances = await Attendance.find({ parentId: req.user._id }).populate('personId');
  res.json(attendances);
});
router.get("/stats", controller.getStats);
router.get("/", controller.getAllAttendances);
router.get("/:id", controller.getAttendanceById);
router.put("/:id", controller.updateAttendance);
router.delete("/:id", controller.deleteAttendance);

module.exports = router;
