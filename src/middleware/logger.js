const morgan = require('morgan');
const env = require('../config/environment');

// Agrega el usuario autenticado al log (si existe).
morgan.token('user', (req) => (req.user ? `${req.user.email}(${req.user.rol})` : 'anon'));

const format = env.isProduction
  ? ':remote-addr :method :url :status :res[content-length] - :response-time ms :user'
  : ':method :url :status :response-time ms - :user';

const logger = morgan(format, {
  skip: (req) => req.originalUrl === '/api/health',
});

module.exports = logger;
