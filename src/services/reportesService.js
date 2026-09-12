const { query } = require('../config/database');
const Interaccion = require('../models/Interaccion');
const Lead = require('../models/Lead');

const rangoFechas = ({ desde, hasta }) => {
  const d = desde || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const h = hasta || new Date().toISOString().slice(0, 10);
  return { desde: d, hasta: h };
};

/** KPIs generales para el dashboard. */
const dashboard = async () => {
  const [{ rows: props }, { rows: totales }, { rows: mes }, { rows: comisiones }] = await Promise.all([
    query(`SELECT estado, COUNT(*)::int AS cantidad FROM propiedades GROUP BY estado`),
    query(`
      SELECT
        (SELECT COUNT(*)::int FROM propietarios WHERE estado = 'activo') AS propietarios,
        (SELECT COUNT(*)::int FROM clientes_compra) AS clientes,
        (SELECT COUNT(*)::int FROM posibles_propietarios WHERE estado IN ('contactado','interesado')) AS leads_abiertos,
        (SELECT COUNT(*)::int FROM usuarios WHERE estado = 'activo') AS usuarios_activos`),
    query(`
      SELECT
        COUNT(*) FILTER (WHERE estado = 'vendida')::int AS vendidas_mes,
        COUNT(*) FILTER (WHERE estado = 'alquilada')::int AS alquiladas_mes,
        COALESCE(SUM(precio_venta) FILTER (WHERE estado = 'vendida'), 0)::float AS monto_ventas_mes
      FROM propiedades
      WHERE fecha_operacion >= date_trunc('month', CURRENT_DATE)`),
    query(`
      SELECT
        COALESCE(SUM(CASE WHEN estado = 'vendida' THEN precio_venta ELSE precio_alquiler END * comision_porcentaje / 100) FILTER (WHERE comision_estado = 'pendiente'), 0)::float AS pendientes,
        COALESCE(SUM(CASE WHEN estado = 'vendida' THEN precio_venta ELSE precio_alquiler END * comision_porcentaje / 100) FILTER (WHERE comision_estado = 'pagada'), 0)::float AS pagadas
      FROM propiedades WHERE estado IN ('vendida','alquilada')`),
  ]);

  const porEstado = { disponible: 0, vendida: 0, alquilada: 0, en_tramite: 0 };
  props.forEach((r) => { porEstado[r.estado] = r.cantidad; });

  const [ultimasInteracciones, proximosSeguimientos] = await Promise.all([
    Interaccion.ultimas(8),
    Lead.proximosSeguimientos(7, 8),
  ]);

  return {
    propiedades: { total: Object.values(porEstado).reduce((a, b) => a + b, 0), ...porEstado },
    ...totales[0],
    mes_actual: mes[0],
    comisiones: comisiones[0],
    ultimas_interacciones: ultimasInteracciones,
    proximos_seguimientos: proximosSeguimientos,
  };
};

/** Operaciones cerradas (ventas / alquileres) por período, agrupadas por mes. */
const ventas = async (params = {}) => {
  const { desde, hasta } = rangoFechas(params);
  const { rows: porMes } = await query(
    `SELECT to_char(date_trunc('month', fecha_operacion), 'YYYY-MM') AS mes,
            COUNT(*) FILTER (WHERE estado = 'vendida')::int AS ventas,
            COUNT(*) FILTER (WHERE estado = 'alquilada')::int AS alquileres,
            COALESCE(SUM(precio_venta) FILTER (WHERE estado = 'vendida'), 0)::float AS monto_ventas,
            COALESCE(SUM(precio_alquiler) FILTER (WHERE estado = 'alquilada'), 0)::float AS monto_alquileres
     FROM propiedades
     WHERE estado IN ('vendida','alquilada') AND fecha_operacion BETWEEN $1 AND $2
     GROUP BY 1 ORDER BY 1`,
    [desde, hasta]
  );
  const { rows: detalle } = await query(
    `SELECT pr.id, pr.direccion, pr.zona, pr.tipo, pr.estado, pr.precio_venta, pr.precio_alquiler, pr.fecha_operacion,
            pr.comision_porcentaje, pr.comision_estado, po.nombre AS propietario_nombre, u.nombre AS usuario_nombre
     FROM propiedades pr
     JOIN propietarios po ON po.id = pr.propietario_id
     LEFT JOIN usuarios u ON u.id = pr.usuario_id
     WHERE pr.estado IN ('vendida','alquilada') AND pr.fecha_operacion BETWEEN $1 AND $2
     ORDER BY pr.fecha_operacion DESC`,
    [desde, hasta]
  );
  const totales = porMes.reduce(
    (acc, r) => ({
      ventas: acc.ventas + r.ventas,
      alquileres: acc.alquileres + r.alquileres,
      monto_ventas: acc.monto_ventas + r.monto_ventas,
      monto_alquileres: acc.monto_alquileres + r.monto_alquileres,
    }),
    { ventas: 0, alquileres: 0, monto_ventas: 0, monto_alquileres: 0 }
  );
  return { periodo: { desde, hasta }, por_mes: porMes, detalle, totales };
};

/** Comisiones pendientes / pagadas (calculadas sobre precio × porcentaje). */
const comisiones = async ({ estado } = {}) => {
  const { rows } = await query(
    `SELECT pr.id, pr.direccion, pr.zona, pr.estado, pr.fecha_operacion, pr.comision_porcentaje, pr.comision_estado,
            CASE WHEN pr.estado = 'vendida' THEN pr.precio_venta ELSE pr.precio_alquiler END AS base,
            (CASE WHEN pr.estado = 'vendida' THEN pr.precio_venta ELSE pr.precio_alquiler END * pr.comision_porcentaje / 100)::float AS comision,
            u.nombre AS usuario_nombre
     FROM propiedades pr LEFT JOIN usuarios u ON u.id = pr.usuario_id
     WHERE pr.estado IN ('vendida','alquilada') AND pr.comision_estado IS NOT NULL
       ${estado ? 'AND pr.comision_estado = $1' : ''}
     ORDER BY pr.comision_estado ASC, pr.fecha_operacion DESC`,
    estado ? [estado] : []
  );
  const sum = (e) => rows.filter((r) => r.comision_estado === e).reduce((a, r) => a + (r.comision || 0), 0);
  return { detalle: rows, totales: { pendientes: sum('pendiente'), pagadas: sum('pagada') } };
};

/** Estadísticas por zona. */
const porZona = async () => {
  const { rows } = await query(
    `SELECT COALESCE(zona, 'Sin zona') AS zona,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE estado = 'disponible')::int AS disponibles,
            COUNT(*) FILTER (WHERE estado = 'vendida')::int AS vendidas,
            COUNT(*) FILTER (WHERE estado = 'alquilada')::int AS alquiladas,
            COUNT(*) FILTER (WHERE estado = 'en_tramite')::int AS en_tramite,
            COALESCE(AVG(precio_venta), 0)::float AS precio_promedio,
            COALESCE(AVG(precio_venta / NULLIF(m2_construidos, 0)), 0)::float AS precio_m2_promedio
     FROM propiedades GROUP BY 1 ORDER BY total DESC, zona`
  );
  return rows;
};

module.exports = { dashboard, ventas, comisiones, porZona };
