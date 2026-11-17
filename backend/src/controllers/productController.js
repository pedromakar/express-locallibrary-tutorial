const mongoose = require('mongoose');
const Product = require('../models/product');
const { products: seedCatalog } = require('../config/seedData');

// Normalized category regex generator for aliases, plurals and variations
function normalizeCategoryRegex(category) {
  if (!category) return null;
  const clean = category.trim().toLowerCase();

  if (/^molet/i.test(clean) || /^casac/i.test(clean)) {
    return /^(moletons?|casacos?)$/i;
  }
  if (/^calc/i.test(clean) || /^calç/i.test(clean)) {
    return /^(calças?|calcas?|pantalonas?)$/i;
  }
  if (/^camiset/i.test(clean) || /^t-?shirt/i.test(clean)) {
    return /^(camisetas?|t-?shirts?)$/i;
  }
  if (/^regat/i.test(clean) || /^tank/i.test(clean)) {
    return /^(regatas?|tanks?)$/i;
  }
  if (/^short/i.test(clean) || /^bermud/i.test(clean)) {
    return /^(shorts?|bermudas?)$/i;
  }
  if (/^legging/i.test(clean)) {
    return /^(leggings?)$/i;
  }
  if (/^cropped/i.test(clean)) {
    return /^(croppeds?)$/i;
  }
  if (/^top/i.test(clean)) {
    return /^(tops?)$/i;
  }
  if (/^acess/i.test(clean)) {
    return /^(acess[oó]rios?)$/i;
  }
  return new RegExp(`^${clean}s?$`, 'i');
}

// Calculate photo & product authenticity score:
// 100: Custom photos uploaded/registered by user (/images/products/...)
// 80-90: Brand shoot / campaign assets (usealphaco, /uploads/)
// 20-40: Standard catalog items
// 10: Generic unsplash fallback
function getProductPhotoPriority(product) {
  if (typeof product.priority === 'number' && product.priority > 0) {
    return product.priority;
  }
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImg = product.image || (images.length > 0 ? images[0] : '');
  const allImgs = images.concat(primaryImg ? [primaryImg] : []);

  if (allImgs.some(img => typeof img === 'string' && (img.startsWith('/images/products') || img.includes('md-oversized') || img.includes('md-raglan')))) {
    return 100;
  }
  if (allImgs.some(img => typeof img === 'string' && (img.includes('usealphaco') || img.includes('/uploads/')))) {
    return 80;
  }
  if (product.badge === 'DROP' || product.badge === 'PERFORMANCE' || product.badge === 'BEST SELLER') {
    return 50;
  }
  if (primaryImg && !primaryImg.includes('images.unsplash.com')) {
    return 30;
  }
  return 10;
}

// Ensure registered/custom photos are ALWAYS first in product.images and thumbnail
function normalizeProductImages(product) {
  if (!product) return product;
  const p = { ...product };
  if (Array.isArray(p.images) && p.images.length > 0) {
    const scoreImage = (url) => {
      if (!url || typeof url !== 'string') return 0;
      if (url.startsWith('/images/products') || url.includes('md-oversized') || url.includes('md-raglan')) return 3;
      if (url.includes('/uploads/') || url.includes('usealphaco')) return 2;
      if (!url.includes('images.unsplash.com')) return 1;
      return 0;
    };
    p.images = [...p.images].sort((a, b) => scoreImage(b) - scoreImage(a));
    p.image = p.images[0];
  } else if (p.image) {
    p.images = [p.image];
  }
  return p;
}

