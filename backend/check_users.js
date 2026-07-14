const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/user');

dotenv.config();

// Force Google DNS
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function run() {
  console.log("Connecting to database using MONGODB_URI...");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not found in env!");
  }
  await mongoose.connect(uri);
  console.log("Connected!");
  
  const users = await User.find({}).lean();
  console.log("Users in Database:");
  users.forEach(u => {
    console.log(`- Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`);
  });
  
  mongoose.disconnect();
}

run().catch(console.error);
