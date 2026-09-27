import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/edugenie',
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
};

if (!config.geminiApiKey) {
  console.error('❌ GEMINI_API_KEY is required. Set it in your .env file.');
  process.exit(1);
}
