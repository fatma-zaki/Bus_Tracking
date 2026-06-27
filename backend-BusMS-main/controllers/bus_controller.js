const Bus = require('../models/BusModel');
const mongoose = require('mongoose');

exports.createBus = async (req, res) => {
    try {
        console.log('  data', req.body);
        const { BusNumber, capacity, status, driverId, route_id } = req.body;
        
        // Check if bus already exists
        const existingBus = await Bus.findOne({ BusNumber });
        if (existingBus) {
            return res.status(400).json({ message: 'Bus already exists' });
        }

        // Validate route_id if provided
        let validatedRouteId = null;
        if (route_id && route_id !== 'null' && route_id !== '') {
            if (!mongoose.Types.ObjectId.isValid(route_id)) {
                return res.status(400).json({ message: 'Invalid route_id format' });
            }
            validatedRouteId = route_id;
        }

        // Validate driverId if provided
        let validatedDriverId = null;
        if (driverId && driverId !== 'null' && driverId !== '') {
            if (!mongoose.Types.ObjectId.isValid(driverId)) {
                return res.status(400).json({ message: 'Invalid driverId format' });
            }
            validatedDriverId = driverId;
        }

        const bus = new Bus({
            BusNumber,
            capacity,
            status,
            driverId: validatedDriverId,
            route_id: validatedRouteId
        });
        
        await bus.save();

        // إضافة سجل BusLocation تلقائيًا إذا كان هناك route_id
        if (validatedRouteId) {
            const BusLocation = require('../models/BusLocationModel');
            const route = await require('../models/Route').findById(validatedRouteId);
            if (route && route.start_point && route.start_point.lat != null) {
                // جلب long من أي اسم متوفر
                let long = route.start_point.long ?? route.start_point.lng ?? route.start_point.longitude;
                if (typeof long === 'number' && !isNaN(long)) {
                    await BusLocation.create({
                        busId: bus._id,
                        driverId: validatedDriverId,
                        routeId: validatedRouteId,
                        currentLocation: {
                            latitude: route.start_point.lat,
                            longitude: long
                        },
                        speed: 0,
                        heading: 0,
                        status: 'active',
                        lastUpdate: new Date()
                    });
                } else {
                    console.warn('لم يتم إنشاء BusLocation: لا توجد قيمة longitude صحيحة في start_point', route.start_point);
                }
            }
        }

        return res.status(201).json(bus);
    } catch (error) {
        console.error('Create Bus Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllBuses = async (req, res) => {
    try {
        console.log('Fetching buses...');
        const buses = await Bus.find()
            .populate('driverId', 'firstName lastName')
            .populate('route_id', 'name start_point end_point');
        res.status(200).json(buses);
    } catch (error) {
        console.error('Get All Buses Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getBusById = async (req, res) => {
    try {
        const { id } = req.params;
        const buses = await Bus.findById(id)
            .populate('driverId', 'firstName lastName')
            .populate('route_id', 'name start_point end_point');
        if (!buses)
            return res.status(404).json({ message: 'Bus not found' });
        res.status(200).json(buses);

    } catch (error) {
        console.error('Get Bus by ID Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateBus = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Validate route_id if provided in updates
        if (updates.route_id && updates.route_id !== 'null' && updates.route_id !== '') {
            if (!mongoose.Types.ObjectId.isValid(updates.route_id)) {
                return res.status(400).json({ message: 'Invalid route_id format' });
            }
        } else if (updates.route_id === 'null' || updates.route_id === '') {
            updates.route_id = null;
        }

        // Validate driverId if provided in updates
        if (updates.driverId && updates.driverId !== 'null' && updates.driverId !== '') {
            if (!mongoose.Types.ObjectId.isValid(updates.driverId)) {
                return res.status(400).json({ message: 'Invalid driverId format' });
            }
        } else if (updates.driverId === 'null' || updates.driverId === '') {
            updates.driverId = null;
        }

        const updateBus = await Bus.findByIdAndUpdate(id, updates, { new: true });
        if (!updateBus)
            return res.status(404).json({ message: 'Bus not found' });
        res.status(200).json(updateBus);
    } catch (error) {
        console.error('Update Bus Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteBus = async (req, res) => {
    try {
        const { id } = req.params;
        const bus = await Bus.findByIdAndDelete(id, { status: "inactive" }, { new: true });
        if (!bus)
            return res.status(404).json({ message: 'Bus not found' });
        res.status(200).json({ message: 'Bus deleted successfully', bus });

    } catch (error) {
        console.error('Delete Bus Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}