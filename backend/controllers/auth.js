const User = require('../models/User')
const Invoice = require('../models/Invoice')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError } = require('../errors')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')


const register = async (req, res) => {
    const user = await User.create({ ...req.body })
    const token = user.createJWT()
    res
        .status(StatusCodes.CREATED)
        .json({ user: { name: user.name }, token })
}

const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new BadRequestError('Please provide email and password')
    }
    const user = await User.findOne({ email })
    if (!user) {
        throw new UnauthenticatedError('Invalid Credentials')
    }
    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
        throw new UnauthenticatedError('Invalid Credentials')
    }
    const token = user.createJWT()
    res.status(StatusCodes.OK).json({ user: { name: user.name }, token })
}

const loginDemo = async (req, res) => {
    const timestamp = Date.now()
    const demoEmail = `demo_${timestamp}@freelancetracker.com`
    
    // Create a new guest user
    const demoUser = await User.create({
        name: 'Demo User',
        email: demoEmail,
        password: 'demo_password_123'
    })

    const clientNames = [
        "Acme Corp", "Globex Corporation", "Initech", "Umbrella Corp", 
        "Stark Industries", "Wayne Enterprises", "Hooli", "Soylent Corp", 
        "Wonka Industries", "Cyberdyne Systems", "Virtucon", "Gekko & Co", 
        "Oscorp", "Tyrell Corp", "Reynholm Industries", "Dunder Mifflin", 
        "Vandelay Industries", "Sterling Cooper"
    ]

    const projectTitles = [
        "Website Redesign", "Mobile App Development", "Marketing Campaign", 
        "SEO Optimization", "Logo Design", "UI/UX Consultation", 
        "Database Migration", "Cloud Setup", "E-commerce Integration", 
        "API Development", "Security Audit", "Copywriting Services", 
        "Social Media Strategy", "Photography Session", "Video Production", 
        "Technical Support", "Branding Guidelines", "Frontend Refactoring"
    ]

    const currencies = ['INR', 'USD']
    const statuses = ['Draft', 'Sent', 'Paid', 'Overdue']

    const invoicesToCreate = []

    for (let i = 0; i < 50; i++) {
        const clientName = clientNames[Math.floor(Math.random() * clientNames.length)]
        const projectTitle = projectTitles[Math.floor(Math.random() * projectTitles.length)]
        
        // Currencies: 70% INR, 30% USD
        const currency = Math.random() > 0.3 ? 'INR' : 'USD'
        const amount = currency === 'INR' 
            ? Math.floor(Math.random() * (150000 - 5000 + 1)) + 5000
            : Math.floor(Math.random() * (1500 - 50 + 1)) + 50

        // Statuses
        let status = statuses[Math.floor(Math.random() * statuses.length)]

        // Dates
        // Created date: up to 90 days in the past
        const daysAgo = Math.floor(Math.random() * 90)
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - daysAgo)

        // Due date: between -15 and 60 days offset from today
        const dueDaysOffset = Math.floor(Math.random() * 75) - 15
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + dueDaysOffset)

        // If due date is in the past and status is not Paid, it will resolve to Overdue in frontend.
        // Let's set some to 'Sent' and some to 'Draft'.
        if (dueDate < new Date() && status !== 'Paid') {
            status = Math.random() > 0.5 ? 'Sent' : 'Draft'
        }

        const notes = `Demo invoice #${i + 1} generated automatically. Use this to test the freelance invoicing dashboard!`

        invoicesToCreate.push({
            clientName,
            projectTitle,
            amount,
            dueDate,
            status,
            notes,
            currency,
            createdBy: demoUser._id,
            createdAt
        })
    }

    // Bulk insert the 50 invoices
    await Invoice.insertMany(invoicesToCreate)

    const token = demoUser.createJWT()

    res.status(StatusCodes.CREATED).json({
        user: { name: demoUser.name },
        token
    })
}

const loginGoogle = async (req, res) => {
    const { token } = req.body
    if (!token) {
        throw new BadRequestError('Please provide Google token')
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID is not configured on the server')
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    let ticket
    try {
        ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        })
    } catch (error) {
        throw new UnauthenticatedError('Invalid Google token')
    }

    const { name, email } = ticket.getPayload()
    if (!email) {
        throw new BadRequestError('Google login did not provide an email address')
    }

    // Find user or create if not exists
    let user = await User.findOne({ email })
    if (!user) {
        // Create user with a random secure password since they login with Google
        const randomPassword = Math.random().toString(36).slice(-12) + 'A1!'
        user = await User.create({
            name,
            email,
            password: randomPassword
        })
    }

    const appToken = user.createJWT()
    res.status(StatusCodes.OK).json({ user: { name: user.name }, token: appToken })
}

module.exports = {
    register,
    login,
    loginDemo,
    loginGoogle
}