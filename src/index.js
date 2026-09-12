const env = require('./config/environment');
const app = require('./app');
const { testConnection, pool } = require('./config/database');

const start = async () => {
  try {
    const now = await testConnection();
    console.log(`🗄️  PostgreSQL conectada (${env.db.url ? 'DATABASE_URL' : `${env.db.host}:${env.db.port}/${env.db.name}`}) - ${now}`);
  } catch (err) {
    console.error('❌ No se pudo conectar a PostgreSQL:', err.message);
    console.error('   ¿Levantaste la base? -> docker-compose up -d');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`🚀 CRM Stoessel backend escuchando en http://localhost:${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} recibido, cerrando...`);
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();
