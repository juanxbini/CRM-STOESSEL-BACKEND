const Lead = require('../models/Lead');
const { transaction } = require('../config/database');
const { notFound, badRequest } = require('../utils/errorMessages');
const auditoria = require('./auditoriaService');

const listar = (filters, pagination) => Lead.findAll(filters, pagination);

const obtener = async (id) => {
  const l = await Lead.findById(id);
  if (!l) throw notFound('Lead');
  return l;
};

const crear = async (data, actor) => {
  const nuevo = await Lead.create({ ...data, usuario_id: data.usuario_id || actor.id });
  auditoria.registrar(actor, auditoria.ACCIONES.CREATE, 'leads', nuevo.id, `Alta de lead "${nuevo.nombre}"`);
  return nuevo;
};

const actualizar = async (id, data, actor) => {
  const anterior = await obtener(id);
  const actualizado = await Lead.update(id, data);
  auditoria.registrar(actor, auditoria.ACCIONES.UPDATE, 'leads', id, `"${anterior.nombre}": ${auditoria.describirCambios(anterior, data)}`);
  return actualizado;
};

const eliminar = async (id, actor) => {
  const lead = await obtener(id);
  await Lead.remove(id);
  auditoria.registrar(actor, auditoria.ACCIONES.DELETE, 'leads', id, `Baja de lead "${lead.nombre}"`);
  return true;
};

/**
 * Convierte un lead en propietario: crea el propietario con los datos del lead
 * (o los sobreescritos en `extra`) y marca el lead como convertido, todo en una transacción.
 */
const convertir = async (id, extra = {}, actor) => {
  const lead = await obtener(id);
  if (lead.estado === 'convertido') throw badRequest('El lead ya fue convertido a propietario.');

  const propietario = await transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO propietarios (nombre, telefono, email, ciudad, direccion, notas)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        extra.nombre || lead.nombre,
        extra.telefono || lead.telefono,
        extra.email || lead.email,
        extra.ciudad || lead.zona_interes,
        extra.direccion || null,
        extra.notas || (lead.motivacion ? `Origen: lead. Motivación: ${lead.motivacion}` : 'Origen: lead'),
      ]
    );
    await client.query(
      `UPDATE posibles_propietarios SET estado = 'convertido', propietario_id = $1 WHERE id = $2`,
      [rows[0].id, id]
    );
    return rows[0];
  });

  auditoria.registrar(actor, auditoria.ACCIONES.CONVERT, 'leads', id, `Lead "${lead.nombre}" convertido a propietario #${propietario.id}`);
  return { lead: await Lead.findById(id), propietario };
};

module.exports = { listar, obtener, crear, actualizar, eliminar, convertir };
