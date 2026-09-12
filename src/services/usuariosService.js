const Usuario = require('../models/Usuario');
const { hashPassword } = require('../utils/hashPassword');
const { notFound, conflict, badRequest, MENSAJES } = require('../utils/errorMessages');
const auditoria = require('./auditoriaService');

const listar = (filters, pagination) => Usuario.findAll(filters, pagination);

const obtener = async (id) => {
  const u = await Usuario.findById(id);
  if (!u) throw notFound('Usuario');
  return u;
};

const crear = async (data, actor) => {
  const existente = await Usuario.findByEmailWithPassword(data.email);
  if (existente) throw conflict(MENSAJES.EMAIL_EN_USO);
  const { password, ...rest } = data;
  const nuevo = await Usuario.create({ ...rest, password_hash: await hashPassword(password) });
  auditoria.registrar(actor, auditoria.ACCIONES.CREATE, 'usuarios', nuevo.id, `Alta de usuario ${nuevo.email} (${nuevo.rol})`);
  return nuevo;
};

const actualizar = async (id, data, actor) => {
  const anterior = await obtener(id);
  const { password, ...rest } = data;

  if (rest.email && rest.email !== anterior.email) {
    const existente = await Usuario.findByEmailWithPassword(rest.email);
    if (existente) throw conflict(MENSAJES.EMAIL_EN_USO);
  }

  // Evitar dejar el sistema sin administradores activos
  const degrada = (rest.rol && rest.rol !== 'admin') || (rest.estado && rest.estado !== 'activo');
  if (anterior.rol === 'admin' && anterior.estado === 'activo' && degrada) {
    if ((await Usuario.countAdminsActivos()) <= 1) throw badRequest('No se puede degradar o desactivar al único administrador activo.');
  }

  const cambios = { ...rest };
  if (password) cambios.password_hash = await hashPassword(password);
  const actualizado = await Usuario.update(id, cambios);
  auditoria.registrar(actor, auditoria.ACCIONES.UPDATE, 'usuarios', id, auditoria.describirCambios(anterior, { ...rest, ...(password ? { password: '(cambiada)' } : {}) }));
  return actualizado;
};

const eliminar = async (id, actor) => {
  const usuario = await obtener(id);
  if (actor && actor.id === id) throw badRequest('No podés eliminar tu propio usuario.');
  if (usuario.rol === 'admin' && usuario.estado === 'activo' && (await Usuario.countAdminsActivos()) <= 1) {
    throw badRequest('No se puede eliminar al único administrador activo.');
  }
  await Usuario.remove(id);
  auditoria.registrar(actor, auditoria.ACCIONES.DELETE, 'usuarios', id, `Baja de usuario ${usuario.email}`);
  return true;
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
