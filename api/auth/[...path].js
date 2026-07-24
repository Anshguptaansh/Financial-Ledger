const connectDB = require('../_lib/db');
const createApp = require('../_lib/app');
const authRoutes = require('../../backend/routes/auth');

const app = createApp();
app.use('/api/auth', authRoutes);

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
