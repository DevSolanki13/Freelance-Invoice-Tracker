require('dotenv').config();

// Validate critical environment variables at startup
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'JWT_LIFETIME'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`CRITICAL: Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
});

require('express-async-errors');
const express = require('express');
const app = express();

// extra security packages
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('express-rate-limit');


// connectDB
const connectDB = require('./db/connect')
const authenticateUser = require('./middleware/authentication')

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set('trust proxy', 1)
app.use(rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
}));
app.use(express.json());
app.use(helmet());
app.use(cors());

// Stricter rate limiter specifically for authentication endpoints
const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { msg: 'Too many authentication attempts, please try again after 15 minutes' }
});

// middlewares
const authRouter = require('./routes/auth')
const invoicesRouter = require('./routes/invoices')

// routes
app.use('/api/v1/auth', authRateLimiter, authRouter)
app.use('/api/v1/invoices', authenticateUser, invoicesRouter)

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);


const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
