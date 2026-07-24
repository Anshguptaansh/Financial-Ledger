const router = require('express').Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const {
  dashboard,
  monthlyReport,
  generateBillPDF,
  exportData,
  importData,
} = require('../controllers/reportController');

// Middleware to support token via query param (for PDF downloads opened in new tab)
function authOrQuery(req, res, next) {
  if (req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid token.' });
    }
  }
  return auth(req, res, next);
}

// Bill route uses its own auth (supports token via query param for browser downloads)
router.get('/bill/:loanId', authOrQuery, generateBillPDF);

// All other routes use standard Bearer token auth
router.use(auth);

router.get('/dashboard', dashboard);
router.get('/monthly', monthlyReport);
router.get('/export', exportData);
router.post('/import', importData);

module.exports = router;
