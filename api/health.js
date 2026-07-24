const connectDB = require('./_lib/db');

module.exports = async (req, res) => {
  if (!process.env.MONGO_URI) {
    return res.status(200).json({
      status: 'warning',
      message: 'App deployed successfully! MONGO_URI is not set in Vercel Environment Variables.',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await connectDB();
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
