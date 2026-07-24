const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  interestRate: {
    type: Number,
    required: true,
    default: 3,
    min: 0,
  },
  interestType: {
    type: String,
    enum: ['simple', 'compound'],
    default: 'simple',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);
