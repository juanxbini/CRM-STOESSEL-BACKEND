const router = require('express').Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const ctrl = require('../controllers/configuracionController');

router.get('/', auth, ctrl.obtener);
router.put('/', auth, adminOnly, ctrl.actualizar);

module.exports = router;
