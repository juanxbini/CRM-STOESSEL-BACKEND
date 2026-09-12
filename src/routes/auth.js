const router = require('express').Router();
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const ctrl = require('../controllers/authController');

router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/register', auth, adminOnly, ctrl.register);
router.get('/me', auth, ctrl.me);
router.put('/me', auth, ctrl.actualizarPerfil);
router.put('/me/password', auth, ctrl.cambiarPassword);
router.post('/logout', auth, ctrl.logout);

module.exports = router;
