const connectDB = require('../_lib/db');
const createApp = require('../_lib/app');
const authRoutes = require('../../backend/routes/auth');

const app = createApp();
app.use('/api/auth', authRoutes);

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    return res.status(503).json({ message: err.message });
  }
  return app(req, res);
};
