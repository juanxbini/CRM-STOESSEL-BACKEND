const router = require('express').Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const ctrl = require('../controllers/propietariosController');

router.use(auth);

router.get('/', ctrl.listar);
router.post('/', ctrl.crear);
router.get('/:id', ctrl.obtener);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', adminOnly, ctrl.eliminar);

module.exports = router;
