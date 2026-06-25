const Attendance = require("../models/attendance.model");

exports.createAttendance = async (req, res) => {
  try {
    let parentId = req.body.parentId;
    if (req.body.personType && req.body.personType.toLowerCase() === 'student' && !parentId) {
      // Find the student and get their parentId
      const student = await require('../models/userModel').findById(req.body.personId);
      if (student && student.parentId) {
        parentId = student.parentId;
      }
    }
    const newAttendance = new Attendance({ ...req.body, parentId });
    await newAttendance.save();
    const populatedAttendance = await Attendance.findById(newAttendance._id).populate('personId');
    res.status(201).json(populatedAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all attendances, with support for parentId query
exports.getAllAttendances = async (req, res) => {
  try {
    const { date, personType, status, parentId, personId } = req.query;
    const filter = {};
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (personType) filter.personType = personType;
    if (status) filter.status = status;
    if (parentId) filter.parentId = parentId;
    if (personId) filter.personId = personId;
    const attendances = await Attendance.find(filter).populate('personId');
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('personId');
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('personId');
    
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Attendance statistics: total, present, absent, grouped by personType and date
exports.getStats = async (req, res) => {
  try {
    // Optional: filter by date range
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }
    const stats = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            personType: "$personType",
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { date: "$_id.date", personType: "$_id.personType" },
          stats: {
            $push: { status: "$_id.status", count: "$count" }
          },
          total: { $sum: "$count" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          personType: "$_id.personType",
          total: 1,
          present: {
            $ifNull: [
              { $arrayElemAt: [
                {
                  $filter: {
                    input: "$stats",
                    as: "stat",
                    cond: { $eq: ["$$stat.status", "present"] }
                  }
                },
                0
              ] }, { count: 0 } ]
          },
          absent: {
            $ifNull: [
              { $arrayElemAt: [
                {
                  $filter: {
                    input: "$stats",
                    as: "stat",
                    cond: { $eq: ["$$stat.status", "absent"] }
                  }
                },
                0
              ] }, { count: 0 } ]
          }
        }
      },
      {
        $project: {
          date: 1,
          personType: 1,
          total: 1,
          present: "$present.count",
          absent: "$absent.count"
        }
      },
      { $sort: { date: -1, personType: 1 } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
