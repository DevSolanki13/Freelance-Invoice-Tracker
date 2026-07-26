const Invoice = require('../models/Invoice')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

// Helper function to resolve dynamic status of a single invoice in-memory
const resolveOverdueStatus = (invoice) => {
  const doc = invoice.toObject ? invoice.toObject() : { ...invoice };
  const currentDate = new Date();
  if (doc.status !== 'Paid' && doc.status !== 'Overdue' && new Date(doc.dueDate) < currentDate) {
    doc.status = 'Overdue';
  }
  return doc;
};

const getAllInvoices = async (req, res) => {
  const userID = req.user.userID;
  const invoices = await Invoice.find({ createdBy: userID }).sort('createdAt');
  const resolvedInvoices = invoices.map(resolveOverdueStatus);
  res.status(StatusCodes.OK).json({ invoices: resolvedInvoices, count: resolvedInvoices.length });
}

const getInvoice = async (req, res) => {
  const {
    user: { userID },
    params: { id: invoiceId }
  } = req

  const invoice = await Invoice.findOne({
    _id: invoiceId,
    createdBy: userID
  })
  if (!invoice) {
    throw new NotFoundError(`No invoice with id ${invoiceId}`)
  }
  res.status(StatusCodes.OK).json({ invoice: resolveOverdueStatus(invoice) })
}

const createInvoice = async (req, res) => {
  req.body.createdBy = req.user.userID
  const invoice = await Invoice.create(req.body)
  res.status(StatusCodes.CREATED).json({ invoice })
}

const updateInvoice = async (req, res) => {
  const {
    body: { clientName, projectTitle, amount, dueDate, status, notes, currency },
    user: { userID },
    params: { id: invoiceId }
  } = req

  // Clean and filter the fields to prevent mass assignment parameter pollution
  const updateData = {};
  if (clientName !== undefined) updateData.clientName = clientName;
  if (projectTitle !== undefined) updateData.projectTitle = projectTitle;
  if (amount !== undefined) updateData.amount = amount;
  if (dueDate !== undefined) updateData.dueDate = dueDate;
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  if (currency !== undefined) updateData.currency = currency;

  const invoice = await Invoice.findOneAndUpdate(
    { _id: invoiceId, createdBy: userID },
    updateData,
    { new: true, runValidators: true }
  )
  if (!invoice) {
    throw new NotFoundError(`No invoice with id ${invoiceId}`)
  }
  res.status(StatusCodes.OK).json({ invoice: resolveOverdueStatus(invoice) })
}

const deleteInvoice = async (req, res) => {
  const {
    user: { userID },
    params: { id: invoiceId }
  } = req

  const invoice = await Invoice.findOneAndDelete({
    _id: invoiceId,
    createdBy: userID
  })
  if (!invoice) {
    throw new NotFoundError(`No invoice with id ${invoiceId}`)
  }
  res.status(StatusCodes.OK).send()
}

const getIncomeSummary = async (req, res) => {
  const userID = req.user.userID
  const currentDate = new Date()
  const targetCurrency = req.query.currency || 'INR'

  // Aggregate stats using MongoDB aggregate pipeline with dynamic overdue calculation
  const stats = await Invoice.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userID)
      }
    },
    {
      $project: {
        status: {
          $cond: {
            if: {
              $and: [
                { $ne: ['$status', 'Paid'] },
                { $ne: ['$status', 'Overdue'] },
                { $lt: ['$dueDate', currentDate] }
              ]
            },
            then: 'Overdue',
            else: '$status'
          }
        },
        amountInTargetCurrency: {
          $cond: {
            if: { $eq: [{ $ifNull: ['$currency', 'INR'] }, targetCurrency] },
            then: '$amount',
            else: {
              $cond: {
                if: { $eq: [targetCurrency, 'USD'] },
                then: { $divide: ['$amount', 97] },
                else: { $multiply: ['$amount', 97] }
              }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amountInTargetCurrency' }
      }
    }
  ])

  // Initialize summary response
  const summary = {
    totalEarnings: 0,    // 'Paid'
    pendingPayments: 0,  // 'Sent'
    overdueAmounts: 0    // 'Overdue'
  }

  stats.forEach((stat) => {
    if (stat._id === 'Paid') {
      summary.totalEarnings = stat.totalAmount
    } else if (stat._id === 'Sent') {
      summary.pendingPayments = stat.totalAmount
    } else if (stat._id === 'Overdue') {
      summary.overdueAmounts = stat.totalAmount
    }
  })

  res.status(StatusCodes.OK).json(summary)
}

module.exports = {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getIncomeSummary
}

