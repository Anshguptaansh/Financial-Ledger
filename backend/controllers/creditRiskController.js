/**
 * Credit Risk Controller
 * Proxies requests to the FastAPI ML microservice (port 8000).
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.assess = async (req, res) => {
  try {
    const {
      age, sex, job, housing,
      saving_accounts, checking_account,
      credit_amount, duration, purpose,
    } = req.body;

    // Basic validation
    if (!age || !credit_amount || !duration) {
      return res.status(400).json({
        message: 'age, credit_amount, and duration are required.',
      });
    }

    // Forward to FastAPI /predict
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age:              Number(age),
        sex:              sex || 'male',
        job:              Number(job) || 0,
        housing:          housing || 'own',
        saving_accounts:  saving_accounts || 'little',
        checking_account: checking_account || 'little',
        credit_amount:    Number(credit_amount),
        duration:         Number(duration),
        purpose:          purpose || 'car',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        message: err.detail || 'ML service returned an error.',
      });
    }

    const prediction = await response.json();
    res.json(prediction);
  } catch (err) {
    // If the ML service is down, return a clear error
    if (err.cause?.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'ML service is unavailable. Ensure the FastAPI server is running on port 8000.',
      });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.modelInfo = async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/model-info`);
    if (!response.ok) {
      return res.status(response.status).json({ message: 'ML service error.' });
    }
    const info = await response.json();
    res.json(info);
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'ML service is unavailable.',
      });
    }
    res.status(500).json({ message: err.message });
  }
};
