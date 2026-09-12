const auditoriaService = require('../services/auditoriaService');
const { parsePagination } = require('../utils/validators');
const { asyncHandler, ok } = require('../utils/asyncHandler');

const listar = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 50 });
  const { data, total } = await auditoriaService.listar(req.query, { limit, offset });
  ok(res, data, { page, limit, total });
});

module.exports = { listar };
