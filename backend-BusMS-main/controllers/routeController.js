const Route = require('../models/Route');
const { io } = require('../server');

// createRoute
exports.createRoute = async (req, res) => {
  try {
    let {
      name,
      start_point,
      end_point,
      stops,
      estimated_time
    } = req.body;

    // تأكد من وجود الحقول lat وlong في start_point وend_point
    if (start_point) {
      if (start_point.lng != null && start_point.long == null) start_point.long = start_point.lng;
      if (start_point.longitude != null && start_point.long == null) start_point.long = start_point.longitude;
    }
    if (end_point) {
      if (end_point.lng != null && end_point.long == null) end_point.long = end_point.lng;
      if (end_point.longitude != null && end_point.long == null) end_point.long = end_point.longitude;
    }

    // ترتيب المحطات تلقائيًا
    const orderedStops = [
      {
        name: start_point.name,
        lat: start_point.lat,
        long: start_point.long,
        order: 1
      },
      ...(stops || []).map((stop, idx) => ({
        ...stop,
        order: idx + 2
      })),
      {
        name: end_point.name,
        lat: end_point.lat,
        long: end_point.long,
        order: (stops ? stops.length : 0) + 2
      }
    ];

    const newRoute = new Route({
      name,
      start_point,
      end_point,
      stops: orderedStops,
      estimated_time
    });

    const savedRoute = await newRoute.save();
    res.status(201).json({
      success: true,
      message: "Route added successfully",
      data: savedRoute
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// getRoutes
exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// getRouteById
exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.status(200).json(route);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// updateRoute
exports.updateRoute = async (req, res) => {
  try {
    let {
      name,
      start_point,
      end_point,
      stops,
      estimated_time
    } = req.body;

    if (start_point) {
      if (start_point.lng != null && start_point.long == null) start_point.long = start_point.lng;
      if (start_point.longitude != null && start_point.long == null) start_point.long = start_point.longitude;
    }
    if (end_point) {
      if (end_point.lng != null && end_point.long == null) end_point.long = end_point.lng;
      if (end_point.longitude != null && end_point.long == null) end_point.long = end_point.longitude;
    }

    // ترتيب المحطات تلقائيًا
    const orderedStops = [
      {
        name: start_point.name,
        lat: start_point.lat,
        long: start_point.long,
        order: 1
      },
      ...(stops || []).map((stop, idx) => ({
        ...stop,
        order: idx + 2
      })),
      {
        name: end_point.name,
        lat: end_point.lat,
        long: end_point.long,
        order: (stops ? stops.length : 0) + 2
      }
    ];

    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      {
        name,
        start_point,
        end_point,
        stops: orderedStops,
        estimated_time
      },
      { new: true }
    );
    if (!updatedRoute) return res.status(404).json({ message: 'Route not found' });
    if (io) io.emit('routeUpdated', updatedRoute);
    res.status(200).json(updatedRoute);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// deleteRoute
exports.deleteRoute = async (req, res) => {
  try {
    const deletedRoute = await Route.findByIdAndDelete(req.params.id);
    if (!deletedRoute) return res.status(404).json({ message: 'Route not found' });
    if (io) io.emit('routeDeleted', { routeId: req.params.id });
    res.status(200).json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// getRoutesByEndPoint
exports.getRoutesByEndPoint = async (req, res) => {
  try {
    const routes = await Route.find({ end_point: req.params.endPoint });
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// getRoutesByCurrentStation
exports.getRoutesByCurrentStation = async (req, res) => {
  try {
    const routes = await Route.find({ current_station: req.params.currentStation });
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
