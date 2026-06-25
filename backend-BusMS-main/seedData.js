const mongoose = require('mongoose');
const User = require('./models/userModel');
const Bus = require('./models/BusModel');
const Route = require('./models/Route');
const BusLocation = require('./models/BusLocationModel');
const Trip = require('./models/Trip');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bus-management-system')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample routes data
const sampleRoutes = [
  {
    name: 'Route 1 - Downtown Express',
    start_point: {
      name: 'Downtown Station',
      lat: 30.0444,
      long: 31.2357
    },
    end_point: {
      name: 'University Campus',
      lat: 30.0544,
      long: 31.2457
    },
    stops: [
      {
        name: 'Central Park',
        lat: 30.0474,
        long: 31.2387
      },
      {
        name: 'Shopping Mall',
        lat: 30.0504,
        long: 31.2417
      },
      {
        name: 'Sports Complex',
        lat: 30.0524,
        long: 31.2437
      }
    ],
    estimated_time: '45 minutes'
  },
  {
    name: 'Route 2 - Suburban Line',
    start_point: {
      name: 'Suburban Station',
      lat: 30.0644,
      long: 31.2557
    },
    end_point: {
      name: 'Business District',
      lat: 30.0344,
      long: 31.2257
    },
    stops: [
      {
        name: 'Residential Area A',
        lat: 30.0594,
        long: 31.2507
      },
      {
        name: 'School Zone',
        lat: 30.0544,
        long: 31.2457
      },
      {
        name: 'Hospital',
        lat: 30.0444,
        long: 31.2357
      }
    ],
    estimated_time: '60 minutes'
  },
  {
    name: 'Route 3 - Airport Shuttle',
    start_point: {
      name: 'City Center',
      lat: 30.0444,
      long: 31.2357
    },
    end_point: {
      name: 'International Airport',
      lat: 30.1244,
      long: 31.4057
    },
    stops: [
      {
        name: 'Hotel District',
        lat: 30.0744,
        long: 31.2857
      },
      {
        name: 'Conference Center',
        lat: 30.0944,
        long: 31.3257
      },
      {
        name: 'Terminal 1',
        lat: 30.1144,
        long: 31.3857
      }
    ],
    estimated_time: '90 minutes'
  }
];

// Sample drivers data
const sampleDrivers = [
  {
    firstName: 'Ahmed',
    lastName: 'Ali',
    email: 'ahmed.ali@buscompany.com',
    password: 'password123',
    role: 'driver',
    licenseNumber: 'DL-001-2024',
    phone: '+201234567890'
  },
  {
    firstName: 'Mohamed',
    lastName: 'Hassan',
    email: 'mohamed.hassan@buscompany.com',
    password: 'password123',
    role: 'driver',
    licenseNumber: 'DL-002-2024',
    phone: '+201234567891'
  },
  {
    firstName: 'Omar',
    lastName: 'Khalil',
    email: 'omar.khalil@buscompany.com',
    password: 'password123',
    role: 'driver',
    licenseNumber: 'DL-003-2024',
    phone: '+201234567892'
  },
  {
    firstName: 'Youssef',
    lastName: 'Mahmoud',
    email: 'youssef.mahmoud@buscompany.com',
    password: 'password123',
    role: 'driver',
    licenseNumber: 'DL-004-2024',
    phone: '+201234567893'
  }
];

// Sample buses data
const sampleBuses = [
  {
    BusNumber: 'BUS-001',
    capacity: 30,
    status: 'active'
  },
  {
    BusNumber: 'BUS-002',
    capacity: 25,
    status: 'active'
  },
  {
    BusNumber: 'BUS-003',
    capacity: 35,
    status: 'active'
  },
  {
    BusNumber: 'BUS-004',
    capacity: 28,
    status: 'active'
  },
  {
    BusNumber: 'BUS-005',
    capacity: 32,
    status: 'Maintenance'
  }
];

