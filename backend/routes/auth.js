const express = require('express')
const router = express.Router()

const { register, login, loginDemo } = require('../controllers/auth')
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validation')

router.post('/register', validateRequest(registerSchema), register)
router.post('/login', validateRequest(loginSchema), login)
router.post('/demo', loginDemo)

module.exports = router 