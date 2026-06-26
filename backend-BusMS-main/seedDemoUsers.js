const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config();

const demoUsers = [
  {
    firstName: 'Demo',
    lastName: 'Admin',
    email: 'admin@bustrack.demo',
    password: 'Demo@1234',
    role: 'admin',
  },
  {
    firstName: 'Demo',
    lastName: 'Parent',
    email: 'parent@bustrack.demo',
    password: 'Demo@1234',
    role: 'parent',
  },
  {
    firstName: 'Demo',
    lastName: 'Driver',
    email: 'driver@bustrack.demo',
    password: 'Demo@1234',
    role: 'driver',
    phone: '0500000000',
    licenseNumber: 'DEMO-DRV-001',
  },
];

const seedDemoUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`Already exists: ${userData.email} (${userData.role})`);
      } else {
        await User.create(userData);
        console.log(`Created: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\nDemo users ready! Password for all: Demo@1234');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedDemoUsers();