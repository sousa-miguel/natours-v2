// External modules
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// Internal modules
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

////////////////////////////////////
// GLOBAL MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // HTTP request logger
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // allow 100 requests from same IP per hour
  message: 'Too many requests from this IP, please try again in an hour!',
});

// Limit number of requests per IP / hour
app.use('/api', limiter);

app.use(express.json()); //  a function to modify incoming request data
app.use(express.static(`${__dirname}/public`)); // serving static files

// app.use((req, res, next) => {
//   console.log('I came from the middleware 🍓');
//   next(); // continue the response cycle
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

////////////////////////////////////
// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// if we are able to reach this point it means the url is invalid
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
