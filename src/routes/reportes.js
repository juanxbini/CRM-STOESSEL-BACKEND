const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/reportesController');

router.use(auth);

router.get('/dashboard', ctrl.dashboard);
router.get('/ventas', ctrl.ventas);
router.get('/comisiones', ctrl.comisiones);
router.get('/por-zona', ctrl.porZona);

module.exports = router;
