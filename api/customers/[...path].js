const connectDB = require('../_lib/db');
const createApp = require('../_lib/app');
const customerRoutes = require('../../backend/routes/customers');

const app = createApp();
app.use('/api/customers', customerRoutes);

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
