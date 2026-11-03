const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { seedInitialData } = require('./seedData');

const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const StoreSettings = require('../models/storeSettings');
const Notification = require('../models/notification');

let mongoMemoryServer = null;

async function startEmbeddedMongo() {
  console.log('🔄 Inicializando servidor MongoDB local persistente (Modo Autônomo)...');
  const dbDir = path.join(__dirname, '../../../.db_data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  mongoMemoryServer = await MongoMemoryServer.create({
    instance: {
      dbPath: dbDir,
      storageEngine: 'wiredTiger'
    }
  });

  const uri = mongoMemoryServer.getUri();
  console.log(`🚀 MongoDB local ativo na porta interna: ${uri}`);
  return uri;
}

async function connectDB() {
  const remoteUri = process.env.MONGODB_URI;
  let connected = false;

  // 1. Tentar conectar ao MongoDB Remoto (Atlas) se fornecido
  if (remoteUri && !remoteUri.includes('cluster_invalido')) {
    try {
      console.log('Tentando conectar ao MongoDB Remoto...');
      await mongoose.connect(remoteUri, {
        serverSelectionTimeoutMS: 3500 // Timeout rápido para não travar a inicialização
      });
      console.log('✅ Conectado com sucesso ao MongoDB Remoto (Atlas)!');
      connected = true;
    } catch (err) {
      console.warn('⚠️ Falha ao conectar ao cluster remoto do MongoDB Atlas (pode estar pausado ou offline).');
      console.warn(`Motivo: ${err.message}`);
    }
  }

  // 2. Se falhar ou não tiver MONGODB_URI, usar fallback embutido persistente
  if (!connected) {
    try {
      const localUri = await startEmbeddedMongo();
      await mongoose.connect(localUri);
      console.log('✅ Conectado com sucesso ao MongoDB Local Persistente!');
      connected = true;
    } catch (err) {
      console.error('❌ Erro crítico ao iniciar MongoDB local:', err);
    }
  }

  if (connected) {
    mongoose.connection.on('error', (err) => console.error('Erro de conexão MongoDB:', err));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB desconectado'));

    // 3. Executar auto-seed idempotente (admin, produtos, configurações e pedidos de exemplo)
    await seedInitialData({ User, Product, Order, StoreSettings, Notification });
  } else {
    console.error('AVISO: Operando em modo sem banco. Recursos transacionais estarão indisponíveis.');
  }
}

// Limpeza elegante ao encerrar o processo (Ctrl+C)
process.on('SIGINT', async () => {
  if (mongoMemoryServer) {
    console.log('Parando servidor MongoDB embutido...');
    await mongoMemoryServer.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
  process.exit(0);
});

module.exports = connectDB;
