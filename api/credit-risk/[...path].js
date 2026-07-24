const connectDB = require('../_lib/db');
const createApp = require('../_lib/app');
const creditRiskRoutes = require('../../backend/routes/creditRisk');

const app = createApp();
app.use('/api/credit-risk', creditRiskRoutes);

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    return res.status(503).json({ message: err.message });
  }
  return app(req, res);
};
