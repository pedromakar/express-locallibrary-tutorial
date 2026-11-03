const bcrypt = require('bcryptjs');

const products = [
  {
    name: 'Camiseta Oversized Hunter',
    category: 'Camisetas',
    price: 149.9,
    description: 'Camiseta Oversized Hunter que combina conforto absoluto com estilo. Tecido de alta performance permite movimento livre durante treinos intensos e uso casual. Design amplo oferece liberdade total de movimento sem comprometer a qualidade.',
    images: [
      'https://usealphaco.com.br/cdn/shop/files/CamisetaOversizedHunterAzulMarinho-Frente.jpg?v=1784043294&width=832',
      'https://usealphaco.com.br/cdn/shop/files/Camiseta_Oversized_Hunter_Azul_Marinho_Oversized_07jul26_Fc_8.jpg?v=1784315506&width=832',
      'https://usealphaco.com.br/cdn/shop/files/Camiseta_Oversized_Hunter_Azul_Marinho_Oversized_07jul26_Fc_6.jpg?v=1784315508&width=832',
      'https://usealphaco.com.br/cdn/shop/files/CamisetaOversizedHunterAzulMarinho-Costas.jpg?v=1784043294&width=832'
    ],
    countInStock: 25,
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      {
        name: 'Azul Marinho',
        hex: '#000080',
        images: [
          'https://usealphaco.com.br/cdn/shop/files/CamisetaOversizedHunterAzulMarinho-Frente.jpg?v=1784043294&width=832',
          'https://usealphaco.com.br/cdn/shop/files/Camiseta_Oversized_Hunter_Azul_Marinho_Oversized_07jul26_Fc_8.jpg?v=1784315506&width=832'
        ]
      },
      {
        name: 'Verde Musgo',
        hex: '#4A5D23',
        images: [
          'https://usealphaco.com.br/cdn/shop/files/CamisetaOversizedHunterVerdeMusgo-Frente.jpg?v=1784044429&width=832'
        ]
      }
    ],
    benefits: ['Conforto Absoluto', 'Alta Performance', 'Design Amplo', 'Versatilidade'],
    rating: 4.9,
    numReviews: 3,
    reviews: [
      {
        name: 'Lucas Moreira',
        rating: 5,
        comment: 'Caimento boxy perfeito! O tecido é encorpado, muito confortável e aguenta treinos pesados sem deformar.',
        createdAt: new Date('2026-10-15')
      },
      {
        name: 'Matheus Silva',
        rating: 5,
        comment: 'Camiseta de altíssimo nível. A cor azul marinho é linda demais pessoalmente.',
        createdAt: new Date('2026-10-20')
      },
      {
        name: 'Felipe Antunes',
        rating: 4.8,
        comment: 'Excelente qualidade e acabamento das costuras. Recomendo comprar o tamanho normal para caimento oversized.',
        createdAt: new Date('2026-10-25')
      }
    ]
  },
  {
    name: 'Camiseta Apex Dry Evolution',
    category: 'Camisetas',
    price: 149.9,
    description: 'Camiseta premium de alta performance com tecnologia sem costura e secagem ultra-rápida. Design anatômico para treinos de alta intensidade.',
    images: [
      'https://usealphaco.com.br/cdn/shop/files/CamisetaApexDryEvolutionCinza.jpg?v=1775050205&width=832',
      'https://usealphaco.com.br/cdn/shop/files/Camiseta_Apex_Dry_Evolution_Cinza_Sem_Costura_Apex_04abr26_Fc_5.jpg?v=1775050205&width=832',
      'https://usealphaco.com.br/cdn/shop/files/Camiseta_Apex_Dry_Evolution_Cinza_Sem_Costura_Apex_04abr26_Fc.jpg?v=1775050205&width=832'
    ],
    countInStock: 25,
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      {
        name: 'Cinza',
        hex: '#808080',
        images: [
          'https://usealphaco.com.br/cdn/shop/files/CamisetaApexDryEvolutionCinza.jpg?v=1775050205&width=832'
        ]
      },
      {
        name: 'Azul Marinho',
        hex: '#000080',
        images: [
          'https://usealphaco.com.br/cdn/shop/files/Camiseta_Apex_Dry_Evolution_Marinho_Sem_Costura_Apex_04abr26_Fc.jpg?v=1775050157&width=832'
        ]
      }
    ],
    benefits: ['Sem Costura (Seamless)', 'Tecnologia Dry', 'Modelagem Anatômica', 'Secagem Rápida'],
    rating: 5.0,
    numReviews: 2,
    reviews: [
      {
        name: 'Carlos Eduardo',
        rating: 5,
        comment: 'Tecnologia sem costura é surreal! Não assa nem incomoda durante o cardio intenso.',
        createdAt: new Date('2026-10-18')
      },
      {
        name: 'Bruno Ramos',
        rating: 5,
        comment: 'Seca muito rápido e o tecido é super leve. Comprarei mais cores com certeza.',
        createdAt: new Date('2026-10-22')
      }
    ]
  },
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
  }
];

const defaultSettings = {
  storeName: 'MD ESSENTIAL',
  logoUrl: '',
  announcementText: 'FRETE GRÁTIS ACIMA DE R$ 198 · 10% CASHBACK NA PRIMEIRA COMPRA',
  heroEyebrow: 'Coleção Apex Pro - A Melhor do Brasil',
  heroTitle: 'O INVERNO É O NOSSO PONTO ZERO',
  heroSubtitle: 'Alta performance e isolamento térmico inteligente. Desenvolvido para superar o frio com atitude.',
  heroButtonText: 'VER COLEÇÃO',
  heroBannerUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=80',
  categoryImages: {
    'Camisetas': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    'Regatas': 'https://images.unsplash.com/photo-1583454110551-21f2fa200181?auto=format&fit=crop&w=800&q=80',
    'Shorts': 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?auto=format&fit=crop&w=800&q=80',
    'Feminino': 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
    'Casacos': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80'
  }
};

