const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('./src/models/product');
const { products } = require('./src/config/seedData');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedProducts = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error('MONGODB_URI not found in .env');

    console.log('Conectando ao MongoDB...');
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });

    for (const p of products) {
      await Product.findOneAndUpdate(
        { name: p.name },
        { $set: p },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ ${products.length} produtos sincronizados com sucesso na base de dados!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error.message);
    process.exit(1);
  }
};

seedProducts();
