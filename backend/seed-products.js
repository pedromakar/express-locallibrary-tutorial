const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('./src/models/product');
const dns = require('dns');

// Fix for Node.js SRV resolution issues on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: path.join(__dirname, '.env') });

const products = [
  {
    name: 'Over MD Essential',
    category: 'Camisetas',
    price: 139.9,
    description: 'Camiseta Oversized com modelagem exclusiva MD, algodão premium de alta gramatura.',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80'],
    countInStock: 20,
  },
  {
    name: 'Regata Canelada MD Fit',
    category: 'Regatas',
    price: 94.0,
    description: 'Regata em tecido canelado premium, ajuste anatômico que valoriza o shape.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80'],
    countInStock: 15,
  },
  {
    name: 'Short Performance MD',
    category: 'Shorts',
    price: 125.9,
    description: 'Short com tecido tecnológico elástico, bolso interno e secagem ultra rápida.',
    image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80'],
    countInStock: 18,
  },
  {
    name: 'Over MD Acid Wash',
    category: 'Camisetas',
    price: 159.5,
    description: 'Edição limitada com lavagem estonada e estampa minimalista MD no peito.',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'],
    countInStock: 10,
  },
  {
    name: 'Moletom MD Heavy Cargo',
    category: 'Casacos',
    price: 289.9,
    description: 'Moletom pesado com capuz estruturado e bolsos cargo funcionais.',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80'],
    countInStock: 8,
  },
  {
    name: 'Bag MD Gym Day',
    category: 'Acessórios',
    price: 199.9,
    description: 'Mochila versátil com compartimento para tênis e tecidos impermeáveis.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'],
    countInStock: 25,
  },
];

const seedProducts = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI not found in .env');
    }

    console.log('Conectando ao MongoDB para cadastrar produtos...');
    await mongoose.connect(mongoURI);

    // Limpar produtos existentes para não duplicar
    await Product.deleteMany({});
    console.log('Produtos antigos removidos.');

    // Inserir os novos produtos
    await Product.insertMany(products);
    console.log('✅ Produtos cadastrados com sucesso!');

    process.exit();
  } catch (error) {
    console.error('❌ Erro ao cadastrar produtos:', error.message);
    process.exit(1);
  }
};

seedProducts();
