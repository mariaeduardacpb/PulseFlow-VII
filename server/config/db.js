import mongoose from 'mongoose';
import { CONFIG } from './ports.js';

const connectDB = async () => {
  try {
    if (!CONFIG.MONGO_URI) {
      throw new Error('MONGO_URI não está definida nas variáveis de ambiente. Verifique o arquivo .env na raiz do projeto.');
    }
    
    await mongoose.connect(CONFIG.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('Conectado ao MongoDB com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
