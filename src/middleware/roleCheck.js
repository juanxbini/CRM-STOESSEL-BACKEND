const { forbidden, unauthorized } = require('../utils/errorMessages');

/**
 * Restringe el acceso a los roles indicados. Debe ir después de `auth`.
 * Uso: router.delete('/:id', auth, roleCheck('admin'), controller.eliminar)
 */
const roleCheck = (...roles) => (req, res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.rol)) return next(forbidden());
  return next();
};

const adminOnly = roleCheck('admin');

module.exports = roleCheck;
module.exports.adminOnly = adminOnly;
