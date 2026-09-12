/**
 * Ejecuta init.sql (y seeds.sql) contra la base configurada en .env / DATABASE_URL.
 * Útil para Railway o cualquier Postgres que no sea el contenedor local.
 *
 *   npm run db:init          -> init.sql + seeds.sql
 *   npm run db:seed          -> solo seeds.sql
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

const seedOnly = process.argv.includes('--seed-only');
const sqlDir = path.join(__dirname, '..', 'src', 'sql');

const run = async () => {
  const files = seedOnly ? ['seeds.sql'] : ['init.sql', 'seeds.sql'];
  for (const file of files) {
    const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
    process.stdout.write(`▶ Ejecutando ${file}... `);
    await pool.query(sql);
    console.log('OK');
  }
  await pool.end();
  console.log('✅ Base de datos lista.');
};

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
