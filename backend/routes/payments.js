const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getByLoan,
  getByCustomer,
  create,
} = require('../controllers/paymentController');

router.use(auth);

router.get('/loan/:loanId', getByLoan);
router.get('/customer/:customerId', getByCustomer);
router.post('/', create);

module.exports = router;
