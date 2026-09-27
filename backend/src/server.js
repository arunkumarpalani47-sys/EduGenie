import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/config.js';
import { connectDB } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { initKeepAlive } from './services/keepAlive.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();

// ─── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// ─── CORS (Supports Vercel Deployments + Localhost) ────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (mobile, curl, health-checks)
      if (!origin) return callback(null, true);
      // Allow Vercel apps, Render apps, and local dev
      if (
        origin === config.clientUrl ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again in a few minutes." },
  skip: (req) => req.originalUrl?.includes('/chat/stream'),
});

// High throughput limit specifically for AI stream endpoint
const streamLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 120,             // 120 requests per minute for rapid chatting
  message: { error: "Too many AI requests. Please wait a moment." },
});

app.use('/api', limiter);
app.use('/api/chat/stream', streamLimiter);

// ─── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EduGenie API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/chat', chatRoutes);

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`\n🚀 EduGenie Backend running on http://localhost:${config.port}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`🤖 Gemini Model: ${config.geminiModel}`);
    console.log(`🌐 Accepting requests from: ${config.clientUrl}\n`);
    initKeepAlive();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${config.port} is already in use by another running process.`);
      console.error(`💡 Tip: Close any other terminal window running node or edugenie.\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });

  // Handle nodemon restarts and terminations cleanly
  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.once('SIGUSR2', () => {
    server.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();

export default app;
