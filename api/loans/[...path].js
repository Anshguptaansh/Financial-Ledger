const connectDB = require('../_lib/db');
const createApp = require('../_lib/app');
const loanRoutes = require('../../backend/routes/loans');

const app = createApp();
app.use('/api/loans', loanRoutes);

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
