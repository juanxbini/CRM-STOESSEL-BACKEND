const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/interaccionesController');

router.use(auth);

router.get('/', ctrl.listar);
router.post('/', ctrl.crear);
router.get('/:id', ctrl.obtener);

module.exports = router;
