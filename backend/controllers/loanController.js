const Loan = require('../models/Loan');
const Payment = require('../models/Payment');

// Calculate interest for a loan
function calculateInterest(loan) {
  const now = new Date();
  const loanDate = new Date(loan.date);
  const diffMs = now - loanDate;
  const months = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 30.44)); // average days per month

  let interest = 0;
  const rate = loan.interestRate;
  const amount = loan.amount;

  if (loan.interestType === 'simple') {
    interest = amount * rate * months / 100;
  } else {
    // compound monthly
    interest = amount * (Math.pow(1 + rate / 100, months) - 1);
  }

  return {
    months: Math.round(months * 100) / 100,
    interest: Math.round(interest * 100) / 100,
    totalPayable: Math.round((amount + interest) * 100) / 100,
  };
}

exports.getByCustomer = async (req, res) => {
  try {
    const loans = await Loan.find({ customerId: req.params.customerId }).sort({ date: -1 });

    const loansWithInterest = await Promise.all(
      loans.map(async (loan) => {
        const interestData = calculateInterest(loan);
        const payments = await Payment.find({ loanId: loan._id });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        return {
          ...loan.toObject(),
          ...interestData,
          totalPaid,
          remainingBalance: Math.round((interestData.totalPayable - totalPaid) * 100) / 100,
        };
      })
    );

    res.json(loansWithInterest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerId');
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const interestData = calculateInterest(loan);
    const payments = await Payment.find({ loanId: loan._id }).sort({ date: -1 });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      ...loan.toObject(),
      ...interestData,
      totalPaid,
      remainingBalance: Math.round((interestData.totalPayable - totalPaid) * 100) / 100,
      payments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { customerId, amount, interestRate, interestType, date } = req.body;
    if (!customerId || !amount) {
      return res.status(400).json({ message: 'Customer ID and amount are required.' });
    }

    const loan = new Loan({
      customerId,
      amount,
      interestRate: interestRate || 3,
      interestType: interestType || 'simple',
      date: date || new Date(),
    });

    await loan.save();
    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.closeLoan = async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    );
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.calculateInterest = calculateInterest;
