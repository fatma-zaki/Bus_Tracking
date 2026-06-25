const mongoose = require("mongoose");

const BusTrackingSchema = new mongoose.Schema({
  bus_id: {
    // دى هنشغلها لما نربط الباصات يامعتز عشان نربطها بال id
    type: mongoose.Schema.Types.ObjectId,
    // type : Number,
    ref: "Bus",
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  speed: {
    type: Number,
    default: 0,
    min: 0,
  },
  heading: {
    type: Number,
    default: 0,
    min: 0,
    max: 360,
  },
  status: {
    type: String,
    enum: ['active', 'stopped', 'maintenance', 'offline'],
    default: 'active',
  },
  current_station: {
    type: String,
    default: null,
  },
  next_station: {
    type: String,
    default: null,
  },
  battery_level: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  signal_strength: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for efficient queries
BusTrackingSchema.index({ bus_id: 1, timestamp: -1 });
BusTrackingSchema.index({ timestamp: -1 });

module.exports = mongoose.model("BusTracking", BusTrackingSchema);
