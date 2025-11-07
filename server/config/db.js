import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CONFIG } from './ports.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(CONFIG.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('Conectado ao MongoDB com sucesso!');
    console.log(`MongoDB URI: ${CONFIG.MONGO_URI}`);
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
