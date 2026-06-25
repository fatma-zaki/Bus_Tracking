const BusLocation = require('../models/BusLocationModel');
const Bus = require('../models/BusModel');
const Route = require('../models/Route');
const User = require('../models/userModel');

// Update bus location (for drivers)
exports.updateBusLocation = async (req, res) => {
  try {
    const driverId = req.user.id;
    const {
      busId,
      routeId,
      currentLocation,
      speed,
      heading,
      status,
      currentStop,
      nextStop,
      estimatedArrival
    } = req.body;

    // Verify driver is assigned to this bus
    const bus = await Bus.findById(busId);
    if (!bus || bus.assigned_driver_id.toString() !== driverId) {
      return res.status(403).json({ message: 'You are not assigned to this bus' });
    }

    // Update or create bus location
    let busLocation = await BusLocation.findOne({ busId });
    
    if (busLocation) {
      // Update existing location
      busLocation.currentLocation = currentLocation;
      busLocation.speed = speed;
      busLocation.heading = heading;
      busLocation.status = status;
      busLocation.currentStop = currentStop;
      busLocation.nextStop = nextStop;
      busLocation.estimatedArrival = estimatedArrival;
      busLocation.lastUpdate = new Date();
    } else {
      // Create new location record
      busLocation = new BusLocation({
        busId,
        driverId,
        routeId,
        currentLocation,
        speed,
        heading,
        status,
        currentStop,
        nextStop,
        estimatedArrival
      });
    }

    await busLocation.save();

    // إرسال التحديث الحي عبر socket.io
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting busLocationUpdate:', {
        busId,
        currentLocation,
        speed,
        heading,
        status,
        lastUpdate: busLocation.lastUpdate
      });
      io.emit('busLocationUpdate', {
        busId,
        currentLocation,
        speed,
        heading,
        status,
        lastUpdate: busLocation.lastUpdate
      });
    }

    res.status(200).json(busLocation);
  } catch (error) {
    console.error('Update bus location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all active bus locations
exports.getActiveBusLocations = async (req, res) => {
  try {
    const busLocations = await BusLocation.find({ status: 'active' })
      .populate('busId', 'BusNumber capacity route_id')
      .populate('driverId', 'firstName lastName')
      .populate('routeId', 'name start_point end_point stops')
      .sort({ lastUpdate: -1 });

    // أعد تشكيل البيانات لتكون متوافقة مع ما يحتاجه الفرونت
    const result = busLocations
      .filter(loc => loc.currentLocation && loc.currentLocation.latitude != null && loc.currentLocation.longitude != null && loc.routeId && loc.busId)
      .map(loc => ({
        id: loc._id,
        busId: loc.busId._id,
        busNumber: loc.busId.BusNumber,
        capacity: loc.busId.capacity,
        routeId: loc.routeId._id,
        routeName: loc.routeId.name,
        currentLocation: {
          lat: loc.currentLocation.latitude,
          lng: loc.currentLocation.longitude
        },
        speed: loc.speed,
        heading: loc.heading,
        status: loc.status,
        driver: loc.driverId ? `${loc.driverId.firstName} ${loc.driverId.lastName}` : '',
        lastUpdate: loc.lastUpdate,
        currentStop: loc.currentStop,
        nextStop: loc.nextStop,
        estimatedArrival: loc.estimatedArrival
      }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Get active bus locations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get bus location by bus ID
exports.getBusLocationById = async (req, res) => {
  try {
    const { busId } = req.params;
    
    const busLocation = await BusLocation.findOne({ busId })
      .populate('busId', 'BusNumber capacity')
      .populate('driverId', 'firstName lastName')
      .populate('routeId', 'name start_point end_point stops');

    if (!busLocation) {
      return res.status(404).json({ message: 'Bus location not found' });
    }

    res.status(200).json(busLocation);
  } catch (error) {
    console.error('Get bus location by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get bus locations by route
exports.getBusLocationsByRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const busLocations = await BusLocation.find({ 
      routeId,
      status: 'active'
    })
      .populate('busId', 'BusNumber capacity')
      .populate('driverId', 'firstName lastName')
      .populate('routeId', 'name start_point end_point stops')
      .sort({ lastUpdate: -1 });

    res.status(200).json(busLocations);
  } catch (error) {
    console.error('Get bus locations by route error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get driver's bus location
exports.getDriverBusLocation = async (req, res) => {
  try {
    const driverId = req.user.id;
    
    const busLocation = await BusLocation.findOne({ driverId })
      .populate('busId', 'BusNumber capacity')
      .populate('routeId', 'name start_point end_point stops');

    if (!busLocation) {
      return res.status(404).json({ message: 'No active bus location found' });
    }

    res.status(200).json(busLocation);
  } catch (error) {
    console.error('Get driver bus location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Set bus status (online/offline)
exports.setBusStatus = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { status } = req.body;

    const busLocation = await BusLocation.findOne({ driverId });
    if (!busLocation) {
      return res.status(404).json({ message: 'Bus location not found' });
    }

    busLocation.status = status;
    busLocation.lastUpdate = new Date();
    await busLocation.save();

    res.status(200).json(busLocation);
  } catch (error) {
    console.error('Set bus status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 

// Get bus locations for all children of the authenticated parent
exports.getParentChildrenBusLocations = async (req, res) => {
  try {
    const parentId = req.user.id;
    const User = require('../models/userModel');
    // Get all children of the parent
    const parent = await User.findById(parentId).populate('children');
    if (!parent || !parent.children || parent.children.length === 0) {
      return res.status(404).json({ message: 'No children found for this parent' });
    }
    // For each child, get their assigned bus (if any)
    const Bus = require('../models/BusModel');
    const BusLocation = require('../models/BusLocationModel');
    const results = [];
    for (const child of parent.children) {
      // Find the bus where this child is assigned (by booking or by a field, adjust as needed)
      // Here, we assume the child has a booking with a bus, or you can add a busId field to the child
      // For now, let's try to find the latest booking for this child
      const Booking = require('../models/BookingModel');
      const latestBooking = await Booking.findOne({ studentId: child._id, status: { $in: ['pending', 'confirmed'] } }).sort({ date: -1 });
      if (latestBooking && latestBooking.busId) {
        // Get the latest location for this bus
        const busLocation = await BusLocation.findOne({ busId: latestBooking.busId })
          .populate('busId', 'BusNumber capacity')
          .populate('driverId', 'firstName lastName')
          .populate('routeId', 'name start_point end_point stops')
          .sort({ lastUpdate: -1 });
        if (busLocation) {
          results.push({
            child: { _id: child._id, firstName: child.firstName, lastName: child.lastName },
            bus: busLocation.busId,
            location: busLocation.currentLocation,
            status: busLocation.status,
            lastUpdate: busLocation.lastUpdate,
            route: busLocation.routeId,
            driver: busLocation.driverId
          });
        }
      }
    }
    res.status(200).json(results);
  } catch (error) {
    console.error('Get parent children bus locations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 