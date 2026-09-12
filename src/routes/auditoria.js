const router = require('express').Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const ctrl = require('../controllers/auditoriaController');

router.use(auth, adminOnly);

router.get('/', ctrl.listar);

module.exports = router;
