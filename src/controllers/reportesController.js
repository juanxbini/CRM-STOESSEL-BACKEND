const reportesService = require('../services/reportesService');
const { asyncHandler, ok } = require('../utils/asyncHandler');

const dashboard = asyncHandler(async (req, res) => ok(res, await reportesService.dashboard()));
const ventas = asyncHandler(async (req, res) => ok(res, await reportesService.ventas(req.query)));
const comisiones = asyncHandler(async (req, res) => ok(res, await reportesService.comisiones(req.query)));
const porZona = asyncHandler(async (req, res) => ok(res, await reportesService.porZona()));

module.exports = { dashboard, ventas, comisiones, porZona };
