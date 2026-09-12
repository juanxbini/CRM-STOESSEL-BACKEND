const Propietario = require('../models/Propietario');
const { notFound, conflict } = require('../utils/errorMessages');
const auditoria = require('./auditoriaService');

const listar = (filters, pagination) => Propietario.findAll(filters, pagination);

const obtener = async (id) => {
  const p = await Propietario.findById(id);
  if (!p) throw notFound('Propietario');
  return p;
};

const obtenerConPropiedades = async (id) => {
  const propietario = await obtener(id);
  const propiedades = await Propietario.findPropiedades(id);
  return { ...propietario, propiedades };
};

const crear = async (data, actor) => {
  const nuevo = await Propietario.create(data);
  auditoria.registrar(actor, auditoria.ACCIONES.CREATE, 'propietarios', nuevo.id, `Alta de propietario "${nuevo.nombre}"`);
  return nuevo;
};

const actualizar = async (id, data, actor) => {
  const anterior = await obtener(id);
  const actualizado = await Propietario.update(id, data);
  auditoria.registrar(actor, auditoria.ACCIONES.UPDATE, 'propietarios', id, `"${anterior.nombre}": ${auditoria.describirCambios(anterior, data)}`);
  return actualizado;
};

const eliminar = async (id, actor) => {
  const propietario = await obtener(id);
  const propiedades = await Propietario.findPropiedades(id);
  if (propiedades.length) throw conflict(`No se puede eliminar: el propietario tiene ${propiedades.length} propiedad(es) vinculada(s).`);
  await Propietario.remove(id);
  auditoria.registrar(actor, auditoria.ACCIONES.DELETE, 'propietarios', id, `Baja de propietario "${propietario.nombre}"`);
  return true;
};

module.exports = { listar, obtener, obtenerConPropiedades, crear, actualizar, eliminar };
