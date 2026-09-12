const router = require('express').Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const ctrl = require('../controllers/usuariosController');

// Todo el módulo de usuarios es solo para administradores.
router.use(auth, adminOnly);

router.get('/', ctrl.listar);
router.post('/', ctrl.crear);
router.get('/:id', ctrl.obtener);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
