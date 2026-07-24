const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  note: {
    type: String,
    trim: true,
    default: '',
  },
  accountNumber: {
    type: String,
    trim: true,
    default: '',
  },
  interestRate: {
    type: Number,
    default: 3,
    min: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
