const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  busId: {
    type: Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  routeId: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  tripId: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  pickupLocation: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
  },
  dropoffLocation: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ studentId: 1, date: 1 });
bookingSchema.index({ busId: 1, date: 1 });
bookingSchema.index({ parentId: 1, date: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking; 