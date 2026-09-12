const Cliente = require('../models/Cliente');
const { notFound } = require('../utils/errorMessages');
const auditoria = require('./auditoriaService');

const listar = (filters, pagination) => Cliente.findAll(filters, pagination);

const obtener = async (id) => {
  const c = await Cliente.findById(id);
  if (!c) throw notFound('Cliente');
  return c;
};

const obtenerConHistorial = async (id) => {
  const cliente = await obtener(id);
  const historial = await Cliente.findHistorial(id);
  return { ...cliente, historial };
};

const crear = async (data, actor) => {
  const nuevo = await Cliente.create(data);
  auditoria.registrar(actor, auditoria.ACCIONES.CREATE, 'clientes', nuevo.id, `Alta de cliente "${nuevo.nombre}"`);
  return nuevo;
};

const actualizar = async (id, data, actor) => {
  const anterior = await obtener(id);
  const actualizado = await Cliente.update(id, data);
  auditoria.registrar(actor, auditoria.ACCIONES.UPDATE, 'clientes', id, `"${anterior.nombre}": ${auditoria.describirCambios(anterior, data)}`);
  return actualizado;
};

const eliminar = async (id, actor) => {
  const cliente = await obtener(id);
  await Cliente.remove(id);
  auditoria.registrar(actor, auditoria.ACCIONES.DELETE, 'clientes', id, `Baja de cliente "${cliente.nombre}"`);
  return true;
};

module.exports = { listar, obtener, obtenerConHistorial, crear, actualizar, eliminar };
