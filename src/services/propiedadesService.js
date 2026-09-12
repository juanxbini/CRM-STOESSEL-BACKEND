const Propiedad = require('../models/Propiedad');
const Propietario = require('../models/Propietario');
const { notFound, badRequest } = require('../utils/errorMessages');
const auditoria = require('./auditoriaService');
const cloudinaryService = require('./cloudinaryService');

const listar = (filters, pagination) => Propiedad.findAll(filters, pagination);

const obtener = async (id) => {
  const p = await Propiedad.findById(id);
  if (!p) throw notFound('Propiedad');
  return p;
};

const assertPropietario = async (propietarioId) => {
  if (propietarioId === undefined || propietarioId === null) return;
  const po = await Propietario.findById(propietarioId);
  if (!po) throw badRequest('El propietario indicado no existe.');
};

/** Si pasa a vendida/alquilada sin fecha de operación, la fija hoy y deja la comisión pendiente. */
const completarOperacion = (data, anterior = {}) => {
  const cerrada = ['vendida', 'alquilada'].includes(data.estado);
  if (cerrada && data.estado !== anterior.estado) {
    if (!data.fecha_operacion && !anterior.fecha_operacion) data.fecha_operacion = new Date().toISOString().slice(0, 10);
    if (!data.comision_estado && !anterior.comision_estado) data.comision_estado = 'pendiente';
  }
  return data;
};

const crear = async (data, actor) => {
  await assertPropietario(data.propietario_id);
  const nueva = await Propiedad.create(completarOperacion({ ...data, usuario_id: data.usuario_id || actor.id }));
  auditoria.registrar(actor, auditoria.ACCIONES.CREATE, 'propiedades', nueva.id, `Alta de propiedad "${nueva.direccion}" (${nueva.tipo}, ${nueva.zona || 'sin zona'})`);
  return nueva;
};

const actualizar = async (id, data, actor) => {
  const anterior = await obtener(id);
  await assertPropietario(data.propietario_id);
  const actualizada = await Propiedad.update(id, completarOperacion({ ...data }, anterior));
  auditoria.registrar(actor, auditoria.ACCIONES.UPDATE, 'propiedades', id, `"${anterior.direccion}": ${auditoria.describirCambios(anterior, data)}`);
  return actualizada;
};

const cambiarEstado = (id, estado, actor) => actualizar(id, { estado }, actor);

const eliminar = async (id, actor) => {
  const propiedad = await obtener(id);
  await Propiedad.remove(id);
  const fotos = Array.isArray(propiedad.fotos_cloudinary) ? propiedad.fotos_cloudinary : [];
  fotos.filter((f) => f.public_id).forEach((f) => cloudinaryService.destroy(f.public_id).catch(() => {}));
  auditoria.registrar(actor, auditoria.ACCIONES.DELETE, 'propiedades', id, `Baja de propiedad "${propiedad.direccion}"`);
  return true;
};

const subirFotos = async (id, files, actor) => {
  const propiedad = await obtener(id);
  if (!files || !files.length) throw badRequest('No se recibieron imágenes.');
  const subidas = await cloudinaryService.uploadMany(files, { folder: `propiedades/${id}` });
  const actuales = Array.isArray(propiedad.fotos_cloudinary) ? propiedad.fotos_cloudinary : [];
  const fotos = await Propiedad.setFotos(id, [...actuales, ...subidas]);
  auditoria.registrar(actor, auditoria.ACCIONES.UPLOAD, 'propiedades', id, `Subió ${subidas.length} foto(s) a "${propiedad.direccion}"`);
  return fotos;
};

const eliminarFoto = async (id, publicId, actor) => {
  const propiedad = await obtener(id);
  const actuales = Array.isArray(propiedad.fotos_cloudinary) ? propiedad.fotos_cloudinary : [];
  const foto = actuales.find((f) => f.public_id === publicId);
  if (!foto) throw notFound('Foto');
  await cloudinaryService.destroy(publicId);
  const fotos = await Propiedad.setFotos(id, actuales.filter((f) => f.public_id !== publicId));
  auditoria.registrar(actor, auditoria.ACCIONES.DELETE, 'propiedades', id, `Eliminó una foto de "${propiedad.direccion}"`);
  return fotos;
};

const zonas = () => Propiedad.zonas();

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, eliminar, subirFotos, eliminarFoto, zonas };
