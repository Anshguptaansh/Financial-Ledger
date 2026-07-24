const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');

exports.getAll = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, address, note, accountNumber, interestRate } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required.' });

    const customer = new Customer({ name, phone, address, note, accountNumber, interestRate });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    // Also delete related loans and payments
    const loans = await Loan.find({ customerId: req.params.id });
    const loanIds = loans.map((l) => l._id);
    await Loan.deleteMany({ customerId: req.params.id });
    await Payment.deleteMany({ loanId: { $in: loanIds } });

    res.json({ message: 'Customer and related data deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
