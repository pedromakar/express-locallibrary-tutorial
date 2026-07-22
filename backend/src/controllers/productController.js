const mongoose = require('mongoose');
const Product = require('../models/product');

// Fallback static data used when MongoDB is unavailable
const fallbackProducts = [
  {
    _id: 'p1',
    name: 'Top Active Mesh',
    category: 'Tops e Camisetas',
    price: 129.9,
    description: 'Top de treino com tecido respirável e design moderno.',
    image: 'https://images.unsplash.com/photo-1564468781196-eb559f846169?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1564468781196-eb559f846169?auto=format&fit=crop&w=800&q=80'],
    countInStock: 18,
  },
  {
    _id: 'p2',
    name: 'Legging Power',
    category: 'Leggings e Calças',
    price: 189.0,
    description: 'Legging cintura alta com compressão leve para todos os treinos.',
    image: 'https://images.unsplash.com/photo-1579758629930-0364c59fb3ec?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1579758629930-0364c59fb3ec?auto=format&fit=crop&w=800&q=80'],
    countInStock: 12,
  },
  {
    _id: 'p3',
    name: 'Camiseta Dry Fit',
    category: 'Tops e Camisetas',
    price: 99.9,
    description: 'Camiseta seca rápido, perfeita para corrida e academia.',
    image: 'https://images.unsplash.com/photo-1526401485004-8d1d5ef96588?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1526401485004-8d1d5ef96588?auto=format&fit=crop&w=800&q=80'],
    countInStock: 26,
  },
  {
    _id: 'p4',
    name: 'Short Flex',
    category: 'Coleções Fitness',
    price: 109.5,
    description: 'Short leve com bolsos ocultos para maior praticidade.',
    image: 'https://images.unsplash.com/photo-1508606572321-901ea4437072?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1508606572321-901ea4437072?auto=format&fit=crop&w=800&q=80'],
    countInStock: 22,
  },
  {
    _id: 'p5',
    name: 'Legging Sculpt',
    category: 'Leggings e Calças',
    price: 199.9,
    description: 'Modelagem slim e toque macio para flexibilidade total.',
    image: 'https://images.unsplash.com/photo-1599533767041-1a0d9c4c0377?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1599533767041-1a0d9c4c0377?auto=format&fit=crop&w=800&q=80'],
    countInStock: 10,
  },
  {
    _id: 'p6',
    name: 'Kits de Meias',
    category: 'Acessórios',
    price: 49.9,
    description: 'Meias esportivas antiderrapantes para treinos intensos.',
    image: 'https://images.unsplash.com/photo-1528701800489-20b9f7462f8c?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1528701800489-20b9f7462f8c?auto=format&fit=crop&w=800&q=80'],
    countInStock: 34,
  },
];

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

exports.getProducts = async (req, res) => {
  try {
    const { category, search, color, size } = req.query;

    const filterFallback = (data) => {
      let filtered = [...data];
      if (category) {
        filtered = filtered.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
      }
      if (color) {
        filtered = filtered.filter((p) => p.colors?.some(c => c.name?.toLowerCase().includes(color.toLowerCase())));
      }
      if (size) {
        filtered = filtered.filter((p) => p.sizes?.some(s => s.toLowerCase() === size.toLowerCase()));
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter((p) =>
          p.name?.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s) ||
          p.category?.toLowerCase().includes(s) ||
          p.sizes?.some(sz => sz.toLowerCase().includes(s)) ||
          p.colors?.some(c => c.name?.toLowerCase().includes(s))
        );
      }
      return filtered;
    };

    if (!isDbConnected()) {
      return res.json(filterFallback(fallbackProducts));
    }

    const filter = {};
    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (color) {
      filter['colors.name'] = { $regex: color, $options: 'i' };
    }
    if (size) {
      filter.sizes = { $regex: new RegExp(`^${size}$`, 'i') };
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { badge: searchRegex },
        { sizes: searchRegex },
        { 'colors.name': searchRegex },
      ];
    }

    const products = await Product.find(filter).lean();
    res.json(products);
  } catch (err) {
    res.json([]);
  }
};

exports.getCategories = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const categoryMap = {};
      for (const p of fallbackProducts) {
        const cat = p.category || 'Geral';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      }
      const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
      categories.sort((a, b) => a.name.localeCompare(b.name));
      return res.json(categories);
    }
    const categories = await Product.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$category', 'Geral'] },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, name: '$_id', count: 1 } },
      { $sort: { name: 1 } },
    ]);
    res.json(categories.length ? categories : [{ name: 'Geral', count: 0 }]);
  } catch (err) {
    // Fallback categories from static data
    const categoryMap = {};
    for (const p of fallbackProducts) {
      const cat = p.category || 'Geral';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }
    const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
    categories.sort((a, b) => a.name.localeCompare(b.name));
    res.json(categories);
  }
};

exports.getProductById = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const product = fallbackProducts.find((p) => p._id === req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      return res.json(product);
    }
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    // Try fallback
    const product = fallbackProducts.find((p) => p._id === req.params.id);
    if (product) return res.json(product);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, price, countInStock, images } = req.body;
    const product = new Product({ name, description, category, price, countInStock, images });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, category, price, countInStock, images } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.category = category ?? product.category;
    product.price = price ?? product.price;
    product.countInStock = countInStock ?? product.countInStock;
    product.images = Array.isArray(images) ? images : product.images;

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
