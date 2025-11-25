import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import Hormonal from '../models/Hormonal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const run = async () => {
  await connectDB();
  const registros = await Hormonal.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  console.log(JSON.stringify(registros, null, 2));
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

