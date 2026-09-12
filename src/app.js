const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/environment');
const logger = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // Permite requests sin origin (curl, healthchecks) y los orígenes configurados.
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.get('/api/health', (req, res) => res.json({ ok: true, status: 'up', env: env.nodeEnv, timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/propiedades', require('./routes/propiedades'));
app.use('/api/propietarios', require('./routes/propietarios'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/interacciones', require('./routes/interacciones'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/auditoria', require('./routes/auditoria'));
app.use('/api/configuracion', require('./routes/configuracion'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
