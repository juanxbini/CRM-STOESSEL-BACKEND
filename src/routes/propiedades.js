const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const ctrl = require('../controllers/propiedadesController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Solo se permiten imágenes JPG, PNG, WEBP o GIF.'));
  },
});

router.use(auth);

router.get('/zonas', ctrl.zonas);
router.get('/', ctrl.listar);
router.post('/', ctrl.crear);
router.get('/:id', ctrl.obtener);
router.put('/:id', ctrl.actualizar);
router.patch('/:id/estado', ctrl.cambiarEstado);
router.delete('/:id', adminOnly, ctrl.eliminar);
router.post('/:id/upload-fotos', upload.array('fotos', 10), ctrl.subirFotos);
router.delete('/:id/fotos', ctrl.eliminarFoto);

module.exports = router;
