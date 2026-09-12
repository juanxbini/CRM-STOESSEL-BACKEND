const cloudinary = require('cloudinary').v2;
const env = require('./environment');

if (env.cloudinary.configured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
} else {
  console.warn('⚠️  Cloudinary no está configurado: el upload de fotos devolverá error 503 hasta cargar las credenciales.');
}

module.exports = cloudinary;
