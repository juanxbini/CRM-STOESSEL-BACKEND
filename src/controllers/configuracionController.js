const Configuracion = require('../models/Configuracion');
const { validate } = require('../utils/validators');
const { asyncHandler, ok } = require('../utils/asyncHandler');
const auditoria = require('../services/auditoriaService');

const SCHEMA = {
  nombre: { type: 'string', maxLength: 255 },
  telefono: { type: 'string', maxLength: 30 },
  email: { type: 'email' },
  direccion: { type: 'string', maxLength: 255 },
  comision_default: { type: 'number', min: 0, max: 100 },
};

const obtener = asyncHandler(async (req, res) => ok(res, await Configuracion.getAll()));

const actualizar = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA, { partial: true });
  const config = await Configuracion.setMany(data);
  auditoria.registrar(req.user, auditoria.ACCIONES.UPDATE, 'configuracion', null, `Datos de la inmobiliaria: ${Object.keys(data).join(', ')}`);
  ok(res, config);
});

module.exports = { obtener, actualizar };
