const connectDB = require('../_lib/db');
const createApp = require('../_lib/app');
const creditRiskRoutes = require('../../backend/routes/creditRisk');

const app = createApp();
app.use('/api/credit-risk', creditRiskRoutes);

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
