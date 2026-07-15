const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const Order = require('./src/models/order');
const User = require('./src/models/user');
const Product = require('./src/models/product');

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');

    const user = await User.findOne({});
    const product = await Product.findOne({});

    if (!user || !product) {
      console.error('Could not find user or product in the database.');
      return;
    }

    console.log(`Found User: ${user.username} (${user._id})`);
    console.log(`Found Product: ${product.name} (${product._id})`);

    const orderItems = [{
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: 'M',
      color: 'Preto'
    }];

    const order = new Order({
      user: user._id,
      items: orderItems,
      totalPrice: product.price,
      status: 'pending'
    });

    console.log('Validating order...');
    await order.validate();
    console.log('Order validation passed successfully.');

    console.log('Saving order...');
    const saved = await order.save();
    console.log('Order saved successfully with ID:', saved._id);

    // Delete it so we don't pollute the DB
    await Order.findByIdAndDelete(saved._id);
    console.log('Test order deleted successfully.');

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.connection.close();
    console.log('DB connection closed.');
  }
}

test();
