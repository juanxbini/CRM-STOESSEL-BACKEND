const Interaccion = require('../models/Interaccion');
const Propiedad = require('../models/Propiedad');
const Cliente = require('../models/Cliente');
const { notFound, badRequest } = require('../utils/errorMessages');
const auditoria = require('./auditoriaService');

const listar = (filters, pagination) => Interaccion.findAll(filters, pagination);

const obtener = async (id) => {
  const i = await Interaccion.findById(id);
  if (!i) throw notFound('Interacción');
  return i;
};

const crear = async (data, actor) => {
  const propiedad = await Propiedad.findById(data.propiedad_id);
  if (!propiedad) throw badRequest('La propiedad indicada no existe.');
  if (data.cliente_compra_id) {
    const cliente = await Cliente.findById(data.cliente_compra_id);
    if (!cliente) throw badRequest('El cliente indicado no existe.');
  }
  const nueva = await Interaccion.create({ ...data, usuario_id: actor.id });

  // Si el cliente visitó la propiedad y estaba solo "interesado", pasa a "visitó".
  if (data.tipo_interaccion === 'visita' && data.cliente_compra_id) {
    const cliente = await Cliente.findById(data.cliente_compra_id);
    if (cliente && cliente.estado === 'interesado') await Cliente.update(cliente.id, { estado: 'visito' });
  }

  auditoria.registrar(actor, auditoria.ACCIONES.CREATE, 'interacciones', nueva.id, `${data.tipo_interaccion} sobre "${propiedad.direccion}"${nueva.cliente_nombre ? ` con ${nueva.cliente_nombre}` : ''}`);
  return nueva;
};

module.exports = { listar, obtener, crear };
