const env = require('./environment');

module.exports = {
  secret: env.jwt.secret,
  refreshSecret: env.jwt.refreshSecret,
  expire: env.jwt.expire,
  refreshExpire: env.jwt.refreshExpire,
  issuer: 'crm-stoessel',
};
