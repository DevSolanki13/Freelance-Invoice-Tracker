const express = require('express')
const router = express.Router()

const {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getIncomeSummary
} = require('../controllers/invoices')
const { validateRequest, createInvoiceSchema, updateInvoiceSchema } = require('../middleware/validation')

router.route('/').post(validateRequest(createInvoiceSchema), createInvoice).get(getAllInvoices)
router.route('/summary').get(getIncomeSummary)
router.route('/:id').get(getInvoice).patch(validateRequest(updateInvoiceSchema), updateInvoice).delete(deleteInvoice)

module.exports = router

