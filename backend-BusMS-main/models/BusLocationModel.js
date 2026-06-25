const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const busLocationSchema = new Schema({
  busId: {
    type: Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  routeId: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  currentLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  speed: {
    type: Number,
    default: 0
  },
  heading: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'stopped', 'maintenance', 'offline'],
    default: 'active'
  },
  currentStop: {
    name: { type: String },
    lat: { type: Number },
    long: { type: Number }
  },
  nextStop: {
    name: { type: String },
    lat: { type: Number },
    long: { type: Number }
  },
  estimatedArrival: {
    type: Date
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
busLocationSchema.index({ busId: 1 });
busLocationSchema.index({ status: 1 });
busLocationSchema.index({ lastUpdate: 1 });

const BusLocation = mongoose.model('BusLocation', busLocationSchema);
module.exports = BusLocation; 