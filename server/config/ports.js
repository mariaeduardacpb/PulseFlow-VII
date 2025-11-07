import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

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

export default CONFIG;
