const router = require('express').Router();
const auth = require('../middleware/auth');
const { register, login, changePassword, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', auth, changePassword);
router.post('/reset-password', resetPassword);

module.exports = router;
