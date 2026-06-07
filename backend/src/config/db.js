const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const defaultMongoURI = process.env.MONGODB_URI || 'mongodb+srv://pedro:12345@cluster0.7euduan.mongodb.net/?appName=Cluster0';

async function seedAdminUser() {
  const adminUsername = process.env.ADMIN_USER?.trim().toLowerCase() || 'admin';
  const adminPassword = process.env.ADMIN_PASS || '12345';
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'pedromakardomingos@gmail.com';

  const existingAdmin = await User.findOne({
    $or: [{ username: adminUsername }, { email: adminEmail }],
  });
  if (existingAdmin) {
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
    console.warn('MONGODB_URI not set in .env, using legacy fallback connection');
  }
  try {
    await mongoose.connect(defaultMongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
    console.log('MongoDB connected');
    await seedAdminUser();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    console.warn('Backend will continue running without MongoDB connection.');
  }
}

module.exports = connectDB;
