const cloudinary = require('../config/cloudinary');
const env = require('../config/environment');
const { AppError, MENSAJES } = require('../utils/errorMessages');

const FOLDER_BASE = 'stoessel-crm';

const assertConfigured = () => {
  if (!env.cloudinary.configured) throw new AppError(MENSAJES.CLOUDINARY_NO_CONFIGURADO, 503);
};

/**
 * Sube un buffer (multer memoryStorage) a Cloudinary.
 * @returns {Promise<{url: string, public_id: string, width: number, height: number}>}
 */
const uploadBuffer = (buffer, { folder = 'propiedades' } = {}) => {
  assertConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${FOLDER_BASE}/${folder}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => {
        if (err) return reject(new AppError(`Error subiendo a Cloudinary: ${err.message}`, 502));
        return resolve({
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
};

const uploadMany = (files, opts) => Promise.all(files.map((f) => uploadBuffer(f.buffer, opts)));

const destroy = async (publicId) => {
  assertConfigured();
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('⚠️  No se pudo eliminar de Cloudinary:', publicId, err.message);
  }
};

module.exports = { uploadBuffer, uploadMany, destroy };
