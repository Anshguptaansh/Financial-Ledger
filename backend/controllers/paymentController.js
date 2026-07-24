const Payment = require('../models/Payment');
const Loan = require('../models/Loan');

exports.getByLoan = async (req, res) => {
  try {
    const payments = await Payment.find({ loanId: req.params.loanId }).sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getByCustomer = async (req, res) => {
  try {
    const payments = await Payment.find({ customerId: req.params.customerId })
      .populate('loanId')
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { loanId, amount, date, note } = req.body;
    if (!loanId || !amount) {
      return res.status(400).json({ message: 'Loan ID and amount are required.' });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const payment = new Payment({
      loanId,
      customerId: loan.customerId,
      amount,
      date: date || new Date(),
      note: note || '',
    });

    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
