/**
 * Helpers para armar SQL dinámico de forma segura (siempre parametrizado).
 */

/** Arma "col1 = $1, col2 = $2" con los campos presentes en data. */
const buildSet = (data, startIndex = 1) => {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  const set = keys.map((k, i) => `${k} = $${startIndex + i}`).join(', ');
  const values = keys.map((k) => data[k]);
  return { set, values, count: keys.length };
};

/** Arma "INSERT INTO tabla (cols) VALUES ($1,...) RETURNING *". */
const buildInsert = (table, data) => {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  const cols = keys.join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map((k) => data[k]);
  return { text: `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`, values };
};

/**
 * Acumulador de condiciones WHERE parametrizadas.
 * const w = whereBuilder(); w.add('estado = ?', 'activo'); w.ilike('nombre', 'juan');
 * -> w.clause() = "WHERE estado = $1 AND nombre ILIKE $2", w.values = [...]
 */
const whereBuilder = () => {
  const conds = [];
  const values = [];
  const api = {
    values,
    add(cond, value) {
      if (value === undefined || value === null || value === '') return api;
      values.push(value);
      conds.push(cond.replace('?', `$${values.length}`));
      return api;
    },
    raw(cond) { conds.push(cond); return api; },
    ilike(col, value) { return api.add(`${col} ILIKE ?`, value ? `%${value}%` : undefined); },
    search(cols, value) {
      if (!value) return api;
      values.push(`%${value}%`);
      const idx = values.length;
      conds.push(`(${cols.map((c) => `${c} ILIKE $${idx}`).join(' OR ')})`);
      return api;
    },
    clause() { return conds.length ? `WHERE ${conds.join(' AND ')}` : ''; },
    nextIndex() { return values.length + 1; },
  };
  return api;
};

module.exports = { buildSet, buildInsert, whereBuilder };
