export const CONFIG = {
  // PORTAS
  BACKEND_PORT: process.env.PORT_BACKEND || 65432,
  FRONTEND_PORT: process.env.PORT_FRONTEND || 3000,
  MONGODB_PORT: process.env.PORT_MONGODB || 27017,
  
  // URLs
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:65432',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://pulseflow:projetointegrador@pulseflow.uesi5bb.mongodb.net/?retryWrites=true&w=majority&appName=PulseFlow',
  MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://pulseflow:projetointegrador@pulseflow.uesi5bb.mongodb.net/?retryWrites=true&w=majority&appName=PulseFlow',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'PulseFlowSuperSecretKey123',
  
  // EMAIL
  EMAIL_USER: process.env.EMAIL_USER || 'pulseflowsaude@gmail.com',
  EMAIL_PASS: process.env.EMAIL_PASS || 'gpoe ovit bjgs zesn',
  
  // AMBIENTE
  NODE_ENV: process.env.NODE_ENV || 'development'
};

export default CONFIG;
