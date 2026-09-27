import mongoose from 'mongoose';
import { config } from './config.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.warn('⚠️  Running without MongoDB - chat history will not be saved');
    // Don't exit — app can run without DB for pure chat
  }
};
