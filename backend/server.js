const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const loanRoutes = require('./routes/loans');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const creditRiskRoutes = require('./routes/creditRisk');

const app = express();

// ── Security Middleware ──────────────────────────────────────

// HTTP security headers (XSS protection, content sniffing, etc.)
app.use(helmet());

// CORS — restrict in production (set CORS_ORIGIN in .env)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parsing with size limit
app.use(express.json({ limit: '10mb' }));

// Prevent NoSQL injection attacks (strips $ and . from req.body/query/params)
app.use(mongoSanitize());

// ── Rate Limiting ────────────────────────────────────────────

// Global: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Auth: stricter — 10 login attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' },
});

// ── Routes ───────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/credit-risk', creditRiskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error.' });
});

// ── Start ────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

// Check for weak JWT secret
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 20) {
  console.warn('⚠️  WARNING: JWT_SECRET is weak or missing. Set a strong secret in .env for production!');
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔒 Security: Helmet, Rate Limiting, NoSQL Sanitize — enabled`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
