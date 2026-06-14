// Force Google DNS for SRV record resolution (local DNS doesn't support SRV queries)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set security HTTP headers
app.use(helmet());

// Compress all routes
app.use(compression());

// Rate limit for API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', apiLimiter);

app.use(express.static(path.join(__dirname, '../public')));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api', orderRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'register.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'profile.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'profile.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'products.html'));
});

app.get('/category', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'category.html'));
});

app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'product.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'cart.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
