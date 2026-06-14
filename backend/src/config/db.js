const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function seedAdminUser() {
  console.log('Attempting to seed admin user...');
  const adminUsername = process.env.ADMIN_USER?.trim().toLowerCase() || 'admin';
  const adminPassword = process.env.ADMIN_PASS || '12345';
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'pedromakardomingos@gmail.com';

  const existingAdmin = await User.findOne({
    $or: [{ username: adminUsername }, { email: adminEmail }],
  });
  if (existingAdmin) {
    console.log(`Admin user '${adminUsername}' already exists. Skipping seeding.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await User.create({
    username: adminUsername,
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
  });
  console.log(`Admin user created: ${adminUsername} (${adminEmail})`);
}

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.error('WARNING: MONGODB_URI is not set in .env. Database-dependent features will not work.');
    return; // Allow the application to continue without connecting to DB
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
    });
    mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
    console.log('MongoDB connected');
    await seedAdminUser();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    console.error('Backend will start, but database-dependent features will not work.');
  }
}

module.exports = connectDB;
