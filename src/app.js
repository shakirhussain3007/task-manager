const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const taskRoutes = require('./routes/tasks');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  if (config.env !== 'test') app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
  app.use('/api/tasks', taskRoutes);
  app.use('/api', notFound);

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