async function seedInitialData(models) {
  const { User, Product, Order, StoreSettings, Notification } = models;

  try {
    // 1. Admin User
    const adminUsername = process.env.ADMIN_USER?.trim().toLowerCase() || 'pedro';
    const adminPassword = process.env.ADMIN_PASS || '12345';
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'pedromakardomingos@gmail.com';

    let adminUser = await User.findOne({
      $or: [{ username: adminUsername }, { email: adminEmail }],
    });

    if (!adminUser) {
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await User.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
      });
      console.log(`✅ Admin padrão criado: ${adminUsername} (${adminEmail})`);
    }

    // 2. Sample Client User
    let clientUser = await User.findOne({ username: 'cliente' });
    if (!clientUser) {
      const hashedClientPassword = await bcrypt.hash('12345', 10);
      clientUser = await User.create({
        username: 'cliente',
        email: 'cliente@mdessential.com',
        password: hashedClientPassword,
        role: 'user',
        phone: '(48) 99876-5432',
        cpf: '123.456.789-00',
        addresses: [
          {
            street: 'Av. Nereu Ramos',
            number: '1250',
            complement: 'Apto 204',
            neighborhood: 'Centro',
            city: 'Sombrio',
            state: 'SC',
            cep: '88960-000',
            isDefault: true
          }
        ],
        marketingPreferences: {
          emailPromo: true,
          smsPromo: true,
          whatsappPromo: true,
          postPromo: false
        }
      });
      console.log('✅ Usuário cliente de testes criado: cliente (cliente@mdessential.com / senha: 12345)');
    }

    // 3. Store Settings
    const existingSettings = await StoreSettings.findOne();
    if (!existingSettings) {
      await StoreSettings.create(defaultSettings);
      console.log('✅ Configurações visuais padrão da loja criadas.');
    }

    // 4. Products
    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      await Product.insertMany(products);
      console.log(`✅ Catálogo MD Essential carregado com ${products.length} produtos.`);
    }

    // 5. Sample Orders (for Charts, Dashboard & Account history)
    const orderCount = await Order.countDocuments();
    if (orderCount === 0 && clientUser) {
      const allProds = await Product.find().lean();
      if (allProds.length >= 3) {
        const p1 = allProds[0];
        const p2 = allProds[1];
        const p3 = allProds[2];

        const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        await Order.create([
          {
            user: clientUser._id,
            items: [
              { productId: p1._id, name: p1.name, price: p1.price, quantity: 2, size: 'M', color: 'Azul Marinho' }
            ],
            totalPrice: p1.price * 2,
            status: 'delivered',
            paymentMethod: 'PIX',
            shippingMethod: 'SEDEX',
            shippingPrice: 0,
            trackingCode: 'MD982347120BR',
            createdAt: daysAgo(12)
          },
          {
            user: clientUser._id,
            items: [
              { productId: p2._id, name: p2.name, price: p2.price, quantity: 1, size: 'G', color: 'Cinza' }
            ],
            totalPrice: p2.price,
            status: 'shipped',
            paymentMethod: 'Cartão de Crédito',
            shippingMethod: 'PAC',
            shippingPrice: 22,
            trackingCode: 'MD871234981BR',
            createdAt: daysAgo(4)
          },
          {
            user: clientUser._id,
            items: [
              { productId: p3._id, name: p3.name, price: p3.price, quantity: 1, size: 'M', color: 'Preto' }
            ],
            totalPrice: p3.price,
            status: 'paid',
            paymentMethod: 'PIX',
            shippingMethod: 'Frete Grátis',
            shippingPrice: 0,
            pixCode: '00020126330014br.gov.bcb.pix01MDEssential12345',
            createdAt: daysAgo(1)
          },
          {
            user: clientUser._id,
            items: [
              { productId: p1._id, name: p1.name, price: p1.price, quantity: 1, size: 'P', color: 'Verde Musgo' }
            ],
            totalPrice: p1.price,
            status: 'pending',
            paymentMethod: 'PIX',
            shippingMethod: 'PAC',
            shippingPrice: 22,
            pixCode: '00020126330014br.gov.bcb.pix01MDEssential56789',
            createdAt: new Date()
          }
        ]);
        console.log('✅ Pedidos de exemplo criados para popular o Dashboard e Histórico de Compras.');
      }
    }

    // 6. Abandoned Cart for Client User
    if (clientUser && (!clientUser.cart || clientUser.cart.length === 0)) {
      const allProds = await Product.find().lean();
      if (allProds.length > 0) {
        clientUser.cart = [
          {
            product: allProds[0]._id,
            quantity: 1,
            size: 'M',
            color: 'Azul Marinho'
          }
        ];
        clientUser.lastLogin = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago -> abandoned
        await clientUser.save();
        console.log('✅ Carrinho abandonado de exemplo configurado para visualização no Admin.');
      }
    }

    // 7. Initial Notifications
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      await Notification.create([
        {
          type: 'new_order',
          title: 'Novo pedido recebido',
          message: 'Pedido #A1B2C3 — R$ 299,80 via PIX',
          read: false
        },
        {
          type: 'low_stock',
          title: 'Estoque baixo',
          message: 'Moletom "Heavy Bulk Core" possui apenas 20 unidades.',
          read: false
        }
      ]);
      console.log('✅ Notificações administrativas iniciais criadas.');
    }

  } catch (err) {
    console.error('Erro durante carga inicial de dados:', err);
  }
}

module.exports = {
  products,
  defaultSettings,
  seedInitialData
};
