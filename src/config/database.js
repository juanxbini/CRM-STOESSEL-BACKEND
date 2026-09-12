const { Pool } = require('pg');
const env = require('./environment');

const pool = env.db.url
  ? new Pool({
      connectionString: env.db.url,
      ssl: env.db.ssl || env.isProduction ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
      ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
    });

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL', err);
});

/**
 * Ejecuta una consulta parametrizada.
 * @param {string} text  SQL con placeholders $1, $2, ...
 * @param {Array} params
 */
const query = (text, params) => pool.query(text, params);

/**
 * Ejecuta un callback dentro de una transacción.
 * @param {(client: import('pg').PoolClient) => Promise<any>} fn
 */
const transaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const testConnection = async () => {
  const { rows } = await pool.query('SELECT NOW() AS now');
  return rows[0].now;
};

module.exports = { pool, query, transaction, testConnection };
