const creditRiskController = require('../controllers/creditRiskController');
const router = require('express').Router();

// POST /api/credit-risk — proxy to FastAPI ML service
router.post('/', creditRiskController.assess);

// GET /api/credit-risk/model-info — get model metadata
router.get('/model-info', creditRiskController.modelInfo);

module.exports = router;
