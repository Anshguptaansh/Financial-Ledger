const connectDB = require('../_lib/db');
const createApp = require('../_lib/app');
const reportRoutes = require('../../backend/routes/reports');

const app = createApp();
app.use('/api/reports', reportRoutes);

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
