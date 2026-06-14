const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('./src/models/product');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '.env') });

const products = [
  {
    name: 'Regata Canelada "Apex Cut"',
    category: 'Regatas',
    price: 99.9,
    description: 'Ajuste anatômico que valoriza o shape. Tecido canelado premium de alta elasticidade, desenvolvido para máxima performance e conforto durante o treino.',
    images: [
      'https://images.unsplash.com/photo-1598971639058-9997c0d73d0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 50,
    badge: 'BEST SELLER',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Cinza', hex: '#808080' }
    ],
    benefits: ['Tecido Canelado Premium', 'Alta Compressão', 'Secagem Ultra Rápida', 'Costuras Reforçadas']
  },
  {
    name: 'Oversized T-shirt "Street Pump"',
    category: 'Camisetas',
    price: 149.9,
    description: 'Modelagem boxy moderna com ombros caídos. Algodão premium de alta gramatura que mantém a estrutura mesmo após várias lavagens.',
    images: [
      'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 40,
    badge: 'DROP',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Off White', hex: '#FAF9F6' }
    ],
    benefits: ['100% Algodão 200 GSM', 'Modelagem Boxy', 'Toque Macio', 'Estampa Minimalista']
  },
  {
    name: 'Shorts "Velocity Mesh"',
    category: 'Shorts',
    price: 129.9,
    description: 'Tecido mesh respirável com forro interno de compressão. Projetado para oferecer liberdade total de movimento e suporte.',
    images: [
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 35,
    badge: 'NOVO',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Azul Navy', hex: '#000080' }
    ],
    benefits: ['Mesh Respirável', 'Forro de Compressão', 'Bolsos Laterais', 'Cós Ajustável']
  },
  {
    name: 'Moletom "Heavy Bulk Core"',
    category: 'Casacos',
    price: 299.9,
    description: 'Estrutura pesada (3F) e capuz estruturado. Perfeito para o pré e pós treino, oferecendo aquecimento e estilo impecáveis.',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 20,
    badge: 'DROP',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Cinza Mescla', hex: '#BEBEBE' }
    ],
    benefits: ['Algodão 3 Cabos Heavy', 'Capuz Estruturado', 'Bolsos Canguru', 'Corte Premium']
  },
  {
    name: 'Legging "CoreFlex"',
    category: 'Feminino',
    price: 179.9,
    description: 'Cintura alta e zero transparência. Desenvolvida com tecnologia de alta performance para treinos intensos de agachamento.',
    images: [
      'https://images.unsplash.com/photo-1594737625785-c2d0b7d0e3a7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 60,
    badge: 'BEST SELLER',
    sizes: ['P', 'M', 'G'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Vinho', hex: '#722F37' }
    ],
    benefits: ['Zero Transparência', 'Cintura Alta Modeladora', 'Suporte Muscular', 'Bolso Invisível']
  },
  {
    name: 'Cropped "Alpha Cut Women"',
    category: 'Feminino',
    price: 89.9,
    description: 'Corte moderno que valoriza a silhueta. Tecido leve com tecnologia Dry que absorve o suor e mantém a temperatura ideal.',
    images: [
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=800&q=80'
    ],
    countInStock: 45,
    badge: 'NOVO',
    sizes: ['P', 'M', 'G'],
    colors: [
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Preto', hex: '#000000' },
      { name: 'Lilás', hex: '#C8A2C8' }
    ],
    benefits: ['Tecido Tecnologia Dry', 'Corte Alpha', 'Proteção UV', 'Antiodor']
  },
];

const seedProducts = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error('MONGODB_URI not found in .env');

    console.log('Conectando ao MongoDB...');
    await mongoose.connect(mongoURI);

    await Product.deleteMany({});
    console.log('Produtos antigos removidos.');

    await Product.insertMany(products);
    console.log('✅ Base premium cadastrada com sucesso!');

    process.exit();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
};

seedProducts();
