const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI || 'mongodb+srv://pedro:12345@cluster0.7euduan.mongodb.net/?appName=Cluster0';

console.log('Tentando conectar ao MongoDB...');
console.log('URI:', uri.replace(/:([^@]+)@/, ':****@')); // Hide password in logs

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Conexão bem-sucedida!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro de conexão detalhado:');
    console.error(err);
    process.exit(1);
  });
