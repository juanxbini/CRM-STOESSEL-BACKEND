const { query } = require('../config/database');

const Configuracion = {
  async getAll() {
    const { rows } = await query('SELECT clave, valor FROM configuracion ORDER BY clave');
    return rows.reduce((acc, r) => ({ ...acc, [r.clave]: r.valor }), {});
  },

  async setMany(entries) {
    for (const [clave, valor] of Object.entries(entries)) {
      await query(
        'INSERT INTO configuracion (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor',
        [clave, valor == null ? null : String(valor)]
      );
    }
    return Configuracion.getAll();
  },
};

module.exports = Configuracion;
