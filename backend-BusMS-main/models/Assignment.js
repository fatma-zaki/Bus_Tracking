const mongoose = require('mongoose');
const AssignmentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
