const connectDB = require('../_lib/db');
const createApp = require('../_lib/app');
const customerRoutes = require('../../backend/routes/customers');

const app = createApp();
app.use(['/api/customers', '/'], customerRoutes);

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    return res.status(503).json({ message: err.message });
  }
  return app(req, res);
};
