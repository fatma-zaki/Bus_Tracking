const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  start_point: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
  },
  end_point: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
  },
  stops: [{
    name: { type: String, required: true },
    long: { type: Number, required: true },
    lat: { type: Number, required: true },
    order: { type: Number, required: true } // ترتيب المحطة على الخط (يبدأ من 2، لأن start_point = 1)
  }],
  estimated_time: {
    type: String, 
    required: true
  }
}, {
  timestamps: true 
});

module.exports = mongoose.model('Route', routeSchema);