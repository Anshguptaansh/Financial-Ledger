const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Creates a minimal Express app with shared middleware.
 * Used by each serverless function to avoid duplicating middleware setup.
 */
function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(mongoSanitize());

  return app;
}

module.exports = createApp;
