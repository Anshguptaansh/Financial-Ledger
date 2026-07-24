const PDFDocument = require('pdfkit');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const { calculateInterest } = require('./loanController');

exports.dashboard = async (req, res) => {
  try {
    const customers = await Customer.find();
    const loans = await Loan.find({ status: 'active' });
    const allPayments = await Payment.find();

    let totalGiven = 0;
    let totalInterest = 0;
    let totalPayable = 0;
    let totalPaid = 0;

    for (const loan of loans) {
      const interestData = calculateInterest(loan);
      totalGiven += loan.amount;
      totalInterest += interestData.interest;
      totalPayable += interestData.totalPayable;
    }

    totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      totalCustomers: customers.length,
      totalGiven: Math.round(totalGiven * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayable: Math.round(totalPayable * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalPending: Math.round((totalPayable - totalPaid) * 100) / 100,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.monthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const customers = await Customer.find();
    const loans = await Loan.find({ status: 'active' });

    const thisMonthPayments = await Payment.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate('customerId loanId');

    const report = [];

    for (const customer of customers) {
      const customerLoans = loans.filter(
        (l) => l.customerId.toString() === customer._id.toString()
      );

      let totalAmount = 0;
      let totalInterest = 0;
      let totalPayable = 0;

      for (const loan of customerLoans) {
        const interestData = calculateInterest(loan);
        totalAmount += loan.amount;
        totalInterest += interestData.interest;
        totalPayable += interestData.totalPayable;
      }

      const customerPayments = await Payment.find({ customerId: customer._id });
      const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);

      const thisMonthPaid = thisMonthPayments
        .filter((p) => p.customerId && p.customerId._id.toString() === customer._id.toString())
        .reduce((sum, p) => sum + p.amount, 0);

      if (customerLoans.length > 0) {
        report.push({
          name: customer.name,
          phone: customer.phone,
          totalAmount: Math.round(totalAmount * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
          totalPayable: Math.round(totalPayable * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          thisMonthPaid: Math.round(thisMonthPaid * 100) / 100,
          pending: Math.round((totalPayable - totalPaid) * 100) / 100,
        });
      }
    }

    res.json({
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      report,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateBillPDF = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.loanId).populate('customerId');
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });

    const interestData = calculateInterest(loan);
    const payments = await Payment.find({ loanId: loan._id }).sort({ date: 1 });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.round((interestData.totalPayable - totalPaid) * 100) / 100;
    const customer = loan.customerId;

    const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const invoiceNo = `INV-${loan._id.toString().slice(-8).toUpperCase()}`;
    const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const loanDate = new Date(loan.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const doc = new PDFDocument({ size: 'A4', margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${customer.name.replace(/\s/g, '_')}_${invoiceNo}.pdf`);
    doc.pipe(res);

    const W = 595.28; // A4 width
    const M = 50; // margin
    const CW = W - M * 2; // content width

    // ── COLORS ──
    const PRIMARY   = '#1e40af'; // deep blue
    const PRIMARY_L = '#3b82f6'; // lighter blue
    const DARK      = '#111827';
    const GRAY      = '#6b7280';
    const LIGHT_BG  = '#f3f4f6';
    const WHITE     = '#ffffff';
    const GREEN     = '#059669';
    const RED       = '#dc2626';

    // ════════════════════════════════════════════════════════════
    // HEADER BANNER
    // ════════════════════════════════════════════════════════════
    doc.rect(0, 0, W, 120).fill(PRIMARY);

    // Company name
    doc.font('Helvetica-Bold').fontSize(26).fillColor(WHITE);
    doc.text('FINANCE TRACKER', M, 30, { width: CW / 2 });
    doc.font('Helvetica').fontSize(9).fillColor('#93c5fd');
    doc.text('Lending Management System', M, 60);

    // Invoice title
    doc.font('Helvetica-Bold').fontSize(32).fillColor(WHITE);
    doc.text('INVOICE', M + CW / 2, 25, { width: CW / 2, align: 'right' });

    // Invoice meta
    doc.font('Helvetica').fontSize(9).fillColor('#93c5fd');
    doc.text(`Invoice No: ${invoiceNo}`, M + CW / 2, 65, { width: CW / 2, align: 'right' });
    doc.text(`Date: ${invoiceDate}`, M + CW / 2, 78, { width: CW / 2, align: 'right' });
    doc.text(`Status: ${loan.status.toUpperCase()}`, M + CW / 2, 91, { width: CW / 2, align: 'right' });

    // ════════════════════════════════════════════════════════════
    // CUSTOMER & LOAN INFO BOXES
    // ════════════════════════════════════════════════════════════
    let Y = 140;

    // Bill To box
    doc.roundedRect(M, Y, CW / 2 - 10, 100, 6).fill(LIGHT_BG);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(PRIMARY).text('BILL TO', M + 15, Y + 12);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK).text(customer.name, M + 15, Y + 28, { width: CW / 2 - 40 });
    doc.font('Helvetica').fontSize(9).fillColor(GRAY);
    let infoY = Y + 46;
    if (customer.phone) { doc.text(`Phone: ${customer.phone}`, M + 15, infoY); infoY += 13; }
    if (customer.address) { doc.text(`Address: ${customer.address}`, M + 15, infoY); infoY += 13; }
    if (customer.accountNumber) { doc.text(`A/C No: ${customer.accountNumber}`, M + 15, infoY); }

    // Loan Details box
    const rx = M + CW / 2 + 10;
    doc.roundedRect(rx, Y, CW / 2 - 10, 100, 6).fill(LIGHT_BG);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(PRIMARY).text('LOAN DETAILS', rx + 15, Y + 12);
    doc.font('Helvetica').fontSize(9).fillColor(DARK);
    doc.text(`Amount:  Rs ${fmt(loan.amount)}`, rx + 15, Y + 30);
    doc.text(`Rate:  ${loan.interestRate}% per month`, rx + 15, Y + 44);
    doc.text(`Type:  ${loan.interestType === 'simple' ? 'Simple Interest' : 'Compound (Monthly)'}`, rx + 15, Y + 58);
    doc.text(`Loan Date:  ${loanDate}`, rx + 15, Y + 72);
    doc.text(`Duration:  ${interestData.months} months`, rx + 15, Y + 86);

    // ════════════════════════════════════════════════════════════
    // CALCULATION TABLE
    // ════════════════════════════════════════════════════════════
    Y = 265;

    // Table header
    doc.roundedRect(M, Y, CW, 30, 4).fill(PRIMARY);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE);
    doc.text('DESCRIPTION', M + 15, Y + 9);
    doc.text('AMOUNT (Rs)', M + CW - 150, Y + 9, { width: 135, align: 'right' });

    // Table rows
    const rows = [
      ['Principal Amount', fmt(loan.amount)],
      [`Interest (${loan.interestRate}% × ${interestData.months} months, ${loan.interestType})`, fmt(interestData.interest)],
      ['Gross Total Payable', fmt(interestData.totalPayable)],
      ['Total Payments Received', `- ${fmt(totalPaid)}`],
    ];

    let rowY = Y + 30;
    rows.forEach((row, i) => {
      const bg = i % 2 === 0 ? LIGHT_BG : WHITE;
      doc.rect(M, rowY, CW, 28).fill(bg);
      doc.font('Helvetica').fontSize(10).fillColor(DARK);
      doc.text(row[0], M + 15, rowY + 8);
      doc.font('Helvetica-Bold').fillColor(i === 3 ? GREEN : DARK);
      doc.text(row[1], M + CW - 150, rowY + 8, { width: 135, align: 'right' });
      rowY += 28;
    });

    // Bottom border line
    doc.rect(M, rowY, CW, 1).fill('#d1d5db');

    // ── BALANCE DUE BOX ──
    rowY += 10;
    const balColor = remaining <= 0 ? GREEN : RED;
    doc.roundedRect(M + CW / 2, rowY, CW / 2, 50, 6).fill(balColor);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE);
    doc.text(remaining <= 0 ? 'FULLY PAID' : 'BALANCE DUE', M + CW / 2 + 15, rowY + 8);
    doc.font('Helvetica-Bold').fontSize(22).fillColor(WHITE);
    doc.text(`Rs ${fmt(Math.abs(remaining))}`, M + CW / 2 + 15, rowY + 22, { width: CW / 2 - 30, align: 'right' });

    // ════════════════════════════════════════════════════════════
    // PAYMENT HISTORY TABLE
    // ════════════════════════════════════════════════════════════
    if (payments.length > 0) {
      rowY += 75;
      doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK);
      doc.text('PAYMENT HISTORY', M, rowY);
      rowY += 20;

      // Header
      doc.roundedRect(M, rowY, CW, 25, 3).fill(PRIMARY_L);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE);
      doc.text('#', M + 12, rowY + 7, { width: 25 });
      doc.text('DATE', M + 45, rowY + 7, { width: 100 });
      doc.text('NOTE', M + 165, rowY + 7, { width: 200 });
      doc.text('AMOUNT (Rs)', M + CW - 130, rowY + 7, { width: 115, align: 'right' });
      rowY += 25;

      payments.forEach((p, i) => {
        if (rowY > 750) {
          doc.addPage();
          rowY = 50;
        }
        const bg = i % 2 === 0 ? WHITE : LIGHT_BG;
        doc.rect(M, rowY, CW, 22).fill(bg);
        doc.font('Helvetica').fontSize(9).fillColor(DARK);
        doc.text(`${i + 1}`, M + 12, rowY + 6, { width: 25 });
        doc.text(new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), M + 45, rowY + 6, { width: 100 });
        doc.fillColor(GRAY).text(p.note || '—', M + 165, rowY + 6, { width: 200 });
        doc.font('Helvetica-Bold').fillColor(GREEN);
        doc.text(fmt(p.amount), M + CW - 130, rowY + 6, { width: 115, align: 'right' });
        rowY += 22;
      });

      // Total row
      doc.rect(M, rowY, CW, 1).fill('#d1d5db');
      rowY += 5;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK);
      doc.text('Total Paid', M + 15, rowY);
      doc.fillColor(GREEN).text(`Rs ${fmt(totalPaid)}`, M + CW - 130, rowY, { width: 115, align: 'right' });
    }

    // ════════════════════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════════════════════
    const footerY = 780;
    doc.rect(0, footerY, W, 62).fill(LIGHT_BG);
    doc.font('Helvetica').fontSize(7).fillColor(GRAY);
    doc.text('This is a computer-generated invoice. Interest is calculated from the loan date to the current date.', M, footerY + 12, { width: CW, align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')} | Finance Tracker`, M, footerY + 25, { width: CW, align: 'center' });

    // Accent line above footer
    doc.rect(0, footerY - 3, W, 3).fill(PRIMARY);

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Export all data as JSON for backup
exports.exportData = async (req, res) => {
  try {
    const customers = await Customer.find();
    const loans = await Loan.find();
    const payments = await Payment.find();

    res.json({
      exportDate: new Date().toISOString(),
      customers,
      loans,
      payments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Import JSON backup
exports.importData = async (req, res) => {
  try {
    const { customers, loans, payments } = req.body;

    if (!customers || !loans || !payments) {
      return res.status(400).json({ message: 'Invalid backup format.' });
    }

    // Clear existing data
    await Customer.deleteMany({});
    await Loan.deleteMany({});
    await Payment.deleteMany({});

    // Insert backup data
    if (customers.length) await Customer.insertMany(customers);
    if (loans.length) await Loan.insertMany(loans);
    if (payments.length) await Payment.insertMany(payments);

    res.json({ message: 'Data restored successfully.', counts: { customers: customers.length, loans: loans.length, payments: payments.length } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
