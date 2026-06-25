const BusTracking = require("../models/trackingModel");
const Bus = require("../models/BusModel");

const createTracking = async (req, res) => {
  try {
    const { bus_id, latitude, longitude, timestamp, speed, heading, status } = req.body;
    // Basic validation
    if (!bus_id || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Validate bus exists
    const bus = await Bus.findById(bus_id);
    if (!bus) {
      return res.status(404).json({ error: "Bus not found" });
    }
    const tracking = new BusTracking({
      bus_id,
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      status: status || 'active',
      timestamp: timestamp || new Date()
    });
    await tracking.save();
    // Get io instance
    const io = req.app.get('io');
    // Emit real-time update to all clients tracking this bus
    io.to(`bus-${bus_id}`).emit('bus-location-update', {
      busId: bus_id,
      busNumber: bus.BusNumber,
      location: {
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        status: status || 'active',
        timestamp: tracking.timestamp
      }
    });
    // Emit to route tracking if bus has a route
    if (bus.route_id) {
      io.to(`route-${bus.route_id}`).emit('route-bus-update', {
        routeId: bus.route_id,
        busId: bus_id,
        busNumber: bus.BusNumber,
        location: {
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          status: status || 'active',
          timestamp: tracking.timestamp
        }
      });
    }
    res.status(201).json({ 
      message: "Tracking location saved successfully", 
      tracking,
      busNumber: bus.BusNumber
    });
  } catch (error) {
    console.error("Error saving tracking data:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getLastLocation = async (req, res) => {
  try {
    const { id: busId } = req.params;
    const lastLocation = await BusTracking.findOne({ bus_id: busId })
      .sort({ timestamp: -1 })
      .populate('bus_id', 'BusNumber status route_id');
    if (!lastLocation) {
      return res.status(404).json({ message: "No tracking data found" });
    }
    res.json({ lastLocation });
  } catch (error) {
    console.error("Error fetching tracking history:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllActiveBuses = async (req, res) => {
  try {
    // Get all active buses with their latest location
    const activeBuses = await Bus.find({ status: 'active' });
    const busesWithLocation = await Promise.all(
      activeBuses.map(async (bus) => {
        const lastLocation = await BusTracking.findOne({ bus_id: bus._id })
          .sort({ timestamp: -1 });
        return {
          bus: {
            id: bus._id,
            number: bus.BusNumber,
            capacity: bus.capacity,
            status: bus.status,
            route_id: bus.route_id
          },
          location: lastLocation ? {
            latitude: lastLocation.latitude,
            longitude: lastLocation.longitude,
            speed: lastLocation.speed || 0,
            heading: lastLocation.heading || 0,
            status: lastLocation.status || 'active',
            timestamp: lastLocation.timestamp
          } : null
        };
      })
    );
    res.json({ buses: busesWithLocation });
  } catch (error) {
    console.error("Error fetching active buses:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getTrackingHistory = async (req, res) => {
  try {
    const { id: busId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    let query = { bus_id: busId };
    // Add date range filter if provided
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    const history = await BusTracking.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('bus_id', 'BusNumber');
    res.json({ history });
  } catch (error) {
    console.error("Error fetching tracking history:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getLastLocation,
  createTracking,
  getAllActiveBuses,
  getTrackingHistory
};