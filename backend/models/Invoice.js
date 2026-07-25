const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Please provide client name'],
    trim: true,
    maxlength: [100, 'Client name cannot be more than 100 characters']
  },
  projectTitle: {
    type: String,
    required: [true, 'Please provide project title'],
    trim: true,
    maxlength: [100, 'Project title cannot be more than 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide invoice amount'],
    min: [0, 'Amount cannot be negative']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide due date']
  },
  status: {
    type: String,
    enum: {
      values: ['Draft', 'Sent', 'Paid', 'Overdue'],
      message: '{VALUE} is not a supported invoice status'
    },
    default: 'Draft'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user']
  }
}, { timestamps: true });

// Compound index for listing invoices ordered by date
InvoiceSchema.index({ createdBy: 1, createdAt: -1 });

// Index for query filtering and aggregation
InvoiceSchema.index({ createdBy: 1, status: 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);


