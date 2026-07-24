const connectDB = require('./_lib/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