// Fallback static data synchronized with official seedCatalog and prioritized
const fallbackProducts = seedCatalog.map((p, idx) => {
  return normalizeProductImages({
    _id: p._id || `prod_${idx + 1}_${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    ...p
  });
}).sort((a, b) => getProductPhotoPriority(b) - getProductPhotoPriority(a));

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

exports.getProducts = async (req, res) => {
  try {
    const { category, search, color, size, gender, publico } = req.query;
    const targetGender = (gender || publico || '').toLowerCase();

    const filterFallback = (data) => {
      let filtered = [...data];

      if (targetGender === 'masculino') {
        filtered = filtered.filter(p => !p.gender || p.gender === 'masculino' || p.gender === 'unissex');
      } else if (targetGender === 'feminino') {
        filtered = filtered.filter(p => p.gender === 'feminino' || p.gender === 'unissex');
      } else if (targetGender === 'unissex') {
        filtered = filtered.filter(p => p.gender === 'unissex');
      }

      if (category) {
        const catRegex = normalizeCategoryRegex(category);
        if (catRegex) {
          filtered = filtered.filter(p => catRegex.test(p.category || ''));
        }
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
      const filtered = filterFallback(fallbackProducts);
      const prioritized = filtered
        .map(normalizeProductImages)
        .sort((a, b) => getProductPhotoPriority(b) - getProductPhotoPriority(a));
      return res.json(prioritized);
    }

    const filter = {};

    if (targetGender === 'masculino') {
      filter.gender = { $in: ['masculino', 'unissex'] };
    } else if (targetGender === 'feminino') {
      filter.gender = { $in: ['feminino', 'unissex'] };
    } else if (targetGender === 'unissex') {
      filter.gender = 'unissex';
    }

    if (category) {
      const catRegex = normalizeCategoryRegex(category);
      if (catRegex) {
        filter.category = { $regex: catRegex };
      }
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

    let products = await Product.find(filter).sort({ priority: -1, createdAt: -1 }).lean();
    products = products
      .map(normalizeProductImages)
      .sort((a, b) => getProductPhotoPriority(b) - getProductPhotoPriority(a));
    res.json(products);
  } catch (err) {
    res.json([]);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const targetGender = (req.query.gender || req.query.publico || '').toLowerCase();

    if (!isDbConnected()) {
      let filtered = [...fallbackProducts];
      if (targetGender === 'masculino') {
        filtered = filtered.filter(p => !p.gender || p.gender === 'masculino' || p.gender === 'unissex');
      } else if (targetGender === 'feminino') {
        filtered = filtered.filter(p => p.gender === 'feminino' || p.gender === 'unissex');
      }
      const categoryMap = {};
      for (const p of filtered) {
        const cat = p.category || 'Geral';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      }
      const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
      categories.sort((a, b) => a.name.localeCompare(b.name));
      return res.json(categories);
    }

    const matchStage = {};
    if (targetGender === 'masculino') {
      matchStage.gender = { $in: ['masculino', 'unissex'] };
    } else if (targetGender === 'feminino') {
      matchStage.gender = { $in: ['feminino', 'unissex'] };
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    pipeline.push(
      {
        $group: {
          _id: { $ifNull: ['$category', 'Geral'] },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, name: '$_id', count: 1 } },
      { $sort: { name: 1 } }
    );

    const categories = await Product.aggregate(pipeline);
    res.json(categories.length ? categories : [{ name: 'Geral', count: 0 }]);
  } catch (err) {
    // Fallback categories from static data
    let filtered = [...fallbackProducts];
    const targetGender = (req.query.gender || req.query.publico || '').toLowerCase();
    if (targetGender === 'masculino') {
      filtered = filtered.filter(p => !p.gender || p.gender === 'masculino' || p.gender === 'unissex');
    } else if (targetGender === 'feminino') {
      filtered = filtered.filter(p => p.gender === 'feminino' || p.gender === 'unissex');
    }
    const categoryMap = {};
    for (const p of filtered) {
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
      return res.json(normalizeProductImages(product));
    }
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      const fallback = fallbackProducts.find((p) => p._id === req.params.id);
      if (fallback) return res.json(normalizeProductImages(fallback));
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(normalizeProductImages(product));
  } catch (err) {
    // Try fallback
    const product = fallbackProducts.find((p) => p._id === req.params.id);
    if (product) return res.json(normalizeProductImages(product));
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, price, countInStock, images, priority, badge, sizes, colors, benefits, gender } = req.body;
    const calcPriority = priority !== undefined ? Number(priority) : getProductPhotoPriority({ images, badge });
    const product = new Product({
      name,
      description,
      category,
      price,
      countInStock,
      images,
      priority: calcPriority,
      badge,
      sizes,
      colors,
      benefits,
      gender
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, category, price, countInStock, images, priority, badge, sizes, colors, benefits, gender } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.category = category ?? product.category;
    product.price = price ?? product.price;
    product.countInStock = countInStock ?? product.countInStock;
    product.images = Array.isArray(images) ? images : product.images;
    if (priority !== undefined) {
      product.priority = Number(priority);
    } else if (images) {
      product.priority = getProductPhotoPriority({ ...product.toObject(), images });
    }
    if (badge !== undefined) product.badge = badge;
    if (sizes !== undefined) product.sizes = sizes;
    if (colors !== undefined) product.colors = colors;
    if (benefits !== undefined) product.benefits = benefits;
    if (gender !== undefined) product.gender = gender;

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

/**
 * GET /api/products/:id/can-review
 * Verifica se o usuário atual comprou o produto e tem autorização para avaliar
 */
exports.checkCanReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ canReview: false, message: 'Produto não encontrado' });

    if (!req.user) {
      return res.json({
        canReview: false,
        reason: 'not_logged_in',
        message: 'Faça login com a conta que realizou a compra para avaliar este produto.'
      });
    }

    const userId = req.user.id || req.user._id;
    const Order = require('../models/order');

    // Verifica se o usuário tem algum pedido contendo este produto
    const order = await Order.findOne({
      user: userId,
      'items.productId': product._id
    });

    if (!order && !req.user.isAdmin) {
      return res.json({
        canReview: false,
        reason: 'not_purchased',
        message: 'Apenas clientes que compraram este produto podem avaliá-lo.'
      });
    }

    return res.json({
      canReview: true,
      reason: 'verified_purchase',
      username: req.user.username || 'Cliente',
      orderId: order ? order._id : 'admin_review'
    });
  } catch (err) {
    res.status(500).json({ canReview: false, message: err.message });
  }
};

/**
 * POST /api/products/:id/reviews
 * Cadastra avaliação com verificação de compra obrigatória (Shopee style)
 */
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment, name, images, imageUrl } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    // 1. Obrigatório estar autenticado
    if (!req.user) {
      return res.status(401).json({
        message: 'Você precisa estar conectado à sua conta para avaliar este produto.'
      });
    }

    // 2. Validação de compra comprovada no banco
    const userId = req.user.id || req.user._id;
    const Order = require('../models/order');
    const hasPurchased = await Order.findOne({
      user: userId,
      'items.productId': product._id
    });

    if (!hasPurchased && !req.user.isAdmin) {
      return res.status(403).json({
        message: 'Apenas clientes que compraram este produto podem avaliá-lo.'
      });
    }

    // 3. Validação de nota e mínimo de caracteres (mínimo 15 caracteres)
    if (!rating) {
      return res.status(400).json({ message: 'Por favor, selecione uma nota de 1 a 5 estrelas.' });
    }

    const cleanComment = (comment || '').trim();
    if (cleanComment.length < 15) {
      return res.status(400).json({
        message: `Seu comentário possui ${cleanComment.length} caracteres. O mínimo obrigatório é de 15 caracteres para detalhar sua experiência com o produto.`
      });
    }

    // 4. Processamento de fotos enviadas (upload ou URL)
    let reviewImages = [];
    if (Array.isArray(images) && images.length > 0) {
      reviewImages = images.filter(Boolean);
    } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      reviewImages = [imageUrl.trim()];
    }

    const reviewName = name || req.user.username || 'Cliente Verificado';

    const review = {
      name: reviewName,
      rating: Number(rating),
      comment: cleanComment,
      images: reviewImages,
      verifiedPurchase: true,
      createdAt: new Date(),
    };

    if (!product.reviews) {
      product.reviews = [];
    }

    product.reviews.unshift(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Avaliação enviada com sucesso! Obrigado pelo feedback.', product });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar avaliação', error: err.message });
  }
};
