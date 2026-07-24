const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getByCustomer,
  getById,
  create,
  closeLoan,
} = require('../controllers/loanController');

router.use(auth);

router.get('/customer/:customerId', getByCustomer);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id/close', closeLoan);

module.exports = router;
