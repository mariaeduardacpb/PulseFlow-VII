import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env do diretório server e da raiz do projeto
// __dirname aqui é server/config, então precisamos subir um nível para server/.env
const envPathServer = path.join(__dirname, '..', '.env');
const envPathRoot = path.join(__dirname, '..', '..', '.env');

// Tentar carregar do diretório server primeiro
const resultServer = dotenv.config({ path: envPathServer });
// Depois tentar da raiz do projeto (sobrescreve se existir)
const resultRoot = dotenv.config({ path: envPathRoot });

// Log para diagnóstico
if (resultRoot.error && resultServer.error) {
  console.warn('⚠️ Arquivo .env não encontrado em:', envPathServer);
  console.warn('⚠️ Arquivo .env não encontrado em:', envPathRoot);
} else {
  if (!resultRoot.error) {
    console.log('✅ Arquivo .env carregado de:', envPathRoot);
  } else if (!resultServer.error) {
    console.log('✅ Arquivo .env carregado de:', envPathServer);
  }
}

export const CONFIG = {
  BACKEND_PORT: process.env.PORT_BACKEND,
  FRONTEND_PORT: process.env.PORT_FRONTEND,
  MONGODB_PORT: process.env.PORT_MONGODB,
  API_BASE_URL: process.env.API_BASE_URL,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  NODE_ENV: process.env.NODE_ENV
};

// Log de debug para verificar se MONGO_URI foi carregada
if (!CONFIG.MONGO_URI) {
  console.warn('⚠️ MONGO_URI não encontrada nas variáveis de ambiente');
  console.warn('   Tentou carregar de:', envPathServer);
  console.warn('   Tentou carregar de:', envPathRoot);
}

export default CONFIG;
