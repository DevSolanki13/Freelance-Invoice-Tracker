const Joi = require('joi');
const { BadRequestError } = require('../errors');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Strip unregistered fields to protect against mass assignment
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      throw new BadRequestError(errorMessage);
    }

    req.body = value; // Replace body with parsed, validated, and stripped inputs
    next();
  };
};

// Authentication Schemas
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    'string.min': 'Name must be at least 3 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Invoice Schemas
const createInvoiceSchema = Joi.object({
  clientName: Joi.string().max(100).required().trim().messages({
    'string.max': 'Client name cannot be more than 100 characters',
    'any.required': 'Please provide client name'
  }),
  projectTitle: Joi.string().max(100).required().trim().messages({
    'string.max': 'Project title cannot be more than 100 characters',
    'any.required': 'Please provide project title'
  }),
  amount: Joi.number().min(0).required().messages({
    'number.min': 'Amount cannot be negative',
    'any.required': 'Please provide invoice amount'
  }),
  dueDate: Joi.date().required().messages({
    'any.required': 'Please provide due date'
  }),
  status: Joi.string().valid('Draft', 'Sent', 'Paid', 'Overdue').default('Draft').messages({
    'any.only': '{#value} is not a supported invoice status'
  }),
  notes: Joi.string().max(500).allow('').trim().messages({
    'string.max': 'Notes cannot be more than 500 characters'
  })
});

const updateInvoiceSchema = Joi.object({
  clientName: Joi.string().max(100).trim().messages({
    'string.max': 'Client name cannot be more than 100 characters'
  }),
  projectTitle: Joi.string().max(100).trim().messages({
    'string.max': 'Project title cannot be more than 100 characters'
  }),
  amount: Joi.number().min(0).messages({
    'number.min': 'Amount cannot be negative'
  }),
  dueDate: Joi.date(),
  status: Joi.string().valid('Draft', 'Sent', 'Paid', 'Overdue').messages({
    'any.only': '{#value} is not a supported invoice status'
  }),
  notes: Joi.string().max(500).allow('').trim().messages({
    'string.max': 'Notes cannot be more than 500 characters'
  })
});

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema,
  createInvoiceSchema,
  updateInvoiceSchema
};