async function seedData() {
  try {
    console.log('Starting data seeding...');

    // Clear existing data
    await User.deleteMany({ role: 'driver' });
    await Bus.deleteMany({});
    await Route.deleteMany({});
    await BusLocation.deleteMany({});
    await Trip.deleteMany({}); // Clear existing trips

    console.log('Cleared existing data');

    // Create routes
    const createdRoutes = await Route.insertMany(sampleRoutes);
    console.log(`Created ${createdRoutes.length} routes`);

    // Create drivers
    const createdDrivers = await User.insertMany(sampleDrivers);
    console.log(`Created ${createdDrivers.length} drivers`);

    // Create buses and assign drivers and routes
    const busesWithAssignments = sampleBuses.map((bus, index) => ({
      ...bus,
      assigned_driver_id: createdDrivers[index]?._id || null,
      route_id: createdRoutes[index % createdRoutes.length]?._id || null
    }));

    const createdBuses = await Bus.insertMany(busesWithAssignments);
    console.log(`Created ${createdBuses.length} buses`);

    // Create bus locations for active buses
    const busLocations = createdBuses
      .filter(bus => bus.status === 'active')
      .map((bus, index) => ({
        busId: bus._id,
        driverId: bus.assigned_driver_id,
        routeId: bus.route_id,
        currentLocation: {
          latitude: 30.0444 + (index * 0.01),
          longitude: 31.2357 + (index * 0.01)
        },
        speed: Math.floor(Math.random() * 50) + 20, // 20-70 km/h
        heading: Math.floor(Math.random() * 360),
        status: 'active',
        currentStop: {
          name: 'Current Stop',
          lat: 30.0444 + (index * 0.01),
          long: 31.2357 + (index * 0.01)
        },
        nextStop: {
          name: 'Next Stop',
          lat: 30.0544 + (index * 0.01),
          long: 31.2457 + (index * 0.01)
        },
        estimatedArrival: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        lastUpdate: new Date()
      }));

    if (busLocations.length > 0) {
      await BusLocation.insertMany(busLocations);
      console.log(`Created ${busLocations.length} bus locations`);
    }

    // Get some existing data for references
    const routes = await Route.find();
    const buses = await Bus.find();
    const drivers = await User.find({ role: 'driver' });

    if (routes.length && buses.length && drivers.length) {
      // Create trips for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Delete existing trips for today to avoid duplicates
      await Trip.deleteMany({
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      // Create 3 trips for today
      const trips = [
        {
          date: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8 AM
          routeId: routes[0]._id,
          busId: buses[0]._id,
          driverId: drivers[0]._id,
          status: 'scheduled'
        },
        {
          date: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
          routeId: routes[1 % routes.length]._id,
          busId: buses[1 % buses.length]._id,
          driverId: drivers[1 % drivers.length]._id,
          status: 'scheduled'
        },
        {
          date: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10 AM
          routeId: routes[2 % routes.length]._id,
          busId: buses[2 % buses.length]._id,
          driverId: drivers[2 % drivers.length]._id,
          status: 'scheduled'
        }
      ];

      await Trip.insertMany(trips);
      console.log('Sample trips created successfully');
    }

    console.log('Data seeding completed successfully!');
    console.log('\nSample data created:');
    console.log(`- ${createdRoutes.length} routes`);
    console.log(`- ${createdDrivers.length} drivers`);
    console.log(`- ${createdBuses.length} buses`);
    console.log(`- ${busLocations.length} active bus locations`);

    // Display created data
    console.log('\nRoutes:');
    createdRoutes.forEach(route => {
      console.log(`- ${route.name}: ${route.start_point.name} → ${route.end_point.name}`);
    });

    console.log('\nDrivers:');
    createdDrivers.forEach(driver => {
      console.log(`- ${driver.firstName} ${driver.lastName} (${driver.licenseNumber})`);
    });

    console.log('\nBuses:');
    createdBuses.forEach(bus => {
      const driver = createdDrivers.find(d => d._id.equals(bus.assigned_driver_id));
      const route = createdRoutes.find(r => r._id.equals(bus.route_id));
      console.log(`- ${bus.BusNumber}: ${driver ? `${driver.firstName} ${driver.lastName}` : 'No driver'} | ${route ? route.name : 'No route'} | ${bus.status}`);
    });

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedData(); 