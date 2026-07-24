const connectDB = require('../_lib/db');
const createApp = require('../_lib/app');
const paymentRoutes = require('../../backend/routes/payments');

const app = createApp();
app.use('/api/payments', paymentRoutes);

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
