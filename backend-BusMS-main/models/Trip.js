const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['scheduled', 'started', 'ended', 'cancelled'], default: 'scheduled' },
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema); 