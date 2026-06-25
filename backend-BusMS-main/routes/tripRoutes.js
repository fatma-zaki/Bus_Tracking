const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const mongoose = require('mongoose');

// Create a new trip
router.post('/', async (req, res) => {
  try {
    const { date, routeId, busId, driverId, status } = req.body;
    const trip = new Trip({ date, routeId, busId, driverId, status });
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all trips (optionally filter by date and driverId)
router.get('/', async (req, res) => {
  try {
    const { date, driverId } = req.query;
    console.log('Backend received request for trips with query:', req.query); // Log received query
    let filter = {};
    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0); // Set to start of the day in UTC
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999); // Set to end of the day in UTC
      filter.date = { $gte: start, $lte: end };
      console.log('Backend date filter:', filter.date); // Log the date filter being used
    }
    if (driverId) {
      filter.driverId = { $in: [driverId, mongoose.Types.ObjectId.isValid(driverId) ? new mongoose.Types.ObjectId(driverId) : null] };
    }
    const trips = await Trip.find(filter).populate('routeId busId driverId');
    console.log(`Found ${trips.length} trips matching filter.`); // Log the number of trips found
    res.json(trips);
  } catch (err) {
    console.error('Error fetching trips in backend:', err); // Log any errors
    res.status(500).json({ error: err.message });
  }
});

// Update a trip
router.put('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(trip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a trip
router.delete('/:id', async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 